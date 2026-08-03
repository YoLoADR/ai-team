# TODOs — Loop Engineering Todo App v2

> Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait + preuve · `❌` bloqué (raison)
> Anti-tricherie : un `[x]` exige une preuve concrète citée (chemin fichier / sortie commande / URL / screenshot).
>
> **Important** : Cette TODO ne contient que les tâches de **setup/infra** incombant à
> l'opérateur (Yohann / assistant). Les user stories et tâches de développement du
> projet todolist sont gérées par l'équipe d'agents (PO, Dev, Lead-Review) en autonomie
> via GitHub Issues. L'opérateur vérifie et corrige les agents, il ne rédige pas la
> TODO du projet à leur place.

## Phase 0 — Préparation (opérateur)
- [ ] 0.1 Vérifier repo GitHub `ai-team` (créer si inexistant)
- [ ] 0.2 Créer GitHub Project V2 Kanban dans `ai-team` (Backlog → Spec Ready → In Progress → In Review → Done)
- [ ] 0.3 Créer GitHub App `ai-team-loop` + installer sur le repo `ai-team`
- [ ] 0.4 Configurer secrets GitHub (OLLAMA_CLOUD_API_KEY, GITHUB_APP_PRIVATE_KEY, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID)
- [ ] 0.5 Initialiser Git dans `/Users/yohannravino/Factory/ai-team/` et committer le plan v2

## Phase 1 — Infrastructure OpenHands (carapace)
- [ ] 1.1 SSH carapace → créer dossier `/opt/ai-team-loop/`
- [ ] 1.2 Vérifier Docker + Docker Compose sur carapace (installer si manquant)
- [ ] 1.3 Déployer OpenHands runtime (docker-compose.yml)
- [ ] 1.4 Déployer webhook-adapter (Node.js : GitHub webhook → OpenHands API)
- [ ] 1.5 Configurer les 3 profils LLM (glm-5.2, deepseek-coder-v2, qwen3-235b) via config.toml
- [ ] 1.6 Configurer les 3 workspaces Docker isolés (po/, dev/, review/)
- [ ] 1.7 Tester connectivité : prompt simple sur chaque profil (capture résultat)

## Phase 2 — Scaffold projet Todo Next.js (opérateur)
- [ ] 2.1 Créer dossier `apps/todo/` + package.json
- [ ] 2.2 Scaffold Next.js + TypeScript + Tailwind dans `apps/todo/`
- [ ] 2.3 Configurer Vitest + React Testing Library + MSW dans `apps/todo/`
- [ ] 2.4 Configurer Drizzle ORM + Better-SQLite3 dans `apps/todo/`
- [ ] 2.5 Écrire le schéma Drizzle + migration initiale
- [ ] 2.6 Configurer CI GitHub Actions (lint + typecheck + test)
- [ ] 2.7 Configurer CD Netlify + `apps/todo/netlify.toml`
- [ ] 2.8 Vérifier build local et tests passent

## Phase 3 — Lancement du loop engineering (agents en autonomie)
- [ ] 3.1 Créer l'issue initiale "Todolist API-first TDD" avec les instructions
- [ ] 3.2 Vérifier que le PO-bot génère les 5 user stories et committe la spec
- [ ] 3.3 Vérifier que le Dev-bot implémente avec TDD et ouvre les PRs
- [ ] 3.4 Vérifier que le Lead-Review-bot review et approuve/refuse
- [ ] 3.5 Corriger les agents si besoin (prompts système, config)

## Phase 4 — Documentation et livraison
- [ ] 4.1 Mettre à jour `README.md` du projet
- [ ] 4.2 Documenter le workflow dans `insights.md`
- [ ] 4.3 Commit final + tag v0.1.0