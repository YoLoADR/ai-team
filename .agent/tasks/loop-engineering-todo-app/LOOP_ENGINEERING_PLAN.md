# Plan détaillé — Loop Engineering Todo App

## 1. Architecture du projet (sous-projet)

Le todo est un **sous-projet** du repo `ai-team`, situé dans `apps/todo/`.

```
/Users/yohannravino/Factory/ai-team-cuba/
│
├── .agent/tasks/loop-engineering-todo-app/    # Plan + suivi
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
│       │   │   ├── client.ts
│       │   │   ├── schema.ts
│       │   │   └── migrations/
│       │   ├── hooks/
│       │   │   └── useTasks.ts
│       │   └── validators.ts
│       │
│       ├── __tests__/
│       │   ├── api/
│       │   │   └── tasks.test.ts
│       │   ├── components/
│       │   │   ├── TaskList.test.tsx
│       │   │   └── TaskForm.test.tsx
│       │   └── mocks/
│       │       └── server.ts
│       │
│       ├── vitest.config.ts
│       ├── netlify.toml
│       ├── drizzle.config.ts
│       ├── next.config.js
│       ├── package.json
│       ├── .env.example
│       └── README.md
│
├── package.json (root ai-team)
├── pnpm-workspace.yaml
├── turbo.json
└── .gitignore (root)
```

## 2. Base de données (Turso / libSQL)

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

### Client Turso

```ts
// lib/db/client.ts
import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(turso);
```

## 3. API Route Handlers

```ts
// app/api/tasks/route.ts
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { taskInsertSchema } from '@/lib/validators';

export async function GET() {
  const allTasks = await db.select().from(tasks).all();
  return Response.json(allTasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = taskInsertSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.format() }, { status: 400 });
  }

  const inserted = await db.insert(tasks).values(parsed.data).returning();
  return Response.json(inserted[0], { status: 201 });
}
```

## 4. Tests TDD

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

### Test API

```ts
// __tests__/api/tasks.test.ts
import { GET, POST } from '@/app/api/tasks/route';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ all: vi.fn(() => []) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{ id: 1, title: 'Test' }]) })) })),
  },
}));

describe('GET /api/tasks', () => {
  test('returns 200 with an array', async () => {
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## 5. CI/CD (dans apps/todo/)

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
    defaults:
      run:
        working-directory: apps/todo
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
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

## 6. OpenHands — Configuration

### LLM Profiles (`openhands-vm/config/llm_profiles.yaml`)

```yaml
llm_profiles:
  po:
    provider: openai_compatible
    model: kimi-k2.6
    base_url: https://ollama.com/api/v1
    api_key: ${OLLAMA_CLOUD_API_KEY}
    temperature: 0.4
    max_tokens: 8192
    system_prompt: |
      You are a Product Owner. Analyze requirements and produce detailed
      technical specifications. Output Gherkin user stories, API routes,
      data schemas, and acceptance criteria. Never write implementation code.

  dev:
    provider: openai_compatible
    model: deepseek-v4-pro
    base_url: https://ollama.com/api/v1
    api_key: ${OLLAMA_CLOUD_API_KEY}
    temperature: 0.2
    max_tokens: 16384
    system_prompt: |
      You are a Senior Developer. Follow strict TDD: write tests first,
      then implement. Use Next.js App Router, TypeScript, Drizzle ORM,
      Tailwind, Vitest, and React Testing Library. Always run tests after
      implementation. If tests fail, fix the code.

  leaddev:
    provider: openai_compatible
    model: deepseek-v4-pro
    base_url: https://ollama.com/api/v1
    api_key: ${OLLAMA_CLOUD_API_KEY}
    temperature: 0.1
    max_tokens: 8192
    system_prompt: |
      You are a Lead Developer reviewing a pull request. Analyze:
      1. Code quality (style, patterns, complexity)
      2. Test coverage (are tests present? do they pass?)
      3. Spec compliance (does implementation match requirements?)
      4. Security (injection, validation, auth)
      5. Performance (N+1 queries, bundle impact)
      Provide specific, actionable feedback. Approve only if all criteria pass.
```

### Automation PO → Spec (`openhands-vm/config/automations/po-spec.yaml`)

```yaml
name: PO - Generate Spec from Issue
type: event
source: github
event: issues
action: labeled
filter: "contains(issue.labels[].name, 'feature') || contains(issue.labels[].name, 'bug')"
llm_profile: po
workspace: po

steps:
  - name: Read issue
    action: github.issue.get
    params:
      issue_number: ${{ issue.number }}

  - name: Generate spec
    action: openhands.agent.run
    instructions: |
      Analyze this issue and produce a technical specification:
      <<previous.output.body>>

      Output a spec.md file containing:
      - User stories in Gherkin format
      - API routes to create/modify
      - Data schema changes
      - Acceptance criteria
      - Edge cases to consider

  - name: Create spec branch
    action: github.repository.create_branch
    params:
      base: main
      branch: "ai/spec/${{ issue.number }}"

  - name: Commit spec
    action: github.repository.apply_patch
    params:
      branch: "ai/spec/${{ issue.number }}"
      patch: <<previous.output>>
      commit_message: "docs: spec for issue #${{ issue.number }}"

  - name: Push spec
    action: github.repository.push
    params:
      branch: "ai/spec/${{ issue.number }}"

  - name: Comment on issue
    action: github.issue.comment
    params:
      issue_number: ${{ issue.number }}
      body: |
        ## Specification generated

        <<previous.output>>

        Spec committed to branch `ai/spec/${{ issue.number }}`.

  - name: Move to Spec Ready
    action: github.project.update_column
    params:
      issue_number: ${{ issue.number }}
      column: "Spec Ready"
