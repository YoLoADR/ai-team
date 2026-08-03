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

## Phase 1-3 — Todo App (TRAVAIL DES AGENTS, pas le mien)
> ⚠️ Ces phases sont réalisées par l'équipe d'agents (PO, Dev, Lead Dev) en autonomie.
> Mon rôle est de vérifier et corriger les agents, pas de coder la todo app.

- [ ] 1.x Scaffold Next.js (par dev-bot, via skill dev-tdd)
- [ ] 2.x API Routes (par dev-bot, TDD: RED → GREEN → REFACTOR)
- [ ] 3.x UI Components (par dev-bot, tests composants)
- [ ] L'équipe crée le repo GitHub (via gh CLI avec credentials utilisateur)
- [ ] GitHub Project V2 Kanban (par po-bot)

## Phase 4 — GitHub Config (infrastructure pour les agents)
- [x] 4.1 `.github/workflows/ci.yml` — CI (lint + typecheck + test) — `.github/workflows/ci.yml`
- [x] 4.2 `.github/ISSUE_TEMPLATE/user-story.yml` — template PO — `.github/ISSUE_TEMPLATE/user-story.yml`
- [x] 4.3 `.github/PULL_REQUEST_TEMPLATE.md` — template PR — `.github/PULL_REQUEST_TEMPLATE.md`

## Phase 5 — Hermes Skills (procédures pour les agents)
- [x] 5.1 `skills/po-workflow/SKILL.md` — `skills/po-workflow/SKILL.md`
- [x] 5.2 `skills/dev-tdd/SKILL.md` — `skills/dev-tdd/SKILL.md`
- [x] 5.3 `skills/lead-review/SKILL.md` — `skills/lead-review/SKILL.md`

## Phase 6 — Scripts infra (déploiement)
- [x] 6.1 `infra/vm-provision.sh` — script création VM 101 sur Precision — `infra/vm-provision.sh`
- [x] 6.2 `infra/hermes-profiles.sh` — script création 3 profils Hermes + cron — `infra/hermes-profiles.sh`
- [x] 6.3 `infra/github-app-setup.md` — procédure GitHub App + tokens — `infra/github-app-setup.md`
- [ ] 6.4 Déploiement effectif sur Precision (quand VM prête)