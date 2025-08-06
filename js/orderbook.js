// Orderbook WebSocket functionality
class OrderbookManager {
    constructor() {
        this.state = STATE.orderbook;
        this.config = CONFIG.websocket;
    }

    // Initialize orderbook display
    initializeOrderbook() {
        if (!this.state.initialized) {
            const orderbookElement = document.getElementById('orderbook');
            orderbookElement.innerHTML = `
                <div class="orderbook-header">Live Market</div>
                <div class="price-row">
                    <span class="price-label">ASK</span>
                    <span class="price-value" id="askPrice">$---.--</span>
                </div>
                <div class="price-row">
                    <span class="price-label">BID</span>
                    <span class="price-value" id="bidPrice">$---.--</span>
                </div>
            `;
            this.state.initialized = true;
        }
    }

    // Update orderbook with new price data
    updateOrderbook(data) {
        const bid = parseFloat(data.best_bid);
        const ask = parseFloat(data.best_ask);
        
        if (bid && ask) {
            this.initializeOrderbook();
            
            const formattedBid = UTILS.formatPrice(bid);
            const formattedAsk = UTILS.formatPrice(ask);

            // Update only the price values without any flash animation
            const askElement = document.getElementById('askPrice');
            const bidElement = document.getElementById('bidPrice');
            
            if (askElement && bidElement) {
                askElement.textContent = `$${formattedAsk}`;
                bidElement.textContent = `$${formattedBid}`;
                // Removed all flash animation code
            }
        }
    }

    // WebSocket connection management
    connectWebSocket() {
        try {
            console.log('Connecting to Coinbase Pro WebSocket...');
            this.state.ws = new WebSocket(this.config.url);
            
            const connectionTimeout = setTimeout(() => {
                if (!this.state.connected) {
                    console.log('Connection timeout, using mock data');
                    if (this.state.ws) this.state.ws.close();
                    this.startMockOrderbook();
                }
            }, this.config.connectionTimeout);
            
            this.state.ws.onopen = () => {
                console.log('Connected to Coinbase Pro');
                this.state.connected = true;
                this.state.reconnectAttempts = 0;
                clearTimeout(connectionTimeout);
                
                const subscribeMessage = {
                    type: 'subscribe',
                    channels: [
                        {
                            name: 'ticker',
                            product_ids: ['BTC-USD']
                        }
                    ]
                };
                this.state.ws.send(JSON.stringify(subscribeMessage));
            };

            this.state.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'ticker' && data.product_id === 'BTC-USD') {
                        // Throttle updates to prevent excessive flashing
                        const now = Date.now();
                        if (now - this.state.lastUpdateTime > this.config.updateThrottle) {
                            this.updateOrderbook(data);
                            this.state.lastUpdateTime = now;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket data:', e);
                }
            };

            this.state.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.state.connected = false;
                clearTimeout(connectionTimeout);
                
                if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
                    this.state.reconnectAttempts++;
                    console.log(`Reconnection attempt ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
                    setTimeout(() => this.connectWebSocket(), 3000);
                } else {
                    console.log('Max reconnection attempts reached, using mock data');
                    this.startMockOrderbook();
                }
            };

            this.state.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.state.connected = false;
                clearTimeout(connectionTimeout);
            };
            
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            this.startMockOrderbook();
        }
    }

    // Enhanced mock orderbook with realistic data
    startMockOrderbook() {
        console.log('Starting enhanced mock orderbook...');
        let basePrice = 96750; // Current realistic BTC price
        let isRunning = false;
        
        if (isRunning) return;
        isRunning = true;

        this.initializeOrderbook();

        const updateMockOrderbook = () => {
            const spread = 30 + Math.random() * 40; // $30-70 spread
            const volatility = (Math.random() - 0.5) * 800;
            const bid = basePrice - spread/2 + volatility;
            const ask = basePrice + spread/2 + volatility;

            const formattedBid = UTILS.formatPrice(bid);
            const formattedAsk = UTILS.formatPrice(ask);

            // Update only the price values without flash animation
            const askElement = document.getElementById('askPrice');
            const bidElement = document.getElementById('bidPrice');
            
            if (askElement && bidElement) {
                askElement.textContent = `$${formattedAsk}`;
                bidElement.textContent = `$${formattedBid}`;
                // Removed all flash animation code
            }

            // Realistic price movement
            basePrice += (Math.random() - 0.5) * 1200;
            basePrice = Math.max(85000, Math.min(120000, basePrice));
        };

        updateMockOrderbook();
        setInterval(updateMockOrderbook, 2500 + Math.random() * 2000);
    }

    // Initialize orderbook system
    init() {
        // Try WebSocket first, fall back to mock data
        this.connectWebSocket();
        console.log('Orderbook manager initialized');
    }
}

// Create global instance
window.OrderbookManager = new OrderbookManager();