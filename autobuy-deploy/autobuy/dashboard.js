#!/usr/bin/env node

/**
 * Dashboard de Autobuy
 * Muestra estado de pagos, direcciones, y fondos
 */

const fs = require('fs');
const path = require('path');
const AutobuyManager = require('./autobuyManager');
const AutobuyDB = require('./autobuyDB');

async function showDashboard() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║   AUTOBUY LITECOIN - DASHBOARD         ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        // Cargar config
        const configPath = path.join(__dirname, '..', '..', '..', 'autobuy.config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Inicializar
        const db = new AutobuyDB(config.autobuy.wallet.dbPath);
        const manager = new AutobuyManager(
            config.autobuy.wallet.mnemonic,
            config.autobuy.blockchain.api.apiKey,
            config
        );

        // 1. Dirección maestra de wallet
        console.log('🪙 WALLET PRINCIPAL\n');
        console.log('Mnemonic: [Guardada de forma segura]\n');

        // 2. Transacciones pendientes
        console.log('⏳ PAGOS PENDIENTES\n');
        const pendingAddresses = await db.getPendingAddresses();
        
        if (pendingAddresses.length === 0) {
            console.log('  (No hay pagos pendientes)\n');
        } else {
            console.log(`  ${pendingAddresses.length} dirección(es) esperando pago:\n`);
            pendingAddresses.forEach(addr => {
                console.log(`  📍 ${addr.address}`);
                console.log(`     Licencia: ${addr.license_id}`);
                console.log(`     Monto: ${addr.expected_amount_ltc} LTC`);
                console.log(`     Creada: ${new Date(addr.created_at).toLocaleString()}\n`);
            });
        }

        // 3. Pagos confirmados
        console.log('✅ PAGOS CONFIRMADOS\n');
        const confirmedTxs = await db.getConfirmedTransactions();
        
        if (confirmedTxs.length === 0) {
            console.log('  (No hay pagos confirmados aún)\n');
        } else {
            console.log(`  ${confirmedTxs.length} pago(s) confirmado(s):\n`);
            confirmedTxs.forEach(tx => {
                console.log(`  ✓ TX: ${tx.tx_hash.substring(0, 16)}...`);
                console.log(`    Monto: ${tx.amount_ltc} LTC`);
                console.log(`    Confirmaciones: ${tx.confirmations}`);
                console.log(`    Fecha: ${new Date(tx.timestamp).toLocaleString()}\n`);
            });
        }

        // 4. Ingresos totales
        console.log('💰 ESTADÍSTICAS\n');
        const stats = await db.getStatistics();
        console.log(`  Total recibido: ${stats.total_ltc} LTC`);
        console.log(`  Total transacciones: ${stats.total_transactions}`);
        console.log(`  Dinero pendiente: ${stats.pending_ltc} LTC\n`);

        // 5. Monitoreo activo
        console.log('📊 ESTADO DEL MONITOREO\n');
        console.log(`  Blockchain: ${config.autobuy.blockchain.api.provider}`);
        console.log(`  Intervalo: ${config.autobuy.monitoringInterval / 1000}s`);
        console.log(`  Confirmaciones req: ${config.autobuy.payments.requiredConfirmations}`);
        console.log(`  API Key: [Configurada]\n`);

    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\nAsegúrate de:');
        console.log('1. Ejecutar: node setup-wizard.js');
        console.log('2. Tener autobuy.config.json configurado');
        console.log('3. Base de datos existe\n');
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║  Presiona Ctrl+C para salir            ║');
    console.log('╚════════════════════════════════════════╝\n');
}

// Actualizar cada 10 segundos
setInterval(showDashboard, 10000);
showDashboard();
