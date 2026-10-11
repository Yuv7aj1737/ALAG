# 🏗️ Arquitectura del Sistema Autobuy LTC

## Diagrama General

```
┌─────────────────────────────────────────────────────────┐
│              USUARIO DE DISCORD                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼ Comando: /autobuy buy
        ┌──────────────────────────────────┐
        │   BOT DISCORD (autosecure)       │
        │  autosecure/Commands/autobuy.js  │
        └──────────────────┬───────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
    ┌─────────────┐ ┌──────────────┐ ┌─────────────────┐
    │   Botones   │ │   Modales    │ │  Verificación   │
    │   (UI)      │ │  (Cantidad)  │ │  (Confirmación) │
    └──────┬──────┘ └──────┬───────┘ └────────┬────────┘
           │                │                  │
           └────────────────┼──────────────────┘
                            │
                            ▼
        ┌──────────────────────────────────┐
        │   AutobuyManager (Orquestador)   │
        │  autosecure/utils/autobuy/       │
        │  autobuyManager.js               │
        └──────────────────┬───────────────┘
                           │
         ┌─────────────────┼──────────────────────┐
         │                 │                      │
         ▼                 ▼                      ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │  LTCWallet   │  │ LTCMonitor   │  │   AutobuyDB      │
    │              │  │              │  │                  │
    │ • Generar    │  │ • Monitorear │  │ • Almacenar      │
    │   direcciones│  │   blockchain │  │   direcciones    │
    │ • BIP32/44  │  │ • Verificar  │  │ • Guardar tx     │
    │ • Derivadas │  │   pagos      │  │ • Rastrear       │
    └──────────────┘  │ • API block. │  │   dinero         │
                      └──────┬───────┘  └──────────────────┘
                             │
                    ┌────────┴──────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────────┐  ┌──────────────────┐
            │ BLOCKCHAIR API   │  │   SQLITE DB      │
            │ (Blockchain)     │  │ (Persistencia)   │
            └──────────────────┘  └──────────────────┘
```

---

## Flujo Detallado de una Compra

```
1. USUARIO INICIA COMPRA
   └─ Comando: /autobuy buy license_1
   └─ Bot recibe interacción

2. GENERAR DIRECCIÓN ÚNICA
   ├─ AutobuyManager llama a LTCWallet
   ├─ LTCWallet genera dirección (BIP44: m/44'/2'/0'/0/N)
   ├─ Dirección guardada en AutobuyDB
   └─ Sistema responde con: "Envía 0.001 LTC a: bc1qr..."

3. USUARIO ENVÍA LTC
   └─ Usuario envía dinero a dirección generada
   └─ Transacción en mempool (no confirmada)

4. MONITOREO ACTIVO
   ├─ LTCMonitor escanea blockchain cada 60s
   ├─ Consulta Blockchair API por transacción
   ├─ Si detecta → Guarda en AutobuyDB
   └─ Espera confirmaciones (por defecto 1)

5. CONFIRMACIÓN
   ├─ Blockchain confirma transacción (~10 min)
   ├─ LTCMonitor verifica confirmaciones
   ├─ AutobuyDB marca como CONFIRMADA
   └─ Dinero seguro en blockchain

6. ENTREGA AUTOMÁTICA
   ├─ AutobuyManager verifica confirmación
   ├─ Si es correcta → Envía producto
   ├─ Discord notifica al usuario
   └─ Actualiza registro en DB

7. DINERO EN TU WALLET
   └─ Blockchain envía fondos a tu wallet maestra
   └─ Puedes ver en Exodus, Ledger, etc.
```

---

## Estructura de Carpetas

```
autosecure/utils/autobuy/
├── ltcWallet.js              # Generador de direcciones (BIP32/44)
├── ltcMonitor.js             # Monitor de blockchain (Blockchair)
├── autobuyDB.js              # Base de datos SQLite
├── autobuyManager.js         # Orquestador principal
├── initAutobuy.js            # Inicialización del bot
├── setup-wizard.js           # Configuración interactiva
├── test-system.js            # Pruebas de sistema
├── dashboard.js              # Ver estado de pagos
├── backup.js                 # Respaldar datos
├── README_QUICK_START.md     # Guía rápida
└── temp/                     # Archivos temporales
    └── skins/

Raíz del proyecto:
├── autobuy.config.json       # Configuración principal
├── AUTOBUY_LTC_SETUP_COMPLETO.md  # Guía completa
├── AUTOBUY_SETUP.md          # Documentación anterior
└── db/
    └── autobuy.db            # Base de datos SQLite
```

---

## Base de Datos (SQLite)

