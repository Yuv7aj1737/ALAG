const bip39 = require("bip39");
const litecore = require("bitcore-lib-ltc");
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');

// Initialize bip32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Network configuration for Litecoin
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

// Validar mnemonic
if (!bip39.validateMnemonic(mnemonic)) {
    console.log('❌ Mnemonic inválida');
    process.exit(1);
}

// Convertir mnemonic a seed
const seed = bip39.mnemonicToSeedSync(mnemonic);

// Derivar root key desde seed
const root = bip32.fromSeed(seed, litecoinNetwork);

// Derivar primera dirección (m/44'/2'/0'/0/0)
// Ruta BIP44 para Litecoin: m/44'/2'/0'/0/0
const path = "m/44'/2'/0'/0/0";
const child = root.derivePath(path);

// Convertir a private key de bitcore
const privateKey = new litecore.PrivateKey(
    child.privateKey,
    litecore.Networks.livenet,
    true
);

const address = privateKey.toAddress().toString();

console.log('\n🪙 TU DIRECCIÓN DE LITECOIN MAESTRA:\n');
console.log(`Dirección: ${address}`);
console.log(`\n✅ Esta es tu dirección de pago principal derivada de tu mnemonic\n`);
