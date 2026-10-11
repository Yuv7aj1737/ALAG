const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Autobuy Database Manager
 * Stores licenses, payments, addresses, transactions
 */

class AutobuyDB {
    constructor(dbPath = '/root/autosecure/db/autobuy.db') {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('[AutobuyDB] Error opening database:', err.message);
            } else {
                console.log('[AutobuyDB] Connected to autobuy database');
                this.initTables();
            }
        });
    }

    /**
     * Initialize database tables
     */
    initTables() {
        const queries = [
            // Store licenses/slots for sale
            `CREATE TABLE IF NOT EXISTS licenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                license_id TEXT UNIQUE NOT NULL,
                type TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                price_ltc REAL NOT NULL,
                price_usd REAL,
                active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // Store generated addresses (one per purchase attempt)
            `CREATE TABLE IF NOT EXISTS payment_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                address TEXT UNIQUE NOT NULL,
                license_id TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                derivation_path TEXT NOT NULL,
                address_index INTEGER NOT NULL,
                expected_amount_ltc REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY (license_id) REFERENCES licenses(license_id)
            )`,

            // Store transactions
            `CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tx_hash TEXT UNIQUE NOT NULL,
                payment_address_id INTEGER NOT NULL,
                from_address TEXT,
                to_address TEXT NOT NULL,
                amount_ltc REAL NOT NULL,
                confirmations INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                detected_at TIMESTAMP,
                confirmed_at TIMESTAMP,
                blockchain_time TIMESTAMP,
                FOREIGN KEY (payment_address_id) REFERENCES payment_addresses(id)
            )`,

            // Store purchases
            `CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buyer_id TEXT NOT NULL,
                license_id TEXT NOT NULL,
                transaction_id INTEGER NOT NULL,
                delivered BOOLEAN DEFAULT 0,
                delivered_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id)
            )`,

            // Store webhook events (for monitoring)
            `CREATE TABLE IF NOT EXISTS webhook_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                tx_hash TEXT,
                address TEXT,
                data TEXT,
                processed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('[AutobuyDB] Error creating table:', err.message);
                }
            });
        });
    }

    /**
     * Add a license for sale
     */
    addLicense(licenseId, type, ownerId, priceLtc, priceUsd) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO licenses 
                (license_id, type, owner_id, price_ltc, price_usd, active)
                VALUES (?, ?, ?, ?, ?, 1)
            `;
            
            this.db.run(query, [licenseId, type, ownerId, priceLtc, priceUsd], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Create payment address for a purchase
     */
    addPaymentAddress(address, licenseId, ownerId, derivationPath, addressIndex, expectedAmount, expiresIn = 3600) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO payment_addresses 
                (address, license_id, owner_id, derivation_path, address_index, expected_amount_ltc, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+' || ? || ' seconds'))
            `;
            
            this.db.run(query, [address, licenseId, ownerId, derivationPath, addressIndex, expectedAmount, expiresIn], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Record transaction
     */
    addTransaction(txHash, paymentAddressId, fromAddress, toAddress, amountLtc, blockchainTime) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO transactions 
                (tx_hash, payment_address_id, from_address, to_address, amount_ltc, detected_at, blockchain_time, status)
                VALUES (?, ?, ?, ?, ?, datetime('now'), ?, 'pending')
            `;
            
            this.db.run(query, [txHash, paymentAddressId, fromAddress, toAddress, amountLtc, blockchainTime], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Update transaction confirmations
     */
    updateTransactionConfirmations(txHash, confirmations) {
        return new Promise((resolve, reject) => {
            const status = confirmations >= 1 ? 'confirmed' : 'pending';
            const query = `
                UPDATE transactions 
                SET confirmations = ?, status = ?, confirmed_at = CASE WHEN ? >= 1 THEN datetime('now') ELSE confirmed_at END
                WHERE tx_hash = ?
            `;
            
            this.db.run(query, [confirmations, status, confirmations, txHash], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    /**
     * Get pending payment addresses
     */
    getPendingAddresses() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM payment_addresses 
                WHERE status = 'pending' AND expires_at > datetime('now')
                ORDER BY created_at DESC
            `;
            
            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Get transactions for an address
     */
    getAddressTransactions(address) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT t.* FROM transactions t
                JOIN payment_addresses pa ON t.payment_address_id = pa.id
                WHERE pa.address = ?
                ORDER BY t.created_at DESC
            `;
            
            this.db.all(query, [address], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Create purchase record
     */
    createPurchase(buyerId, licenseId, transactionId) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO purchases (buyer_id, license_id, transaction_id)
                VALUES (?, ?, ?)
            `;
            
            this.db.run(query, [buyerId, licenseId, transactionId], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Mark purchase as delivered
     */
    deliverPurchase(purchaseId, notes = null) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE purchases 
                SET delivered = 1, delivered_at = datetime('now'), notes = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [notes, purchaseId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    /**
     * Get purchase details
     */
    getPurchase(purchaseId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, t.tx_hash, t.amount_ltc, t.confirmations, pa.address
                FROM purchases p
                JOIN transactions t ON p.transaction_id = t.id
                JOIN payment_addresses pa ON t.payment_address_id = pa.id
                WHERE p.id = ?
            `;
            
            this.db.get(query, [purchaseId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    /**
     * Log webhook event
     */
    logWebhookEvent(eventType, txHash, address, data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO webhook_logs (event_type, tx_hash, address, data)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(query, [eventType, txHash, address, JSON.stringify(data)], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    /**
     * Close database
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else {
                    console.log('[AutobuyDB] Database closed');
                    resolve();
                }
            });
        });
    }
}

module.exports = AutobuyDB;
