// Content Manager - Handles dynamic content loading

import { executeTransition } from './transitions.js';
import { AnimationCarousel } from './animation-carousel.js';
import { HomePage } from '../pages/HomePage.js';
import { Icon, Button, Text } from '../components/index.js';

export class ContentManager {
    constructor(headerElement, bodyElement, heroContainer) {
        this.headerElement = headerElement;
        this.bodyElement = bodyElement;
        this.heroContainer = heroContainer;
        this.isTransitioning = false;
        this.animationCarousel = null;
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
        
        // Cleanup animation carousel
        if (this.animationCarousel) {
            this.animationCarousel.dispose();
            this.animationCarousel = null;
        }
        
        // Cleanup home page component
        if (this.homePage) {
            this.homePage.destroy();
            this.homePage = null;
        }
        
        // Cleanup current module
        if (this.currentModule && typeof this.currentModule.dispose === 'function') {
            this.currentModule.dispose();
        }
        this.currentModule = null;
    }
    
    /**
     * Setup mutation observer to maintain page spacer
     */
    setupSpacerObserver() {
        if (this.spacerObserver) {
            this.spacerObserver.disconnect();
        }
        
        this.spacerObserver = new MutationObserver(() => {
            if (this.needsPageSpacer && !this.bodyElement.querySelector('.page-top-spacer')) {
                const spacer = document.createElement('div');
                spacer.className = 'page-top-spacer';
                spacer.style.height = '100px';
                this.bodyElement.insertBefore(spacer, this.bodyElement.firstChild);
            }
        });
        
        this.spacerObserver.observe(this.bodyElement, {
            childList: true,
            subtree: false
        });
    }

    async loadExperience(itemId, modulePath) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // Scroll to top immediately on navigation start
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // Load the module first
            let module;
            try {
                module = await import(`../${modulePath}.js`);
            } catch (error) {
                console.log(`Module not yet available: ${modulePath}`);
                // Execute transition for error page too
                const hasCurrentHeroContent = this.heroContainer && this.heroContainer.children.length > 0;
                const currentHeroElement = hasCurrentHeroContent ? this.heroContainer.firstElementChild : null;
                
                await executeTransition(this.bodyElement, currentHeroElement, () => {
                    // Cleanup inside transition callback
                    this.cleanupCurrentContent();
                    this.showError(itemId, modulePath);
                    return null; // No hero element for error pages
                });
                this.isTransitioning = false;
                
                // Update header
                const titleEl = this.headerElement.querySelector('.page-title');
                const descEl = this.headerElement.querySelector('.page-description');
                if (titleEl) titleEl.textContent = 'Coming Soon';
                if (descEl) descEl.textContent = 'This section is currently being developed';
                
                return;
            }

            // Update header during transition
            if (module.header) {
                const titleEl = this.headerElement.querySelector('.page-title');
                const descEl = this.headerElement.querySelector('.page-description');
                if (titleEl) titleEl.textContent = module.header.title;
                if (descEl) descEl.textContent = module.header.description || '';
            }

            // Check if current page has hero content (homepage or visualization)
            const hasCurrentHeroContent = this.heroContainer && this.heroContainer.children.length > 0;
            const currentHeroElement = hasCurrentHeroContent ? this.heroContainer.firstElementChild : null;

            // Execute body transition with hero awareness
            await executeTransition(this.bodyElement, currentHeroElement, async () => {
                try {
                    // Cleanup old content INSIDE the transition callback
                    // This ensures transition out animations complete before cleanup
                    this.cleanupCurrentContent();
                    
                    // Clear hero container (used by homepage and visualizations)
                    if (this.heroContainer) {
                        this.heroContainer.innerHTML = '';
                    }
                    
                    // Store new module reference
                    this.currentModule = module;
                    
                    // Clear existing content
                    this.bodyElement.innerHTML = '';
                    
                    // Track if this is a visualization page
                    let isVisualizationPage = false;
                    let newHeroElement = null;
                    
                    // Render the experience (await in case it's async, e.g., visualizations)
                    if (module.render) {
                        const rendered = await module.render(this.bodyElement);
                        
                        // Check if this is a visualization page (returns an element)
                        if (rendered && rendered.nodeType === Node.ELEMENT_NODE) {
                            // Check if it's a visualization container
                            if (rendered.classList.contains('visualization-container')) {
                                isVisualizationPage = true;
                                // Mount to hero-container instead of body
                                if (this.heroContainer) {
                                    this.heroContainer.appendChild(rendered);
                                    newHeroElement = rendered; // Track for transition
                                    
                                    // Force layout recalculation to ensure CSS is applied
                                    // This is critical for correct dimension calculation in revealIn
                                    newHeroElement.offsetHeight;
                                }
                            } else {
                                // Regular content - mount to body if not already there
                                if (!rendered.parentNode) {
                                    this.bodyElement.appendChild(rendered);
                                }
                            }
                        }
                    }
                    
                    // Add top spacer for regular pages (not visualizations)
                    if (!isVisualizationPage) {
                        this.needsPageSpacer = true;
                        
                        // Create initial spacer
                        const spacer = document.createElement('div');
                        spacer.className = 'page-top-spacer';
                        spacer.style.height = '100px';
                        this.bodyElement.insertBefore(spacer, this.bodyElement.firstChild);
                        
                        // Setup observer to maintain spacer when content changes
                        this.setupSpacerObserver();
                    }
                    
                    // Return hero element for transition
                    return newHeroElement;
                } catch (error) {
                    console.error('Error rendering experience:', error);
                    this.showError(itemId, modulePath);
                    return null;
                }
            });
            
