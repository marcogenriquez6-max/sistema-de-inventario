#!/usr/bin/env bash
# ============================================================
# Instalación automática del Sistema de Repuestos ERP en un VPS
# Uso en el servidor:  bash setup-vps.sh
# ============================================================
set -euo pipefail

echo "==> 1/6 Actualizando sistema e instalando Docker + Compose"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl git openssl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> 2/6 Generando secretos JWT (solo si no existen)"
if [ ! -f .env ]; then
  {
    echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
    echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
  } > .env
  echo "    .env creado con secretos aleatorios"
else
  echo "    .env ya existe, se conserva"
fi

echo "==> 3/6 Levantando el stack (puertos 3000 API, 8080 web)"
docker compose up --build -d

echo "==> 4/6 Esperando a que la API esté sana"
for i in $(seq 1 30); do
  if curl -fsS http://localhost:3000/api/health/db >/dev/null 2>&1; then
    echo "    API saludable tras ${i}s"
    break
  fi
  [ "$i" -eq 30 ] && { echo "ERROR: la API no respondió a tiempo"; exit 1; }
  sleep 1
done

echo "==> 5/6 Comprobando la web"
curl -fsS -o /dev/null http://localhost:8080 && echo "    Web respondiendo en http://localhost:8080"

echo "==> 6/6 Resumen"
docker compose ps

cat <<'EOF'

=============================================================
Sistema desplegado.
  API : http://IP_DEL_SERVIDOR:3000/api/health
  Web : http://IP_DEL_SERVIDOR:8080
  Usuario demo: admin@sistema.com  /  Admin@123
=============================================================
Opcional HTTPS (recomendado): coloca Caddy/nginx delante de
los puertos 8080/3000 con certificado Let's Encrypt.
EOF
