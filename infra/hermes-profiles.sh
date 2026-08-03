#!/usr/bin/env bash
# hermes-profiles.sh — Création des 3 profils Hermes (po-bot, dev-bot, lead-dev-bot)
#
# Prérequis :
#   - Hermes installé sur la VM (voir vm-provision.sh)
#   - SSH : ssh hermes@<VM_IP>
#   - Ollama Cloud API key dans ~/.hermes/.env
#
# Usage :
#   ssh hermes@<VM_IP> bash -s < infra/hermes-profiles.sh
#
# Ou localement si Hermes est installé :
#   bash infra/hermes-profiles.sh

set -euo pipefail

OLLAMA_BASE_URL="https://ollama.com/v1"
# OLLAMA_CLOUD_API_KEY doit être dans ~/.hermes/.env

echo "=== Création des 3 profils Hermes ==="

# ── Profil PO ──────────────────────────────────────────────────────
echo "→ Profil po-bot (minimax-m3:cloud)..."
hermes profile create po-bot --description "Product Owner: creates user stories, acceptance criteria, GitHub Issues"
po-bot config set model.default "ollama/minimax-m3:cloud"
po-bot config set model.base_url "$OLLAMA_BASE_URL"
po-bot config set terminal.backend docker
po-bot config set terminal.docker_image "python:3.11-slim"
po-bot config set terminal.container_cpu 1
po-bot config set terminal.container_memory 2048
po-bot config set terminal.container_persistent true
po-bot config set approvals.mode smart

# ── Profil Dev ─────────────────────────────────────────────────────
echo "→ Profil dev-bot (kimi-k2.7-code:cloud)..."
hermes profile create dev-bot --description "Developer: implements features with TDD, writes tests first, creates PRs"
dev-bot config set model.default "ollama/kimi-k2.7-code:cloud"
dev-bot config set model.base_url "$OLLAMA_BASE_URL"
dev-bot config set terminal.backend docker
dev-bot config set terminal.docker_image "node:20-slim"
dev-bot config set terminal.container_cpu 2
dev-bot config set terminal.container_memory 4096
dev-bot config set terminal.container_persistent true
dev-bot config set approvals.mode smart

# ── Profil Lead Dev ────────────────────────────────────────────────
echo "→ Profil lead-dev-bot (deepseek-v4-pro:cloud)..."
hermes profile create lead-dev-bot --description "Lead Developer: reviews PRs, enforces standards, approves or requests changes"
lead-dev-bot config set model.default "ollama/deepseek-v4-pro:cloud"
lead-dev-bot config set model.base_url "$OLLAMA_BASE_URL"
lead-dev-bot config set terminal.backend docker
lead-dev-bot config set terminal.docker_image "node:20-slim"
lead-dev-bot config set terminal.container_cpu 1
lead-dev-bot config set terminal.container_memory 2048
lead-dev-bot config set terminal.container_persistent true
lead-dev-bot config set approvals.mode smart

# ── Skills ─────────────────────────────────────────────────────────
echo "→ Installation des skills..."
# Les skills sont dans le repo ai-team/skills/
# Les copier dans chaque profil
for profile in po-bot dev-bot lead-dev-bot; do
  cp -r skills/po-workflow    ~/.hermes/profiles/$profile/skills/ 2>/dev/null || true
  cp -r skills/dev-tdd        ~/.hermes/profiles/$profile/skills/ 2>/dev/null || true
  cp -r skills/lead-review     ~/.hermes/profiles/$profile/skills/ 2>/dev/null || true
done

# ── Cron jobs ──────────────────────────────────────────────────────
echo "→ Configuration des cron jobs..."

# PO : vérifie les nouvelles demandes toutes les heures
po-bot cron create "every 1h" \
  "Check for new issues without the user-story label on github.com. For each unlabeled issue, run the po-workflow skill to create a proper user story with acceptance criteria." \
  --skill po-workflow \
  --deliver telegram

# Dev : vérifie les issues assignées toutes les 30 min
dev-bot cron create "every 30m" \
  "Check for issues assigned to dev-bot with label user-story in status Todo. For each, run the dev-tdd skill: TDD RED → GREEN → REFACTOR → PR." \
  --skill dev-tdd \
  --deliver telegram

# Lead Dev : vérifie les PRs en attente toutes les 30 min
lead-dev-bot cron create "every 30m" \
  "Check for open PRs without a review on github.com. For each, run the lead-review skill: diff analysis, checklist, approve or request changes." \
  --skill lead-review \
  --deliver telegram

echo ""
echo "=== Profils créés ==="
echo "  po-bot       → minimax-m3:cloud    → Docker (python:3.11-slim)"
echo "  dev-bot      → kimi-k2.7-code:cloud → Docker (node:20-slim)"
echo "  lead-dev-bot → deepseek-v4-pro:cloud → Docker (node:20-slim)"
echo ""
echo "Prochaines étapes:"
echo "  1. Configurer les tokens GitHub dans chaque profil .env"
echo "     po-bot:       GITHUB_TOKEN=ghs_po..."
echo "     dev-bot:      GITHUB_TOKEN=ghs_dev..."
echo "     lead-dev-bot: GITHUB_TOKEN=ghs_lead..."
echo "  2. Configurer Telegram (optionnel) dans ~/.hermes/.env"
echo "  3. Démarrer le gateway : hermes gateway start"
echo "  4. Dashboard : hermes dashboard"