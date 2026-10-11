# 🔐 Guía de Seguridad - Sistema Autobuy

## ⚠️ LO MÁS IMPORTANTE

Tu **mnemonic (24 palabras)** es la clave maestra de TODOS tus fondos.

**Si la pierdes o se la das a alguien:**
- ❌ Pierdes todo el dinero
- ❌ No hay recuperación
- ❌ No hay soporte técnico

---

## 📋 Checklist de Seguridad

### ✅ ANTES DE EMPEZAR

- [ ] Guarda las 24 palabras en un lugar FÍSICO seguro
  - [ ] Escribe a mano en papel
  - [ ] O usa tableta de acero (Steelwallet)
  - [ ] O guarda en caja fuerte bancaria

- [ ] NO guardes mnemonic digitalmente en:
  - [ ] Notas de teléfono
  - [ ] Email
  - [ ] Screenshots
  - [ ] Mensajes
  - [ ] Cloud (Google Drive, Dropbox, etc)

- [ ] Crea backups de la mnemonic
  - [ ] Copia 1: Casa en caja fuerte
  - [ ] Copia 2: Banco (caja de seguridad)
  - [ ] Copia 3: Lugar seguro adicional

---

## 🛡️ Proteger tu Configuración

### Opción 1: Variables de Entorno (RECOMENDADO)

En lugar de guardar mnemonic en `autobuy.config.json`:

**1. Crear archivo `.env` (no versionar)**
```bash
# En la raíz del proyecto
AUTOBUY_MNEMONIC=palabra1 palabra2 ... palabra24
BLOCKCHAIR_API_KEY=tu_api_key_aqui
```

**2. Agregar `.env` a `.gitignore`**
```bash
# .gitignore
.env
.env.local
.env.*.local
backups/
db/autobuy.db
logs/
```

**3. Leer en el código**
```javascript
require('dotenv').config();

const mnemonic = process.env.AUTOBUY_MNEMONIC;
const apiKey = process.env.BLOCKCHAIR_API_KEY;
```

**Instalar dotenv:**
```bash
npm install dotenv
```

### Opción 2: Archivo de configuración privado

```
autobuy.config.json (en .gitignore)
autobuy.config.template.json (en GitHub como ejemplo)
```

---

## 🔒 Permisos de Archivos

### En Linux/Mac
```bash
# Solo tú puedes leer config
chmod 600 autobuy.config.json

# Solo tú puedes acceder a backups
chmod 700 backups/

# Base de datos privada
chmod 600 db/autobuy.db
```

### En Windows PowerShell
```powershell
# Solo usuario actual puede acceder
$acl = Get-Acl "autobuy.config.json"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "$env:USERNAME",
    "FullControl",
    "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl "autobuy.config.json" $acl
```

---

## 📱 Proteger tu Wallet de Litecoin

### Si usas Exodus (Desktop)
```
✅ Contraseña fuerte (16+ caracteres)
✅ PIN de 6 dígitos para salidas
✅ Autenticación 2FA si disponible
✅ Respalda seed phrase (más allá de este sistema)
```

### Si usas Ledger (Hardware)
```
✅ PIN de 6+ dígitos
✅ Guarda recovery phrase separada
✅ Solo conecta a computadoras de confianza
✅ Verifica direcciones en el dispositivo
```

### Si usas Kraken/Binance (Exchange)
```
✅ Contraseña muy fuerte (20+ caracteres)
✅ Autenticación 2FA (Google Authenticator, no SMS)
✅ Backup de códigos 2FA
✅ Whitelist de direcciones para retiros
✅ Retira poco a poco a tu wallet personal
```

---

## 🔑 API Key de Blockchair

### Seguridad

La API Key de Blockchair:
- ✅ Solo puede **leer** transacciones (no hay permisos de escritura)
- ✅ No puede acceder a direcciones privadas
- ✅ No puede hacer transacciones

Pero debes protegerla:
```bash
# NO:
BLOCKCHAIR_API_KEY=abc123 (en GitHub)

# SÍ:
Guardada en .env o variable de entorno
```

### Rotación de API Keys

