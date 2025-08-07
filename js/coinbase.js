// Enhanced Coinbase API Manager with caching and candle data
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
            // No rate limiting needed for Coinbase public API
        }

        // Fetch current ticker (30s cache)
        async fetchTicker(symbol) {
            const productId = COINBASE_API.products[symbol];
            if (!productId) throw new Error(`Unknown symbol: ${symbol}`);
            
            const cacheKey = `cb_ticker_${symbol}`;
            const cached = window.CacheManager.getCached(cacheKey, 30000); // 30s cache
            
            if (cached) {
                console.log(`₿ Using cached ticker for ${symbol}`);
                return cached;
            }

            try {
                const response = await fetch(`${COINBASE_API.baseUrl}/products/${productId}/ticker`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                const result = {
                    symbol,
                    productId,
                    price: parseFloat(data.price),
                    bid: parseFloat(data.bid),
                    ask: parseFloat(data.ask),
                    volume: parseFloat(data.volume),
                    timestamp: Date.now()
                };
                
                window.CacheManager.setCached(cacheKey, result);
                return result;
                
            } catch (error) {
                console.error(`Error fetching ticker for ${symbol}:`, error);
                throw error;
            }
        }

        // Fetch 24hr stats for change calculation (30s cache)
        async fetch24HrStats(symbol) {
            const productId = COINBASE_API.products[symbol];
            if (!productId) throw new Error(`Unknown symbol: ${symbol}`);
            
            const cacheKey = `cb_stats_${symbol}`;
            const cached = window.CacheManager.getCached(cacheKey, 30000); // 30s cache
            
            if (cached) {
                console.log(`📊 Using cached 24hr stats for ${symbol}`);
                return cached;
            }

            try {
                const response = await fetch(`${COINBASE_API.baseUrl}/products/${productId}/stats`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                const currentPrice = parseFloat(data.last);
                const openPrice = parseFloat(data.open);
                const change = currentPrice - openPrice;
                const changePercent = ((change / openPrice) * 100);
                
                const result = {
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
                
                window.CacheManager.setCached(cacheKey, result);
                return result;
                
            } catch (error) {
                console.error(`Error fetching 24hr stats for ${symbol}:`, error);
                throw error;
            }
        }

        // Fetch candles for sparkline (10 min cache, 15min granularity)
        async fetchCandles(symbol, granularity = 900) { // 900 = 15 minutes
            const productId = COINBASE_API.products[symbol];
            if (!productId) throw new Error(`Unknown symbol: ${symbol}`);
            
            const cacheKey = `cb_candles_${symbol}_${granularity}`;
            const cached = window.CacheManager.getCached(cacheKey, 600000); // 10 min cache
            
            if (cached) {
                console.log(`🕯️ Using cached candles for ${symbol}`);
                return cached;
            }

            try {
                // Get last 24 hours of data
                const end = new Date();
                const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
                
                const params = new URLSearchParams({
                    start: start.toISOString(),
                    end: end.toISOString(),
                    granularity: granularity.toString()
                });
                
                const response = await fetch(`${COINBASE_API.baseUrl}/products/${productId}/candles?${params}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                // Convert to sparkline format (time, low, high, open, close, volume)
                const points = data
                    .sort((a, b) => a[0] - b[0]) // Sort by timestamp
                    .slice(-20) // Last 20 points
                    .map(candle => ({
                        time: new Date(candle[0] * 1000),
                        price: candle[4], // close price
                        volume: candle[5]
                    }));
                
                const result = {
                    symbol,
                    granularity,
                    points,
                    timestamp: Date.now()
                };
                
                window.CacheManager.setCached(cacheKey, result);
                return result;
                
            } catch (error) {
                console.error(`Error fetching candles for ${symbol}:`, error);
                return { symbol, granularity, points: [], timestamp: Date.now() };
            }
        }

        // Get complete crypto data for tiles
        async getCryptoData(symbol) {
            try {
                const [stats, candles] = await Promise.all([
                    this.fetch24HrStats(symbol),
                    this.fetchCandles(symbol)
                ]);

                return {
                    symbol,
                    quote: stats,
                    sparkline: candles.points,
                    range: {
                        high24h: stats.high,
                        low24h: stats.low
                    },
                    marketStatus: '24H', // Crypto markets are always open
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error(`Error getting crypto data for ${symbol}:`, error);
                return null;
            }
        }
    }

    // Create global instance
    window.CoinbaseManager = new CoinbaseManager();
    
    console.log('✅ Enhanced Coinbase Manager loaded with caching');

})();