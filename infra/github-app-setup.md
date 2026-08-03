# GitHub App Setup — ai-team-loop

Ce document décrit la procédure pour créer une GitHub App avec 3 tokens machine
(PO, Dev, Lead Dev) afin d'éviter les multi-comptes (interdits par les ToS GitHub).

## 1. Créer la GitHub App

### Via l'interface GitHub

1. Aller sur https://github.com/settings/apps (ou https://github.com/organizations/<org>/settings/apps)
2. Cliquer **"New GitHub App"**
3. Remplir :
   - **GitHub App name** : `ai-team-loop`
   - **Homepage URL** : `https://github.com/<user>/ai-team`
   - **Webhook URL** : (laisser vide pour l'instant, ou pointer vers Hermes gateway)
   - **Webhook secret** : (générer un secret aléatoire)

### Permissions requises

| Permission | Niveau | Utilisé par |
|---|---|---|
| **Issues** | Read & write | PO (créer issues) |
| **Pull requests** | Read & write | Dev (créer PRs), Lead (review, merge) |
| **Pull request reviews** | Read & write | Lead Dev (approve, request changes) |
| **Contents** | Read & write | Dev (push code), Lead (merge) |
| **Metadata** | Read-only | Tous (requis par défaut) |
| **Check runs** | Read-only | Lead Dev (vérifier CI) |

### Subscribe to events

- Issues
- Pull requests
- Pull request review

4. Cliquer **"Create GitHub App"**
5. Noter l'**App ID** (ex: 123456)
6. Générer une **private key** (.pem file) → téléchargée automatiquement

## 2. Installer la GitHub App sur le repo

1. Aller sur la page d'installation : `https://github.com/apps/ai-team-loop/installations`
2. Sélectionner le repo `ai-team` (ou l'organisation)
3. Confirmer l'installation

## 3. Générer les tokens machine

### Méthode 1 : Script Python (recommandé)

```python
# generate_tokens.py
import jwt, time, requests, json

APP_ID = 123456          # Remplacer par ton App ID
PRIVATE_KEY_PATH = "ai-team-loop.private-key.pem"

with open(PRIVATE_KEY_PATH, "r") as f:
    private_key = f.read()

# Générer un JWT
payload = {
    "iat": int(time.time()) - 60,
    "exp": int(time.time()) + 600,
    "iss": APP_ID,
}
jwt_token = jwt.encode(payload, private_key, algorithm="RS256")

# Récupérer l'installation ID
headers = {"Authorization": f"Bearer {jwt_token}", "Accept": "application/vnd.github+json"}
resp = requests.get("https://api.github.com/app/installations", headers=headers)
installation_id = resp.json()[0]["id"]

# Générer un installation token
resp = requests.post(
    f"https://api.github.com/app/installations/{installation_id}/access_tokens",
    headers=headers
)
token = resp.json()["token"]
print(f"Installation token: {token}")
```

### Méthode 2 : Via `gh` CLI

```bash
# Si la GitHub App est installée, gh peut créer des tokens
gh api --method POST /app/installations/<installation_id>/access_tokens
```

## 4. Configurer les tokens dans les profils Hermes

Le token d'installation est **unique** mais peut être scoped par rôle via les
permissions de la GitHub App. Pour une isolation maximale, créer 3 GitHub Apps
séparées :

### Option A : 1 GitHub App, 1 token (simple)

```
~/.hermes/.env (global)
GITHUB_TOKEN=ghs_xxx...  # Token d'installation unique
```

Les 3 profils utilisent le même token. L'isolation est assurée par les **skills**
(chaque bot n'utilise que les commandes `gh` de son rôle).

### Option B : 3 GitHub Apps (isolation maximale)

Créer 3 GitHub Apps distinctes :

| App | Permissions | Profil Hermes |
|---|---|---|
| `ai-team-po` | issues:write, metadata:read | po-bot |
| `ai-team-dev` | contents:write, pull_requests:write, issues:read | dev-bot |
| `ai-team-lead` | pull_requests:write, contents:write, reviews:write, metadata:read | lead-dev-bot |

Puis configurer chaque profil :

```bash
# PO
echo "GITHUB_TOKEN=ghs_po_token..." >> ~/.hermes/profiles/po-bot/.env

# Dev
echo "GITHUB_TOKEN=ghs_dev_token..." >> ~/.hermes/profiles/dev-bot/.env

# Lead Dev
echo "GITHUB_TOKEN=ghs_lead_token..." >> ~/.hermes/profiles/lead-dev-bot/.env
```

## 5. Configurer l'API key Ollama Cloud

Dans chaque profil :

```bash
# PO
echo "OLLAMA_CLOUD_API_KEY=f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC" >> ~/.hermes/profiles/po-bot/.env

# Dev
echo "OLLAMA_CLOUD_API_KEY=f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC" >> ~/.hermes/profiles/dev-bot/.env

# Lead Dev
echo "OLLAMA_CLOUD_API_KEY=f3bf130d76a44536991f4b6bd47e650e.BszCTL2hUgQT2sNnQb6iUnJC" >> ~/.hermes/profiles/lead-dev-bot/.env
```

## 6. Démarrer le gateway

```bash
hermes gateway install --system   # service systemd au boot
hermes gateway start
```

Le gateway héberge le cron scheduler. Les 3 bots tourneront en autonomie selon
leurs cron jobs configurés.

## 7. Supervision (optionnel : Telegram)

```bash
# Dans ~/.hermes/.env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_USERS=123456789
```

Le gateway enverra les notifications :
- PO a créé une issue
- Dev a créé une PR
- Lead Dev a approved/requested changes
- Erreurs (cron échoué, API error, etc.)