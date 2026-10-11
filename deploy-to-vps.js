#!/usr/bin/env node

/**
 * Script de Deployment - Autobuy a VPS
 * Prepara los archivos para subir al VPS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🚀 DEPLOYMENT - Autobuy a VPS\n');
console.log('═════════════════════════════════════════\n');

// 1. Crear directorio de deployment
const deployDir = path.join(__dirname, 'autobuy-deploy');
if (fs.existsSync(deployDir)) {
    execSync(`rmdir /s /q "${deployDir}"`, { stdio: 'inherit', shell: 'powershell' });
}
fs.mkdirSync(deployDir, { recursive: true });

console.log('📁 Creando estructura de deployment...\n');

// 2. Copiar archivos de autobuy
const autobuySource = path.join(__dirname, 'autosecure', 'utils', 'autobuy');
const autobuyDest = path.join(deployDir, 'autobuy');

console.log('📋 Copiando archivos de autobuy...');
execSync(`xcopy "${autobuySource}" "${autobuyDest}" /E /I`, { stdio: 'inherit', shell: 'cmd' });

// 3. Copiar archivos de configuración
console.log('\n⚙️  Copiando configuración...');

// Template de config (sin mnemonic)
const configTemplate = {
    "autobuy": {
        "enabled": true,
        "monitoringInterval": 60000,
        "blockchain": {
            "network": "litecoin",
            "api": {
                "provider": "blockchair",
                "apiKey": "PASTE_YOUR_API_KEY_HERE"
            }
        },
        "wallet": {
            "mnemonic": "PASTE_YOUR_24_WORDS_HERE",
            "dbPath": "/root/mainbot/autobuy.db",
            "currency": "LTC"
        },
        "payments": {
            "minAmount": 0.0001,
            "requiredConfirmations": 1,
            "addressExpiry": 3600,
            "webhook": {
                "enabled": false,
                "url": "",
                "secret": ""
            }
        },
        "discord": {
            "notifyChannel": null,
            "notifyRole": null,
            "autoDeliver": true
        },
        "fees": {
            "enabled": false,
            "percentage": 0
        }
    }
};

fs.writeFileSync(
    path.join(deployDir, 'autobuy.config.json.template'),
    JSON.stringify(configTemplate, null, 2)
);

// 4. Crear .env.example
const envExample = `# Autobuy LTC - Environment Variables
AUTOBUY_MNEMONIC=palabra1 palabra2 ... palabra24
BLOCKCHAIR_API_KEY=tu_api_key_aqui
AUTOBUY_ENABLED=true
DISCORD_NOTIF_CHANNEL=123456789
`;

fs.writeFileSync(path.join(deployDir, '.env.example'), envExample);

// 5. Crear script de instalación para el VPS
const installScript = `#!/bin/bash

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
`;

fs.writeFileSync(path.join(deployDir, 'install-vps.sh'), installScript);

// Hacer script ejecutable
fs.chmodSync(path.join(deployDir, 'install-vps.sh'), 0o755);

// 6. Crear instrucciones de deployment
const instructions = `# 📤 Instrucciones de Deployment - Autobuy a VPS

## Archivo de Deployment
El directorio \`autobuy-deploy/\` contiene todo lo necesario.

## OPCIÓN 1: Usar SFTP (Recomendado - Fácil)

### 1. Conectar SFTP
\`\`\`bash
sftp root@TU_IP_VPS
\`\`\`

### 2. Navegar a directorio mainbot
\`\`\`bash
cd /root/mainbot
\`\`\`

### 3. Subir archivos
\`\`\`bash
put -r autobuy-deploy/* .
\`\`\`

### 4. Ejecutar instalación
\`\`\`bash
exit
ssh root@TU_IP_VPS
cd /root/mainbot
bash install-vps.sh
\`\`\`

---

## OPCIÓN 2: Usar SSH + tar (Rápido)

### En tu computadora (PowerShell):
\`\`\`powershell
# Comprimir archivos
tar -czf autobuy-deploy.tar.gz autobuy-deploy/

# Subir al VPS
scp autobuy-deploy.tar.gz root@TU_IP_VPS:/root/mainbot/
\`\`\`

### En el VPS:
\`\`\`bash
cd /root/mainbot
tar -xzf autobuy-deploy.tar.gz
bash autobuy-deploy/install-vps.sh
\`\`\`

---

## OPCIÓN 3: Usar FileZilla (GUI)

### 1. Abre FileZilla
### 2. Conecta: File → Site Manager
   - Host: TU_IP_VPS
   - Usuario: root
   - Contraseña: tu_password
   - Puerto: 22 (SFTP)

### 3. Navega a: /root/mainbot

### 4. Drag & drop: autobuy-deploy/ al VPS

### 5. Conecta por SSH y ejecuta:
\`\`\`bash
cd /root/mainbot
bash install-vps.sh
\`\`\`

---

## Después de Instalación

### 1. Editar configuración
\`\`\`bash
nano /root/mainbot/autobuy.config.json
\`\`\`

Campos a completar:
- \`mnemonic\` - Tus 24 palabras
- \`apiKey\` - De Blockchair
- \`notifyChannel\` - ID del canal Discord

### 2. Guardar (Ctrl+O, Enter, Ctrl+X)

### 3. Reiniciar bot
\`\`\`bash
pm2 restart mainbot
# o
npm start
\`\`\`

### 4. Verificar
\`\`\`bash
# Ver logs
tail -f logs/autobuy.log

# O en Discord
/autobuy buy license_1
\`\`\`

---

## Troubleshooting

### "Permission denied"
\`\`\`bash
chmod +x install-vps.sh
bash install-vps.sh
\`\`\`

### "npm not found"
Instala Node.js en el VPS:
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
\`\`\`

### "Module not found"
\`\`\`bash
cd /root/mainbot
npm install bip32 bip39 sqlite3 axios
\`\`\`

### Ver archivo de config
\`\`\`bash
cat /root/mainbot/autobuy.config.json
\`\`\`

---

## Verificar Instalación

\`\`\`bash
# Ver estructura
ls -la /root/mainbot/utils/autobuy/

# Ver config
cat /root/mainbot/autobuy.config.json

# Ver logs
tail -f /root/mainbot/logs/autobuy.log

# Test
node /root/mainbot/utils/autobuy/test-system.js
\`\`\`

---

## Rutas en el VPS

| Archivo | Ruta |
|---------|------|
| Código | /root/mainbot/utils/autobuy/ |
| Config | /root/mainbot/autobuy.config.json |
| BD | /root/mainbot/db/autobuy.db |
| Logs | /root/mainbot/logs/autobuy.log |

---

## ¡Listo!

Tu sistema de Autobuy está en el VPS. 🚀

Para usar:
\`\`\`
/autobuy buy license_1
\`\`\`

El dinero llegará directamente a tu wallet LTC. 💰
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);

// 7. Crear script de actualización
const updateScript = `#!/bin/bash

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
`;

fs.writeFileSync(path.join(deployDir, 'update-vps.sh'), updateScript);
fs.chmodSync(path.join(deployDir, 'update-vps.sh'), 0o755);

// 8. Crear checklist de deployment
const checklist = `# ✅ Checklist de Deployment

## Antes de Subir

- [ ] Tienes acceso SSH/SFTP al VPS
- [ ] Conoces tu contraseña de root
- [ ] Tienes la IP o dominio del VPS
- [ ] Node.js está instalado en el VPS
- [ ] npm está instalado en el VPS

## Proceso de Upload

- [ ] Comprimiste autobuy-deploy/
- [ ] Subiste archivos al VPS
- [ ] Ejecutaste install-vps.sh
- [ ] Sin errores en la instalación

## Post-Instalación

- [ ] Editaste autobuy.config.json con:
  - [ ] Mnemonic (24 palabras)
  - [ ] API Key Blockchair
  - [ ] Discord Channel ID
- [ ] Guardaste el archivo
- [ ] Reiniciaste el bot

## Verificación

- [ ] Bot está online en Discord
- [ ] Comando /autobuy funciona
- [ ] Genera dirección correctamente
- [ ] Sistema monitorea transacciones
- [ ] Logs sin errores

## En Caso de Problema

- [ ] Revisar logs: tail -f /root/mainbot/logs/autobuy.log
- [ ] Ejecutar: node /root/mainbot/utils/autobuy/test-system.js
- [ ] Verificar config: cat /root/mainbot/autobuy.config.json
- [ ] Revisar permisos: ls -la /root/mainbot/utils/autobuy/

## ¡Listo!

Tu Autobuy está en producción. 🚀💰
`;

fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT_CHECKLIST.md'), checklist);

// 9. Resumen
console.log('✅ Estructura de deployment creada:\n');
console.log('Archivos incluidos:');
console.log('  ├─ autobuy/              (código fuente)');
console.log('  ├─ autobuy.config.json.template');
console.log('  ├─ .env.example');
console.log('  ├─ install-vps.sh        (ejecutar en VPS)');
console.log('  ├─ update-vps.sh         (para actualizaciones)');
console.log('  ├─ DEPLOYMENT_INSTRUCTIONS.md');
console.log('  └─ DEPLOYMENT_CHECKLIST.md');

console.log('\n═════════════════════════════════════════\n');

console.log('📤 PRÓXIMOS PASOS:\n');
console.log('1. Abre: autobuy-deploy/DEPLOYMENT_INSTRUCTIONS.md');
console.log('2. Elige tu método (SFTP, SSH, o FileZilla)');
console.log('3. Sigue las instrucciones');
console.log('4. Ejecuta: install-vps.sh en tu VPS');
console.log('5. Edita: /root/mainbot/autobuy.config.json');
console.log('6. Reinicia el bot');
console.log('\n✨ ¡Tu Autobuy estará en vivo!');
console.log('\nCarpeta: autobuy-deploy/');
console.log('\n');
