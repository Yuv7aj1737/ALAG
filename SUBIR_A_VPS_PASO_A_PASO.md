# 📤 SUBIR AUTOBUY AL VPS - Instrucciones Paso a Paso

## Lo que necesitas

✅ IP o dominio de tu VPS  
✅ Usuario: `root`  
✅ Contraseña o SSH key  
✅ La carpeta `autobuy-deploy/` (ya creada)

---

## 🚀 OPCIÓN MÁS FÁCIL: SFTP con FileZilla

### 1. Descargar FileZilla (si no lo tienes)
- Ve a: https://filezilla-project.org/
- Click "Download"
- Instala

### 2. Abrir FileZilla y Conectar

**Menú → File → Site Manager**

```
Host: TU_IP_VPS (ej: 192.168.1.100 o tu.dominio.com)
Port: 22
Protocol: SFTP
Logon Type: Normal
User: root
Password: TU_PASSWORD
```

Click **"Connect"**

### 3. Navegar a /root/mainbot

En la panel derecha, navega a: `/root/mainbot`

### 4. Drag & Drop

Drag la carpeta **`autobuy-deploy`** desde tu PC (izquierda) a `/root/mainbot` (derecha)

### 5. Esperar a que termine

Verás progreso de upload. Cuando diga "Transfer successful" → ✅ Listo

---

## 🔧 OPCIÓN RÁPIDA: PowerShell SCP

### Si tienes OpenSSH instalado en Windows 10/11:

**Abre PowerShell y ejecuta:**

```powershell
# Ir a la carpeta
cd c:\Users\IK\Desktop\autosecure

# Subir la carpeta completa
scp -r autobuy-deploy root@TU_IP_VPS:/root/mainbot/

# Te pedirá contraseña - ingresa tu password del VPS
```

**Ejemplo real:**
```powershell
scp -r autobuy-deploy root@192.168.1.100:/root/mainbot/
```

### Si no tienes SCP, instala OpenSSH:

**PowerShell (como Admin):**
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client
```

---

## ⚙️ DESPUÉS DE SUBIR: Configurar en el VPS

### 1. Conecta por SSH

**PowerShell:**
```powershell
ssh root@TU_IP_VPS
```

**O si usas PuTTY/CMD:**
```cmd
ssh root@192.168.1.100
```

Ingresa tu contraseña cuando te pida.

### 2. Ve a la carpeta
```bash
cd /root/mainbot
```

### 3. Ejecuta instalación
```bash
bash autobuy-deploy/install-vps.sh
```

Esto va a:
- ✅ Copiar archivos a `/root/mainbot/utils/autobuy/`
- ✅ Instalar dependencias npm
- ✅ Crear base de datos
- ✅ Crear directorios necesarios

### 4. Edita la configuración
```bash
nano /root/mainbot/autobuy.config.json
```

**Busca y completa:**

```json
"mnemonic": "AQUI TUS 24 PALABRAS",
"apiKey": "TU_API_KEY_BLOCKCHAIR",
"notifyChannel": "TU_DISCORD_CHANNEL_ID"
```

### 5. Guardar
- Presiona: `Ctrl + O`
- Presiona: `Enter`
- Presiona: `Ctrl + X`

### 6. Reiniciar Bot
```bash
# Si usas PM2
pm2 restart mainbot

# Si usas npm
npm restart
# o
npm start
```

---

## ✅ Verificar que Funciona

### Ver logs en vivo
```bash
tail -f /root/mainbot/logs/autobuy.log
```

### Hacer test rápido
```bash
node /root/mainbot/utils/autobuy/test-system.js
```

### En Discord
Prueba:
```
/autobuy buy license_1
```

Si ves dirección LTC → ✅ **¡FUNCIONANDO!**

---

## 🆘 Si Algo Sale Mal

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

### "No se puede conectar SSH"
- Verifica que SSH esté habilitado en VPS
- Verifica IP correcta
- Verifica usuario/contraseña
- Prueba desde CMD: `ssh -v root@IP` (debug mode)

### "FileZilla no se conecta"
- Verifica puerto 22 está abierto
- Verifica protocolo es SFTP (no FTP)
- Intenta user "root" (no otro usuario)

---

## 📝 Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | Sube `autobuy-deploy/` a `/root/mainbot` (SFTP o SCP) |
| 2 | Ejecuta: `bash autobuy-deploy/install-vps.sh` |
| 3 | Edita: `/root/mainbot/autobuy.config.json` |
| 4 | Reinicia bot: `pm2 restart mainbot` |
| 5 | Prueba: `/autobuy buy license_1` en Discord |

---

## 💰 Listo!

Tu Autobuy está en el VPS y funcionando.

Ahora tus usuarios pueden comprar con `/autobuy buy` y el dinero va directo a tu wallet LTC. 🎉

---

## 📞 Si Necesitas Ayuda

**Revisa estos archivos en `autobuy-deploy/`:**
- `DEPLOYMENT_INSTRUCTIONS.md` - Opciones detalladas
- `DEPLOYMENT_CHECKLIST.md` - Verificación paso a paso

**En el VPS, ejecuta:**
```bash
node /root/mainbot/utils/autobuy/test-system.js
tail -f /root/mainbot/logs/autobuy.log
```

---

**¿Qué IP tiene tu VPS?**  
Dame tu IP y te puedo ayudar con detalles específicos. 🚀
