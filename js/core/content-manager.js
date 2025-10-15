// Content Manager - Handles dynamic content loading

import { HomePage } from '../pages/HomePage.js';
import { Icon, Button, Text } from '../components/index.js';

export class ContentManager {
    constructor(headerElement, bodyElement, heroContainer) {
        this.headerElement = headerElement;
        this.bodyElement = bodyElement;
        this.heroContainer = heroContainer;
        this.isTransitioning = false;
        this.currentModule = null; // Track current module for cleanup
        this.homePage = null; // Track home page component
        this.spacerObserver = null; // Track mutation observer for spacer
        this.needsPageSpacer = false; // Track if current page needs spacer
    }

    /**
     * Cleanup current page content
     * Should be called INSIDE transition callback to preserve content during exit animation
     */
    cleanupCurrentContent() {
        // Cleanup spacer observer
        if (this.spacerObserver) {
            this.spacerObserver.disconnect();
            this.spacerObserver = null;
        }
        this.needsPageSpacer = false;
        
        // Cleanup current module
        if (this.currentModule && typeof this.currentModule.dispose === 'function') {
            this.currentModule.dispose();
        }
        this.currentModule = null;
        
        // Cleanup home page
        if (this.homePage) {
            this.homePage.destroy();
            this.homePage = null;
        }
    }

    /**
     * Load an experience module
     */
    async loadExperience(itemId, modulePath) {
        if (this.isTransitioning) {
            console.warn('Already transitioning, skipping load');
            return;
        }
        
        this.isTransitioning = true;
        
        try {
            const module = await import(`../${modulePath}.js`);
            
            // Update header
            if (module.header) {
                const titleEl = this.headerElement.querySelector('.page-title');
                const descEl = this.headerElement.querySelector('.page-description');
                if (titleEl) titleEl.textContent = module.header.title;
                if (descEl) descEl.textContent = module.header.description || '';
            }
            
            // Cleanup current content
            this.cleanupCurrentContent();
            
            // Clear containers
            this.bodyElement.innerHTML = '';
            if (this.heroContainer) this.heroContainer.innerHTML = '';

            // Load new content
            this.currentModule = module;
            if (module.render) {
                const rendered = await module.render(this.bodyElement, itemId);
                
                // Handle visualization containers
                if (rendered && rendered.nodeType === Node.ELEMENT_NODE && 
                    rendered.classList.contains('visualization-container') && 
                    this.heroContainer) {
                    this.heroContainer.appendChild(rendered);
                }
            }

            // Initialize if needed
            if (module.init) {
                module.init(this.bodyElement);
            }

        } catch (error) {
            console.error('Error loading experience:', error);
            this.showError(itemId, modulePath);
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Show welcome/home page
     */
    async showWelcome() {
        if (this.isTransitioning) {
            console.warn('Already transitioning, skipping welcome');
            return;
        }
        
        this.isTransitioning = true;
        
        try {
            this.cleanupCurrentContent();
            this.bodyElement.innerHTML = '';
            if (this.heroContainer) this.heroContainer.innerHTML = '';

            this.homePage = new HomePage();
            const { heroElement, contentElement } = this.homePage.renderSeparate();
            
            if (this.heroContainer && heroElement) {
                this.heroContainer.appendChild(heroElement);
            }
            this.body极速赛车开奖官网开奖结果>            
            await this.homePage.setupAnimations();
            
        } catch (error) {
            console.error('Error showing welcome:', error);
            this.showError('home', 'pages/HomePage');
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Show error state
     */
    showError(itemId, modulePath) {
        this.bodyElement.innerHTML = `
            <div class="coming-soon-container">
                <div class="coming-soon-icon"><i class="bx bx-time-five"></i></div>
                <h2 class="coming-soon-title">Coming Soon</h2>
                <p class="coming-soon-description">This visualization is currently being developed</p>
            </div>
        `;
    }
}

