# 🚀 GUÍA RÁPIDA - Deployment a VPS

## Carpeta Creada: `autobuy-deploy/`

Todo lo que necesitas para subir Autobuy a tu VPS está en esta carpeta.

---

## 3 Opciones de Upload

### OPCIÓN 1️⃣: SFTP (Más Fácil - Recomendado)

**Si tienes FileZilla o WinSCP:**

```bash
1. Abre FileZilla
2. Conecta a tu VPS
3. Navega a: /root/mainbot
4. Drag & drop: autobuy-deploy/
5. Listo!
```

---

### OPCIÓN 2️⃣: SSH + SCP (Más Rápido)

**En PowerShell:**

```powershell
# Copiar carpeta completa
scp -r autobuy-deploy root@TU_IP_VPS:/root/mainbot/

# Ejecutar instalación
ssh root@TU_IP_VPS "cd /root/mainbot && bash autobuy-deploy/install-vps.sh"
```

---

### OPCIÓN 3️⃣: Crear ZIP y Subir

**En PowerShell:**

```powershell
# Comprimir
Compress-Archive -Path 'autobuy-deploy' -DestinationPath 'autobuy-deploy.zip'

# Subir zip
scp autobuy-deploy.zip root@TU_IP_VPS:/root/mainbot/

# En el VPS, descomprimir y instalar
ssh root@TU_IP_VPS
cd /root/mainbot
unzip autobuy-deploy.zip
bash autobuy-deploy/install-vps.sh
```

---

## Después de Upload: CONFIGURACIÓN

### 1. Conecta al VPS
```bash
ssh root@TU_IP_VPS
```

### 2. Edita la configuración
```bash
nano /root/mainbot/autobuy.config.json
```

### 3. Completa estos campos:

```json
"mnemonic": "palabra1 palabra2 ... palabra24",
"apiKey": "TU_BLOCKCHAIR_API_KEY",
"notifyChannel": "TU_DISCORD_CHANNEL_ID"
```

### 4. Guarda (Ctrl+O, Enter, Ctrl+X)

### 5. Reinicia el bot
```bash
pm2 restart mainbot
# o
npm start
```

---

## Verificar que Funciona

```bash
# Ver logs en vivo
tail -f /root/mainbot/logs/autobuy.log

# Hacer test
node /root/mainbot/utils/autobuy/test-system.js
```

---

## En Discord

Prueba el comando:
```
/autobuy buy license_1
```

Si genera dirección LTC → ✅ **¡FUNCIONANDO!**

---

## Si Hay Problemas

### "Permission denied"
```bash
chmod +x /root/mainbot/autobuy-deploy/install-vps.sh
bash /root/mainbot/autobuy-deploy/install-vps.sh
```

### "Module not found"
```bash
cd /root/mainbot
npm install bip32 bip39 sqlite3 axios
```

### Ver error específico
```bash
cat /root/mainbot/logs/autobuy.log
node /root/mainbot/utils/autobuy/test-system.js
```

---

## Actualizar Después

Cuando hagas cambios locales:

```powershell
# Ejecuta nuevamente
node deploy-to-vps.js

# Sube nuevamente
scp -r autobuy-deploy root@TU_IP_VPS:/root/mainbot/

# En VPS
ssh root@TU_IP_VPS "bash /root/mainbot/autobuy-deploy/update-vps.sh"
```

---

## Rutas en VPS

```
/root/mainbot/
├── utils/autobuy/          ← Código
├── autobuy.config.json     ← Configuración
├── db/autobuy.db           ← Base de datos
├── logs/autobuy.log        ← Logs
└── autobuy-deploy/         ← Scripts
```

---

## ✅ Checklist

- [ ] Subiste autobuy-deploy/ a /root/mainbot
- [ ] Ejecutaste install-vps.sh
- [ ] Sin errores en instalación
- [ ] Editaste autobuy.config.json
- [ ] Agregaste mnemonic
- [ ] Agregaste API Key
- [ ] Reiniciaste el bot
- [ ] Probaste /autobuy en Discord

---

## 💡 Tips

- **Backup:** `/root/mainbot/autobuy-deploy/update-vps.sh` hace backup automático
- **Logs:** `tail -f` es tu amigo para debuggear
- **Testing:** Usa `test-system.js` antes de preocuparte
- **Emergencia:** Restaura backup: `cp -r /root/mainbot/utils/autobuy.backup.* /root/mainbot/utils/autobuy`

---

## 🎉 ¡Listo!

Tu Autobuy está en producción. 

Los usuarios pueden comprar con `/autobuy buy` y el dinero llega a tu wallet LTC automáticamente. 💰

---

**¿Necesitas ayuda?**

Lee: `autobuy-deploy/DEPLOYMENT_INSTRUCTIONS.md` para opciones detalladas.
