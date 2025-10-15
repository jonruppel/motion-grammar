/**
 * HomePage Component
 * Complete home page with hero, experience cards, and principle section
 */
import { Hero, CardGrid, Section } from '../components/index.js';

export class HomePage {
    constructor() {
        this.hero = null;
        this.experienceGrid = null;
        this.principleGrid = null;
        this.principleSection = null;
        this.components = [];
        this.stylesLoaded = false;
        
        // Start loading page-specific styles
        this.styleLoadPromise = this.loadPageStyles();
    }
    
    /**
     * Load page-specific CSS
     * Returns a promise that resolves when the stylesheet is loaded
     */
    loadPageStyles() {
        const styleId = 'home-page-styles';
        const existingLink = document.getElementById(styleId);
        
        // If stylesheet already exists, resolve immediately
        if (existingLink) {
            this.stylesLoaded = true;
            return Promise.resolve();
        }
        
        // Create and load new stylesheet
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = './styles/pages/home.css';
            
            // Wait for stylesheet to load
            link.onload = () => {
                this.stylesLoaded = true;
                resolve();
            };
            link.onerror = () => {
                console.warn('Failed to load home.css, but continuing anyway');
                this.stylesLoaded = true;
                resolve(); // Resolve anyway to not block rendering
            };
            
            document.head.appendChild(link);
        });
    }
    
    /**
     * Wait for styles to be loaded before continuing
     */
    async waitForStyles() {
        if (this.styleLoadPromise) {
            await this.styleLoadPromise;
        }
    }

    /**
     * Experience cards data
     */
    static get experienceCards() {
        return [
            {
                icon: 'bx-task',
                title: 'Task Management System',
                description: 'A complete workflow from creating tasks to organizing and completing them. Demonstrates timing hierarchy, spatial relationships, and satisfying feedback patterns.',
                meta: ['🎯 Full User Flow', '⚡ Motion System'],
                dataset: { nav: 'exp-tasks' }
            },
            {
                icon: 'bx-cart',
                title: 'E-Commerce Checkout',
                description: 'Browse to purchase journey with product detail, cart management, and checkout flow. Shows how motion builds confidence and reduces anxiety during transactions.',
                meta: ['🛍️ Complete Flow', '💳 Multi-Step'],
                dataset: { nav: 'exp-ecommerce' }
            },
            {
                icon: 'bx-bar-chart-alt-2',
                title: 'Analytics Dashboard',
                description: 'Data visualization with progressive loading, drill-down interactions, and smooth transitions between views. Demonstrates choreography and data morphing patterns.',
                meta: ['📊 Data Viz', '🎭 Choreography'],
                dataset: { nav: 'exp-dashboard' }
            },
            {
                icon: 'bx-cloud-rain',
                title: 'Weather Experience',
                description: 'Real-time weather visualization with smooth animations and delightful micro-interactions. Shows how motion can make data feel alive and engaging.',
                meta: ['☀️ Real-time Data', '🌈 Visual Design'],
                dataset: { nav: 'exp-weather' }
            },
            {
                icon: 'bx-user-plus',
                title: 'User Onboarding',
                description: 'Multi-step setup flow with progress indication, validation feedback, and preview states. Shows how motion can make complex processes feel simple and achievable.',
                meta: ['📝 Multi-Step', '✨ Progressive'],
                dataset: { nav: 'exp-onboarding' }
            },
            {
                icon: 'bx-line-chart',
                title: 'Stock Market Dashboard',
                description: 'Real-time stock market data with interactive charts and smooth transitions. Demonstrates how motion can help users track and understand complex financial data.',
                meta: ['📈 Financial Data', '⚡ Real-time Updates'],
                dataset: { nav: 'exp-stocks' }
            }
        ];
    }

    /**
     * Principle cards data
     */
    static get principleCards() {
        return [];
    }

    
    /**
     * Render home page with hero separate from content
     */
    renderSeparate(onCardClick) {
        // Hero (rendered separately, higher in DOM hierarchy)
        this.hero = new Hero({
            title: 'Motion\nGrammar',
            subtitle: 'Dynamic design systems'
        });
        this.components.push(this.hero);
        const heroElement = this.hero.render();

        // Content container (everything else)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'experience';

        // Experience cards
        this.experienceGrid = new CardGrid({
            cards: HomePage.experienceCards,
            variant: 'experience',
            onCardClick: (cardData) => {
                if (onCardClick && cardData.dataset && cardData.dataset.nav) {
                    onCardClick(cardData.dataset.nav);
                }
            }
        });
        this.components.push(this.experienceGrid);
        contentContainer.appendChild(this.experienceGrid.render());

        return {
            heroElement,
            contentElement: contentContainer
        };
    }

    /**
     * Setup animations (async to wait for styles)
     */
    async setupAnimations(isFirstLoad = false, skipHeightSet = false) {
        // Wait for styles to load before setting dimensions
        await this.waitForStyles();
        
        // Set hero to fullscreen initially (unless it was just revealed)
        if (this.hero && !skipHeightSet) {
            this.hero.setFullscreen(isFirstLoad);
        }
        
        if (this.hero) {
            // Animate title and subtitle
            requestAnimationFrame(() => {
                this.hero.animateTitle();
                this.hero.animateSubtitle();
            });

            // Hide experience grid initially
            if (this.experienceGrid && this.experienceGrid.element) {
                gsap.set(this.experienceGrid.element, { opacity: 0 });
            }
        }

        // Setup GSAP hover effects on cards
        requestAnimationFrame(() => {
            if (this.experienceGrid && this.experienceGrid.element) {
                window.setupGSAPHovers(this.experienceGrid.element, '.experience-card');
            }
        });
    }

    /**
     * Collapse hero and reveal cards
     */
    async collapseHero(isFirstLoad = false) {
        // Ensure styles are loaded before calculating dimensions
        await this.waitForStyles();
        
        const delay = 600;
        
        setTimeout(() => {
            if (this.hero && this.hero.element) {
                // Get current margins to calculate available height
                const computedStyle = window.getComputedStyle(this.hero.element);
                const marginTop = parseFloat(computedStyle.marginTop) || 0;
                const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
                
                // Calculate 80% of available height (viewport minus margins)
                const availableHeight = window.innerHeight - marginTop - marginBottom;
                const targetHeight = availableHeight * 0.8;
                
                const tl = gsap.timeline();
                
                // Animate height collapse only
                // Width is handled by the hero-container in CSS
                tl.to(this.hero.element, {
                    height: targetHeight,
                    duration: 1.0,
                    ease: 'expo.inOut'
                }, 0);
                
                // Clean up after animations complete
                // No props to clear - height stays set, layout is handled by CSS
                tl.call(() => {
                    // Callback for potential future use
                });
                
                // Reveal experience grid after hero collapse
                tl.call(() => {
                    if (this.experienceGrid && this.experienceGrid.element) {
                        gsap.set(this.experienceGrid.element, { opacity: 1 });
                        this.experienceGrid.triggerScaleReveal();
                    }
                }, null, 0.5); // Start cards 0.5s after hero collapse begins
            }
        }, delay);
    }

    /**
     * Get hero element for lava lamp
     */
    getHeroElement() {
        return this.hero ? this.hero.element : null;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.components.forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
        this.hero = null;
        this.experienceGrid = null;
        // Remove principle references
    }
}

