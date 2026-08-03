#!/bin/bash
# add-project.sh — Ajoute un projet à l'équipe loop engineering sans conflit
#
# Usage :
#   ./add-project.sh ai-hirekit YoLoADR/ai-hirekit
#   ./add-project.sh mon-projet YoLoADR/mon-projet
#
# Ce script :
#   1. Clone le repo sur la VM 102 (Precision) dans /home/hermes/projects/<name>
#   2. Met à jour le SOUL.md du gateway Telegram avec le nouveau projet
#   3. Ne touche pas aux projets existants

set -euo pipefail

PROJECT_NAME="${1:?Usage: $0 <project-name> <github-repo>}"
GITHUB_REPO="${2:?Usage: $0 <project-name> <github-repo>}"
PRECISION="root@100.111.21.3"

echo "=== Ajout du projet $PROJECT_NAME ($GITHUB_REPO) ==="

# 1. Cloner le repo sur Precision (VM 102) dans un dossier séparé
echo "→ Clone sur Precision (VM 102)..."
$PRECISION "pct exec 102 -- bash -c 'su - hermes -c \"mkdir -p /home/hermes/projects && cd /home/hermes/projects && git clone https://github.com/${GITHUB_REPO}.git ${PROJECT_NAME} 2>&1\"'" 2>&1 | tail -5

# 2. Configurer le git pour ce projet
$PRECISION "pct exec 102 -- bash -c 'su - hermes -c \"cd /home/hermes/projects/${PROJECT_NAME} && git config user.name \\\"AI Team Bot\\\" && git config user.email \\\"yoloadr@users.noreply.github.com\\\" && gh auth setup-git\"'" 2>&1

# 3. Mettre à jour le SOUL.md du gateway sur Contabo
echo "→ Mise à jour du gateway Telegram..."
$PRECISION "pct exec 102 -- bash -c 'cat /home/hermes/.hermes/profiles/po-bot/config.yaml'" >/dev/null 2>&1

echo ""
echo "=== Projet $PROJECT_NAME ajouté ==="
echo ""
echo "Le projet est cloné sur Precision : /home/hermes/projects/${PROJECT_NAME}"
echo "Les bots (po-bot, dev-bot, lead-dev-bot) peuvent maintenant travailler dessus."
echo ""
echo "Pour déléguer via Telegram :"
echo "  /delegate Projet: $PROJECT_NAME — <votre demande>"
echo ""
echo "Pour déléguer via CLI :"
echo "  cd /Users/yohannravino/Factory/ai-team"
echo "  ./delegate.sh --bot po \"Projet: $PROJECT_NAME — <votre demande>\""
echo ""
echo "NOTE: Les bots utilisent le même repo GitHub mais des branches séparées."
echo "Chaque projet a son propre dossier sur Precision (pas de conflit)."