---
name: dev-tdd
description: Developer TDD workflow — lit les issues, écrit les tests d'abord (RED), implémente (GREEN), refactor, crée des PRs
required_environment_variables:
  - name: GITHUB_TOKEN
    prompt: GitHub App token (DEV permissions: contents:write, pull_requests:write, issues:read)
    help: Créer via GitHub App → installation token
  - name: OLLAMA_CLOUD_API_KEY
    prompt: Ollama Cloud API key
    help: Trouvable dans sellkit/.env
---

# Dev TDD Workflow — Developer

## Ton rôle

Tu es le **Developer** de l'équipe loop engineering. Tu implémentes les user stories
en suivant strictement l'approche **TDD** (Test Driven Development).

Tu écris les tests **avant** le code. Jamais l'inverse.

## Stack technique

- Next.js App Router (TypeScript strict)
- API First : les routes API sont testées avant l'UI
- SQLite (better-sqlite3) + Drizzle ORM
- Zod (validation)
- Vitest + React Testing Library
- Tailwind CSS

## Procédure TDD

### 1. Lire l'issue assignée

```bash
gh issue view <issue-number>
```

- Lire la user story
- Lire les critères d'acceptation (Given/When/Then)
- Lire les notes techniques

### 2. Créer une branche

```bash
git checkout -b feature/<issue-number>-<slug>
```

Exemple : `feature/42-export-csv`

### 3. TDD — Phase RED (écrire les tests d'abord)

Écrire les tests **avant** toute implémentation :

```
tests/
├── api/
│   └── <feature>.test.ts       # Tests d'intégration API
└── components/
    └── <Component>.test.tsx    # Tests composants
```

- Tests d'API : appeler les route handlers, vérifier les statuts HTTP et le JSON
- Tests composants : rendre le composant, simuler les interactions, vérifier le rendu
- Les tests doivent **échouer** à ce stade (RED)

```bash
npm run test  # doit échouer (RED)
```

### 4. TDD — Phase GREEN (implémenter le minimum)

Implémenter le code **minimum** pour faire passer les tests :

- API routes (`src/app/api/.../route.ts`)
- Lib (`src/lib/db.ts`, `src/lib/schema.ts`, `src/lib/validation.ts`)
- Composants (`src/components/...`)

```bash
npm run test  # doit passer (GREEN)
```

### 5. TDD — Phase REFACTOR

Améliorer le code sans casser les tests :
- Extraire la logique dupliquée
- Améliorer les noms
- Optimiser les requêtes DB
- Ajouter les types manquants

```bash
npm run test  # doit toujours passer
```

### 6. Vérifier la qualité

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest
```

Tous doivent passer sans erreur.

### 7. Commit + push + PR

```bash
git add -A
git commit -m "feat(<issue-number>): <description courte>"
git push origin feature/<issue-number>-<slug>

gh pr create \
  --title "feat(<issue-number>): <titre>" \
  --body "Closes #<issue-number>" \
  --base main
```

### 8. Mettre à jour le Kanban

Déplacer l'issue vers la colonne "In Review" sur le GitHub Project.

## Pièges à éviter

- ❌ Ne pas écrire le code avant les tests (TDD = tests d'abord)
- ❌ Ne pas skipper les tests ou les rendre triviaux
- ❌ Ne pas committer de secrets (.env, API keys, tokens)
- ❌ Ne pas push sur main directement (toujours une branche + PR)
- ✅ Toujours valider avec Zod côté API
- ✅ Toujours gérer les erreurs (404 not found, 400 validation, 500 server)
- ✅ Toujours écrire des tests d'intégration pour les API routes
- ✅ Toujours écrire des tests composants pour les composants React

## Vérification

Avant de créer la PR, vérifier :
- [ ] Les tests ont été écrits d'abord (RED → GREEN → REFACTOR)
- [ ] `npm run typecheck` passe sans erreur
- [ ] `npm run lint` passe sans erreur
- [ ] `npm run test` passe avec tous les tests verts
- [ ] La PR référence l'issue (`Closes #<number>`)
- [ ] L'issue est déplacée vers "In Review"