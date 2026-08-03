# TODOs — Loop Engineering Todo App

> Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait + preuve · `❌` bloqué (raison)
> Anti-tricherie : un `[x]` exige une preuve concrète citée (chemin fichier / sortie commande / count).

## Phase 0 — Documentation (pattern Merenza)
- [x] 0.1 Créer `.agent/tasks/todo-app-loop-engineering/context.md` — `context.md` présent
- [x] 0.2 Créer `.agent/tasks/todo-app-loop-engineering/PLAN.md` — `PLAN.md` présent
- [x] 0.3 Créer `.agent/tasks/todo-app-loop-engineering/todos.md` — `todos.md` présent
- [x] 0.4 Créer `.agent/tasks/todo-app-loop-engineering/insights.md` — `insights.md` présent
- [ ] 0.5 Créer `.agent/ARCHITECTURE.md`
- [ ] 0.6 Initialiser git dans ai-team/ + premier commit

## Phase 1 — Scaffold projet Next.js
- [ ] 1.1 `npx create-next-app@latest todo-app --typescript --tailwind --app --src-dir`
- [ ] 1.2 Installer dépendances : vitest, @testing-library/react, @testing-library/jest-dom, drizzle-orm, better-sqlite3, zod, uuid
- [ ] 1.3 Configurer vitest.config.ts, tests/setup.ts
- [ ] 1.4 Configurer drizzle.config.ts + créer schema.ts (todos table)
- [ ] 1.5 Créer db.ts (better-sqlite3 client + drizzle)
- [ ] 1.6 Créer validation.ts (Zod schemas pour create + update)
- [ ] 1.7 Créer .env.example (DATABASE_URL=./data/todos.db)
- [ ] 1.8 Créer data/ directory + .gitignore
- [ ] 1.9 Écrire tests/api/todos.test.ts (RED — tests échouent)

## Phase 2 — API Routes (API First)
- [ ] 2.1 `GET /api/todos` — liste avec filtres (status, priority, category, search) + tri + pagination
- [ ] 2.2 `POST /api/todos` — création avec validation Zod → 201 ou 400
- [ ] 2.3 `GET /api/todos/[id]` — détail → 200 ou 404
- [ ] 2.4 `PATCH /api/todos/[id]` — mise à jour partielle → 200, 404 ou 400
- [ ] 2.5 `DELETE /api/todos/[id]` — suppression → 204 ou 404
- [ ] 2.6 Tests d'intégration complets (GREEN — tests passent)
- [ ] 2.7 `npm run typecheck && npm run test` verts

## Phase 3 — UI Components
- [ ] 3.1 TodoList.tsx — liste avec filtres + tri
- [ ] 3.2 TodoItem.tsx — affichage + toggle status + delete
- [ ] 3.3 TodoForm.tsx — création + édition (validation client)
- [ ] 3.4 TodoFilter.tsx — filtres statut, priorité, catégorie
- [ ] 3.5 Tests composants (Testing Library)
- [ ] 3.6 Page principale (page.tsx) avec SSR
- [ ] 3.7 `npm run typecheck && npm run test` verts

## Phase 4 — GitHub Config (loop engineering)
- [ ] 4.1 `.github/workflows/ci.yml` — CI (lint + typecheck + test)
- [ ] 4.2 `.github/ISSUE_TEMPLATE/user-story.yml` — template PO
- [ ] 4.3 `.github/PULL_REQUEST_TEMPLATE.md` — template PR
- [ ] 4.4 L'équipe crée le repo GitHub (via gh CLI avec credentials utilisateur)
- [ ] 4.5 GitHub Project V2 Kanban (Todo → In Progress → In Review → Done)

## Phase 5 — Hermes Skills (3 rôles)
- [ ] 5.1 `skills/po-workflow/SKILL.md`
- [ ] 5.2 `skills/dev-tdd/SKILL.md`
- [ ] 5.3 `skills/lead-review/SKILL.md`

## Phase 6 — Déploiement VM + Hermes
- [ ] 6.1 `infra/vm-provision.sh` — script création VM 101 sur Precision
- [ ] 6.2 `infra/hermes-profiles.sh` — script création 3 profils Hermes
- [ ] 6.3 `infra/github-app-setup.md` — procédure GitHub App + tokens
- [ ] 6.4 Configurer cron jobs (PO 1h, Dev 30min, Lead Dev 30min)