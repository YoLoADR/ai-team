#!/bin/bash
# Setup OpenHands sur VPS Contabo « carapace » (109.199.97.174) pour le loop engineering v2
# Ce script est exécuté sur carapace via SSH

set -euo pipefail

INSTALL_DIR="/opt/ai-team-loop"
WORKSPACE_DIR="$INSTALL_DIR/workspaces"
CONFIG_DIR="$INSTALL_DIR/config"

# 1. Créer les répertoires
mkdir -p "$INSTALL_DIR" "$WORKSPACE_DIR"/{po,dev,review} "$CONFIG_DIR"

# 2. Créer le docker-compose
cat > "$INSTALL_DIR/docker-compose.yml" <<'EOF'
services:
  openhands-runtime:
    image: ghcr.io/opendevin/openhands:latest
    container_name: openhands-runtime
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - LOG_LEVEL=info
      - LLM_PROVIDER=openai_compatible
      - LLM_BASE_URL=https://ollama.com/api/v1
      - LLM_API_KEY=${OLLAMA_CLOUD_API_KEY}
      - DEFAULT_AGENT=CodeActAgent
      - SANDBOX_TYPE=docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./config:/app/config:ro
      - workspace-po:/app/workspaces/po
      - workspace-dev:/app/workspaces/dev
      - workspace-review:/app/workspaces/review
    networks:
      - openhands-net

  webhook-adapter:
    image: node:20-slim
    container_name: webhook-adapter
    restart: unless-stopped
    volumes:
      - ./webhook-adapter:/app
    working_dir: /app
    command: node adapter.js
    ports:
      - "8080:8080"
    environment:
      - OPENHANDS_URL=http://openhands-runtime:3000
      - GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
    networks:
      - openhands-net
    depends_on:
      - openhands-runtime

volumes:
  workspace-po:
  workspace-dev:
  workspace-review:

networks:
  openhands-net:
    driver: bridge
EOF

# 3. Créer la config OpenHands (config.toml)
cat > "$CONFIG_DIR/config.toml" <<'EOF'
[llm]
api_key = "${OLLAMA_CLOUD_API_KEY}"
base_url = "https://ollama.com/api/v1"

[llm.po]
model = "openai/glm-5.2"
temperature = 0.4
max_tokens = 8192

[llm.dev]
model = "openai/kimi-k2.7-code"
temperature = 0.2
max_tokens = 16384

[llm.leaddev]
model = "openai/qwen3.5:397b"
temperature = 0.1
max_tokens = 8192

[agent.PoAgent]
llm_config = "po"

[agent.DevAgent]
llm_config = "dev"

[agent.LeadReviewAgent]
llm_config = "leaddev"
EOF

# 4. Créer le webhook-adapter minimal (Node.js)
mkdir -p "$INSTALL_DIR/webhook-adapter"
cat > "$INSTALL_DIR/webhook-adapter/adapter.js" <<'EOF'
import http from 'node:http';

const OPENHANDS_URL = process.env.OPENHANDS_URL || 'http://openhands-runtime:3000';
const PORT = 8080;

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    return res.end('Method Not Allowed');
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const event = req.headers['x-github-event'];
    const payload = JSON.parse(body || '{}');

    console.log(`GitHub event: ${event}`);

    // Router vers OpenHands selon l'événement
    if (event === 'issues' && payload.action === 'labeled') {
      // PO agent : générer spec
      await fetch(`${OPENHANDS_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'PoAgent',
          issue: payload.issue.number,
          repo: payload.repository.full_name,
        }),
      });
    } else if (event === 'pull_request' && payload.action === 'opened') {
      // Lead-Review agent : review PR
      await fetch(`${OPENHANDS_URL}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'LeadReviewAgent',
          pr: payload.pull_request.number,
          repo: payload.repository.full_name,
        }),
      });
    }

    res.writeHead(200);
    res.end('OK');
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => console.log(`webhook-adapter listening on :${PORT}`));
EOF

# 5. Créer le fichier d'environnement
cat > "$INSTALL_DIR/.env" <<'EOF'
# Ollama Cloud Pro
OLLAMA_CLOUD_API_KEY=__REPLACE_ME__

# GitHub App
GITHUB_APP_ID=__REPLACE_ME__
GITHUB_APP_PRIVATE_KEY=__REPLACE_ME__
GITHUB_WEBHOOK_SECRET=__REPLACE_ME__

# Netlify
NETLIFY_AUTH_TOKEN=__REPLACE_ME__
NETLIFY_SITE_ID=__REPLACE_ME__
EOF

chmod 600 "$INSTALL_DIR/.env"

echo "OpenHands setup prepared at $INSTALL_DIR"
echo "Next steps:"
echo "  1. Edit $INSTALL_DIR/.env with real tokens"
echo "  2. Run: cd $INSTALL_DIR && docker compose up -d"
echo "  3. Configure GitHub webhook → http://carapuce:8080"
echo "  4. Test: curl http://localhost:3000/api/health"