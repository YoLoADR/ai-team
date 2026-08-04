# Context — Loop Engineering Todo App

## Goal

Mettre en place une approche **loop engineering** avec 3 bots IA (PO, Dev, Lead Dev)
qui planifient, développent et reviewent une application Todo en Next.js, de bout en
bout jusqu'au déploiement Netlify, en utilisant GitHub Issues comme Kanban.

Le but est de prouver que le workflow fonctionne sur un vrai mini-projet : spec →
implement → review → merge → deploy.

## Périmètre

| Inclus | Exclu |
|---|---|
| Next.js 14+ App Router API-First | Authentification utilisateur |
| Turso (libSQL) + Drizzle ORM | Multi-tenant |
| TDD (Vitest + React Testing Library + MSW) | E2E (Cypress/Playwright) |
| CRUD tasks + filtres + tri + priorités | Real-time / WebSockets |
| CI (lint, typecheck, test) + CD Netlify | Monitoring / Sentry |
| GitHub Project V2 Kanban + automations | Notifications push |
| 3 bots : PO (kimi-k2.6), Dev (deepseek-v4-pro), Lead Dev (deepseek-v4-pro) | |

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 14+ App Router |
| Langage | TypeScript strict |
| API | Route Handlers (`app/api/**/route.ts`) — API First |
| Base de données | Turso (libSQL) + Drizzle ORM |
| Tests | Vitest + React Testing Library + MSW |
| UI | Tailwind CSS + shadcn/ui |
| State client | SWR |
| CI | GitHub Actions (lint, typecheck, test) |
| CD | Netlify (auto-deploy sur merge main) |
| Kanban | GitHub Project V2 |
| Orchestration bots | OpenHands (Docker sur Precision) |
| LLM PO | kimi-k2.6 (Ollama Cloud) |
| LLM Dev | deepseek-v4-pro (Ollama Cloud) |
| LLM Lead Dev | deepseek-v4-pro (Ollama Cloud, prompt review) |

## Architecture cible

```
/Users/yohannravino/Factory/ai-team-cuba/
│
├── .agent/tasks/loop-engineering-todo-app/    # Ce plan + suivi
│
├── apps/
│   └── todo/                                  # Sous-projet Next.js Todo
│       ├── .github/workflows/                 # CI/CD spécifique
│       ├── app/api/
│       ├── components/
│       ├── lib/
│       ├── __tests__/
│       ├── netlify.toml
│       └── package.json
│
├── package.json (root ai-team)
└── pnpm-workspace.yaml / turbo.json (si monorepo)

Precision (Dell Tower 3420, Proxmox)
└── VM openhands-vm (NOUVELLE, 4 vCPU, 8 Go RAM, 40 Go disque)
    ├── Ubuntu 24.04 LTS
    ├── Docker + Docker Compose
    │   ├── openhands-backend (port 3000)
    │   └── openhands-frontend (port 8080)
    │
    ├── 3 workspaces Docker isolés:
    │   ├── ./workspaces/po     → workspace Product Owner
    │   ├── ./workspaces/dev    → workspace Developer
    │   └── ./workspaces/review → workspace Lead Developer
    │
    └── 3 profils LLM → Ollama Cloud Pro ($20/mo)

Ollama Cloud Pro
├── kimi-k2.6        → PO (70B, raisonnement long, spécifications)
└── deepseek-v4-pro  → Dev + Lead Dev (14B, coding + review)

GitHub
├── Repo: yohannravino/ai-team
├── GitHub App "ai-team-loop"
│   ├── Permissions: Pull Requests (R/W), Contents (R), Issues (R/W)
│   └── Webhook → http://openhands-vm:3000/api/github/webhook
│
├── GitHub Project V2 — Kanban (repo ai-team)
│   ├── Backlog → Spec Ready → In Progress → In Review → Done
│   └── Automations de mouvement entre colonnes
│
└── GitHub Actions
    ├── CI: lint + typecheck + test (sous-projet apps/todo)
    └── CD: deploy Netlify sur merge main

Netlify
└── Site prod: ai-team-todo.netlify.app (déploie apps/todo)
```

## Workflow Loop Engineering

```
1. Issue créée (label "feature" ou "bug")
   ↓
2. PO Agent (kimi-k2.6)
   → Analyse le besoin
   → Génère spec.md avec user stories (Gherkin)
   → Commit spec.md sur branche ai/spec/#{issue}
   → Poste un commentaire sur l'issue
   → Move l'issue → colonne "Spec Ready"
   ↓
3. Dev Agent (deepseek-v4-pro)
   → Lit la spec
   → Écrit les tests d'abord (TDD — red phase)
   → Implémente le code (green phase)
   → Lance la CI locale (lint + typecheck + test)
   → Commit + push sur branche ai/impl/#{issue}
   → Ouvre une PR vers main
   → Move l'issue → colonne "In Review"
   ↓
4. Lead Dev Agent (deepseek-v4-pro, prompt orienté review)
   → Récupère le diff de la PR
   → Analyse: code quality, test coverage, spec compliance, security, performance
   → Poste une review avec commentaires inline
   │
   ├── ✅ APPROVE
   │   ├── Merge automatique (après CI verte)
   │   ├── Move l'issue → colonne "Done"
   │   └── Déclenche CD → déploiement Netlify
   │
   └── ❌ REQUEST CHANGES
       ├── Commentaires actionnables sur quoi corriger
       ├── Move l'issue → colonne "In Progress"
       └── Le Dev reprend à l'étape 3
```

## Règles dures

- 🔒 Credentials Ollama Cloud, Turso, GitHub App, Netlify → env vars, jamais commités.
- 🔒 Pas de secrets dans les logs OpenHands ni dans les commentaires GitHub.
- ✅ TDD strict : tests écrits avant le code, jamais l'inverse.
- ✅ Chaque PR doit passer la CI (lint + typecheck + test) avant review Lead Dev.
- ✅ Lead Dev doit donner des commentaires actionnables, pas seulement un "LGTM".
- 🚫 Pas d'utilisation d'Hydre : tout tourne sur Precision et Ollama Cloud.
- 🚫 Pas de Claude/GPT : seuls kimi-k2.6 et deepseek-v4-pro (Ollama Cloud).

## Fichiers liés

- Plan détaillé : `LOOP_ENGINEERING_PLAN.md` (ce dossier)
- Tâches : `todos.md` (ce dossier)
- Journal : `insights.md` (ce dossier)
- Architecture TGC de référence : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
- Note initiale : `/Users/yohannravino/Factory/ai-team-cuba/note.md`
- Pattern des tâches : `/Users/yohannravino/Factory/merenza/.agent/tasks/merenza-pilot-mvp/`
