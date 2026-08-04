# Context — Loop Engineering Todo App

> **Construit avec DeepSeek** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-03.

## Goal

Mettre en place l'approche **loop engineering** avec 3 bots IA (PO, Dev, Lead Dev)
qui planifient, développent et reviewent une application Todo en Next.js (API First + TDD),
en utilisant **GitHub Issues + GitHub Projects (Kanban)** pour le suivi des tâches.

Le but est de prouver que le workflow fonctionne sur un vrai mini-projet :
user story → tests → implémentation → review → merge.

## Périmètre (validé par l'utilisateur)

| Inclus | Exclu |
|---|---|
| Next.js App Router, API First | Authentification utilisateur |
| SQLite (better-sqlite3) + Drizzle ORM | Turso / DB cloud |
| TDD (Vitest + React Testing Library) | E2E (Cypress/Playwright) |
| CRUD todos + filtres + tri + priorités | Real-time / WebSockets |
| CI (lint, typecheck, test) GitHub Actions | Monitoring / Sentry |
| GitHub Issues + Project V2 (Kanban) | Notifications push |
| 3 bots Hermes : PO, Dev, Lead Dev | Netlify (non demandé) |
| Ollama Cloud uniquement (pas hydre-llm) | Claude, GPT |
| L'équipe crée le repo GitHub | |

## Stack technique (validée)

| Couche | Choix |
|---|---|
| Framework | Next.js 14+ App Router |
| Langage | TypeScript strict |
| API | Route Handlers (`app/api/**/route.ts`) — API First |
| Base de données | SQLite (better-sqlite3) + Drizzle ORM |
| Validation | Zod |
| Tests | Vitest + React Testing Library |
| UI | L'équipe décide (Tailwind simple ou shadcn/ui) |
| CI | GitHub Actions (lint, typecheck, test) |
| Kanban | GitHub Issues + GitHub Project V2 |
| Orchestration bots | Hermes Agent (3 profils + Docker backend) |
| LLM PO | minimax-m3:cloud (Ollama Cloud, 1M ctx) |
| LLM Dev | kimi-k2.7-code:cloud (Ollama Cloud, coding-focused) |
| LLM Lead Dev | deepseek-v4-pro:cloud (Ollama Cloud, 3 reasoning modes) |
| Hébergement bots | VM 102 sur Precision (Proxmox, 2 vCPU, 4 Go RAM, 30 Go) |

## Ollama Cloud — API key

- Source : `/Users/yohannravino/Factory/sellkit/.env`
- `OLLAMA_CLOUD_API_KEY=f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC`
- `OLLAMA_CLOUD_BASE_URL=https://ollama.com` (endpoint API : `https://ollama.com/v1`)

## Modèles Ollama Cloud retenus

| Bot | Modèle | Justification | Contexte |
|---|---|---|---|
| **PO** | `minimax-m3:cloud` | 1M context window — idéal pour specs + user stories détaillées | 1M |
| **Dev** | `kimi-k2.7-code:cloud` | "coding-focused agentic model, ~30% less thinking tokens, long-horizon coding" | 64k |
| **Lead Dev** | `deepseek-v4-pro:cloud` | "3 reasoning modes" + debugging fort + 1M ctx — le plus analytique | 1M |

Modèles exclus (petits) : qwen2.5:7b, gemma3:12b, gemma3:4b — l'utilisateur veut des modèles cloud ≥20B.

## Architecture cible

```
/Users/yohannravino/Factory/ai-team/
│
├── .agent/tasks/todo-app-loop-engineering/    # Ce plan + suivi
├── .agent/ARCHITECTURE.md                     # Architecture loop engineering
│
├── todo-app/                                  # Sous-projet Next.js Todo
│   ├── .github/workflows/ci.yml
│   ├── src/app/api/todos/
│   ├── src/app/components/
│   ├── src/lib/
│   ├── tests/
│   └── package.json
│
├── skills/                                    # Hermes Skills
│   ├── po-workflow/SKILL.md
│   ├── dev-tdd/SKILL.md
│   └── lead-review/SKILL.md
│
├── infra/                                     # Scripts déploiement
│   ├── vm-provision.sh
│   ├── hermes-profiles.sh
│   └── github-app-setup.md
│
└── note.md

Precision (Dell Tower 3420, Proxmox, 100.111.21.3)
└── VM 102 "ai-agents-vm" (2 vCPU, 4 Go RAM, 30 Go)
    ├── Hermes Gateway (cron + Telegram)
    ├── po-bot      (profile) → minimax-m3:cloud    → Docker sandbox → GH token PO
    ├── dev-bot     (profile) → kimi-k2.7-code:cloud → Docker sandbox → GH token DEV
    └── lead-dev-bot (profile) → deepseek-v4-pro:cloud → Docker sandbox → GH token LEAD

GitHub.com/<user>/ai-team
├── GitHub Project V2 (Kanban: Todo → In Progress → In Review → Done)
├── Issues (user stories, bugs, features)
├── Pull Requests (code + review)
└── GitHub Actions (CI: lint + typecheck + test)
```

## Workflow Loop Engineering

```
1. PO-BOT (cron 1h ou trigger manuel)
   → Analyse les demandes
   → Crée Issue GitHub "user-story" + label + assignee dev-bot
   → Ajoute au GitHub Project (colonne "Todo")
   → Commente avec critères d'acceptation

2. DEV-BOT (cron 30min ou trigger manuel)
   → Lit l'issue assignée
   → TDD: RED (tests d'abord) → GREEN (implémentation) → REFACTOR
   → npm run typecheck && npm run test
   → git push + gh pr create
   → Déplace l'issue → "In Review"

3. LEAD-DEV-BOT (cron 30min)
   → gh pr diff → analyse le code
   → Checklist: conventions, tests, CI, secrets, critères acceptation
   → SI OK: approve + merge + close issue → "Done"
   → SI KO: request-changes + comment file:line → suggestion + label "needs-work"
```

## Règles dures

- 🔒 Credentials Ollama Cloud, GitHub App → env vars, jamais commités
- 🔒 Pas de secrets dans les logs Hermes ni dans les commentaires GitHub
- ✅ TDD strict : tests écrits avant le code, jamais l'inverse
- ✅ Chaque PR doit passer la CI avant review Lead Dev
- ✅ Lead Dev doit donner des commentaires actionnables (file:line → problème → suggestion)
- 🚫 Pas d'utilisation d'hydre-llm : tout sur Ollama Cloud
- 🚫 Pas de Claude/GPT : uniquement minimax-m3, kimi-k2.7-code, deepseek-v4-pro
- 🚫 Pas de Turso : SQLite (better-sqlite3) uniquement
- 🚫 Pas de Netlify : non demandé

## Fichiers liés

- Plan détaillé : `PLAN.md` (ce dossier)
- Tâches : `todos.md` (ce dossier)
- Journal : `insights.md` (ce dossier)
- Architecture TGC de référence : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
- Catalogue Ollama Cloud : `/Users/yohannravino/Factory/TGC/ollama-cloud-modeles-2026-07.md`
- Note initiale : `/Users/yohannravino/Factory/ai-team/note.md`
- Pattern des tâches : `/Users/yohannravino/Factory/merenza/.agent/tasks/merenza-pilot-mvp/`
- API key Ollama Cloud : `/Users/yohannravino/Factory/sellkit/.env`