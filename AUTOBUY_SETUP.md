# 🎯 Sistema Autobuy - Resumen Completo

He creado un **sistema completo de compra automática con Litecoin**. Aquí está lo que incluye:

## 📦 Archivos Creados

### Core del Sistema

1. **`ltcWallet.js`** - Generador de direcciones LTC
   - Utiliza BIP32/BIP44 (HD Wallet)
   - Genera direcciones únicas derivadas de una semilla
   - Todas las direcciones envían fondos a la misma wallet
   - Método: `generateAddress()` devuelve direcciones dinámicas

2. **`ltcMonitor.js`** - Monitor de blockchain
   - Usa API de Blockchair
   - Detecta transacciones entrantes
   - Verifica confirmaciones en tiempo real
   - Obtiene precio actual de LTC

3. **`autobuyDB.js`** - Base de datos SQLite
   - Almacena licenses (para vender)
   - Almacena direcciones de pago
   - Almacena transacciones confirmadas
   - Almacena compras realizadas
   - Logs de eventos webhook

4. **`autobuyManager.js`** - Gestor central
   - Orquesta todo el sistema
   - Crea solicitudes de pago
   - Monitorea pagos automáticamente
   - Completa compras cuando se confirma pago
   - Inicia/detiene monitoreo

### Integración Discord

5. **`autobuy.js`** (command) - Comando slash del bot
   - `/autobuy create` - Crear license para vender
   - `/autobuy buy` - Comprar license
   - `/autobuy status` - Ver compras
   - `/autobuy check` - Verificar pago

6. **`autobuy_check.js`** (button) - Botón de verificación
   - Click para verificar si el pago llegó
   - Muestra confirmaciones en tiempo real

### Inicialización

7. **`initAutobuy.js`** - Script de inicialización
   - Llama en el evento `ready` del bot
   - Inicia automáticamente el monitoreo
   - Guarda/restaura la mnemonic

### Webhooks (Opcional)

8. **`autobuyWebhook.js`** - Webhook handler
   - Recibe notificaciones de Blockchair
   - Procesa pagos automáticamente
   - Health check endpoint

### Configuración y Documentación

9. **`autobuy.config.json`** - Archivo de configuración
   - Parámetros ajustables
   - Configuración de blockchain
   - Opciones de Discord

10. **`README.md`** - Documentación completa
    - Instrucciones de instalación
    - Ejemplos de uso
    - Información técnica
    - Troubleshooting

11. **`test-autobuy.js`** - Script de prueba
    - Verifica que todo funcione
    - Genera billetera de prueba
    - Valida cada componente

## 🔄 Flujo de Compra

```
Usuario ejecuta /autobuy buy
    ↓
Sistema genera dirección LTC única
    ↓
Usuario envía LTC a la dirección
    ↓
Bot monitorea la blockchain
    ↓
Transacción detectada y guardada
    ↓
1 confirmación = Compra confirmada
    ↓
License entregado automáticamente (con setup)
```

## 💡 Características Clave

✅ **Direcciones dinámicas**: Cada compra obtiene una dirección diferente
✅ **Fondo único**: Todos los fondos van a la misma wallet
✅ **Monitoreo automático**: Verifica pagos cada 60 segundos
✅ **Base de datos**: Registro completo de transacciones
✅ **Discord integrado**: Todo dentro del bot
✅ **HD Wallet (BIP44)**: Estándar de la industria
✅ **Webhook support**: Notificaciones en tiempo real

## 🚀 Cómo Usar

### 1. Instalar dependencias
```bash
cd /root/autosecure
npm install bip32 bip39 ripemd160 bs58 axios sqlite3
```

### 2. Inicializar en el bot
En tu evento `ready`:
```javascript
const { initializeAutobuy } = require('./events/ready/initAutobuy');

client.on('ready', async () => {
    await initializeAutobuy(client);
});
```

### 3. Usar en Discord
```
/autobuy create license_id:MY_LICENSE price_ltc:0.5
/autobuy buy license_id:MY_LICENSE
/autobuy status
/autobuy check address:ltc...
```

## 💾 Base de Datos

Se crea automáticamente en: `/root/autosecure/db/autobuy.db`

**Tablas**:
- `licenses` - Licenses disponibles para venta
- `payment_addresses` - Direcciones generadas
- `transactions` - Pagos confirmados
- `purchases` - Compras completadas
- `webhook_logs` - Eventos registrados

## 🔑 Wallet

La mnemonic se genera automáticamente al inicializar:
- **GUARDA ESTO EN UN LUGAR SEGURO**
- Es la única forma de recuperar los fondos
- Se muestra en logs de inicialización

Importa en:
- Electrum
- Ledger
- Trezor
- Cualquier wallet que soporte BIP39/BIP44

## 📊 Ejemplo de Transacción

```
Usuario 1 compra LICENSE_A
  → Dirección: ltc1abc...123
  → Cantidad: 0.5 LTC
  → Expira en: 1 hora

Usuario 2 compra LICENSE_A
  → Dirección: ltc1def...456
  → Cantidad: 0.5 LTC
  → Expira en: 1 hora

Todos los fondos van a: ltc1xyz...WALLET
```

## ⚙️ Configuración Avanzada

### Cambiar intervalo de monitoreo
```javascript
client.autobuy.stopMonitoring();
client.autobuy.startMonitoring(30000); // 30 segundos
```

### Usar API key de Blockchair
```javascript
const autobuy = new AutobuyManager(mnemonic, 'YOUR_API_KEY');
```

### Crear pago manual
```javascript
const payment = await client.autobuy.createPaymentRequest(
    'LICENSE_ID',
    'owner_id',
    0.5,    // LTC
    3600    // segundos
);
```

## 🧪 Probar el Sistema

```bash
node test-autobuy.js
```

Esto valida:
- Creación de wallet
- Generación de direcciones
- Conexión a blockchain
- Base de datos
- Monitoreo

## 📝 Notas Importantes

1. **Cada dirección es única** pero todas van a la misma wallet
2. **El monitoreo es automático** - no necesitas hacer nada
3. **Requiere 1 confirmación** para validar el pago (≈ 2.5 minutos en Litecoin)
4. **Los fondos están seguros** - solo tú tienes la mnemonic
5. **Sin comisiones adicionales** - blockchain fee estándar

## 🎯 Casos de Uso

- Vender licenses
- Vender slots
- Vender servicios premium
- Recibir pagos de usuarios
- Sistema de "pay-to-unlock"

---

¿Quieres que ajuste algo o agregue más funcionalidades?
