// FRED Economic Data functionality
class FREDDataManager {
    constructor() {
        this.state = STATE.fred;
        this.config = CONFIG.fred;
    }

    // Initialize FRED economic section
    initializeEconomicSection() {
        console.log('Initializing FRED economic data...');
        
        // Initialize with mock data for now, then try to fetch real data
        this.initializeMockEconomicData();
        
        // Try to fetch real FRED data if API key is available
        if (this.config.apiKey !== 'e2a989dccd0dc0e9e1caaeb8ece23245') {
            this.fetchAndDisplayFREDData(this.config.apiKey);
        } else {
            console.log('Using mock economic data - add FRED API key for real data');
        }
    }

    initializeMockEconomicData() {
        // Generate realistic mock data for demonstration
        const mockGDPData = this.generateMockGDPData();
        const mockInflationData = this.generateMockInflationData();
        const mockYieldData = this.generateMockYieldData();
        
        this.setupGDPChart(mockGDPData);
        this.setupInflationChart(mockInflationData);
        this.setupYieldChart(mockYieldData);
        this.setupAustinChart();
        this.updateMetricBoxes();
    }

    generateMockGDPData() {
        const data = [];
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2024-12-31');
        let baseGrowth = 2.1; // Base GDP growth rate
        
        for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 3)) {
            // Add realistic volatility and trends
            const volatility = (Math.random() - 0.5) * 2;
            const covidEffect = date.getFullYear() === 2020 && date.getMonth() >= 3 ? -8 : 0;
            const recoveryEffect = date.getFullYear() === 2021 ? 3 : 0;
            
            const value = baseGrowth + volatility + covidEffect + recoveryEffect;
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 100) / 100
            });
        }
        return data;
    }

    generateMockInflationData() {
        const data = [];
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2024-12-31');
        let baseInflation = 2.0; // Target inflation rate
        
        for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
            // Add realistic inflation trends
            const supplyChainEffect = date.getFullYear() >= 2021 && date.getFullYear() <= 2022 ? 2.5 : 0;
            const energyEffect = Math.sin((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365) * 2 * Math.PI) * 0.5;
            const volatility = (Math.random() - 0.5) * 0.3;
            
            const value = baseInflation + supplyChainEffect + energyEffect + volatility;
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.max(0, Math.round(value * 100) / 100)
            });
        }
        return data;
    }

    generateMockYieldData() {
        const data = [];
        const startDate = new Date('2020-01-01');
        const endDate = new Date('2024-12-31');
        let baseSpread = 1.5; // Base yield spread
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
            // Add realistic yield curve dynamics
            const fedPolicy = date.getFullYear() >= 2022 ? -0.8 : 0.2; // Rate hiking cycle
            const recessionFear = Math.sin((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 180) * Math.PI) * 0.3;
            const volatility = (Math.random() - 0.5) * 0.4;
            
            const value = baseSpread + fedPolicy + recessionFear + volatility;
            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(value * 100) / 100
            });
        }
        return data;
    }

    async fetchAndDisplayFREDData(apiKey) {
        try {
            console.log('Fetching real FRED data...');
            
            // Fetch GDP data (Real GDP growth rate)
            const gdpData = await this.fetchFREDData(this.config.series.gdp, apiKey);
            const transformedGDPData = this.transformGDPData(gdpData);
            
            // Fetch inflation data (CPI)
            const inflationData = await this.fetchFREDData(this.config.series.inflation, apiKey);
            const transformedInflationData = this.transformInflationData(inflationData);
            
            // Fetch yield curve data (10Y-2Y spread)
            const yieldData = await this.fetchFREDData(this.config.series.yieldSpread, apiKey);
            const transformedYieldData = this.transformYieldData(yieldData);
            
            // Update charts with real data
            if (transformedGDPData.length > 0) {
                this.setupGDPChart(transformedGDPData.slice(-20)); // Last 20 quarters
            }
            
            if (transformedInflationData.length > 0) {
                this.setupInflationChart(transformedInflationData.slice(-60)); // Last 5 years
            }
            
            if (transformedYieldData.length > 0) {
                this.setupYieldChart(transformedYieldData.slice(-252)); // Last year (weekly data)
            }
            
            console.log('FRED data loaded successfully');
            
        } catch (error) {
            console.error('Error fetching FRED data:', error);
            console.log('Continuing with mock data');
        }
    }

    async fetchFREDData(seriesId, apiKey) {
        const url = `${this.config.baseUrl}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=1000&sort_order=desc`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`FRED API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.observations || [];
    }

    transformGDPData(data) {
        return data.map(entry => ({
            date: entry.date,
            value: parseFloat(entry.value)
        })).filter(entry => !isNaN(entry.value)).reverse(); // Reverse to chronological order
    }

    transformInflationData(data) {
        // Calculate year-over-year inflation rate
        const processedData = [];
        for (let i = 12; i < data.length; i++) {
            const currentValue = parseFloat(data[i].value);
            const yearAgoValue = parseFloat(data[i - 12].value);
            
            if (!isNaN(currentValue) && !isNaN(yearAgoValue) && yearAgoValue > 0) {
                const inflationRate = ((currentValue - yearAgoValue) / yearAgoValue) * 100;
                processedData.push({
                    date: data[i].date,
                    value: Math.round(inflationRate * 100) / 100
                });
            }
        }
        return processedData.reverse(); // Reverse to chronological order
    }

    transformYieldData(data) {
        return data.map(entry => ({
            date: entry.date,
            value: parseFloat(entry.value)
        })).filter(entry => !isNaN(entry.value)).reverse(); // Reverse to chronological order
    }

    setupGDPChart(data) {
        const ctx = document.getElementById('gdpChart');
        if (!ctx) return;
        
        this.state.charts.gdp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(entry => entry.date),
                datasets: [{
                    label: 'GDP Growth Rate',
                    data: data.map(entry => entry.value),
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#00ff88',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `GDP Growth: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    setupInflationChart(data) {
        const ctx = document.getElementById('inflationChart');
        if (!ctx) return;
        
        this.state.charts.inflation = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.slice(-12).map(entry => UTILS.formatDate(entry.date)),
                datasets: [{
                    label: 'Inflation Rate',
                    data: data.slice(-12).map(entry => entry.value),
                    backgroundColor: data.slice(-12).map(entry => 
                        entry.value > 3 ? 'rgba(255, 68, 0, 0.8)' : 'rgba(0, 123, 255, 0.8)'
                    ),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ff4400',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `Inflation: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxRotation: 45
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    setupYieldChart(data) {
        const ctx = document.getElementById('yieldChart');
        if (!ctx) return;
        
        this.state.charts.yield = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(entry => entry.date),
                datasets: [{
                    label: '10Y-2Y Treasury Spread',
                    data: data.map(entry => entry.value),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    segment: {
                        borderColor: function(context) {
                            const value = context.p1.parsed.y;
                            return value < 0 ? '#ff4400' : '#007bff';
                        }
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#007bff',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                const spread = context.parsed.y;
                                const interpretation = spread < 0 ? ' (Inverted - Recession Risk)' : '';
                                return `Yield Spread: ${spread}%${interpretation}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    setupAustinChart() {
        const ctx = document.getElementById('austinChart');
        if (!ctx) return;
        
        // Mock Austin unemployment data
        const austinData = [
            { month: 'Jan', rate: 3.2 },
            { month: 'Feb', rate: 3.1 },
            { month: 'Mar', rate: 3.4 },
            { month: 'Apr', rate: 3.6 },
            { month: 'May', rate: 3.5 },
            { month: 'Jun', rate: 3.8 }
        ];
        
        this.state.charts.austin = new Chart(ctx, {
            type: 'line',
            data: {
                labels: austinData.map(d => d.month),
                datasets: [{
                    label: 'Austin Unemployment Rate',
                    data: austinData.map(d => d.rate),
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffc107',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    updateMetricBoxes() {
        // Update with realistic current values
        const metrics = {
            gdp: 2.8,
            inflation: 3.1,
            fedRate: 5.25
        };
        
        // Add animation to metric updates
        this.animateMetricValue('metric1Value', metrics.gdp + '%');
        this.animateMetricValue('metric2Value', metrics.inflation + '%');
        this.animateMetricValue('metric3Value', metrics.fedRate + '%');
        this.animateMetricValue('austinKpiValue', '3.8%');
    }

    animateMetricValue(elementId, finalValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        let startValue = 0;
        const duration = 2000;
        const startTime = Date.now();
        
        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = UTILS.easeOutQuart(progress);
            
            if (finalValue.includes('%')) {
                const targetNum = parseFloat(finalValue);
                const currentNum = startValue + (targetNum - startValue) * easeOutQuart;
                element.textContent = currentNum.toFixed(1) + '%';
            } else {
                element.textContent = finalValue;
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        update();
    }

    // Initialize FRED data system
    init() {
        this.initializeEconomicSection();
        console.log('FRED data manager initialized');
    }
}

// Create global instance
window.FREDDataManager = new FREDDataManager();