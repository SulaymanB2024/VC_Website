// Market Snapshot Manager - Main coordinator for market data display
(function() {
    'use strict';
    
    class MarketSnapshotManager {
        constructor() {
            this.container = null;
            this.tiles = new Map();
            this.updateInterval = null;
            this.isVisible = false;
        }

        // Initialize the market snapshot
        async init() {
            console.log('📊 Initializing Market Snapshot...');
            
            this.container = document.getElementById('marketSnapshot');
            if (!this.container) {
                console.warn('Market snapshot container not found - this is normal if not on home page');
                return;
            }

            // Initialize tiles
            this.initializeTiles();
            
            // Start data updates
            this.startDataUpdates();
            
            console.log('✅ Market Snapshot initialized');
        }

        // Set up tile tracking
        initializeTiles() {
            const equities = [
                { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
                { symbol: 'SPY', name: 'S&P 500 ETF' },
                { symbol: 'DJT', name: 'Dow Transportation', fallback: 'IYT' }
            ];

            const crypto = [
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'ETH', name: 'Ethereum' },
                { symbol: 'SOL', name: 'Solana' }
            ];

            // Equity tiles
            equities.forEach(equity => {
                const tile = document.getElementById(`tile-${equity.symbol}`);
                if (tile) {
                    this.tiles.set(equity.symbol, {
                        element: tile,
                        type: 'equity',
                        symbol: equity.symbol,
                        name: equity.name,
                        fallback: equity.fallback
                    });
                }
            });

            // Crypto tiles
            crypto.forEach(cryptoItem => {
                const tile = document.getElementById(`tile-${cryptoItem.symbol}`);
                if (tile) {
                    this.tiles.set(cryptoItem.symbol, {
                        element: tile,
                        type: 'crypto',
                        symbol: cryptoItem.symbol,
                        name: cryptoItem.name
                    });
                }
            });
        }

        // Start periodic data updates
        startDataUpdates() {
            // Initial load
            this.updateAllData();
            
            // Update every 60 seconds
            this.updateInterval = setInterval(() => {
                if (this.isVisible) {
                    this.updateAllData();
                }
            }, 60000);
        }

        // Update all market data
        async updateAllData() {
            console.log('📈 Updating market data...');
            
            // Update equities
            const equityPromises = ['QQQ', 'SPY', 'DJT'].map(symbol => 
                this.updateEquityTile(symbol)
            );
            
            // Update crypto
            const cryptoPromises = ['BTC', 'ETH', 'SOL'].map(symbol => 
                this.updateCryptoTile(symbol)
            );
            
            await Promise.allSettled([...equityPromises, ...cryptoPromises]);
        }

        // Update equity tile with Alpha Vantage data
        async updateEquityTile(symbol) {
            const tile = this.tiles.get(symbol);
            if (!tile || !window.AlphaVantageManager) return;

            try {
                const data = await window.AlphaVantageManager.fetchSymbolData(symbol);
                
                if (data && data.quote) {
                    this.renderTile(tile, {
                        price: data.quote.price,
                        change: data.quote.change,
                        changePercent: parseFloat(data.quote.changePercent),
                        sparklineData: [],
                        range: data.range || null
                    });
                } else {
                    this.renderErrorTile(tile);
                }
            } catch (error) {
                console.error(`Error updating ${symbol}:`, error);
                this.renderErrorTile(tile);
            }
        }

        // Update crypto tile with Coinbase data
        async updateCryptoTile(symbol) {
            const tile = this.tiles.get(symbol);
            if (!tile || !window.CoinbaseManager) return;

            try {
                const data = await window.CoinbaseManager.fetchCryptoData(symbol);
                
                if (data && data.quote) {
                    this.renderTile(tile, {
                        price: data.quote.price,
                        change: data.quote.change,
                        changePercent: parseFloat(data.quote.changePercent),
                        sparklineData: [],
                        range: data.range || null
                    });
                } else {
                    this.renderErrorTile(tile);
                }
            } catch (error) {
                console.error(`Error updating crypto ${symbol}:`, error);
                this.renderErrorTile(tile);
            }
        }

        // Render tile with data
        renderTile(tile, data) {
            const { element, symbol } = tile;
            
            // Update price
            const priceElement = element.querySelector('.tile-price');
            if (priceElement) {
                const formattedPrice = this.formatPrice(data.price, symbol);
                priceElement.textContent = formattedPrice;
            }

            // Update change
            const changeElement = element.querySelector('.tile-change');
            if (changeElement && data.change !== undefined) {
                const changeText = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)`;
                changeElement.textContent = changeText;
                changeElement.className = `tile-change ${data.change >= 0 ? 'positive' : 'negative'}`;
            }

            // Update range indicator
            if (data.range) {
                this.renderRange(element, data.price, data.range);
            }
        }

        // Render error state
        renderErrorTile(tile) {
            const { element } = tile;
            
            const priceElement = element.querySelector('.tile-price');
            const changeElement = element.querySelector('.tile-change');
            
            if (priceElement) priceElement.textContent = 'Loading...';
            if (changeElement) {
                changeElement.textContent = 'Connecting...';
                changeElement.className = 'tile-change';
            }
        }

        // Render range indicator
        renderRange(element, currentPrice, range) {
            const rangeIndicator = element.querySelector('.range-indicator');
            const rangeLow = element.querySelector('.range-low');
            const rangeHigh = element.querySelector('.range-high');

            if (!rangeIndicator || !rangeLow || !rangeHigh) return;

            let low, high;
            if (range.low52w !== undefined) {
                // Equity range (52-week)
                low = range.low52w;
                high = range.high52w;
            } else if (range.low24h !== undefined) {
                // Crypto range (24-hour)
                low = range.low24h;
                high = range.high24h;
            } else {
                return;
            }

            // Calculate position
            const rangeSpan = high - low || 1;
            const position = ((currentPrice - low) / rangeSpan) * 100;
            
            rangeIndicator.style.left = `${Math.max(0, Math.min(100, position))}%`;
            rangeLow.textContent = this.formatPrice(low);
            rangeHigh.textContent = this.formatPrice(high);
        }

        // Format price based on symbol type
        formatPrice(price, symbol = '') {
            if (typeof price !== 'number' || isNaN(price)) return '--';

            // Crypto typically shows more decimals for lower values
            if (['BTC', 'ETH', 'SOL'].includes(symbol)) {
                if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                if (price >= 100) return price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
            }

            // Equities
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Show/hide market snapshot
        show() {
            if (this.container) {
                this.container.classList.add('visible');
                this.isVisible = true;
                this.updateAllData(); // Refresh data when shown
            }
        }

        hide() {
            if (this.container) {
                this.container.classList.remove('visible');
                this.isVisible = false;
            }
        }

        // Cleanup
        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        }
    }

    // Create global instance
    window.MarketSnapshotManager = new MarketSnapshotManager();

    console.log('✅ Market Snapshot Manager loaded');

})();