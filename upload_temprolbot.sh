#!/bin/bash
# Script para subir temprolbot al VPS sin afectar mainbot y autosecure

VPS_IP="YOUR_VPS_IP"
VPS_USER="root"
VPS_PATH="/root/autosecure/temprolbot"
LOCAL_PATH="C:\\Users\\YOURNAME\\Desktop\\autosecure\\temprolbot"

echo "=================================="
echo "🚀 Subiendo Temporal Role Bot al VPS"
echo "=================================="
echo ""
echo "VPS: $VPS_USER@$VPS_IP"
echo "Ruta Local: $LOCAL_PATH"
echo "Ruta VPS: $VPS_PATH"
echo ""

# Crear la carpeta en el VPS si no existe
echo "📁 Creando directorio en el VPS..."
ssh root@$VPS_IP "mkdir -p $VPS_PATH"

if [ $? -ne 0 ]; then
    echo "❌ Error creando directorio en VPS"
    exit 1
fi

echo "✅ Directorio creado"
echo ""

# Subir todos los archivos
echo "📤 Subiendo archivos con SCP..."
scp -r "$LOCAL_PATH/*" root@$VPS_IP:$VPS_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Error subiendo archivos"
    exit 1
fi

echo "✅ Archivos subidos exitosamente"
echo ""

# Instalar dependencias en el VPS
echo "📦 Instalando dependencias en el VPS..."
ssh root@$VPS_IP "cd $VPS_PATH && npm install"

if [ $? -ne 0 ]; then
    echo "⚠️ Error instalando dependencias (esto puede ser normal si npm ya está actualizado)"
fi

echo ""
echo "=================================="
echo "✅ Temporal Role Bot subido al VPS"
echo "=================================="
echo ""
echo "📝 Próximos pasos:"
echo "1. Conecta al VPS: ssh root@$VPS_IP"
echo "2. Navega a: cd $VPS_PATH"
echo "3. Verifica: ls -la"
echo "4. Inicia el bot: npm start"
echo ""
echo "Alternativamente, usa PM2 para ejecutar en segundo plano:"
echo "pm2 start temprolbot.js --name temprolbot"
echo "pm2 save"
echo ""
