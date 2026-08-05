#!/usr/bin/env bash
# ============================================================
# Actualiza los secrets de GitHub cuando ya tengas tu VPS.
# Uso local (Windows Git Bash / Linux / Mac):
#   export DEPLOY_HOST="IP_DEL_VPS"
#   export DEPLOY_USER="ubuntu"   # o root
#   bash deploy/set-github-secrets.sh
# ============================================================
set -euo pipefail

: "${DEPLOY_HOST:?Define DEPLOY_HOST con la IP de tu VPS, ej: export DEPLOY_HOST=1.2.3.4}"
: "${DEPLOY_USER:?Define DEPLOY_USER, ej: export DEPLOY_USER=ubuntu}"

REPO="marcogenriquez6-max/sistema-de-inventario"

echo "==> Configurando secrets en $REPO"
gh secret set DEPLOY_HOST --repo "$REPO" --body "$DEPLOY_HOST"
gh secret set DEPLOY_USER --repo "$REPO" --body "$DEPLOY_USER"

cat <<'EOF'

Listo. La clave SSH privada (DEPLOY_SSH_KEY) ya está configurada.

PASO IMPORTANTE en el VPS: añade la clave pública de deploy
(contenido de ~/.ssh/deploy_repuestos.pub de tu máquina local)
al final de ~/.ssh/authorized_keys del usuario $DEPLOY_USER.

Después, haz push a la rama main y el workflow Deploy lo instala todo.
EOF
