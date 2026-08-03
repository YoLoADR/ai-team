# Insights — Loop Engineering Todo App

## Contexte utilisateur (session 2026-08-03)

Yohann veut mettre en place une approche **loop engineering** avec 3 bots IA qui
planifient (PO), développent (Dev) et reviewent (Lead Dev) ses applications.
Il a été recommandé Hermes Agent (Nous Research) pour l'orchestration.

## Contraintes identifiées

1. **LLMs** : Ollama Cloud uniquement (compte Pro $20/mo). Pas d'hydre-llm local.
   - API key : `f3bf130d...` (trouvée dans `sellkit/.env`)
   - Endpoint : `https://ollama.com/v1`
   - Petits modèles exclus (qwen2.5:7b, gemma3:12b, gemma3:4b)

2. **Kanban** : GitHub Issues + GitHub Project V2 (pas Hermes Kanban).
   - L'utilisateur veut utiliser GitHub nativement pour le suivi des tâches.
   - Colonnes : Todo → In Progress → In Review → Done

3. **DB** : SQLite (better-sqlite3 + Drizzle). Pas de Turso.
   - L'utilisateur a confirmé SQLite explicitement.

4. **UI** : L'équipe décide. L'utilisateur veut voir comment les bots abordent
   la décision (Tailwind simple vs shadcn/ui).

5. **Repo GitHub** : L'équipe (bots) doit créer le repo avec les credentials
   de l'utilisateur.

6. **Projet pilote** : Todo app Next.js App Router, API First, TDD (Vitest).
   - "Une todoliste bien pensée comme projet d'exemple"

## Décisions clés

### Orchestrateur : Hermes Agent (pas OpenHands)

Initialement, le premier plan proposait OpenHands. Après relecture approfondie
de la doc Hermes, il s'est avéré qu'Hermes a **déjà tout** :
- **Profiles** (agents isolés avec config, memory, sessions, skills, .env)
- **Kanban** (board multi-agents) — non utilisé ici (GitHub Issues à la place)
- **Skills** (SKILL.md pour définir les rôles PO, Dev, Lead Dev)
- **Cron** (automatisation : vérifier PRs, issues)
- **Docker backend** (isolation native par profil)
- **Gateway** (Telegram/Discord pour supervision humaine)
- **Security** (dangerous command approval, container hardening)

OpenHands aurait été une couche redondante.

### Modèles par rôle (Ollama Cloud)

| Bot | Modèle | Raison |
|---|---|---|
| PO | `minimax-m3:cloud` | 1M context window — idéal pour specs + user stories |
| Dev | `kimi-k2.7-code:cloud` | "coding-focused agentic model" — meilleur codeur |
| Lead Dev | `deepseek-v4-pro:cloud` | "3 reasoning modes" + debugging fort — le plus analytique |

### Isolation : Hermes Profiles + Docker backend

Chaque bot est un **profil Hermes** avec :
- Son propre `config.yaml`, `.env`, `SOUL.md`
- Son propre modèle Ollama Cloud
- Son propre token GitHub (GitHub App machine token)
- Son propre container Docker (terminal backend)
- Isolation filesystem, processus, réseau

### GitHub : 1 App + 3 tokens (pas de multi-comptes)

Les ToS GitHub interdisent les comptes multiples pour une même personne.
Une GitHub App avec 3 tokens machine (PO, DEV, LEAD) est la solution conforme.

## Architecture de référence

- Architecture TGC : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
  - Home-lab Proxmox : Hydre (ThinkPad W541, 15 Go) + Precision (Dell Tower 3420, 15 Go, 931 Go SSD)
  - VPS : IONOS (prod), Contabo (lab)
  - LLMs : hydre-llm (local, non utilisé ici) + Ollama Cloud (utilisé ici)
  - Brain : _brain/ avec hot.md, log.md, wiki/decisions (29 ADRs)
  - .agent/tasks/ avec 18 tasks (pattern PLAN.md/todos.md/insights.md)

- Pattern Merenza : `/Users/yohannravino/Factory/merenza/.agent/tasks/merenza-pilot-mvp/`
  - Structure : context.md, PILOT_MVP_PLAN.md, todos.md, insights.md
  - Anti-tricherie : `[x]` exige une preuve concrète

## Journal d'exécution

### 2026-08-03 — Phase 0 (documentation)

- Lecture approfondie de la doc Hermes :
  - Architecture : 18 providers, 7 terminal backends, gateway multi-plateforme
  - Delegation : `delegate_task` avec contexte isolé, batch parallèle, model override
  - Kanban : board SQLite durable, dispatcher, worker lifecycle, comments inter-agents
  - Profiles : HERMES_HOME isolé, config/memory/sessions/skills/cron séparés
  - Security : 8 layers (approval, file write safety, container isolation, SSRF, etc.)
  - Cron : natural language scheduling, skill-backed, delivery multi-plateforme
  - Skills : SKILL.md (frontmatter + procédure + pitfalls + verification)

- Lecture de l'existant TGC :
  - `ollama-cloud-modeles-2026-07.md` : catalogue 16 modèles validés
  - `ARCHITECTURE.md.bak` : home-lab Proxmox + VPS + LLMs
  - `.agent/tasks/` : 18 tasks avec pattern PLAN/todos/insights

- Lecture du pattern Merenza :
  - `merenza-pilot-mvp/PILOT_MVP_PLAN.md` : structure détaillée
  - `merenza-pilot-mvp/context.md` : goal, périmètre, stack, règles
  - `merenza-pilot-mvp/todos.md` : anti-tricherie avec preuves
  - `merenza-pilot-mvp/insights.md` : journal d'exécution + découvertes

- API key Ollama Cloud trouvée dans `sellkit/.env` :
  - `f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC`
  - Base URL : `https://ollama.com`

- Décision : Hermes (pas OpenHands) — possède déjà profiles, kanban, skills, cron, docker

- Un sous-agent a créé un plan alternatif (OpenHands + Turso) dans
  `loop-engineering-todo-app/`. Ce plan est incorrect (OpenHands au lieu d'Hermes,
  Turso au lieu de SQLite). Le plan canonique est dans `todo-app-loop-engineering/`.