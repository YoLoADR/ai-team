# Context — AI Teams Alignment (Caraïbes)

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.
> **Mis à jour** le 2026-08-04 — séparation équipes/projets.

## Goal

Aligner les 3 équipes de dev IA au niveau **GitHub** et **Telegram** uniquement.
Chaque équipe garde son moteur (Hermes/OpenHands), sa stratégie, ses modèles.
L'alignement porte sur :
1. Un **Kanban motherboard** unifié (GitHub Project V2) pour voir toutes les équipes
2. Des **workflows de relay** (GitHub Actions) pour que les commentaires → agents
3. Des **commandes Telegram préfixées** par équipe pour s'adresser à la bonne
4. Des **noms explicites** (villes/pays caraibéens) pour repérer les équipes

## Évolution clé — Séparation équipes vs projets

### Problème initial (session 1)

Les équipes et leurs projets étaient mélangés dans le même repo :
- `ai-team` contenait **l'équipe** (skills, infra, AGENTS.md) **ET le projet** (`apps/todo/`)
- `ai-hirekit` contenait **l'équipe** (skills, infra, docs, AGENTS.md) **ET le projet** (sites, job.md)
- Cuba et Haiti partageaient `ai-team` → **conflit** : les deux workflows écoutaient les mêmes events GitHub

### Décision — Séparer équipes et projets (session 2)

**Raisonnement** : si un jour Haiti doit reprendre le projet de Cuba, Haiti devrait travailler dans un sous-dossier de l'équipe Cuba = inacceptable. Il faut séparer proprement : **3 équipes** + **3 projets** au même niveau. Les équipes sont des "usines", les projets sont des "chantiers". Changer l'équipe assignée à un projet = changer le workflow qui SSH vers la bonne infra, pas migrer du code.

### Structure cible (actuelle)

```
Factory/
├── ai-team-cuba/        ← ÉQUIPE (skills, infra, AGENTS.md, telegram-bot.py, motherboard.yml)
├── ai-team-haiti/       ← ÉQUIPE (skills, infra, .agent/tasks/)
├── ai-team-guyane/      ← ÉQUIPE (skills, infra, docs, AGENTS.md, docker-compose)  NOUVEAU
├── todo-cuba/           ← PROJET (code Next.js + ci.yml + cuba-loop.yml + motherboard.yml)  NOUVEAU
├── todo-haiti/          ← PROJET (code Next.js + ci.yml + haiti-loop.yml + motherboard.yml)  NOUVEAU
└── ai-hirekit/          ← PROJET (sites, job.md + guyane-loop.yml + motherboard.yml)  nettoyé
```

