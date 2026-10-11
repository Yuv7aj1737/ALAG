# 📤 Instrucciones de Deployment - Autobuy a VPS

## Archivo de Deployment
El directorio `autobuy-deploy/` contiene todo lo necesario.

## OPCIÓN 1: Usar SFTP (Recomendado - Fácil)

### 1. Conectar SFTP
```bash
sftp root@TU_IP_VPS
```

### 2. Navegar a directorio mainbot
```bash
cd /root/mainbot
```

### 3. Subir archivos
```bash
put -r autobuy-deploy/* .
```

### 4. Ejecutar instalación
```bash
exit
ssh root@TU_IP_VPS
cd /root/mainbot
bash install-vps.sh
```

---

## OPCIÓN 2: Usar SSH + tar (Rápido)

### En tu computadora (PowerShell):
```powershell
# Comprimir archivos
tar -czf autobuy-deploy.tar.gz autobuy-deploy/

# Subir al VPS
scp autobuy-deploy.tar.gz root@TU_IP_VPS:/root/mainbot/
```

### En el VPS:
```bash
cd /root/mainbot
tar -xzf autobuy-deploy.tar.gz
bash autobuy-deploy/install-vps.sh
```

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
```bash
cd /root/mainbot
bash install-vps.sh
```

---

## Después de Instalación

### 1. Editar configuración
```bash
nano /root/mainbot/autobuy.config.json
```

Campos a completar:
- `mnemonic` - Tus 24 palabras
- `apiKey` - De Blockchair
- `notifyChannel` - ID del canal Discord

### 2. Guardar (Ctrl+O, Enter, Ctrl+X)

### 3. Reiniciar bot
```bash
pm2 restart mainbot
# o
npm start
```

### 4. Verificar
```bash
# Ver logs
tail -f logs/autobuy.log

# O en Discord
/autobuy buy license_1
```

---

## Troubleshooting

### "Permission denied"
```bash
chmod +x install-vps.sh
bash install-vps.sh
```

### "npm not found"
Instala Node.js en el VPS:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### "Module not found"
```bash
cd /root/mainbot
npm install bip32 bip39 sqlite3 axios
```

### Ver archivo de config
```bash
cat /root/mainbot/autobuy.config.json
```

---

## Verificar Instalación

```bash
# Ver estructura
ls -la /root/mainbot/utils/autobuy/

# Ver config
cat /root/mainbot/autobuy.config.json

# Ver logs
tail -f /root/mainbot/logs/autobuy.log

# Test
node /root/mainbot/utils/autobuy/test-system.js
```

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
```
/autobuy buy license_1
```

El dinero llegará directamente a tu wallet LTC. 💰
