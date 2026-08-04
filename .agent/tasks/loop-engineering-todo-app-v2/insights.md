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
     workflow multi-agent PO→Dev→LeadDev.
   - OpenHands supporte nativement le multi-agent, les automations GitHub, et
     l'isolation par workspaces Docker.
   - carapuce est le VPS de lab+staging, ne touche pas à salameche (prod intouchable)
     ni à Precision (cubes sellers).

2. **LLM** : Ollama Cloud Pro ($20/mo)
   - **PO** : `glm-5.2` (modèle actuel de l'opérateur, bon en rédaction)
   - **Dev** : `glm-5.2 (Dev)` (spécialisé code)
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
| `glm-5.2 (Dev)` | Dev — code TDD |
| `qwen3.5:397b` | Lead-Review — analyse de diff, commentaires inline |
| `mistral-large-3:675b` | Fallback puissant, bon français |
| `minimax-m2.7` | Alternative coding |

## Contraintes techniques identifiées

- **Ollama Cloud Pro** : 3 modèles simultanés max.
  - PO (glm-5.2) + Dev (glm-5.2 (Dev)) + LeadDev (qwen3.5:397b) = 3 → au maximum.
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
- La qualité du code généré par glm-5.2:cloud (Dev) n'est pas optimale (CI échoue
  souvent). L'auto-fix aide mais ne résout pas tout. Itérer sur le prompt système.

## Raisonnement complet des décisions (session 2026-08-03/04)

### Hermes vs OpenHands vs stack maison

- **Hermes** : agent mono-utilisateur avec auto-apprentissage de skills. Pas un
  workflow multi-agent. Abandonné.
- **OpenHands** : supporte multi-agent, GitHub Actions, endpoint OpenAI-compatible.
  Déployé sur carapace (port 3020). En pratique, sert juste d'UI de monitoring.
- **Stack maison** (choisie) : `run-agent.py` (Python) + GitHub Actions relay SSH.
  Plus léger, plus contrôlable, aucune dépendance framework.

### Méthode d'accès Ollama Cloud

Découverte clé : pas besoin de clé API. Le daemon Ollama local sur carapace
(port 11434) proxifie les modèles `:cloud` vers Ollama Cloud via **keypair**
(même méthode que `ollama signin` sur les VPS). Testé : `curl localhost:11434/api/chat`
avec `model: "glm-5.2:cloud"` → fonctionne sans clé API.

### Port 8095 inaccessible → GitHub Actions relay

- carapace a un pare-feu Contabo qui bloque tous les ports sauf 22 (SSH)
- iptables ouvert pour 8095 mais Contabo bloque au niveau réseau
- Nginx en mode stream (SNI) — pas de location block possible
- Solution : GitHub Actions workflow SSH vers carapace → `run-agent.py`
- Aucun port à ouvrir, utilise SSH (port 22) déjà ouvert
- Inconvénient : les events générés par la GitHub App ne déclenchent pas de workflow
  (GitHub ignore les events de l'App elle-même). Le Lead-Review doit être déclenché
  manuellement ou via `workflow_dispatch`.

### GitHub App ne peut pas reviewer ses propres PRs

- Erreur 422 : "Review Can not request changes on your own pull request"
- La GitHub App crée les PRs (Dev-bot) → ne peut pas les reviewer (Lead-Review)
- Solution : le Lead-Review utilise un PAT (Personal Access Token) de l'utilisateur
  pour poster les reviews. Stocké en secret `LEAD_REVIEW_PAT` + `.env` carapace.

### Push protection GitHub bloque le token OAuth

- Un script `delegate.sh` contenait un token OAuth GitHub en clair
- GitHub push protection a bloqué le push
- Solution : `git rebase -i` pour supprimer le commit contenant le secret
- Le fichier a été supprimé du repo

### Évolution du script run-agent.py

1. **v1 Bash** (`trigger-agent.sh`) : PO postait en commentaire (pas de PR). Dev postait
   le code en commentaire (pas de PR). Limité.
2. **v2 Python** (`run-agent.py`) : Dev clone le repo, crée branche, écrit fichiers,
   push, ouvre PR. Lead-Review récupère le diff réel, analyse, poste review.
3. **v3 Python** (actuelle) : ajout dev-fix (lit reviews, corrige, push), CI locale
   (tsc + vitest), Kanban auto (GraphQL), notifications Telegram.

### Tests du loop complet

| Test | Issue | PO | Dev | Review | Dev-fix | Durée totale |
|---|---|---|---|---|---|---|
| #1 (kimi) | #1 | ✅ 9538 chars | ✅ 12 fichiers PR #4 | ✅ CHANGES_REQUESTED | ❌ pas testé | ~20 min |
| #2 (glm) | #5 | ✅ 10401 chars | ✅ 15 fichiers PR #6 | ✅ CHANGES_REQUESTED | ✅ 3 min | ~15 min |

### Notifications Telegram

- Bot `@loop_engineering_team_bot` créé via BotFather (Playwright sur Telegram web)
- User ID récupéré via @userinfobot (7211240214)
- `send_telegram()` dans `run-agent.py` : notifie à chaque événement
- Première notification testée manuellement depuis carapace → reçu sur Telegram ✅
- Notifications automatiques testées : PO spec ✅, Review ✅ (Telegram notifié)
- Note : certaines notifications Telegram échouent (400) quand le message contient des
  caractères Markdown non échappés. À corriger.