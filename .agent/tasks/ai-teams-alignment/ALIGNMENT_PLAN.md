# AI Teams Alignment — Plan détaillé

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.

## Vue d'ensemble

Aligner 3 équipes de dev IA (Cuba, Haiti, Guyane) au niveau GitHub + Telegram.
Chaque équipe garde son moteur, ses modèles, sa stratégie. L'alignement porte sur :
1. Un Kanban motherboard unifié pour suivre toutes les équipes
2. Des workflows de relay pour que les commentaires (GitHub + Telegram) → agents
3. Des commandes Telegram préfixées pour s'adresser à la bonne équipe
4. Des notifications Telegram standardisées

---

## Phase 1 — Standardisation transverse

### 1.1 AGENTS.md pour ai-hirekit (Guyane)

**Fichier** : `/Users/yohannravino/Factory/ai-hirekit/AGENTS.md`

L'équipe Guyane n'a pas d'AGENTS.md. Les équipes Cuba et Haiti en ont un dans
`apps/todo/AGENTS.md`. Il faut créer un AGENTS.md racine pour ai-hirekit qui documente :
- Le rôle de l'opérateur (infrastructure + vérification)
- La stack (Hermes, Playwright, cookies, A/B testing)
- Les règles strictes (no secrets, no Claude/GPT, cookies gitignored)
- L'isolation (repo séparé, path séparé, profils séparés)
- Les commandes Telegram (`/guyane-*`)

### 1.2 Commandes Telegram préfixées

**Fichier** : `/Users/yohannravino/Factory/ai-team-cuba/telegram-bot.py`

Renommer les commandes existantes et ajouter les nouvelles :

| Actuel | Nouveau | Équipe | Membre |
|---|---|---|---|
| `/po` | `/cuba-po` | Cuba | Yanet |
| `/dev` | `/cuba-dev` | Cuba | Raúl |
| `/lead` | `/cuba-lead` | Cuba | Camila |
| — | `/haiti-po` | Haiti | Jean-Marc |
| — | `/haiti-dev` | Haiti | Mireille |
| — | `/haiti-lead` | Haiti | Frantz |
| — | `/guyane-recon` | Guyane | Léopold |
| — | `/guyane-poster` | Guyane | Manon |
| — | `/guyane-review` | Guyane | Sylviane |
| — | `/teams` | Toutes | Statut global |
| — | `/motherboard` | Toutes | Lien Kanban |

### 1.3 Notifications Telegram standardisées

Format commun pour toutes les équipes :

```
[${ÉQUIPE}] ${EMOJI} ${ACTION}
${DÉTAIL}
🔗 ${LIEN_GITHUB}
```

Exemples :
```
[cuba] 🔧 PR #6 ouverte — feat: implémente #5
🔗 https://github.com/YoLoADR/ai-team/pull/6

[haiti] 📋 User story #2 créée — CRUD todos
🔗 https://github.com/YoLoADR/ai-team/issues/2

[guyane] 📋 Recon #3 terminée — BJemploi
🔗 https://github.com/YoLoADR/ai-hirekit/issues/3
```

---

## Phase 2 — GitHub Kanban + Relay workflows

### 2.1 Motherboard Kanban (Project V2 unifié)

**Fichier** : `/Users/yohannravino/Factory/ai-team-cuba/.github/workflows/motherboard.yml`

Créer un Project V2 "AI Teams Motherboard" sur YoLoADR qui référence les issues
des 3 équipes. Le workflow ajoute automatiquement les issues au motherboard :

- Issue créée dans `YoLoADR/ai-team-cuba` → tag `cuba` ou `haiti` (selon label)
- Issue créée dans `YoLoADR/ai-hirekit` → tag `guyane`
- Colonnes : Backlog → Spec Ready → In Progress → In Review → Done
- Champ custom : `Équipe` (cuba, haiti, guyane)

Le workflow utilise l'API GraphQL GitHub pour :
1. Créer le Project V2 s'il n'existe pas
2. Ajouter les issues au projet
3. Définir le champ `Équipe`
4. Déplacer selon le statut

### 2.2 Relay ai-hirekit (cuba-loop.yml pour Guyane)

**Fichier** : `/Users/yohannravino/Factory/ai-hirekit/.github/workflows/guyane-loop.yml`

Relay GitHub Actions pour l'équipe Guyane. Sur événements GitHub → SSH → VM 102 → agent Hermes.

Triggers :
- `issue_comment.created` : commentaire sur issue → agent recon/poster
- `issues.labeled` : label ajouté → agent correspondant
- `pull_request.opened` : PR ouverte → agent review
- `pull_request_review.submitted` : review soumise → agent fix si CHANGES_REQUESTED
- `workflow_dispatch` : trigger manuel (`trigger_type`, `issue_number`)

