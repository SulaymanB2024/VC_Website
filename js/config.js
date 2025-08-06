// Configuration and constants for the home page
const CONFIG = {
    // Text slides for the main slider - SHORTENED for better screen fit
    textSlides: [
        "THE FUTURE IS NOW",
        "INNOVATION DRIVES US", // Shortened from "INNOVATION DRIVES CHANGE"
        "CAPITAL MEETS TECH"    // Shortened from "CAPITAL MEETS TECHNOLOGY"
    ],
    
    // Globe configuration with enhanced financial tracking features
    globe: {
        radius: 450,
        states: {
            global: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0.1, y: 0, z: 0 },
                cameraZ: 1600, // Much further back - original starting size
                opacity: 0.45 // Increased for better visibility
            },
            america: {
                position: { x: 60, y: 30, z: 0 },
                rotation: { x: 0.15, y: -0.5, z: 0 },
                cameraZ: 1100, // Medium zoom
                opacity: 0.55
            },
            texas: {
                position: { x: 90, y: 45, z: 0 },
                rotation: { x: 0.25, y: -0.7, z: 0 },
                cameraZ: 800, // Close zoom for Texas focus
                opacity: 0.65
            }
        },
        // Enhanced financial centers with market data and importance rankings
        financialCenters: [
            { name: 'New York', lat: 40.7128, lon: -74.0060, importance: 1.0, marketCap: 28.5, type: 'primary' },
            { name: 'London', lat: 51.5074, lon: -0.1278, importance: 0.9, marketCap: 12.8, type: 'primary' },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, importance: 0.85, marketCap: 8.2, type: 'primary' },
            { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, importance: 0.8, marketCap: 6.1, type: 'primary' },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, importance: 0.75, marketCap: 4.8, type: 'secondary' },
            { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, importance: 0.7, marketCap: 3.9, type: 'secondary' },
            { name: 'Shanghai', lat: 31.2304, lon: 121.4737, importance: 0.72, marketCap: 5.2, type: 'secondary' },
            { name: 'Austin', lat: 30.2672, lon: -97.7431, importance: 0.65, marketCap: 2.1, type: 'emerging' },
            { name: 'Zurich', lat: 47.3769, lon: 8.5417, importance: 0.6, marketCap: 2.8, type: 'secondary' },
            { name: 'Toronto', lat: 43.6532, lon: -79.3832, importance: 0.58, marketCap: 1.9, type: 'emerging' },
            { name: 'Sydney', lat: -33.8688, lon: 151.2093, importance: 0.55, marketCap: 1.6, type: 'emerging' },
            { name: 'Dubai', lat: 25.2048, lon: 55.2708, importance: 0.52, marketCap: 1.4, type: 'emerging' }
        ],
        // Major trade routes for financial data flows
        tradeRoutes: [
            // Primary Atlantic routes
            { from: 'New York', to: 'London', strength: 1.0, type: 'primary' },
            { from: 'London', to: 'Frankfurt', strength: 0.9, type: 'primary' },
            { from: 'New York', to: 'Toronto', strength: 0.8, type: 'secondary' },
            
            // Trans-Pacific routes
            { from: 'New York', to: 'Tokyo', strength: 0.95, type: 'primary' },
            { from: 'Tokyo', to: 'Hong Kong', strength: 0.85, type: 'primary' },
            { from: 'Hong Kong', to: 'Singapore', strength: 0.8, type: 'primary' },
            { from: 'Singapore', to: 'Sydney', strength: 0.6, type: 'secondary' },
            
            // European network
            { from: 'London', to: 'Zurich', strength: 0.75, type: 'secondary' },
            { from: 'Frankfurt', to: 'Zurich', strength: 0.7, type: 'secondary' },
            
            // Emerging markets
            { from: 'London', to: 'Dubai', strength: 0.65, type: 'emerging' },
            { from: 'Hong Kong', to: 'Shanghai', strength: 0.9, type: 'primary' },
            { from: 'New York', to: 'Austin', strength: 0.7, type: 'emerging' },
            
            // Cross-regional flows
            { from: 'London', to: 'Hong Kong', strength: 0.8, type: 'primary' },
            { from: 'Tokyo', to: 'London', strength: 0.75, type: 'primary' },
            { from: 'Singapore', to: 'London', strength: 0.7, type: 'secondary' }
        ],
        // Data flow indicators (like submarine cables, satellite links)
        dataFlows: [
            { name: 'TAT-14', points: [[40.7128, -74.0060], [51.5074, -0.1278]], type: 'cable', capacity: 40 },
            { name: 'TPC-5', points: [[35.6762, 139.6503], [40.7128, -74.0060]], type: 'cable', capacity: 35 },
            { name: 'SEA-ME-WE 5', points: [[1.3521, 103.8198], [25.2048, 55.2708], [51.5074, -0.1278]], type: 'cable', capacity: 24 },
            { name: 'FASTER', points: [[35.6762, 139.6503], [40.7128, -74.0060]], type: 'cable', capacity: 60 }
        ]
    },
    
    // News items for ticker
    newsItems: [
        "Federal Reserve maintains interest rates at 5.25-5.50%",
        "Q3 GDP growth exceeds expectations at 2.8% annualized",
        "Tech sector leads market gains as AI adoption accelerates",
        "Austin emerges as major fintech hub with $2.1B in funding",
        "Cryptocurrency markets stabilize following regulatory clarity",
        "Green energy investments reach record $1.8 trillion globally"
    ],
    
    // FRED API configuration
    fred: {
        apiKey: 'your_fred_api_key_here', // Replace with actual API key from https://fred.stlouisfed.org/docs/api/api_key.html
        series: {
            gdp: 'A191RP1Q027SBEA',
            inflation: 'CPIAUCSL',
            yieldSpread: 'T10Y2Y'
        },
        baseUrl: 'https://api.stlouisfed.org/fred/series/observations'
    },
    
    // WebSocket configuration
    websocket: {
        url: 'wss://ws-feed.exchange.coinbase.com',
        maxReconnectAttempts: 3,
        connectionTimeout: 6000,
        updateThrottle: 1000
    },
    
    // Animation timings - Enhanced for smoother, more deliberate experience
    timing: {
        slideTransition: 2000, // Slower slide transitions for smoothness
        typingSpeed: {
            min: 80,    // Slightly slower minimum for better readability
            max: 120,   // Reduced maximum for more consistent, smooth speed
            spaceDelay: 400,  // Longer pause at spaces for natural rhythm
            backspaceMin: 25, // Fast but smooth backspacing
            backspaceMax: 60, // Variable backspace speed
            backspacePause: 200 // Pause before starting backspace
        },
        scrollSensitivity: {
            slowFactor: 0.4,    // Significantly reduce scroll responsiveness for smoother transitions
            transitionBuffer: 0.04 // Much larger buffer zones between states to prevent jittery transitions
        },
        ctaDelay: 3000, // Longer delay for CTA appearance
        newsUpdateInterval: 5000, // Slower news updates for better readability
        fredTransition: {
            textBackspace: 2500,  // More time to backspace text smoothly
            fadeDelay: 1500,      // Longer delay before fade starts
            revealDelay: 2000     // Longer delay before FRED reveals for smoother transition
        }
    },
    
    // News API configuration
    news: {
        gemini: {
            apiKey: 'YOUR_GEMINI_API_KEY_HERE', // Replace with your actual Gemini API key
            model: 'gemini-2.0-flash-exp', // Using flash for better performance
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
        },
        
        // News refresh settings
        newsRefresh: {
            interval: 30 * 60 * 1000, // 30 minutes
            fallbackInterval: 5 * 60 * 1000, // 5 minutes fallback
            cacheKey: 'live_news_feed',
            maxRetries: 3
        },
        
        // Layout constraints for news display
        newsLayout: {
            maxItems: 10,
            desktop: {
                maxChars: 62,
                fontSize: '24px',
                lineHeight: '28px'
            },
            mobile: {
                maxChars: 48,
                fontSize: '20px', 
                lineHeight: '24px'
            }
        },
        
        // Source diversity rules
        sourceDiversity: {
            maxPerPublisher: 2,
            preferredSources: [
                'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com',
                'cnbc.com', 'marketwatch.com', 'yahoo.com', 'austinbusinessjournal.com'
            ]
        }
    }
};

