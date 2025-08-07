// Alpha Vantage API Manager with enhanced caching and rate limiting
(function() {
    'use strict';
    
    const ALPHA_VANTAGE_API = {
        baseUrl: 'https://www.alphavantage.co/query',
        key: window.CONFIG?.ALPHA_VANTAGE_KEY || 'BM8MKOLJ72HQC28M',
        rateLimit: {
            maxRequests: 5,
            interval: 60000, // 1 minute
            requests: [],
            processing: false
        }
    };

    class AlphaVantageManager {
        constructor() {
            this.requestQueue = [];
            this.processing = false;
        }

        // Rate-limited request with queue system (≤5 req/min)
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
                // Check rate limit
                const now = Date.now();
                ALPHA_VANTAGE_API.rateLimit.requests = ALPHA_VANTAGE_API.rateLimit.requests.filter(
                    time => now - time < ALPHA_VANTAGE_API.rateLimit.interval
                );
                
                if (ALPHA_VANTAGE_API.rateLimit.requests.length >= ALPHA_VANTAGE_API.rateLimit.maxRequests) {
                    const oldestRequest = Math.min(...ALPHA_VANTAGE_API.rateLimit.requests);
                    const waitTime = ALPHA_VANTAGE_API.rateLimit.interval - (now - oldestRequest);
                    console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime/1000)}s`);
                    await this.delay(waitTime);
                    continue;
                }
                
                const request = this.requestQueue.shift();
                ALPHA_VANTAGE_API.rateLimit.requests.push(now);
                
                try {
                    console.log('📡 Alpha Vantage API request:', request.url.split('?')[1]);
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
                
                // Small delay between requests
                await this.delay(1000);
            }
            
            this.processing = false;
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Fetch current quote with caching (60s TTL)
        async fetchGlobalQuote(symbol) {
            const cacheKey = `av_quote_${symbol}`;
            const cached = window.CacheManager.getCached(cacheKey, 60000); // 60s cache
            
            if (cached) {
                console.log(`📊 Using cached quote for ${symbol}`);
                return cached;
            }

            try {
                const url = `${ALPHA_VANTAGE_API.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API.key}`;
                const data = await this.queueRequest(url);
                
                const quote = data['Global Quote'];
                if (!quote) throw new Error('No quote data available');
                
                const result = {
                    symbol: quote['01. symbol'],
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    volume: parseInt(quote['06. volume']),
                    previousClose: parseFloat(quote['08. previous close']),
                    high: parseFloat(quote['03. high']),
                    low: parseFloat(quote['04. low']),
                    timestamp: Date.now()
                };
                
                window.CacheManager.setCached(cacheKey, result);
                return result;
                
            } catch (error) {
                console.error(`Error fetching quote for ${symbol}:`, error);
                throw error;
            }
        }

        // Fetch intraday data for sparklines (10 min cache)
        async fetchIntradayData(symbol, interval = '5min') {
            const cacheKey = `av_intraday_${symbol}_${interval}`;
            const cached = window.CacheManager.getCached(cacheKey, 600000); // 10 min cache
            
            if (cached) {
                console.log(`📈 Using cached intraday for ${symbol}`);
                return cached;
            }

            try {
                const url = `${ALPHA_VANTAGE_API.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API.key}`;
                const data = await this.queueRequest(url);
                
                const timeSeries = data[`Time Series (${interval})`];
                if (!timeSeries) throw new Error('No intraday data available');
                
                // Convert to sparkline format (last 20 points)
                const points = Object.entries(timeSeries)
                    .slice(0, 20)
                    .reverse()
                    .map(([time, values]) => ({
                        time,
                        price: parseFloat(values['4. close']),
                        volume: parseInt(values['5. volume'])
                    }));
                
                const result = {
                    symbol,
                    interval,
                    points,
                    timestamp: Date.now()
                };
                
                window.CacheManager.setCached(cacheKey, result);
                return result;
                
            } catch (error) {
                console.error(`Error fetching intraday for ${symbol}:`, error);
                return { symbol, interval, points: [], timestamp: Date.now() };
            }
        }

        // Get complete symbol data for tiles
        async getSymbolData(symbol) {
            try {
                const [quote, intraday] = await Promise.all([
                    this.fetchGlobalQuote(symbol),
                    this.fetchIntradayData(symbol)
                ]);

                return {
                    symbol,
                    quote,
                    sparkline: intraday.points,
                    range: {
                        high: quote.high,
                        low: quote.low
                    },
                    marketStatus: this.getMarketStatus(),
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error(`Error getting data for ${symbol}:`, error);
                return null;
            }
        }

        // Check if US market is open
        getMarketStatus() {
            const now = new Date();
            const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
            const day = easternTime.getDay();
            const hour = easternTime.getHours();
            const minute = easternTime.getMinutes();
            const timeInMinutes = hour * 60 + minute;
            
            // Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
            const isWeekday = day >= 1 && day <= 5;
            const isMarketHours = timeInMinutes >= 570 && timeInMinutes < 960; // 9:30 AM to 4:00 PM
            
            return isWeekday && isMarketHours ? 'OPEN' : 'CLOSED';
        }
    }

    // Create global instance
    window.AlphaVantageManager = new AlphaVantageManager();
    
    console.log('✅ Enhanced Alpha Vantage Manager loaded with rate limiting');

})();