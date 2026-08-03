# Hermes — Configuration pour le loop engineering

## Principe

Hermes tourne dans un container LXC dédié (`ai-agents-vm`, VMID 102 sur Precision).
L'installation est en cours (processus utilisateur). Cette configuration est prête à
déployer une fois Hermes installé.

## 3 instances / 3 profils

Pour éviter les conflits et les incohérences, on utilise **3 profils Hermes distincts**
sur une seule instance. Chaque profil a :
- Son propre modèle Ollama Cloud
- Son propre répertoire de travail (`workspace/`)
- Son propre prompt système
- Ses propres variables d'environnement

| Profil | Rôle | Modèle | Workspace |
|---|---|---|---|
| `po` | Product Owner | `kimi-k2.6` | `~/workspaces/po/` |
| `dev` | Développeur | `deepseek-v4-pro` | `~/workspaces/dev/` |
| `leaddev` | Lead Developer | `deepseek-v4-pro` | `~/workspaces/leaddev/` |

## Fichiers de configuration

- `profiles.yaml` — définition des 3 profils
- `config.yaml` — provider Ollama Cloud
- `tools/` — overrides des outils GitHub par profil
- `orchestrator.sh` — enchaînement PO → Dev → Lead Dev

## Workflow

```
1. orchestrator.sh reçoit une issue GitHub
2. hermes --profile po génère la spec
3. hermes --profile dev implémente en TDD
4. hermes --profile leaddev review la PR
```

## Déploiement

```bash
# Sur ai-agents-vm (LXC 102), une fois Hermes installé
cp -r /path/to/infra/hermes/* ~/.hermes/
source ~/.bashrc
hermes --profile po --help
```
