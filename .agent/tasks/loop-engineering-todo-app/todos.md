# TODOs — Loop Engineering Todo App

> Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait + preuve · `❌` bloqué (raison)
> Anti-tricherie : un `[x]` exige une preuve concrète citée (chemin fichier / sortie commande / URL / screenshot).

## Phase 0 — Préparation
- [ ] 0.1 Vérifier repo GitHub `ai-team` (créer si inexistant)
- [ ] 0.2 Créer GitHub Project V2 Kanban dans `ai-team` (Backlog → Spec Ready → In Progress → In Review → Done)
- [ ] 0.3 Créer GitHub App `ai-team-loop` + installer sur le repo `ai-team`
- [ ] 0.4 Vérifier compte Ollama Cloud Pro + récupérer API key
- [x] 0.5 Initialiser Git dans `/Users/yohannravino/Factory/ai-team/` et committer le plan
  - Preuve : commit `f78db76` — `chore: init plan loop engineering todo sous-projet apps/todo`

## Phase 1 — Infrastructure OpenHands
- [ ] 1.1 Créer VM `openhands-vm` sur Precision (Proxmox, 4 vCPU, 8 Go RAM, 40 Go disque)
- [ ] 1.2 Installer Ubuntu 24.04 + Docker + Docker Compose sur la VM
- [ ] 1.3 Déployer OpenHands (docker-compose)
- [ ] 1.4 Configurer les 3 profils LLM (PO, Dev, LeadDev) avec Ollama Cloud
- [ ] 1.5 Configurer les 3 workspaces Docker isolés (po/, dev/, review/)
- [ ] 1.6 Tester connectivité : prompt simple sur chaque profil (capture résultat)

## Phase 2 — Projet Todo Next.js (sous-projet `apps/todo/`)
- [ ] 2.1 Créer dossier `apps/todo/` + root package.json monorepo (`pnpm-workspace.yaml`)
- [ ] 2.2 Scaffold Next.js + TypeScript + Tailwind dans `apps/todo/`
- [ ] 2.3 Configurer Vitest + React Testing Library + MSW dans `apps/todo/`
- [ ] 2.4 Configurer Drizzle ORM + Turso dans `apps/todo/`
- [ ] 2.5 Écrire le schéma Drizzle + migration initiale
- [ ] 2.6 Implémenter API routes `/api/tasks` (GET, POST, PATCH, DELETE)
- [ ] 2.7 Implémenter UI (TaskList, TaskForm, TaskItem, Filters)
- [ ] 2.8 Configurer CI GitHub Actions (lint + typecheck + test)
- [ ] 2.9 Configurer CD Netlify + `apps/todo/netlify.toml`
- [ ] 2.10 Vérifier build local et tests passent

## Phase 3 — Automations OpenHands
- [ ] 3.1 Créer automation PO → Spec (`po-spec.yaml`)
- [ ] 3.2 Créer automation Dev → PR (`spec-to-pr.yaml`)
- [ ] 3.3 Créer automation Lead Dev → Review (`pr-review.yaml`)
- [ ] 3.4 Configurer webhook GitHub → OpenHands
- [ ] 3.5 Configurer workflow Kanban auto (`.github/workflows/kanban.yml`)

## Phase 4 — Test du workflow Loop Engineering
- [ ] 4.1 Créer Issue #1 : "CRUD tasks API"
- [ ] 4.2 Vérifier que PO génère la spec et la committe
- [ ] 4.3 Vérifier que Dev implémente avec TDD et ouvre la PR
- [ ] 4.4 Vérifier que Lead Dev review et approuve/refuse
- [ ] 4.5 Vérifier déploiement Netlify après merge
- [ ] 4.6 Créer Issue #2 : "Filtres et tri" → cycle complet
- [ ] 4.7 Créer Issue #3 : "Catégories et priorités" → cycle complet
- [ ] 4.8 Ajuster les prompts système selon la qualité observée

## Phase 5 — Documentation et livraison
- [ ] 5.1 Mettre à jour `README.md` du projet
- [ ] 5.2 Documenter le workflow dans `insights.md`
- [ ] 5.3 Commit final + tag v0.1.0
