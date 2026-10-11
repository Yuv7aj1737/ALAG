# 💰 Sistema Autobuy con Litecoin - Guía Completa

## ¿Qué es este sistema?

Sistema automático de compras donde:
- 🤖 Tus usuarios compran **licenses** o **slots** con **Litecoin (LTC)**
- 📊 El dinero llega automáticamente a **tu wallet LTC**
- ✅ Todo se procesa sin intervención manual
- 🔗 La blockchain confirma los pagos automáticamente

---

## 📋 Requisitos Previos

### 1. Wallet de Litecoin
Necesitas una wallet de Litecoin para recibir fondos. Opciones:
- **Ledger** (Hardware wallet - más seguro)
- **Exodus** (Desktop - fácil de usar)
- **Kraken/Binance** (Exchange - si quieres convertir a dinero)
- **Litecoin Core** (Full node - si quieres control total)

Para esta guía, recomiendo **Exodus** por simplicidad.

### 2. Node.js y npm
```bash
npm install bip32 bip39 axios
```

### 3. API Key de Blockchair (Gratis)
Necesitas registrarte en https://blockchair.com/api para monitorear transacciones.

---

## 🚀 Paso 1: Obtener tu Wallet Master

### Opción A: Crear una nueva wallet
```bash
node -e "const bip39 = require('bip39'); console.log(bip39.generateMnemonic(256));"
```

Esto te dará 24 palabras como:
```
abandon ability able about above absent absorb abstract abuse access accident account
achieve acid acoustic acknowledge acquire across act action activate active actor acts
```

⚠️ **GUARDA ESTAS PALABRAS EN UN LUGAR SEGURO** - son la clave maestra para todos los fondos.

### Opción B: Usar wallet existente
Si ya tienes una wallet de Litecoin:
1. Abre tu wallet (Exodus, Ledger, etc.)
2. Busca "Mnemonic", "Seed Phrase" o "Recovery Phrase"
3. Copia las 12 o 24 palabras

---

## ⚙️ Paso 2: Configurar el sistema

### 1. Instalar dependencias necesarias
```bash
cd c:\Users\IK\Desktop\autosecure
npm install bip32 bip39 axios sqlite3 axios
```

### 2. Actualizar `autobuy.config.json`

Abre el archivo y complétalo:

```json
{
  "autobuy": {
    "enabled": true,
    "monitoringInterval": 60000,
    "blockchain": {
      "network": "litecoin",
      "api": {
        "provider": "blockchair",
        "apiKey": "TU_API_KEY_BLOCKCHAIR"
      }
    },
    "wallet": {
      "mnemonic": "TUS_24_PALABRAS_AQUI",
      "dbPath": "c:\\Users\\IK\\Desktop\\autosecure\\db\\autobuy.db",
      "currency": "LTC"
    },
    "payments": {
      "minAmount": 0.001,
      "requiredConfirmations": 1,
      "addressExpiry": 3600
    },
    "discord": {
      "notifyChannel": "TU_CHANNEL_ID",
      "autoDeliver": true
    }
  }
}
```

**Qué significa:**
- `mnemonic`: Tus 24 palabras de seguridad
- `apiKey`: Tu API key de Blockchair
- `minAmount`: Cantidad mínima de LTC para comprar
- `requiredConfirmations`: Cuántas confirmaciones de blockchain para validar
- `notifyChannel`: ID del canal donde notificar pagos

---

## 🔑 Paso 3: Obtener tu API Key de Blockchair

1. Ve a https://blockchair.com/api
2. Click en "Sign Up" (arriba a la derecha)
3. Crea cuenta con email
4. Verifica tu email
5. En el dashboard, copia tu **API Key**
6. Pega en `autobuy.config.json` en la sección `apiKey`

---

## 💾 Paso 4: Inicializar la Base de Datos

```bash
node c:\Users\IK\Desktop\autosecure\autosecure\utils\autobuy\autobuyDB.js
```

Esto crea las tablas necesarias en SQLite:
- `licenses` - Los productos a vender
- `payment_addresses` - Las direcciones LTC generadas
- `transactions` - Los pagos recibidos

---

## 📝 Paso 5: Agregar Licenses/Slots a Vender

### Opción A: Usando Base de Datos

```bash
node
```

```javascript
const AutobuyDB = require('./autosecure/utils/autobuy/autobuyDB');
const db = new AutobuyDB();

// Agregar license
await db.addLicense(
    'license_1',
    'license',
    '123456789',  // Tu ID de Discord
    0.001,        // Precio en LTC (ejemplo: 0.001 LTC)
    5.00          // Precio en USD equivalente
);

// Agregar slot
await db.addLicense(
    'slot_1',
    'slot',
    '123456789',
    0.002,
    10.00
);
```

### Opción B: Script automático

Crea un archivo `setup_licenses.js`:

