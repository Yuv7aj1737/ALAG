# Autobuy System - Litecoin Payment Integration

Sistema de compra automática con pagos en Litecoin. Permite vender licenses o slots con detección automática de transacciones.

## 📋 Características

- ✅ Generación de direcciones LTC dinámicas (HD Wallet BIP44)
- ✅ Monitoreo automático de pagos en blockchain
- ✅ Detección de confirmaciones en tiempo real
- ✅ Base de datos para almacenar transacciones
- ✅ Integración con Discord (slash commands)
- ✅ Sistema de webhooks para pagos automáticos

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install bip32 bip39 ripemd160 bs58 axios sqlite3
```

### 2. Configurar en tu bot

En el evento `ready` de tu bot:

```javascript
const { initializeAutobuy } = require('./events/ready/initAutobuy');

client.on('ready', async () => {
    // Opcional: pasar un mnemonic existente
    // Si no pasas nada, generará uno nuevo
    await initializeAutobuy(client);
    
    console.log(`✅ Bot ready as ${client.user.tag}`);
});
```

### 3. Guardar la wallet mnemonic

**IMPORTANTE**: Guarda la mnemonic en un lugar seguro. Esta es la única forma de recuperar tu wallet.

```javascript
const mnemonic = client.autobuy.getWalletMnemonic();
// Guardar en archivo, variable de entorno, etc.
```

## 💻 Uso

### Crear una licencia para vender

```
/autobuy create
license_id: MY_LICENSE_123
price_ltc: 0.5
```

### Comprar una licencia

```
/autobuy buy
license_id: MY_LICENSE_123
```

Esto genera:
- Una dirección LTC única
- Un código QR para pagar
- Un botón para verificar el pago

### Verificar pagos

```
/autobuy check
address: ltc1address...
```

O click en el botón "Check Payment" en el embed de pago.

## 📂 Estructura de archivos

```
autosecure/utils/autobuy/
├── ltcWallet.js          # Generación de direcciones (BIP32/BIP44)
├── ltcMonitor.js         # Monitoreo de blockchain (Blockchair API)
├── autobuyDB.js          # Base de datos (SQLite)
├── autobuyManager.js     # Gestor central del sistema
└── README.md

mainbot/
├── commands/admin/
│   └── autobuy.js        # Comando slash de autobuy
├── Buttons/
│   └── autobuy_check.js  # Botón de verificación
└── events/ready/
    └── initAutobuy.js    # Inicialización del sistema
```

## 🔑 Información técnica

### BIP44 Derivation Path

Utiliza el estándar BIP44 para Litecoin:

```
m/44'/2'/0'/0/0  <- Primera dirección
m/44'/2'/0'/0/1  <- Segunda dirección
m/44'/2'/0'/0/2  <- Tercera dirección
```

- `2` = Litecoin
- Cada índice genera una dirección única
- Todas llegan a la misma wallet

### Base de datos

Las transacciones se almacenan en `/root/autosecure/db/autobuy.db` con:

- Licenses (para vender)
- Payment addresses (dirección + licencia)
- Transactions (tx hash, confirmaciones)
- Purchases (registro de compras)

### Monitoreo

El sistema verifica pagos cada 60 segundos por defecto:

```javascript
client.autobuy.startMonitoring(60000); // ms
```

Para cambiar el intervalo:

```javascript
client.autobuy.stopMonitoring();
client.autobuy.startMonitoring(30000); // 30 segundos
```

## ⚙️ Configuración avanzada

### API de Blockchair

Para obtener límites de API más altos, registrate en:
https://blockchair.com/api

```javascript
const autobuy = new AutobuyManager(mnemonic, 'YOUR_API_KEY');
```

### Cambiar intervalo de monitoreo

```javascript
// Reducir a 30 segundos
client.autobuy.stopMonitoring();
client.autobuy.startMonitoring(30000);
```

### Crear pago manual

```javascript
const payment = await client.autobuy.createPaymentRequest(
    'MY_LICENSE', 
    'owner_id', 
    0.5,          // precio en LTC
    3600          // expira en 3600 segundos
);

console.log(payment.address); // Dirección para enviar
```

## 🛡️ Seguridad

- Las mnemonics nunca se almacenan en la DB
- Cada dirección es única (HD wallet)
- Los fondos siempre van a la misma wallet
- Usa HTTPS para webhooks
- Valida montos mínimos

## 🐛 Troubleshooting

### "Autobuy system not initialized"

Asegúrate que `initializeAutobuy()` se llame en el evento `ready`.

### No se detectan pagos

1. Verifica que la dirección sea correcta en Blockchair
2. Espera a que se confirme la transacción (1+ confirmación)
3. Revisa que `startMonitoring()` esté activo

### Wallet sin fondos

La wallet se crea automáticamente. Puedes:
1. Ver la mnemonic con `getWalletMnemonic()`
2. Importarla en Electrum o Ledger
3. Ver tus fondos

## 📊 Ejemplo completo

```javascript
const { Client } = require('discord.js');
const { initializeAutobuy, shutdownAutobuy } = require('./events/ready/initAutobuy');

const client = new Client({ intents: [] });

client.on('ready', async () => {
    await initializeAutobuy(client);
    console.log(`✅ Bot listo`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand() && interaction.commandName === 'autobuy') {
        // Tu comando aquí
    }
});

client.on('SIGTERM', () => {
    shutdownAutobuy(client);
    client.destroy();
});

client.login(TOKEN);
```

## 📝 Licencia

MIT
