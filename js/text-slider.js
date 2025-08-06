// Enhanced Text Slider with Refined Animation Timing and Scroll Reactions
class TextSlider {
    constructor() {
        this.state = {
            currentSlideIndex: 0,
            charIndex: 0,
            isTyping: true,
            hasStartedTyping: false,
            slidesCompleted: false,
            swiper: null,
            isTransitioning: false,
            ctaActive: false,
            tickerRotation: null,
            lastTransitionTime: 0 // Track transition timing
        };
        this.config = CONFIG;
        this.lastScrollY = 0;
        this.currentScrollZone = 0;
        this.scrollDebounceTimer = null;
        // Enhanced auto-slowing mechanism
        this.scrollVelocity = 0;
        this.lastScrollTime = 0;
        this.maxScrollSpeed = 35; // Reduced threshold for more responsive slowing
        this.isSlowingDown = false;
        this.slowDownTimer = null;
        this.scrollHistory = []; // Track scroll history for smoother detection
        this.frameRequestId = null; // For RAF optimization
        
        // NEW: Auto-play system for when users stop scrolling
        this.autoPlay = {
            isActive: false,
            timer: null,
            lastScrollTime: 0,
            inactivityThreshold: 4000, // 4 seconds of no scrolling triggers auto-play
            hasUserScrolled: false, // Track if user has scrolled at all
            completedZones: new Set() // Track which zones have been seen
        };
        
        // NEW: Click-to-begin automated experience system
        this.autoExperience = {
            isActive: false,
            hasStarted: false,
            currentStep: 0,
            totalSteps: 4,
            stepTimer: null,
            direction: 'forward', // 'forward' or 'reverse'
            stepDurations: [
                4000, // Step 0: "THE FUTURE IS NOW" (4s - optimized)
                4000, // Step 1: CTA + Texas zoom (4s - optimized for ticker viewing)
                6000, // Step 2: "INNOVATION" + America focus (6s - reduced but still substantial)
                5000, // Step 3: "CAPITAL" + Texas focus (5s - reduced but still substantial)
                0     // Step 4: FRED section (stays until user interaction)
            ],
            isClickListenerActive: true
        };
    }

    // Initialize Swiper
    initSwiper() {
        this.state.swiper = new Swiper('.main-text-swiper', {
            direction: 'vertical',
            effect: 'fade',
            fadeEffect: { crossFade: true },
            speed: 800,
            allowTouchMove: false,
            autoplay: false
        });
    }

    // Refined typing animation with improved rhythm and speed
    typeSlideText() {
        const currentSlide = document.getElementById(`slide${this.state.currentSlideIndex + 1}Text`);
        const text = this.config.textSlides[this.state.currentSlideIndex];
        
        if (!currentSlide || !this.state.isTyping) return;
        
        if (this.state.charIndex < text.length) {
            // Restore cursor in typing animation
            currentSlide.innerHTML = text.substring(0, this.state.charIndex + 1) + '<span class="cursor">|</span>';
            this.state.charIndex++;
            
            const char = text[this.state.charIndex - 1];
            // Improved timing - faster overall for better pacing
            let delay;
            if (char === ' ') {
                delay = 120; // Faster space delay
            } else if (char.match(/[.!?]/)) {
                delay = 200; // Reduced pause at punctuation
            } else if (char.match(/[A-Z]/)) {
                delay = 45; // Faster for capitals
            } else {
                delay = 35 + Math.random() * 20; // Much faster base typing speed
            }
            
            setTimeout(() => this.typeSlideText(), delay);
        } else {
            // Final text with cursor
            currentSlide.innerHTML = text + '<span class="cursor">|</span>';
            this.state.isTyping = false;
            console.log(`✅ Completed typing: "${text}"`);
        }
    }

