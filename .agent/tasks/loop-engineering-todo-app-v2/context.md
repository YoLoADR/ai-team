# Context — Loop Engineering Todo App v2

## Goal

Mettre en place une approche **loop engineering** avec 3 bots IA (PO, Dev, Lead Dev)
qui planifient, développent et reviewent une application Todo en Next.js, de bout en
bout jusqu'au déploiement Netlify, en utilisant GitHub Issues comme Kanban.

Le but est de prouver que le workflow fonctionne sur un vrai mini-projet : spec →
implement → review → merge → deploy.

**Important** : la TODO du projet todolist (user stories, tâches de dev) est gérée par
l'équipe d'agents en autonomie (PO, Dev, Lead-Review). Le rôle de l'opérateur
(Yohann / assistant Claude) est de vérifier et corriger les agents, pas de rédiger
la TODO à leur place. Ce présent document ne trace que les tâches de setup/infra
nécessaires pour mettre en place l'environnement des agents.

## Différences avec la v1 (`loop-engineering-todo-app/`)

| Aspect | v1 (existant) | v2 (ce plan) |
|---|---|---|
| LLM PO | kimi-k2.6 | glm-5.2 (Ollama Cloud) |
| LLM Dev | deepseek-v4-pro | glm-5.2 (Ollama Cloud) — kimi-k2.7-code abandonné (trop lent 5-10min) |
| LLM Lead-Review | deepseek-v4-pro | qwen3.5:397b (Ollama Cloud) — qwen3-235b indisponible |
| Hébergement | Precision (conflit cubes sellers) | VPS Contabo « carapace » (lab+staging) |
| Stockage | Turso | SQLite local (Better-SQLite3) |
| Scope | 3 issues figées | 5 user stories décidées par le PO-bot |
| Automations | YAML inventé | OpenHands runtime + webhook-adapter Node.js |
| Déploiement | Non défini | Netlify dès le pilote |
| TODO | Prédéfinit les stories | Laisser l'équipe d'agents décider |

## Périmètre

| Inclus | Exclu |
|---|---|
| Next.js 14+ App Router API-First | Authentification utilisateur |
| SQLite local (Better-SQLite3) + Drizzle ORM | Multi-tenant |
| TDD (Vitest + React Testing Library + MSW) + tests d'intégration | E2E (Cypress/Playwright) |
| CRUD tasks + filtres + tri + priorités | Real-time / WebSockets |
| CI (lint, typecheck, test) + CD Netlify | Monitoring / Sentry |
| GitHub Project V2 Kanban + automations | Notifications push |
| 3 bots : PO (glm-5.2), Dev (kimi-k2.7-code), Lead Dev (qwen3.5:397b) | |

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 14+ App Router |
| Langage | TypeScript strict |
| API | Route Handlers (`app/api/**/route.ts`) — API First |
| Base de données | SQLite local (Better-SQLite3) + Drizzle ORM |
| Tests | Vitest + React Testing Library + MSW + tests d'intégration |
| UI | Tailwind CSS + shadcn/ui |
| State client | SWR |
| CI | GitHub Actions (lint, typecheck, test) |
| CD | Netlify (auto-deploy sur merge main) |
| Kanban | GitHub Project V2 |
| Orchestration bots | OpenHands runtime self-hosted (Docker sur carapace) |
| LLM PO | glm-5.2 (Ollama Cloud) |
| LLM Dev | glm-5.2 (Ollama Cloud) — kimi-k2.7-code abandonné (trop lent 5-10min, timeout GitHub Actions 30min) |
| LLM Lead Dev | qwen3.5:397b (Ollama Cloud) — qwen3-235b indisponible, qwen3.5:397b est le plus gros Qwen3 dispo |

## Architecture cible

