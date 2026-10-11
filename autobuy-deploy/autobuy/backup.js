#!/usr/bin/env node

/**
 * Herramienta de Respaldo y Exportación
 * Guarda datos importantes de forma segura
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (q) => new Promise(resolve => rl.question(q, resolve));

async function backup() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║        RESPALDO Y EXPORTACIÓN          ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        const configPath = path.join(__dirname, '..', '..', '..', 'autobuy.config.json');
        
        if (!fs.existsSync(configPath)) {
            console.log('❌ autobuy.config.json no encontrado');
            return;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Crear directorio de backup
        const backupDir = path.join(__dirname, '..', '..', '..', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Opción 1: Respaldar mnemonic
        console.log('🔐 OPCIONES DE RESPALDO:\n');
        console.log('1. Respaldar mnemonic (CRÍTICO)');
        console.log('2. Respaldar base de datos');
        console.log('3. Respaldar todo');
        console.log('4. Exportar reporte de transacciones');
        console.log('5. Salir\n');

        const choice = await question('Selecciona opción (1-5): ');

        if (choice === '1' || choice === '3') {
            // Respaldar mnemonic
            const mnemonic = config.autobuy.wallet.mnemonic;
            const mnemonicPath = path.join(backupDir, `mnemonic_${timestamp}.txt`);
            
            const mnemonicContent = `╔════════════════════════════════════════╗
║   RESPALDO DE MNEMONIC LITECOIN       ║
╚════════════════════════════════════════╝

FECHA: ${new Date().toLocaleString()}
IMPORTANTE: GUARDA ESTE ARCHIVO EN LUGAR SEGURO

MNEMONIC (24 palabras):
${mnemonic}

INSTRUCCIONES:
1. Imprime este documento
2. Guarda en caja fuerte o lugar seguro
3. NO lo compartas con nadie
4. Si pierdes estas palabras, pierdes TODOS los fondos

COPIA ADICIONAL (escribe con bolígrafo):
_____________________________________________________
_____________________________________________________
_____________________________________________________
`;

            fs.writeFileSync(mnemonicPath, mnemonicContent);
            console.log(`\n✅ Mnemonic guardada en: ${mnemonicPath}`);
            console.log('⚠️  IMPORTANTE: Guarda este archivo en un lugar seguro\n');
        }

        if (choice === '2' || choice === '3') {
            // Respaldar base de datos
            const dbPath = config.autobuy.wallet.dbPath;
            if (fs.existsSync(dbPath)) {
                const dbBackupPath = path.join(backupDir, `autobuy_${timestamp}.db`);
                fs.copyFileSync(dbPath, dbBackupPath);
                console.log(`✅ Base de datos guardada en: ${dbBackupPath}`);
            }
        }

        if (choice === '4') {
            // Exportar reporte
            try {
                const AutobuyDB = require('./autobuyDB');
                const db = new AutobuyDB(config.autobuy.wallet.dbPath);
                
                const transactions = await db.getAllTransactions();
                const payments = await db.getPaymentAddresses();
                const licenses = await db.getLicenses();

                const report = {
                    fecha: new Date().toLocaleString(),
                    resumen: {
                        total_transacciones: transactions.length,
                        total_direcciones: payments.length,
                        total_productos: licenses.length
                    },
                    transacciones: transactions,
                    direcciones: payments,
                    productos: licenses
                };

                const reportPath = path.join(backupDir, `reporte_${timestamp}.json`);
                fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
                console.log(`\n✅ Reporte exportado en: ${reportPath}`);
            } catch (err) {
                console.log('❌ Error exportando reporte:', err.message);
            }
        }

        if (choice !== '5') {
            console.log(`\n📁 Carpeta de backups: ${backupDir}`);
            console.log('\n✨ Respaldo completado\n');
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

backup();