// Global state management
const STATE = {
    // Text slider state
    slider: {
        currentSlideIndex: 0,
        charIndex: 0,
        isTyping: true,
        hasStartedTyping: false,
        slidesCompleted: false,
        swiper: null
    },
    
    // Globe state
    globe: {
        currentState: 0, // 0: global, 1: america, 2: texas
        isTransitioning: false,
        mouseInteraction: false,
        userModifiedPosition: false,
        userModifiedRotation: false,
        targetPosition: { x: 0, y: 0, z: 0 },
        targetRotation: { x: 0, y: 0, z: 0 },
        currentPosition: { x: 0, y: 0, z: 0 },
        currentRotation: { x: 0, y: 0, z: 0 },
        animationFrame: null,
        mouse: { x: 0, y: 0 }
    },
    
    // Orderbook state
    orderbook: {
        ws: null,
        connected: false,
        reconnectAttempts: 0,
        lastUpdateTime: 0,
        initialized: false
    },
    
    // FRED data state
    fred: {
        dataLoaded: false,
        charts: {
            gdp: null,
            inflation: null,
            yield: null,
            austin: null
        }
    }
};

// Utility functions
const UTILS = {
    // Math utilities
    toRadians: (angle) => angle * (Math.PI / 180),
    toDegrees: (radians) => radians * (180 / Math.PI),
    
    // Interpolation and easing
    lerp: (start, end, factor) => start + (end - start) * factor,
    
    // Easing functions for smooth animations
    easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    
    // Utility functions
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // Date formatting
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        });
    },
    
    // Price formatting for financial data
    formatPrice: (price, decimals = 2) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },
    
    // Debounce function for performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Random utilities for visual effects
    randomBetween: (min, max) => Math.random() * (max - min) + min,
    randomChoice: (array) => array[Math.floor(Math.random() * array.length)]
};

// Export configuration for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, STATE, UTILS };
}