    // Enhanced CTA with better error handling and timing
    showInvestmentCTA() {
        const ctaElement = document.getElementById('investmentCta');
        if (!ctaElement) {
            console.error('❌ Investment CTA element not found');
            return;
        }
        
        if (this.state.ctaActive) {
            console.log('⚠️ CTA already active, skipping');
            return;
        }
        
        this.state.ctaActive = true;
        const baseText = "Here's how you can invest in it";
        let charIndex = 0;

        // Reset element state
        ctaElement.style.opacity = '0';
        ctaElement.textContent = '';

        // Initialize ticker rotation state with updated crypto tickers
        this.state.tickerRotation = {
            isActive: false,
            currentTicker: 0,
            tickers: ["BTC", "HYPE", "ENA", "SYRUP", "GLXY"], // Updated with requested tickers
            rotationTimer: null
        };

        const typeCTA = () => {
            if (!this.state.ctaActive) return; // Safety check
            
            if (charIndex < baseText.length) {
                ctaElement.textContent = baseText.substring(0, charIndex + 1) + '|';
                charIndex++;
                setTimeout(typeCTA, 75); // Slightly faster typing
            } else {
                ctaElement.textContent = baseText;
                ctaElement.style.transition = 'opacity 0.3s ease-in';
                ctaElement.style.opacity = '1';
                
                // Start ticker rotation after 1.5 seconds (reduced delay)
                setTimeout(() => {
                    if (this.state.ctaActive) this.startTickerRotation();
                }, 1500);
            }
        };

        // Fade in and start typing
        setTimeout(() => {
            ctaElement.style.opacity = '1';
            typeCTA();
        }, 100);
    }

    // Enhanced ticker rotation with coherent typing animation
    startTickerRotation() {
        if (!this.state.tickerRotation || this.state.tickerRotation.isActive || !this.state.ctaActive) {
            return;
        }
        
        this.state.tickerRotation.isActive = true;
        const ctaElement = document.getElementById('investmentCta');
        if (!ctaElement) return;
        
        const rotateTicker = () => {
            if (!this.state.tickerRotation?.isActive || !this.state.ctaActive) {
                this.cleanupTickerRotation();
                return;
            }
            
            const currentTicker = this.state.tickerRotation.tickers[this.state.tickerRotation.currentTicker];
            
            // ENHANCED: More coherent backspace and type sequence
            console.log(`🎯 Switching ticker to: ${currentTicker}`);
            
            // Step 1: Pause to let user see current text
            setTimeout(() => {
                if (!this.state.ctaActive) return;
                
                // Step 2: Backspace "it" smoothly and coherently
                this.coherentBackspace(ctaElement, () => {
                    if (!this.state.ctaActive) return;
                    
                    // Step 3: Type the new ticker with natural rhythm
                    this.coherentTypeTicker(ctaElement, currentTicker, () => {
                        if (!this.state.tickerRotation?.isActive) return;
                        
                        // Step 4: Move to next ticker
                        this.state.tickerRotation.currentTicker = 
                            (this.state.tickerRotation.currentTicker + 1) % this.state.tickerRotation.tickers.length;
                        
                        // Step 5: Schedule next rotation with longer viewing time
                        this.state.tickerRotation.rotationTimer = setTimeout(rotateTicker, 3500); // Longer to read
                    });
                });
            }, 1500); // Longer pause to read current ticker
        };
        
        // Start first rotation with initial delay
        this.state.tickerRotation.rotationTimer = setTimeout(rotateTicker, 2000);
    }

    // NEW: Coherent backspace method with natural typing rhythm
    coherentBackspace(element, callback) {
        const currentText = element.textContent.replace(/\|$/, '');
        const baseText = "Here's how you can invest in ";
        const targetLength = baseText.length; // Backspace to just before the ticker
        
        if (currentText.length <= targetLength) {
            callback();
            return;
        }
        
        let currentLength = currentText.length;
        const backspaceChar = () => {
            if (!this.state.ctaActive || currentLength <= targetLength) {
                // Ensure we end with the base text and cursor
                element.textContent = baseText + '|';
                callback();
                return;
            }
            
            currentLength--;
            const remainingText = currentText.substring(0, currentLength);
            element.textContent = remainingText + '|';
            
            // Natural backspace rhythm - slightly faster than typing
            const backspaceDelay = 40 + Math.random() * 20;
            setTimeout(backspaceChar, backspaceDelay);
        };
        
        // Start backspacing after a brief pause
        setTimeout(backspaceChar, 300);
    }

