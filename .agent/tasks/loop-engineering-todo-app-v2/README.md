# Loop Engineering — README

## En une phrase

Une équipe de 3 bots IA (PO, Dev, Lead-Review) qui planifient, développent et
reviewent votre code automatiquement. Vous créez une issue GitHub, l'équipe fait le
reste. Vous êtes notifié sur Telegram à chaque étape.

---

## Où se trouve quoi

### Le code et le suivi

| Quoi | Où | Comment y accéder |
|---|---|---|
| **Repo GitHub** | https://github.com/YoLoADR/ai-team | `gh repo view YoLoADR/ai-team` |
| **Kanban** | https://github.com/users/YoLoADR/projects/3 | 5 colonnes : Backlog → Spec Ready → In Progress → In Review → Done |
| **Issues** | https://github.com/YoLoADR/ai-team/issues | C'est là que vous déléguez des features |
| **PRs** | https://github.com/YoLoADR/ai-team/pulls | Le Dev-bot y pousse son code, le Lead-Review y poste ses reviews |
| **Plan & suivi** | `/Users/yohannravino/Factory/ai-team/.agent/tasks/loop-engineering-todo-app-v2/` | Local — ce dossier |
| **Scaffold apps/todo** | `/Users/yohannravino/Factory/ai-team/apps/todo/` | Local — socle Next.js que les agents enrichissent |

### L'infrastructure des bots

| Quoi | Où | Détail |
|---|---|---|
| **run-agent.py** | `root@109.199.97.174:/opt/ai-team-loop/run-agent.py` | Script Python — le cerveau des 3 bots |
| **Config LLM** | `root@109.199.97.174:/opt/ai-team-loop/config/config.toml` | Profils Ollama (po, dev, leaddev) |
| **Clé privée GitHub App** | `root@109.199.97.174:/opt/ai-team-loop/private-key.pem` | Auth bot |
| **Logs agents** | `root@109.199.97.174:/opt/ai-team-loop/logs/` | Trace de chaque exécution |
| **Docker Compose** | `root@109.199.97.174:/opt/ai-team-loop/docker-compose.yml` | OpenHands runtime + webhook-adapter |
| **.env** | `root@109.199.97.174:/opt/ai-team-loop/.env` | Tokens (GitHub App, Telegram, etc.) |

### Les modèles LLM

| Rôle | Modèle | Serveur | Vitesse |
|---|---|---|---|
| PO | `glm-5.2:cloud` | Daemon Ollama carapace (port 11434) → Ollama Cloud | ~3-22s |
| Dev | `glm-5.2:cloud` | Daemon Ollama carapace (port 11434) → Ollama Cloud | ~3-60s |
| Lead-Review | `qwen3.5:397b:cloud` | Daemon Ollama carapace (port 11434) → Ollama Cloud | ~40-60s |

Le daemon Ollama sur carapace proxifie les modèles `:cloud` vers Ollama Cloud via
keypair (pas de clé API à gérer).

### Les secrets GitHub

