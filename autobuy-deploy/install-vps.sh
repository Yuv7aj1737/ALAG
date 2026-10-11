#!/bin/bash

echo "🚀 Instalando Autobuy en VPS..."
echo ""

# Directorio de instalación
INSTALL_DIR="/root/mainbot/utils/autobuy"

# 1. Crear directorio si no existe
mkdir -p $INSTALL_DIR
echo "✅ Directorio creado: $INSTALL_DIR"

# 2. Copiar archivos
cp -r autobuy/* $INSTALL_DIR/
echo "✅ Archivos copiados"

# 3. Instalar dependencias npm (si no están instaladas)
echo "📦 Verificando dependencias..."
cd /root/mainbot
npm list bip32 > /dev/null 2>&1 || npm install bip32
npm list bip39 > /dev/null 2>&1 || npm install bip39
npm list sqlite3 > /dev/null 2>&1 || npm install sqlite3
npm list axios > /dev/null 2>&1 || npm install axios
echo "✅ Dependencias instaladas"

# 4. Crear base de datos
echo "💾 Inicializando base de datos..."
node $INSTALL_DIR/autobuyDB.js || echo "⚠️  BD ya existe"

# 5. Crear directorios necesarios
mkdir -p /root/mainbot/db
mkdir -p /root/mainbot/logs
mkdir -p $INSTALL_DIR/temp
echo "✅ Directorios creados"

# 6. Copiar template de config
if [ ! -f "/root/mainbot/autobuy.config.json" ]; then
    cp autobuy.config.json.template /root/mainbot/autobuy.config.json
    echo "⚠️  Archivo de config creado (EDITA LOS VALORES!)"
else
    echo "✅ Archivo de config ya existe"
fi

echo ""
echo "═════════════════════════════════════════"
echo "✨ ¡INSTALACIÓN COMPLETADA!"
echo "═════════════════════════════════════════"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo ""
echo "1. Edita tu config:"
echo "   nano /root/mainbot/autobuy.config.json"
echo ""
echo "2. Agrega:"
echo "   - Mnemonic (24 palabras)"
echo "   - API Key de Blockchair"
echo "   - Discord Channel ID"
echo ""
echo "3. Reinicia el bot:"
echo "   npm restart (en PM2) o npm start"
echo ""
