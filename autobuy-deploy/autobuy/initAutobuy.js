/**
 * Inicializador de Autobuy
 * Se ejecuta cuando el bot está listo
 */

const fs = require('fs');
const path = require('path');
const AutobuyManager = require('./autobuyManager');

let autobuyManager = null;
let initialized = false;

async function initializeAutobuy() {
    try {
        console.log('\n[AUTOBUY] Inicializando sistema de pagos...\n');

        // Cargar configuración
        const configPath = path.join(__dirname, '..', '..', '..', 'autobuy.config.json');
        
        if (!fs.existsSync(configPath)) {
            console.log('[AUTOBUY] ⚠️  autobuy.config.json no encontrado');
            console.log('[AUTOBUY] Ejecuta: node autosecure/utils/autobuy/setup-wizard.js');
            return false;
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.autobuy.wallet.mnemonic) {
            console.log('[AUTOBUY] ❌ Mnemonic no configurada en autobuy.config.json');
            return false;
        }

        if (!config.autobuy.blockchain.api.apiKey) {
            console.log('[AUTOBUY] ❌ API Key de Blockchair no configurada');
            console.log('[AUTOBUY] Ve a: https://blockchair.com/api');
            return false;
        }

        // Inicializar manager
        autobuyManager = new AutobuyManager(
            config.autobuy.wallet.mnemonic,
            config.autobuy.blockchain.api.apiKey,
            config
        );

        // Crear directorios necesarios
        const dirs = [
            path.join(__dirname, 'temp'),
            path.join(__dirname, '..', '..', '..', 'db'),
            path.join(__dirname, '..', '..', '..', 'logs')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Iniciar monitoreo
        if (config.autobuy.enabled) {
            autobuyManager.startMonitoring(config.autobuy.monitoringInterval);
            console.log('[AUTOBUY] ✅ Monitoreo de blockchain iniciado');
        }

        initialized = true;
        console.log('[AUTOBUY] ✅ Sistema de pagos LTC listo\n');

        return true;

    } catch (error) {
        console.error('[AUTOBUY] ❌ Error inicializando:', error.message);
        return false;
    }
}

/**
 * Obtener el manager (para usar en comandos)
 */
function getAutobuyManager() {
    if (!initialized || !autobuyManager) {
        throw new Error('Autobuy no está inicializado');
    }
    return autobuyManager;
}

/**
 * Detener el sistema
 */
function stopAutobuy() {
    if (autobuyManager) {
        autobuyManager.stopMonitoring();
        console.log('[AUTOBUY] Monitoreo detenido');
    }
}

module.exports = {
    initializeAutobuy,
    getAutobuyManager,
    stopAutobuy
};