    // NEW: Coherent ticker typing with natural rhythm
    coherentTypeTicker(element, ticker, callback) {
        const baseText = "Here's how you can invest in ";
        const fullText = baseText + ticker;
        const startLength = baseText.length;
        let charIndex = startLength;
        
        const typeChar = () => {
            if (!this.state.ctaActive || charIndex >= fullText.length) {
                // Final text without cursor for clean display
                element.textContent = fullText;
                callback();
                return;
            }
            
            // Type character by character with natural rhythm
            const currentText = fullText.substring(0, charIndex + 1);
            element.textContent = currentText + '|';
            charIndex++;
            
            // Natural typing speed with slight variations
            const typingDelay = 80 + Math.random() * 40;
            setTimeout(typeChar, typingDelay);
        };
        
        // Start typing immediately
        typeChar();
    }

    // Cleanup method for ticker rotation
    cleanupTickerRotation() {
        if (this.state.tickerRotation?.rotationTimer) {
            clearTimeout(this.state.tickerRotation.rotationTimer);
            this.state.tickerRotation.rotationTimer = null;
        }
        if (this.state.tickerRotation) {
            this.state.tickerRotation.isActive = false;
        }
    }

    // Improved scroll velocity calculation with history
    calculateScrollVelocity(currentTime, currentScrollY) {
        const now = currentTime;
        const deltaTime = now - this.lastScrollTime;
        const deltaScroll = Math.abs(currentScrollY - this.lastScrollY);
        
        if (deltaTime > 0) {
            const velocity = deltaScroll / (deltaTime / 16.67); // Normalize to 60fps
            
            // Maintain scroll history for smoother detection
            this.scrollHistory.push({ velocity, time: now });
            
            // Keep only recent history (last 200ms)
            this.scrollHistory = this.scrollHistory.filter(entry => now - entry.time < 200);
            
            // Calculate average velocity from recent history
            const avgVelocity = this.scrollHistory.reduce((sum, entry) => sum + entry.velocity, 0) / this.scrollHistory.length;
            
            return avgVelocity;
        }
        
        return 0;
    }

    // Refined scroll handler with RAF optimization
    handleScroll() {
        if (this.frameRequestId) {
            cancelAnimationFrame(this.frameRequestId);
        }
        
        // Detect scroll inactivity for auto-play
        this.detectScrollInactivity();
        
        this.frameRequestId = requestAnimationFrame(() => {
            const currentTime = performance.now();
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // If user scrolls during auto-play, stop auto-play and resume manual control
            if (this.autoPlay.isActive && Math.abs(currentScrollY - this.lastScrollY) > 10) {
                console.log('👤 User resumed manual scrolling - stopping auto-play');
                this.stopAutoPlay();
            }
            
            // Calculate improved scroll velocity
            this.scrollVelocity = this.calculateScrollVelocity(currentTime, currentScrollY);
            
            this.lastScrollY = currentScrollY;
            this.lastScrollTime = currentTime;
            
            // Enhanced auto-slowing with better thresholds
            if (this.scrollVelocity > this.maxScrollSpeed && !this.isSlowingDown) {
                console.log(`🐌 Fast scroll detected (${this.scrollVelocity.toFixed(1)}px/frame) - auto-slowing`);
                this.activateAutoSlowing();
                return;
            }
            
            // Clear existing debounce
            if (this.scrollDebounceTimer) {
                clearTimeout(this.scrollDebounceTimer);
            }

            // Adaptive debounce with better scaling
            const debounceDelay = Math.min(50, Math.max(8, this.scrollVelocity * 1.5));
            
            this.scrollDebounceTimer = setTimeout(() => {
                this.processScrollZones();
            }, debounceDelay);
        });
    }

    // NEW: Intelligent auto-play system
    detectScrollInactivity() {
        const now = performance.now();
        this.autoPlay.lastScrollTime = now;
        this.autoPlay.hasUserScrolled = true;
        
        // Clear any existing auto-play timer
        if (this.autoPlay.timer) {
            clearTimeout(this.autoPlay.timer);
            this.autoPlay.timer = null;
        }
        
        // Only start auto-play if user has scrolled and isn't at the end
        if (this.autoPlay.hasUserScrolled && this.currentScrollZone < 4) {
            this.autoPlay.timer = setTimeout(() => {
                this.startAutoPlay();
            }, this.autoPlay.inactivityThreshold);
        }
    }

    startAutoPlay() {
        if (this.autoPlay.isActive || this.currentScrollZone >= 4) return;
        
        console.log('🎬 Auto-play activated - continuing experience automatically');
        this.autoPlay.isActive = true;
        
        // Add visual indicator that auto-play is happening
        this.showAutoPlayIndicator();
        
        // Start the automated progression through remaining zones
        this.autoProgressThroughZones();
    }