```
/Users/yohannravino/Factory/ai-team/        # Repo local
├── .agent/tasks/loop-engineering-todo-app-v2/  # Ce plan (comparaison avec v1)
├── apps/todo/                              # Sous-projet pilote Next.js Todo
│   ├── .github/workflows/                  # CI/CD spécifique
│   ├── app/api/tasks/                      # API-first route handlers
│   ├── components/                         # TaskList, TaskForm, TaskItem, Filters
│   ├── lib/db/                             # Better-SQLite3 + schema
│   ├── __tests__/                          # Vitest + RTL + MSW + intégration
│   ├── netlify.toml
│   └── package.json
└── README.md

VPS Contabo « carapace » (109.199.97.174)
└── Docker Compose
    ├── openhands-runtime                   # OpenHands headless (port 3000)
    ├── webhook-adapter                     # Node.js : GitHub webhook → OpenHands API
    ├── workspace-po                        # Volume isolé PO (glm-5.2)
    ├── workspace-dev                       # Volume isolé Dev (glm-5.2)
    └── workspace-review                    # Volume isolé Lead-Review (qwen3.5:397b)

Ollama Cloud (https://ollama.com/api/v1)
├── glm-5.2            → PO + Dev (rédaction user stories Gherkin + code TDD)
└── qwen3.5:397b       → Lead-Review (analyse de diff, commentaires inline)

GitHub
├── Repo: yohannravino/ai-team (créé par script setup)
├── GitHub App "ai-team-loop" (1 App, 3 bot-identities)
│   ├── po-bot       : issues write, contents read
│   ├── dev-bot      : contents write, pull-requests write
│   └── review-bot   : pull-requests write, issues write
├── GitHub Project V2 Kanban (5 colonnes)
│   Backlog → Spec Ready → In Progress → In Review → Done
└── Secrets: OLLAMA_CLOUD_API_KEY, GITHUB_APP_PRIVATE_KEY, NETLIFY_*

Netlify
└── Site prod: ai-team-todo.netlify.app (déploie apps/todo après merge main)
```

## Workflow Loop Engineering

```
1. Vous créez une issue "Todolist API-first TDD" avec vos instructions
   ↓
2. PO-bot (glm-5.2) analyse → génère 5 user stories en Gherkin
   → commit spec.md sur branche ai/spec/#{issue}
   → commente sur l'issue → move → "Spec Ready"
   ↓
3. Dev-bot (glm-5.2) lit la spec
   → écrit les tests d'abord (red phase)
   → implémente (green phase)
   → lance CI locale (tsc + vitest)
   → si CI échoue → auto-fix via LLM → re-valide
   → push sur branche ai/impl/#{issue} → ouvre PR
   → move → "In Progress" → Telegram notifie 🔧
   ↓
4. Lead-Review-bot (qwen3.5:397b) récupère le diff
   → analyse : qualité, couverture tests, conformité spec, sécurité, perf
   → poste review avec commentaires inline
   → Telegram notifie 👁
   ├── APPROVE → merge auto → move "Done" → Telegram notifie 🎉
   └── REQUEST_CHANGES → Telegram notifie ⚠️
       → pull_request_review event → Dev-fix automatique
       → Dev-fix lit reviews, corrige, CI locale, push → Telegram notifie ✅
       → Lead-Review re-review → loop jusqu'à APPROVE
```

## Règles dures

- 🔒 Credentials Ollama Cloud, GitHub App, Netlify → env vars / secrets GitHub, jamais commités.
- 🔒 Pas de secrets dans les logs OpenHands ni dans les commentaires GitHub.
- ✅ TDD strict : tests écrits avant le code, jamais l'inverse.
- ✅ Chaque PR doit passer la CI (lint + typecheck + test) avant review Lead Dev.
- ✅ Lead Dev doit donner des commentaires actionnables, pas seulement un "LGTM".
- ✅ La TODO du projet todolist est gérée par les agents (PO/Dev/Lead), pas par l'opérateur.
- 🚫 Pas d'utilisation d'Hydre : tout tourne sur carapace et Ollama Cloud.
- 🚫 Pas de Claude/GPT : seuls glm-5.2 (PO+Dev), qwen3.5:397b (Lead-Review) via Ollama Cloud.
- 🚫 Pas de kimi-k2.7-code:cloud pour le Dev (trop lent 5-10min, timeout GitHub Actions).

## Fichiers liés

- Plan détaillé : `LOOP_ENGINEERING_PLAN.md` (ce dossier)
- Tâches setup/infra : `todos.md` (ce dossier — uniquement setup, pas les user stories)
- Journal : `insights.md` (ce dossier)
- Architecture TGC de référence : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
- Note initiale : `/Users/yohannravino/Factory/ai-team/note.md`
- Pattern des tâches : `/Users/yohannravino/Factory/merenza/.agent/tasks/merenza-pilot-mvp/`
- Plan v1 (comparaison) : `/Users/yohannravino/Factory/ai-team/.agent/tasks/loop-engineering-todo-app/`