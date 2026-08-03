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
- **Déploiement** : VM 101 sur Precision (Proxmox, 4 vCPU, 6 Go RAM, 60 Go)

### 2. Bots (3 profils Hermes)

| Bot | Modèle Ollama Cloud | Rôle | GitHub token |
|---|---|---|---|
| po-bot | minimax-m3:cloud (1M ctx) | User stories, GitHub Issues | PO (issues:write) |
| dev-bot | kimi-k2.7-code:cloud | TDD, code, PRs | DEV (contents:write, PRs:write) |
| lead-dev-bot | deepseek-v4-pro:cloud (1M ctx) | Code review, approve/merge | LEAD (reviews:write, merge) |

### 3. Isolation

Chaque bot est isolé par **3 couches** :
1. **Hermes Profile** : `HERMES_HOME` séparé (config, .env, memory, sessions, skills)
2. **Docker terminal backend** : container dédié (`--cap-drop ALL`, `no-new-privileges`, tmpfs)
3. **GitHub token** : permissions distinctes par token machine (1 GitHub App, 3 tokens)

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
Precision (Dell Tower 3420, Proxmox, 100.111.21.3)
├── ai-sales-vm (VM 100, existante — cubes sellers)
└── ai-agents-vm (VM 101, NOUVELLE — bots Hermes)
    ├── OS : Ubuntu 24.04 Server
    ├── vCPU : 4 (partagés sur Xeon 4c/8t)
    ├── RAM : 6 Go (sur 15 Go total Precision)
    ├── Disk : 60 Go (sur 931 Go total)
    ├── Réseau : Tailscale (IP dédiée, egress uniquement)
    ├── Docker + Docker Compose
    ├── Hermes Agent (installé via curl)
    ├── Gateway Hermes (systemd service)
    ├── Profile po-bot      → Docker sandbox → Ollama Cloud → GitHub token PO
    ├── Profile dev-bot     → Docker sandbox → Ollama Cloud → GitHub token DEV
    └── Profile lead-dev-bot → Docker sandbox → Ollama Cloud → GitHub token LEAD
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