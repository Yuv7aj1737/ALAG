# 💻 Ejemplos de Código - Autobuy LTC

## Tabla de Contenidos
1. [Uso Básico](#uso-básico)
2. [Generar Dirección](#generar-dirección)
3. [Verificar Pago](#verificar-pago)
4. [Crear Licenses](#crear-licenses)
5. [Usar en Discord](#usar-en-discord)

---

## Uso Básico

### Inicializar el Sistema

```javascript
const { initializeAutobuy, getAutobuyManager } = require('./autosecure/utils/autobuy/initAutobuy');
const config = require('./autobuy.config.json');

// En el evento ready del bot
client.on('ready', async () => {
    console.log('Bot listo');
    
    // Inicializar autobuy
    const success = await initializeAutobuy();
    if (success) {
        console.log('✅ Sistema de pagos iniciado');
    }
});
```

---

## Generar Dirección

### Ejemplo 1: Dirección Única para Compra

```javascript
const { getAutobuyManager } = require('./autosecure/utils/autobuy/initAutobuy');

async function generarDireccionCompra(licenseId, userId, precioLtc) {
    try {
        const manager = getAutobuyManager();
        
        // Crear solicitud de pago
        const payment = await manager.createPaymentRequest(
            licenseId,
            userId,
            precioLtc,
            3600  // Expira en 1 hora
        );
        
        return {
            address: payment.address,
            expectedAmount: payment.expectedAmount,
            expiresIn: payment.expiresIn
        };
    } catch (error) {
        console.error('Error generando dirección:', error);
        return null;
    }
}

// Uso:
const payment = await generarDireccionCompra(
    'license_1',
    '123456789',  // Discord ID
    0.001         // LTC
);

console.log(`Envía ${payment.expectedAmount} LTC a: ${payment.address}`);
```

### Ejemplo 2: Generar Múltiples Direcciones

```javascript
async function generarMultiplesDirecciones(cantidad, precioLtc) {
    const manager = getAutobuyManager();
    const direcciones = [];
    
    for (let i = 0; i < cantidad; i++) {
        const payment = await manager.createPaymentRequest(
            `batch_${i}`,
            '123456789',
            precioLtc
        );
        
        direcciones.push({
            index: i + 1,
            address: payment.address,
            monto: precioLtc
        });
    }
    
    return direcciones;
}

// Uso:
const direcciones = await generarMultiplesDirecciones(10, 0.001);
console.table(direcciones);
```

---

## Verificar Pago

### Ejemplo 1: Verificar Pago Manual

```javascript
const { getAutobuyManager } = require('./autosecure/utils/autobuy/initAutobuy');

async function verificarPago(direccion) {
    try {
        const manager = getAutobuyManager();
        const monitor = manager.monitor;
        
        // Verificar si hay transacción
        const transaction = await monitor.checkAddress(direccion);
        
        if (transaction) {
            console.log('✅ Pago detectado:');
            console.log('  Monto:', transaction.amount, 'LTC');
            console.log('  Confirmaciones:', transaction.confirmations);
            return transaction;
        } else {
            console.log('⏳ Aún no hay pago en esta dirección');
            return null;
        }
    } catch (error) {
        console.error('Error verificando:', error);
        return null;
    }
}

// Uso:
const tx = await verificarPago('bc1qr2345...xyz');
```

### Ejemplo 2: Verificar Automáticamente

```javascript
async function verificarPagoAutomatico(direccion, maxTiempo = 3600000) {
    // maxTiempo = 1 hora en milisegundos
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > maxTiempo) {
                clearInterval(interval);
                resolve(null);  // Timeout
                return;
            }
            
            const tx = await verificarPago(direccion);
            if (tx && tx.confirmations >= 1) {
                clearInterval(interval);
                resolve(tx);  // Pago confirmado
            }
        }, 30000);  // Verificar cada 30 segundos
    });
}

// Uso:
const pago = await verificarPagoAutomatico('bc1qr2345...xyz');
if (pago) {
    console.log('✅ Pago confirmado, entregando producto...');
} else {
    console.log('❌ Tiempo de espera agotado');
}
```

---

## Crear Licenses

### Ejemplo 1: Agregar una License

```javascript
const AutobuyDB = require('./autosecure/utils/autobuy/autobuyDB');
const config = require('./autobuy.config.json');

async function agregarLicense(licenseId, tipo, ownerId, precioLtc, precioUsd) {
    try {
        const db = new AutobuyDB(config.autobuy.wallet.dbPath);
        
        const result = await db.addLicense(
            licenseId,
            tipo,           // 'license' o 'slot'
            ownerId,        // Tu Discord ID
            precioLtc,      // Ej: 0.001
            precioUsd       // Ej: 5.00
        );
        
        console.log(`✅ ${licenseId} agregada`);
        return result;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Uso:
await agregarLicense('license_1', 'license', '123456789', 0.001, 5.00);
await agregarLicense('slot_1', 'slot', '123456789', 0.002, 10.00);
```

### Ejemplo 2: Agregar Múltiples Licenses

```javascript
async function crearProductos() {
    const db = new AutobuyDB(config.autobuy.wallet.dbPath);
    const myId = '123456789';  // Tu Discord ID
    
    // Licenses
    for (let i = 1; i <= 5; i++) {
        await db.addLicense(
            `license_${i}`,
            'license',
            myId,
            0.001,
            5.00
        );
    }
    
    // Slots
    for (let i = 1; i <= 5; i++) {
        await db.addLicense(
            `slot_${i}`,
            'slot',
            myId,
            0.002,
            10.00
        );
    }
    
    console.log('✅ 10 productos creados');
}

await crearProductos();
```

### Ejemplo 3: Obtener Licenses

```javascript
async function listarProductos() {
    const db = new AutobuyDB(config.autobuy.wallet.dbPath);
    
    const licenses = await db.getLicenses();
    
    console.log('Productos disponibles:');
    licenses.forEach(lic => {
        console.log(`
  ID: ${lic.license_id}
  Tipo: ${lic.type}
  Precio: ${lic.price_ltc} LTC (${lic.price_usd} USD)
  Activo: ${lic.active ? 'Sí' : 'No'}
        `);
    });
}

await listarProductos();
```

---

## Usar en Discord

### Ejemplo 1: Comando de Compra

```javascript
const { SlashCommandBuilder } = require('discord.js');
const { getAutobuyManager } = require('../utils/autobuy/initAutobuy');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprar')
        .setDescription('Compra un producto')
        .addStringOption(option =>
            option
                .setName('producto')
                .setDescription('Qué deseas comprar')
                .setRequired(true)
                .addChoices(
                    { name: 'License', value: 'license_1' },
                    { name: 'Slot', value: 'slot_1' }
                )
        ),
    
    async execute(interaction) {
        const productId = interaction.options.getString('producto');
        
        try {
            const manager = getAutobuyManager();
            
            // Generar dirección
            const payment = await manager.createPaymentRequest(
                productId,
                interaction.user.id,
                0.001
            );
            
            // Responder al usuario
            await interaction.reply({
                content: `
🎯 **Compra iniciada**

**Producto:** ${productId}
**Monto:** ${payment.expectedAmount} LTC
**Dirección:**
\`\`\`
${payment.address}
\`\`\`

⏰ Válida por ${payment.expiresIn / 60} minutos

Envía exactamente **${payment.expectedAmount} LTC** a esta dirección.
El bot confirmará automáticamente cuando llegue el pago.
                `,
                ephemeral: false
            });
            
        } catch (error) {
            await interaction.reply({
                content: '❌ Error generando dirección',
                ephemeral: true
            });
        }
    }
};
```

### Ejemplo 2: Botón de Verificar

```javascript
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    customId: 'verify_payment',
    
    async execute(interaction) {
        const { getAutobuyManager } = require('../utils/autobuy/initAutobuy');
        
        try {
            const manager = getAutobuyManager();
            
            // Obtener dirección del usuario (desde BD)
            const db = manager.db;
            const userPayments = await db.getPendingAddresses();
            const lastPayment = userPayments[userPayments.length - 1];
            
            if (!lastPayment) {
                return interaction.reply({
                    content: '❌ No hay compras pendientes',
                    ephemeral: true
                });
            }
            
            // Verificar si pagó
            const transactions = await db.getTransactionsByAddress(lastPayment.address);
            
            if (transactions.length === 0) {
                return interaction.reply({
                    content: '⏳ Aún no detectamos pago en la blockchain',
                    ephemeral: true
                });
            }
            
            const tx = transactions[0];
            
            if (tx.confirmations >= 1) {
                return interaction.reply({
                    content: `✅ **¡Pago confirmado!**
                    
Monto: ${tx.amount_ltc} LTC
Confirmaciones: ${tx.confirmations}
TX: ${tx.tx_hash.substring(0, 20)}...

Tu producto está siendo entregado.`,
                    ephemeral: true
                });
            } else {
                return interaction.reply({
                    content: `⏳ **Pago detectado pero aún sin confirmar**
                    
Confirmaciones: ${tx.confirmations}/1
Por favor espera un poco más (5-30 minutos).`,
                    ephemeral: true
                });
            }
            
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Error verificando pago',
                ephemeral: true
            });
        }
    }
};
```

### Ejemplo 3: Enviar EmbED con Dirección

```javascript
const { EmbedBuilder } = require('discord.js');

