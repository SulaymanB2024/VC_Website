// Market Tiles Manager - Coordinates live data for 6 market tiles with sparklines
(function() {
    'use strict';
    
    class MarketTilesManager {
        constructor() {
            this.tiles = new Map();
            this.sparklineCharts = new Map();
            this.updateInterval = null;
            this.isInitialized = false;
            
            // Market symbols configuration
            this.symbols = {
                equity: ['QQQ', 'SPY', 'DJT'],
                crypto: ['BTC', 'ETH', 'SOL']
            };
            
            // Fallback mapping for DJT to IYT
            this.fallbackMapping = {
                'DJT': 'IYT'
            };
        }

        // Initialize all market tiles
        async init() {
            if (this.isInitialized) return;
            
            console.log('📊 Initializing Market Tiles Manager...');
            
            // Setup tiles
            this.setupTiles();
            
            // Start data updates
            await this.updateAllTiles();
            
            // Setup periodic updates (every 30 seconds)
            this.startPeriodicUpdates();
            
            // Setup market status updates
            this.updateMarketBadges();
            
            this.isInitialized = true;
            console.log('✅ Market Tiles Manager initialized');
        }

        // Setup tile tracking
        setupTiles() {
            [...this.symbols.equity, ...this.symbols.crypto].forEach(symbol => {
                const tileElement = document.getElementById(`tile-${symbol}`);
                if (tileElement) {
                    this.tiles.set(symbol, {
                        element: tileElement,
                        symbol: symbol,
                        type: this.symbols.equity.includes(symbol) ? 'equity' : 'crypto',
                        lastUpdate: null,
                        isProxy: false
                    });
                }
            });
            
            console.log(`📊 Setup ${this.tiles.size} market tiles`);
        }

        // Update all tiles with latest data
        async updateAllTiles() {
            console.log('📈 Updating all market tiles...');
            
            const promises = [];
            
            // Update equity tiles
            for (const symbol of this.symbols.equity) {
                promises.push(this.updateEquityTile(symbol));
            }
            
            // Update crypto tiles
            for (const symbol of this.symbols.crypto) {
                promises.push(this.updateCryptoTile(symbol));
            }
            
            try {
                await Promise.allSettled(promises);
                console.log('✅ All market tiles updated');
            } catch (error) {
                console.error('Error updating market tiles:', error);
            }
        }

        // Update individual equity tile
        async updateEquityTile(symbol) {
            const tile = this.tiles.get(symbol);
            if (!tile || !window.AlphaVantageManager) return;

            try {
                let data = await window.AlphaVantageManager.getSymbolData(symbol);
                
                // Try fallback if primary symbol fails
                if (!data && this.fallbackMapping[symbol]) {
                    console.log(`⚠️ ${symbol} failed, trying fallback ${this.fallbackMapping[symbol]}`);
                    data = await window.AlphaVantageManager.getSymbolData(this.fallbackMapping[symbol]);
                    if (data) {
                        tile.isProxy = true;
                        this.showProxyLabel(symbol, this.fallbackMapping[symbol]);
                    }
                }
                
                if (data && data.quote) {
                    this.renderTile(tile, {
                        price: data.quote.price,
                        change: data.quote.change,
                        changePercent: data.quote.changePercent,
                        sparklineData: data.sparkline || [],
                        range: {
                            high: data.quote.high,
                            low: data.quote.low
                        },
                        marketStatus: data.marketStatus
                    });
                } else {
                    this.renderErrorTile(tile);
                }
                
            } catch (error) {
                console.error(`Error updating equity tile ${symbol}:`, error);
                this.renderErrorTile(tile);
            }
        }

        // Update individual crypto tile
        async updateCryptoTile(symbol) {
            const tile = this.tiles.get(symbol);
            if (!tile || !window.CoinbaseManager) return;

            try {
                const data = await window.CoinbaseManager.getCryptoData(symbol);
                
                if (data && data.quote) {
                    this.renderTile(tile, {
                        price: data.quote.price,
                        change: data.quote.change,
                        changePercent: data.quote.changePercent,
                        sparklineData: data.sparkline || [],
                        range: {
                            high: data.range.high24h,
                            low: data.range.low24h
                        },
                        marketStatus: '24H'
                    });
                } else {
                    this.renderErrorTile(tile);
                }
                
            } catch (error) {
                console.error(`Error updating crypto tile ${symbol}:`, error);
                this.renderErrorTile(tile);
            }
        }

        // Render tile with data
        renderTile(tile, data) {
            const { element, symbol, type } = tile;
            
            // Update price
            const priceElement = element.querySelector(`#price-${symbol}`);
            if (priceElement) {
                priceElement.textContent = this.formatPrice(data.price, type);
            }

            // Update change with color coding
            const changeElement = element.querySelector(`#change-${symbol}`);
            if (changeElement) {
                const changeText = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
                changeElement.textContent = changeText;
                changeElement.className = `tile-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`;
            }

            // Update market badge
            const badgeElement = element.querySelector(`#badge-${symbol}`);
            if (badgeElement) {
                badgeElement.textContent = data.marketStatus === 'OPEN' ? 'US OPEN' : 
                                         data.marketStatus === '24H' ? '24H' : 'US CLOSED';
                
                if (data.marketStatus === 'OPEN') {
                    badgeElement.className = 'tile-badge';
                } else if (data.marketStatus === '24H') {
                    badgeElement.className = 'tile-badge crypto-badge';
                } else {
                    badgeElement.className = 'tile-badge';
                    badgeElement.style.background = 'rgba(239, 68, 68, 0.2)';
                    badgeElement.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                    badgeElement.style.color = '#ef4444';
                }
            }

            // Update sparkline
            this.renderSparkline(symbol, data.sparklineData);

            // Update range indicator
            this.renderRange(element, symbol, data.price, data.range);

            // Update last update time
            tile.lastUpdate = Date.now();
        }

        // Render sparkline chart
        renderSparkline(symbol, sparklineData) {
            const canvas = document.getElementById(`spark-${symbol}`);
            if (!canvas || !sparklineData || sparklineData.length === 0) return;

            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            if (sparklineData.length < 2) return;

            // Calculate price range
            const prices = sparklineData.map(d => d.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceRange = maxPrice - minPrice || 1;

            // Determine line color
            const firstPrice = prices[0];
            const lastPrice = prices[prices.length - 1];
            const isPositive = lastPrice >= firstPrice;
            const lineColor = isPositive ? '#22c55e' : '#ef4444';

            // Draw line
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            
            sparklineData.forEach((point, index) => {
                const x = (index / (sparklineData.length - 1)) * width;
                const y = height - ((point.price - minPrice) / priceRange) * height;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Add subtle fill
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = lineColor;
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Render range indicator
        renderRange(element, symbol, currentPrice, range) {
            const indicator = element.querySelector(`#range-${symbol}`);
            const lowLabel = element.querySelector(`#range-low-${symbol}`);
            const highLabel = element.querySelector(`#range-high-${symbol}`);

            if (!indicator || !lowLabel || !highLabel || !range) return;

            const { low, high } = range;
            if (!low || !high || low === high) return;

            // Calculate position (0-100%)
            const rangeSpan = high - low;
            const position = ((currentPrice - low) / rangeSpan) * 100;
            const clampedPosition = Math.max(0, Math.min(100, position));
            
            indicator.style.left = `${clampedPosition}%`;
            lowLabel.textContent = this.formatPrice(low);
            highLabel.textContent = this.formatPrice(high);
        }

        // Show proxy label for fallback symbols
        showProxyLabel(originalSymbol, proxySymbol) {
            const proxyElement = document.getElementById(`proxy-${originalSymbol}`);
            if (proxyElement) {
                proxyElement.textContent = `(proxy: ${proxySymbol})`;
                proxyElement.style.display = 'block';
            }
        }

        // Render error state
        renderErrorTile(tile) {
            const { element, symbol } = tile;
            
            const priceElement = element.querySelector(`#price-${symbol}`);
            const changeElement = element.querySelector(`#change-${symbol}`);
            
            if (priceElement) priceElement.textContent = 'Loading...';
            if (changeElement) {
                changeElement.textContent = 'Connecting...';
                changeElement.className = 'tile-change';
            }
        }

        // Format price based on symbol type and value
        formatPrice(price, type = 'equity') {
            if (typeof price !== 'number' || isNaN(price)) return '--';

            // Crypto formatting
            if (type === 'crypto') {
                if (price >= 10000) return `$${Math.round(price).toLocaleString()}`;
                if (price >= 1000) return `$${price.toFixed(0)}`;
                if (price >= 100) return `$${price.toFixed(1)}`;
                if (price >= 1) return `$${price.toFixed(2)}`;
                return `$${price.toFixed(4)}`;
            }

            // Equity formatting
            return `$${price.toFixed(2)}`;
        }

        // Update market status badges
        updateMarketBadges() {
            const marketStatus = window.AlphaVantageManager?.getMarketStatus() || 'CLOSED';
            
            this.symbols.equity.forEach(symbol => {
                const badgeElement = document.getElementById(`badge-${symbol}`);
                if (badgeElement) {
                    badgeElement.textContent = marketStatus === 'OPEN' ? 'US OPEN' : 'US CLOSED';
                    
                    if (marketStatus === 'OPEN') {
                        badgeElement.className = 'tile-badge';
                    } else {
                        badgeElement.className = 'tile-badge';
                        badgeElement.style.background = 'rgba(239, 68, 68, 0.2)';
                        badgeElement.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                        badgeElement.style.color = '#ef4444';
                    }
                }
            });
            
            // Crypto badges always show 24H
            this.symbols.crypto.forEach(symbol => {
                const badgeElement = document.getElementById(`badge-${symbol}`);
                if (badgeElement) {
                    badgeElement.textContent = '24H';
                    badgeElement.className = 'tile-badge crypto-badge';
                }
            });
        }

        // Start periodic updates
        startPeriodicUpdates() {
            // Update every 30 seconds
            this.updateInterval = setInterval(async () => {
                try {
                    await this.updateAllTiles();
                    console.log('🔄 Periodic market update completed');
                } catch (error) {
                    console.error('Periodic update error:', error);
                }
            }, 30000);

            // Update market badges every minute
            setInterval(() => {
                this.updateMarketBadges();
            }, 60000);

            console.log('⏰ Started periodic updates (30s intervals)');
        }

        // Manual refresh for testing
        async refresh() {
            console.log('🔄 Manual refresh triggered...');
            await this.updateAllTiles();
        }

        // Get tile status
        getStatus() {
            const status = {};
            for (const [symbol, tile] of this.tiles) {
                status[symbol] = {
                    lastUpdate: tile.lastUpdate,
                    isProxy: tile.isProxy,
                    type: tile.type
                };
            }
            return status;
        }

        // Cleanup
        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            // Clear sparkline charts
            this.sparklineCharts.clear();
            this.tiles.clear();
            
            console.log('🧹 Market Tiles Manager destroyed');
        }
    }

    // Create global instance
    window.MarketTilesManager = new MarketTilesManager();
    
    console.log('✅ Market Tiles Manager loaded');

})();