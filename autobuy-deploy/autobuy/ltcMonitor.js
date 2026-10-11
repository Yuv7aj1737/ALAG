const axios = require('axios');

/**
 * Litecoin Blockchain Monitor
 * Uses Blockchair API to monitor transactions
 */

class LTCMonitor {
    constructor(apiKey = null) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.blockchair.com/litecoin';
        this.headers = {
            'Accept': 'application/json'
        };
        
        if (apiKey) {
            this.headers['X-API-Key'] = apiKey;
        }
    }

    /**
     * Get address info and transactions
     */
    async getAddressInfo(address) {
        try {
            console.log(`[LTC Monitor] Checking address: ${address}`);
            
            const response = await axios.get(
                `${this.baseUrl}/addresses/${address}?transaction_details=true`,
                { headers: this.headers }
            );

            if (response.data.data && response.data.data[address]) {
                return response.data.data[address];
            }
            return null;
        } catch (error) {
            console.error('[LTC Monitor] Error checking address:', error.message);
            return null;
        }
    }

    /**
     * Get transaction details
     */
    async getTransaction(txHash) {
        try {
            console.log(`[LTC Monitor] Getting transaction: ${txHash}`);
            
            const response = await axios.get(
                `${this.baseUrl}/transactions/${txHash}`,
                { headers: this.headers }
            );

            if (response.data.data && response.data.data[txHash]) {
                return response.data.data[txHash];
            }
            return null;
        } catch (error) {
            console.error('[LTC Monitor] Error getting transaction:', error.message);
            return null;
        }
    }

    /**
     * Check if transaction is confirmed
     * Returns: { confirmed: boolean, confirmations: number }
     */
    async isTransactionConfirmed(txHash, requiredConfirmations = 1) {
        try {
            const tx = await this.getTransaction(txHash);
            
            if (!tx) {
                return { confirmed: false, confirmations: 0 };
            }

            const confirmations = tx.confirmations || 0;
            const confirmed = confirmations >= requiredConfirmations;

            console.log(`[LTC Monitor] TX ${txHash.substring(0, 8)}... - Confirmations: ${confirmations}`);

            return { confirmed, confirmations };
        } catch (error) {
            console.error('[LTC Monitor] Error checking confirmations:', error.message);
            return { confirmed: false, confirmations: 0 };
        }
    }

    /**
     * Get all incoming transactions to an address
     */
    async getIncomingTransactions(address, minAmount = null) {
        try {
            const addressInfo = await this.getAddressInfo(address);
            
            if (!addressInfo || !addressInfo.transactions) {
                return [];
            }

            const incomingTxs = [];

            for (const txHash of addressInfo.transactions) {
                const tx = await this.getTransaction(txHash);
                
                if (!tx) continue;

                // Check if address is a recipient in this transaction
                for (const output of tx.outputs || []) {
                    if (output.recipient === address) {
                        const amount = output.value / 100000000; // Convert satoshis to LTC

                        if (minAmount && amount < minAmount) continue;

                        incomingTxs.push({
                            txHash: txHash,
                            amount: amount,
                            confirmations: tx.confirmations || 0,
                            timestamp: tx.time,
                            blockHeight: tx.block_id
                        });
                    }
                }
            }

            return incomingTxs;
        } catch (error) {
            console.error('[LTC Monitor] Error getting incoming transactions:', error.message);
            return [];
        }
    }

    /**
     * Wait for transaction confirmation with timeout
     */
    async waitForConfirmation(txHash, requiredConfirmations = 1, maxWaitTime = 3600000) {
        const startTime = Date.now();
        const checkInterval = 30000; // Check every 30 seconds

        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const { confirmed, confirmations } = await this.isTransactionConfirmed(txHash, requiredConfirmations);

                    if (confirmed) {
                        clearInterval(interval);
                        resolve({ confirmed: true, confirmations });
                    }

                    if (Date.now() - startTime > maxWaitTime) {
                        clearInterval(interval);
                        reject(new Error(`Transaction confirmation timeout after ${maxWaitTime / 1000}s`));
                    }
                } catch (error) {
                    clearInterval(interval);
                    reject(error);
                }
            }, checkInterval);
        });
    }

    /**
     * Get current LTC price
     */
    async getLTCPrice(currency = 'USD') {
        try {
            const response = await axios.get(
                'https://api.coingecko.com/api/v3/simple/price',
                {
                    params: {
                        ids: 'litecoin',
                        vs_currencies: currency.toLowerCase()
                    }
                }
            );

            return response.data.litecoin[currency.toLowerCase()];
        } catch (error) {
            console.error('[LTC Monitor] Error getting LTC price:', error.message);
            return null;
        }
    }
}

module.exports = LTCMonitor;
