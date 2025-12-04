/**
 * HomePage Component
 * Simplified home page with full-page hero and random visualization background
 */
import { Hero } from '../components/index.js';
import { visualizationRegistry } from '../utils/visualization-registry.js';

export class HomePage {
    constructor() {
        this.hero = null;
        this.components = [];
        this.stylesLoaded = false;
        this.visualization = null;
        this.visualizationContainer = null;
        
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
     * Render home page with full-page hero and random visualization
     */
    renderSeparate(onCardClick) {
        // Hero (rendered separately, higher in DOM hierarchy)
        this.hero = new Hero({
            title: 'MOTION\nGRAMMAR',
            subtitle: 'Dynamic design systems'
        });
        this.components.push(this.hero);
        const heroElement = this.hero.render();

        // Load random visualization as background
        this.loadRandomVisualization(heroElement);

        // Empty content container (no grid needed)
        const contentContainer = document.createElement('div');
        contentContainer.className = 'experience';

        return {
            heroElement,
            contentElement: contentContainer
        };
    }

    /**
     * Load a random visualization as the hero background
     */
    async loadRandomVisualization(heroElement) {
        try {
            // Get all available visualizations
            const allVisualizations = visualizationRegistry.getAll();
            
            if (allVisualizations.length === 0) {
                console.warn('No visualizations available');
                return;
            }

            // Pick a random visualization
            const randomIndex = Math.floor(Math.random() * allVisualizations.length);
            const selectedViz = allVisualizations[randomIndex];
            
            console.log(`Loading random visualization: ${selectedViz.title}`);

            // Create visualization container
            this.visualizationContainer = document.createElement('div');
            this.visualizationContainer.className = 'home-visualization-container';
            this.visualizationContainer.style.position = 'absolute';
            this.visualizationContainer.style.top = '0';
            this.visualizationContainer.style.left = '0';
            this.visualizationContainer.style.width = '100vw';
            this.visualizationContainer.style.height = '100vh';
            this.visualizationContainer.style.zIndex = '0';
            this.visualizationContainer.style.pointerEvents = 'none';

            // Insert before hero-frame to be behind text
            const heroFrame = heroElement.querySelector('.hero-frame');
            if (heroFrame) {
                heroElement.insertBefore(this.visualizationContainer, heroFrame);
            } else {
                heroElement.appendChild(this.visualizationContainer);
            }

            // Load and initialize the visualization
            const VisualizationClass = await visualizationRegistry.getVisualizationClass(selectedViz.id);
            this.visualization = new VisualizationClass(this.visualizationContainer);
            
        } catch (error) {
            console.error('Failed to load random visualization:', error);
        }
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
        }
    }

    /**
     * Keep hero fullscreen (no collapse needed)
     */
    async collapseHero(isFirstLoad = false) {
        // Hero stays fullscreen - no collapse animation
        // This method is kept for API compatibility but does nothing
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
        // Cleanup visualization
        if (this.visualization && typeof this.visualization.dispose === 'function') {
            this.visualization.dispose();
        }
        this.visualization = null;
        this.visualizationContainer = null;

        // Cleanup components
        this.components.forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
        this.hero = null;
    }
}

