# Plan détaillé — Loop Engineering Todo App v2

## 1. Pourquoi pas Hermes

Hermes Agent (Nous Research) est un agent **mono-utilisateur** avec auto-apprentissage
de skills. Son "loop engineering" est un mécanisme d'auto-amélioration des skills de
l'agent, **pas** un workflow multi-agent PO→Dev→LeadDev. Pour notre cas (3 rôles isolés
qui interagissent via GitHub), OpenHands est adapté car :

- Support natif multi-agent avec workspaces isolés (Docker volumes séparés)
- Plugin `pr-review` GitHub Actions documenté (source : docs.openhands.dev)
- Endpoint LLM OpenAI-compatible (`base_url` configurable → Ollama Cloud)
- Automations event-driven (issues.labeled, pull_request.opened)
- Config par agent via `config.toml` (`[agent.PoAgent] llm_config = "po"`)

Sources :
- https://docs.openhands.dev/openhands/usage/llms/local-llms (custom endpoint OpenAI-compatible)
- https://docs.openhands.dev/openhands/usage/llms/custom-llm-configs (profils nommés)
- https://docs.openhands.dev/openhands/usage/use-cases/code-review (plugin pr-review)

## 2. Architecture du projet (sous-projet)

Le todo est un **sous-projet** du repo `ai-team`, situé dans `apps/todo/`.

```
/Users/yohannravino/Factory/ai-team-cuba/
│
├── .agent/tasks/loop-engineering-todo-app-v2/    # Plan v2 + suivi
│
├── apps/
│   └── todo/
│       ├── .github/
│       │   └── workflows/
│       │       ├── ci.yml                    # Lint + typecheck + test
│       │       └── deploy.yml                # Deploy Netlify
│       │
│       ├── app/
│       │   ├── api/
│       │   │   └── tasks/
│       │   │       ├── route.ts              # GET + POST
│       │   │       └── [id]/
│       │   │           └── route.ts          # GET, PATCH, DELETE
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       │
│       ├── components/
│       │   ├── ui/
│       │   ├── TaskList.tsx
│       │   ├── TaskForm.tsx
│       │   ├── TaskItem.tsx
│       │   └── Filters.tsx
│       │
│       ├── lib/
│       │   ├── db/
│       │   │   ├── client.ts                 # Better-SQLite3 (pas Turso)
│       │   │   ├── schema.ts                 # Drizzle schema
│       │   │   └── migrations/
│       │   ├── hooks/
│       │   │   └── useTasks.ts
│       │   └── validators.ts                 # Zod schemas
│       │
│       ├── __tests__/
│       │   ├── api/
│       │   │   └── tasks.test.ts             # Tests intégration API
│       │   ├── components/
│       │   │   ├── TaskList.test.tsx
│       │   │   └── TaskForm.test.tsx
│       │   └── mocks/
│       │       └── server.ts                 # MSW
│       │
│       ├── vitest.config.ts
│       ├── netlify.toml
│       ├── drizzle.config.ts
│       ├── next.config.js
│       ├── package.json
│       ├── .env.example
│       └── README.md
│
└── README.md (root ai-team)
```

## 3. Base de données (SQLite local — Better-SQLite3)

### Schéma Drizzle

```ts
// lib/db/schema.ts
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').default(''),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  dueDate: text('due_date'),
  category: text('category').default('general'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

### Client SQLite local

```ts
// lib/db/client.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const sqlite = new Database('todo.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite);
```

## 4. API Route Handlers

```ts
// app/api/tasks/route.ts
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { taskInsertSchema } from '@/lib/validators';

