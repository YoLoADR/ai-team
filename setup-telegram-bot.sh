#!/bin/bash
# setup-telegram-bot.sh — Crée le bot Telegram via @BotFather et configure le gateway
#
# Usage :
#   1. Ouvre Telegram → @BotFather
#   2. /newbot → nomme-le "Loop Engineering Team"
#   3. Récupère le token (format: 123456789:ABCdef...)
#   4. Récupère ton user ID (via @userinfobot)
#   5. Lance ce script :
#      ./setup-telegram-bot.sh <bot-token> <your-telegram-user-id>

set -euo pipefail

BOT_TOKEN="${1:?Usage: $0 <telegram-bot-token> <your-telegram-user-id>}"
USER_ID="${2:?Usage: $0 <telegram-bot-token> <your-telegram-user-id>}"

CONTABO="root@100.98.194.18"
PRECISION="root@100.111.21.3"

echo "=== Configuration du bot Telegram sur Contabo ==="

# Mettre à jour le .env du profil telegram-gateway
# Charger les secrets
ENV_FILE="${HOME}/.config/ai-team/env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Erreur: $ENV_FILE introuvable. Crée-le avec GH_TOKEN et OLLAMA_API_KEY."
  exit 1
fi
source "$ENV_FILE"

$CONTABO "cat > /root/.hermes/profiles/telegram-gateway/.env << 'EOF'
OPENAI_API_KEY=${OLLAMA_API_KEY}
GH_TOKEN=${GH_TOKEN}
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
TELEGRAM_ALLOWED_USERS=$USER_ID
EOF
chmod 600 /root/.hermes/profiles/telegram-gateway/.env && echo '.env OK'"

# Démarrer le gateway en tant que service systemd
$CONTABO "export PATH=\$HOME/.local/bin:\$PATH
telegram-gateway gateway install --system 2>&1 || true
systemctl enable hermes-gateway-telegram-gateway 2>/dev/null || true
systemctl restart hermes-gateway-telegram-gateway 2>/dev/null || telegram-gateway gateway start &
echo 'Gateway started'"

echo ""
echo "=== Bot Telegram configuré ==="
echo ""
echo "Ouvre Telegram et envoie un message à ton bot."
echo "Commandes disponibles :"
echo "  /status   — état de l'équipe"
echo "  /delegate <msg> — déléguer une tâche"
echo "  /po <msg>   — parler au PO directement"
echo "  /dev <msg>  — parler au Dev directement"
echo "  /lead <msg> — parler au Lead Dev directement"
echo "  /projects   — lister les projets"
echo "  /help       — aide"
echo ""
echo "Le bot tourne sur Contabo (100.98.194.18) et route les commandes"
echo "vers les bots Hermes sur Precision (VM 102, 192.168.1.76)."