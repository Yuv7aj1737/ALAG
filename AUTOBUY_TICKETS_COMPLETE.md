# 🎯 Sistema AutoBuy Completo - Con Tickets y Key Generation

Sistema completo de compra de Licenses y Slots con Litecoin, tickets privados, y generación automática de keys.

## 📋 Archivos Creados/Modificados

### Comandos
1. **`/autobuy`** - Comando principal con embed y botones
2. **`/activar`** - Comando para activar keys

### Botones
1. **`autobuy_license`** - Botón para comprar License (abre modal)
2. **`autobuy_slot`** - Botón para comprar Slot (crea ticket directamente)
3. **`ticket_copy`** - Botón para copiar dirección LTC

### Modales
1. **`autobuy_license_modal`** - Modal para seleccionar días (mínimo 30)

### Managers
1. **`ticketManager.js`** - Gestor de tickets privados
2. **`keyGenerator.js`** - Generador de keys únicas

## 🔄 Flujo Completo

### Para License:
```
/autobuy
    ↓
Click "License"
    ↓
Modal: ¿Cuántos días?
    ↓
Se crea canal privado
    ↓
Se muestra dirección LTC
    ↓
Usuario envía dinero
    ↓
Bot detecta transacción
    ↓
Bot verifica cantidad exacta
    ↓
Bot genera key
    ↓
Usuario recibe key
```

### Para Slot:
```
/autobuy
    ↓
Click "Slot"
    ↓
Se crea canal privado
    ↓
Se muestra dirección LTC
    ↓
Usuario envía dinero
    ↓
Bot detecta transacción
    ↓
Bot verifica cantidad exacta
    ↓
Bot genera key
    ↓
Usuario recibe key
```

## 💰 Precios

| Producto | USD | LTC | Notas |
|----------|-----|-----|-------|
| License (30 días) | $4.50 | 0.05664976 | Mínimo 30 días |
| License (60 días) | $9.00 | 0.11329952 | Proporcional |
| License (90 días) | $13.50 | 0.16994928 | Proporcional |
| Slot | $7.50 | 0.09442037 | Permanente |

## 🎯 Características

### 1. Embed Principal
- Título: "💰 Sistema AutoBuy"
- Descripción de License y Slot
- 2 botones: License (Blue) y Slot (Gray)

### 2. Modal de Días (License)
- Campo de texto: "¿Cuántos días? (Mínimo 30)"
- Validación: mínimo 30 días
- Cálculo automático de precio

### 3. Canal Privado
- Creado en categoría: `1439161073260433459`
- Permisos:
  - ✅ Owner puede ver
  - ✅ Bot puede ver y escribir
  - ✅ Usuario que compra puede ver y escribir
  - ❌ Otros no pueden ver
- Nombre: `ticket-{username}-{random}`

### 4. Embed de Pago
- Tipo de producto (License/Slot)
- Duración (si aplica)
- Precio USD
- Precio en LTC
- Características principales

### 5. Monitoreo de Pagos
El bot monitorea automáticamente:
- **Cada 5 minutos** por hasta 24 horas
- Detecta la transacción
- Verifica que sea la cantidad exacta
- Si es insuficiente → contactar soporte
- Si es correcta → espera 1 confirmación

### 6. Generación de Keys
- Formato: `{TYPE}-XXXX-XXXX-XXXX-{TIMESTAMP}`
- Tipos: `LIC` (License), `SLT` (Slot), `KEY` (Otros)
- Validación automática
- Expiracion según tipo

### 7. Activación de Keys
- Comando: `/activar <key>`
- Valida la key
- Marca como usada
- Da acceso al usuario
- Notifica por DM

## 📊 Estados del Ticket

```
pending (Esperando pago)
    ↓
payment_detected (Transacción detectada)
    ↓
payment_confirming (Esperando confirmación)
    ↓
payment_confirmed (Pago confirmado)
    ↓
key_generated (Key generada)
    ↓
key_delivered (Key entregada)
    ↓
completed (Completado)
```

