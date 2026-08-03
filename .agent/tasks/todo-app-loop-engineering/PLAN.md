# Plan détaillé — Loop Engineering Todo App

## 1. Vue d'ensemble

Mettre en place un workflow **loop engineering** avec 3 bots IA Hermes qui collaborent
via GitHub Issues + Pull Requests pour développer une application Todo Next.js (API First + TDD).

**Orchestrateur** : Hermes Agent (MIT, Nous Research) — pas OpenHands.
**Kanban** : GitHub Issues + GitHub Project V2 (pas Hermes Kanban).
**LLMs** : Ollama Cloud uniquement (pas hydre-llm, pas Claude/GPT).
**DB** : SQLite (better-sqlite3 + Drizzle) — pas Turso.

## 2. Architecture du sous-projet

Le todo app est un **sous-projet** de `/Users/yohannravino/Factory/ai-team/`.

```
ai-team/
├── .agent/tasks/todo-app-loop-engineering/   # Plan + suivi (pattern Merenza)
├── .agent/ARCHITECTURE.md                    # Architecture loop engineering
│
├── todo-app/                                 # Sous-projet Next.js
│   ├── .github/
│   │   ├── workflows/ci.yml                 # CI: lint + typecheck + test
│   │   ├── ISSUE_TEMPLATE/user-story.yml    # Template PO
│   │   └── PULL_REQUEST_TEMPLATE.md         # Template PR
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                      # Page principale (SSR)
│   │   │   ├── globals.css
│   │   │   └── api/
│   │   │       └── todos/
│   │   │           ├── route.ts              # GET (list) + POST (create)
│   │   │           └── [id]/
│   │   │               └── route.ts          # GET, PATCH, DELETE
│   │   │
│   │   ├── lib/
│   │   │   ├── db.ts                         # better-sqlite3 client
│   │   │   ├── schema.ts                     # Drizzle ORM schema
│   │   │   └── validation.ts                 # Zod schemas
│   │   │
│   │   ├── components/                       # L'équipe décide la structure
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   └── TodoFilter.tsx
│   │   │
│   │   └── types/index.ts
│   │
│   ├── tests/
│   │   ├── api/
│   │   │   ├── todos.test.ts                # Tests intégration API
│   │   │   └── todo-crud.test.ts            # CRUD complet
│   │   ├── components/
│   │   │   ├── TodoList.test.tsx
│   │   │   ├── TodoItem.test.tsx
│   │   │   └── TodoForm.test.tsx
│   │   └── setup.ts                          # Vitest setup
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── vitest.config.ts
│   ├── drizzle.config.ts
│   └── .env.example
│
├── skills/                                   # Hermes Skills (Phase 5)
│   ├── po-workflow/SKILL.md
│   ├── dev-tdd/SKILL.md
│   └── lead-review/SKILL.md
│
├── infra/                                    # Scripts déploiement (Phase 6)
│   ├── vm-provision.sh
│   ├── hermes-profiles.sh
│   └── github-app-setup.md
│
└── note.md
```

## 3. Base de données (SQLite)

### Schéma Drizzle

```typescript
// src/lib/schema.ts
import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),                          // UUID
  title: text('title').notNull(),
  description: text('description').default(''),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] }).default('todo'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  category: text('category').default('general'),
  dueDate: text('due_date'),                            // ISO 8601, nullable
  order: integer('order').default(0),                   // Pour le tri manuel
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

### Client SQLite

```typescript
// src/lib/db.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { todos } from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DATABASE_URL || './data/todos.db';

// Ensure data directory exists
const dir = dirname(DB_PATH);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema: { todos } });
```

## 4. API Routes (API First)

### GET /api/todos — Liste avec filtres + tri

```typescript
// Query params: ?status=todo&priority=high&category=work&search=keyword&sort=created_at&order=desc&page=1&limit=20
// Response 200: { todos: Todo[], total: number, page: number, limit: number }
```

### POST /api/todos — Création

```typescript
// Body: { title: string, description?: string, priority?: string, category?: string, dueDate?: string }
// Validation: Zod
// Response 201: Todo
// Response 400: { error: ZodError }
```

### GET /api/todos/[id] — Détail

```typescript
// Response 200: Todo
// Response 404: { error: "Not found" }
```

### PATCH /api/todos/[id] — Mise à jour partielle

```typescript
// Body: Partial< Todo >
// Response 200: Todo (updated)
// Response 404: { error: "Not found" }
// Response 400: { error: ZodError }
```

### DELETE /api/todos/[id] — Suppression

```typescript
// Response 204: No content
// Response 404: { error: "Not found" }
```

## 5. Tests TDD (Vitest)

### Configuration Vitest

```typescript
// vitest.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text', 'html'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Tests d'intégration API