**Principe** : le workflow loop vit dans le repo projet (c'est là que les events GitHub se déclenchent), mais il SSH vers l'infra de l'équipe (carapace/VM 102). L'équipe est "l'usine", le projet est le "chantier".

## Équipes

| Nom | Repo équipe | Moteur | Serveur | Construit avec |
|---|---|---|---|---|
| 🇨🇺 **Cuba** | `YoLoADR/ai-team-cuba` | OpenHands | carapace (109.199.97.174) | DeepSeek (glm-5.2) |
| 🇭🇹 **Haiti** | `YoLoADR/ai-team-haiti` | Hermes v0.19.0 | Precision VM 102 | DeepSeek (glm-5.2) |
| 🇬🇫 **Guyane** | `YoLoADR/ai-team-guyane` | Hermes v0.19.0 | Precision VM 102 | Kimi + GLM |

## Projets

| Projet | Repo projet | Équipe assignée | Workflow loop |
|---|---|---|---|
| Todo (Cuba) | `YoLoADR/todo-cuba` | 🇨🇺 Cuba | `cuba-loop.yml` |
| Todo (Haiti) | `YoLoADR/todo-haiti` | 🇭🇹 Haiti | `haiti-loop.yml` |
| ai-hirekit (posting) | `YoLoADR/ai-hirekit` | 🇬🇫 Guyane | `guyane-loop.yml` |

## Membres des équipes

### 🇨🇺 Cuba (ai-team-cuba — OpenHands)

| Rôle | Prénom | Modèle Ollama Cloud |
|---|---|---|
| Product Owner | **Yanet** | `glm-5.2:cloud` |
| Developer | **Raúl** | `glm-5.2:cloud` |
| Lead Developer | **Camila** | `qwen3.5:397b:cloud` |

### 🇭🇹 Haiti (ai-team-haiti — Hermes)

| Rôle | Prénom | Modèle Ollama Cloud |
|---|---|---|
| Product Owner | **Jean-Marc** | `minimax-m3:cloud` |
| Developer | **Mireille** | `kimi-k2.7-code:cloud` |
| Lead Developer | **Frantz** | `deepseek-v4-pro:cloud` |

### 🇬🇫 Guyane (ai-team-guyane — Hermes)

| Rôle | Prénom | Profil Hermes | Modèle Ollama Cloud |
|---|---|---|---|
| Recon Agent | **Léopold** | `recon-bot` | `glm-5.2:cloud` |
| Poster BJemploi | **Manon** | `bjemploi-poster` | `kimi-k2.7-code:cloud` |
| Poster Job2mada | **Manon** | `job2mada-poster` | `glm-5.2:cloud` |
| Poster Asako | **Manon** | `asako-poster` | `minimax-m3:cloud` |
| Poster WabaJob | **Manon** | `wabajob-poster` | `deepseek-v4-pro:cloud` |
| Review Agent | **Sylviane** | `review-bot` | `deepseek-v4-pro:cloud` |
| Dev Agent | **Ludovic** | `dev-bot` | `kimi-k2.7-code:cloud` |
| Lead Dev Agent | **Roseline** | `lead-dev-bot` | `deepseek-v4-pro:cloud` |

## Périmètre

| Inclus | Exclu |
|---|---|
| Kanban motherboard (Project V2 unifié) | Changer les moteurs (Hermes/OpenHands) |
| Workflows loop (relay commentaires → agents) | Changer les modèles LLM |
| Commandes Telegram préfixées (cuba-*, haiti-*, guyane-*) | Changer les stratégies d'équipe |
| AGENTS.md pour Guyane | Modifier run-agent.py ou webhook-adapter |
| Notifications Telegram standardisées | Déploiement infra (carapace, VM 102) |
| Séparation équipes vs projets | |

## Règles dures

- 🔒 Chaque équipe garde son moteur et ses configs attitrées
- 🔒 Chaque équipe garde sa stratégie de développement
- 🔒 Chaque équipe reste indépendante (pour comparer les performances)
- 🔒 Chaque équipe a son propre repo (YoLoADR/ai-team-*)
- 🔒 Chaque projet a son propre repo (YoLoADR/todo-*, YoLoADR/ai-hirekit)
- ✅ L'alignement se fait uniquement au niveau GitHub + Telegram
- ✅ Les commentaires GitHub ET Telegram déclenchent les agents (double canal)
- ✅ Un projet peut être réassigné à une autre équipe sans migration de code
- 🚫 Pas de modification des orchestrateurs (run-agent.py, webhook-adapter, Hermes configs)

## Fichiers liés

- Plan détaillé : `ALIGNMENT_PLAN.md` (ce dossier)
- Tâches : `todos.md` (ce dossier)
- Journal : `insights.md` (ce dossier)
- Équipe Cuba : `/Users/yohannravino/Factory/ai-team-cuba/`
- Équipe Haiti : `/Users/yohannravino/Factory/ai-team-haiti/`
- Équipe Guyane : `/Users/yohannravino/Factory/ai-team-guyane/`
- Projet Todo Cuba : `/Users/yohannravino/Factory/todo-cuba/`
- Projet Todo Haiti : `/Users/yohannravino/Factory/todo-haiti/`
- Projet ai-hirekit : `/Users/yohannravino/Factory/ai-hirekit/`
- Pattern des tâches : `/Users/yohannravino/Factory/merenza/.agent/tasks/`