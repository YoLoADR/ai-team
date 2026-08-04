# AI Teams Alignment — Plan détaillé

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.
> **Mis à jour** le 2026-08-04 — séparation équipes/projets.

## Vue d'ensemble

Aligner 3 équipes de dev IA (Cuba, Haiti, Guyane) au niveau GitHub + Telegram.
Chaque équipe garde son moteur, ses modèles, sa stratégie. L'alignement porte sur :
1. Un Kanban motherboard unifié pour suivre toutes les équipes
2. Des workflows de relay pour que les commentaires (GitHub + Telegram) → agents
3. Des commandes Telegram préfixées pour s'adresser à la bonne équipe
4. Des notifications Telegram standardisées
5. Une séparation propre équipes vs projets (chaque équipe = "usine", chaque projet = "chantier")

---

## Architecture cible

```
Factory/
├── ai-team-cuba/        ← ÉQUIPE (skills, infra, telegram-bot.py, motherboard.yml)
├── ai-team-haiti/       ← ÉQUIPE (skills, infra, .agent/tasks/)
├── ai-team-guyane/      ← ÉQUIPE (skills, infra, docs, AGENTS.md, docker-compose)
├── todo-cuba/           ← PROJET (code Next.js + ci.yml + cuba-loop.yml + motherboard.yml)
├── todo-haiti/          ← PROJET (code Next.js + ci.yml + haiti-loop.yml + motherboard.yml)
└── ai-hirekit/          ← PROJET (sites, job.md + guyane-loop.yml + motherboard.yml)
```

**Principe** : le workflow loop vit dans le repo projet (c'est là que les events GitHub
se déclenchent), mais il SSH vers l'infra de l'équipe (carapace/VM 102). L'équipe est
"l'usine", le projet est le "chantier". Changer l'équipe assignée à un projet = changer
le workflow qui SSH vers la bonne infra, pas migrer du code.

### Mapping équipes → projets → workflows

| Équipe | Repo équipe | Moteur | Serveur | Projet | Repo projet | Workflow loop |
|---|---|---|---|---|---|---|
| 🇨🇺 Cuba | `ai-team-cuba` | OpenHands | carapace | Todo | `todo-cuba` | `cuba-loop.yml` |
| 🇭🇹 Haiti | `ai-team-haiti` | Hermes | VM 102 | Todo | `todo-haiti` | `haiti-loop.yml` |
| 🇬🇫 Guyane | `ai-team-guyane` | Hermes | VM 102 | ai-hirekit | `ai-hirekit` | `guyane-loop.yml` |

---

## Phase 1 — Séparation équipes vs projets

### Raisonnement

Les équipes et leurs projets étaient mélangés dans le même repo. Si Haiti doit
reprendre le projet de Cuba, Haiti devrait travailler dans un sous-dossier de
l'équipe Cuba = inacceptable. Séparation propre : 3 équipes + 3 projets au même
niveau.

### Actions

1. Renommer `YoLoADR/ai-team` → `YoLoADR/ai-team-cuba` (repo équipe Cuba)
2. Créer `YoLoADR/ai-team-haiti` (repo équipe Haiti, séparé pour éviter conflits)
3. Créer `YoLoADR/ai-team-guyane` (repo équipe Guyane, extraite de ai-hirekit)
4. Créer `YoLoADR/todo-cuba` (projet Next.js extrait de ai-team-cuba/apps/todo/)
5. Créer `YoLoADR/todo-haiti` (projet Next.js extrait de ai-team-haiti/apps/todo/)
6. Nettoyer ai-hirekit (retirer fichiers équipe, garder seulement projet)
7. Déplacer les workflows loop vers les repos projets
8. Copier motherboard.yml dans chaque repo projet

---

## Phase 2 — AGENTS.md

Chaque équipe a un AGENTS.md qui documente :
- Le rôle de l'opérateur (infrastructure + vérification)
- La stack et les règles strictes
- L'isolation (repo séparé, path séparé, profils séparés)
- Les commandes Telegram de l'équipe

---

## Phase 3 — Workflows de relay (commentaires → agents)

### Flux commentaire GitHub → agent

```
Tu commentes une issue GitHub dans todo-cuba
  → issue_comment.created event
  → cuba-loop.yml (dans todo-cuba) détecte
  → SSH → carapace → Raúl (OpenHands/glm-5.2) traite le commentaire
  → agent répond sur GitHub + notifie Telegram
```