| Secret | Usage |
|---|---|
| `APP_ID` | ID de la GitHub App `ai-team-loop` (4472414) |
| `APP_PRIVATE_KEY` | Clé privée RSA de la GitHub App |
| `CARAPACE_SSH_KEY_B64` | Clé SSH pour que GitHub Actions se connecte à carapace |
| `CARAPACE_HOST` | IP de carapace (109.199.97.174) |
| `CARAPACE_USER` | root |
| `LEAD_REVIEW_PAT` | Token PAT pour que le Lead-Review review les PRs (l'App ne peut pas reviewer ses propres PRs) |
| `OLLAMA_CLOUD_API_KEY` | `ollama` (daemon local, pas utilisé directement) |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram `@loop_engineering_team_bot` |
| `TELEGRAM_CHAT_ID` | Votre user ID Telegram (7211240214) |
| `WEBHOOK_SECRET` | Secret du webhook GitHub App |

---

## Comment déléguer une feature

### Méthode 1 — GitHub CLI (recommandé)

```bash
gh issue create --repo YoLoADR/ai-team \
  --title "[Feature] Ajouter l'authentification JWT" \
  --label "feature" \
  --body "## Contexte
L'API todolist a besoin d'authentification.

## Requirements
- POST /api/auth/register (email, password)
- POST /api/auth/login (retourne un JWT)
- Middleware sur /api/tasks qui vérifie le JWT
- Tests TDD pour chaque endpoint

## Contraintes
- Suivre la stack existante (Next.js, Drizzle, Better-SQLite3)
- TDD strict"
```

### Méthode 2 — Interface web GitHub

Allez sur https://github.com/YoLoADR/ai-team/issues/new, créez une issue avec le
label `feature`.

### Que se passe-t-il ensuite (automatique)

```
1. Issue créée (label "feature")
   → GitHub Actions déclenche le workflow ai-loop.yml
   → SSH vers carapace → python3 run-agent.py po <issue> YoLoADR/ai-team

2. PO-bot (glm-5.2:cloud)
   → Analyse l'issue
   → Génère 5 user stories en Gherkin (spec technique)
   → Poste la spec en commentaire sur l'issue
   → Ajoute le label "ready-for-dev"
   → Déplace l'issue dans "Spec Ready" (Kanban)
   → Envoie une notification Telegram 📋

3. Label "ready-for-dev" détecté
   → GitHub Actions re-déclenche
   → SSH vers carapace → python3 run-agent.py dev <issue> YoLoADR/ai-team

4. Dev-bot (glm-5.2:cloud)
   → Lit la spec
   → Clone le repo sur carapace (/tmp/ai-team-XXXXX/)
   → Génère le code en TDD (tests d'abord, code ensuite)
   → Écrit les fichiers dans apps/todo/
   → Valide CI locale : npx tsc --noEmit + npx vitest run
   → Si CI échoue → auto-fix via LLM → re-valide
   → Crée branche ai/impl/<issue>
   → Push + ouvre PR
   → Déplace l'issue dans "In Progress" (Kanban)
   → Envoie une notification Telegram 🔧

5. PR ouverte
   → GitHub Actions déclenche le workflow
   → SSH vers carapace → python3 run-agent.py review <PR> YoLoADR/ai-team

6. Lead-Review-bot (qwen3.5:397b:cloud)
   → Récupère le diff réel de la PR
   → Analyse : qualité, tests, spec, sécurité, performance
   → Poste une review APPROVE ou CHANGES_REQUESTED
   → Déplace l'issue dans "In Review" (Kanban)
   → Envoie une notification Telegram 👁

7a. Si APPROVE
   → Auto-merge (squash) via API GitHub
   → Déplace l'issue dans "Done" (Kanban)
   → Envoie une notification Telegram 🎉

7b. Si CHANGES_REQUESTED
   → GitHub Actions déclenche pull_request_review event
   → SSH vers carapace → python3 run-agent.py dev-fix <PR> YoLoADR/ai-team
   → Dev-fix lit les reviews CHANGES_REQUESTED
   → Clone le repo, checkout la branche existante
   → Corrige les fichiers
   → Valide CI locale
   → Push sur la même branche
   → Envoie une notification Telegram ✅
   → Le Lead-Review re-review (loop jusqu'à APPROVE)
```

---

## Comment suivre l'avancement

| Action | Commande |
|---|---|
| Voir les issues | `gh issue list --repo YoLoADR/ai-team` |
| Voir les PRs | `gh pr list --repo YoLoADR/ai-team` |
| Voir le Kanban | https://github.com/users/YoLoADR/projects/3 |
| Voir les runs GitHub Actions | `gh run list --repo YoLoADR/ai-team --limit 10` |
| Voir les logs d'un agent | `ssh root@109.199.97.174 'tail -f /opt/ai-team-loop/logs/agent-*.log'` |
| Voir les conteneurs Docker | `ssh root@109.199.97.174 'docker ps'` |
| Interface OpenHands | `http://109.199.97.174:3020` |

---

## Comment déclencher manuellement un agent

```bash
# PO sur une issue existante
gh workflow run ai-loop.yml --repo YoLoADR/ai-team \
  -f trigger_type=po-spec -f issue_number=5

# Dev sur une issue avec spec prête
gh workflow run ai-loop.yml --repo YoLoADR/ai-team \
  -f trigger_type=dev-impl -f issue_number=5

# Dev-Fix sur une PR (après CHANGES_REQUESTED)
gh workflow run ai-loop.yml --repo YoLoADR/ai-team \
  -f trigger_type=dev-fix -f issue_number=6

# Lead-Review sur une PR
gh workflow run ai-loop.yml --repo YoLoADR/ai-team \
  -f trigger_type=lead-review -f issue_number=6
```

---

## Isolation — comment s'assurer que cette équipe ne se mélange pas avec d'autres

### Isolation GitHub

- **Repo dédié** : `YoLoADR/ai-team` — ne contient QUE le loop engineering
- **GitHub App dédiée** : `ai-team-loop` (App ID 4472414) — installée UNIQUEMENT sur `YoLoADR/ai-team`
- **Labels dédiés** : `feature`, `bug`, `user-story`, `ready-for-dev` — créés dans ce repo uniquement
- **Kanban dédié** : Project V2 #3 "AI Team Loop Engineering" — lié uniquement à ce repo

### Isolation infrastructure

- **VPS dédié pour les workers** : `carapace` (109.199.97.174) — le `run-agent.py` et les
  modèles sont sur ce serveur uniquement
- **Dossier dédié** : `/opt/ai-team-loop/` — tout est dans ce dossier, rien ailleurs
- **Daemon Ollama local** : port 11434 sur carapace — proxifie vers Ollama Cloud via
  keypair (pas de clé API partagée)
- **Workspaces temporaires** : le Dev-bot clone le repo dans `/tmp/ai-team-XXXXX/` à
  chaque exécution, supprime après push. Pas de workspace persistant.

### Isolation des autres versions

Si vous créez d'autres équipes de bots à l'avenir :
1. Créez un **nouveau repo** GitHub (ex: `YoLoADR/ai-team-v2`)
2. Créez une **nouvelle GitHub App** (ex: `ai-team-loop-v2`)
3. Créez un **nouveau dossier** sur carapace (ex: `/opt/ai-team-loop-v2/`)
4. Ne réutilisez PAS le même repo, la même App, ou le même dossier

---

## Architecture technique

```
┌─────────────────────────────────────────────────────────────────────┐
│ VOUS (Yohann)                                                        │
│                                                                      │
│  ┌──────────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │ Terminal     │    │ Telegram      │    │ GitHub web           │  │
│  │ gh issue     │    │ Notifications │    │ Issues / PRs / Kanban │  │
│  │ create ...   │    │ (reception)   │    │                      │  │
│  └──────┬───────┘    └───────▲───────┘    └──────────┬───────────┘  │
└─────────┼────────────────────┼───────────────────────┼──────────────┘
          │                    │                       │
          │ 1. Crée issue      │                       │
          ▼                    │                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GITHUB (github.com)                                                  │
│                                                                      │
│  Repo: YoLoADR/ai-team                                               │
│  ├── Issues (feature, bug, user-story)                               │
│  ├── PRs (ai/impl/<issue>)                                           │
│  ├── Project V2 #3 (Kanban: Backlog → Spec Ready → In Progress →    │
│  │                    In Review → Done)                              │
│  ├── GitHub App "ai-team-loop" (App ID 4472414)                      │
│  │   └── Permissions: Contents R/W, Issues R/W, Pull Requests R/W   │
│  ├── Secrets (APP_ID, APP_PRIVATE_KEY, CARAPACE_*, LEAD_REVIEW_PAT,│
│  │            TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ...)            │
│  └── Workflows                                                       │
│      ├── .github/workflows/ai-loop.yml (PO → Dev → Review → Fix)   │
│      ├── .github/workflows/ci.yml (lint + typecheck + test)         │
│      └── .github/workflows/deploy.yml (Netlify)                    │
│                                                                      │
│  Événements déclencheurs :                                           │
│  ├── issues.opened → PO-bot                                          │
│  ├── issues.labeled(feature|bug|user-story) → PO-bot                 │
│  ├── issues.labeled(ready-for-dev) → Dev-bot                        │
│  ├── pull_request.opened → Lead-Review-bot                          │
│  └── pull_request_review.submitted(CHANGES_REQUESTED) → Dev-fix     │
└─────────┬───────────────────────────────────────────┬───────────────┘
          │ 2. Workflow déclenche                       │
          │    SSH vers carapace                        │
          ▼                                            │
┌─────────────────────────────────────────────────────────────────────┐
│ VPS CONTABO "carapace" (109.199.97.174)                              │
│                                                                      │
│  /opt/ai-team-loop/                                                  │
│  ├── run-agent.py        ← Le cerveau des 3 bots (Python)            │
│  ├── config/config.toml  ← Profils LLM (po, dev, leaddev)            │
│  ├── private-key.pem     ← Clé privée GitHub App                     │
│  ├── .env                ← Tokens (GitHub App, Telegram, ...)        │
│  ├── logs/               ← Trace de chaque exécution                 │
│  ├── docker-compose.yml  ← OpenHands runtime + webhook-adapter       │
│  └── webhook-adapter/    ← Adaptateur GitHub webhook (port 8095)     │
│                                                                      │
│  Daemon Ollama (port 11434)                                         │
│  ├── glm-5.2:cloud        → PO + Dev (756B, ~3-60s par tâche)       │
│  └── qwen3.5:397b:cloud   → Lead-Review (397B, ~40-60s par review)  │
│      └── proxifie vers Ollama Cloud via keypair (pas de clé API)     │
│                                                                      │
│  Docker                                                              │
│  ├── openhands-runtime (port 3020) ← OpenHands UI                    │
│  └── webhook-adapter  (port 8095) ← Webhook GitHub (non accessible  │
│                                       de l'extérieur, relay via     │
│                                       GitHub Actions SSH)            │
│                                                                      │
│  Processus d'exécution :                                             │
│  1. GitHub Actions SSH → carapace                                    │
│  2. python3 run-agent.py <role> <issue> <repo>                       │
│  3. run-agent.py :                                                    │
│     a. Obtient un token GitHub App (JWT + installation token)        │
│     b. Récupère l'issue/PR via API GitHub                            │
│     c. Appelle le modèle Ollama (daemon local → cloud)               │
│     d. Pour le Dev : clone repo → /tmp/ai-team-XXXXX/ → écrit        │
│        fichiers → tsc + vitest (CI locale) → push → PR               │
│     e. Pour le Lead-Review : récupère diff → analyse → review         │
│     f. Déplace l'issue dans le Kanban (GraphQL)                      │
│     g. Notifie sur Telegram                                          │
│     h. Supprime le workspace temporaire                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ OLLAMA CLOUD (cloud.ollama.com)                                      │
│                                                                      │
│  Compte Pro ($20/mois)                                               │
│  ├── glm-5.2:cloud        (756B params, thinking, completion)        │
│  ├── qwen3.5:397b:cloud   (397B params, thinking, completion)        │
│  ├── kimi-k2.7-code:cloud (1T params — trop lent, abandonné)        │
│  └── deepseek-v4-pro:cloud (disponible, non utilisé)                 │
│                                                                      │
│  Accès : via daemon Ollama local sur carapace (keypair, pas de clé)  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TELEGRAM (@loop_engineering_team_bot)                                │
│                                                                      │
│  Token: 8705472898:AAH... (stocké en secret GitHub + .env carapace) │
│  Chat ID: 7211240214 (Yohann / Loïc Philogène)                       │
│                                                                      │
│  Notifications envoyées :                                             │
│  ├── 📋 PO : "Spec générée pour l'issue #X"                         │
│  ├── 🔧 Dev : "PR #X ouverte, N fichiers, CI validée"               │
│  ├── ✅ Dev-Fix : "Corrections poussées sur PR #X"                   │
│  ├── 👁 Lead Review : "Review postée — Décision: APPROVE/CHANGES"  │
│  └── 🎉 Merge : "PR #X merged, Issue #X close, Kanban → Done"       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Modèles par rôle

| Rôle | Modèle | Raison | Vitesse |
|---|---|---|---|
| PO | `glm-5.2:cloud` | Bon en rédaction de specs, rapide | ~3-22s |
| Dev | `glm-5.2:cloud` | Bon en code TDD, rapide (kimi-k2.7-code trop lent à 5min) | ~3-60s |
| Lead-Review | `qwen3.5:397b:cloud` | Excellent en raisonnement analytique, review de diff | ~40-60s |

### Pourquoi pas kimi-k2.7-code:cloud pour le Dev ?

`kimi-k2.7-code:cloud` (1T params) générait du code excellent mais mettait **5-10
minutes** par tâche, ce qui dépassait le timeout GitHub Actions (30 min) incluant la
CI locale. `glm-5.2:cloud` (756B) génère du code en **3-60s**, ce qui rentre dans le
timeout.

---

## Fichiers clés

| Fichier | Localisation | Rôle |
|---|---|---|
| `run-agent.py` | carapace `/opt/ai-team-loop/run-agent.py` | Script principal des 3 bots |
| `ai-loop.yml` | repo `.github/workflows/ai-loop.yml` | Workflow GitHub Actions (relay SSH) |
| `ci.yml` | repo `apps/todo/.github/workflows/ci.yml` | CI lint + typecheck + test |
| `deploy.yml` | repo `apps/todo/.github/workflows/deploy.yml` | CD Netlify |
| `AGENTS.md` | repo `apps/todo/AGENTS.md` | Instructions pour les agents |
| `config.toml` | carapace `/opt/ai-team-loop/config/config.toml` | Profils LLM |
| `docker-compose.yml` | carapace `/opt/ai-team-loop/docker-compose.yml` | Docker OpenHands + webhook |
| `.env` | carapace `/opt/ai-team-loop/.env` | Tokens et secrets |
| `LOOP_ENGINEERING_PLAN.md` | local `.agent/tasks/loop-engineering-todo-app-v2/` | Plan détaillé |
| `context.md` | local `.agent/tasks/loop-engineering-todo-app-v2/` | Contexte du projet |
| `todos.md` | local `.agent/tasks/loop-engineering-todo-app-v2/` | Suivi des tâches |
| `insights.md` | local `.agent/tasks/loop-engineering-todo-app-v2/` | Journal d'exécution |

---

## Coûts

| Poste | Coût |
|---|---|
| Ollama Cloud Pro | $20/mois |
| VPS Contabo carapace | $0 (existant) |
| GitHub App + Actions | $0 (tier gratuit) |
| Telegram Bot | $0 |
| **Total** | **$20/mois** |

---

## Limitations connues

1. **Timeout GitHub Actions** : 30 min max par job. `glm-5.2:cloud` est assez rapide
   pour rester sous cette limite.
2. **GitHub App ne peut pas reviewer ses propres PRs** : le Lead-Review utilise un PAT
   (Personal Access Token) pour poster les reviews.
3. **Kanban non-bloquant** : si le GraphQL échoue (permissions), l'agent continue sans
   crasher. Le Kanban peut nécessiter un ajout manuel de l'issue au projet.
4. **CI locale basique** : `tsc --noEmit` + `vitest run` uniquement. Pas de lint ESLint
   (car le scaffold n'a pas de config ESLint complète).
5. **Pas de persistance des workspaces** : le Dev-bot clone le repo à chaque fois, ne
   garde pas de contexte entre les exécutions.