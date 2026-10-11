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

console.log('\n🔍 Buscando dirección:', targetAddress);
console.log('Probando índices 0-100...\n');

let found = false;

for (let i = 0; i <= 100; i++) {
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
            console.log(`✅ ¡¡¡ENCONTRADA!!!`);
            console.log(`   Path: ${path}`);
            console.log(`   Dirección: ${address}`);
            console.log(`   WIF: ${privateKey.toWIF()}\n`);
            found = true;
            break;
        } else if (i < 10 || i % 10 === 0) {
            console.log(`   [${i}] ${address}`);
        }
    } catch (e) {
        // Ignorar
    }
}

if (!found) {
    console.log(`\n❌ No encontrada en índices 0-100`);
    console.log(`\nEstas palabras generan: LPQSSkgowQibggUsLnPKABzhTXFDz2xvyy`);
    console.log(`Pero necesitas: ${targetAddress}`);
    console.log(`\nLas palabras NO son correctas para esa dirección.`);
}