```typescript
// tests/api/todos.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'vitest';
// Tests d'intégration: créer une DB de test, appeler les route handlers,
// vérifier les statuts HTTP, le contenu JSON, les validations Zod.
```

Ordre TDD (API First) :
1. Écrire `tests/api/todos.test.ts` (RED — tests échouent)
2. Implémenter `src/app/api/todos/route.ts` (GREEN — tests passent)
3. Écrire `tests/api/todo-crud.test.ts` (RED)
4. Implémenter `src/app/api/todos/[id]/route.ts` (GREEN)
5. Refactor si nécessaire (REFACTOR)

## 6. Hermes — Configuration des 3 profils

### Profil PO (po-bot)

```yaml
# ~/.hermes/profiles/po-bot/config.yaml
model:
  default: ollama/minimax-m3:cloud
  base_url: https://ollama.com/v1
  api_key: ${OLLAMA_CLOUD_API_KEY}
terminal:
  backend: docker
  docker_image: python:3.11-slim
  container_cpu: 1
  container_memory: 2048
  container_persistent: true
approvals:
  mode: smart
```

### Profil Dev (dev-bot)

```yaml
# ~/.hermes/profiles/dev-bot/config.yaml
model:
  default: ollama/kimi-k2.7-code:cloud
  base_url: https://ollama.com/v1
  api_key: ${OLLAMA_CLOUD_API_KEY}
terminal:
  backend: docker
  docker_image: node:20-slim
  container_cpu: 2
  container_memory: 4096
  container_persistent: true
approvals:
  mode: smart
```

### Profil Lead Dev (lead-dev-bot)

```yaml
# ~/.hermes/profiles/lead-dev-bot/config.yaml
model:
  default: ollama/deepseek-v4-pro:cloud
  base_url: https://ollama.com/v1
  api_key: ${OLLAMA_CLOUD_API_KEY}
terminal:
  backend: docker
  docker_image: node:20-slim
  container_cpu: 1
  container_memory: 2048
  container_persistent: true
approvals:
  mode: smart
```

## 7. Hermes Skills (3 rôles)

### PO Skill — `skills/po-workflow/SKILL.md`

```markdown
---
name: po-workflow
description: Product Owner workflow — create user stories, acceptance criteria, GitHub Issues
---
# PO Workflow

## Procédure
1. Analyser la demande utilisateur
2. Rédiger la user story formatée : "En tant que [rôle], je veux [fonctionnalité] afin de [bénéfice]"
3. Définir les critères d'acceptation (liste vérifiable, Given/When/Then)
4. Créer l'issue GitHub : `gh issue create --title "US: ..." --body "..." --label "user-story"`
5. Assigner à dev-bot
6. Ajouter au GitHub Project (colonne "Todo")
```

### Dev Skill — `skills/dev-tdd/SKILL.md`

```markdown
---
name: dev-tdd
description: Developer TDD workflow — tests first, implement, PR
---
# Dev TDD Workflow

## Procédure TDD
1. Lire l'issue assignée + critères d'acceptation
2. Créer branche : `git checkout -b feature/<issue-number>-<slug>`
3. RED : Écrire les tests d'abord (tests/api/, tests/components/)
4. GREEN : Implémenter le code minimum pour faire passer les tests
5. REFACTOR : Améliorer le code sans casser les tests
6. Vérifier : `npm run typecheck && npm run test`
7. Commit + push + `gh pr create`
8. Déplacer l'issue → "In Review"
```

### Lead Dev Skill — `skills/lead-review/SKILL.md`

```markdown
---
name: lead-review
description: Lead Developer review — code review checklist, approve or request changes
---
# Lead Dev Review Workflow

## Checklist de review
1. Conventions Next.js/TypeScript respectées (App Router, types stricts)
2. Tests couvrent les changements (TDD vérifié : tests avant code)
3. CI verte (lint + typecheck + test passent)
4. Pas de secrets/credentials commités
5. Critères d'acceptation de la user story vérifiés
6. Validation Zod côté API
7. Gestion d'erreurs appropriée (404, 400, 500)

## Décision
- SI OK : `gh pr review <pr> --approve` + `gh pr merge <pr> --squash` + close issue
- SI KO : `gh pr review <pr> --request-changes` + commentaires formatés
  Format : `file:line → problème → suggestion`
```

