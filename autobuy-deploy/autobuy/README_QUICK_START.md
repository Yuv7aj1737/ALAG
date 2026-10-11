# 🚀 Autobuy Litecoin - Guía Rápida

## En 5 minutos

### 1. Instalar dependencias
```bash
cd c:\Users\IK\Desktop\autosecure
npm install bip32 bip39 sqlite3 axios
```

### 2. Ejecutar setup wizard
```bash
node autosecure/utils/autobuy/setup-wizard.js
```

Este script te pedirá:
- Opción de wallet (nueva o existente)
- API Key de Blockchair (gratis en https://blockchair.com/api)
- Tu Discord ID
- Precios en LTC

**¡Eso es todo!** El sistema se configura automáticamente.

### 3. Iniciar bot
```bash
npm start
```

### 4. Usar en Discord
```
/autobuy buy license_1
```

El bot genera una dirección LTC única para cada compra.

---

## 💰 Cómo recibir dinero

1. **Usuario compra** → `/autobuy buy license_1`
2. **Bot genera dirección** → `bc1qr2345...xyz`
3. **Usuario envía LTC** → Dirección generada
4. **Blockchain confirma** → Automático (1-5 minutos)
5. **Dinero llega a ti** → Tu wallet maestra
6. **Producto entregado** → Automático

---

## 🪙 Direcciones

Cada compra obtiene una dirección **única**, pero **todos los fondos van a tu wallet maestra**.

Ejemplo:
```
Compra 1 → bc1qr111...111  →┐
Compra 2 → bc1qr222...222  →├─→ Tu Wallet Maestra
Compra 3 → bc1qr333...333  →┘
```

---

## 🔑 Seguridad

**IMPORTANTE**: Tu mnemonic (24 palabras) se guarda en `autobuy.config.json`.

**Opciones:**
- **Opción 1**: Usar variable de entorno
  ```bash
  set AUTOBUY_MNEMONIC=tus_24_palabras
  ```

- **Opción 2**: Guardar en archivo separado (no en git)
  ```
  .env (añade a .gitignore)
  ```

---

## 📝 Comandos de prueba

### Generar dirección de prueba
```javascript
const { getAutobuyManager } = require('./autosecure/utils/autobuy/initAutobuy');
const manager = getAutobuyManager();

const payment = await manager.createPaymentRequest(
    'license_1',
    'TU_DISCORD_ID',
    0.001
);

console.log('Dirección:', payment.address);
```

### Ver estado de compras
```
/autobuy status
```

### Verificar pago
```
/autobuy check
```

---

## 💻 Archivos importantes

```
autosecure/utils/autobuy/
├── setup-wizard.js          ← Ejecuta esto primero
├── test-system.js           ← Verifica todo funciona
├── initAutobuy.js           ← Inicializa el bot
├── autobuyManager.js        ← Gestor principal
├── ltcWallet.js             ← Generador de direcciones
├── ltcMonitor.js            ← Monitor de blockchain
└── autobuyDB.js             ← Base de datos

autobuy.config.json          ← Configuración (después del setup)
```

---

## 🐛 Resolver problemas

### "Mnemonic no válida"
- Verifica que hayas copiado las 24 palabras exactamente

### "API Key rechazada"
- Regístrate en https://blockchair.com/api
- Confirma tu email
- Copia el API Key correcto (sin espacios)

### "Base de datos error"
- Verifica que SQLite esté instalado
- Elimina `db/autobuy.db` y ejecuta setup de nuevo

### "Dirección no válida"
- Las direcciones Litecoin empiezan con `L`, `M` o `ltc1`
- Si ves algo diferente, hay error en la configuración

---

## 📊 Monitoreo

El sistema monitorea automáticamente cada 60 segundos (configurable).

Ver logs:
```bash
type logs\autobuy.log
```

---

## 💡 Ejemplos de precios

| Producto | LTC | USD |
|----------|-----|-----|
| License | 0.001 | ~$0.05 |
| Slot | 0.002 | ~$0.10 |

Ajusta según tu mercado.

---

## ✨ Características

- ✅ Wallets HD (BIP32/BIP44)
- ✅ Direcciones únicas por compra
- ✅ Monitoreo automático de blockchain
- ✅ Confirmaciones en tiempo real
- ✅ Integración Discord completa
- ✅ Base de datos SQLite
- ✅ Entrega automática de productos

---

## 📞 ¿Dudas?

1. Lee: `AUTOBUY_LTC_SETUP_COMPLETO.md` (guía detallada)
2. Ejecuta: `node test-system.js` (diagnóstico)
3. Revisa: logs/ (información de eventos)

---

**¡Tu sistema de compras automáticas con Litecoin está listo!** 🎉
