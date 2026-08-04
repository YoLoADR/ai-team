# Todos — AI Teams Alignment

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.

## Légende

- `[ ]` à faire
- `[~]` en cours
- `[x]` fait + preuve
- `[X]` bloqué

---

## Phase 1 — Standardisation transverse

### 1.1 AGENTS.md pour ai-hirekit (Guyane)

- [x] 1.1.1 Lire AGENTS.md existant d'ai-team/apps/todo/ pour référence — `apps/todo/AGENTS.md` (119 lignes)
- [x] 1.1.2 Créer `/Users/yohannravino/Factory/ai-hirekit/AGENTS.md` — fichier créé avec équipe (Léopold, Manon, Sylviane), workflow, contraintes, commandes Telegram

### 1.2 Commandes Telegram préfixées

- [x] 1.2.1 Lire `telegram-bot.py` existant — 238 lignes, 5 commandes (/po, /dev, /lead, /delegate, /status)
- [x] 1.2.2 Renommer `/po`, `/dev`, `/lead` → `/cuba-po`, `/cuba-dev`, `/cuba-lead` — gardé en alias legacy
- [x] 1.2.3 Ajouter `/haiti-po`, `/haiti-dev`, `/haiti-lead` — via make_team_handler("haiti", role)
- [x] 1.2.4 Ajouter `/guyane-recon`, `/guyane-poster`, `/guyane-review` — via make_team_handler("guyane", role)
- [x] 1.2.5 Ajouter `/teams` (statut global) et `/motherboard` (lien Kanban) — cmd_teams + cmd_motherboard
- [x] 1.2.6 Garder anciennes commandes comme alias (transition) — /po→cuba-po, /dev→cuba-dev, /lead→cuba-lead

### 1.3 Notifications Telegram standardisées

- [x] 1.3.1 Définir template commun `[ÉQUIPE] [EMOJI] [ACTION] — [DÉTAIL]` — dans cuba-loop.yml, haiti-loop.yml, motherboard.yml
- [x] 1.3.2 Appliquer le template dans telegram-bot.py — fonction send_to_hermes_bot + send_to_carapace_agent

---

## Phase 2 — GitHub Kanban + Relay workflows

### 2.1 Motherboard Kanban (Project V2 unifié)

- [x] 2.1.1 Créer workflow `ai-team/.github/workflows/motherboard.yml` — créé, utilise GraphQL Project V2
- [ ] 2.1.2 Créer le Project V2 "AI Teams" sur GitHub + récupérer les IDs (manuel)
- [ ] 2.1.3 Configurer les secrets MOTHERBOARD_PROJECT_ID, MOTHERBOARD_STATUS_FIELD_ID, MOTHERBOARD_TEAM_FIELD_ID
- [ ] 2.1.4 Tester sur une issue de chaque repo

### 2.2 Relay ai-hirekit (cuba-loop.yml pour Guyane)

- [x] 2.2.1 Créer `ai-hirekit/.github/workflows/guyane-loop.yml` — créé, triggers complets
- [x] 2.2.2 Triggers : issue_comment, issues.labeled, PR opened, review submitted — tous présents
- [x] 2.2.3 Action : SSH → VM 102 → agent Hermes correspondant — 5 agents (recon, poster, review, dev, leaddev)
- [x] 2.2.4 Filtrer : ignorer commentaires des bots — check sur "bot" / "ai-team-loop" / "hirekit-poster"
- [ ] 2.2.5 Configurer le secret VM102_SSH_KEY_B64 sur ai-hirekit

### 2.3 Relay Haiti (haiti-loop.yml)

- [x] 2.3.1 Créer `ai-team/.github/workflows/haiti-loop.yml` — créé, séparé de cuba-loop.yml (Cuba)
- [x] 2.3.2 Triggers : issue_comment, issues.labeled, PR opened, review submitted — tous présents
- [x] 2.3.3 Action : SSH → VM 102 → profils Hermes v1 (Jean-Marc, Mireille, Frantz) — 4 agents
- [x] 2.3.4 Filtrer : ignorer commentaires des bots — check sur "bot" / "ai-team-loop"
- [ ] 2.3.5 Configurer le secret VM102_SSH_KEY_B64 sur ai-team

---

## Phase 3 — Routage des commentaires (double canal)

- [x] 3.1 Flux commentaire GitHub → agent — implémenté dans cuba-loop.yml (issue_comment.created) et haiti-loop.yml
- [x] 3.2 Flux commande Telegram → commentaire GitHub → agent — telegram-bot.py route vers agents, agents répondent sur GitHub
- [ ] 3.3 Tester le double canal sur une issue de test (nécessite déploiement)

---

## Phase 4 — Documentation

- [ ] 4.1 Mettre à jour `ai-team/.agent/ARCHITECTURE.md` avec les noms Cuba/Haiti/Guyane
- [x] 4.2 Documenter la progression dans `insights.md` — mis à jour
- [ ] 4.3 Mettre à jour les README des équipes avec les nouveaux noms
- [ ] 4.4 Commit final + tag

---

## Actions manuelles restantes (opérateur)

1. **Créer le Project V2 "AI Teams"** sur GitHub (https://github.com/users/YoLoADR/projects) avec 5 colonnes
2. **Récupérer les IDs** (PROJECT_ID, STATUS_FIELD_ID, TEAM_FIELD_ID) via GraphQL
3. **Configurer les secrets GitHub** :
   - `MOTHERBOARD_PROJECT_ID` sur ai-team
   - `MOTHERBOARD_STATUS_FIELD_ID` sur ai-team
   - `MOTHERBOARD_TEAM_FIELD_ID` sur ai-team
   - `MOTHERBOARD_PAT` (token avec projects:write) sur ai-team
   - `VM102_SSH_KEY_B64` sur ai-team et ai-hirekit
4. **Déployer telegram-bot.py** mis à jour sur Contabo
5. **Tester** : créer une issue de test dans chaque repo et vérifier le relay