export async function GET() {
  const allTasks = db.select().from(tasks).all();
  return Response.json(allTasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = taskInsertSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.format() }, { status: 400 });
  }

  const inserted = db.insert(tasks).values(parsed.data).returning();
  return Response.json(inserted[0], { status: 201 });
}
```

## 5. Tests TDD (unit + intégration)

### Vitest config

```ts
// vitest.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text', 'html'],
    },
  },
  resolve: {
    alias: { '@': './' },
  },
});
```

### Test API (intégration avec DB in-memory)

```ts
// __tests__/api/tasks.test.ts
import { describe, expect, test, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { tasks } from '@/lib/db/schema';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.exec('CREATE TABLE tasks (...)');
  return drizzle(sqlite);
}

describe('GET /api/tasks', () => {
  test('returns 200 with an array', async () => {
    // ... test avec DB in-memory
  });
});
```

## 6. OpenHands — Configuration (config.toml)

```toml
# Default LLM configuration
[llm]
api_key = "${OLLAMA_CLOUD_API_KEY}"
base_url = "https://ollama.com/api/v1"

# Profil PO
[llm.po]
model = "openai/glm-5.2"
temperature = 0.4
max_tokens = 8192

# Profil Dev
[llm.dev]
model = "openai/kimi-k2.7-code"
temperature = 0.2
max_tokens = 16384

# Profil Lead-Review
[llm.leaddev]
model = "openai/qwen3.5:397b"
temperature = 0.1
max_tokens = 8192

# Agents
[agent.PoAgent]
llm_config = "po"

[agent.DevAgent]
llm_config = "dev"

[agent.LeadReviewAgent]
llm_config = "leaddev"
```

## 7. docker-compose.yml (carapace)

```yaml
services:
  openhands-runtime:
    image: ghcr.io/opendevin/openhands:latest
    ports: ["3000:3000"]
    volumes:
      - ./config:/app/config
      - workspace-po:/app/workspaces/po
      - workspace-dev:/app/workspaces/dev
      - workspace-review:/app/workspaces/review
    environment:
      - OLLAMA_CLOUD_API_KEY=${OLLAMA_CLOUD_API_KEY}
      - GITHUB_APP_PRIVATE_KEY=${GITHUB_APP_PRIVATE_KEY}
      - GITHUB_APP_ID=${GITHUB_APP_ID}
    networks: [openhands-net]

  webhook-adapter:
    image: node:20-slim
    volumes: ["./webhook-adapter:/app"]
    working_dir: /app
    command: node adapter.js
    ports: ["8080:8080"]
    environment:
      - OPENHANDS_URL=http://openhands-runtime:3000
      - GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
    networks: [openhands-net]
    depends_on: [openhands-runtime]

volumes:
  workspace-po:
  workspace-dev:
  workspace-review:

networks:
  openhands-net:
    driver: bridge
```

## 8. CI/CD (dans apps/todo/)

### CI — `apps/todo/.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
    branches: [main]
    paths:
      - 'apps/todo/**'
      - '!**.md'
  push:
    branches: [main]
    paths:
      - 'apps/todo/**'

jobs:
  quality:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/todo
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test -- --coverage
```

### CD — `apps/todo/.github/workflows/deploy.yml`

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
    paths:
      - 'apps/todo/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd apps/todo && npm ci && npm run build
      - uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: apps/todo/.next
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### `apps/todo/netlify.toml`

```toml
[build]
  base = "apps/todo"
  command = "npm run build"
  publish = "apps/todo/.next"

[build.environment]
  NODE_VERSION = "20"
```

## 9. GitHub Project V2 — Kanban

```
Backlog → Spec Ready → In Progress → In Review → Done
```

### Transitions automatiques

| Événement | Transition |
|---|---|
| Issue créée | → Backlog |
| PO spec commit + comment | → Spec Ready |
| Label "ready-for-dev" ajouté | → In Progress |
| PR ouverte | → In Review |
| PR approved + merged | → Done |
| PR changes requested | → In Progress |

### Workflow GitHub Actions (Kanban auto)

```yaml
# .github/workflows/kanban.yml
name: Kanban Automation
on:
  issues:
    types: [labeled, milestoned]
  pull_request:
    types: [opened, closed]

