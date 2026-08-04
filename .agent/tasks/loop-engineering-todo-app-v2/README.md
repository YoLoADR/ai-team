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
6. **Qualité code Dev** : `glm-5.2:cloud` n'est pas spécialisé code. La CI échoue
   souvent (erreurs TypeScript). Le Dev-bot auto-fix mais ne réussit pas toujours.
   Trade-off accepté : vitesse (3-60s) vs qualité (kimi-k2.7-code: 5-10 min).

---

## Raisonnement et décisions de la session

Cette section reprend tous les choix clés faits pendant la session, avec leur
justification. C'est l'historique du "pourquoi".

### 1. Pourquoi pas Hermes (Nous Research) ?

**Recommandation initiale** : Hermes Agent (https://hermes-agent.nousresearch.com/).

**Décision** : Abandonné.

**Raisonnement** : Hermes est un agent **mono-utilisateur** avec auto-apprentissage de
skills. Son "loop engineering" est un mécanisme d'auto-amélioration des skills de
l'agent, **pas** un workflow multi-agent PO→Dev→LeadDev. Pour notre cas (3 rôles isolés
qui interagissent via GitHub), il manque :
- Support natif multi-agent avec workspaces isolés
- Plugin pr-review GitHub Actions
- Automations event-driven (issues, pull_request)

**Alternative choisie** : Stack maison (Python `run-agent.py` + GitHub Actions relay SSH)
car elle est plus légère, plus contrôlable, et ne dépend d'aucun framework externe.

### 2. Pourquoi OpenHands runtime sur carapace ?

**Décision** : OpenHands runtime self-hosted sur VPS Contabo « carapace ».

**Raisonnement** :
- carapace (109.199.97.174) est le VPS de lab+staging — déjà utilisé pour des
  expérimentations, Docker installé, daemon Ollama présent
- salameche (IONOS) est la prod intouchable (Guardian-Gateway)
- Precision héberge les cubes sellers (ai-sales) — risque de conflit ressources
- carapace a déjà Ollama 0.31.1 signé in, qui proxifie les modèles `:cloud` vers
  Ollama Cloud via keypair (pas de clé API à gérer)

**Évolution** : En pratique, OpenHands runtime tourne sur carapace (port 3020) mais
n'est pas utilisé directement. Le script `run-agent.py` fait tout le travail
(appel Ollama, API GitHub, clone, push, review). OpenHands sert juste d'UI de
monitoring.

### 3. Pourquoi glm-5.2:cloud pour le Dev (et pas kimi-k2.7-code) ?

**Décision initiale** : `kimi-k2.7-code:cloud` (1T params) pour le Dev car spécialisé
code.

**Décision finale** : `glm-5.2:cloud` (756B params) pour le Dev.

**Raisonnement** :
- `kimi-k2.7-code:cloud` générait du code **excellent** (12-15 fichiers TDD, 22000
  chars) mais mettait **5-10 minutes** par tâche
- GitHub Actions timeout = 30 min. Avec la CI locale (npm install + tsc + vitest),
  le total dépassait 30 min → run annulé
- `glm-5.2:cloud` génère du code en **3-60s** (60x plus rapide)
- Trade-off : glm-5.2 est moins précis en TypeScript (CI échoue souvent, erreurs
  d'imports) mais l'auto-fix + le loop dev-fix compensent
- L'utilisateur a suggéré "glm aurait été mieux" → confirmé par test (3.3s pour 518
  tokens vs 5 min pour kimi)

**Vitesse mesurée** :
- `glm-5.2:cloud` : 3.3s pour 518 tokens, ~3-60s pour générer 15 fichiers
- `kimi-k2.7-code:cloud` : 5-10 min pour générer 12-15 fichiers
- `qwen3.5:397b:cloud` : ~40s pour une review de diff

### 4. Pourquoi qwen3.5:397b:cloud pour le Lead-Review ?

**Décision initiale** : `qwen3-235b` — indisponible sur Ollama Cloud.

**Décision finale** : `qwen3.5:397b:cloud` (397B params).

**Raisonnement** :
- Modèles disponibles sur Ollama Cloud (découverts via `ollama show` sur carapace) :
  `glm-5.2:cloud`, `kimi-k2.7-code:cloud`, `qwen3.5:397b:cloud`, `kimi-k3:cloud`,
  `deepseek-v4-pro:cloud`, `mistral-large-3:675b:cloud`, `minimax-m3:cloud`
- `qwen3.5:397b:cloud` est le plus gros Qwen3 disponible (397B) — excellent en
  raisonnement analytique et review de diff
- Testé : review de 5610 chars en ~40s, avec analyse structurée (code quality, test
  coverage, spec compliance, security, performance)
- Décision `REQUEST_CHANGES` avec 7 corrections requises — exactement le
  comportement attendu d'un bon lead dev

