# Insights — AI Teams Alignment

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.

## Session 2026-08-04 — Alignement des équipes Caraïbes

### Contexte

Yohann a 3 équipes de dev IA qui fonctionnent avec des moteurs et stratégies
différents mais partagent l'infra (Precision VM 102, Contabo, Ollama Cloud).
Il veut les aligner au niveau GitHub + Telegram uniquement, sans toucher aux
moteurs ni aux stratégies. Il veut aussi des noms explicites (caraibéens) pour
mieux se repérer quand il s'adresse aux équipes.

### Décisions

1. **Noms des équipes** : Cuba (v2, OpenHands), Haiti (v1, Hermes), Guyane (hirekit, Hermes)
   - Cuba = la plus structurée (CD, webhook, GitHub App, run-agent.py)
   - Haiti = pionnière (premier loop complet validé : Issue #2 → PR #3 → merge)
   - Guyane = exploration (A/B testing 4 modèles, browser automation Playwright)

2. **Noms des membres** : prénoms caribéens, titre conservé
   - Cuba : Yanet (PO), Raúl (Dev), Camila (Lead) — glm-5.2 + qwen3.5:397b
   - Haiti : Jean-Marc (PO), Mireille (Dev), Frantz (Lead) — minimax + kimi + deepseek
   - Guyane : Léopold (Recon), Manon (Poster), Sylviane (Review) — 4 modèles A/B

3. **Modèles mis en avant** : visible dans AGENTS.md, context.md, ALIGNMENT_PLAN.md
   - Cuba : glm-5.2 (PO+Dev) + qwen3.5:397b (Lead) — construit avec DeepSeek
   - Haiti : minimax-m3 (PO) + kimi-k2.7-code (Dev) + deepseek-v4-pro (Lead) — construit avec DeepSeek
   - Guyane : 4 modèles A/B (kimi, glm, minimax, deepseek) — construit avec Kimi+GLM

4. **Kanban motherboard** : un seul Project V2 agrège les 3 équipes avec champ `Équipe`
   - Permet de suivre et commenter depuis une seule vue
   - Chaque équipe reste indépendante dans son repo
   - Workflow `motherboard.yml` ajoute automatiquement les issues au Project V2

5. **Double canal commentaires** : GitHub + Telegram déclenchent les agents
   - GitHub : issue_comment.created → cuba-loop.yml → SSH → agent
   - Telegram : /cuba-dev "message" → telegram-bot.py → agent → répond sur GitHub + Telegram

6. **Séparation ai-loop v1 et v2** : deux workflows distincts dans ai-team
   - cuba-loop.yml existant gère Cuba (v2, carapace, OpenHands) — non modifié
   - haiti-loop.yml nouveau gère Haiti (v1, VM 102, Hermes) — créé

### Exécution

#### Fichiers créés

| Fichier | Rôle | Lignes |
|---|---|---|
| `ai-team/.agent/tasks/ai-teams-alignment/context.md` | Contexte de la tâche (pattern Merenza) | ~80 |
| `ai-team/.agent/tasks/ai-teams-alignment/ALIGNMENT_PLAN.md` | Plan détaillé | ~180 |
| `ai-team/.agent/tasks/ai-teams-alignment/todos.md` | Suivi des tâches avec preuves | ~70 |
| `ai-team/.agent/tasks/ai-teams-alignment/insights.md` | Ce fichier — journal d'exécution | ~80 |
| `ai-hirekit/AGENTS.md` | Instructions pour l'équipe Guyane | ~80 |
| `ai-hirekit/.github/workflows/guyane-loop.yml` | Relay GitHub Actions pour Guyane | ~115 |
| `ai-team/.github/workflows/haiti-loop.yml` | Relay GitHub Actions pour Haiti | ~115 |
| `ai-team/.github/workflows/motherboard.yml` | Kanban motherboard unifié | ~130 |

#### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `ai-team/telegram-bot.py` | Réécrit : commandes préfixées Cuba/Haiti/Guyane, alias legacy, /teams, /motherboard |

#### Détails d'implémentation

**telegram-bot.py** :
- Structure refondue avec dictionnaire `TEAMS` pour les 3 équipes
- Fonction `make_team_handler(team_key, role)` génère les handlers dynamiquement
- `send_to_hermes_bot` route vers VM 102 (Haiti, Guyane)
- `send_to_carapace_agent` route vers carapace (Cuba)
- Anciennes commandes (/po, /dev, /lead, /delegate) gardées en alias → Cuba
- Commandes /teams et /motherboard ajoutées pour la vue globale

**cuba-loop.yml (Guyane)** :
- Trigger `issue_comment.created` → route vers agent selon labels
- Trigger `issues.labeled` → recon, poster, review, dev selon label
- Trigger `pull_request.opened` → review agent (Sylviane)
- Trigger `pull_request_review.submitted` → dev si CHANGES_REQUESTED, leaddev si APPROVED
- Filtre anti-boucle : skip si auteur contient "bot" ou "ai-team-loop" ou "hirekit-poster"
- Notification Telegram à la fin avec format `[guyane] [EMOJI] [action] — issue #N`

**haiti-loop.yml (Haiti)** :
- Mêmes triggers que cuba-loop.yml (Cuba) mais route vers VM 102 Hermes
- Profils : po-bot (Jean-Marc/minimax), dev-bot (Mireille/kimi), lead-dev-bot (Frantz/deepseek)
- Filtre : skip bots mais garde commentaires de YoLoADR (opérateur)
- Route les commentaires vers le bon agent selon les labels de l'issue
- Notification Telegram avec format `[haiti] [EMOJI] [action] — issue #N`

**motherboard.yml** :
- Écoute les issues/PRs de tous les repos (ai-team, ai-hirekit)
- Ajoute les items au Project V2 "AI Teams" via GraphQL
- Champ custom `Équipe` : cuba, haiti, ou guyane (déduit du repo + labels)
- Colonnes : Backlog → Spec Ready → In Progress → In Review → Done
- Notification Telegram à chaque sync

### Actions manuelles restantes (pour Yohann)

1. Créer le Project V2 "AI Teams" sur GitHub
2. Récupérer les IDs GraphQL (PROJECT_ID, STATUS_FIELD_ID, TEAM_FIELD_ID)
3. Configurer les secrets GitHub (MOTHERBOARD_*, VM102_SSH_KEY_B64)
4. Déployer telegram-bot.py sur Contabo (scp + restart service)
5. Tester : créer une issue de test dans chaque repo

### Découvertes

- Les 3 équipes partagent déjà le même bot Telegram et les mêmes serveurs — l'alignement se fait naturellement au niveau du routage
- Le motherboard Kanban nécessite un PAT avec permission `projects:write` (le GITHUB_TOKEN par défaut ne suffit pas pour Project V2 cross-repo)
- Les workflows cuba-loop.yml existent déjà pour Cuba (ai-team/.github/workflows/cuba-loop.yml) — il fallait juste ajouter haiti-loop.yml pour Haiti sans casser l'existant
- L'AGENTS.md de Guyane est le premier à la racine du repo (ai-team l'a dans apps/todo/)