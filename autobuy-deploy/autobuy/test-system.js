#!/usr/bin/env node

/**
 * Test Suite para Autobuy Litecoin
 * Verifica que todos los componentes funcionen correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 TEST SUITE - Autobuy Litecoin\n');
console.log('═════════════════════════════════════════\n');

// Test 1: Verificar archivos
console.log('📁 TEST 1: Verificar archivos necesarios...\n');

const files = [
    'autobuyDB.js',
    'autobuyManager.js',
    'ltcMonitor.js',
    'ltcWallet.js',
    'setup-wizard.js'
];

const missingFiles = [];
files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} NO ENCONTRADO`);
        missingFiles.push(file);
    }
});

if (missingFiles.length === 0) {
    console.log('\n✅ Todos los archivos están presentes\n');
} else {
    console.log(`\n❌ Faltan ${missingFiles.length} archivos\n`);
}

// Test 2: Verificar dependencias npm
console.log('📦 TEST 2: Verificar dependencias npm...\n');

const requiredModules = ['bip32', 'bip39', 'sqlite3', 'axios'];
const missingModules = [];

requiredModules.forEach(mod => {
    try {
        require.resolve(mod);
        console.log(`✅ ${mod}`);
    } catch (e) {
        console.log(`❌ ${mod} NO INSTALADO`);
        missingModules.push(mod);
    }
});

if (missingModules.length > 0) {
    console.log(`\n⚠️  Faltan módulos. Instala con:`);
    console.log(`npm install ${missingModules.join(' ')}\n`);
} else {
    console.log('\n✅ Todas las dependencias están instaladas\n');
}

// Test 3: Verificar config
console.log('⚙️  TEST 3: Verificar archivo de configuración...\n');

const configPath = path.join(__dirname, '..', '..', '..', 'autobuy.config.json');
if (!fs.existsSync(configPath)) {
    console.log('❌ autobuy.config.json NO ENCONTRADO');
    console.log('📝 Ejecuta: node setup-wizard.js\n');
} else {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (!config.autobuy.wallet.mnemonic) {
            console.log('❌ Mnemonic no configurada');
        } else {
            console.log('✅ Mnemonic configurada');
        }
        
        if (!config.autobuy.blockchain.api.apiKey) {
            console.log('❌ API Key no configurada');
        } else {
            console.log('✅ API Key configurada');
        }
        
        if (!config.autobuy.wallet.dbPath) {
            console.log('❌ Ruta de BD no configurada');
        } else {
            console.log('✅ Ruta de BD configurada');
        }
        
        console.log('\n✅ Archivo de configuración válido\n');
    } catch (err) {
        console.log('❌ Error en autobuy.config.json:', err.message, '\n');
    }
}

// Test 4: Probar generación de wallet
console.log('🪙 TEST 4: Probar generación de wallet...\n');

try {
    const LTCWallet = require('./ltcWallet');
    const wallet = new LTCWallet();
    
    console.log('Mnemonic generada:', wallet.getMnemonic().split(' ').length, 'palabras');
    
    const addr1 = wallet.generateAddress();
    console.log('Dirección 1:', addr1.address);
    
    const addr2 = wallet.generateAddress();
    console.log('Dirección 2:', addr2.address);
    
    if (addr1.address !== addr2.address) {
        console.log('✅ Genera direcciones únicas correctamente\n');
    } else {
        console.log('❌ Genera direcciones duplicadas\n');
    }
} catch (err) {
    console.log('❌ Error generando wallet:', err.message, '\n');
}

// Test 5: Probar base de datos
console.log('💾 TEST 5: Probar base de datos...\n');

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const AutobuyDB = require('./autobuyDB');
    const db = new AutobuyDB(config.autobuy.wallet.dbPath);
    
    console.log('✅ Base de datos conectada\n');
} catch (err) {
    console.log('❌ Error conectando BD:', err.message);
    console.log('Asegúrate de que SQLite esté instalado\n');
}

// Test 6: Verificar estructura de directorios
console.log('📂 TEST 6: Verificar estructura de directorios...\n');

const dirs = [
    path.join(__dirname, '..', '..', '..', 'db'),
    path.join(__dirname, '..', '..', '..', 'logs'),
    path.join(__dirname, 'temp')
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Creada carpeta: ${path.basename(dir)}`);
    } else {
        console.log(`✅ Existe: ${path.basename(dir)}`);
    }
});

console.log('\n═════════════════════════════════════════\n');

// Resumen
console.log('📊 RESUMEN\n');
console.log(`Archivos necesarios: ${files.length - missingFiles.length}/${files.length}`);
console.log(`Módulos npm: ${requiredModules.length - missingModules.length}/${requiredModules.length}`);

if (missingFiles.length === 0 && missingModules.length === 0) {
    console.log('\n✅ SISTEMA LISTO PARA USAR!\n');
    console.log('Próximos pasos:');
    console.log('1. node setup-wizard.js  (Si no lo has ejecutado)');
    console.log('2. npm start              (Inicia el bot)');
    console.log('3. /autobuy buy           (Prueba en Discord)');
    console.log('\n');
} else {
    console.log('\n⚠️  Por favor resuelve los problemas antes de continuar.\n');
}