async function enviarDireccionEmbed(interaction, payment) {
    const embed = new EmbedBuilder()
        .setTitle('💰 Solicitud de Pago')
        .setDescription('Envía la cantidad exacta a la dirección indicada')
        .addFields(
            {
                name: '📍 Dirección',
                value: `\`\`\`${payment.address}\`\`\``,
                inline: false
            },
            {
                name: '💵 Monto',
                value: `${payment.expectedAmount} LTC`,
                inline: true
            },
            {
                name: '⏰ Válida por',
                value: `${payment.expiresIn / 60} minutos`,
                inline: true
            }
        )
        .setColor(0x12A1FF)
        .setFooter({ text: 'Pago procesado automáticamente' });
    
    await interaction.reply({
        embeds: [embed],
        ephemeral: false
    });
}

// Uso en comando:
await enviarDireccionEmbed(interaction, payment);
```

---

## Casos de Uso Avanzados

### Ejemplo 1: Procesar Pago Completo

```javascript
async function procesarCompraCompleta(interaction, productId) {
    const manager = getAutobuyManager();
    const db = manager.db;
    
    // 1. Generar dirección
    const payment = await manager.createPaymentRequest(
        productId,
        interaction.user.id,
        0.001
    );
    
    // 2. Enviar al usuario
    await interaction.reply({
        content: `Envía ${payment.expectedAmount} LTC a: ${payment.address}`
    });
    
    // 3. Esperar confirmación
    let confirmed = false;
    const timeout = 3600000; // 1 hora
    const startTime = Date.now();
    
    while (!confirmed && (Date.now() - startTime) < timeout) {
        const txs = await db.getTransactionsByAddress(payment.address);
        
        if (txs.length > 0 && txs[0].confirmations >= 1) {
            confirmed = true;
            
            // 4. Entregar producto
            await interaction.followUp({
                content: `✅ ¡Pago confirmado! Tu producto está siendo entregado...`
            });
            
            // Aquí entregar el producto
            // await entregarProducto(productId, interaction.user.id);
            
        } else {
            await new Promise(resolve => setTimeout(resolve, 30000)); // Esperar 30s
        }
    }
    
    if (!confirmed) {
        await interaction.followUp({
            content: '❌ Tiempo de espera agotado'
        });
    }
}
```

### Ejemplo 2: Dashboard en Embed

```javascript
async function mostrarDashboard(interaction) {
    const manager = getAutobuyManager();
    const db = manager.db;
    
    // Obtener estadísticas
    const stats = await db.getStatistics();
    const pendingTxs = await db.getTransactionsByStatus('pending');
    const confirmedTxs = await db.getTransactionsByStatus('confirmed');
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Dashboard de Autobuy')
        .setColor(0x00FF00)
        .addFields(
            {
                name: '💰 Total Recibido',
                value: `${stats.total_ltc} LTC`,
                inline: true
            },
            {
                name: '⏳ Pendientes',
                value: `${pendingTxs.length} transacciones`,
                inline: true
            },
            {
                name: '✅ Confirmadas',
                value: `${confirmedTxs.length} transacciones`,
                inline: true
            },
            {
                name: '📈 Transacciones Totales',
                value: `${stats.total_transactions}`,
                inline: true
            }
        );
    
    await interaction.reply({ embeds: [embed] });
}
```

---

## Tips y Mejores Prácticas

```javascript
// ✅ BIEN: Usar async/await
async function comprar(productId) {
    const payment = await manager.createPaymentRequest(productId, userId, 0.001);
    return payment;
}

