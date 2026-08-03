#!/bin/bash
# Orchestrateur Hermes pour le loop engineering
# Usage: ./orchestrator.sh <issue-number>

set -euo pipefail

ISSUE=${1:-}
if [ -z "$ISSUE" ]; then
  echo "Usage: $0 <issue-number>"
  exit 1
fi

REPO_DIR="/opt/ai-team"
WORKSPACE_BASE="$HOME/workspaces"

echo "=== Loop Engineering Workflow for issue #$ISSUE ==="

# 1. Product Owner — génère la spec
echo "[PO] Generating spec..."
cd "$REPO_DIR"
hermes --profile po --task "Read issue #$ISSUE and create a detailed spec.md in branch ai/spec/$ISSUE. Then comment on the issue with the spec summary."

# 2. Developer — implémente en TDD
echo "[DEV] Implementing with TDD..."
hermes --profile dev --task "Read the spec in issue #$ISSUE and branch ai/spec/$ISSUE. Implement the feature in branch ai/impl/$ISSUE with tests first. Run lint, typecheck, and tests. Open a PR to main linking issue #$ISSUE."

# 3. Lead Developer — review
echo "[LEAD] Reviewing PR..."
hermes --profile leaddev --task "Review the PR for issue #$ISSUE. Check code quality, tests, spec compliance, security, and performance. Approve or request changes with actionable comments."

echo "=== Workflow complete for issue #$ISSUE ==="
