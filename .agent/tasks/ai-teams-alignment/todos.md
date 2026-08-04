# Todos — AI Teams Alignment

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.
> **Mis à jour** le 2026-08-04 — séparation équipes/projets.

## Légende

- `[ ]` à faire
- `[~]` en cours
- `[x]` fait + preuve
- `[X]` bloqué

---

## Phase 0 — Nommage caraibéen

- [x] 0.1 Nommer les équipes : Cuba, Haiti, Guyane
- [x] 0.2 Nommer les membres avec prénoms caribéens (titre conservé)
- [x] 0.3 Mettre en avant les modèles LLM de chaque équipe

## Phase 1 — Séparation équipes vs projets

### 1.1 Créer les repos équipes

- [x] 1.1.1 Renommer `YoLoADR/ai-team` → `YoLoADR/ai-team-cuba` — `gh repo rename`
- [x] 1.1.2 Créer `YoLoADR/ai-team-haiti` — https://github.com/YoLoADR/ai-team-haiti
- [x] 1.1.3 Créer `YoLoADR/ai-team-guyane` — https://github.com/YoLoADR/ai-team-guyane
- [x] 1.1.4 Renommer le dossier local `ai-team` → `ai-team-cuba`
- [x] 1.1.5 Créer le dossier local `ai-team-haiti` + git init
- [x] 1.1.6 Créer le dossier local `ai-team-guyane` + git init

### 1.2 Créer les repos projets

- [x] 1.2.1 Créer `YoLoADR/todo-cuba` — https://github.com/YoLoADR/todo-cuba
- [x] 1.2.2 Créer `YoLoADR/todo-haiti` — https://github.com/YoLoADR/todo-haiti
- [x] 1.2.3 `YoLoADR/ai-hirekit` existe déjà (projet)

### 1.3 Extraire les projets des repos équipes

- [x] 1.3.1 Extraire `apps/todo/` de ai-team-cuba → `todo-cuba/` (code + tests + config)
- [x] 1.3.2 Extraire `apps/todo/` de ai-team-haiti → `todo-haiti/` (code + tests + config)
- [x] 1.3.3 Extraire l'équipe de ai-hirekit → `ai-team-guyane/` (skills, infra, docs, AGENTS.md)
- [x] 1.3.4 Nettoyer ai-hirekit : retirer .agent/, skills/, infra/, docs/, AGENTS.md, docker-compose.yml
- [x] 1.3.5 Nettoyer ai-team-cuba : retirer apps/, package.json, turbo.json, pnpm-workspace.yaml, job.md, note.md, scripts, templates
- [x] 1.3.6 Nettoyer ai-team-haiti : retirer apps/, telegram-bot.py, templates

### 1.4 Déplacer les workflows vers les repos projets

- [x] 1.4.1 `cuba-loop.yml` → `todo-cuba/.github/workflows/`
- [x] 1.4.2 `haiti-loop.yml` → `todo-haiti/.github/workflows/`
- [x] 1.4.3 `ci.yml` + `deploy.yml` → `todo-cuba/.github/workflows/` et `todo-haiti/.github/workflows/`
- [x] 1.4.4 `guyane-loop.yml` reste dans `ai-hirekit/.github/workflows/` (déjà là)
- [x] 1.4.5 `motherboard.yml` copié dans les 3 repos projets (todo-cuba, todo-haiti, ai-hirekit)
- [x] 1.4.6 `motherboard.yml` mis à jour : mapping repo→équipe simplifié (1 repo projet = 1 équipe)
- [x] 1.4.7 Mise à jour `.gitignore` des équipes (exclure apps/, caches)

### 1.5 Mettre à jour les références croisées

- [x] 1.5.1 Remplacer `YoLoADR/ai-team` → `YoLoADR/ai-team-cuba` dans tous les .md de Cuba
- [x] 1.5.2 Remplacer `YoLoADR/ai-team` → `YoLoADR/ai-team-haiti` dans les .md de Haiti
- [x] 1.5.3 Remplacer `ai-loop.yml` → `cuba-loop.yml`, `ai-loop-v1.yml` → `haiti-loop.yml` dans les docs
- [x] 1.5.4 Mettre à jour les chemins locaux `/Factory/ai-team/` → `/Factory/ai-team-cuba/`
- [x] 1.5.5 Vérifier : aucune référence obsolète restante (`rg 'YoLoADR/ai-team[^-]'` = 0)

