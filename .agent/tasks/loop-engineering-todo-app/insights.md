# Insights — Loop Engineering Todo App

## Contexte utilisateur (session 2026-08-03)

Yohann veut expérimenter l'approche **loop engineering** avec des bots IA jouant les
rôles de Product Owner, Développeur et Lead Développeur. Il dispose d'un home-lab avec
Precision (Dell Tower 3420, Proxmox), d'un compte Ollama Cloud Pro, et veut éviter
Claude/GPT ainsi que les petits modèles locaux (gemma3, qwen2.5:7b). Il veut tester le
workflow sur un mini projet Next.js API-first en TDD, avec déploiement Netlify.

## Décisions clés de la session

1. **Orchestration** : OpenHands (pas Hermes)
   - Hermes est un agent **mono-utilisateur** avec auto-apprentissage.
   - Son "loop engineering" est un mécanisme d'auto-amélioration des skills, pas un
     workflow multi-agent PO → Dev → Lead Dev.
   - OpenHands supporte nativement le multi-agent, les automations GitHub, et
     l'isolation par backend/workspaces.

2. **LLM** : Ollama Cloud Pro ($20/mo)
   - **PO** : `kimi-k2.6` (70B, raisonnement long, spécifications)
   - **Dev** : `deepseek-v4-pro` (14B, coding)
   - **Lead Dev** : `deepseek-v4-pro` (14B, prompt orienté review)
   - Ollama Cloud est **OpenAI-compatible** via `https://ollama.com/api/v1`.

3. **Hébergement** : Precision uniquement (pas Hydre)
   - Nouvelle VM `openhands-vm` sur Proxmox.
   - Docker Compose pour OpenHands.

4. **Isolation** : 3 workspaces Docker séparés (po/, dev/, review/)
   - Chaque bot a son propre volume monté.
   - Pas de mémoire partagée entre les rôles.

5. **GitHub** : 1 seule GitHub App (`ai-team-loop`)
   - Pas besoin de créer plusieurs comptes GitHub.
   - Permissions fines : PR R/W, Contents R, Issues R/W.

6. **Kanban** : GitHub Project V2
   - Colonnes : Backlog → Spec Ready → In Progress → In Review → Done.
   - Mouvements automatiques via OpenHands + workflow GitHub Actions.

7. **Projet démo** : Todo App Next.js
   - API-first : route handlers Next.js.
   - TDD : Vitest + React Testing Library + MSW.
   - DB : Turso (libSQL) + Drizzle ORM.
   - CD : Netlify.

## Modèles Ollama Cloud disponibles (compte Pro)

| Modèle | Usage potentiel |
|---|---|
| `kimi-k2.6` | PO — raisonnement long, specs |
| `deepseek-v4-pro` | Dev + Lead Dev — coding + review |
| `deepseek-v4-flash` | Fallback rapide |
| `minimax-m2.7` | Alternative coding |
| `gpt-oss:20b` / `gpt-oss:120b` | Fallback général |
| `mistral-large-3:675b` | Très puissant, bon français |

## Contraintes techniques identifiées

- **Ollama Cloud Pro** : 3 modèles simultanés max.
  - PO (kimi) + Dev (deepseek) + LeadDev (deepseek) = 3 → au maximum.
  - Si un 4ème rôle est ajouté, il faudra upgrader vers Max ($100/mo) ou séquencer.

- **Rate limits Pro** : ~2.5M tokens/session, ~14M/semaine.
  - Une PR complexe ≈ 50-100K tokens.
  - Budget confortable pour ~25-50 PRs/semaine.

- **OpenHands** : outil récent (Agent Canvas).
  - Docs parfois lacunaires sur les automations avancées.
  - Fallback possible : orchestrateur Python custom avec LangGraph + API Ollama Cloud.

- **deepseek-v4-pro** : bon en code, mais probablement inférieur à Claude/GPT-4o pour
  la qualité de review. Mitigation : prompts système très détaillés et check-list
  structurée.

- **Turso** : base SQLite edge. Le tier gratuit suffit pour une todo demo.

## Journal d'exécution

### 2026-08-03 — Analyse initiale et plan

- Lecture de l'architecture TGC : `/Users/yohannravino/Factory/TGC/.agent/ARCHITECTURE.md.bak`
- Recherche approfondie sur Hermes vs OpenHands, Ollama Cloud, alternatives.
- Découverte : Hermes ne convient pas pour le multi-agent PO→Dev→LeadDev.
- Choix final : OpenHands + Ollama Cloud + Precision + Netlify.
- Création des 4 documents de plan dans `.agent/tasks/loop-engineering-todo-app/`.

## Reste à faire

- Créer le repo GitHub et le GitHub App.
- Déployer OpenHands sur Precision.
- Construire le projet Todo Next.js.
- Tester le workflow complet sur 3 issues.
- Itérer sur les prompts système.

## Risques ouverts

- L'intégration OpenHands ↔ GitHub Project V2 n'est pas totalement documentée dans
  les détails. Il faudra probablement tester et ajuster.
- La review automatique par deepseek-v4-pro pourrait manquer de nuance. À itérer.
- Le déploiement Netlify d'une app Next.js avec routes API + Turso doit être validé
  (variables d'environnement, cold starts).
