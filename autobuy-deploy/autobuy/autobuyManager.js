const LTCWallet = require('./ltcWallet');
const LTCMonitor = require('./ltcMonitor');
const AutobuyDB = require('./autobuyDB');

/**
 * Autobuy Payment Manager
 * Handles payment generation, monitoring, and confirmation
 */

class AutobuyManager {
    constructor(walletMnemonic = null, apiKey = null, config = null) {
        // Si no hay mnemonic, intentar leer de config
        if (!walletMnemonic && config && config.autobuy?.wallet?.mnemonic) {
            walletMnemonic = config.autobuy.wallet.mnemonic;
        }

        this.wallet = new LTCWallet(walletMnemonic);
        this.monitor = new LTCMonitor(apiKey);
        this.db = new AutobuyDB();
        this.monitoringActive = false;
        this.monitoringInterval = null;
        this.config = config;

        console.log('[AutobuyManager] Initialized');
        console.log('[AutobuyManager] Wallet mnemonic (BACKUP THIS!):', this.wallet.getMnemonic());
        console.log('[AutobuyManager] ✅ Todos los fondos llegarán a esta wallet');
    }

    /**
     * Create a payment request
     * Returns: { address, expectedAmount, expiresIn }
     */
    async createPaymentRequest(licenseId, ownerId, priceLtc, expiresIn = 3600) {
        try {
            console.log(`[AutobuyManager] Creating payment for ${licenseId}`);

            // Generate new address
            const addressData = this.wallet.generateAddress();
            
            // Store in database
            await this.db.addPaymentAddress(
                addressData.address,
                licenseId,
                ownerId,
                addressData.path,
                addressData.index,
                priceLtc,
                expiresIn
            );

            // Add license if not exists
            await this.db.addLicense(licenseId, 'license', ownerId, priceLtc, null);

            console.log(`[AutobuyManager] Payment address generated: ${addressData.address}`);

            return {
                address: addressData.address,
                expectedAmount: priceLtc,
                expiresIn: expiresIn,
                derPath: addressData.path
            };
        } catch (error) {
            console.error('[AutobuyManager] Error creating payment request:', error.message);
            throw error;
        }
    }

    /**
     * Check transaction for a payment address
     */
    async checkPaymentAddress(address, licenseId) {
        try {
            console.log(`[AutobuyManager] Checking payment for ${licenseId}`);

            const transactions = await this.monitor.getIncomingTransactions(address);

            if (transactions.length === 0) {
                console.log(`[AutobuyManager] No transactions found for ${address}`);
                return { paid: false, transactions: [] };
            }

            const results = [];

            for (const tx of transactions) {
                // Check if already recorded
                const existing = await this.getTransaction(tx.txHash);

                if (!existing) {
                    // Record new transaction
                    await this.recordTransaction(address, tx);
                    console.log(`[AutobuyManager] New transaction recorded: ${tx.txHash}`);
                }

                // Check confirmations
                const { confirmed, confirmations } = await this.monitor.isTransactionConfirmed(tx.txHash, 1);

                results.push({
                    txHash: tx.txHash,
                    amount: tx.amount,
                    confirmations: confirmations,
                    confirmed: confirmed,
                    blockHeight: tx.blockHeight
                });
            }

            const paid = results.some(tx => tx.confirmed && tx.amount >= 0.001); // Min 0.001 LTC

            return { paid, transactions: results };
        } catch (error) {
            console.error('[AutobuyManager] Error checking payment:', error.message);
            return { paid: false, transactions: [], error: error.message };
        }
    }

    /**
     * Record transaction in database
     */
    async recordTransaction(address, transactionData) {
        try {
            // Get payment address ID
            const result = await this.db.db.get(
                'SELECT id FROM payment_addresses WHERE address = ? LIMIT 1',
                [address]
            );

            if (!result) {
                throw new Error('Payment address not found in database');
            }

            await this.db.addTransaction(
                transactionData.txHash,
                result.id,
                null, // from_address
                address,
                transactionData.amount,
                new Date(transactionData.timestamp * 1000).toISOString()
            );
        } catch (error) {
            console.error('[AutobuyManager] Error recording transaction:', error.message);
        }
    }

    /**
     * Get transaction details
     */
    async getTransaction(txHash) {
        return new Promise((resolve, reject) => {
            this.db.db.get(
                'SELECT * FROM transactions WHERE tx_hash = ?',
                [txHash],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Start monitoring all pending payments
     */
    async startMonitoring(checkInterval = 60000) {
        if (this.monitoringActive) {
            console.log('[AutobuyManager] Monitoring already active');
            return;
        }

        this.monitoringActive = true;
        console.log('[AutobuyManager] Starting payment monitoring (interval: ' + checkInterval + 'ms)');

        this.monitoringInterval = setInterval(async () => {
            try {
                await this.checkAllPendingPayments();
            } catch (error) {
                console.error('[AutobuyManager] Error in monitoring loop:', error.message);
            }
        }, checkInterval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringActive = false;
            console.log('[AutobuyManager] Monitoring stopped');
        }
    }

    /**
     * Check all pending payments
     */
    async checkAllPendingPayments() {
        try {
            const pendingAddresses = await this.db.getPendingAddresses();

            console.log(`[AutobuyManager] Checking ${pendingAddresses.length} pending addresses...`);

            for (const addressData of pendingAddresses) {
                const result = await this.checkPaymentAddress(addressData.address, addressData.license_id);

                if (result.paid) {
                    console.log(`[AutobuyManager] ✅ Payment received for ${addressData.license_id}`);
                    
                    // Update payment address status
                    await this.db.db.run(
                        'UPDATE payment_addresses SET status = ? WHERE address = ?',
                        ['received', addressData.address]
                    );

                    // Get confirmed transaction
                    const confirmedTx = result.transactions.find(t => t.confirmed);
                    if (confirmedTx) {
                        // Update transaction status
                        await this.db.updateTransactionConfirmations(confirmedTx.txHash, confirmedTx.confirmations);
                    }
                }
            }
        } catch (error) {
            console.error('[AutobuyManager] Error checking pending payments:', error.message);
        }
    }

    /**
     * Complete a purchase
     */
    async completePurchase(buyerId, licenseId, txHash) {
        try {
            const tx = await this.getTransaction(txHash);

            if (!tx) {
                throw new Error('Transaction not found');
            }

            const purchaseId = await this.db.createPurchase(buyerId, licenseId, tx.id);

            console.log(`[AutobuyManager] Purchase created: ${purchaseId}`);

            return purchaseId;
        } catch (error) {
            console.error('[AutobuyManager] Error completing purchase:', error.message);
            throw error;
        }
    }

    /**
     * Get wallet mnemonic (for backup)
     */
    getWalletMnemonic() {
        return this.wallet.getMnemonic();
    }

    /**
     * Get current address index
     */
    getCurrentAddressIndex() {
        return this.wallet.getCurrentIndex();
    }
}

module.exports = AutobuyManager;
