# README — Loop Engineering Team (Hermes)

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