```

### Automation Dev → PR (`openhands-vm/config/automations/spec-to-pr.yaml`)

```yaml
name: Dev - Implement Spec
type: event
source: github
event: issues
action: labeled
filter: "contains(issue.labels[].name, 'ready-for-dev')"
llm_profile: dev
workspace: dev

steps:
  - name: Read spec
    action: github.issue.get
    params:
      issue_number: ${{ issue.number }}

  - name: Write tests
    action: openhands.agent.run
    instructions: |
      Based on this spec, write tests FIRST:
      <<previous.output.body>>

      Create test files for API route handlers, React components, and validation logic.
      Use Vitest + React Testing Library + MSW. Tests must fail initially (red phase).

  - name: Implement code
    action: openhands.agent.run
    instructions: |
      Now implement the code to make tests pass:
      - API route handlers
      - Database schema + migrations
      - React components
      - Business logic hooks

      Run `npm test` after implementation. All tests must pass.

  - name: Create impl branch
    action: github.repository.create_branch
    params:
      base: main
      branch: "ai/impl/${{ issue.number }}"

  - name: Commit implementation
    action: github.repository.apply_patch
    params:
      branch: "ai/impl/${{ issue.number }}"
      patch: <<previous.output>>
      commit_message: "feat: implement #${{ issue.number }}"

  - name: Push and open PR
    action: github.repository.push
    params:
      branch: "ai/impl/${{ issue.number }}"

  - name: Open PR
    action: github.pull_request.create
    params:
      title: "feat(#${{ issue.number }}): ${{ issue.title }}"
      body: |
        Closes #${{ issue.number }}
      base: main
      head: "ai/impl/${{ issue.number }}"

  - name: Move to In Review
    action: github.project.update_column
    params:
      issue_number: ${{ issue.number }}
      column: "In Review"
```

### Automation Lead Dev → Review (`openhands-vm/config/automations/pr-review.yaml`)

```yaml
name: Lead Dev - Review PR
type: event
source: github
event: pull_request
action: [opened, synchronize]
llm_profile: leaddev
workspace: review

steps:
  - name: Get PR diff
    action: github.pull_request.diff
    params:
      pull_number: ${{ pr.number }}

  - name: Get CI status
    action: github.check.run.list
    params:
      ref: ${{ pr.head.sha }}

  - name: Review code
    action: openhands.agent.run
    instructions: |
      Review this pull request:

      **PR Diff:**
      <<previous.outputs.diff>>

      **CI Status:**
      <<previous.outputs.checks>>

      Analyze and provide:
      1. Code quality assessment
      2. Test coverage review
      3. Spec compliance check
      4. Security concerns
      5. Performance impact

      Decision: APPROVE or REQUEST_CHANGES
      If REQUEST_CHANGES, list specific fixes needed.

  - name: Post review
    action: github.pull_request.review.create
    params:
      pull_number: ${{ pr.number }}
      body: <<previous.output.review_text>>
      event: <<previous.output.decision>>

  - name: Auto-merge if approved
    if: "previous.output.decision == 'APPROVE'"
    action: github.pull_request.merge
    params:
      pull_number: ${{ pr.number }}

  - name: Move issue
    action: github.project.update_column
    params:
      issue_number: ${{ pr.linked_issue_number }}
      column: "{{ previous.output.decision == 'APPROVE' ? 'Done' : 'In Progress' }}"
```

## 7. GitHub Project V2 — Kanban

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

## 8. Phases d'implémentation

### Phase 0 — Préparation
- Vérifier/créer repo GitHub `ai-team`
- Créer GitHub Project V2 Kanban dans le repo `ai-team`
- Créer GitHub App `ai-team-loop` et l'installer sur `ai-team`
- Vérifier Ollama Cloud Pro + API key
- Initialiser Git dans `/Users/yohannravino/Factory/ai-team-cuba/` et committer le plan

### Phase 1 — Infrastructure OpenHands
- Créer VM `openhands-vm` sur Precision
- Installer Docker + Docker Compose
- Déployer OpenHands
- Configurer les 3 profils LLM
- Tester connectivité

### Phase 2 — Projet Todo
- Scaffold Next.js + TypeScript + Tailwind
- Configurer Vitest + RTL + MSW
- Configurer Drizzle + Turso
- Écrire le schéma + migrations
- Configurer CI GitHub Actions
- Configurer CD Netlify

### Phase 3 — Automations
- Écrire automation PO → Spec
- Écrire automation Dev → PR
- Écrire automation Lead Dev → Review
- Connecter webhook GitHub → OpenHands
- Configurer Kanban auto

### Phase 4 — Tests du workflow
- Issue #1 : "CRUD tasks API" → cycle complet
- Issue #2 : "Filtres et tri" → cycle complet
- Issue #3 : "Catégories et priorités" → cycle complet
- Itérer sur les prompts système

## 9. Coûts

| Poste | Coût |
|---|---|
| Ollama Cloud Pro | $20/mois |
| Infrastructure (Precision) | $0 (existant) |
| GitHub App | $0 |
| Netlify | $0 (tier gratuit) |
| **Total** | **$20/mois** |

## 10. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Concurrency Ollama Cloud Pro = 3 modèles max | Séquencer si besoin ; upgrader Max si ajout d'un 4ème rôle |
| OpenHands trop complexe / immature | Fallback : orchestrateur Python custom avec LangGraph |
| deepseek-v4-pro inférieur à Claude/GPT pour la review | Prompts système très détaillés, check-list structurée |
| Turso limité en free tier | Utiliser le tier gratuit suffisant pour une todo demo |
