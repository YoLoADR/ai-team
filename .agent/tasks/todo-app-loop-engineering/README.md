# README — Loop Engineering Team (Hermes)

## Raisonnement et décisions clés

Cette section retrace le raisonnement qui a mené à chaque choix d'architecture.
Elle est issue de la session du 2026-08-03 entre Yohann et l'assistant.

### 1. Recommendation initiale : Hermes Agent

**Contexte** : Yohann veut mettre en place une approche loop engineering avec
3 bots (PO, Dev, Lead Dev). On lui a recommandé Hermes (Nous Research).

**Recherche effectuée** :
- Lecture de la doc Hermes (https://hermes-agent.nousresearch.com/) :
  architecture, profiles, kanban, skills, cron, terminal backends, security, gateway
- Lecture du repo GitHub (https://github.com/NousResearch/hermes-agent)
- Recherche d'alternatives (OpenHands, AutoCodeAI, etc.) en mai-juillet 2026

**Décision : Hermes Agent (pas OpenHands)**

Initialement, le premier plan proposait OpenHands comme orchestrateur. Après
relecture approfondie de la doc Hermes, il s'est avéré qu'Hermes a **déjà tout** :
- **Profiles** : agents isolés avec config, memory, sessions, skills, .env séparés
- **Kanban** : board SQLite durable, dispatcher, worker lifecycle, comments inter-agents
- **Skills** : SKILL.md pour définir les rôles PO, Dev, Lead Dev (procédure + pitfalls)
- **Cron** : automatisation (vérifier PRs, issues) en langage naturel
- **Docker backend** : isolation native par profil (--cap-drop ALL, no-new-privileges)
- **Gateway** : Telegram/Discord/Slack pour supervision humaine
- **Security** : 8 layers (approval, file write safety, container isolation, SSRF)

OpenHands aurait été une couche redondante. Hermes fait tout nativement.

### 2. Choix des modèles LLM (Ollama Cloud uniquement)

**Contraintes utilisateur** :
- Pas d'hydre-llm local (100.77.1.60) — refusé explicitement
- Pas de Claude, pas de GPT — uniquement Ollama Cloud
- Pas de petits modèles (qwen2.5:7b, gemma3:12b, gemma3:4b) — l'utilisateur veut des modèles ≥20B
- Compte Ollama Cloud Pro ($20/mo, 3 modèles simultanés max)

**Catalogue consulté** : `/Users/yohannravino/Factory/TGC/ollama-cloud-modeles-2026-07.md`
(16 modèles validés en juillet 2026)

**Décision : 3 modèles spécialisés par rôle**

| Bot | Modèle | Raisonnement |
|---|---|---|
| **PO** | `minimax-m3:cloud` | 1M context window — peut ingérer des specs entières et produire des user stories détaillées avec critères Given/When/Then. Meilleur pour la planification. |
| **Dev** | `kimi-k2.7-code:cloud` | "coding-focused agentic model, ~30% less thinking tokens, long-horizon coding" — le meilleur codeur du catalogue. Tool-calling fiable. |
| **Lead Dev** | `deepseek-v4-pro:cloud` | "3 reasoning modes" + debugging fort + 1M ctx — le plus analytique. Peut faire des reviews approfondies avec détection de bugs subtils. |

**Alternatives envisagées et écartées** :
- `qwen3.5:cloud` : polyvalent mais moins spécialisé que kimi pour le code
- `gpt-oss:120b-cloud` : gros mais moins performant que deepseek pour le debugging
- `gemma4:cloud` : pas assez testé pour la review

### 3. GitHub Issues (pas Hermes Kanban)

**Contrainte utilisateur** : "Utiliser Github Issue en mode Kanban pour le suivi
des tâches, fix et développement de feature."

**Décision : GitHub Issues + GitHub Project V2**

Raisonnement :
- GitHub Issues sont déjà intégrées avec le code (PRs linkent les issues)
- GitHub Projects fournit une vue Kanban native (Todo → In Progress → In Review → Done)
- Les bots interagissent via `gh` CLI (gh issue create, gh pr create, gh pr review)
- Pas besoin du Kanban Hermes — GitHub fait déjà le job
- Avantage : l'utilisateur peut voir et interagir avec le board directement sur GitHub

### 4. SQLite (pas Turso)

**Contrainte utilisateur** : "Oui pour SQLite."

**Décision : SQLite (better-sqlite3 + Drizzle ORM)**

Raisonnement :
- Zero config — pas de Docker pour la DB, pas de compte cloud
- Parfait pour un projet pilote (todo app)
- Drizzle ORM fournit le typage TypeScript et les migrations
- Un sous-agent avait proposé Turso, mais l'utilisateur a explicitement refusé

### 5. Projet pilote : Todo app Next.js API First + TDD

**Contrainte utilisateur** : "Je veux qu'on fasse un essai sur un mini projet
Next.js en mode API First avec l'approche TDD; une todoliste bien pensée comme
projet d'exemple."

**Décision : Todo app avec stack complète**

| Couche | Choix | Raisonnement |
|---|---|---|
| Framework | Next.js 14+ App Router | Demandé par l'utilisateur |
| API | Route Handlers (API First) | API testée avant l'UI |
| Tests | Vitest + React Testing Library | TDD strict : RED → GREEN → REFACTOR |
| Validation | Zod | Validation côté API obligatoire |
| DB | SQLite + Drizzle ORM | Demandé par l'utilisateur |
| UI | L'équipe décide | L'utilisateur veut voir comment les bots abordent la décision |

### 6. Recadrage : la todo app est le travail des agents, pas le mien

**Correction utilisateur** : "N'oublie pas que ce n'est pas à toi de créer la TODO
c'est à l'équipe d'agent en autonomie; toi tu vérifies et corriges les agents pas
la todo; la todo c'est à eux de le faire."

**Décision : mon rôle = infrastructure + vérification, pas le code**

Ce que je fais (moi) :
- Infrastructure : skills, GitHub config, scripts VM, bot Telegram
- Vérification : m'assurer que les bots travaillent correctement
- Correction : relancer les bots si nécessaire

Ce que les agents font (en autonomie) :
- PO bot : crée les user stories (GitHub Issues)
- Dev bot : implémente en TDD, crée les PRs
- Lead Dev bot : review, approve ou request changes, merge

### 7. Isolation des bots

**Contrainte utilisateur** : "Chaque bot doit être isolé pour éviter les conflits."

**Décision : 3 profils Hermes + terminal backend local**

Raisonnement :
- Chaque profil Hermes a son propre `config.yaml`, `.env`, `SOUL.md`, `skills/`
- Le terminal backend `local` permet aux bots d'utiliser le `gh` CLI installé sur la VM
- Le Docker backend aurait isolé davantage mais compliquait l'accès à `gh` CLI
- Compromis : isolation par profil (config, memory, sessions) + accès partagé à `gh`

**Note** : Le Docker backend est configuré dans les skills mais désactivé en pratique
(`terminal.backend: local`) car les bots ont besoin de `gh` CLI pour interagir avec GitHub.

### 8. Pas de multi-comptes GitHub

**Contrainte utilisateur** : "Est-ce que j'ai besoin de créer plusieurs comptes Github ?"

**Décision : 1 token GitHub partagé (YoLoADR)**

Raisonnement :
- Les ToS GitHub interdisent les comptes multiples pour une même personne
- Une GitHub App avec tokens machine serait la solution conforme
- En pratique, pour le pilote, le token YoLoADR est utilisé par les 3 bots
- Limite connue : GitHub bloque l'auto-approve (le token qui crée la PR ne peut
  pas approuver la même PR). Le Lead Dev utilise `--admin` pour merger directement.
- Évolution future : créer une GitHub App avec 3 tokens distincts (voir `infra/github-app-setup.md`)

### 9. Bot Telegram sur Contabo (pas sur Precision)

**Contrainte utilisateur** : "On peut les mettre sur Contabo" + "Attention n'écrase
pas les autres équipes dev."

**Décision : Bot Telegram sur Contabo, bots IA sur Precision VM 102**

Raisonnement :
- Contabo (100.98.194.18) a 6.6 Go RAM libre et 82 Go disque — suffisant pour un bot Python
- Precision est déjà chargé (VM 100: 8 Go, VM 101: 8 Go sur 15 Go total)
- Le bot Telegram est un simple routeur : il reçoit les messages et les envoie
  via SSH aux bots Hermes sur Precision
- Isolation garantie : le bot Telegram ne touche pas aux containers existants
  (tgc-qdrant, maya-dispatcher, maya-waha)

**Le gateway Hermes natif a échoué** : l'adapter Telegram d'Hermes reste bloqué
sur "Connecting to Telegram" (problème DoH + python-telegram-bot v22).
Solution : script Python custom (`telegram-bot.py`) avec python-telegram-bot v22
directement, sans passer par le gateway Hermes. Le script route les messages
via SSH vers les bots sur Precision.

### 10. VM 102 (pas VM 101, pas ai-sales-vm)

**Contrainte utilisateur** : "Je n'ai pas beaucoup de serveur libre."

**Décision : Nouvelle VM 102 sur Precision**

Raisonnement :
- VM 100 (ai-sales-vm) : déjà saturée (cubes sellers + Qdrant + Ollama, 8 Go RAM)
- VM 101 (openhands-vm) : déjà prise par une autre équipe (OpenHands)
- Nouvelle VM 102 : 2 vCPU, 4 Go RAM, 30 Go disk — suffisant pour Hermes + 3 profils
- Precision a 6.3 Go RAM disponible après ajout de la VM 102

### 11. Multi-projets sans conflit

**Contrainte utilisateur** : "Je veux que cette équipe m'aide sur le projet
ai-hirekit mais que je puisse lui donner aussi d'autres projets par la suite
sans créer de conflit."

**Décision : Dossiers séparés par projet sur la VM 102**

```
/home/hermes/
├── repo/                    → ai-team (projet principal)
└── projects/
    └── ai-hirekit/          → ai-hirekit (2e projet)
    └── <future-projet>/     → ajouté via add-project.sh
```

Raisonnement :
- Chaque projet a son propre dossier git clone
- Les bots utilisent `terminal.cwd` pour pointer vers le bon projet
- Les repos GitHub sont séparés (YoLoADR/ai-team, YoLoADR/ai-hirekit)
- Les branches git sont séparées (feature/<issue>-<slug>)
- Aucun partage de filesystem entre projets

---

## Où se trouve cette équipe ?

### Serveurs utilisés

| Serveur | IP | Rôle | VM/Service | Statut |
|---|---|---|---|---|
| **Precision** (Proxmox) | `100.111.21.3` | Héberge les bots IA | VM 102 `ai-agents-vm` | ✅ running |
| **Contabo** | `100.98.194.18` | Bot Telegram (point d'entrée) | service `loop-engineering-bot` | ✅ active |
| **Precision** (Proxmox) | `100.111.21.3` | Autre équipe (OpenHands) | VM 101 `openhands-vm` | ⚠️ vide, non déployée |

### Cette équipe vs les autres

| Équipe | VM | Serveur | Orchestrateur | Repo GitHub | Statut |
|---|---|---|---|---|---|
| **Loop Engineering (Hermes)** — *cette équipe* | VM 102 `ai-agents-vm` | Precision | Hermes Agent | `YoLoADR/ai-team` | ✅ active |
| OpenHands Team | VM 101 `openhands-vm` | Precision | OpenHands | (non créé) | ⚠️ vide |
| ai-sales-vm | VM 100 | Precision | Docker (cubes) | (non lié) | ✅ cubes sellers |
| Maya (WhatsApp) | Contabo | Contabo | Docker | (non lié) | ✅maya-waha |

**Isolation garantie** : chaque équipe a sa propre VM, son propre dossier, ses propres profils Hermes. Aucun partage de filesystem entre équipes.

## Architecture détaillée

```
┌─────────────────────────────────────────────────────────────┐
│                    TON TÉLÉPHONE / ORDINATEUR                │
│                                                              │
│  Telegram → @loop_engineering_team_bot                       │
│  CLI      → /Users/yohannravino/Factory/ai-team/delegate.sh  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              CONTABO (100.98.194.18)                         │
│              VPS Ubuntu 24.04, 8 Go RAM                      │
│                                                              │
│  Service systemd: loop-engineering-bot.service               │
│  Script: /opt/telegram-bot.py (python-telegram-bot v22)      │
│  Token: 8705472898:AAHBC3KCff...                             │
│                                                              │
│  Rôle: reçoit les messages Telegram, route via SSH vers      │
│  les bots Hermes sur Precision VM 102.                       │
│                                                              │
│  NE TOUCHE PAS AUX AUTRES SERVICES:                          │
│  - tgc-qdrant (Qdrant vector DB)                             │
│  - maya-dispatcher-maya-1 (WhatsApp bot)                     │
│  - maya-waha-maya-1 (WhatsApp API)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ SSH (ssh root@100.111.21.3)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PRECISION (100.111.21.3) — Proxmox              │
│              Dell Tower 3420, Xeon 4c/8t, 15 Go RAM          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  VM 102 "ai-agents-vm" (CELLE-CI)                       │  │
│  │  Ubuntu 24.04, 2 vCPU, 4 Go RAM, 30 Go disk             │  │
│  │  IP: 192.168.1.76                                       │  │
│  │                                                         │  │
│  │  Hermes Agent v0.19.0 (pip install)                     │  │
│  │  User: hermes                                           │  │
│  │                                                         │  │
│  │  3 PROFILS HERMES:                                      │  │
│  │  ├── po-bot       (minimax-m3:cloud)                    │  │
│  │  │   Rôle: user stories, GitHub Issues                  │  │
│  │  │   Skill: po-workflow/SKILL.md                        │  │
│  │  │   Config: ~/.hermes/profiles/po-bot/config.yaml      │  │
│  │  │   .env:   ~/.hermes/profiles/po-bot/.env             │  │
│  │  │   SOUL:   ~/.hermes/profiles/po-bot/SOUL.md          │  │
│  │  │                                                     │  │
│  │  ├── dev-bot      (kimi-k2.7-code:cloud)                │  │
│  │  │   Rôle: TDD, code, PRs                               │  │
│  │  │   Skill: dev-tdd/SKILL.md                            │  │
│  │  │   Config: ~/.hermes/profiles/dev-bot/config.yaml     │  │
│  │  │   .env:   ~/.hermes/profiles/dev-bot/.env            │  │
│  │  │                                                     │  │
│  │  └── lead-dev-bot (deepseek-v4-pro:cloud)               │  │
│  │      Rôle: code review, approve/merge                   │  │
│  │      Skill: lead-review/SKILL.md                        │  │
│  │      Config: ~/.hermes/profiles/lead-dev-bot/config.yaml│  │
│  │      .env:   ~/.hermes/profiles/lead-dev-bot/.env       │  │
│  │                                                         │  │
│  │  RÉPERTOIRES DE TRAVAIL:                                │  │
│  │  /home/hermes/repo/          → ai-team (git clone)      │  │
│  │  /home/hermes/projects/                                  │  │
│  │    └── ai-hirekit/           → ai-hirekit (git clone)   │  │
│  │                                                         │  │
│  │  gh CLI: authentifié avec ton token YoLoADR             │  │
│  │  git config: user "AI Team Bot"                         │  │
│  │                                                         │  │
│  │  SÉCURITÉ:                                              │  │
│  │  - Chaque profil a son propre .env (chmod 600)          │  │
│  │  - Terminal backend: local (pas Docker pour l'instant)  │  │
│  │  - Approvals mode: smart                                 │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  VM 100 "ai-sales-vm" (NON TOUCHÉE)                     │  │
│  │  8 Go RAM — cubes sellers (Kylian/Maya/Sonia/Bob)       │  │
│  │  + Qdrant + Ollama daemon                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  VM 101 "openhands-vm" (AUTRE ÉQUIPE — NON TOUCHÉE)     │  │
│  │  8 Go RAM — vide pour l'instant, non déployée           │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB (YoLoADR)                          │
│                                                              │
│  Repos manipulés par CETTE équipe:                           │
│  ├── YoLoADR/ai-team      (loop engineering + todo-app)     │
│  └── YoLoADR/ai-hirekit   (posting d'offres d'emploi)        │
│                                                              │
│  Repos NON touchés par cette équipe:                         │
│  ├── YoLoADR/TGC, guardian-sales, merenza-*...              │
│  └── (tous les autres repos)                                 │
│                                                              │
│  Token utilisé: gho_s88v4... (ton token YoLoADR)            │
│  Git config: "AI Team Bot" <yoloadr@users.noreply.github.com>│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              OLLAMA CLOUD (https://ollama.com/v1)            │
│              Compte Pro $20/mo                               │
│                                                              │
│  3 modèles utilisés (limite du plan = 3 simultanés):         │
│  ├── minimax-m3:cloud      → po-bot       (1M ctx, planning) │
│  ├── kimi-k2.7-code:cloud  → dev-bot      (coding-focused)   │
│  └── deepseek-v4-pro:cloud → lead-dev-bot (3 reasoning modes)│
│                                                              │
│  API key: f3bf130d... (de sellkit/.env)                     │
│  NE PAS utiliser hydre-llm (100.77.1.60) — refusé par user  │
└─────────────────────────────────────────────────────────────┘
```

## Répertoires de travail — où exactement

### Local (ton Mac)

```
/Users/yohannravino/Factory/ai-team/     ← CE DOSSIER (racine du projet)
├── .agent/tasks/todo-app-loop-engineering/   ← Plan + suivi (pattern Merenza)
├── .agent/ARCHITECTURE.md                    ← Ce README
├── .github/                                  ← CI, templates GitHub
├── skills/                                   ← Skills Hermes (procédures bots)
│   ├── po-workflow/SKILL.md
│   ├── dev-tdd/SKILL.md
│   └── lead-review/SKILL.md
├── infra/                                    ← Scripts déploiement
│   ├── vm-provision.sh
│   ├── hermes-profiles.sh
│   └── github-app-setup.md
├── apps/todo/                                ← Todo app (travail des agents)
├── delegate.sh                               ← CLI pour déléguer
├── add-project.sh                            ← Ajouter un projet
├── setup-telegram-bot.sh                     ← Setup bot Telegram
├── telegram-bot.py                           ← Bot Telegram (python-telegram-bot)
└── note.md                                   ← Notes
```

### VM 102 (Precision) — où les bots travaillent

```
/home/hermes/
├── repo/                      → clone de YoLoADR/ai-team (projet principal)
├── projects/
│   └── ai-hirekit/            → clone de YoLoADR/ai-hirekit (2e projet)
├── .hermes/
│   ├── profiles/
│   │   ├── po-bot/            → profil PO (config, .env, SOUL.md, skills)
│   │   ├── dev-bot/           → profil Dev
│   │   └── lead-dev-bot/      → profil Lead Dev
│   └── .env                   → secrets globaux (API keys)
└── .config/gh/hosts.yml       → auth GitHub (gh CLI)
```

### Contabo — où tourne le bot Telegram

```
/opt/telegram-bot.py                       → script Python du bot
/etc/systemd/system/loop-engineering-bot.service → service systemd
```

## Comment les bots travaillent sur un repo

1. **Le bot clone le repo** sur la VM 102 dans `/home/hermes/repo/` (ou `/home/hermes/projects/<name>/`)
2. **Le bot crée une branche** `feature/<issue>-<slug>`
3. **Le bot code** en TDD (tests d'abord, puis implémentation)
4. **Le bot push** sur GitHub via `gh` CLI (authentifié avec ton token)
5. **Le bot crée une PR** via `gh pr create`
6. **Le Lead Dev bot review** la PR via `gh pr diff` + `gh pr review`
7. **Le Lead Dev merge** via `gh pr merge --squash`

**Le code vit sur GitHub.** Le dossier local sur la VM 102 est un workspace de travail temporaire. Le résultat final est toujours sur GitHub.

## Comment ajouter un projet sans conflit

```bash
cd /Users/yohannravino/Factory/ai-team
./add-project.sh mon-projet YoLoADR/mon-projet
```

Ça clone le repo dans `/home/hermes/projects/mon-projet/` sur la VM 102.
Les autres projets ne sont pas touchés. Chaque projet a son propre dossier.

## Comment déléguer

### Via Telegram
```
@loop_engineering_team_bot
/delegate Projet: ai-hirekit — ajoute un filtre par catégorie
```

### Via CLI (ton Mac)
```bash
cd /Users/yohannravino/Factory/ai-team
./delegate.sh "Projet: ai-hirekit — ajoute un filtre par catégorie"
./delegate.sh --status
```

### Via SSH direct
```bash
ssh root@100.111.21.3 "pct exec 102 -- su - hermes -c 'po-bot chat -q \"votre demande\"'"
```

## Ce que cette équipe NE touche PAS

- ❌ VM 100 (ai-sales-vm) — cubes sellers
- ❌ VM 101 (openhands-vm) — autre équipe
- ❌ Contabo : tgc-qdrant, maya-dispatcher, maya-waha
- ❌ Repos GitHub autres que ai-team et ai-hirekit
- ❌ hydre-llm (100.77.1.60) — l'utilisateur a refusé
- ❌ Claude, GPT — l'utilisateur veut uniquement Ollama Cloud

## Vérification de l'isolation

```bash
# Vérifier que la VM 102 est isolée
ssh root@100.111.21.3 "pct exec 102 -- ls /home/hermes/repo/"

# Vérifier que la VM 101 n'est pas touchée
ssh root@100.111.21.3 "pct exec 101 -- ls /root/"

# Vérifier les services Contabo
ssh root@100.98.194.18 "docker ps --format '{{.Names}} {{.Status}}'"
```