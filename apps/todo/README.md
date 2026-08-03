# apps/todo — Projet démo Loop Engineering v2

> Ce sous-projet est développé par les agents IA (PO, Dev, Lead Dev) dans le cadre
> du workflow loop engineering. L'opérateur vérifie et corrige les agents, mais ne
> produit pas le code applicatif ni la TODO du projet.

## Mission des agents

1. **Product Owner** (glm-5.2) : produit la spec technique (user stories Gherkin,
   API routes, schéma de données, critères d'acceptation) à partir d'une issue GitHub.
2. **Developer** (kimi-k2.7-code) : implémente le sous-projet en TDD (tests d'abord,
   code ensuite).
3. **Lead Developer** (qwen3.5:397b) : review la PR, poste des commentaires actionnables
   et approuve ou demande des changements.

## Contraintes

- Stack : Next.js 14+ App Router, TypeScript, Tailwind CSS, SQLite local (Better-SQLite3)
  + Drizzle ORM, Vitest + React Testing Library + MSW.
- API-first : toute la logique métier expose des route handlers Next.js.
- TDD strict : chaque feature est accompagnée de tests qui passent.
- Déploiement : Netlify via GitHub Actions (Turso en prod pour persistance).
- Pas de Claude/GPT : utiliser glm-5.2 (PO), kimi-k2.7-code (Dev), qwen3.5:397b
  (Lead-Review) via Ollama Cloud.

## Plan de référence

Voir `.agent/tasks/loop-engineering-todo-app-v2/LOOP_ENGINEERING_PLAN.md`.