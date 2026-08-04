# Context — AI Teams Alignment (Caraïbes)

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.

## Goal

Aligner les 3 équipes de dev IA au niveau **GitHub** et **Telegram** uniquement.
Chaque équipe garde son moteur (Hermes/OpenHands), sa stratégie, ses modèles.
L'alignement porte sur :
1. Un **Kanban motherboard** unifié (GitHub Project V2) pour voir toutes les équipes
2. Des **workflows de relay** (GitHub Actions) pour que les commentaires → agents
3. Des **commandes Telegram préfixées** par équipe pour s'adresser à la bonne
4. Des **noms explicites** (villes/pays caraibéens) pour repérer les équipes

## Équipes concernées

| Nom | Repo | Moteur | Serveur | Construit avec |
|---|---|---|---|---|
| 🇨🇺 **Cuba** | YoLoADR/ai-team-cuba | OpenHands | carapace (109.199.97.174) | DeepSeek (glm-5.2) |
| 🇭🇹 **Haiti** | YoLoADR/ai-team-haiti | Hermes v0.19.0 | Precision VM 102 | DeepSeek (glm-5.2) |
| 🇬🇫 **Guyane** | YoLoADR/ai-hirekit | Hermes v0.19.0 | Precision VM 102 | Kimi + GLM |

## Membres des équipes

### 🇨🇺 Cuba (ai-team v2 — OpenHands)

| Rôle | Prénom | Modèle Ollama Cloud |
|---|---|---|
| Product Owner | **Yanet** | `glm-5.2:cloud` |
| Developer | **Raúl** | `glm-5.2:cloud` |
| Lead Developer | **Camila** | `qwen3.5:397b:cloud` |

### 🇭🇹 Haiti (ai-team v1 — Hermes)

| Rôle | Prénom | Modèle Ollama Cloud |
|---|---|---|
| Product Owner | **Jean-Marc** | `minimax-m3:cloud` |
| Developer | **Mireille** | `kimi-k2.7-code:cloud` |
| Lead Developer | **Frantz** | `deepseek-v4-pro:cloud` |

### 🇬🇫 Guyane (ai-hirekit — Hermes)

| Rôle | Prénom | Modèle Ollama Cloud |
|---|---|---|
| Recon Agent | **Léopold** | `glm-5.2:cloud` |
| Poster Agent | **Manon** | `kimi-k2.7-code` / `glm-5.2` / `minimax-m3` / `deepseek-v4-pro` (A/B) |
| Review Agent | **Sylviane** | `deepseek-v4-pro:cloud` |

## Périmètre

| Inclus | Exclu |
|---|---|
| Kanban motherboard (Project V2 unifié) | Changer les moteurs (Hermes/OpenHands) |
| Workflows cuba-loop.yml (relay commentaires → agents) | Changer les modèles LLM |
| Commandes Telegram préfixées (cuba-*, haiti-*, guyane-*) | Changer les stratégies d'équipe |
| AGENTS.md pour ai-hirekit | Modifier run-agent.py ou webhook-adapter |
| Notifications Telegram standardisées | Déploiement infra (carapace, VM 102) |

## Stack d'alignement

| Couche | Choix |
|---|---|
| Kanban | GitHub Project V2 "AI Teams Motherboard" sur YoLoADR |
| Relay | GitHub Actions (cuba-loop.yml, haiti-loop.yml) → SSH → agents |
| Interface | Telegram @loop_engineering_team_bot (commandes préfixées) |
| Notifications | Format unifié : `[ÉQUIPE] [EMOJI] [ACTION] — [DÉTAIL]` |

## Règles dures

- 🔒 Chaque équipe garde son moteur et ses configs attitrées
- 🔒 Chaque équipe garde sa stratégie de développement
- 🔒 Chaque équipe reste indépendante (pour comparer les performances)
- ✅ L'alignement se fait uniquement au niveau GitHub + Telegram
- ✅ Les commentaires GitHub ET Telegram déclenchent les agents (double canal)
- 🚫 Pas de modification des orchestrateurs (run-agent.py, webhook-adapter, Hermes configs)

## Fichiers liés

- Plan détaillé : `ALIGNMENT_PLAN.md` (ce dossier)
- Tâches : `todos.md` (ce dossier)
- Journal : `insights.md` (ce dossier)
- Architecture globale : `/Users/yohannravino/Factory/ai-team-cuba/.agent/ARCHITECTURE.md`
- Équipe Cuba : `/Users/yohannravino/Factory/ai-team-cuba/.agent/tasks/loop-engineering-todo-app-v2/`
- Équipe Haiti : `/Users/yohannravino/Factory/ai-team-cuba/.agent/tasks/todo-app-loop-engineering/`
- Équipe Guyane : `/Users/yohannravino/Factory/ai-hirekit/.agent/tasks/recon/`
- Pattern des tâches : `/Users/yohannravino/Factory/merenza/.agent/tasks/`