## 🛡️ Validaciones

✅ Mínimo 30 días para License
✅ Cantidad exacta de LTC (±1% tolerancia)
✅ Timeout de 24 horas
✅ Una key por compra
✅ Una key use por usuario
✅ Keys expiran según tipo

## 📝 Proceso Paso a Paso (en el chat del ticket)

El bot envía mensajes como:

```
⏳ Transacción Detectada
Cantidad: 0.05664976 LTC
Confirmaciones: 0/1
Hash: a1b2c3d4...

(Espera 2-3 minutos)

✅ Pago Confirmado
Confirmaciones: 1
Estado: Procesando...

(Espera 1 minuto)

🎉 ¡Compra Completada!
🔑 Tu Key: LIC-ABCD-EFGH-IJKL-TIMESTAMP
📋 Usa esta key con /activar para activar tu license
⏰ Válido por 30 días
```

## 💻 Uso en el Bot

### Inicializar
En tu evento `ready`:
```javascript
const { initializeAutobuy } = require('./events/ready/initAutobuy');
const TicketManager = require('./events/ready/ticketManager');

client.on('ready', async () => {
    await initializeAutobuy(client);
    client.ticketManager = TicketManager;
});
```

### Usuarios Usan

**Opción 1: Comprar License**
1. `/autobuy`
2. Click "📜 License"
3. Modal: Ingresa días (mínimo 30)
4. Se crea ticket privado
5. Envía la cantidad indicada
6. Bot detecta y genera key

**Opción 2: Comprar Slot**
1. `/autobuy`
2. Click "🎫 Slot"
3. Se crea ticket privado
4. Envía 0.09442037 LTC
5. Bot detecta y genera key

**Opción 3: Activar Key**
1. `/activar LIC-ABCD-EFGH-IJKL-TIMESTAMP`
2. Bot valida y activa
3. Recibe acceso

## 🔐 Seguridad

- Cada dirección es única por compra
- Todos los fondos van a la misma wallet
- Keys expiran después del período
- Una key no se puede usar dos veces
- Canal privado solo para quien compra

## 🐛 Manejo de Errores

| Caso | Acción |
|------|--------|
| Cantidad insuficiente | Bot notifica y dice contactar soporte |
| Timeout 24h | Bot cierra ticket |
| Key incorrecta | `/activar` rechaza |
| Cantidad exacta | Bot confirma y genera key |

## 📊 Ejemplo de Ticket

```
Nombre: ticket-yorma-abc123
Permisos: 
  ✅ @yorma (owner)
  ✅ @Bot
  ✅ @tu-usuario
  ❌ @todos los otros

Mensajes:
📜 License Autosecure - 30 días
💵 Precio: $4.50
💎 0.05664976 LTC

💰 Instrucciones de Pago
Dirección: ltc1abc...
Cantidad: 0.05664976 LTC
[📋 Copiar] [🔍 Ver en Blockchair]

(Usuario envía dinero)

⏳ Transacción Detectada
0.05664976 LTC
Confirmaciones: 0/1

(2 minutos después)

✅ Pago Confirmado
🎉 ¡Compra Completada!
🔑 LIC-ABCD-EFGH-IJKL-17349...

Usuario luego usa:
/activar LIC-ABCD-EFGH-IJKL-17349...
```

## 🚀 Instalación

1. Copiar archivos a sus carpetas
2. Instalar dependencias: `npm install bip32 bip39 ripemd160 bs58 axios sqlite3`
3. Actualizar event handler para cargar modales y botones
4. Configurar categoría ID: `1439161073260433459`
5. Inicializar en evento ready

## 📝 Notas

- Los precios son fijos pero escalables
- Las keys se pueden generar bulk si es necesario
- El monitoreo es automático cada 5 minutos
- Los tickets expiran después de 24 horas
- Las keys expiran según el tipo

---

¿Quieres que agregue algo más?
