# apps/todo — Projet démo Loop Engineering

> ⚠️ Ce sous-projet doit être créé entièrement par les agents IA (PO, Dev, Lead Dev)
> dans le cadre du workflow loop engineering. Les humains et l'orchestrateur
> vérifient/corrigent les agents, mais ne produisent pas le code applicatif.

## Mission des agents

1. **Product Owner** : produit la spec technique (user stories Gherkin, API routes,
   schéma de données, critères d'acceptation) à partir d'une issue GitHub.
2. **Developer** : implémente le sous-projet en TDD (tests d'abord, code ensuite).
3. **Lead Developer** : review la PR, poste des commentaires actionnables et
   approuve ou demande des changements.

## Contraintes

- Stack : Next.js 14+ App Router, TypeScript, Tailwind CSS, Turso + Drizzle ORM,
  Vitest + React Testing Library + MSW.
- API-first : toute la logique métier expose des route handlers Next.js.
- TDD strict : chaque feature est accompagnée de tests qui passent.
- Déploiement : Netlify via GitHub Actions.
- Pas de Claude/GPT : utiliser `kimi-k2.6` (PO) et `deepseek-v4-pro` (Dev/Lead Dev)
  via Ollama Cloud.

## Plan de référence

Voir `.agent/tasks/loop-engineering-todo-app/LOOP_ENGINEERING_PLAN.md`.
