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
            if (!orderbookElement) {
                console.warn('Orderbook element not found - this is normal if not on home page');
                return;
            }
            
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
            
            const bidElement = document.getElementById('bidPrice');
            const askElement = document.getElementById('askPrice');
            
            if (bidElement) bidElement.textContent = `$${formattedBid}`;
            if (askElement) askElement.textContent = `$${formattedAsk}`;
        }
    }

    // WebSocket connection management
    connectWebSocket() {
        try {
            console.log('🔌 Attempting WebSocket connection to Coinbase...');
            
            this.state.ws = new WebSocket(this.config.url);
            
            this.state.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.state.connected = true;
                this.state.reconnectAttempts = 0;
                
                // Subscribe to BTC-USD ticker
                const subscribeMsg = {
                    type: 'subscribe',
                    product_ids: ['BTC-USD'],
                    channels: ['ticker']
                };
                
                this.state.ws.send(JSON.stringify(subscribeMsg));
            };
            
            this.state.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'ticker') {
                        this.updateOrderbook(data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.state.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.state.connected = false;
                
                if (this.state.reconnectAttempts < this.config.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.state.reconnectAttempts++;
                        this.connectWebSocket();
                    }, 5000);
                } else {
                    console.log('Max reconnection attempts reached, falling back to mock data');
                    this.startMockOrderbook();
                }
            };
            
            this.state.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.startMockOrderbook();
            };
            
            // Connection timeout
            setTimeout(() => {
                if (!this.state.connected) {
                    console.log('WebSocket connection timeout, using mock data');
                    this.state.ws.close();
                    this.startMockOrderbook();
                }
            }, this.config.connectionTimeout);
            
        } catch (error) {
            console.error('WebSocket setup error:', error);
            this.startMockOrderbook();
        }
   }

    // DISABLED: Enhanced mock orderbook with realistic data
    startMockOrderbook() {
        console.log('🚫 Mock orderbook disabled - no synthetic data allowed');
        
        // Hide orderbook completely since no real data is available
        const orderbookElement = document.getElementById('orderbook');
        if (orderbookElement) {
            orderbookElement.style.display = 'none';
            console.log('💹 Orderbook hidden - no data available');
        }
        
        return; // Exit early - no mock data
    }

    // Initialize orderbook system - DISABLED for synthetic data
    init() {
        console.log('💹 Initializing orderbook system...');
        
        // Try WebSocket first, but no fallback to mock data
        this.connectWebSocket();
        
        // If WebSocket fails, hide the orderbook instead of showing mock data
        setTimeout(() => {
            if (!this.state.connected) {
                console.log('🚫 WebSocket failed and no synthetic data allowed - hiding orderbook');
                const orderbookElement = document.getElementById('orderbook');
                if (orderbookElement) {
                    orderbookElement.style.display = 'none';
                }
            }
        }, this.config.connectionTimeout + 1000);
        
        console.log('✅ Orderbook manager initialized (real data only)');
    }
}

// Create global instance
window.OrderbookManager = new OrderbookManager();

console.log('✅ Orderbook Manager loaded successfully');