// Main application initialization and coordination
class MainApp {
    constructor() {
        this.initialized = false;
        this.managers = {};
    }

    // Initialize all components when DOM is loaded
    init() {
        if (this.initialized) return;
        
        console.log('🚀 DOM loaded, initializing components...');
        
        try {
            // Initialize all managers in proper order
            this.initializeManagers();
            
            // Set up global event listeners
            this.setupGlobalEvents();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ All components initialized successfully');
            
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }

    initializeManagers() {
        // Initialize text slider first
        if (window.TextSliderManager) {
            console.log('📝 Initializing Text Slider...');
            this.managers.textSlider = window.TextSliderManager;
            this.managers.textSlider.initSwiper();
            console.log('✅ Text Slider initialized');
        }

        // Initialize news ticker
        if (window.NewsTickerManager) {
            console.log('📰 Initializing News Ticker...');
            this.managers.newsTicker = window.NewsTickerManager;
            this.managers.newsTicker.startTickerSeries();
            console.log('✅ News Ticker initialized');
        }

        // Initialize API managers
        if (window.AlphaVantageManager) {
            this.managers.alphaVantage = window.AlphaVantageManager;
            console.log('✅ Alpha Vantage manager initialized');
        }

        if (window.CoinbaseManager) {
            this.managers.coinbase = window.CoinbaseManager;
            console.log('✅ Coinbase manager initialized');
        }

        // Initialize Market Snapshot
        if (window.MarketSnapshotManager) {
            console.log('📊 Initializing Market Snapshot...');
            this.managers.marketSnapshot = window.MarketSnapshotManager;
            this.managers.marketSnapshot.init();
        }

        // Initialize FRED Cards
        if (window.FredCardsManager) {
            console.log('📈 Initializing FRED Cards...');
            this.managers.fredCards = window.FredCardsManager;
            this.managers.fredCards.init();
        }

        // Initialize News Feed
        if (window.NewsFeedManager) {
            console.log('📰 Initializing News Feed...');
            this.managers.newsFeed = window.NewsFeedManager;
            this.managers.newsFeed.init();
        }

        // Initialize orderbook
        if (window.OrderbookManager) {
            console.log('💹 Initializing Orderbook...');
            this.managers.orderbook = window.OrderbookManager;
            this.managers.orderbook.init();
        }

        // Initialize Globe with better error handling
        this.initializeGlobe();

        // Initialize FRED data
        if (window.FREDDataManager) {
            console.log('📊 Initializing FRED Data Manager...');
            this.managers.fredData = window.FREDDataManager;
            this.managers.fredData.init();
        }

        // Start text typing animation
        setTimeout(() => {
            if (this.managers.textSlider) {
                this.managers.textSlider.typeSlideText();
            }
        }, 1000);
    }

    initializeGlobe() {
        console.log('🌍 Initializing Globe...');
        console.log('- THREE.js available:', typeof THREE !== 'undefined');
        console.log('- GlobeManager available:', typeof window.GlobeManager !== 'undefined');
        
        const globeCanvas = document.getElementById('globeCanvas');
        console.log('- Globe canvas found:', !!globeCanvas);
        
        if (window.GlobeManager && typeof THREE !== 'undefined' && globeCanvas) {
            this.managers.globe = window.GlobeManager;
            
            // Add small delay to ensure canvas is ready
            setTimeout(() => {
                try {
                    this.managers.globe.init();
                    console.log('✅ Globe initialized successfully');
                } catch (error) {
                    console.error('❌ Globe initialization failed:', error);
                }
            }, 500);
        } else {
            console.warn('⚠️ Globe prerequisites not met - Globe will not be available');
        }
    }

    setupGlobalEvents() {
        // Handle window resize
        const debouncedResize = UTILS.debounce(() => {
            if (this.managers.globe) {
                this.managers.globe.onGlobeResize();
            }
            
            // Resize charts if needed
            if (this.managers.fredData && this.managers.fredData.state.charts) {
                Object.values(this.managers.fredData.state.charts).forEach(chart => {
                    if (chart && chart.resize) {
                        chart.resize();
                    }
                });
            }
        }, 250);
        
        window.addEventListener('resize', debouncedResize);

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause animations when not visible
                if (this.managers.globe && this.managers.globe.state.animationFrame) {
                    cancelAnimationFrame(this.managers.globe.state.animationFrame);
                }
            } else {
                // Resume animations when visible
                if (this.managers.globe && this.managers.globe.globeGroup) {
                    this.managers.globe.animateGlobe();
                }
            }
        });

        // Enhanced scroll handling for text slider
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (this.managers.textSlider) {
                this.managers.textSlider.handleScroll();
            }
            
            // Clear previous timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Set new timeout for scroll end detection
            scrollTimeout = setTimeout(() => {
                console.log('📜 Scroll ended');
            }, 150);
        });

        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });
    }

    // Cleanup method
    destroy() {
        console.log('🧹 Cleaning up application...');
        
        // Cleanup globe
        if (this.managers.globe) {
            this.managers.globe.destroy();
        }

        // Close WebSocket connections
        if (this.managers.orderbook && this.managers.orderbook.state.ws) {
            this.managers.orderbook.state.ws.close();
        }

        // Destroy charts
        if (this.managers.fredData && this.managers.fredData.state.charts) {
            Object.values(this.managers.fredData.state.charts).forEach(chart => {
                if (chart && chart.destroy) {
                    chart.destroy();
                }
            });
        }

        this.initialized = false;
    }

    // Public API methods
    getManager(name) {
        return this.managers[name];
    }

    updateGlobeState(state) {
        if (this.managers.globe) {
            this.managers.globe.updateGlobeState(state);
        }
    }
}

// Create global app instance
const app = new MainApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM Content Loaded - starting initialization');
        app.init();
    });
} else {
    console.log('📄 DOM already loaded - starting initialization immediately');
    app.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => app.destroy());

// Make app globally accessible
window.app = app;

console.log('🎯 Main.js loaded successfully');