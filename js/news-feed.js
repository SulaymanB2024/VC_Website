// News Feed Manager - Displays live financial headlines with Gemini integration
(function() {
    'use strict';
    
    class NewsFeedManager {
        constructor() {
            this.container = null;
            this.refreshButton = null;
            this.isLoading = false;
            this.headlines = [];
        }

        // Initialize news feed
        async init() {
            console.log('📰 Initializing News Feed Manager...');
            
            this.container = document.getElementById('newsFeed');
            this.refreshButton = document.getElementById('newsRefresh');
            
            if (!this.container) {
                console.warn('News feed container not found');
                return;
            }

            // Setup refresh button
            this.setupRefreshButton();
            
            // Load initial headlines
            await this.loadHeadlines();
            
            console.log('✅ News Feed Manager initialized');
        }

        // Setup refresh button functionality
        setupRefreshButton() {
            if (this.refreshButton) {
                this.refreshButton.addEventListener('click', async () => {
                    if (!this.isLoading) {
                        await this.manualRefresh();
                    }
                });
            }
        }

        // Load headlines from NewsAPIManager
        async loadHeadlines() {
            if (this.isLoading) return;
            
            this.isLoading = true;
            this.showLoading();

            try {
                if (window.NewsAPIManager) {
                    this.headlines = await window.NewsAPIManager.getHeadlines();
                    this.renderHeadlines();
                } else {
                    console.warn('NewsAPIManager not available');
                    this.showError('News service unavailable');
                }
            } catch (error) {
                console.error('Error loading headlines:', error);
                this.showError('Failed to load news');
            } finally {
                this.isLoading = false;
            }
        }

        // Manual refresh triggered by user
        async manualRefresh() {
            console.log('📰 Manual news refresh triggered');
            
            if (window.NewsAPIManager) {
                try {
                    this.headlines = await window.NewsAPIManager.manualRefresh();
                    this.renderHeadlines();
                    
                    // Visual feedback for refresh
                    if (this.refreshButton) {
                        this.refreshButton.style.transform = 'rotate(360deg)';
                        setTimeout(() => {
                            this.refreshButton.style.transform = '';
                        }, 500);
                    }
                } catch (error) {
                    console.error('Manual refresh failed:', error);
                    this.showError('Refresh failed');
                }
            }
        }

        // Show loading state
        showLoading() {
            if (this.container) {
                this.container.innerHTML = '<div class="news-loading">Loading latest financial headlines...</div>';
            }
        }

        // Show error state
        showError(message) {
            if (this.container) {
                this.container.innerHTML = `<div class="news-loading">${message}</div>`;
            }
        }

        // Render headlines in feed
        renderHeadlines() {
            if (!this.container || !Array.isArray(this.headlines)) {
                this.showError('No headlines available');
                return;
            }

            if (this.headlines.length === 0) {
                this.showError('No headlines found');
                return;
            }

            // Clear container
            this.container.innerHTML = '';

            // Create headlines list
            this.headlines.forEach((item, index) => {
                const newsItem = this.createNewsItem(item, index);
                this.container.appendChild(newsItem);
            });

            console.log(`📰 Rendered ${this.headlines.length} headlines`);
        }

        // Create individual news item element
        createNewsItem(item, index) {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            // Create headline element
            const headline = document.createElement('div');
            headline.className = 'news-headline';
            headline.textContent = this.truncateHeadline(item.headline, 62);
            
            // Create source element
            const source = document.createElement('div');
            source.className = 'news-source';
            source.textContent = item.source;
            
            // Add elements to news item
            newsItem.appendChild(headline);
            newsItem.appendChild(source);
            
            // Add subtle animation delay
            newsItem.style.opacity = '0';
            newsItem.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                newsItem.style.transition = 'all 0.3s ease';
                newsItem.style.opacity = '1';
                newsItem.style.transform = 'translateY(0)';
            }, index * 50); // Stagger animation
            
            return newsItem;
        }

        // Truncate headline to fit display requirements
        truncateHeadline(headline, maxLength) {
            if (!headline || typeof headline !== 'string') return 'Invalid headline';
            
            if (headline.length <= maxLength) return headline;
            
            // Find last space before limit
            const truncated = headline.substring(0, maxLength - 3);
            const lastSpace = truncated.lastIndexOf(' ');
            
            if (lastSpace > maxLength * 0.7) {
                return truncated.substring(0, lastSpace) + '...';
            } else {
                return truncated + '...';
            }
        }

        // Get current headlines
        getHeadlines() {
            return this.headlines;
        }

        // Check if feed is loading
        isLoadingState() {
            return this.isLoading;
        }

        // Cleanup
        destroy() {
            if (this.refreshButton) {
                this.refreshButton.removeEventListener('click', this.manualRefresh);
            }
            
            this.headlines = [];
            console.log('🧹 News Feed Manager destroyed');
        }
    }

    // Create global instance
    window.NewsFeedManager = new NewsFeedManager();
    
    console.log('✅ News Feed Manager loaded');

})();