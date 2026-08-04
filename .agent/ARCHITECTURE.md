# Architecture — Loop Engineering (ai-team)

## Vue d'ensemble

Le **loop engineering** est un workflow où 3 bots IA collaborent pour développer
une application : un **Product Owner** (planifie), un **Developer** (implémente),
et un **Lead Developer** (review et merge).

## Composants

### 1. Orchestrateur : Hermes Agent

- **Licence** : MIT (Nous Research)
- **Repo** : https://github.com/NousResearch/hermes-agent
- **Rôle** : Héberger les 3 profils (bots), gérer le cron, isoler via Docker
- **Déploiement** : VM 102 sur Precision (Proxmox, 2 vCPU, 4 Go RAM, 30 Go)
- **Installation** : `pip install hermes-agent` (v0.19.0)
- **Pourquoi pas VM 101** : déjà prise par openhands-vm (autre équipe)
- **Pourquoi pas VM 100** : déjà saturée (cubes sellers + Qdrant, 8 Go RAM)

### 2. Bots (3 profils Hermes)

| Bot | Modèle Ollama Cloud | Rôle | GitHub token |
|---|---|---|---|
| po-bot | minimax-m3:cloud (1M ctx) | User stories, GitHub Issues | PO (issues:write) |
| dev-bot | kimi-k2.7-code:cloud | TDD, code, PRs | DEV (contents:write, PRs:write) |
| lead-dev-bot | deepseek-v4-pro:cloud (1M ctx) | Code review, approve/merge | LEAD (reviews:write, merge) |

### 3. Isolation

Chaque bot est isolé par **2 couches** (Docker désactivé en pratique) :
1. **Hermes Profile** : `HERMES_HOME` séparé (config, .env, memory, sessions, skills)
2. **GitHub token** : actuellement 1 token partagé (YoLoADR), évolution vers GitHub App + 3 tokens

**Note** : Le Docker backend était prévu mais désactivé (`terminal.backend: local`)
car les bots ont besoin du `gh` CLI installé sur la VM pour interagir avec GitHub.
Le Docker backend aurait isolé le `gh` CLI du host.

### 3b. Bot Telegram (point d'entrée)

- **Script** : `telegram-bot.py` (python-telegram-bot v22, custom — pas le gateway Hermes)
- **Pourquoi pas le gateway Hermes** : l'adapter Telegram d'Hermes reste bloqué sur
  "Connecting to Telegram" (problème DoH + conflit polling). Script custom plus fiable.
- **Serveur** : Contabo (100.98.194.18) — service systemd `loop-engineering-bot.service`
- **Rôle** : reçoit les messages Telegram, route via SSH vers les bots sur Precision VM 102
- **Bot** : @loop_engineering_team_bot (créé via @BotFather)

### 4. Kanban : GitHub Issues + GitHub Project V2

- **Pas Hermes Kanban** — l'utilisateur veut GitHub natif
- Colonnes : `Todo → In Progress → In Review → Done`
- Labels : `user-story`, `bug`, `feature`, `tech-debt`, `needs-work`
- Les bots déplacent les issues via `gh issue edit` ou l'API GitHub

### 5. CI : GitHub Actions

- Déclenchée sur chaque PR
- Étapes : `npm ci → npm run lint → npm run typecheck → npm run test`
- La CI doit être verte avant que le Lead Dev ne review

### 6. LLMs : Ollama Cloud (Pro $20/mo)

- **Endpoint** : `https://ollama.com/v1` (OpenAI-compatible)
- **API key** : `f3bf130d...` (de `sellkit/.env`)
- **3 modèles** (limite du plan Pro = 3 modèles simultanés) :
  - minimax-m3:cloud (PO)
  - kimi-k2.7-code:cloud (Dev)
  - deepseek-v4-pro:cloud (Lead Dev)
- **Pas hydre-llm** — l'utilisateur a explicitement refusé
- **Pas Claude/GPT** — l'utilisateur veut uniquement Ollama Cloud

## Workflow Loop Engineering