            // Initialize interactive components AFTER transition and DOM is ready
            // This is especially important for Three.js visualizations
            if (module.init) {
                requestAnimationFrame(() => {
                    module.init(this.bodyElement);
                });
            }

        } finally {
            this.isTransitioning = false;
        }
    }

    async showWelcome(isFirstLoad = false) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        // Scroll to top immediately on navigation start
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // Update header
            const titleEl = this.headerElement.querySelector('.page-title');
            const descEl = this.headerElement.querySelector('.page-description');
            
            if (titleEl) titleEl.textContent = 'Motion Grammar';
            if (descEl) descEl.textContent = 'Complete product experiences demonstrating holistic motion and interaction design';

            // Check if current page has hero content (homepage or visualization)
            const hasCurrentHeroContent = this.heroContainer && this.heroContainer.children.length > 0;
            const currentHeroElement = hasCurrentHeroContent ? this.heroContainer.firstElementChild : null;

            // Skip reveal animation on first load - just render directly
            if (isFirstLoad) {
                // Cleanup old content
                this.cleanupCurrentContent();
                
                // Create new home page
                this.homePage = new HomePage();
                const { heroElement, contentElement } = this.homePage.renderSeparate((navId) => {
                    // Handle card clicks
                    const navItem = document.querySelector(`.nav-link[data-item-id="${navId}"]`);
                    if (navItem) {
                        navItem.click();
                    }
                });
                
                // Mount hero to hero container (higher in DOM)
                this.heroContainer.innerHTML = '';
                this.heroContainer.appendChild(heroElement);
                
                // Mount content to body
                this.bodyElement.innerHTML = '';
                this.bodyElement.appendChild(contentElement);
                
                // Wait for styles to load before continuing
                await this.homePage.waitForStyles();
                
                // Force layout recalculation
                heroElement.offsetHeight;
                
                // Set hero to fullscreen IMMEDIATELY on first load
                // This ensures it starts at full height before any animations
                if (this.homePage.hero) {
                    this.homePage.hero.setFullscreen(true);
                }
                
                // Setup animations (skip height set since we just did it)
                await this.homePage.setupAnimations(isFirstLoad, true);
            } else {
                // Execute body transition with hero awareness (not first load)
                await executeTransition(this.bodyElement, currentHeroElement, async () => {
                    // Cleanup old content INSIDE transition callback
                    this.cleanupCurrentContent();
                    
                    // Create new home page
                    this.homePage = new HomePage();
                    const { heroElement, contentElement } = this.homePage.renderSeparate((navId) => {
                        // Handle card clicks
                        const navItem = document.querySelector(`.nav-link[data-item-id="${navId}"]`);
                        if (navItem) {
                            navItem.click();
                        }
                    });
                    
                    // Mount hero to hero container (higher in DOM)
                    this.heroContainer.innerHTML = '';
                    this.heroContainer.appendChild(heroElement);
                    
                    // Mount content to body
                    this.bodyElement.innerHTML = '';
                    this.bodyElement.appendChild(contentElement);
                    
                    // Wait for styles to load before continuing
                    await this.homePage.waitForStyles();
                    
                    // Force layout recalculation before setting dimensions
                    // This ensures the DOM is fully updated and computed styles are correct
                    heroElement.offsetHeight; // Force reflow
                    
                    // Set to collapsed (80%) dimensions BEFORE reveal animation
                    // When navigating back, we want the hero to appear at 80% directly, not fullscreen
                    if (this.homePage.hero) {
                        this.homePage.hero.setCollapsed();
                    }
                    
                    // Setup animations (skip height set - already done above)
                    await this.homePage.setupAnimations(isFirstLoad, true);
                    
                    // Return hero element for transition
                    return heroElement;
                });
            }
            
            // Initialize animation carousel AFTER transition completes
            // This needs to happen after DOM is fully rendered
            requestAnimationFrame(() => {
                const homeHero = this.homePage ? this.homePage.getHeroElement() : null;
                console.log('🌋 Initializing animation carousel', { 
                    hasHero: !!homeHero,
                    hasCarousel: !!this.animationCarousel 
                });
                
                if (homeHero) {
                    // Clean up old carousel if it exists
                    if (this.animationCarousel) {
                        console.log('🧹 Cleaning up old animation carousel');
                        this.animationCarousel.dispose();
                        this.animationCarousel = null;
                    }
                    
                    // Create new carousel
                    setTimeout(() => {
                        console.log('🎭 Creating animation carousel (lava lamp)');
                        this.animationCarousel = new AnimationCarousel(homeHero);
                    }, 100);
                } else {
                    console.error('❌ No hero element found for animation carousel!');
                }
            });
            
            // Collapse hero after transition (only on first load)
            // On subsequent navigations, hero is already at collapsed size
            if (this.homePage && isFirstLoad) {
                this.homePage.collapseHero(isFirstLoad);
            }
            
            // If not first load, reveal cards immediately since hero is already collapsed
            if (this.homePage && !isFirstLoad) {
                requestAnimationFrame(() => {
                    if (this.homePage.experienceGrid && this.homePage.experienceGrid.element) {
                        gsap.set(this.homePage.experienceGrid.element, { opacity: 1 });
                        this.homePage.experienceGrid.triggerScaleReveal();
                    }
                    
                    if (this.homePage.principleGrid && this.homePage.principleGrid.element) {
                        this.homePage.principleGrid.triggerScaleReveal();
                    }
                });
            }
            
        } finally {
            this.isTransitioning = false;
        }
    }

    // Hero width now handled by CSS and container - no resize handler needed

    showError(itemId, modulePath) {
        // Get the title from navigation data
        const navItem = document.querySelector(`[data-item-id="${itemId}"]`);
        const itemTitle = navItem ? navItem.textContent : modulePath;
        
        // Update header
        const titleEl = this.headerElement.querySelector('.page-title');
        const descEl = this.headerElement.querySelector('.page-description');
        if (titleEl) titleEl.textContent = 'Coming Soon';
        if (descEl) descEl.textContent = `This section is currently being developed`;
        
        // Remove any legacy injected style tags (cleanup old behavior)
        const oldStyleTag = document.getElementById('coming-soon-styles');
        if (oldStyleTag) {
            oldStyleTag.remove();
        }
        
        // Render coming soon page using components
        this.bodyElement.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'experience';
        
        const section = document.createElement('div');
        section.className = 'experience-section';
        
        const container = document.createElement('div');
        container.className = 'coming-soon-container';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'coming-soon-icon';
        iconWrapper.innerHTML = '<i class="bx bx-time-five"></i>';
        container.appendChild(iconWrapper);
        
        const title = document.createElement('h2');
        title.className = 'coming-soon-title';
        title.textContent = itemTitle;
        container.appendChild(title);
        
        const desc = document.createElement('p');
        desc.className = 'coming-soon-description';
        desc.textContent = 'This section is currently being developed and will be available soon.';
        container.appendChild(desc);
        
        const details = document.createElement('div');
        details.className = 'coming-soon-details';
        details.innerHTML = `
            <h4>Available Experiences:</h4>
            <ul>
                <li><strong>✅ Home</strong> - Animated hero with experience showcase</li>
                <li><strong>✅ Task Management</strong> - Complete workflow with CRUD operations</li>
            </ul>
        `;
        container.appendChild(details);
        
        const backBtn = new Button({
            variant: 'primary',
            iconLeft: 'bx-arrow-back',
            text: 'Go Back',
            onClick: () => window.history.back()
        });
        container.appendChild(backBtn.render());
        
        section.appendChild(container);
        wrapper.appendChild(section);
        this.bodyElement.appendChild(wrapper);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

