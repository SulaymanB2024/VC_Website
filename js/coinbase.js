// Coinbase API Manager for cryptocurrency data
(function() {
    'use strict';
    
    const COINBASE_API = {
        baseUrl: 'https://api.exchange.coinbase.com',
        products: {
            'BTC': 'BTC-USD',
            'ETH': 'ETH-USD', 
            'SOL': 'SOL-USD'
        }
    };

    class CoinbaseManager {
        constructor() {
            this.cache = new Map();
        }

        // Get cached data or fetch from API
        async getCachedOrFetch(cacheKey, fetchFn, maxAge) {
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < maxAge) {
                return cached.data;
            }

            try {
                const data = await fetchFn();
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
                return data;
            } catch (error) {
                if (cached) {
                    console.warn('Using expired cache due to API error:', error);
                    return cached.data;
                }
                throw error;
            }
        }

        // Fetch 24hr stats for change calculation
        async fetch24HrStats(symbol) {
            const productId = COINBASE_API.products[symbol];
            if (!productId) throw new Error(`Unknown symbol: ${symbol}`);
            
            const cacheKey = `stats_${symbol}`;
            
            return this.getCachedOrFetch(
                cacheKey,
                async () => {
                    const response = await fetch(`${COINBASE_API.baseUrl}/products/${productId}/stats`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    
                    const data = await response.json();
                    
                    const currentPrice = parseFloat(data.last);
                    const openPrice = parseFloat(data.open);
                    const change = currentPrice - openPrice;
                    const changePercent = ((change / openPrice) * 100).toFixed(2);
                    
                    return {
                        symbol,
                        productId,
                        price: currentPrice,
                        open: openPrice,
                        high: parseFloat(data.high),
                        low: parseFloat(data.low),
                        volume: parseFloat(data.volume),
                        change,
                        changePercent,
                        timestamp: Date.now()
                    };
                },
                60000 // 60 seconds cache
            );
        }

        // Fetch complete data for a cryptocurrency
        async fetchCryptoData(symbol) {
            try {
                const stats = await this.fetch24HrStats(symbol).catch(() => null);

                return {
                    symbol,
                    type: 'crypto',
                    quote: stats,
                    intraday: { points: [] }, // Simplified for now
                    range: stats ? { high24h: stats.high, low24h: stats.low } : null,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error(`Error fetching crypto data for ${symbol}:`, error);
                return null;
            }
        }

        // Clear expired cache entries
        clearExpiredCache() {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > 600000) { // 10 minutes
                    this.cache.delete(key);
                }
            }
        }
    }

    // Create global instance
    window.CoinbaseManager = new CoinbaseManager();
    
    // Clear expired cache every 10 minutes
    setInterval(() => {
        window.CoinbaseManager.clearExpiredCache();
    }, 600000);

    console.log('✅ Coinbase Manager loaded');

})();