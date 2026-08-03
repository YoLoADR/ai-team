# Insights — Loop Engineering Todo App v2

## Contexte utilisateur (session 2026-08-03)

Yohann veut expérimenter l'approche **loop engineering** avec des bots IA jouant les
rôles de Product Owner, Développeur et Lead Développeur. Il dispose d'un home-lab
avec plusieurs machines (Precision, Contabo carapuce, IONOS salameche) et d'un compte
Ollama Cloud Pro. Il veut éviter Claude/GPT ainsi que les petits modèles locaux
(gemma3, qwen2.5:7b). Il veut tester le workflow sur un mini projet Next.js API-first
en TDD, avec déploiement Netlify.

## Décisions clés de la session

1. **Orchestration** : OpenHands runtime self-hosted sur VPS Contabo « carapace »
   - Hermes est un agent mono-utilisateur avec auto-apprentissage de skills, pas un
     workflow multi-agent PO→Dev→LeadDev.
   - OpenHands supporte nativement le multi-agent, les automations GitHub, et
     l'isolation par workspaces Docker.
   - carapuce est le VPS de lab+staging, ne touche pas à salameche (prod intouchable)
     ni à Precision (cubes sellers).

2. **LLM** : Ollama Cloud Pro ($20/mo)
   - **PO** : `glm-5.2` (modèle actuel de l'opérateur, bon en rédaction)
   - **Dev** : `kimi-k2.7-code` (spécialisé code)
   - **Lead Dev** : `qwen3.5:397b` (excellent en raisonnement analytique, review de diff)
   - Ollama Cloud est OpenAI-compatible via `https://ollama.com/api/v1`.

3. **Hébergement** : VPS Contabo « carapace » (109.199.97.174)
   - Docker Compose pour OpenHands runtime + webhook-adapter + 3 workspaces.
   - Pas d'utilisation d'Hydre.

4. **Isolation** : 3 workspaces Docker séparés (po/, dev/, review/)
   - Chaque bot a son propre volume monté.
   - Pas de mémoire partagée entre les rôles.

5. **GitHub** : 1 seule GitHub App (`ai-team-loop`) + 3 bot-identities
   - Pas besoin de créer plusieurs comptes GitHub (bonne pratique 2026).
   - Permissions fines par bot-identity : po-bot (issues write), dev-bot (contents write),
     review-bot (pull-requests write).

6. **Kanban** : GitHub Project V2
   - Colonnes : Backlog → Spec Ready → In Progress → In Review → Done.
   - Mouvements automatiques via OpenHands + workflow GitHub Actions.

7. **Projet démo** : Todo App Next.js
   - API-first : route handlers Next.js.
   - TDD : Vitest + React Testing Library + MSW + tests d'intégration.
   - DB : SQLite local (Better-SQLite3) en dev, Turso en prod Netlify.
   - CD : Netlify.

8. **Scope** : 5 user stories décidées par le PO-bot
   - L'opérateur ne prédéfinit pas les stories, il laisse l'équipe d'agents décider.
   - Rôle de l'opérateur : vérifier et corriger les agents, pas rédiger la TODO.

9. **Sauvegarde** : Nouveau dossier `loop-engineering-todo-app-v2/` (pas d'écrasement
   de la v1) pour comparaison.

## Modèles Ollama Cloud disponibles (compte Pro)

| Modèle | Usage potentiel |
|---|---|
| `glm-5.2` | PO — rédaction user stories, specs |
| `kimi-k2.7-code` | Dev — code TDD |
| `qwen3.5:397b` | Lead-Review — analyse de diff, commentaires inline |
| `mistral-large-3:675b` | Fallback puissant, bon français |
| `minimax-m2.7` | Alternative coding |

## Contraintes techniques identifiées

- **Ollama Cloud Pro** : 3 modèles simultanés max.
  - PO (glm-5.2) + Dev (kimi-k2.7-code) + LeadDev (qwen3.5:397b) = 3 → au maximum.
  - Si un 4ème rôle est ajouté, il faudra upgrader vers Max ($100/mo) ou séquencer.

- **Rate limits Pro** : ~2.5M tokens/session, ~14M/semaine.
  - Une PR complexe ≈ 50-100K tokens.
  - Budget confortable pour ~25-50 PRs/semaine.

- **OpenHands** : runtime self-hosted.
  - Docs parfois lacunaires sur les automations avancées.
  - Webhook GitHub non natif → adapter Node.js minimal (webhook-adapter).
  - Fallback possible : orchestrateur Python custom avec LangGraph + API Ollama Cloud.

- **qwen3.5:397b** : modèle 235B, potentiellement coûteux en tokens.
  - Mitigation : limiter le contexte du diff à review (pas tout le repo).

- **Netlify + SQLite** : SQLite local ne se déploie pas en serverless.
  - Solution : SQLite en dev, Turso en prod (compte existant via Guardian-Portal).

## Journal d'exécution

### 2026-08-03 — Analyse initiale et plan v2

- Lecture de l'architecture TGC : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
- Recherche approfondie sur Hermes vs OpenHands, Ollama Cloud, alternatives 2026.
- Découverte : Hermes ne convient pas pour le multi-agent PO→Dev→LeadDev.
- Choix final : OpenHands + Ollama Cloud + carapace + Netlify.
- Identification des incohérences du plan v1 (modèles obsolètes, hébergement mauvais,
  YAML inventé, TDD non respecté, etc.).
- Création des 4 documents de plan dans `.agent/tasks/loop-engineering-todo-app-v2/`.

## Reste à faire

- Créer le repo GitHub et le GitHub App.
- Déployer OpenHands sur carapace.
- Construire le scaffold du projet Todo Next.js.
- Lancer le loop engineering et vérifier les agents.
- Itérer sur les prompts système.

## Risques ouverts

- L'intégration OpenHands ↔ GitHub Project V2 n'est pas totalement documentée dans
  les détails. Il faudra probablement tester et ajuster.
- La review automatique par qwen3.5:397b pourrait manquer de nuance. À itérer.
- Le déploiement Netlify d'une app Next.js avec routes API + SQLite doit être validé
  (variables d'environnement, cold starts) — basculer vers Turso en prod.