// Cache Utilities - TTL-based caching for all data sources
(function() {
    'use strict';
    
    class CacheManager {
        constructor() {
            this.cache = new Map();
        }

        // Get cached data if still valid
        getCached(key, maxAge) {
            const cached = this.cache.get(key);
            if (!cached) return null;
            
            const age = Date.now() - cached.timestamp;
            if (age > maxAge) {
                this.cache.delete(key);
                return null;
            }
            
            return cached.data;
        }

        // Set cached data with timestamp
        setCached(key, data) {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
        }

        // Clear expired entries
        cleanup() {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                // Remove entries older than 1 hour regardless of TTL
                if (now - value.timestamp > 3600000) {
                    this.cache.delete(key);
                }
            }
        }

        // Clear all cache
        clear() {
            this.cache.clear();
        }

        // Get cache stats
        getStats() {
            return {
                size: this.cache.size,
                keys: Array.from(this.cache.keys())
            };
        }
    }

    // Create global cache instance
    window.CacheManager = new CacheManager();
    
    // Cleanup expired entries every 10 minutes
    setInterval(() => {
        window.CacheManager.cleanup();
    }, 600000);

    console.log('✅ Cache utilities loaded');

})();