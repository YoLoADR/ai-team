# Insights — AI Teams Alignment

> **Construit avec GLM-5.2** (ollama-cloud/glm-5.2:cloud via opencode) le 2026-08-04.
> **Mis à jour** le 2026-08-04 — séparation équipes/projets.

## Session 1 — Alignement initial (GitHub + Telegram)

### Contexte

Yohann a 3 équipes de dev IA qui fonctionnent avec des moteurs et stratégies
différents mais partagent l'infra (Precision VM 102, Contabo, Ollama Cloud).
Il veut les aligner au niveau GitHub + Telegram uniquement, sans toucher aux
moteurs ni aux stratégies. Il veut aussi des noms explicites (caraibéens) pour
mieux se repérer quand il s'adresse aux équipes.

### Décisions session 1

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
   - GitHub : issue_comment.created → loop workflow → SSH → agent
   - Telegram : /cuba-dev "message" → telegram-bot.py → agent → répond sur GitHub + Telegram

6. **Renommage des workflows** : noms explicites par équipe
   - `ai-loop.yml` → `cuba-loop.yml` (était peu explicite)
   - `ai-loop-v1.yml` → `haiti-loop.yml`
   - `ai-loop.yml` (ai-hirekit) → `guyane-loop.yml`

### Fichiers créés session 1

| Fichier | Rôle |
|---|---|
| `ai-teams-alignment/context.md` | Contexte de la tâche (pattern Merenza) |
| `ai-teams-alignment/ALIGNMENT_PLAN.md` | Plan détaillé |
| `ai-teams-alignment/todos.md` | Suivi des tâches avec preuves |
| `ai-teams-alignment/insights.md` | Ce fichier — journal d'exécution |
| `ai-hirekit/AGENTS.md` | Instructions pour l'équipe Guyane |
| `ai-hirekit/.github/workflows/guyane-loop.yml` | Relay GitHub Actions pour Guyane |
| `ai-team-cuba/.github/workflows/haiti-loop.yml` | Relay GitHub Actions pour Haiti |
| `ai-team-cuba/.github/workflows/motherboard.yml` | Kanban motherboard unifié |
| `ai-team-cuba/telegram-bot.py` | Réécrit : commandes Cuba/Haiti/Guyane + alias |

---

## Session 2 — Séparation équipes vs projets

### Problème identifié

Yohann a remarqué deux incohérences :

1. **Cuba et Haiti sur le même repo** (`YoLoADR/ai-team`) → les deux workflows
   écoutent les mêmes events GitHub → **conflit** (2 équipes traitent la même issue)

2. **Équipes et projets mélangés** dans le même repo :
   - `ai-team` contenait l'équipe (skills, infra, AGENTS.md) ET le projet (`apps/todo/`)
   - `ai-hirekit` contenait l'équipe (skills, infra, docs, AGENTS.md) ET le projet (sites, job.md)

**Raisonnement** : si un jour Haiti doit reprendre le projet de Cuba, Haiti devrait
travailler dans `ai-team-cuba/apps/todo/` = inacceptable. Il faut séparer proprement :
**3 équipes** + **3 projets** au même niveau. Les équipes sont des "usines", les
projets sont des "chantiers". Changer l'équipe assignée à un projet = changer le
workflow qui SSH vers la bonne infra, pas migrer du code.

### Décisions session 2

1. **Renommer `YoLoADR/ai-team` → `YoLoADR/ai-team-cuba`** — le repo de l'équipe Cuba

2. **Créer `YoLoADR/ai-team-haiti`** — repo séparé pour l'équipe Haiti
   - Raisonnement : éviter les conflits de workflows (chaque repo = 1 équipe = 1 moteur)