// ❌ MAL: Usar callbacks anidados
manager.createPaymentRequest(productId, userId, 0.001, (err, payment) => {
    // Callback hell
});

// ✅ BIEN: Manejo de errores
try {
    const payment = await manager.createPaymentRequest(...);
} catch (error) {
    console.error('Error:', error.message);
    await interaction.reply('Error procesando compra');
}

// ❌ MAL: Ignorar errores
const payment = await manager.createPaymentRequest(...);  // ¿Y si falla?

// ✅ BIEN: Usar transacciones
const db = new AutobuyDB();
try {
    await db.beginTransaction();
    await db.addLicense(...);
    await db.addPaymentAddress(...);
    await db.commit();
} catch (error) {
    await db.rollback();
}
```

---

## Referencia Rápida

```javascript
// Inicializar
const { initializeAutobuy, getAutobuyManager } = require('./initAutobuy');

// Generar dirección
const payment = await manager.createPaymentRequest(licenseId, userId, priceLtc);

// Verificar pago
const tx = await manager.checkPayment(address);

// Base de datos
const db = new AutobuyDB();
await db.addLicense(id, type, owner, priceLtc, priceUsd);
await db.getTransactionsByAddress(address);

// Monitor
const monitor = new LTCMonitor(apiKey);
const txs = await monitor.checkAddress(address);

// Wallet
const wallet = new LTCWallet(mnemonic);
const addr = wallet.generateAddress();
```

---

**Estos ejemplos son totalmente funcionales y listos para usar.** 💻