### 1.6 Pousser sur GitHub

- [x] 1.6.1 Push ai-team-cuba (commit "refactor: rename repo, separate Haiti")
- [x] 1.6.2 Push ai-team-haiti (commit "init: équipe Haiti séparée de Cuba")
- [ ] 1.6.3 Push ai-team-guyane
- [ ] 1.6.4 Push todo-cuba
- [ ] 1.6.5 Push todo-haiti
- [ ] 1.6.6 Push ai-hirekit (nettoyé)

---

## Phase 2 — AGENTS.md et alignement

- [x] 2.1 Créer `AGENTS.md` pour ai-hirekit/Guyane (avec équipe, workflow, contraintes)
- [ ] 2.2 Créer `AGENTS.md` racine pour ai-team-cuba (équipe pure)
- [ ] 2.3 Créer `AGENTS.md` racine pour ai-team-haiti (équipe pure)
- [ ] 2.4 Créer `AGENTS.md` racine pour ai-team-guyane (déplacé depuis ai-hirekit)

---

## Phase 3 — Workflows de relay (commentaires → agents)

- [x] 3.1 `cuba-loop.yml` créé (dans todo-cuba) — SSH carapace → OpenHands
- [x] 3.2 `haiti-loop.yml` créé (dans todo-haiti) — SSH VM 102 → Hermes v1
- [x] 3.3 `guyane-loop.yml` créé (dans ai-hirekit) — SSH VM 102 → Hermes hirekit
- [x] 3.4 Trigger `issue_comment.created` ajouté aux 3 workflows
- [x] 3.5 Filtre anti-boucle (skip bot comments) dans les 3 workflows
- [x] 3.6 Notifications Telegram standardisées `[équipe] [emoji] [action]`
- [ ] 3.7 Configurer le secret `VM102_SSH_KEY_B64` sur todo-haiti et ai-hirekit
- [ ] 3.8 Vérifier que les workflows se déclenchent correctement

---

## Phase 4 — Kanban motherboard (Project V2 unifié)

- [x] 4.1 `motherboard.yml` créé et copié dans les 3 repos projets
- [x] 4.2 Mapping repo→équipe simplifié (1 repo = 1 équipe, pas de devinette)
- [ ] 4.3 Créer le Project V2 "AI Teams" sur GitHub (via Playwright ou API)
- [ ] 4.4 Récupérer les IDs GraphQL (PROJECT_ID, STATUS_FIELD_ID, TEAM_FIELD_ID)
- [ ] 4.5 Configurer les secrets MOTHERBOARD_* sur les 3 repos projets
- [ ] 4.6 Tester : créer une issue dans chaque repo et vérifier l'ajout au motherboard

---

## Phase 5 — Telegram

- [x] 5.1 `telegram-bot.py` réécrit avec commandes préfixées Cuba/Haiti/Guyane
- [x] 5.2 Anciennes commandes gardées en alias (transition)
- [x] 5.3 Commandes `/teams` et `/motherboard` ajoutées
- [ ] 5.4 Déployer `telegram-bot.py` sur Contabo (scp + restart service)
- [ ] 5.5 Tester les commandes depuis Telegram

---

## Phase 6 — Déploiement et tests

- [ ] 6.1 Configurer tous les secrets GitHub (VM102_SSH_KEY_B64, MOTHERBOARD_*, TELEGRAM_*)
- [ ] 6.2 Déployer telegram-bot.py sur Contabo
- [ ] 6.3 Créer une issue de test dans todo-cuba → vérifier cuba-loop.yml
- [ ] 6.4 Créer une issue de test dans todo-haiti → vérifier haiti-loop.yml
- [ ] 6.5 Créer une issue de test dans ai-hirekit → vérifier guyane-loop.yml
- [ ] 6.6 Vérifier le motherboard (issue visible dans le Project V2 ?)
- [ ] 6.7 Tester une commande Telegram → vérifier le relay

---

## Phase 7 — Documentation finale

- [x] 7.1 `context.md` mis à jour avec la séparation équipes/projets
- [x] 7.2 `ALIGNMENT_PLAN.md` mis à jour
- [x] 7.3 `todos.md` mis à jour avec preuves
- [x] 7.4 `insights.md` mis à jour avec le raisonnement complet
- [ ] 7.5 Mettre à jour `ARCHITECTURE.md` avec les noms Cuba/Haiti/Guyane
- [ ] 7.6 Mettre à jour les README des équipes et projets