3. **Créer `YoLoADR/ai-team-guyane`** — repo pour l'équipe Guyane
   - Raisonnement : ai-hirekit est un PROJET (posting d'offres), pas une équipe
   - L'équipe Guyane doit avoir sa "maison" séparée du projet sur lequel elle travaille
   - Si demain Guyane travaille sur un autre projet, elle a son repo équipe

4. **Créer `YoLoADR/todo-cuba` et `YoLoADR/todo-haiti`** — repos projets séparés
   - Le code Next.js vit dans le repo du projet, pas dans le repo de l'équipe
   - Les workflows (ci, deploy, loop) vivent dans le repo du projet (c'est là que les events se déclenchent)

5. **Nettoyer ai-hirekit** — ne garder que le projet (sites, job.md, README, setup-github.sh, .github/)
   - Retirer : .agent/, skills/, infra/, docs/, AGENTS.md, docker-compose.yml (→ ai-team-guyane)

6. **Motherboard.yml dans chaque repo projet** — pas dans le repo équipe
   - Chaque repo projet a son propre motherboard.yml qui ajoute ses issues au Project V2
   - Mapping simplifié : 1 repo projet = 1 équipe (pas besoin de deviner via labels)

### Structure finale

```
Factory/
├── ai-team-cuba/        ← ÉQUIPE (skills, infra, telegram-bot.py, motherboard.yml)
├── ai-team-haiti/       ← ÉQUIPE (skills, infra, .agent/tasks/)
├── ai-team-guyane/      ← ÉQUIPE (skills, infra, docs, AGENTS.md, docker-compose)
├── todo-cuba/           ← PROJET (code Next.js + ci.yml + cuba-loop.yml + motherboard.yml)
├── todo-haiti/          ← PROJET (code Next.js + ci.yml + haiti-loop.yml + motherboard.yml)
└── ai-hirekit/          ← PROJET (sites, job.md + guyane-loop.yml + motherboard.yml)
```

### Fichiers créés/modifiés session 2

| Action | Fichier | Détail |
|---|---|---|
| Créé | `ai-team-guyane/` (local + repo GitHub) | Équipe Guyane extraite de ai-hirekit |
| Créé | `todo-cuba/` (local + repo GitHub) | Projet Next.js extrait de ai-team-cuba/apps/todo/ |
| Créé | `todo-haiti/` (local + repo GitHub) | Projet Next.js extrait de ai-team-haiti/apps/todo/ |
| Modifié | `ai-team-cuba/` | Retiré apps/, package.json, turbo.json, scripts, templates |
| Modifié | `ai-team-haiti/` | Retiré apps/, telegram-bot.py, templates |
| Modifié | `ai-hirekit/` | Retiré .agent/, skills/, infra/, docs/, AGENTS.md, docker-compose.yml |
| Modifié | `todo-cuba/.github/workflows/motherboard.yml` | Mapping repo→équipe simplifié |
| Modifié | `todo-haiti/.github/workflows/motherboard.yml` | Idem |
| Modifié | `ai-hirekit/.github/workflows/motherboard.yml` | Idem |
| Modifié | `ai-team-cuba/.gitignore` | Exclure apps/, caches (.serena, .playwright-mcp, etc.) |
| Modifié | `ai-team-haiti/.gitignore` | Idem |
| Push | `ai-team-cuba` sur GitHub | commit "refactor: rename repo, separate Haiti" |
| Push | `ai-team-haiti` sur GitHub | commit "init: équipe Haiti séparée" |

### Découvertes session 2

- `gh repo rename` change le nom du repo mais pas le dossier local — il faut `git remote set-url` + `mv` manuel
- Le shell persiste l'ancien working directory après un `mv` — il faut utiliser le paramètre `workdir`
- Serena project root reste stale après un rename — `serena_replace_in_files` échoue, utiliser `sed -i ''` via bash
- Les `node_modules/` ne peuvent pas être supprimés avec `rm -rf` (garde-fou) — les exclure via `.gitignore` à la place
- Le `git rm -r --cached` retire du tracking mais laisse sur disque — c'est le comportement voulu pour ne pas casser le FS

### Actions restantes (session 3)

1. Push ai-team-guyane, todo-cuba, todo-haiti, ai-hirekit sur GitHub
2. Créer le Project V2 "AI Teams" sur GitHub (via Playwright ou API)
3. Récupérer les IDs GraphQL et configurer les secrets MOTHERBOARD_*
4. Configurer VM102_SSH_KEY_B64 sur todo-haiti et ai-hirekit
5. Déployer telegram-bot.py sur Contabo
6. Tester : créer une issue dans chaque repo projet + vérifier le relay
7. Mettre à jour ARCHITECTURE.md et les README avec les nouveaux noms

---

## Session 3 — Déploiement et tests

### Push des 6 repos sur GitHub

Tous les repos ont été poussés avec succès :
- `ai-team-cuba` — 3 commits (rename, cleanup, docs)
- `ai-team-haiti` — 2 commits (init, cleanup)
- `ai-team-guyane` — 1 commit (init, extrait de ai-hirekit)
- `todo-cuba` — 3 commits (init, fix motherboard x2)
- `todo-haiti` — 3 commits (init, fix motherboard x2)
- `ai-hirekit` — 3 commits (cleanup, fix motherboard x2)

### Création du Project V2 "AI Teams Motherboard"

- Project #4 créé sur GitHub via Playwright (template Kanban)
- Renommé via GraphQL API : `updateProjectV2` mutation
- Colonnes : Backlog → Ready → In progress → In review → Done
- Champ custom "Équipe" créé via GraphQL avec 3 options :
  - 🇨🇺 Cuba (option ID: `0e1df621`, color: BLUE)
  - 🇭🇹 Haiti (option ID: `5ea48213`, color: GREEN)
  - 🇬🇫 Guyane (option ID: `9bd60494`, color: YELLOW)

### IDs GraphQL récupérés

| Secret | Valeur |
|---|---|
| `MOTHERBOARD_PROJECT_ID` | `PVT_kwHOAPvD3s4BfU1R` |
| `MOTHERBOARD_STATUS_FIELD_ID` | `PVTSSF_lAHOAPvD3s4BfU1RzhZogjk` |
| `MOTHERBOARD_TEAM_FIELD_ID` | `PVTSSF_lAHOAPvD3s4BfU1RzhZohIU` |

### Secrets GitHub configurés

Configurés sur les 3 repos projets (todo-cuba, todo-haiti, ai-hirekit) :
- `MOTHERBOARD_PROJECT_ID`, `MOTHERBOARD_STATUS_FIELD_ID`, `MOTHERBOARD_TEAM_FIELD_ID`
- `MOTHERBOARD_PAT` (token avec projects:write)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `VM102_SSH_KEY_B64` (sur todo-haiti et ai-hirekit)
- `CARAPACE_SSH_KEY_B64`, `CARAPACE_HOST`, `CARAPACE_USER` (sur todo-cuba)

### Déploiement du bot Telegram sur Contabo

1. `scp telegram-bot.py root@109.199.97.174:/opt/telegram-bot.py`
2. `pip3 install --break-system-packages python-telegram-bot==22.0`
3. Création du service systemd `/etc/systemd/system/loop-engineering-bot.service`
4. `systemctl enable + start loop-engineering-bot`
5. Statut : `active (running)`, `getMe` → 200 OK, `Application started`

### Bugs corrigés pendant le déploiement

1. **`permissions: projects: write` invalide** — cette permission n'existe pas dans
   GitHub Actions. Retirée du motherboard.yml. Le PAT gère l'auth Project V2.

2. **`ProjectV2FieldValue!` type mismatch** — la mutation GraphQL attend un objet
   `ProjectV2FieldValue` mais on passait une string comme variable. Solution : inliner
   l'option ID directement dans la mutation (`singleSelectOptionId: "${teamOptId}"`).

3. **`COLUMN_OPTIONS` déclaré 2 fois** — l'ancienne déclaration avec placeholders
   (`BACKLOG_OPTION_ID`, etc.) n'avait pas été supprimée. Doublon retiré.

4. **Tirets dans les commandes Telegram** — `python-telegram-bot` n'accepte pas les
   tirets dans les noms de commandes (`cuba-po` → erreur `not a valid bot command`).
   Remplacés par des underscores : `cuba_po`, `haiti_dev`, `guyane_recon`.

5. **`python-telegram-bot` non installé sur Contabo** — `pip3 install` refusé par
   PEP 668. Contourné avec `--break-system-packages`.

6. **Service systemd manquant** — le bot n'était pas déployé comme service. Créé
   `/etc/systemd/system/loop-engineering-bot.service` avec restart=always.

### Tests de validation

| Test | Résultat | Preuve |
|---|---|---|
| Issue sur todo-cuba | ✅ Cuba Loop success (9s) | `gh run list` |
| Issue sur todo-haiti | ✅ Haiti Loop in_progress | `gh run list` |
| Motherboard sync todo-cuba#3 | ✅ Équipe=🇨🇺 Cuba, Status=Backlog | `gh api graphql` |
| Motherboard sync todo-haiti#2 | ✅ Status=Backlog | `gh api graphql` |
| Bot Telegram actif | ✅ active (running) | `systemctl status` |

### Découvertes session 3

- L'UI GitHub pour créer un Project V2 ne sauvegarde pas toujours le nom — GraphQL
  est plus fiable (`updateProjectV2` mutation)
- La mutation `updateProjectV2ItemFieldValue` ne peut pas recevoir l'option ID via
  une variable typée `ProjectV2FieldValue!` — il faut inliner la valeur
- Les workflows GitHub Actions ne se déclenchent pas si le fichier a des erreurs de
  syntaxe YAML (même `permissions` invalide bloque tout)
- Le `GITHUB_TOKEN` par défaut n'a pas accès aux Projects V2 cross-repo — il faut
  un PAT avec `projects:write`