jobs:
  move:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // GraphQL Project V2 mutation
            // Déplacer l'item vers la colonne correspondante
```

## 10. Phases d'implémentation

### Phase 0 — Préparation (opérateur)
- Vérifier/créer repo GitHub `ai-team`
- Créer GitHub Project V2 Kanban dans `ai-team`
- Créer GitHub App `ai-team-loop` et l'installer sur `ai-team`
- Configurer les secrets GitHub (OLLAMA_CLOUD_API_KEY, GITHUB_APP_PRIVATE_KEY, NETLIFY)
- Initialiser Git dans `/Users/yohannravino/Factory/ai-team-cuba/` et committer le plan

### Phase 1 — Infrastructure OpenHands (carapace)
- SSH carapace → créer dossier `/opt/ai-team-loop/`
- Installer Docker + Docker Compose si manquant
- Déployer OpenHands runtime + webhook-adapter
- Configurer les 3 profils LLM (glm-5.2, kimi-k2.7-code, qwen3.5:397b)
- Configurer les 3 workspaces Docker isolés (po/, dev/, review/)
- Tester connectivité : prompt simple sur chaque profil

### Phase 2 — Projet Todo Next.js (scaffold minimal par opérateur)
- Créer dossier `apps/todo/` + package.json
- Scaffold Next.js + TypeScript + Tailwind dans `apps/todo/`
- Configurer Vitest + React Testing Library + MSW
- Configurer Drizzle ORM + Better-SQLite3
- Écrire le schéma Drizzle + migration initiale
- Configurer CI GitHub Actions (lint + typecheck + test)
- Configurer CD Netlify + `apps/todo/netlify.toml`
- Vérifier build local et tests passent

### Phase 3 — Automations OpenHands (par les agents eux-mêmes)
- L'opérateur crée l'issue initiale "Todolist API-first TDD" avec les instructions
- Le PO-bot analyse et génère les 5 user stories
- Le Dev-bot implémente avec TDD et ouvre les PRs
- Le Lead-Review-bot review et approuve/refuse
- L'opérateur vérifie et corrige les agents si besoin

### Phase 4 — Tests du workflow
- Issue #1 : cycle complet PO → Dev → Review → Merge → Deploy
- Itérer sur les prompts système selon la qualité observée
- Documenter les observations dans `insights.md`

## 11. Coûts

| Poste | Coût |
|---|---|
| Ollama Cloud Pro | $20/mois (3 modèles simultanés) |
| VPS Contabo carapace | $0 (existant) |
| GitHub App + Actions | $0 (tier gratuit) |
| Netlify | $0 (tier gratuit) |
| **Total** | **$20/mois** |

## 12. Risques et mitigations

| Risque | Mitigation |
|---|---|
| `qwen3.5:397b` coûteux (235B) | Limiter le contexte du diff à review (pas tout le repo) |
| OpenHands webhook non natif | Adapter Node.js minimal (webhook-adapter) |
| `kimi-k2.7-code` inférieur en review | Prompt système détaillé + check-list structurée |
| Concurrency Ollama Cloud (3 modèles max) | 3 rôles = 3 modèles → au max, séquencer si besoin |
| Netlify + Next.js API routes + SQLite | SQLite ne marche pas en serverless → utiliser Turso en prod OU API routes sans DB persistante |
| Agents ne respectent pas le TDD | Lead-Review-bot vérifie la présence de tests avant le code |

## 13. Note sur le déploiement Netlify + SQLite

SQLite local ne se déploie pas sur Netlify (serverless, pas de FS persistant).
Pour le pilote, on garde SQLite en local/dev, et en prod Netlify soit :
- (a) On déploie seulement le front sans les API routes (demo UI), ou
- (b) On bascule vers Turso pour la prod Netlify (compte Turso existant via Guardian-Portal).

Recommandation : **(b) Turso en prod** — SQLite-compatible, migration triviale.