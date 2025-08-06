// Main application initialization and coordination
class MainApp {
    constructor() {
        this.initialized = false;
        this.managers = {};
    }

    // Initialize all components when DOM is loaded
    init() {
        if (this.initialized) return;
        
        console.log('DOM loaded, initializing components...');
        
        try {
            // Initialize all managers in proper order
            this.initializeManagers();
            
            // Set up global event listeners
            this.setupGlobalEvents();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('All components initialized successfully');
            
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    initializeManagers() {
        // Initialize text slider and news ticker
        if (window.TextSliderManager) {
            this.managers.textSlider = window.TextSliderManager;
            this.managers.textSlider.init();
        }

        // Initialize live news API system (enhances existing ticker)
        if (window.NewsAPIManager) {
            this.managers.newsAPI = window.NewsAPIManager;
            this.managers.newsAPI.init();
        }

        // Initialize orderbook (try WebSocket first, fall back to mock)
        if (window.OrderbookManager) {
            this.managers.orderbook = window.OrderbookManager;
            this.managers.orderbook.init();
        }

        // Enhanced 3D Globe initialization with better error handling
        console.log('🌍 Checking Globe prerequisites...');
        console.log('THREE.js available:', typeof THREE !== 'undefined');
        console.log('GlobeManager available:', typeof window.GlobeManager !== 'undefined');
        
        const globeCanvas = document.getElementById('globeCanvas');
        console.log('Globe canvas found:', !!globeCanvas);
        
        if (window.GlobeManager && typeof THREE !== 'undefined' && globeCanvas) {
            console.log('🌍 Initializing Globe...');
            this.managers.globe = window.GlobeManager;
            
            // Add small delay to ensure canvas is fully ready
            setTimeout(() => {
                try {
                    this.managers.globe.init();
                    console.log('✅ Globe initialized successfully');
                } catch (error) {
                    console.error('❌ Globe initialization failed:', error);
                    console.error('Error details:', error.stack);
                }
            }, 100);
        } else {
            console.error('❌ Globe prerequisites not met:');
            console.error('- THREE.js:', typeof THREE !== 'undefined');
            console.error('- GlobeManager:', typeof window.GlobeManager !== 'undefined');
            console.error('- Canvas element:', !!globeCanvas);
        }

        // Initialize FRED economic data
        if (window.FREDDataManager) {
            this.managers.fredData = window.FREDDataManager;
            this.managers.fredData.init();
        }
    }

    setupGlobalEvents() {
        // Handle window resize for all components
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

        // Performance optimization: pause animations when not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause globe animation
                if (this.managers.globe && this.managers.globe.state.animationFrame) {
                    cancelAnimationFrame(this.managers.globe.state.animationFrame);
                }
            } else {
                // Resume globe animation
                if (this.managers.globe && this.managers.globe.globeGroup) {
                    this.managers.globe.animateGlobe();
                }
            }
        });

        // Handle errors gracefully
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            // Could implement error reporting here
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Prevent the error from appearing in console
            event.preventDefault();
        });
    }

    // Cleanup method for page unload
    destroy() {
        console.log('Cleaning up application...');
        
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

    // Public API for external access
    getManager(name) {
        return this.managers[name];
    }

    // Update globe state (called from text slider)
    updateGlobeState(state) {
        if (this.managers.globe) {
            this.managers.globe.updateGlobeState(state);
        }
    }

    // Start news ticker (called from text slider)
    startNewsTicker() {
        if (window.NewsTickerManager) {
            window.NewsTickerManager.startTickerSeries();
        }
    }
}

// Create global app instance
const app = new MainApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    // DOM already loaded
    app.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => app.destroy());

// Make app globally accessible for debugging
window.app = app;

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
}

// Create a simple diagnostic function to check globe initialization
function diagnoseGlobe() {
    console.log('🔍 Globe Diagnostic Report:');
    console.log('========================');
    
    // Check basic prerequisites
    console.log('1. THREE.js loaded:', typeof THREE !== 'undefined');
    console.log('2. Canvas element exists:', !!document.getElementById('globeCanvas'));
    console.log('3. Container exists:', !!document.querySelector('.globe-container'));
    console.log('4. GlobeManager exists:', typeof window.GlobeManager !== 'undefined');
    
    // Check manager state
    if (window.GlobeManager) {
        console.log('5. Globe scene exists:', !!window.GlobeManager.scene);
        console.log('6. Globe renderer exists:', !!window.GlobeManager.renderer);
        console.log('7. Globe group exists:', !!window.GlobeManager.globeGroup);
        console.log('8. Animation running:', !!window.GlobeManager.state.animationFrame);
    }
    
    // Check canvas dimensions
    const canvas = document.getElementById('globeCanvas');
    if (canvas) {
        console.log('9. Canvas dimensions:', canvas.width + 'x' + canvas.height);
        console.log('10. Canvas style:', canvas.style.cssText || 'no inline styles');
    }
    
    // Check container dimensions
    const container = document.querySelector('.globe-container');
    if (container) {
        const rect = container.getBoundingClientRect();
        console.log('11. Container dimensions:', rect.width + 'x' + rect.height);
        console.log('12. Container opacity:', window.getComputedStyle(container).opacity);
    }
    
    console.log('========================');
}

// Add diagnostic to window for manual testing
window.diagnoseGlobe = diagnoseGlobe;

// Run diagnostic after a short delay to allow initialization
setTimeout(diagnoseGlobe, 1000);