## 8. GitHub Configuration

### GitHub App (1 app, 3 tokens machine)

```
GitHub App "ai-team-loop"
├── Token PO       → permissions: issues (write), metadata (read)
├── Token DEV      → permissions: contents (write), pull_requests (write), issues (read)
└── Token LEAD     → permissions: pull_requests (write), contents (write),
                     pull_request_reviews (write), metadata (read)
```

Chaque token stocké dans le `.env` du profil Hermes correspondant.

### CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

### GitHub Project V2 (Kanban)

```
Colonnes : Todo → In Progress → In Review → Done
Labels : user-story, bug, feature, tech-debt, needs-work
```

## 9. Phases d'implémentation

### Phase 0 — Documentation (pattern Merenza)
- [x] Créer `.agent/tasks/todo-app-loop-engineering/` (PLAN.md, context.md, todos.md, insights.md)
- [ ] Créer `.agent/ARCHITECTURE.md`
- [ ] Initialiser git dans ai-team/ + premier commit

### Phase 1 — Scaffold projet Next.js
- [ ] `npx create-next-app@latest todo-app --typescript --tailwind --app --src-dir`
- [ ] Installer : vitest, @testing-library/react, @testing-library/jest-dom, drizzle-orm, better-sqlite3, zod
- [ ] Configurer vitest.config.ts, drizzle.config.ts, tsconfig.json (strict)
- [ ] Créer schema DB (todos table) + migration
- [ ] Créer .env.example (DATABASE_URL=./data/todos.db)
- [ ] Écrire les premiers tests API (RED)

### Phase 2 — API Routes (API First)
- [ ] `GET /api/todos` — liste avec filtres + tri + pagination
- [ ] `POST /api/todos` — création avec validation Zod
- [ ] `GET /api/todos/[id]` — détail
- [ ] `PATCH /api/todos/[id]` — mise à jour partielle
- [ ] `DELETE /api/todos/[id]` — suppression
- [ ] Tests d'intégration pour chaque route (GREEN)

### Phase 3 — UI Components
- [ ] TodoList (liste avec filtres + tri)
- [ ] TodoItem (affichage + toggle status)
- [ ] TodoForm (création + édition)
- [ ] TodoFilter (filtres statut, priorité, catégorie)
- [ ] Tests composants (Testing Library)
- [ ] Page principale avec SSR

### Phase 4 — GitHub Config (loop engineering)
- [ ] `.github/workflows/ci.yml`
- [ ] `.github/ISSUE_TEMPLATE/user-story.yml`
- [ ] `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] GitHub Project V2 Kanban setup

### Phase 5 — Hermes Skills (3 rôles)
- [ ] `skills/po-workflow/SKILL.md`
- [ ] `skills/dev-tdd/SKILL.md`
- [ ] `skills/lead-review/SKILL.md`

### Phase 6 — Déploiement VM + Hermes
- [ ] Script `infra/vm-provision.sh` (création VM 101 sur Precision)
- [ ] Script `infra/hermes-profiles.sh` (création 3 profils + cron)
- [ ] Doc `infra/github-app-setup.md` (procédure GitHub App + tokens)
- [ ] Configurer cron jobs (PO 1h, Dev 30min, Lead Dev 30min)

## 10. Coûts

| Poste | Coût |
|---|---|
| Ollama Cloud Pro | $20/mois (compte existant) |
| Infrastructure (Precision VM) | $0 (existant) |
| GitHub App | $0 |
| SQLite | $0 |
| **Total** | **$20/mois** |

## 11. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Concurrency Ollama Cloud = 3 modèles max | Exactement 3 bots — dans la limite |
| deepseek-v4-pro inférieur à Claude pour la review | Prompt système détaillé + checklist structurée |
| kimi-k2.7-code tool-calling failure | Fallback : qwen3.5:cloud (polyvalent) |
| better-sqlite3 build natif en CI | Pre-build installé via npm, pas de compilation |
| Hermes daemon pas installé sur ai-agents-vm | Phase 6 : script d'installation automatique |