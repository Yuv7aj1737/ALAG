#!/usr/bin/env node

/**
 * Setup Wizard para Autobuy con Litecoin
 * Configura todo automáticamente
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (q) => new Promise(resolve => rl.question(q, resolve));

async function setupWizard() {
    console.log('\n🚀 SETUP WIZARD - Autobuy con Litecoin\n');
    console.log('Este wizard te ayudará a configurar tu sistema de compras automáticas.\n');

    // 1. Wallet Setup
    console.log('📦 PASO 1: WALLET DE LITECOIN\n');
    console.log('Tienes 3 opciones:');
    console.log('1. Crear una nueva wallet (Nueva mnemonic)');
    console.log('2. Usar una wallet existente (Tienes las palabras)');
    console.log('');

    const walletOption = await question('Selecciona opción (1-2): ');

    let mnemonic;
    if (walletOption === '1') {
        console.log('\n✨ Generando nueva wallet...');
        const bip39 = require('bip39');
        mnemonic = bip39.generateMnemonic(256);
        console.log('\n⚠️  GUARDA ESTAS PALABRAS EN UN LUGAR SEGURO:');
        console.log('\n' + mnemonic + '\n');
        console.log('Si pierdes estas palabras, pierdes todos los fondos.\n');
        
        const confirm = await question('He guardado estas palabras en un lugar seguro (s/n): ');
        if (confirm.toLowerCase() !== 's') {
            console.log('❌ Por favor guarda las palabras antes de continuar.');
            process.exit(1);
        }
    } else {
        mnemonic = await question('\nPega tus 24 palabras (separadas por espacios): ');
        const bip39 = require('bip39');
        if (!bip39.validateMnemonic(mnemonic.trim())) {
            console.log('❌ Mnemonic inválido. Verifica que hayas pegado correctamente.');
            process.exit(1);
        }
    }

    // 2. API Key
    console.log('\n\n📱 PASO 2: BLOCKCHAIR API KEY\n');
    console.log('Necesitas una API Key gratis de Blockchair para monitorear transacciones.');
    console.log('1. Ve a: https://blockchair.com/api');
    console.log('2. Click "Sign Up" (arriba a la derecha)');
    console.log('3. Crea cuenta y verifica email');
    console.log('4. Copia tu API Key desde el dashboard\n');

    const apiKey = await question('Pega tu API Key de Blockchair: ');
    if (!apiKey || apiKey.trim().length === 0) {
        console.log('❌ API Key no puede estar vacía');
        process.exit(1);
    }

    // 3. Discord Configuration
    console.log('\n\n💬 PASO 3: CONFIGURACIÓN DISCORD\n');
    const discordId = await question('Tu Discord ID (ej: 123456789): ');
    const channelId = await question('ID del canal para notificaciones (opcional, Enter para saltar): ');

    // 4. Precios
    console.log('\n\n💰 PASO 4: PRECIOS DE TUS PRODUCTOS\n');
    const licensePriceLtc = await question('Precio License en LTC (ej: 0.001): ');
    const slotPriceLtc = await question('Precio Slot en LTC (ej: 0.002): ');

    // 5. Create config file
    console.log('\n\n📝 Creando archivo de configuración...\n');

    const configPath = path.join(__dirname, '..', 'autobuy.config.json');
    
    const config = {
        "autobuy": {
            "enabled": true,
            "monitoringInterval": 60000,
            "blockchain": {
                "network": "litecoin",
                "rpc": {
                    "enabled": false,
                    "host": "localhost",
                    "port": 9332,
                    "user": "litecoin",
                    "pass": "password"
                },
                "api": {
                    "provider": "blockchair",
                    "apiKey": apiKey.trim()
                }
            },
            "wallet": {
                "mnemonic": mnemonic.trim(),
                "dbPath": path.join(__dirname, '..', "db", "autobuy.db"),
                "currency": "LTC"
            },
            "payments": {
                "minAmount": 0.0001,
                "requiredConfirmations": 1,
                "addressExpiry": 3600,
                "webhook": {
                    "enabled": false,
                    "url": "",
                    "secret": ""
                }
            },
            "discord": {
                "notifyChannel": channelId || null,
                "notifyRole": null,
                "autoDeliver": true
            },
            "fees": {
                "enabled": false,
                "percentage": 0
            }
        },
        "products": {
            "licenses": {
                "price_ltc": parseFloat(licensePriceLtc),
                "price_usd": parseFloat(licensePriceLtc) * 50  // Estimado
            },
            "slots": {
                "price_ltc": parseFloat(slotPriceLtc),
                "price_usd": parseFloat(slotPriceLtc) * 50
            }
        },
        "owner": {
            "discord_id": discordId.trim()
        }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Config guardada en:', configPath);

    // 6. Create database
    console.log('\n\n💾 Inicializando base de datos...\n');
    try {
        const AutobuyDB = require('./autobuyDB');
        const db = new AutobuyDB(config.autobuy.wallet.dbPath);
        console.log('✅ Base de datos iniciada');
    } catch (err) {
        console.warn('⚠️  Error iniciando BD:', err.message);
    }

    // 7. Add licenses
    console.log('\n\n📜 Agregando licenses y slots...\n');
    try {
        const AutobuyDB = require('./autobuyDB');
        const db = new AutobuyDB(config.autobuy.wallet.dbPath);

        // Agregar licenses
        for (let i = 1; i <= 3; i++) {
            await db.addLicense(
                `license_${i}`,
                'license',
                discordId.trim(),
                parseFloat(licensePriceLtc),
                parseFloat(licensePriceLtc) * 50
            );
        }

        // Agregar slots
        for (let i = 1; i <= 3; i++) {
            await db.addLicense(
                `slot_${i}`,
                'slot',
                discordId.trim(),
                parseFloat(slotPriceLtc),
                parseFloat(slotPriceLtc) * 50
            );
        }

        console.log('✅ Licenses agregadas (3 licenses + 3 slots)');
    } catch (err) {
        console.error('❌ Error agregando licenses:', err.message);
    }

    // 8. Summary
    console.log('\n\n✨ SETUP COMPLETADO! ✨\n');
    console.log('═════════════════════════════════════════');
    console.log('📋 RESUMEN DE CONFIGURACIÓN');
    console.log('═════════════════════════════════════════\n');
    console.log('🪙 Red: Litecoin Mainnet');
    console.log('👤 Tu Discord ID:', discordId);
    console.log('💾 Config guardada en:', configPath);
    console.log('💰 Precio License:', licensePriceLtc, 'LTC');
    console.log('🎫 Precio Slot:', slotPriceLtc, 'LTC');
    console.log('📱 API Key: Configurada ✓');
    console.log('🔐 Mnemonic: Guardada en config ✓');
    
    if (channelId) {
        console.log('📢 Canal notificaciones:', channelId);
    }

    console.log('\n═════════════════════════════════════════\n');
    
    console.log('🚀 PRÓXIMOS PASOS:\n');
    console.log('1. Verifica el archivo autobuy.config.json');
    console.log('2. Inicia el bot Discord: npm start');
    console.log('3. Prueba con /autobuy buy license_1');
    console.log('4. Envía LTC a la dirección generada para probar');
    console.log('5. El bot detectará el pago automáticamente');

    console.log('\n📚 Documentación: AUTOBUY_LTC_SETUP_COMPLETO.md');
    console.log('💡 Soporte: Revisa los logs en la carpeta logs/\n');

    rl.close();
}

setupWizard().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