### Flux commande Telegram → agent

```
Tu envoies /cuba-dev "corrige le bug du filtre" sur Telegram
  → telegram-bot.py (sur Contabo) reçoit
  → identifie l'équipe (cuba) et le membre (dev = Raúl)
  → SSH → carapace → Raúl (glm-5.2) traite
  → répond sur GitHub + notifie Telegram
```

### Workflows

| Workflow | Repo | Triggers | SSH vers |
|---|---|---|---|
| `cuba-loop.yml` | todo-cuba | issue_comment, issues.labeled, PR opened, review | carapace (OpenHands) |
| `haiti-loop.yml` | todo-haiti | issue_comment, issues.labeled, PR opened, review | VM 102 (Hermes v1) |
| `guyane-loop.yml` | ai-hirekit | issue_comment, issues.labeled, PR opened, review | VM 102 (Hermes hirekit) |
| `motherboard.yml` | chaque repo projet | issues.opened, PR opened | GraphQL GitHub API |

---

## Phase 4 — Kanban motherboard (Project V2 unifié)

Un Project V2 "AI Teams" sur GitHub qui agrège les issues des 3 repos projets.

- Colonnes : Backlog → Spec Ready → In Progress → In Review → Done
- Champ custom `Équipe` : cuba, haiti, guyane
- `motherboard.yml` dans chaque repo projet ajoute les issues au Project V2
- Mapping simplifié : 1 repo projet = 1 équipe (pas de devinette via labels)

---

## Phase 5 — Telegram

### Commandes préfixées

| Commande | Équipe | Membre |
|---|---|---|
| `/cuba-po <msg>` | Cuba | Yanet (PO) |
| `/cuba-dev <msg>` | Cuba | Raúl (Dev) |
| `/cuba-lead <msg>` | Cuba | Camila (Lead) |
| `/haiti-po <msg>` | Haiti | Jean-Marc (PO) |
| `/haiti-dev <msg>` | Haiti | Mireille (Dev) |
| `/haiti-lead <msg>` | Haiti | Frantz (Lead) |
| `/guyane-recon <msg>` | Guyane | Léopold (Recon) |
| `/guyane-poster <msg>` | Guyane | Manon (Poster) |
| `/guyane-review <msg>` | Guyane | Sylviane (Review) |
| `/teams` | Toutes | Statut global |
| `/motherboard` | Toutes | Lien Kanban |

### Notifications standardisées

Format : `[équipe] [emoji] [action] — [détail]`

```
[cuba] 🔧 PR #6 ouverte — feat: implémente #5
[haiti] 📋 User story #2 créée — CRUD todos
[guyane] 🔍 Recon #3 terminée — BJemploi
```

---

## Phase 6 — Déploiement et tests

1. Configurer les secrets GitHub (VM102_SSH_KEY_B64, MOTHERBOARD_*, TELEGRAM_*)
2. Déployer telegram-bot.py sur Contabo (scp + restart service)
3. Créer une issue de test dans chaque repo projet → vérifier le relay
4. Vérifier le motherboard (issue visible dans le Project V2 ?)
5. Tester une commande Telegram → vérifier le relay

---

## Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Yohann (toi)                                  │
│              Mac local / Telegram / GitHub Web UI                   │
└──────────────┬──────────────────────┬──────────────┬────────────────┘
               │                      │              │
               ▼                      ▼              ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│   Telegram Gateway   │ │   GitHub (Cloud)     │ │   Ollama Cloud       │
│   Contabo 100.98...  │ │   6 repos:           │ │   $20/mo Pro         │
│   @loop_engineering  │ │   3 équipes + 3 proj │ │   glm-5.2, kimi,     │
│   _team_bot          │ │   Motherboard V2     │ │   deepseek, minimax  │
│   (cuba/haiti/guyane)│ │                      │ │   qwen3.5:397b       │
└──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
           │ SSH                    │ GitHub Actions         │ API
           ▼                        │ (loop workflows)       │
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
└── Netlify (todo-cuba.netlify.app) — Cuba uniquement
```

---

## Coûts

Aucun coût supplémentaire. L'infrastructure existante suffit :
- Ollama Cloud Pro : $20/mo (déjà payé)
- Contabo + Precision : existing hardware
- GitHub Actions : gratuit (public repos)
- Telegram : gratuit