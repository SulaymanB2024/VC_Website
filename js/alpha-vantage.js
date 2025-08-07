// Alpha Vantage API Manager with rate limiting and caching
(function() {
    'use strict';
    
    const ALPHA_VANTAGE_API = {
        baseUrl: 'https://www.alphavantage.co/query',
        key: window.CONFIG?.ALPHA_VANTAGE_KEY || 'BM8MKOLJ72HQC28M',
        rateLimit: {
            maxRequests: 5,
            interval: 60000, // 1 minute
            queue: [],
            processing: false,
            lastRequest: 0
        }
    };

    class AlphaVantageManager {
        constructor() {
            this.cache = new Map();
            this.requestQueue = [];
            this.processing = false;
        }

        // Rate-limited request queue
        async queueRequest(url) {
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ url, resolve, reject });
                this.processQueue();
            });
        }

        async processQueue() {
            if (this.processing || this.requestQueue.length === 0) return;
            
            this.processing = true;
            
            while (this.requestQueue.length > 0) {
                const now = Date.now();
                const timeSinceLastRequest = now - ALPHA_VANTAGE_API.rateLimit.lastRequest;
                
                if (timeSinceLastRequest < 12000) { // 12 seconds between requests
                    await this.delay(12000 - timeSinceLastRequest);
                }
                
                const request = this.requestQueue.shift();
                ALPHA_VANTAGE_API.rateLimit.lastRequest = Date.now();
                
                try {
                    const response = await fetch(request.url);
                    const data = await response.json();
                    
                    if (data['Error Message'] || data['Note']) {
                        throw new Error(data['Error Message'] || data['Note']);
                    }
                    
                    request.resolve(data);
                } catch (error) {
                    console.error('Alpha Vantage API error:', error);
                    request.reject(error);
                }
            }
            
            this.processing = false;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                // Return cached data if available, even if expired
                if (cached) {
                    console.warn('Using expired cache due to API error:', error);
                    return cached.data;
                }
                throw error;
            }
        }

        // Fetch global quote (current price)
        async fetchGlobalQuote(symbol) {
            const cacheKey = `quote_${symbol}`;
            
            return this.getCachedOrFetch(
                cacheKey,
                async () => {
                    const url = `${ALPHA_VANTAGE_API.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API.key}`;
                    const data = await this.queueRequest(url);
                    
                    const quote = data['Global Quote'];
                    if (!quote) throw new Error('No quote data available');
                    
                    return {
                        symbol: quote['01. symbol'],
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['09. change']),
                        changePercent: quote['10. change percent'].replace('%', ''),
                        volume: parseInt(quote['06. volume']),
                        previousClose: parseFloat(quote['08. previous close']),
                        timestamp: Date.now()
                    };
                },
                60000 // 60 seconds cache
            );
        }

        // Fetch complete data for a symbol
        async fetchSymbolData(symbol) {
            try {
                const quote = await this.fetchGlobalQuote(symbol).catch(() => null);

                return {
                    symbol,
                    quote,
                    intraday: { points: [] }, // Simplified for now
                    range: quote ? { high52w: quote.price * 1.2, low52w: quote.price * 0.8 } : null,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error);
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
    window.AlphaVantageManager = new AlphaVantageManager();
    
    // Clear expired cache every 10 minutes
    setInterval(() => {
        window.AlphaVantageManager.clearExpiredCache();
    }, 600000);

    console.log('✅ Alpha Vantage Manager loaded');

})();