Action :
- SSH → VM 102 (Precision, 192.168.1.76)
- Lance l'agent Hermes correspondant au rôle
- Notifie via Telegram

### 2.3 Relay Haiti (haiti-loop.yml)

**Fichier** : `/Users/yohannravino/Factory/ai-team-cuba/.github/workflows/haiti-loop.yml`

Relay pour l'équipe Haiti (v1, Hermes sur VM 102). Séparé de l'cuba-loop.yml
existant (qui gère Cuba/v2 sur carapace).

Mêmes triggers que 2.2, mais route vers les profils Hermes v1 sur VM 102 :
- po-bot → Jean-Marc (minimax-m3:cloud)
- dev-bot → Mireille (kimi-k2.7-code:cloud)
- lead-dev-bot → Frantz (deepseek-v4-pro:cloud)

---

## Phase 3 — Routage des commentaires (double canal)

### Flux commentaire GitHub → agent

```
Tu commentes une issue GitHub
  → issue_comment.created event
  → cuba-loop.yml (ou haiti-loop.yml) détecte
  → SSH → VM 102 (ou carapace)
  → agent Hermes (ou OpenHands) traite le commentaire
  → agent répond sur GitHub + notifie Telegram
```

### Flux commande Telegram → commentaire GitHub → agent

```
Tu envoies /cuba-dev "corrige le bug du filtre" sur Telegram
  → telegram-bot.py reçoit
  → identifie l'équipe (cuba) et le membre (dev = Raúl)
  → poste un commentaire sur l'issue GitHub active de l'équipe
  → cuba-loop.yml détecte le commentaire
  → SSH → carapace → Raúl (glm-5.2) traite
  → répond sur GitHub + notifie Telegram
```

---

## Infrastructure concernée

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Yohann (toi)                                  │
│              Mac local / Telegram / GitHub Web UI                   │
└──────────────┬──────────────────────┬──────────────┬────────────────┘
               │                      │              │
               ▼                      ▼              ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   Telegram Gateway   │ │   GitHub (Cloud)     │ │   Ollama Cloud       │
│   Contabo 100.98...  │ │   YoLoADR/ai-team-cuba   │ │   $20/mo Pro         │
│   @loop_engineering  │ │   YoLoADR/ai-hirekit│ │   glm-5.2, kimi,     │
│   _team_bot          │ │   Motherboard V2    │ │   deepseek, minimax  │
│   (cuba/haiti/guyane)│ │   (Kanban unifié)   │ │   qwen3.5:397b       │
└──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
           │ SSH                    │ GitHub Actions         │ API
           ▼                        │ (relay workflows)      │
┌────────────────────────────────────────────────────────────┼──────────┐
│              Precision Proxmox (100.111.21.3)              │          │
│  ┌──────────────────────────────────────────────────────┐  │          │
│  │  VM 102 "ai-agents-vm"                                │  │          │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌──────────┐│  │          │
│  │  │ 🇨🇺 Cuba        │ │ 🇭🇹 Haiti        │ │🇬🇫 Guyane││  │          │
│  │  │ (sur carapace)  │ │ (Hermes VM 102) │ │(Hermes)  ││  │          │
│  │  │ Yanet PO        │ │ Jean-Marc PO    │ │Léopold   ││  │          │
│  │  │ Raúl Dev        │ │ Mireille Dev    │ │Manon     ││  │          │
│  │  │ Camila Lead     │ │ Frantz Lead     │ │Sylviane  ││  │          │
│  │  │ glm-5.2         │ │ minimax/kimi/ds │ │4 modèles ││  │          │
│  │  │ + qwen3.5:397b  │ │                 │ │          ││  │          │
│  │  └─────────────────┘ └─────────────────┘ └──────────┘│  │          │
│  └──────────────────────────────────────────────────────┘  │          │
└────────────────────────────────────────────────────────────┘          │
┌───────────────────────────────────────────────────────────────────────┘
│
└── Netlify (ai-team-todo.netlify.app) — Cuba uniquement
```

---

## Coûts

Aucun coût supplémentaire. L'infrastructure existante suffit :
- Ollama Cloud Pro : $20/mo (déjà payé)
- Contabo + Precision : existing hardware
- GitHub Actions : gratuit (public repos)
- Telegram : gratuit

---

## Risques

| Risque | Mitigation |
|---|---|
| Collision de commandes Telegram (anciennes vs nouvelles) | Garder les anciennes commandes comme alias pendant transition |
| Motherboard V2 trop complexe à maintenir | Utiliser un seul workflow GitHub Actions, pas de sync bidirectionnelle |
| Relay SSH vers VM 102 déjà utilisé par ai-team v2 | Profils Hermes séparés, paths séparés, pas de conflit |
| Commentaires GitHub qui déclenchent l'agent trop souvent | Filtrer par auteur (ignorer les commentaires des bots eux-mêmes) |