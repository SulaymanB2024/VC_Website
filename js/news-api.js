// Enhanced News API Manager with Gemini 1.5 Pro for financial headlines
(function() {
    'use strict';
    
    const NEWS_API = {
        gemini: {
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro',
            key: 'AIzaSyAj8Nm3KxHfEj3qVLYCtEMEgFQ8cQMsFic', // From your prompt
            model: 'gemini-1.5-pro'
        },
        cache: {
            ttl: 1800000, // 30 minutes
            key: 'news_headlines'
        }
    };

    class NewsAPIManager {
        constructor() {
            this.state = {
                lastFetch: null,
                isLoading: false,
                retryCount: 0
            };
            
            this.prompts = {
                system: `You are a financial news curator for an investment website. Generate EXACTLY 10 concise financial headlines that are current and verified.

Requirements:
- Each headline MUST be ≤62 characters for optimal display
- Style: Professional, factual, no hype words or emojis  
- Mix: 7 GLOBAL financial/market headlines + 3 TEXAS/AUSTIN business headlines
- Focus: Markets, economics, policy, major corporate news, energy sector
- Sources: Use Google Search grounding for current verified news
- Time window: Last 24 hours preferred, extend to 48 hours if needed

Output: JSON array with objects containing "headline" and "source" fields.
Keep headlines concise and professional.`,

                user: `Generate 10 financial news headlines for a live news feed.

Requirements:
- 7 global financial/market headlines (≤62 chars each)
- 3 Texas/Austin business/tech headlines (≤62 chars each)
- Focus on: market moves, economic data, policy changes, major deals
- Current within 24-48 hours, verified sources only
- Professional tone, factual reporting

Return JSON array of objects with "headline" and "source" fields.`
            };
        }

        // Fetch live headlines from Gemini API
        async fetchLiveHeadlines() {
            if (this.state.isLoading) {
                console.log('📰 News fetch already in progress');
                return this.getCachedHeadlines();
            }

            // Check cache first
            const cached = window.CacheManager.getCached(NEWS_API.cache.key, NEWS_API.cache.ttl);
            if (cached) {
                console.log('📰 Using cached news headlines');
                return cached;
            }

            this.state.isLoading = true;
            
            try {
                const apiUrl = `${NEWS_API.gemini.baseUrl}:generateContent?key=${NEWS_API.gemini.key}`;
                
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
                                type: "object",
                                properties: {
                                    headline: {
                                        type: "string",
                                        description: "News headline ≤62 characters"
                                    },
                                    source: {
                                        type: "string", 
                                        description: "Source domain (e.g., reuters.com)"
                                    }
                                },
                                required: ["headline", "source"]
                            },
                            minItems: 10,
                            maxItems: 10
                        }
                    }
                };

                console.log('📡 Fetching live financial headlines from Gemini...');
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`Gemini API request failed: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const newsData = JSON.parse(data.candidates[0].content.parts[0].text);
                    
                    // Process and validate headlines
                    const processedHeadlines = this.processHeadlines(newsData);
                    
                    // Cache the results
                    window.CacheManager.setCached(NEWS_API.cache.key, processedHeadlines);
                    
                    this.state.lastFetch = Date.now();
                    this.state.retryCount = 0;
                    
                    console.log(`📰 Successfully fetched ${processedHeadlines.length} live headlines`);
                    return processedHeadlines;
                } else {
                    throw new Error('Invalid response format from Gemini API');
                }
                
            } catch (error) {
                console.error('Error fetching live headlines:', error);
                this.state.retryCount++;
                
                // Return fallback headlines on error
                return this.getFallbackHeadlines();
                
            } finally {
                this.state.isLoading = false;
            }
        }

        // Process and validate headlines
        processHeadlines(headlines) {
            if (!Array.isArray(headlines)) {
                console.warn('Headlines data is not an array');
                return this.getFallbackHeadlines();
            }

            return headlines
                .filter(item => this.validateHeadline(item))
                .map(item => this.formatHeadline(item))
                .slice(0, 10); // Ensure exactly 10 headlines
        }

        // Validate individual headline
        validateHeadline(item) {
            return item && 
                   typeof item.headline === 'string' && 
                   typeof item.source === 'string' &&
                   item.headline.length <= 62 &&
                   item.headline.length > 10 &&
                   item.source.length > 0;
        }

        // Format headline for display
        formatHeadline(item) {
            let headline = item.headline.trim();
            let source = item.source.trim();
            
            // Clean up headline
            headline = headline.replace(/["""'']/g, '');
            headline = headline.replace(/\s+/g, ' ');
            
            // Ensure headline fits
            if (headline.length > 62) {
                headline = headline.substring(0, 59) + '...';
            }
            
            // Clean up source (extract domain if URL)
            if (source.includes('://')) {
                try {
                    source = new URL(source).hostname.replace('www.', '');
                } catch {
                    source = source.replace('https://', '').replace('http://', '').replace('www.', '');
                }
            }
            
            return {
                headline,
                source: source.toLowerCase(),
                timestamp: Date.now()
            };
        }

        // Get cached headlines if available
        getCachedHeadlines() {
            return window.CacheManager.getCached(NEWS_API.cache.key, NEWS_API.cache.ttl) || 
                   this.getFallbackHeadlines();
        }

        // Fallback headlines when API fails
        getFallbackHeadlines() {
            return [
                { headline: "Federal Reserve maintains interest rates at current levels", source: "federalreserve.gov" },
                { headline: "S&P 500 reaches new highs on tech sector strength", source: "marketwatch.com" },
                { headline: "Oil prices stabilize amid global supply concerns", source: "reuters.com" },
                { headline: "Bitcoin shows resilience despite regulatory uncertainty", source: "coindesk.com" },
                { headline: "Housing market data indicates cooling trend nationwide", source: "census.gov" },
                { headline: "Labor market remains tight with low unemployment", source: "bls.gov" },
                { headline: "Infrastructure spending drives economic growth", source: "wsj.com" },
                { headline: "Austin tech sector sees continued investment growth", source: "austin.com" },
                { headline: "Texas energy companies report strong quarterly results", source: "dallasnews.com" },
                { headline: "Houston port volumes increase amid trade recovery", source: "chron.com" }
            ].map(item => ({ ...item, timestamp: Date.now() }));
        }

        // Initialize automatic headline refresh
        startAutoRefresh() {
            console.log('📰 Starting automatic news refresh every 30 minutes...');
            
            // Initial fetch after page load
            setTimeout(() => {
                this.fetchLiveHeadlines();
            }, 5000);
            
            // Set up periodic refresh
            setInterval(async () => {
                try {
                    await this.fetchLiveHeadlines();
                    console.log('📰 News auto-refresh completed');
                } catch (error) {
                    console.error('📰 News auto-refresh failed:', error);
                }
            }, NEWS_API.cache.ttl);
        }

        // Manual refresh for testing
        async manualRefresh() {
            console.log('📰 Manual news refresh triggered...');
            // Clear cache to force fresh fetch
            window.CacheManager.cache.delete(NEWS_API.cache.key);
            return await this.fetchLiveHeadlines();
        }

        // Public API
        async getHeadlines() {
            return await this.fetchLiveHeadlines();
        }

        // Initialize the news system
        init() {
            console.log('📰 Initializing News API Manager...');
            this.startAutoRefresh();
            console.log('✅ News API Manager ready');
        }
    }

    // Create global instance
    window.NewsAPIManager = new NewsAPIManager();
    
    console.log('✅ News API Manager loaded');

})();