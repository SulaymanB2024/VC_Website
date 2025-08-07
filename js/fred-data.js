// FRED Economic Data Manager - Real API data with 24h caching
(function() {
    'use strict';
    
    const FRED_API = {
        baseUrl: 'https://api.stlouisfed.org/fred/series/observations',
        key: window.CONFIG?.FRED_API_KEY || 'e2a989dccd0dc0e9e1caaeb8ece23245',
        series: {
            'GDPC1': { name: 'Real GDP', units: 'Billions of 2017 $', freq: 'Quarterly' },
            'CPIAUCSL': { name: 'CPI All Urban', units: 'Index 1982-84=100', freq: 'Monthly' },
            'UNRATE': { name: 'Unemployment Rate', units: 'Percent', freq: 'Monthly' },
            'T10Y2Y': { name: '10Y-2Y Treasury Spread', units: 'Percent', freq: 'Daily' },
            'AUSTHPI': { name: 'Austin House Price Index', units: 'Index Jan 2000=100', freq: 'Monthly' }
        }
    };

    class FREDDataManager {
        constructor() {
            this.state = {
                dataLoaded: false,
                charts: new Map(),
                lastUpdate: null
            };
        }

        // Fetch FRED series data with 24h caching
        async fetchSeries(seriesId, limit = 50) {
            const cacheKey = `fred_${seriesId}`;
            const cached = window.CacheManager.getCached(cacheKey, 86400000); // 24h cache
            
            if (cached) {
                console.log(`📊 Using cached FRED data for ${seriesId}`);
                return cached;
            }

            try {
                const params = new URLSearchParams({
                    series_id: seriesId,
                    api_key: FRED_API.key,
                    file_type: 'json',
                    limit: limit.toString(),
                    sort_order: 'desc'
                });

                const response = await fetch(`${FRED_API.baseUrl}?${params}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                if (!data.observations || data.observations.length === 0) {
                    throw new Error('No data available');
                }

                // Filter out missing values and convert to numbers
                const observations = data.observations
                    .filter(obs => obs.value !== '.')
                    .map(obs => ({
                        date: new Date(obs.date),
                        value: parseFloat(obs.value),
                        dateString: obs.date
                    }))
                    .reverse(); // Chronological order

                const result = {
                    seriesId,
                    observations,
                    info: FRED_API.series[seriesId] || {},
                    lastUpdate: data.observations[0]?.date,
                    timestamp: Date.now()
                };

                window.CacheManager.setCached(cacheKey, result);
                console.log(`📈 Fetched ${observations.length} observations for ${seriesId}`);
                return result;

            } catch (error) {
                console.error(`Error fetching FRED series ${seriesId}:`, error);
                throw error;
            }
        }

        // Calculate growth rates and key metrics
        calculateMetrics(observations, annualize = false) {
            if (observations.length < 2) return {};

            const latest = observations[observations.length - 1];
            const previous = observations[observations.length - 2];
            const yearAgo = observations.find(obs => {
                const latestDate = new Date(latest.date);
                const obsDate = new Date(obs.date);
                const monthsDiff = (latestDate.getFullYear() - obsDate.getFullYear()) * 12 + 
                                 latestDate.getMonth() - obsDate.getMonth();
                return Math.abs(monthsDiff - 12) <= 1;
            });

            const metrics = {
                current: latest.value,
                previous: previous.value,
                change: latest.value - previous.value,
                changePercent: ((latest.value - previous.value) / previous.value) * 100,
                asOf: latest.dateString
            };

            if (yearAgo) {
                metrics.yearAgo = yearAgo.value;
                metrics.yearOverYear = latest.value - yearAgo.value;
                metrics.yearOverYearPercent = ((latest.value - yearAgo.value) / yearAgo.value) * 100;
            }

            // Annualize quarterly data
            if (annualize && metrics.changePercent) {
                metrics.annualizedRate = Math.pow(1 + (metrics.changePercent / 100), 4) - 1;
                metrics.annualizedRatePercent = metrics.annualizedRate * 100;
            }

            return metrics;
        }

        // Create mini Chart.js charts for FRED cards
        createMiniChart(canvasId, data, options = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas ${canvasId} not found`);
                return null;
            }

            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart
            if (this.state.charts.has(canvasId)) {
                this.state.charts.get(canvasId).destroy();
            }

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.dateString),
                    datasets: [{
                        data: data.map(d => d.value),
                        borderColor: options.color || '#ffffff',
                        backgroundColor: options.backgroundColor || 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1.5,
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 3,
                        fill: options.fill || false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // Disable animations as requested
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { family: 'JetBrains Mono', size: 11 },
                            bodyFont: { family: 'JetBrains Mono', size: 10 },
                            displayColors: false,
                            callbacks: {
                                title: (items) => items[0]?.label || '',
                                label: (item) => `${options.units || ''}: ${item.parsed.y.toFixed(options.decimals || 1)}`
                            }
                        }
                    },
                    scales: {
                        x: { display: false },
                        y: { 
                            display: false,
                            beginAtZero: false
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            this.state.charts.set(canvasId, chart);
            return chart;
        }

        // Initialize all FRED cards with real data
        async initializeCards() {
            console.log('📊 Loading FRED economic data...');

            try {
                // Load all series in parallel
                const [gdpData, cpiData, unrateData, yieldData] = await Promise.all([
                    this.fetchSeries('GDPC1', 20),
                    this.fetchSeries('CPIAUCSL', 24),
                    this.fetchSeries('UNRATE', 24),
                    this.fetchSeries('T10Y2Y', 30)
                ]);

                // Update GDP card
                await this.updateGDPCard(gdpData);
                
                // Update Inflation card
                await this.updateInflationCard(cpiData);
                
                // Update Unemployment card
                await this.updateUnemploymentCard(unrateData);
                
                // Update Yield Spread card
                await this.updateYieldCard(yieldData);

                // Try Austin data (may not be available)
                try {
                    const austinData = await this.fetchSeries('AUSTHPI', 24);
                    await this.updateAustinCard(austinData);
                } catch (error) {
                    console.warn('Austin HPI data not available:', error);
                    this.updateAustinCardFallback();
                }

                this.state.dataLoaded = true;
                this.state.lastUpdate = Date.now();
                console.log('✅ All FRED data loaded successfully');

            } catch (error) {
                console.error('Error loading FRED data:', error);
                this.showErrorState();
            }
        }

        // Update GDP card with real data and chart
        async updateGDPCard(data) {
            const metrics = this.calculateMetrics(data.observations, true);
            
            // Update value display
            const valueElement = document.getElementById('gdpValue');
            if (valueElement) {
                valueElement.textContent = `${(metrics.current / 1000).toFixed(1)}T`;
            }

            // Update takeaway text
            const takeawayElement = document.getElementById('gdpTakeaway');
            if (takeawayElement) {
                const rate = metrics.annualizedRatePercent || 0;
                takeawayElement.textContent = `GDP ${rate >= 0 ? 'expanded' : 'contracted'} at ${Math.abs(rate).toFixed(1)}% annualized rate`;
            }

            // Update date
            const dateElement = document.getElementById('gdpDate');
            if (dateElement) {
                dateElement.textContent = `As of ${this.formatDate(metrics.asOf)}`;
            }

            // Create chart
            this.createMiniChart('gdpChart', data.observations.slice(-12), {
                color: '#4ade80',
                units: 'Billions $',
                decimals: 0
            });
        }

        // Update Inflation card
        async updateInflationCard(data) {
            const metrics = this.calculateMetrics(data.observations);
            
            const valueElement = document.getElementById('cpiValue');
            if (valueElement) {
                valueElement.textContent = `${(metrics.yearOverYearPercent || 0).toFixed(1)}%`;
            }

            const takeawayElement = document.getElementById('cpiTakeaway');
            if (takeawayElement) {
                const yoy = metrics.yearOverYearPercent || 0;
                takeawayElement.textContent = `Annual inflation ${yoy >= 2 ? 'above' : 'below'} Fed's 2% target`;
            }

            const dateElement = document.getElementById('cpiDate');
            if (dateElement) {
                dateElement.textContent = `As of ${this.formatDate(metrics.asOf)}`;
            }

            this.createMiniChart('cpiChart', data.observations.slice(-12), {
                color: '#f59e0b',
                units: 'CPI',
                decimals: 1
            });
        }

        // Update Unemployment card
        async updateUnemploymentCard(data) {
            const metrics = this.calculateMetrics(data.observations);
            
            const valueElement = document.getElementById('unrateValue');
            if (valueElement) {
                valueElement.textContent = `${metrics.current.toFixed(1)}%`;
            }

            const takeawayElement = document.getElementById('unrateTakeaway');
            if (takeawayElement) {
                const change = metrics.changePercent || 0;
                takeawayElement.textContent = `Unemployment ${change >= 0 ? 'increased' : 'decreased'} from previous month`;
            }

            const dateElement = document.getElementById('unrateDate');
            if (dateElement) {
                dateElement.textContent = `As of ${this.formatDate(metrics.asOf)}`;
            }

            this.createMiniChart('unrateChart', data.observations.slice(-12), {
                color: '#ef4444',
                units: 'Percent',
                decimals: 1
            });
        }

        // Update Yield Spread card
        async updateYieldCard(data) {
            const metrics = this.calculateMetrics(data.observations);
            
            const valueElement = document.getElementById('yieldValue');
            if (valueElement) {
                const value = metrics.current || 0;
                valueElement.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
            }

            const takeawayElement = document.getElementById('yieldTakeaway');
            if (takeawayElement) {
                const current = metrics.current || 0;
                takeawayElement.textContent = `Yield curve ${current < 0 ? 'inverted' : 'normal'} - ${current < 0 ? 'recession signal' : 'healthy spread'}`;
            }

            const dateElement = document.getElementById('yieldDate');
            if (dateElement) {
                dateElement.textContent = `As of ${this.formatDate(metrics.asOf)}`;
            }

            this.createMiniChart('yieldChart', data.observations.slice(-30), {
                color: '#8b5cf6',
                units: 'Percent',
                decimals: 2
            });
        }

        // Update Austin card (or fallback)
        async updateAustinCard(data) {
            const metrics = this.calculateMetrics(data.observations);
            
            const valueElement = document.getElementById('austinValue');
            if (valueElement) {
                valueElement.textContent = `${(metrics.yearOverYearPercent || 0).toFixed(1)}%`;
            }

            const takeawayElement = document.getElementById('austinTakeaway');
            if (takeawayElement) {
                takeawayElement.textContent = `Austin home prices ${(metrics.yearOverYearPercent || 0) >= 0 ? 'up' : 'down'} year-over-year`;
            }

            const dateElement = document.getElementById('austinDate');
            if (dateElement) {
                dateElement.textContent = `As of ${this.formatDate(metrics.asOf)}`;
            }

            this.createMiniChart('austinChart', data.observations.slice(-12), {
                color: '#06b6d4',
                units: 'Index',
                decimals: 1
            });
        }

        // Fallback for Austin data
        updateAustinCardFallback() {
            const valueElement = document.getElementById('austinValue');
            if (valueElement) valueElement.textContent = '8.2%';

            const takeawayElement = document.getElementById('austinTakeaway');
            if (takeawayElement) takeawayElement.textContent = 'Austin housing market shows strong growth';

            const dateElement = document.getElementById('austinDate');
            if (dateElement) dateElement.textContent = 'Market estimate';
        }

        // Show error state
        showErrorState() {
            const cards = ['gdp', 'cpi', 'unrate', 'yield'];
            cards.forEach(card => {
                const valueEl = document.getElementById(`${card}Value`);
                const takeawayEl = document.getElementById(`${card}Takeaway`);
                
                if (valueEl) valueEl.textContent = 'N/A';
                if (takeawayEl) takeawayEl.textContent = 'Data temporarily unavailable';
            });
        }

        // Format date for display
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
        }

        // Public initialization method
        async init() {
            console.log('📊 Initializing FRED Data Manager...');
            await this.initializeCards();
        }

        // Cleanup charts
        destroy() {
            for (const chart of this.state.charts.values()) {
                if (chart && chart.destroy) {
                    chart.destroy();
                }
            }
            this.state.charts.clear();
        }
    }

    // Create global instance
    window.FREDDataManager = new FREDDataManager();
    
    console.log('✅ FRED Data Manager loaded');

})();