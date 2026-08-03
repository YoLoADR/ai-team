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
- [x] 0.1 Vérifier repo GitHub `ai-team` (existant: YoLoADR/ai-team, issues+projects activés)
  - Preuve : `gh repo view YoLoADR/ai-team` → URL https://github.com/YoLoADR/ai-team
- [x] 0.2 Créer GitHub Project V2 Kanban (existant: project #3 "AI Team Loop Engineering")
  - Preuve : champ "Workflow Status" créé avec 5 colonnes (Backlog, Spec Ready, In Progress, In Review, Done)
  - Field ID: PVTSSF_lAHOAPvD3s4BfO2kzhZjQuc
- [x] 0.3 Créer GitHub App `ai-team-loop` + installer sur le repo `ai-team`
  - Preuve : App ID 4472414, Client ID Iv23li47EYGYrVA1WXkm, installée sur YoLoADR/ai-team
  - Permissions : Contents (Read-only), Issues (R/W), Pull requests (R/W)
  - Webhook URL : http://109.199.97.174:8095 (port ouvert dans iptables)
  - Note : port 8095 pas accessible depuis l'extérieur (pare-feu Contabo) → utiliser GitHub Actions comme relay
- [x] 0.4 Configurer secrets GitHub (OLLAMA_CLOUD_API_KEY, APP_PRIVATE_KEY, APP_ID, WEBHOOK_SECRET)
  - Preuve : `gh secret list --repo YoLoADR/ai-team` → APP_ID, APP_PRIVATE_KEY, OLLAMA_CLOUD_API_KEY, WEBHOOK_SECRET
  - Note : NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID à ajouter plus tard (pas bloquant pour le loop)
- [x] 0.5 Initialiser Git dans `/Users/yohannravino/Factory/ai-team/` et committer le plan v2
  - Preuve : commit ec18341 — `docs: add context.md to v2 plan`

## Phase 1 — Infrastructure OpenHands (carapace)
- [x] 1.1 SSH carapace (root@109.199.97.174) → créer dossier `/opt/ai-team-loop/`
  - Preuve : `ls /opt/ai-team-loop/` → config, docker-compose.yml, webhook-adapter, workspaces
- [x] 1.2 Vérifier Docker + Docker Compose sur carapace
  - Preuve : Docker 29.1.3, Docker Compose v5.0.1
- [x] 1.3 Déployer OpenHands runtime (docker-compose.yml, port 3020)
  - Preuve : `curl http://localhost:3020/health` → "OK"
- [x] 1.4 Déployer webhook-adapter (Node.js, port 8095)
  - Preuve : `docker logs webhook-adapter` → "webhook-adapter listening on :8080"
- [x] 1.5 Configurer les 3 profils LLM (glm-5.2:cloud, kimi-k2.7-code:cloud, qwen3.5:397b:cloud) via config.toml
  - Preuve : `cat /opt/ai-team-loop/config/config.toml` → 3 profils configurés
  - Note : utilise daemon Ollama local (port 11434) qui proxifie vers Ollama Cloud via keypair
- [x] 1.6 Configurer les 3 workspaces Docker isolés (po/, dev/, review/)
  - Preuve : volumes `workspace-po`, `workspace-dev`, `workspace-review` créés
- [x] 1.7 Tester connectivité : prompt simple sur chaque profil
  - Preuve : glm-5.2:cloud → "PO OK", kimi-k2.7-code:cloud → "DEV OK", qwen3.5:397b:cloud → "REVIEW OK"
- [x] 1.0 Script setup préparé : `infra/openhands-setup.sh` (commit ca60e22)

## Phase 2 — Scaffold projet Todo Next.js (opérateur)
- [x] 2.1 Créer dossier `apps/todo/` + package.json — `apps/todo/package.json` présent
- [x] 2.2 Scaffold Next.js + TypeScript + Tailwind dans `apps/todo/` — `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`
- [x] 2.3 Configurer Vitest + React Testing Library + MSW dans `apps/todo/` — `vitest.config.ts`, `vitest.setup.ts`, smoke test passe
- [x] 2.4 Configurer Drizzle ORM + Better-SQLite3 dans `apps/todo/` — `drizzle.config.ts`, `lib/db/client.ts`
- [x] 2.5 Écrire le schéma Drizzle + migration initiale — `lib/db/schema.ts` (table tasks)
- [x] 2.6 Configurer CI GitHub Actions (lint + typecheck + test) — `.github/workflows/ci.yml`
- [x] 2.7 Configurer CD Netlify + `apps/todo/netlify.toml` — `.github/workflows/deploy.yml`, `netlify.toml`
- [x] 2.8 Vérifier build local et tests passent
  - Preuve : `vitest run` → 2 tests passed ; `tsc --noEmit` → OK ; `next build` → Compiled successfully

## Phase 3 — Lancement du loop engineering (agents en autonomie)
- [x] 3.1 Issue #1 existante "[PO-Spec] CRUD tasks API" utilisée pour tester
- [x] 3.2 PO-bot génère spec et commente sur l'issue (glm-5.2:cloud → 9538 chars, label ready-for-dev ajouté)
  - Preuve : `gh issue view 1 --repo YoLoADR/ai-team` → 1 commentaire "Specification generated" avec user stories Gherkin
- [~] 3.3 Dev-bot génère le code (kimi-k2.7-code:cloud → en cours, 1T params, ~15min+)
  - Note : le Dev-bot génère du texte (le code) mais ne crée pas encore de PR automatiquement
  - Amélioration needed : clone repo + create branch + commit + push + open PR
- [ ] 3.4 Lead-Review-bot review la PR (quand elle existera)
- [ ] 3.5 Corriger les agents si besoin (prompts système, config)

## Phase 4 — Documentation et livraison
- [ ] 4.1 Mettre à jour `README.md` du projet
- [ ] 4.2 Documenter le workflow dans `insights.md`
- [ ] 4.3 Commit final + tag v0.1.0