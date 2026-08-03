# TODOs — Loop Engineering Todo App

> Légende : `[ ]` à faire · `[~]` en cours · `[x]` fait + preuve · `❌` bloqué (raison)
> Anti-tricherie : un `[x]` exige une preuve concrète citée (chemin fichier / sortie commande / URL / screenshot).

## Phase 0 — Préparation
- [x] 0.1 Créer repo GitHub `ai-team`
  - Preuve : https://github.com/YoLoADR/ai-team
- [x] 0.2 Créer GitHub Project V2 Kanban dans `ai-team` (Todo / In Progress / Done)
  - Preuve : https://github.com/users/YoLoADR/projects/3
- [~] 0.3 Configurer l'accès GitHub pour les agents (GitHub App impossible sans UI → fallback PAT OAuth `gho_...`)
- [x] 0.4 Vérifier compte Ollama Cloud Pro + récupérer API key
  - Preuve : `curl https://ollama.com/api/tags` retourne 200 avec 18 modèles (deepseek-v4-pro, kimi-k2.6, etc.)
- [x] 0.5 Initialiser Git dans `/Users/yohannravino/Factory/ai-team/` et push sur origin
  - Preuve : commits pushed to https://github.com/YoLoADR/ai-team/tree/main

## Phase 1 — Infrastructure OpenHands
- [x] 1.1 Préparer Precision (Debian 13 trixie) — Docker + Docker Compose installés
  - Preuve : `docker --version` = 29.7.1, `docker compose version` = v5.3.1, service active
- [x] 1.2 Créer container LXC `openhands-vm` (VMID 101, 4 vCPU, 8 Go RAM, 40 Go)
  - Preuve : IP `192.168.1.75`, hostname `openhands-vm`
- [x] 1.3 Déployer OpenHands sur Precision (host) via docker-compose
  - Preuve : container `openhands-loop` up sur http://precision:3000 → HTTP 200
- [x] 1.4 Configurer les profils LLM (PO, Dev, LeadDev) avec Ollama Cloud
  - Preuve : `/opt/openhands-loop/config/llm_profiles.yaml` créé avec kimi-k2.6 / deepseek-v4-pro
- [x] 1.5 Configurer les workspaces isolés (po/, dev/, review/)
  - Preuve : `/opt/openhands-loop/workspaces/{po,dev,review}/` créés
- [ ] 1.6 Tester connectivité : prompt simple sur chaque profil (capture résultat)

## Phase 2 — Projet Todo Next.js (sous-projet `apps/todo/`)
> ⚠️ Cette phase est réalisée par les agents IA, pas par l'orchestrateur.
- [x] 2.1 Créer dossier `apps/todo/` + root package.json monorepo (`pnpm-workspace.yaml`)
  - Preuve : `apps/todo/README.md` + `package.json` + `pnpm-workspace.yaml` pushed
- [ ] 2.2 Agents : scaffold Next.js + TypeScript + Tailwind dans `apps/todo/`
- [ ] 2.3 Agents : configurer Vitest + React Testing Library + MSW
- [ ] 2.4 Agents : configurer Drizzle ORM + Turso
- [ ] 2.5 Agents : écrire le schéma Drizzle + migration initiale
- [ ] 2.6 Agents : implémenter API routes `/api/tasks` (GET, POST, PATCH, DELETE)
- [ ] 2.7 Agents : implémenter UI (TaskList, TaskForm, TaskItem, Filters)
- [x] 2.8 Configurer CI GitHub Actions (templates ready — agents doivent respecter)
  - Preuve : `.github/workflows/ci.yml` + `.github/workflows/deploy.yml` + templates
- [ ] 2.9 Agents : configurer CD Netlify + `apps/todo/netlify.toml`
- [ ] 2.10 Agents : vérifier build local et tests passent

## Phase 3 — Automations OpenHands
- [ ] 3.1 Créer automation PO → Spec (`po-spec.yaml`)
- [ ] 3.2 Créer automation Dev → PR (`spec-to-pr.yaml`)
- [ ] 3.3 Créer automation Lead Dev → Review (`pr-review.yaml`)
- [ ] 3.4 Configurer webhook GitHub → OpenHands (repo webhook via PAT)
- [ ] 3.5 Configurer workflow Kanban auto (`.github/workflows/kanban.yml`)

## Phase 4 — Test du workflow Loop Engineering
- [ ] 4.1 Créer Issue #1 : "CRUD tasks API" → cycle complet
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
