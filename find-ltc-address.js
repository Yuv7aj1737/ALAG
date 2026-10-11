const bip39 = require("bip39");
const litecore = require("bitcore-lib-ltc");
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');

const bip32 = BIP32Factory(ecc);

const litecoinNetwork = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

const mnemonic = 'PASTE_YOUR_12_WORD_MNEMONIC_HERE';
const targetAddress = 'YOUR_LTC_ADDRESS';

if (!bip39.validateMnemonic(mnemonic)) {
    console.log('❌ Mnemonic inválida');
    process.exit(1);
}

const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed, litecoinNetwork);

console.log('\n🔍 Buscando dirección:', targetAddress, '\n');

// Probar diferentes rutas de derivación
const paths = [
    // Rutas BIP44 estándar
    "m/44'/2'/0'/0/0",
    "m/44'/2'/0'/0/1",
    "m/44'/2'/0'/0/2",
    "m/44'/2'/0'/0/3",
    "m/44'/2'/0'/0/4",
    // Rutas alternativas que algunos wallets usan
    "m/44'/2'/0'/1/0",
    "m/0/0",
    "m/0/1",
    "m/1/0",
];

let found = false;

for (const path of paths) {
    try {
        const child = root.derivePath(path);
        const privateKey = new litecore.PrivateKey(
            child.privateKey,
            litecore.Networks.livenet,
            true
        );
        const address = privateKey.toAddress().toString();
        
        if (address === targetAddress) {
            console.log(`✅ ¡ENCONTRADA! Path: ${path}`);
            console.log(`   Dirección: ${address}`);
            console.log(`   WIF: ${privateKey.toWIF()}\n`);
            found = true;
        } else {
            console.log(`   ${path.padEnd(25)} → ${address}`);
        }
    } catch (e) {
        // Ignorar errores
    }
}

if (!found) {
    console.log(`\n⚠️  No encontrada en las rutas comunes`);
    console.log(`\nProbando rango más amplio (0-20)...\n`);
    
    for (let i = 0; i < 20; i++) {
        try {
            const path = `m/44'/2'/0'/0/${i}`;
            const child = root.derivePath(path);
            const privateKey = new litecore.PrivateKey(
                child.privateKey,
                litecore.Networks.livenet,
                true
            );
            const address = privateKey.toAddress().toString();
            
            if (address === targetAddress) {
                console.log(`✅ ¡ENCONTRADA! Path: ${path}`);
                console.log(`   Dirección: ${address}`);
                console.log(`   WIF: ${privateKey.toWIF()}\n`);
                found = true;
                break;
            }
        } catch (e) {
            // Ignorar
        }
    }
}

if (!found) {
    console.log(`❌ No se encontró la dirección`);
    console.log(`\nVerifica que:`);
    console.log(`1. La mnemonic sea correcta`);
    console.log(`2. La dirección ${targetAddress} sea la principal en Exodus`);
}