    showAutoPlayIndicator() {
        // Create a subtle indicator that auto-play is active
        const indicator = document.createElement('div');
        indicator.id = 'autoPlayIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 8px 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.5s ease;
            backdrop-filter: blur(10px);
            pointer-events: none;
        `;
        indicator.textContent = 'Auto-continuing experience...';
        
        document.body.appendChild(indicator);
        
        // Fade in
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 100);
        
        // Remove after experience completes
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 500);
            }
        }, 15000); // Remove after 15 seconds
    }

    autoProgressThroughZones() {
        if (!this.autoPlay.isActive || this.currentScrollZone >= 4) return;
        
        const nextZone = this.currentScrollZone + 1;
        console.log(`🎯 Auto-progressing to zone ${nextZone}`);
        
        // Execute transition to next zone
        this.executeZoneTransition(nextZone, 'forward');
        this.autoPlay.completedZones.add(nextZone);
        
        // Schedule next transition if not at the end
        if (nextZone < 4) {
            setTimeout(() => {
                this.autoProgressThroughZones();
            }, this.getAutoPlayZoneDelay(nextZone));
        } else {
            // Reached the end, stop auto-play
            this.stopAutoPlay();
        }
    }

    getAutoPlayZoneDelay(zone) {
        // Different zones need different timing for optimal experience
        switch (zone) {
            case 1: return 3500; // Time to show CTA and ticker rotation
            case 2: return 4000; // Time to appreciate Innovation text and America view
            case 3: return 3500; // Time to see Capital text and Texas focus
            case 4: return 2000; // Quick transition to FRED section
            default: return 3000;
        }
    }

    stopAutoPlay() {
        console.log('🎬 Auto-play completed');
        this.autoPlay.isActive = false;
        
        if (this.autoPlay.timer) {
            clearTimeout(this.autoPlay.timer);
            this.autoPlay.timer = null;
        }
    }

    // Improved auto-slowing with better recovery
    activateAutoSlowing() {
        this.isSlowingDown = true;
        
        if (this.slowDownTimer) {
            clearTimeout(this.slowDownTimer);
        }
        
        // Reduced cooldown for more responsive recovery
        this.slowDownTimer = setTimeout(() => {
            console.log('📍 Scroll velocity normalized - resuming zone processing');
            this.isSlowingDown = false;
            this.scrollHistory = []; // Clear history
            this.processScrollZones();
        }, 200); // Faster recovery
    }

    // Enhanced zone processing with better bidirectional handling and FRED section detection
    processScrollZones() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        const maxScroll = documentHeight - windowHeight;
        const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
        
        // Determine target zone with refined thresholds and hysteresis for smoother bidirectional behavior
        let targetZone = 0;
        const currentZone = this.currentScrollZone;
        
        // Add hysteresis to prevent rapid zone switching
        const hysteresis = 0.02; // 2% buffer zone
        
        if (scrollProgress <= 0.40 - (currentZone > 0 ? hysteresis : 0)) {
            targetZone = 0;
        } else if (scrollProgress > 0.40 + (currentZone < 1 ? hysteresis : 0) && 
                   scrollProgress <= 0.66 - (currentZone > 1 ? hysteresis : 0)) {
            targetZone = 1;
        } else if (scrollProgress > 0.66 + (currentZone < 2 ? hysteresis : 0) && 
                   scrollProgress <= 0.76 - (currentZone > 2 ? hysteresis : 0)) {
            targetZone = 2;
        } else if (scrollProgress > 0.76 + (currentZone < 3 ? hysteresis : 0) && 
                   scrollProgress <= 0.86 - (currentZone > 3 ? hysteresis : 0)) {
            targetZone = 3;
        } else if (scrollProgress > 0.86 + (currentZone < 4 ? hysteresis : 0)) {
            targetZone = 4;
        } else {
            // Stay in current zone if within hysteresis buffer
            targetZone = currentZone;
        }

        // Enhanced bidirectional transition handling
        const now = performance.now();
        if (targetZone !== this.currentScrollZone) {
            if (now - this.state.lastTransitionTime < 100) { // Reduced minimum time for more responsive bidirectional
                return;
            }
            
            const direction = targetZone > this.currentScrollZone ? 'forward' : 'backward';
            console.log(`→ ${direction.toUpperCase()}: Zone ${this.currentScrollZone} → ${targetZone} (${(scrollProgress * 100).toFixed(1)}%)`);
            
            this.state.lastTransitionTime = now;
            this.executeZoneTransition(targetZone, direction);
        }

        // CRITICAL FIX: Auto-trigger FRED section if user reaches end without stopping in zone 4
        if (scrollProgress >= 0.95 && this.currentScrollZone < 4) {
            console.log('🎯 Auto-triggering FRED section - user reached end of scroll');
            this.state.lastTransitionTime = now;
            this.executeZoneTransition(4, 'forward');
        }
    }

    // Enhanced zone transitions with proper bidirectional globe handling
    executeZoneTransition(zone, direction = 'forward') {
        const previousZone = this.currentScrollZone;
        this.currentScrollZone = zone;
        
        // Enhanced bidirectional transition logic with proper globe state management
        switch (zone) {
            case 0: // "THE FUTURE IS NOW" only
                this.transitionToZone0(direction, previousZone);
                break;
                
            case 1: // Investment CTA + Texas
                this.transitionToZone1(direction, previousZone);
                break;
                
            case 2: // Innovation + America
                this.transitionToZone2(direction, previousZone);
                break;
                
            case 3: // Capital + Texas
                this.transitionToZone3(direction, previousZone);
                break;
                
            case 4: // FRED section
                this.transitionToZone4(direction, previousZone);
                break;
        }
    }

    // Zone 0: Enhanced bidirectional handling
    transitionToZone0(direction, previousZone) {
        console.log(`🌍 Zone 0: Global view (from ${previousZone}, ${direction})`);
        
        // Always hide CTA and FRED when returning to zone 0
        this.smoothHideCTA();
        this.hideFREDSection();
        
        // Text handling with proper timing
        if (this.state.currentSlideIndex !== 0) {
            this.smoothSwitchToSlide(0, direction);
        }
        
        // Enhanced globe handling - CRITICAL: Proper unzoom to global state
        if (window.GlobeManager) {
            setTimeout(() => {
                window.GlobeManager.updateGlobeState(0); // Global view - unzoom properly
                console.log('🌍 Globe unzoomed to global state');
            }, direction === 'backward' ? 100 : 200);
        }
    }

    // Zone 1: Enhanced bidirectional CTA handling
    transitionToZone1(direction, previousZone) {
        console.log(`💰 Zone 1: CTA + Texas (from ${previousZone}, ${direction})`);
        
        this.hideFREDSection();
        
        // Keep "THE FUTURE IS NOW" active
        if (this.state.currentSlideIndex !== 0) {
            this.smoothSwitchToSlide(0, direction);
        }
        
        // Enhanced CTA timing based on direction
        if (!this.state.ctaActive) {
            const ctaDelay = direction === 'forward' ? 600 : 150; // Faster on backward
            setTimeout(() => this.showInvestmentCTA(), ctaDelay);
        }
        
        // Globe zoom to Texas with proper timing
        if (window.GlobeManager) {
            setTimeout(() => {
                window.GlobeManager.updateGlobeState(2); // Texas focus
                console.log('🌍 Globe zoomed to Texas');
            }, direction === 'backward' ? 50 : 300);
        }
    }

    // Zone 2: Enhanced bidirectional America focus
    transitionToZone2(direction, previousZone) {
        console.log(`🚀 Zone 2: Innovation + America (from ${previousZone}, ${direction})`);
        
        this.smoothHideCTA();
        this.hideFREDSection();
        
        // Switch to innovation text with direction-aware timing
        this.smoothSwitchToSlide(1, direction);
        
        // Globe zoom to America with enhanced timing
        if (window.GlobeManager) {
            setTimeout(() => {
                window.GlobeManager.updateGlobeState(1); // America focus
                console.log('🌍 Globe focused on America');
            }, direction === 'backward' ? 100 : 250);
        }
    }

    // Zone 3: Enhanced bidirectional Texas focus
    transitionToZone3(direction, previousZone) {
        console.log(`💼 Zone 3: Capital + Texas (from ${previousZone}, ${direction})`);
        
        this.smoothHideCTA();
        this.hideFREDSection();
        
        // Switch to capital text
        this.smoothSwitchToSlide(2, direction);
        
        // Globe zoom to Texas with proper timing
        if (window.GlobeManager) {
            setTimeout(() => {
                window.GlobeManager.updateGlobeState(2); // Texas focus
                console.log('🌍 Globe zoomed to Texas for capital');
            }, direction === 'backward' ? 100 : 250);
        }
    }

    // Zone 4: Enhanced FRED transition
    transitionToZone4(direction, previousZone) {
        console.log(`📊 Zone 4: FRED section (from ${previousZone}, ${direction})`);
        
        this.smoothHideCTA();
        
        // Enhanced FRED transition timing
        const fredDelay = direction === 'forward' ? 400 : 200;
        setTimeout(() => this.showFREDSection(), fredDelay);
    }

    // Smooth slide switching with direction awareness
    smoothSwitchToSlide(slideIndex, direction = 'forward') {
        if (this.state.isTransitioning || slideIndex === this.state.currentSlideIndex) return;
        
        console.log(`📝 Switching to slide ${slideIndex + 1} (${direction})`);
        
        this.state.isTransitioning = true;
        this.state.currentSlideIndex = slideIndex;
        this.state.charIndex = 0;
        this.state.isTyping = true;
        
        // Clear all slides efficiently
        for (let i = 0; i < this.config.textSlides.length; i++) {
            const slide = document.getElementById(`slide${i + 1}Text`);
            if (slide) slide.innerHTML = '';
        }
        
        // Optimized transition speeds
        const transitionSpeed = direction === 'backward' ? 350 : 500;
        
        this.state.swiper.slideTo(slideIndex, transitionSpeed);
        
        // Start typing with proper timing
        setTimeout(() => {
            this.typeSlideText();
            setTimeout(() => {
                this.state.isTransitioning = false;
            }, 100); // Small buffer after typing starts
        }, transitionSpeed * 0.4); // Start typing earlier in transition
    }

    // Smooth CTA hiding with proper cleanup
    smoothHideCTA() {
        if (!this.state.ctaActive) return;
        
        console.log('💨 Hiding CTA smoothly');
        
        // Cleanup ticker rotation first
        this.cleanupTickerRotation();
        
        const ctaElement = document.getElementById('investmentCta');
        if (ctaElement) {
            ctaElement.style.transition = 'opacity 0.3s ease-out';
            ctaElement.style.opacity = '0';
            
            setTimeout(() => {
                if (!this.state.ctaActive) { // Double-check state
                    ctaElement.textContent = '';
                    ctaElement.style.transition = '';
                }
            }, 300);
        }
        
        this.state.ctaActive = false;
    }

    // Enhanced FRED section transitions - Fixed to appear from top
    showFREDSection() {
        const fredSection = document.querySelector('.fred-insight');
        if (fredSection && fredSection.dataset.revealed !== 'true') {
            console.log('📊 Revealing FRED section from top');
            
            // CRITICAL FIX: Reset transform to start from top, not middle
            fredSection.style.transform = 'translateY(0)';
            fredSection.style.opacity = '0';
            
            // Smooth fade out of main UI elements with stagger
            const elementsToFade = [
                { selector: '.main-text-container', delay: 0 },
                { selector: '.investment-cta', delay: 100 },
                { selector: '.orderbook', delay: 200 },
                { selector: '.news-ticker', delay: 300 }
            ];
            
            elementsToFade.forEach(({ selector, delay }) => {
                const element = document.querySelector(selector);
                if (element) {
                    setTimeout(() => {
                        element.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                        element.style.opacity = '0.2';
                        element.style.transform = 'translateY(-10px)';
                    }, delay);
                }
            });
            
            // Fade globe
            const globeContainer = document.querySelector('.globe-container');
            if (globeContainer) {
                globeContainer.style.transition = 'opacity 1s ease-out';
                globeContainer.style.opacity = '0.1';
            }
            
            // Reveal FRED section with smooth fade-in animation (no transform change)
            setTimeout(() => {
                fredSection.style.transition = 'opacity 1s ease-out';
                fredSection.style.opacity = '1';
                // Keep transform at translateY(0) to show from beginning
                fredSection.style.transform = 'translateY(0)';
                fredSection.dataset.revealed = 'true';
            }, 500);
        }
    }

    hideFREDSection() {
        const fredSection = document.querySelector('.fred-insight');
        if (fredSection && fredSection.dataset.revealed === 'true') {
            console.log('📊 Hiding FRED section');
            
            // Quick fade out
            fredSection.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            fredSection.style.opacity = '0';
            fredSection.style.transform = 'translateY(30px)';
            fredSection.dataset.revealed = 'false';
            
            // Restore main UI elements with stagger
            setTimeout(() => {
                const elementsToRestore = [
                    { selector: '.main-text-container', delay: 0 },
                    { selector: '.orderbook', delay: 100 },
                    { selector: '.news-ticker', delay: 200 }
                ];
                
                elementsToRestore.forEach(({ selector, delay }) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        setTimeout(() => {
                            element.style.transition = 'opacity 0.6s ease-in, transform 0.6s ease-in';
                            element.style.opacity = '1';
                            element.style.transform = 'translateY(0)';
                        }, delay);
                    }
                });
                
                // Restore globe
                const globeContainer = document.querySelector('.globe-container');
                if (globeContainer) {
                    globeContainer.style.transition = 'opacity 0.8s ease-in';
                    globeContainer.style.opacity = '0.35';
                }
            }, 200);
        }
    }

    // Initialize the text slider
    init() {
        console.log('💫 TextSlider initializing...');
        
        // Validate required elements exist
        const requiredElements = [
            'slide1Text',
            'slide2Text', 
            'slide3Text',
            'investmentCta'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('❌ Missing required elements:', missingElements);
            return;
        }
        
        setTimeout(() => {
            try {
                // Initialize Swiper with error handling
                this.initSwiper();
                
                if (!this.state.swiper) {
                    console.error('❌ Failed to initialize Swiper');
                    return;
                }
                
                // Set initial state
                this.state.currentSlideIndex = 0;
                this.state.charIndex = 0;
                this.state.isTyping = true;
                this.currentScrollZone = 0;
                this.state.lastTransitionTime = 0;
                
                // Start initial typing
                this.state.hasStartedTyping = true;
                this.typeSlideText();
                console.log('✅ Started typing "THE FUTURE IS NOW"');
                
                // Initialize news ticker with delay
                setTimeout(() => {
                    if (window.NewsTickerManager) {
                        window.NewsTickerManager.startTickerSeries();
                        console.log('📰 News ticker started');
                    }
                }, 1200);
                
                // Attach optimized scroll listener
                const scrollHandler = () => this.handleScroll();
                window.addEventListener('scroll', scrollHandler, { passive: true });
                
                // Validate scroll capability
                const scrollInfo = {
                    documentHeight: document.documentElement.scrollHeight,
                    windowHeight: window.innerHeight,
                    bodyHeight: document.body.scrollHeight
                };
                
                const canScroll = scrollInfo.documentHeight > scrollInfo.windowHeight;
                console.log('📏 Scroll info:', { ...scrollInfo, canScroll });
                
                if (!canScroll) {
                    console.warn('⚠️ Page may not have sufficient height for scrolling');
                }
                
                console.log('🚀 TextSlider fully initialized and ready');
                
            } catch (error) {
                console.error('❌ TextSlider initialization failed:', error);
            }
        }, 120); // Slightly longer delay for DOM readiness
    }

    // Cleanup method for proper teardown
    destroy() {
        console.log('🧹 Cleaning up TextSlider...');
        
        // Clear all timers
        if (this.scrollDebounceTimer) clearTimeout(this.scrollDebounceTimer);
        if (this.slowDownTimer) clearTimeout(this.slowDownTimer);
        if (this.frameRequestId) cancelAnimationFrame(this.frameRequestId);
        
        // Cleanup ticker rotation
        this.cleanupTickerRotation();
        
        // Reset state
        this.state.ctaActive = false;
        this.state.isTransitioning = false;
        this.isSlowingDown = false;
        this.scrollHistory = [];
        
        // Destroy swiper
        if (this.state.swiper) {
            this.state.swiper.destroy(true, true);
        }
    }
}

// Enhanced News ticker with better error handling
class NewsTickerManager {
    constructor() {
        this.newsItems = CONFIG.newsItems;
        this.currentNewsIndex = 0;
        this.newsCharIndex = 0;
        this.isNewsTyping = true;
        this.typingTimer = null;
        this.rotationTimer = null;
    }

    startTickerSeries() {
        const newsContent = document.getElementById('newsContent');
        if (!newsContent) {
            console.error('❌ News content element not found');
            return;
        }
        
        const typeNews = () => {
            if (!this.isNewsTyping) return;
            
            const currentNews = this.newsItems[this.currentNewsIndex];
            if (this.newsCharIndex < currentNews.length) {
                newsContent.innerHTML = currentNews.substring(0, this.newsCharIndex + 1) + '<span class="news-cursor">|</span>';
                this.newsCharIndex++;
                this.typingTimer = setTimeout(typeNews, 45 + Math.random() * 25); // Slightly faster, more consistent
            } else {
                newsContent.innerHTML = currentNews + '<span class="news-cursor">|</span>';
                this.rotationTimer = setTimeout(() => {
                    this.currentNewsIndex = (this.currentNewsIndex + 1) % this.newsItems.length;
                    this.newsCharIndex = 0;
                    this.typingTimer = setTimeout(typeNews, 400); // Faster transition
                }, 3500); // Slightly faster news rotation
            }
        };
        
        console.log('📰 Starting news ticker');
        typeNews();
    }

    // Cleanup method
    stop() {
        this.isNewsTyping = false;
        if (this.typingTimer) clearTimeout(this.typingTimer);
        if (this.rotationTimer) clearTimeout(this.rotationTimer);
        console.log('📰 News ticker stopped');
    }
}

// Create global instances
window.TextSliderManager = new TextSlider();
window.NewsTickerManager = new NewsTickerManager();

// NEW: Click-to-begin automated experience system
document.addEventListener('click', () => {
    if (!window.TextSliderManager.autoExperience.hasStarted) {
        window.TextSliderManager.autoExperience.hasStarted = true;
        window.TextSliderManager.startAutoExperience();
    }
});

// Enhanced auto-experience system - click to begin, automated progression
TextSlider.prototype.startAutoExperience = function() {
    if (this.autoExperience.isActive) return;
    
    console.log('🎬 Starting automated experience');
    this.autoExperience.isActive = true;
    
    // Hide initial UI elements
    this.smoothHideCTA();
    this.hideFREDSection();
    
    // Start with the first slide and typing
    this.state.currentSlideIndex = 0;
    this.state.charIndex = 0;
    this.state.isTyping = true;
    this.typeSlideText();
    
    // Schedule automated progression
    const scheduleNextStep = (delay) => {
        this.autoExperience.stepTimer = setTimeout(() => {
            this.autoExperience.currentStep++;
            this.processAutoExperienceStep();
        }, delay);
    };
    
    // Process the current step in the automated experience
    this.processAutoExperienceStep = function() {
        const step = this.autoExperience.currentStep;
        if (step >= this.autoExperience.totalSteps) {
            console.log('🎉 Automated experience completed');
            this.autoExperience.isActive = false;
            return;
        }
        
        console.log(`⏩ Automated experience - Step ${step + 1}`);
        
        switch (step) {
            case 0:
                // Step 0: "THE FUTURE IS NOW" - just wait
                scheduleNextStep(this.autoExperience.stepDurations[step]);
                break;
                
            case 1:
                // Step 1: Show CTA and ticker rotation
                this.showInvestmentCTA();
                this.startTickerRotation();
                scheduleNextStep(this.autoExperience.stepDurations[step]);
                break;
                
            case 2:
                // Step 2: "INNOVATION" text and America view
                this.smoothSwitchToSlide(1, 'forward');
                if (window.GlobeManager) {
                    window.GlobeManager.updateGlobeState(1); // America focus
                }
                scheduleNextStep(this.autoExperience.stepDurations[step]);
                break;
                
            case 3:
                // Step 3: "CAPITAL" text and Texas focus
                this.smoothSwitchToSlide(2, 'forward');
                if (window.GlobeManager) {
                    window.GlobeManager.updateGlobeState(2); // Texas focus
                }
                scheduleNextStep(this.autoExperience.stepDurations[step]);
                break;
                
            case 4:
                // Step 4: FRED section - stay until user interaction
                this.showFREDSection();
                this.autoExperience.stepDurations[step] = 0; // Stay here
                break;
        }
    };
};