### 5. Pourquoi pas plusieurs comptes GitHub ?

**Décision** : 1 seule GitHub App `ai-team-loop` + 1 PAT pour le Lead-Review.

**Raisonnement** :
- Bonne pratique 2026 : créer une GitHub App (pas plusieurs comptes personnels)
- L'App est installée UNIQUEMENT sur le repo `YoLoADR/ai-team` (isolation)
- Permissions : Contents R/W, Issues R/W, Pull Requests R/W
- **Problème découvert** : une GitHub App ne peut pas reviewer ses propres PRs
  (erreur 422 : "Review Can not request changes on your own pull request")
- **Solution** : le Lead-Review utilise un PAT (Personal Access Token) de l'utilisateur
  pour poster les reviews. Stocké en secret `LEAD_REVIEW_PAT`.

### 6. Pourquoi GitHub Actions relay SSH au lieu d'un webhook ?

**Décision initiale** : Webhook GitHub → carapace (port 8095).

**Décision finale** : GitHub Actions relay SSH vers carapace.

**Raisonnement** :
- Le port 8095 sur carapace n'est pas accessible depuis l'extérieur (pare-feu Contabo)
- Ouverture du port dans iptables mais Contabo bloque au niveau réseau
- Nginx sur carapace est en mode stream (SNI routing), pas HTTP — impossible
  d'ajouter un location block
- Solution : GitHub Actions workflow `ai-loop.yml` qui SSH vers carapace et exécute
  `run-agent.py`. Aucun port à ouvrir, utilise le port 22 (SSH) déjà ouvert.

