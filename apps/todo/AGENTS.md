# AGENTS.md — Instructions pour l'équipe loop engineering v2

## Mission

Créer une application Todo moderne en Next.js 14+ (App Router), API-first, avec TDD
strict, déployée sur Netlify.

## Architecture obligatoire

```
apps/todo/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts              # GET (list) + POST (create)
│   │       └── [id]/
│   │           └── route.ts          # GET, PATCH, DELETE
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   ├── TaskItem.tsx
│   └── Filters.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts                 # Better-SQLite3 + Drizzle client
│   │   ├── schema.ts                 # Tables Drizzle
│   │   └── migrations/
│   ├── hooks/
│   │   └── useTasks.ts               # SWR hooks
│   └── validators.ts                # Zod schemas
├── __tests__/
│   ├── api/tasks.test.ts             # Tests intégration API
│   ├── components/TaskList.test.tsx
│   └── components/TaskForm.test.tsx
├── netlify.toml
├── vitest.config.ts
├── drizzle.config.ts
├── next.config.mjs
├── package.json
├── .env.example
└── README.md
```

## Stack obligatoire

| Couche | Technologie |
|---|---|
| Framework | Next.js 14+ App Router |
| Langage | TypeScript strict |
| Style | Tailwind CSS |
| UI components | shadcn/ui |
| Base de données | SQLite local (Better-SQLite3) en dev, Turso en prod Netlify |
| ORM | Drizzle ORM |
| Tests | Vitest + React Testing Library + MSW + tests d'intégration |
| State client | SWR |
| Validation | Zod |

## Règles de l'équipe

### Product Owner (glm-5.2)
- Analyse la demande et crée une issue GitHub structurée.
- Format user story : `En tant que ..., je veux ..., afin de ...`.
- Critères d'acceptation obligatoires au format Given/When/Then.
- Notes techniques : routes API, composants, validation.
- **Ne jamais écrire de code.**

### Developer (kimi-k2.7-code)
- Travaille en TDD strict : tests rouges avant code.
- Implémente les route handlers API d'abord, puis les composants.
- Utilise Drizzle + Better-SQLite3 pour la persistence (dev).
- Valide les entrées API avec Zod.
- Lance `npm run lint`, `npx tsc --noEmit` et `npm run test` avant de pusher.
- Crée une branche `ai/impl/#NUMERO-issue` et ouvre une PR vers `main`.

### Lead Developer (qwen3.5:397b)
- Review la PR en analysant :
  1. Qualité du code (style, patterns, complexité)
  2. Couverture de tests (présents ? passent ?)
  3. Conformité à la spec
  4. Sécurité (validation, injection SQL, etc.)
  5. Performance (N+1, bundle size)
- Poste des commentaires actionnables inline.
- **Refuse la PR** (`REQUEST_CHANGES`) si les tests manquent ou échouent.
- **Approuve** (`APPROVE`) uniquement si CI verte + critères OK.

## Workflow

1. PO crée une issue avec label `user-story`.
2. Dev implémente en TDD sur `ai/impl/#NUMERO`.
3. Dev ouvre une PR et lie l'issue (`Closes #NUMERO`).
4. Lead Dev review et approuve/refuse.
5. Si approuvé, merge auto via GitHub Actions + déploiement Netlify.

## Variables d'environnement

```bash
# Ollama Cloud (agents)
OLLAMA_CLOUD_API_KEY=
OLLAMA_CLOUD_BASE_URL=https://ollama.com/api/v1

# Turso (prod Netlify uniquement)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

Voir `.env.example` pour le template.

## Contraintes dures

- ❌ Pas de Claude/GPT : utiliser glm-5.2 (PO), kimi-k2.7-code (Dev), qwen3.5:397b (Lead-Review).
- ❌ Pas d'hébergement local des LLMs : utiliser Ollama Cloud.
- ❌ Pas d'Hydre : orchestration via OpenHands sur VPS Contabo « carapace ».
- ✅ Tout le code testé par Vitest (unit + intégration).
- ✅ TDD strict : tests écrits avant le code.
- ✅ Aucun secret commité.