#!/usr/bin/env bash
# vm-provision.sh — Création de la VM 101 "ai-agents-vm" sur Precision (Proxmox)
#
# Prérequis :
#   - Accès SSH au Proxmox Precision (100.111.21.3)
#   - Clé SSH configurée pour root@precision
#
# Usage :
#   ssh root@precision bash -s < infra/vm-provision.sh
#
# Ou copier le script puis l'exécuter :
#   scp infra/vm-provision.sh root@precision:/tmp/
#   ssh root@precision bash /tmp/vm-provision.sh

set -euo pipefail

VMID=101
VMNAME="ai-agents-vm"
CORES=4
MEMORY=6144          # 6 Go
DISK=60              # 60 Go
STORAGE="local"
BRIDGE="vmbr0"
TEMPLATE="local:vztmpl/ubuntu-24.04-standard_24.04-1_amd64.tar.zst"

echo "=== Création VM $VMID ($VMNAME) sur Precision ==="

# Vérifier que la VM n'existe pas déjà
if qm status "$VMID" 2>/dev/null; then
  echo "ERREUR: VM $VMID existe déjà"
  exit 1
fi

# Cloner le template LXC
echo "→ Clonage template Ubuntu 24.04..."
pct clone "$TEMPLATE" "$VMID" --storage "$STORAGE"

# Configurer la VM
echo "→ Configuration (CPU=$CORES, RAM=${MEMORY}MB, Disk=${DISK}GB)..."
pct set "$VMID" \
  --hostname "$VMNAME" \
  --cores "$CORES" \
  --memory "$MEMORY" \
  --rootfs "${STORAGE}:${DISK}" \
  --net0 "name=eth0,bridge=${BRIDGE},ip=dhcp" \
  --features "nesting=1" \
  --onboot 1

# Démarrer
echo "→ Démarrage..."
pct start "$VMID"

# Attendre que le réseau soit prêt
echo "→ Attente réseau (15s)..."
sleep 15

# Récupérer l'IP
VM_IP=$(pct exec "$VMID" -- ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
echo "→ IP: $VM_IP"

# Installer Docker + dépendances
echo "→ Installation Docker + dépendances..."
pct exec "$VMID" -- bash -c '
  apt-get update -qq
  apt-get install -y -qq curl git gh docker.io docker-compose-v2 python3 python3-pip
  systemctl enable docker
  systemctl start docker
  useradd -m -s /bin/bash hermes || true
  usermod -aG docker hermes
'

# Installer Hermes
echo "→ Installation Hermes Agent..."
pct exec "$VMID" -- bash -c '
  su - hermes -c "curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash"
'

echo ""
echo "=== VM $VMID ($VMNAME) prête ==="
echo "IP: $VM_IP"
echo "SSH: ssh hermes@$VM_IP"
echo "Hermes: /home/hermes/.hermes/"
echo ""
echo "Prochaines étapes:"
echo "  1. Configurer Tailscale : ssh hermes@$VM_IP -- sudo tailscale up"
echo "  2. Créer les profils : bash infra/hermes-profiles.sh"
echo "  3. Configurer GitHub App : voir infra/github-app-setup.md"