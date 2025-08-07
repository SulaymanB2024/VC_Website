// News Feed Manager for Market Snapshot
(function() {
    'use strict';
    
    class NewsFeedManager {
        constructor() {
            this.container = null;
            this.cache = new Map();
            this.updateInterval = null;
        }

        // Initialize news feed
        async init() {
            console.log('📰 Initializing News Feed...');
            
            this.container = document.getElementById('newsList');
            if (!this.container) {
                console.warn('News feed container not found - this is normal if not on home page');
                return;
            }

            // Initial load
            await this.updateNews();
            
            console.log('✅ News Feed initialized');
        }

        // Update news feed
        async updateNews() {
            try {
                // Mock news data for now
                const news = [
                    "Federal Reserve maintains interest rates at current levels",
                    "Tech stocks rally on AI infrastructure investments",
                    "Oil prices stabilize amid global supply concerns",
                    "Cryptocurrency markets show renewed institutional interest",
                    "Housing market data indicates cooling trend",
                    "Labor market remains resilient despite economic headwinds",
                    "Infrastructure spending bill passes key legislative hurdle",
                    "Renewable energy investments reach record highs",
                    "Banking sector reports strong quarterly earnings",
                    "International trade negotiations show progress"
                ];

                this.renderNews(news);
            } catch (error) {
                console.error('Error updating news feed:', error);
                this.renderErrorState();
            }
        }

        // Render news items
        renderNews(newsItems) {
            if (!this.container || !Array.isArray(newsItems)) return;

            // Clear existing items
            this.container.innerHTML = '';

            // Add news items
            newsItems.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = this.truncateText(item, 80);
                this.container.appendChild(li);
            });
        }

        // Render error state
        renderErrorState() {
            if (!this.container) return;
            this.container.innerHTML = '<li>Unable to load news feed</li>';
        }

        // Truncate text with ellipsis
        truncateText(text, maxLength) {
            if (typeof text !== 'string') return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength - 3) + '...';
        }

        // Cleanup
        destroy() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            this.cache.clear();
        }
    }

    // Create global instance
    window.NewsFeedManager = new NewsFeedManager();
    
    console.log('✅ News Feed Manager loaded');

})();