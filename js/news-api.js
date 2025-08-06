// Enhanced News API Manager for real-time financial news
class NewsAPIManager {
    constructor() {
        this.config = CONFIG.news;
        this.state = {
            lastFetch: null,
            isLoading: false,
            retryCount: 0,
            cacheValid: false
        };
        
        // Prompts optimized for ticker-style headlines
        this.prompts = {
            system: `You are a financial news curator for an investment website's news ticker.
Generate EXACTLY 6 concise financial headlines that are current and verified.

Requirements:
- Each headline MUST be ≤ 65 characters for ticker compatibility
- Style: Clean, professional, no hype words or emojis
- Mix: 4 GLOBAL financial items + 2 TEXAS/AUSTIN business items
- Focus: Markets, Economics, Policy, Major Tech, Energy - avoid sports/celebrity
- Time window: last 24 hours preferred, extend to 48 hours if needed
- Use verified sources with Google Search grounding

Output: Return JSON array of headline strings only (not objects).
Keep headlines concise and ticker-appropriate.`,

            user: `Generate 6 financial news headlines for a live ticker.
Requirements:
- 4 global financial/market headlines (≤65 chars each)
- 2 Texas/Austin business/tech headlines (≤65 chars each)  
- Focus on: market moves, economic data, policy changes, major deals
- Current within 24-48 hours
- Professional tone, no speculation
Return only JSON array of headline strings.`
        };
    }

    // Fetch live news from Gemini API and update CONFIG.newsItems
    async fetchLiveNews() {
        if (this.state.isLoading) {
            console.log('News fetch already in progress');
            return CONFIG.newsItems;
        }

        this.state.isLoading = true;
        
        try {
            const apiUrl = `${this.config.gemini.baseUrl}/${this.config.gemini.model}:generateContent?key=${this.config.gemini.apiKey}`;
            
            const requestBody = {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: this.prompts.user }]
                    }
                ],
                systemInstruction: {
                    parts: [{ text: this.prompts.system }]
                },
                tools: [
                    {
                        googleSearch: {}
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "News headline ≤65 characters"
                        },
                        minItems: 6,
                        maxItems: 6
                    }
                }
            };

            console.log('Fetching live financial news...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const newsData = JSON.parse(data.candidates[0].content.parts[0].text);
                
                // Process and validate the news data
                const processedNews = this.processNewsData(newsData);
                
                // Update CONFIG.newsItems directly (keeping existing framework)
                CONFIG.newsItems = [...processedNews];
                
                // Notify existing ticker to refresh with new data
                this.notifyTickerRefresh();
                
                // Cache the results
                this.state.lastFetch = Date.now();
                this.state.cacheValid = true;
                this.state.retryCount = 0;
                
                console.log(`Successfully updated CONFIG.newsItems with ${processedNews.length} live headlines`);
                return processedNews;
            } else {
                throw new Error('Invalid response format from API');
            }
            
        } catch (error) {
            console.error('Error fetching live news:', error);
            this.state.retryCount++;
            
            // Keep existing fallback behavior - don't change CONFIG.newsItems on error
            console.log('Keeping existing news items due to API error');
            return CONFIG.newsItems;
            
        } finally {
            this.state.isLoading = false;
        }
    }

    // Process and validate news data to work with existing ticker
    processNewsData(newsArray) {
        if (!Array.isArray(newsArray)) {
            console.warn('News data is not an array, keeping existing items');
            return CONFIG.newsItems;
        }

        return newsArray
            .filter(item => this.validateHeadline(item))
            .map(item => this.formatHeadline(item))
            .slice(0, 6); // Ensure max 6 items to match existing system
    }

    // Validate individual headline
    validateHeadline(headline) {
        return typeof headline === 'string' && 
               headline.length <= 65 &&
               headline.length > 15; // Minimum reasonable length
    }

    // Format headline for ticker display (keep existing style)
    formatHeadline(headline) {
        // Clean up the headline
        let formatted = headline.trim();
        
        // Remove quotes and excessive punctuation
        formatted = formatted.replace(/["""'']/g, '');
        formatted = formatted.replace(/\s+/g, ' ');
        
        // Ensure it fits ticker constraints
        if (formatted.length > 65) {
            formatted = formatted.substring(0, 62) + '...';
        }
        
        return formatted;
    }

    // Notify the existing news ticker to refresh (if it has refresh capability)
    notifyTickerRefresh() {
        if (window.NewsTickerManager && typeof window.NewsTickerManager.refreshNews === 'function') {
            window.NewsTickerManager.refreshNews();
        }
    }

    // Check if cache is still valid (30 minutes)
    isCacheValid() {
        if (!this.state.cacheValid || !this.state.lastFetch) return false;
        
        const cacheAge = Date.now() - this.state.lastFetch;
        return cacheAge < this.config.newsRefresh.interval;
    }

    // Get news with intelligent caching
    async getNews() {
        if (this.isCacheValid()) {
            console.log('Using cached news (still valid)');
            return CONFIG.newsItems;
        }

        return await this.fetchLiveNews();
    }

    // Start automatic refresh cycle
    startAutoRefresh() {
        console.log('Starting automatic news refresh every 30 minutes...');
        
        // Initial fetch after a short delay to let page load
        setTimeout(() => {
            this.getNews();
        }, 5000);
        
        // Set up periodic refresh (30 minutes)
        setInterval(async () => {
            try {
                await this.fetchLiveNews();
                console.log('News auto-refresh completed');
            } catch (error) {
                console.error('News auto-refresh failed:', error);
            }
        }, this.config.newsRefresh.interval);
    }

    // Manual refresh method for testing
    async manualRefresh() {
        console.log('Manual news refresh triggered...');
        this.state.cacheValid = false; // Force refresh
        return await this.fetchLiveNews();
    }

    // Initialize the news system (works with existing framework)
    init() {
        console.log('Initializing Live News API Manager...');
        console.log('Using existing news framework - only updating CONFIG.newsItems');
        
        // Start fetching live news
        this.startAutoRefresh();
        
        console.log('News API Manager ready - will update existing ticker every 30 minutes');
    }
}

// Create global instance
window.NewsAPIManager = new NewsAPIManager();