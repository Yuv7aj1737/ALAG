# 💰 Configuración de Wallet LTC para AutoBuy

## 🎯 ¿Cómo Funciona?

Tu sistema AutoBuy genera **direcciones LTC dinámicas**. Cada compra obtiene una dirección diferente, pero **TODAS llegan a la MISMA wallet**.

```
Compra 1 → ltc1abc... ─┐
Compra 2 → ltc1def... ─┤
Compra 3 → ltc1ghi... ─┴─→ Tu Wallet Principal (todos los fondos aquí)
Compra 4 → ltc1jkl... ─┐
                       │
                    (via BIP32/BIP44)
```

## 📝 Paso 1: Obtener o Generar tu Mnemonic

### Opción A: Generar una Nueva Wallet (Recomendado)

Ejecuta en Node.js:
```javascript
const bip39 = require('bip39');
const mnemonic = bip39.generateMnemonic(256); // 24 palabras
console.log(mnemonic);
```

Resultado ejemplo:
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art
```

**⚠️ GUARDA ESTO EN UN LUGAR SEGURO - ESTO TE DA ACCESO A TODOS TUS FONDOS**

### Opción B: Usar una Wallet Existente

Si ya tienes una wallet de Litecoin:
1. Abre Electrum (u otro wallet)
2. Ve a Wallet → Seed
3. Copia tu mnemonic (12 o 24 palabras)

## 🔧 Paso 2: Configurar en el Bot

### 📄 Archivo: `config_autobuy.json`

```json
{
  "autobuy": {
    "wallet": {
      "mnemonic": "tu-mnemonic-de-24-palabras-aqui"
    },
    ...
  }
}
```

**Reemplaza:**
```
COLOCA_TU_MNEMONIC_AQUI_12_o_24_palabras
```

**Con tu mnemonic real:**
```
"mnemonic": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
```

## 💾 Paso 3: Importar a tu Wallet de Litecoin

Para poder **gastar** los fondos recibidos, necesitas importar la mnemonic a tu wallet:

### Con Electrum (Recomendado)

1. Descarga Electrum: https://electrum-ltc.org/
2. Abre la aplicación
3. **File → New/Restore**
4. Selecciona "I have a seed"
5. Pega tu mnemonic (24 palabras)
6. Sigue los pasos
7. ¡Listo! Ya ves tus direcciones y fondos

### Con Ledger/Trezor

1. Conecta tu dispositivo
2. En la configuración, elige "restaurar desde seed"
3. Pega las 24 palabras
4. Verifica las direcciones coincidan

### Con MetaMask/Keplr

Algunos wallets soportan BIP39 para Litecoin.

## ✅ Verificación

Después de configurar:

1. **Dirección 1 (auto-generada):** `ltc1xyz...` 
2. Abre Blockchair: https://blockchair.com/litecoin/address/ltc1xyz...
3. Si es derivada de tu mnemonic, verás que pertenece a tu wallet
4. Copia esta dirección y prueba enviando 0.001 LTC
5. Deberías verla en tu wallet de Electrum

## 🔑 Estructura de Direcciones (BIP44)

Tu mnemonic genera direcciones así:

```
m/44'/2'/0'/0/0  ← 1ª dirección
m/44'/2'/0'/0/1  ← 2ª dirección
m/44'/2'/0'/0/2  ← 3ª dirección
...
m/44'/2'/0'/0/N  ← N-ésima dirección
```

Todas salen de la misma **seed/mnemonic**, por lo que:
- ✅ La misma wallet controla todas las direcciones
- ✅ Puedes importar en cualquier wallet
- ✅ Los fondos están seguros

## 🚨 Seguridad

**NUNCA:**
- ❌ Publiques tu mnemonic en internet
- ❌ La guardes en texto plano en un servidor
- ❌ La compartas con nadie

**SÍ:**
- ✅ Guárdala en un lugar seguro offline
- ✅ Usa hardware wallet si tienes muchos fondos
- ✅ Haz backup en papel en una caja fuerte

## 💡 Proceso Completo

```
1. Generar mnemonic → bip39.generateMnemonic()
   ↓
2. Guardar en config_autobuy.json
   ↓
3. Bot genera direcciones dinámicas derivadas
   ↓
4. Usuario 1 envía 0.05664976 LTC a ltc1abc...
   ↓
5. Usuario 2 envía 0.09442037 LTC a ltc1def...
   ↓
6. Importas mnemonic en Electrum
   ↓
7. Ves ambas direcciones en tu Electrum
   ↓
8. Ves los fondos combinados (0.15... LTC)
   ↓
9. Puedes enviar los fondos a donde quieras
```

## 📊 Ejemplo Real

**Tu Mnemonic:**
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art
```

**En config_autobuy.json:**
```json
{
  "autobuy": {
    "wallet": {
      "mnemonic": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
    }
  }
}
```

**El bot genera:**
```
Dirección 1: ltc1qya6mt0wdwrnfzw37yd3...
Dirección 2: ltc1qyar2ej7xc4wgf9dqz...
Dirección 3: ltc1qyarhz3nln8jds9d...
```

**Tu Electrum muestra:**
```
Dirección 1: ltc1qya6mt0wdwrnfzw37yd3... (0.05664976 LTC)
Dirección 2: ltc1qyar2ej7xc4wgf9dqz... (0.09442037 LTC)
Dirección 3: ltc1qyarhz3nln8jds9d... (0 LTC)
...
Total: 0.15107013 LTC
```

## 🎯 Para Empezar Ahora

1. **Ejecuta en Node.js:**
   ```javascript
   const bip39 = require('bip39');
   console.log(bip39.generateMnemonic(256));
   ```

2. **Copia el resultado** (24 palabras)

3. **Abre `config_autobuy.json`** y reemplaza:
   ```json
   "mnemonic": "TUS_24_PALABRAS_AQUI"
   ```

4. **Guarda el archivo**

5. **Reinicia tu bot**

6. **Descarga Electrum** e importa la mnemonic

7. **¡Listo!** Ya recibirás todos los pagos

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si uso una mnemonic existente?**
R: El bot generará direcciones derivadas de ella. Los fondos irán a tu wallet actual.

**P: ¿Puedo cambiar la mnemonic?**
R: No se recomienda una vez que has recibido pagos. Usa una nueva mnemonic.

**P: ¿Dónde veo mis fondos?**
R: En Electrum después de importar la mnemonic, o en Blockchair viendo cada dirección.

**P: ¿Qué pasa si pierdo la mnemonic?**
R: Pierdes acceso a todos los fondos. No hay forma de recuperarla.

**P: ¿Es seguro poner la mnemonic en el bot?**
R: Solo si tu servidor está asegurado. Considera usar variables de entorno.

---

**¡Ya estás listo para recibir pagos en Litecoin!**
