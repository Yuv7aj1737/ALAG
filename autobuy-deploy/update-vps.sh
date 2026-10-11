#!/bin/bash

# Script para actualizar Autobuy en VPS
echo "🔄 Actualizando Autobuy..."

INSTALL_DIR="/root/mainbot/utils/autobuy"

# Backup actual
echo "💾 Haciendo backup..."
cp -r $INSTALL_DIR $INSTALL_DIR.backup.$(date +%s)

# Copiar nuevos archivos
echo "📁 Copiando nuevos archivos..."
cp -r autobuy/* $INSTALL_DIR/

# Reiniciar bot
echo "🔄 Reiniciando bot..."
cd /root/mainbot
pm2 restart mainbot || npm restart

echo "✅ ¡Actualización completa!"
