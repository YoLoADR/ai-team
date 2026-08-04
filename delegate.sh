#!/bin/bash
# delegate.sh — Délègue une tâche à l'équipe loop engineering
#
# Usage :
#   ./delegate.sh "Ajoute un filtre par catégorie sur GET /api/todos"
#   ./delegate.sh --bot po "Crée une user story pour l'authentification"
#   ./delegate.sh --bot dev "Implémente l'issue #5"
#   ./delegate.sh --bot lead "Review la PR #7"
#   ./delegate.sh --status   # Affiche l'état du board GitHub
#
# Prérequis : ~/.config/ai-team/env avec GH_TOKEN et OLLAMA_API_KEY
#   mkdir -p ~/.config/ai-team
#   echo 'GH_TOKEN=gho_xxx' > ~/.config/ai-team/env
#   echo 'OLLAMA_API_KEY=f3bfxxx' >> ~/.config/ai-team/env

set -euo pipefail

# ── Charger les secrets ───────────────────────────────────────
ENV_FILE="${HOME}/.config/ai-team/env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Erreur: $ENV_FILE introuvable."
  echo "Crée-le avec:"
  echo "  mkdir -p ~/.config/ai-team"
  echo "  echo 'GH_TOKEN=gho_xxx' > ~/.config/ai-team/env"
  echo "  echo 'OLLAMA_API_KEY=f3bfxxx' >> ~/.config/ai-team/env"
  exit 1
fi
source "$ENV_FILE"
export GH_TOKEN GITHUB_TOKEN="$GH_TOKEN" OPENAI_API_KEY="$OLLAMA_API_KEY"

REPO="YoLoADR/ai-team-cuba"
SSH_CMD="ssh root@100.111.21.3"

# ── Helpers ────────────────────────────────────────────────────

show_status() {
  echo "═══ Issues ouvertes ═══"
  gh issue list --repo "$REPO" --state open --json number,title,labels,assignees \
    --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))] → \(.assignees | map(.login) | join(","))"' 2>/dev/null
  echo ""
  echo "═══ Pull Requests ═══"
  gh pr list --repo "$REPO" --state open --json number,title,headRefName,isDraft \
    --jq '.[] | "#\(.number) \(.title) [\(.headRefName)] draft=\(.isDraft)"' 2>/dev/null
  echo ""
  echo "═══ CI status ═══"
  gh run list --repo "$REPO" --limit 3 --json status,conclusion,name,createdAt \
    --jq '.[] | "\(.name): \(.status) \(.conclusion // "") \(.createdAt)"' 2>/dev/null
  echo ""
  echo "═══ VM 102 (ai-agents-vm) ═══"
  $SSH_CMD "pct status 102" 2>/dev/null || echo "VM 102 inaccessible"
}

send_to_bot() {
  local bot="$1"
  local message="$2"

  # Config propre (le bot corrompt sa config à chaque session)
  local model
  case "$bot" in
    po-bot)       model="minimax-m3:cloud" ;;
    dev-bot)     model="kimi-k2.7-code:cloud" ;;
    lead-dev-bot) model="deepseek-v4-pro:cloud" ;;
    *) echo "Bot inconnu: $bot"; exit 1 ;;
  esac

  # Réécrire la config propre
  $SSH_CMD "pct exec 102 -- bash -c 'cat > /home/hermes/.hermes/profiles/${bot}/config.yaml << ENDCFG
approvals:
  mode: smart
model:
  api_key: ${OLLAMA_API_KEY}
  base_url: https://ollama.com/v1
  default: ${model}
terminal:
  backend: local
  container_persistent: true
  cwd: /home/hermes/repo
  home_mode: profile
onboarding:
  seen:
    tool_progress_prompt: true
ENDCFG
chown hermes:hermes /home/hermes/.hermes/profiles/${bot}/config.yaml'"

  echo "→ Envoi à ${bot} (modèle: ${model})..."
  echo "→ Message: ${message}"
  echo ""
  $SSH_CMD "pct exec 102 -- bash -c 'su - hermes -c \"cd /home/hermes/repo && ${bot} chat -q \\\"${message}\\\"\" 2>&1'" | tail -50
}

# ── CLI ────────────────────────────────────────────────────────

BOT="po-bot"
ACTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bot) BOT="${2}-bot"; shift 2 ;;
    --status) ACTION="status"; shift ;;
    *) MESSAGE="$1"; shift ;;
  esac
done

if [[ "$ACTION" == "status" ]]; then
  show_status
  exit 0
fi

if [[ -z "${MESSAGE:-}" ]]; then
  echo "═══ Loop Engineering — AI Team ═══"
  echo ""
  echo "Usage:"
  echo "  ./delegate.sh \"ajoute un filtre par catégorie\""
  echo "  ./delegate.sh --bot po    \"crée une user story\""
  echo "  ./delegate.sh --bot dev   \"implémente l'issue #5\""
  echo "  ./delegate.sh --bot lead  \"review la PR #7\""
  echo "  ./delegate.sh --status"
  echo ""
  echo "Bots disponibles:"
  echo "  po    → minimax-m3:cloud (Product Owner — user stories, issues)"
  echo "  dev   → kimi-k2.7-code:cloud (Developer — TDD, code, PRs)"
  echo "  lead  → deepseek-v4-pro:cloud (Lead Dev — review, approve, merge)"
  echo ""
  echo "Sans --bot, la tâche est envoyée au PO qui créera l'issue"
  echo "et déclenchera le loop (PO → Dev → Lead Dev → merge)."
  exit 0
fi

send_to_bot "$BOT" "$MESSAGE"