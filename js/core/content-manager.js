// Content Manager - Handles dynamic content loading

import { HomePage } from '../pages/HomePage.js';
import { Icon, Button, Text, HorizontalSlider } from '../components/index.js';
import { contentRegistry } from '../utils/content-registry.js';

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
        if (this.currentModule) {
            if (typeof this.currentModule.dispose === 'function') {
                this.currentModule.dispose();
            } else if (typeof this.currentModule.destroy === 'function') {
                this.currentModule.destroy();
            }
        }
        this.currentModule = null;
        
        // Cleanup home page
        if (this.homePage) {
            this.homePage.destroy();
            this.homePage = null;
        }
    }

    /**
     * Load content based on type
     */
    async loadContent(itemId, modulePathOrType, contentType = null, initialIndex = 0) {
        // Determine content type
        const content = contentRegistry.get(itemId);
        const type = content?.type || contentType;

        // Route to appropriate loader
        if (type === 'case-study' || type === 'slide-deck') {
            return this.loadSlideContent(itemId, content, initialIndex);
        } else {
            // Default: load as visualization module
            return this.loadExperience(itemId, modulePathOrType);
        }
    }

    /**
     * Load an experience module (visualization)
     */
    async loadExperience(itemId, modulePath) {
        if (this.isTransitioning) {
            return;
        }
        
        this.isTransitioning = true;
        
        try {
            const module = await import(`../${modulePath}.js`);
            
            // Update header
            if (module.header) {
                const titleEl = this.headerElement.querySelector('.page-title');
                const descEl = this.headerElement.querySelector('.page-description');
                if (titleEl) titleEl.innerHTML = module.header.title; // Use innerHTML to support <br>
                if (descEl) descEl.textContent = module.header.description || '';
                
                // Ensure header is visible for experiences
                if (this.headerElement) {
                    this.headerElement.style.display = 'block';
                    // Reset background to transparent to sit over visualization
                    this.headerElement.style.backgroundColor = 'transparent'; 
                    this.headerElement.style.borderBottom = 'none';
                    // Ensure it's centered and positioned correctly
                    this.headerElement.style.position = 'absolute';
                    this.headerElement.style.width = '100%';
                    this.headerElement.style.top = '0';
                    this.headerElement.style.zIndex = '10';
                    this.headerElement.style.pointerEvents = 'none'; // Click through to visualization
                }
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
            this.showError(itemId, modulePath);
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Load slide-based content (case studies, about, etc.)
     */
    async loadSlideContent(itemId, content, initialIndex = 0) {
        if (this.isTransitioning) {
            return;
        }

        this.isTransitioning = true;

        try {
            // Fetch content data
            const response = await fetch(content.dataPath);
            if (!response.ok) throw new Error(`Failed to load ${content.dataPath}`);
            const data = await response.json();

            // Cleanup current content
            this.cleanupCurrentContent();

            // Clear containers
            this.bodyElement.innerHTML = '';
            if (this.heroContainer) this.heroContainer.innerHTML = '';

            // Hide header for slide-based content
            if (this.headerElement) {
                this.headerElement.style.display = 'none';
            }

            // Create horizontal slider
            const slider = new HorizontalSlider({
                slides: data.slides || [],
                initialIndex: initialIndex,
                onSlideChange: (index, slide) => {
                    // Update URL with slide index
                    const url = new URL(window.location);
                    if (index > 0) {
                        url.searchParams.set('slide', index);
                    } else {
                        url.searchParams.delete('slide');
                    }
                    window.history.replaceState({}, '', url);
                }
            });

            const sliderElement = slider.render();
            this.heroContainer.appendChild(sliderElement);
            slider.element = sliderElement; // Store reference for later

            this.currentModule = slider;

        } catch (error) {
            console.error('Error loading slide content:', error);
            this.showError(itemId, content?.dataPath || 'unknown');
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
            this.bodyElement.appendChild(contentElement);
            
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