### Tabla: licenses
```sql
CREATE TABLE licenses (
    id INTEGER PRIMARY KEY,
    license_id TEXT UNIQUE,      -- Ej: license_1, slot_1
    type TEXT,                   -- 'license' o 'slot'
    owner_id TEXT,               -- Tu Discord ID
    price_ltc REAL,              -- Ej: 0.001
    price_usd REAL,              -- Ej: 5.00
    active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### Tabla: payment_addresses
```sql
CREATE TABLE payment_addresses (
    id INTEGER PRIMARY KEY,
    address TEXT UNIQUE,         -- bc1qr... (dirección LTC)
    license_id TEXT,             -- Qué se compra
    owner_id TEXT,               -- Quién vende
    derivation_path TEXT,        -- m/44'/2'/0'/0/N
    address_index INTEGER,       -- Index en HD wallet
    expected_amount_ltc REAL,    -- Cuánto esperar
    status TEXT,                 -- pending, paid, confirmed
    created_at TIMESTAMP,
    expires_at TIMESTAMP
)
```

### Tabla: transactions
```sql
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    tx_hash TEXT UNIQUE,         -- Hash de blockchain
    payment_address_id INTEGER,  -- De qué compra
    from_address TEXT,           -- Quién envió
    to_address TEXT,             -- Dirección que generamos
    amount_ltc REAL,             -- Cuánto llegó
    confirmations INTEGER,       -- Confirmaciones en blockchain
    status TEXT,                 -- confirmed, failed
    timestamp TIMESTAMP
)
```

---

## Archivos de Configuración

### autobuy.config.json
```json
{
  "autobuy": {
    "enabled": true,
    "monitoringInterval": 60000,              // Cada 60s
    "blockchain": {
      "network": "litecoin",
      "api": {
        "provider": "blockchair",
        "apiKey": "YOUR_KEY_HERE"
      }
    },
    "wallet": {
      "mnemonic": "24 palabras aquí",       // ⚠️ SECRETO
      "dbPath": "ruta/a/autobuy.db",
      "currency": "LTC"
    },
    "payments": {
      "minAmount": 0.0001,
      "requiredConfirmations": 1,
      "addressExpiry": 3600
    },
    "discord": {
      "notifyChannel": "CHANNEL_ID",
      "autoDeliver": true
    }
  }
}
```

---

## Flujo de Datos: Las Direcciones

```
MNEMONIC (tu llave maestra - 24 palabras)
         │
         ├─► BIP39 → Seed (256 bits)
         │
         ├─► BIP32 → Root Key
         │
         ├─► BIP44 → m/44'/2'/0'/0/0 → Dirección 1: bc1q111...
         │
         ├─► BIP44 → m/44'/2'/0'/0/1 → Dirección 2: bc1q222...
         │
         └─► BIP44 → m/44'/2'/0'/0/2 → Dirección 3: bc1q333...

CADA DIRECCIÓN:
  └─ Es única
  └─ Puede derivarse de la mnemonic
  └─ Los fondos van a la wallet maestra automáticamente
  └─ Expira después del tiempo configurado
```

---

## Comunicación con Blockchain

### Blockchair API (FREE)

**Endpoint usado:**
```
GET https://api.blockchair.com/litecoin/transactions?address=bc1q...
```

**Qué hace:**
1. Consulta si hay pagos a la dirección
2. Devuelve detalles de transacción
3. Confirma número de confirmaciones
4. Verifica monto

**Ventajas:**
- Gratis (free tier generoso)
- Sin cuenta de nodo
- API REST simple
- Datos en tiempo real
- Webhoooks opcionales (upgrade)

---

## Ciclo de Vida de una Transacción

```
ESTADO 1: pending
  └─ Usuario enviando transacción
  └─ En mempool de blockchain
  └─ Aún no confirmada

ESTADO 2: unconfirmed (0 confirmaciones)
  └─ Transacción en blockchain
  └─ Pero sin confirmación
  └─ ~10 minutos en Litecoin

ESTADO 3: confirmed (1+ confirmaciones)
  └─ Blockchain confirmó
  └─ Sistema verifica
  └─ AutobuyDB marca CONFIRMED
  └─ Producto entregado

ESTADO 4: complete
  └─ Usuario recibió producto
  └─ Transacción cerrada
  └─ Dinero disponible para gastar
```

---

## Scripts Principales

### setup-wizard.js
```bash
node setup-wizard.js
```
- Crea mnemonic o usa existente
- Configura API Key
- Agrega licenses iniciales
- Crea config JSON automáticamente

### test-system.js
```bash
node test-system.js
```
- Verifica todas las dependencias
- Prueba conexiones
- Diagnostica problemas

### dashboard.js
```bash
node dashboard.js
```
- Muestra estado de pagos
- Dinero pendiente vs confirmado
- Transacciones en tiempo real

### backup.js
```bash
node backup.js
```
- Respalda mnemonic (CRÍTICO)
- Exporta base de datos
- Genera reportes

---

## Integración Discord

### Comando: `/autobuy`
- Archivos: `autosecure/Commands/admin/autobuy.js`
- Subcomandos: `buy`, `status`, `check`

### Botones: Comprar
- Archivos: `mainbot/Buttons/autobuy_*.js`
- Interacción: Usuario clicks → generador de dirección

### Eventos: Pagos
- Monitores automáticos
- Notificaciones en canal
- Entrega automática

---

## Seguridad

### 🔐 Lo que está protegido

```
✅ Mnemonic: Cifrada en config
✅ API Key: No expuesta en código
✅ Transacciones: Verificadas en blockchain
✅ Base de datos: SQLite local
✅ Dirección única por pago: Imposible duplicar
```

### ⚠️ Responsabilidad del usuario

```
❌ No mostrar mnemonic a nadie
❌ No pushear config a GitHub
❌ Hacer backups regularmente
❌ Usar contraseña fuerte en wallet
```

---

## Próximas Mejoras

- [ ] Soporte múltiples criptomonedas (BTC, ETH)
- [ ] Dashboard web
- [ ] Webhooks automáticos de Blockchair
- [ ] Conversión automática a dinero
- [ ] Pagos parciales
- [ ] Refunds automáticos
- [ ] Analytics y reportes

---

## Troubleshooting técnico

| Problema | Causa | Solución |
|----------|-------|----------|
| "Invalid mnemonic" | Palabras mal copiadas | Vuelve a copiar las 24 palabras |
| "API Key error" | Clave inválida/vencida | Regenera en blockchair.com |
| "Dirección no válida" | Configuración corrupta | Ejecuta setup-wizard nuevamente |
| "Blockchain no responde" | Sin internet/API caída | Verifica conexión |
| "Pago no detectado" | Blockchain lento | Espera 10+ minutos |

---

**Sistema lista para producción** ✨