```javascript
const AutobuyDB = require('./autosecure/utils/autobuy/autobuyDB');

const db = new AutobuyDB();

async function setup() {
    try {
        // Licenses
        await db.addLicense('license_1', 'license', '123456789', 0.001, 5.00);
        await db.addLicense('license_2', 'license', '123456789', 0.001, 5.00);
        
        // Slots
        await db.addLicense('slot_1', 'slot', '123456789', 0.002, 10.00);
        await db.addLicense('slot_2', 'slot', '123456789', 0.002, 10.00);
        
        console.log('✅ Licenses agregadas correctamente');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

setup();
```

Luego ejecuta:
```bash
node setup_licenses.js
```

---

## 🤖 Paso 6: Integrar con tu Bot de Discord

### Opción A: Comando `/autobuy buy`

El comando ya existe en `autosecure/Commands/admin/autobuy.js`

Para usarlo:
```
/autobuy buy license_1
```

Esto genera una dirección LTC única para cada compra.

### Opción B: Crear botones en el shop

Ya tienes botones en `mainbot/Buttons/autobuy_*.js`

---

## 🔄 Paso 7: Verificar que funciona

### Test 1: Generar dirección

```javascript
const AutobuyManager = require('./autosecure/utils/autobuy/autobuyManager');
const config = require('./autobuy.config.json');

const manager = new AutobuyManager(config.autobuy.wallet.mnemonic, config.autobuy.blockchain.api.apiKey, config);

const payment = await manager.createPaymentRequest(
    'license_1',
    '123456789',  // Tu Discord ID
    0.001,        // Precio
    3600          // Expira en 1 hora
);

console.log('Dirección:', payment.address);
console.log('Monto esperado:', payment.expectedAmount, 'LTC');
```

### Test 2: Monitorear blockchain

```javascript
const manager = new AutobuyManager(...);

// Inicia monitoreo
manager.startMonitoring();

// El sistema ahora monitoreará automáticamente la blockchain
```

---

## 💳 Paso 8: Hacer una compra de prueba (Testnet)

### Opción A: Con dinero real (MainNet)

1. Usuario envia LTC a la dirección generada
2. Bot monitorea automáticamente
3. Cuando llega, confirma y entrega el producto

### Opción B: Con testnet (sin dinero real)

Si quieres probar sin gastar dinero, usa Litecoin Testnet.

---

## 📊 Cómo el dinero llega a ti

```
Usuario envía LTC a: bc1qr2345...  (Generada por tu wallet)
                              ↓
                    (Blockchain Litecoin)
                              ↓
                    Tu wallet maestra recibe
                              ↓
                    Puedes ver en: Exodus, Ledger, etc.
                              ↓
                    (Opcional) Vender en: Kraken, Binance, etc.
```

---

## 🛡️ Seguridad

### ✅ BUENAS PRÁCTICAS

1. **Guarda tu Mnemonic en lugar seguro**
   - NO en el código
   - NO en repositorios públicos
   - Imprímelo y guárdalo

2. **Usa variable de entorno**
   ```bash
   set AUTOBUY_MNEMONIC=tus_24_palabras
   ```
   
   Luego en el código:
   ```javascript
   const mnemonic = process.env.AUTOBUY_MNEMONIC;
   ```

3. **API Keys seguros**
   ```bash
   set BLOCKCHAIR_API_KEY=tu_api_key
   ```

4. **Backups regulares**
   - Backup de la base de datos SQLite
   - Backup del archivo de configuración

---

## 🐛 Troubleshooting

### "Invalid mnemonic"
- Verifica que las 24 palabras estén correctas
- No debe haber espacios extra

### "API Key no válida"
- Regístrate nuevamente en https://blockchair.com/api
- Verifica que el API key esté bien copiado
- Que no tenga espacios antes o después

### "Dirección de wallet no válida"
- Asegúrate de usar Litecoin (mainnet)
- Las direcciones deben empezar con `L` o `M` (Litecoin mainnet)

### La blockchain no detecta pagos
- Verifica que la transacción esté confirmada
- Revisa en https://blockchair.com/litecoin/transactions
- Asegúrate de que la API key tenga permisos de lectura

---

## 📈 Precios Recomendados

```
1 License = 0.001 LTC (~$0.05 USD)
1 Slot = 0.002 LTC (~$0.10 USD)
```

Ajusta según tu mercado local.

---

## 🚀 Próximas características

- [ ] Convertir LTC a USD automáticamente
- [ ] Webhook automático desde Blockchair
- [ ] Dashboard web para ver ventas
- [ ] Reportes de ingresos
- [ ] Soporte para múltiples monedas

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en `logs/`
2. Verifica `autobuy.config.json`
3. Asegúrate de tener todas las dependencias instaladas

---

## ✨ Estado Actual

- ✅ Sistema de wallets LTC (BIP32/BIP44)
- ✅ Monitoreo de blockchain automático
- ✅ Base de datos SQLite integrada
- ✅ Comandos de Discord
- ✅ Botones para comprar
- ✅ Confirmaciones automáticas

---

**¡Tu sistema de autobuy está listo para usar!** 🎉