**Avantage** : pas de tunnel, pas de Cloudflare, pas de port à ouvrir. Juste SSH.
**Inconvénient** : le workflow ne se déclenche pas pour les pushes de la GitHub App
  (GitHub ignore les events générés par l'App elle-même). Le Lead-Review doit être
  déclenché manuellement ou via `workflow_dispatch`.

### 7. Pourquoi la CI locale avant push ?

**Décision** : `validate_ci_local()` dans `run-agent.py` — `tsc --noEmit` + `vitest run`.

**Raisonnement** :
- Sans CI locale, le Dev-bot pousse du code qui échoue sur GitHub Actions CI →
  mauvaise qualité, le Lead-Review review du code cassé
- Avec CI locale : le Dev-bot détecte les erreurs avant push → auto-fix via LLM →
  re-validation → si toujours échec, push quand même pour review manuelle
- Trade-off : `npm install` prend ~2 min sur carapace (pas de cache), ce qui
  rallonge le temps total. Acceptable car glm-5.2 est rapide.

### 8. Pourquoi le dev-fix automatique ?

**Décision** : `pull_request_review` event déclenche le dev-fix automatiquement.

**Raisonnement** :
- Sans dev-fix : l'opérateur doit manuellement redemander au Dev de corriger après un
  `CHANGES_REQUESTED` → pas autonome
- Avec dev-fix : le workflow `pull_request_review` détecte `changes_requested` →
  déclenche `run-agent.py dev-fix <PR>` → lit les reviews, clone la branche, corrige,
  CI locale, push → le Lead-Review re-review → loop jusqu'à APPROVE
- Testé : le dev-fix s'est déclenché automatiquement après le CHANGES_REQUESTED du
  Lead-Review sur PR #6 (3 min)

### 9. Pourquoi les notifications Telegram ?

**Décision** : Bot Telegram `@loop_engineering_team_bot`.

**Raisonnement** :
- L'opérateur veut être notifié en temps réel sans surveiller GitHub
- Telegram Bot API est gratuite, simple, fiable
- Notifications à chaque étape : PO spec, Dev PR, Dev-fix, Lead Review, Merge
- Bot créé via BotFather sur Telegram web (Playwright)
- User ID récupéré via @userinfobot (7211240214)
- Token stocké en secret GitHub `TELEGRAM_BOT_TOKEN` + `.env` carapace

### 10. Pourquoi le Kanban GraphQL non-bloquant ?

**Décision** : `move_kanban()` via GraphQL Project V2, non-bloquant (try/except).

**Raisonnement** :
- Le token GitHub App n'a pas les permissions Project V2 (scope différent)
- Solution : utiliser le PAT pour GraphQL
- Si GraphQL échoue (permissions, réseau, etc.) → l'agent continue sans crasher
- Le Kanban est un "nice-to-have", pas un bloquant
- Testé : `Kanban: issue #5 moved to 'In Progress'` a fonctionné

### 11. Pourquoi pas Turso en prod (SQLite à la place) ?

**Décision** : SQLite local (Better-SQLite3) en dev, Turso en prod Netlify.

**Raisonnement** :
- SQLite local ne se déploie pas sur Netlify (serverless, pas de FS persistant)
- Turso est SQLite-compatible, plan gratuit, compte existant (Guardian-Portal)
- Migration triviale : changer `DATABASE_URL` en prod
- Pour le pilote : SQLite local suffit (valider le loop, pas la prod)

### 12. Pourquoi l'isolation (1 repo, 1 App, 1 dossier) ?

**Décision** : Isolation totale — 1 repo GitHub, 1 GitHub App, 1 dossier carapace.

**Raisonnement** :
- L'utilisateur a d'autres projets (TGC, merenza, sellkit, guardian-sales, etc.)
- Risque de conflit si les bots touchent d'autres repos
- L'App est installée UNIQUEMENT sur `YoLoADR/ai-team`
- Le script `run-agent.py` ne touche que ce repo
- Pour créer une autre équipe : nouveau repo + nouvelle App + nouveau dossier

---

## Historique de la session (2026-08-03/04)

### Phase 0 — Préparation
- Lecture de l'architecture TGC existante (`.agent/ARCHITECTURE.md.bak`)
- Recherche 2026 (mai-juillet) sur Hermes, OpenHands, alternatives multi-agent
- Découverte : Hermes ne convient pas (mono-utilisateur, pas multi-agent)
- Choix : OpenHands + stack maison Python + GitHub Actions relay
- Sauvegarde du plan v2 dans `.agent/tasks/loop-engineering-todo-app-v2/`
  (pattern merenza : context.md, LOOP_ENGINEERING_PLAN.md, todos.md, insights.md)

### Phase 1 — Infrastructure carapace
- SSH vers carapace (root@109.199.97.174)
- Docker + Docker Compose présents (29.1.3)
- Daemon Ollama 0.31.1 présent, signé in (proxifie vers Ollama Cloud)
- Modèles disponibles découverts : glm-5.2:cloud, kimi-k2.7-code:cloud, qwen3.5:397b:cloud
- Déploiement : OpenHands runtime (port 3020), webhook-adapter (port 8095)
- Tests de connectivité : PO OK, DEV OK, REVIEW OK

### Phase 2 — Scaffold Next.js
- Création de `apps/todo/` : Next.js 14, TypeScript, Tailwind, Better-SQLite3, Drizzle
- Vitest + React Testing Library + MSW configurés
- CI GitHub Actions (lint + typecheck + test) + CD Netlify
- Build + typecheck + tests passent localement

### Phase 3 — GitHub App + secrets
- Création de la GitHub App `ai-team-loop` (App ID 4472414) via Playwright
- Permissions : Contents R/W, Issues R/W, Pull Requests R/W
- Installation sur `YoLoADR/ai-team` uniquement
- Private key générée et stockée comme secret `APP_PRIVATE_KEY`
- 10 secrets configurés : APP_ID, APP_PRIVATE_KEY, CARAPACE_*, LEAD_REVIEW_PAT,
  OLLAMA_CLOUD_API_KEY, TELEGRAM_*, WEBHOOK_SECRET

### Phase 4 — Script run-agent.py
- Version 1 : script Bash `trigger-agent.sh` — PO postait en commentaire (pas de PR)
- Version 2 : script Python `run-agent.py` — Dev clone, crée branche, push, ouvre PR
- Version 3 (actuelle) : ajout dev-fix, CI locale, Kanban auto, Telegram

### Phase 5 — Tests et itérations
- Issue #1 : PO spec OK (9538 chars), Dev 12 fichiers PR #4, Review CHANGES_REQUESTED
- Issue #5 : PO spec OK (10401 chars), Dev 15 fichiers PR #6, Review CHANGES_REQUESTED
- Dev-fix automatique déclenché (pull_request_review event) — 3 min
- kimi-k2.7-code:cloud trop lent (5-10 min) → timeout GitHub Actions
- glm-5.2:cloud adopté pour le Dev (3-60s)
- Telegram notifié à chaque étape
- Kanban déplacé : In Progress → In Review

### Problèmes rencontrés et solutions

| Problème | Solution |
|---|---|
| Port 8095 inaccessible de l'extérieur (Contabo) | GitHub Actions relay SSH |
| GitHub App ne peut pas reviewer ses PRs (422) | PAT pour le Lead-Review |
| kimi-k2.7-code:cloud trop lent (5-10 min) | glm-5.2:cloud (3-60s) |
| SSH key non préservée dans GitHub Actions | Base64 encoding |
| Dev-bot pousse du code qui échoue CI | validate_ci_local() + auto-fix |
| Dev-bot ne corrige pas après CHANGES_REQUESTED | pull_request_review event + dev-fix |
| Kanban ne se met pas à jour | GraphQL PAT + non-bloquant |
| Push protection GitHub bloque le token OAuth | Suppression du commit via rebase |
| deepseek-coder-v2 indisponible sur Ollama Cloud | kimi-k2.7-code puis glm-5.2 |
| qwen3-235b indisponible sur Ollama Cloud | qwen3.5:397b:cloud |