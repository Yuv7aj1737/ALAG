const bip32 = require('bip32');
const bip39 = require('bip39');

/**
 * LTC HD Wallet Manager
 * Generates unique addresses from a master seed
 */

class LTCWallet {
    constructor(mnemonic = null, masterKey = null) {
        if (mnemonic && !this.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic');
        }
        this.mnemonic = mnemonic || bip39.generateMnemonic(256);
        this.seed = bip39.mnemonicToSeedSync(this.mnemonic);
        this.root = bip32.fromSeed(this.seed, this.getLTCNetwork());
        this.addressIndex = 0;
    }

    getLTCNetwork() {
        // Litecoin mainnet network params
        return {
            bip32: {
                public: 0x019da462,
                private: 0x019d9cfe
            },
            messagePrefix: '\x19Litecoin Signed Message:\n',
            pubKeyHash: 0x30,
            scriptHash: 0x32,
            wif: 0xb0
        };
    }

    validateMnemonic(mnemonic) {
        return bip39.validateMnemonic(mnemonic);
    }

    /**
     * Generate a new LTC address
     * Path: m/44'/2'/0'/0/index (BIP44 for Litecoin)
     */
    generateAddress() {
        const path = `m/44'/2'/0'/0/${this.addressIndex}`;
        const child = this.root.derivePath(path);
        const address = this.getAddressFromPublicKey(child.publicKey);
        
        this.addressIndex++;
        
        return {
            address,
            publicKey: child.publicKey.toString('hex'),
            path,
            index: this.addressIndex - 1
        };
    }

    /**
     * Get address from public key (P2PKH format for LTC)
     */
    getAddressFromPublicKey(publicKey) {
        const crypto = require('crypto');
        const bs58 = require('bs58');
        
        // Hash160 (RIPEMD160(SHA256(publicKey)))
        const sha256 = crypto.createHash('sha256').update(publicKey).digest();
        const ripemd160 = require('ripemd160');
        const hash160 = new ripemd160().update(sha256).digest();
        
        // Add version byte for Litecoin mainnet (0x30)
        const versionedHash = Buffer.concat([Buffer.from([0x30]), hash160]);
        
        // Calculate checksum
        const checksum = crypto
            .createHash('sha256')
            .update(crypto.createHash('sha256').update(versionedHash).digest())
            .digest()
            .slice(0, 4);
        
        // Encode to Base58Check
        return bs58.encode(Buffer.concat([versionedHash, checksum]));
    }

    /**
     * Generate multiple addresses at once
     */
    generateMultipleAddresses(count) {
        const addresses = [];
        for (let i = 0; i < count; i++) {
            addresses.push(this.generateAddress());
        }
        return addresses;
    }

    /**
     * Get mnemonic (seed phrase)
     */
    getMnemonic() {
        return this.mnemonic;
    }

    /**
     * Get current index
     */
    getCurrentIndex() {
        return this.addressIndex;
    }

    /**
     * Set address index
     */
    setAddressIndex(index) {
        this.addressIndex = index;
    }
}

module.exports = LTCWallet;