```
┌─────────────────────────────────────────────────────────────┐
│                     HUMAIN                                  │
│  Crée une demande (feature, bug, idée)                      │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PO-BOT (minimax-m3:cloud, cron 1h)                         │
│  1. Analyse la demande                                      │
│  2. Rédige la user story (En tant que... je veux... afin...)│
│  3. Définit les critères d'acceptation (Given/When/Then)    │
│  4. Crée l'Issue GitHub + label "user-story"               │
│  5. Assigne à dev-bot                                       │
│  6. Ajoute au GitHub Project (colonne "Todo")               │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  DEV-BOT (kimi-k2.7-code:cloud, cron 30min)                 │
│  1. Lit l'issue assignée + critères d'acceptation          │
│  2. Crée branche : feature/<issue>-<slug>                   │
│  3. TDD RED : Écrit les tests d'abord (tests/api/)          │
│  4. TDD GREEN : Implémente le code minimum                  │
│  5. TDD REFACTOR : Améliore sans casser les tests           │
│  6. Vérifie : npm run typecheck && npm run test             │
│  7. git push + gh pr create (avec template PR)              │
│  8. Déplace l'issue → "In Review"                           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LEAD-DEV-BOT (deepseek-v4-pro:cloud, cron 30min)           │
│  1. Détecte les PRs sans review                             │
│  2. gh pr diff → analyse le code                             │
│  3. Checklist :                                              │
│     ✓ Conventions Next.js/TypeScript                        │
│     ✓ Tests couvrent les changements (TDD vérifié)          │
│     ✓ CI verte (lint + typecheck + test)                    │
│     ✓ Pas de secrets/credentials                            │
│     ✓ Critères d'acceptation vérifiés                       │
│     ✓ Validation Zod côté API                               │
│     ✓ Gestion d'erreurs (404, 400, 500)                    │
│  4. DÉCISION :                                              │
│     ├─ SI OK : approve + merge --squash + close issue       │
│     │         → Déplace issue → "Done"                      │
│     └─ SI KO : request-changes + commentaires              │
│               Format : file:line → problème → suggestion     │
│               → Label "needs-work" + réassigne dev-bot      │
└─────────────────────────────────────────────────────────────┘
```

## Infrastructure

```
Contabo (100.98.194.18, VPS Ubuntu 24.04, 8 Go RAM)
├── loop-engineering-bot.service (telegram-bot.py, python-telegram-bot v22)
├── tgc-qdrant (NON TOUCHÉ)
├── maya-dispatcher-maya-1 (NON TOUCHÉ)
└── maya-waha-maya-1 (NON TOUCHÉ)
    │ SSH → root@100.111.21.3
    ▼
Precision (Dell Tower 3420, Proxmox, 100.111.21.3, Xeon 4c/8t, 15 Go RAM)
├── VM 100 "ai-sales-vm" (NON TOUCHÉE — cubes sellers, 8 Go RAM)
├── VM 101 "openhands-vm" (NON TOUCHÉE — autre équipe, vide)
└── VM 102 "ai-agents-vm" (CELLE-CI)
    ├── OS : Ubuntu 24.04 Server (LXC container)
    ├── vCPU : 2, RAM : 4 Go, Disk : 30 Go
    ├── IP : 192.168.1.76
    ├── Hermes Agent v0.19.0 (pip install)
    ├── User : hermes
    ├── gh CLI : authentifié avec token YoLoADR
    ├── 3 profils Hermes :
    │   ├── po-bot       → minimax-m3:cloud    → Ollama Cloud → GitHub
    │   ├── dev-bot      → kimi-k2.7-code:cloud → Ollama Cloud → GitHub
    │   └── lead-dev-bot → deepseek-v4-pro:cloud → Ollama Cloud → GitHub
    └── Workspaces :
        ├── /home/hermes/repo/           → ai-team (git clone)
        └── /home/hermes/projects/
            └── ai-hirekit/              → ai-hirekit (git clone)
```

## Projets concernés

- **Pilote** : `todo-app/` — Next.js App Router, API First, TDD, SQLite
- **Pattern** : Merenza `.agent/tasks/` (context.md, PLAN.md, todos.md, insights.md)
- **Référence** : TGC `.agent/ARCHITECTURE.md.bak` (home-lab Proxmox + LLMs)

## Sécurité

- 🔒 API key Ollama Cloud dans `~/.hermes/.env` (chmod 600), jamais commitée
- 🔒 GitHub App tokens dans le `.env` de chaque profil, jamais commités
- 🔒 Hermes dangerous command approval : mode `smart` (aux LLM)
- 🔒 Docker backend : `--cap-drop ALL`, `no-new-privileges`, `pids-limit 256`, tmpfs
- 🔒 File write safety : `HERMES_WRITE_SAFE_ROOT` par profil
- 🔒 Pas de secrets dans les logs ni les commentaires GitHub