Si sospechas que se expuso:
1. Ve a https://blockchair.com/api
2. Elimina la clave comprometida
3. Crea una nueva
4. Actualiza tu .env

---

## 🚨 Si pasa algo malo

### Mi mnemonic fue expuesta

**ACCIÓN INMEDIATA:**
1. Deja de usar esa mnemonic
2. Genera una nueva
3. Transferencia todos los fondos a la nueva dirección
4. Cambia en `autobuy.config.json`

```javascript
const oldWallet = require('./ltcWallet');
const newWallet = new oldWallet.LTCWallet(); // Crea nueva

// Transfiere fondos manualmente a la nueva dirección
```

### Mi API Key fue expuesta

1. Elimina la clave en blockchair.com
2. Crea una nueva
3. Actualiza en .env
4. No hay riesgo de fondos (es solo lectura)

### Mi base de datos fue comprometida

La base de datos contiene:
- Direcciones (públicas, está bien)
- Transacciones (públicas, está bien)
- NO contiene: Claves privadas

No hay riesgo de fondos.

---

## 📊 Auditoría de seguridad

### Qué guardar en lugar seguro

```
1. Mnemonic (24 palabras) - CRÍTICO
   └─ Impreso en papel en caja fuerte
   
2. Copia de seguridad de BD
   └─ Backup mensual de autobuy.db
   
3. Documentación de configuración
   └─ Precios, Discord ID, etc.
```

### Qué NO guardar

```
❌ Fotos de la mnemonic
❌ Mensajes con API keys
❌ Código en repositorio público con secrets
❌ Contraseñas en notas abiertas
```

### Qué verificar regularmente

```
✅ Respalda mnemonic cada 3 meses
✅ Revisa transacciones en Blockchair
✅ Verifica saldo en tu wallet
✅ Actualiza software (Node.js, npm)
✅ Busca actualizaciones de seguridad
```

---

## 🛠️ Mejores prácticas

### Desarrollo seguro

```javascript
// ❌ MAL
const mnemonic = "palabra1 palabra2 ..."; // En el código

// ✅ BIEN
const mnemonic = process.env.AUTOBUY_MNEMONIC;
```

### Versionado con git

```bash
# .gitignore
*.env
*.env.local
autobuy.config.json
db/autobuy.db
logs/
backups/

# Pero sí versionamos:
.env.example
autobuy.config.template.json
```

### Despliegue en servidor

Si despliegas en servidor:
1. Nunca clones con .env incluido
2. Crea .env en el servidor manualmente
3. Usa permisos restrictivos
4. Configura secrets en CI/CD

---

## 🎓 Recursos adicionales

### Sobre Litecoin y seguridad
- https://litecoin.org/
- https://blog.ledger.com/ (seguridad hardware)

### Sobre BIP32/BIP44
- BIP32: https://github.com/trezor/slips/blob/master/slip-0032.md
- BIP44: https://github.com/trezor/slips/blob/master/slip-0044.md

### Sobre gestión de secrets
- https://12factor.net/config (The Twelve-Factor App)
- OWASP: https://owasp.org/

---

## ✅ Checklist final

```
[ ] Guardé mnemonic en lugar físico seguro
[ ] Tengo backups de la mnemonic
[ ] Configuré .env correctamente
[ ] .env está en .gitignore
[ ] API Key no está en código
[ ] Probé que el sistema funciona
[ ] Verifiqué permisos de archivos
[ ] Hice backup de la BD
[ ] Documenté mis configuraciones
[ ] Sé dónde está cada backup
```

---

## 📞 En caso de dudas

Si algo no está claro:

1. **Lee esta guía nuevamente** - 90% de problemas se resuelven aquí
2. **Consulta la documentación técnica** - AUTOBUY_ARCHITECTURE.md
3. **Ejecuta test-system.js** - Diagnostica problemas
4. **Revisa los logs** - logs/autobuy.log

---

**Tu seguridad es tu responsabilidad.**

Tómate tiempo para implementar estas medidas correctamente.

El dinero que protejas es dinero que no pierdes. 🛡️💰
