// Configuration and constants for the home page
const CONFIG = {
    // API Keys
    ALPHA_VANTAGE_KEY: "BM8MKOLJ72HQC28M",
    FRED_API_KEY: "e2a989dccd0dc0e9e1caaeb8ece23245",
    
    // Text slides for the main slider
    textSlides: [
        "THE FUTURE IS NOW",
        "INNOVATION DRIVES US",
        "CAPITAL MEETS TECH"
    ],
    
    // Globe configuration - FIXED
    globe: {
        radius: 450,
        states: {
            global: { 
                position: { x: 0, y: 0, z: 0 }, 
                rotation: { x: 0.1, y: 0, z: 0 }, 
                cameraZ: 1600, 
                opacity: 0.45 
            },
            america: { 
                position: { x: 60, y: 30, z: 0 }, 
                rotation: { x: 0.15, y: -0.5, z: 0 }, 
                cameraZ: 1100, 
                opacity: 0.55 
            },
            texas: { 
                position: { x: 90, y: 45, z: 0 }, 
                rotation: { x: 0.25, y: -0.7, z: 0 }, 
                cameraZ: 800, 
                opacity: 0.65 
            }
        },
        financialCenters: [
            { name: 'New York', lat: 40.7128, lon: -74.0060, type: 'primary', importance: 1.0, marketCap: 25.0 },
            { name: 'London', lat: 51.5074, lon: -0.1278, type: 'primary', importance: 0.9, marketCap: 15.0 },
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, type: 'primary', importance: 0.85, marketCap: 12.0 },
            { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, type: 'secondary', importance: 0.8, marketCap: 8.0 },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, type: 'secondary', importance: 0.75, marketCap: 6.0 },
            { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, type: 'secondary', importance: 0.7, marketCap: 5.0 },
            { name: 'Austin', lat: 30.2672, lon: -97.7431, type: 'emerging', importance: 0.6, marketCap: 2.1 }
        ],
        tradeRoutes: [
            { from: 'New York', to: 'London', type: 'primary', strength: 1.0 },
            { from: 'New York', to: 'Tokyo', type: 'primary', strength: 0.9 },
            { from: 'London', to: 'Frankfurt', type: 'secondary', strength: 0.8 },
            { from: 'Hong Kong', to: 'Singapore', type: 'secondary', strength: 0.7 },
            { from: 'New York', to: 'Austin', type: 'emerging', strength: 0.6 }
        ],
        dataFlows: [
            { type: 'cable', points: [[40.7128, -74.0060], [51.5074, -0.1278]] },
            { type: 'satellite', points: [[35.6762, 139.6503], [30.2672, -97.7431]] }
        ]
    },
    
    // News configuration - FIXED
    news: {
        gemini: {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
            model: 'gemini-1.5-flash',
            apiKey: 'YOUR_GEMINI_API_KEY_HERE'
        },
        newsRefresh: {
            interval: 1800000 // 30 minutes
        }
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
        apiKey: "e2a989dccd0dc0e9e1caaeb8ece23245",
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
    
    // Animation timings
    timing: {
        slideTransition: 2000,
        typingSpeed: {
            min: 80,
            max: 120,
            spaceDelay: 400,
            backspaceMin: 25,
            backspaceMax: 60,
            backspacePause: 200
        },
        scrollSensitivity: {
            slowFactor: 0.4,
            transitionBuffer: 0.04
        },
        ctaDelay: 3000,
        newsUpdateInterval: 5000,
        fredTransition: {
            textBackspace: 2500,
            fadeDelay: 1500,
            revealDelay: 2000
        }
    },
    
    // Market Snapshot configuration
    marketSnapshot: {
        equities: [
            { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
            { symbol: 'SPY', name: 'S&P 500 ETF' },
            { symbol: 'DJT', name: 'Dow Transportation', fallback: 'IYT' }
        ],
        crypto: [
            { symbol: 'BTC', name: 'Bitcoin' },
            { symbol: 'ETH', name: 'Ethereum' },
            { symbol: 'SOL', name: 'Solana' }
        ],
        fredSeries: [
            { id: 'GDPC1', name: 'GDP', label: 'Real GDP' },
            { id: 'CPIAUCSL', name: 'CPI', label: 'Inflation' },
            { id: 'UNRATE', name: 'UNEMP', label: 'Unemployment' },
            { id: 'T10Y2Y', name: 'YIELD', label: 'Yield Spread' }
        ],
        cache: {
            price: 60000, // 60 seconds
            sparkline: 600000, // 10 minutes
            fred: 86400000 // 24 hours
        }
    }
};

// Global state management - FIXED
const STATE = {
    slider: {
        currentSlideIndex: 0,
        charIndex: 0,
        isTyping: true,
        hasStartedTyping: false,
        slidesCompleted: false,
        swiper: null
    },
    
    globe: {
        currentState: 0,
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
    
    orderbook: {
        ws: null,
        connected: false,
        reconnectAttempts: 0,
        lastUpdateTime: 0,
        initialized: false
    },
    
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

// Utility functions - FIXED
const UTILS = {
    toRadians: (angle) => angle * (Math.PI / 180),
    toDegrees: (radians) => radians * (180 / Math.PI),
    lerp: (start, end, factor) => start + (end - start) * factor,
    easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
        });
    },
    
    formatPrice: (price, decimals = 2) => {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },
    
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
    
    randomBetween: (min, max) => Math.random() * (max - min) + min,
    randomChoice: (array) => array[Math.floor(Math.random() * array.length)]
};

console.log('✅ CONFIG, STATE, and UTILS loaded successfully');