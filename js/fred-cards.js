// FRED Cards Manager - Compact economic data display
(function() {
    'use strict';
    
    class FredCardsManager {
        constructor() {
            this.cards = new Map();
            this.cache = new Map();
        }

        // Initialize FRED cards
        async init() {
            console.log('📊 Initializing FRED Cards...');
            
            this.initializeCards();
            await this.updateAllCards();
            
            console.log('✅ FRED Cards initialized');
        }

        // Set up card tracking
        initializeCards() {
            const fredSeries = [
                { id: 'GDPC1', name: 'GDP', label: 'Real GDP' },
                { id: 'CPIAUCSL', name: 'CPI', label: 'Inflation' },
                { id: 'UNRATE', name: 'UNEMP', label: 'Unemployment' },
                { id: 'T10Y2Y', name: 'YIELD', label: 'Yield Spread' }
            ];

            fredSeries.forEach(series => {
                const card = document.getElementById(`fred-${series.name}`);
                if (card) {
                    this.cards.set(series.id, {
                        element: card,
                        id: series.id,
                        name: series.name,
                        label: series.label
                    });
                }
            });
        }

        // Update all FRED cards
        async updateAllCards() {
            // For now, use mock data
            this.updateCard('GDPC1', 'GDP', 'Real GDP');
            this.updateCard('CPIAUCSL', 'CPI', 'Inflation');
            this.updateCard('UNRATE', 'UNEMP', 'Unemployment');
            this.updateCard('T10Y2Y', 'YIELD', 'Yield Spread');
        }

        // Update individual FRED card
        updateCard(seriesId, name, label) {
            const card = this.cards.get(seriesId);
            if (!card) return;

            // Mock data for now
            const mockData = {
                'GDPC1': '28.3T',
                'CPIAUCSL': '310.3',
                'UNRATE': '3.7%',
                'T10Y2Y': '0.15%'
            };

            this.renderCard(card, mockData[seriesId] || 'N/A');
        }

        // Render FRED card with data
        renderCard(card, value) {
            const { element } = card;
            
            // Update value
            const valueElement = element.querySelector('.fred-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }

        // Cleanup
        destroy() {
            this.cache.clear();
        }
    }

    // Create global instance
    window.FredCardsManager = new FredCardsManager();
    
    console.log('✅ FRED Cards Manager loaded');

})();