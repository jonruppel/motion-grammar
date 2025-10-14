// Main Application Entry Point

import { Navigation } from './core/navigation.js';
import { ContentManager } from './core/content-manager.js';
import { navigationData } from './core/navigation.js';

class App {
    constructor() {
        this.navigation = null;
        this.contentManager = null;
        this.isReady = false;
        this.isFirstLoad = true;
    }

    // Helper to find module path by experience ID
    findModuleById(data, id) {
        for (let group of data) {
            if (group.children) {
                const item = group.children.find(child => child.id === id);
                if (item) {
                    return item.module;
                }
            }
        }
        return null;
    }

    async init() {
        console.log('🚀 Initializing Design Systems in Motion...');

        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize navigation
        const navContainer = document.querySelector('.nav-content');
        this.navigation = new Navigation(navContainer);
        this.navigation.render();

        // Ensure child components are fully initialized before setting active state
        setTimeout(() => {
            this.navigation.setActiveFromUrl();
        }, 0);

        // Fallback: Direct DOM manipulation to ensure active state is set
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const experienceId = params.get('experience');
            
            if (experienceId) {
                console.log('Fallback: Setting active state via direct DOM manipulation for', experienceId);
                // Find all nav links and reset active state
                const allNavLinks = document.querySelectorAll('.nav-link');
                allNavLinks.forEach(link => link.classList.remove('active'));
                
                // Find the matching nav link by data-item-id and add active class
                const targetLink = document.querySelector(`.nav-link[data-item-id="${experienceId}"]`);
                if (targetLink) {
                    console.log('Fallback: Found target link, adding active class:', targetLink);
                    targetLink.classList.add('active');
                } else {
                    console.log('Fallback: No matching nav link found for', experienceId);
                }
            }
        }, 50);

        // Initialize content manager
        const headerElement = document.querySelector('.content-header');
        const bodyElement = document.querySelector('.content-body');
        const heroContainer = document.querySelector('.hero-container');
        this.contentManager = new ContentManager(headerElement, bodyElement, heroContainer);

        // Connect navigation to content
        this.navigation.onNavigate = (itemId, modulePath) => {
            this.loadExperience(itemId, modulePath);
        };

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup mobile preview
        this.setupMobilePreview();

        // Setup mobile menu
        this.setupMobileMenu();

        // Setup logo click to return home
        this.setupLogoClick();

        // Check if we're loading an experience (not homepage) on first load
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        
        // If loading an experience on first load, make app visible immediately
        // so the reveal transition will be visible
        if (experienceId && this.isFirstLoad) {
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                gsap.set(appContainer, { opacity: 1 });
            }
        }

        // Handle URL navigation (load initial content) - active state already set above
        await this.handleUrlNavigation();

        // Hide loader
        this.hideLoader();

        // First load animation (now that content is loaded)
        await this.animateFirstLoad();

        // Setup resize handler to manage nav state across breakpoints
        this.setupResizeHandler();

        // Mark first load as complete
        this.isFirstLoad = false;

        this.isReady = true;
        console.log('✅ App ready');
    }

    async loadExperience(itemId, modulePath) {
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('experience', itemId);
        window.history.pushState({}, '', url);

        // Update active nav
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            console.log('loadExperience: Direct DOM update for active state:', itemId);
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Load content
        await this.contentManager.loadExperience(itemId, modulePath);

        // Close mobile menu
        this.closeMobileMenu();
    }

    async loadFromUrl(itemId, modulePath) {
        console.log('loadFromUrl called with itemId:', itemId, 'modulePath:', modulePath);
        // Update active nav
        console.log('loadFromUrl: Calling setActive with', itemId);
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            console.log('loadFromUrl: Direct DOM update for active state:', itemId);
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Load content
        await this.contentManager.loadExperience(itemId, modulePath);

        // Close mobile menu
        this.closeMobileMenu();
    }

    async handleUrlNavigation() {
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');

        if (experienceId) {
            // Find the module path using navigationData
            const modulePath = this.findModuleById(navigationData, experienceId);
            if (modulePath) {
                // Active nav already set via setActiveFromUrl on initial load
                // For popstate, set it again
                if (!this.isFirstLoad) {
                    this.navigation.setActive(experienceId);
                }
                // Load content
                await this.contentManager.loadExperience(experienceId, modulePath);
                return;
            }
        }

        // Clear active nav state for homepage
        this.navigation.setActive(null);

        // Show welcome screen
        await this.contentManager.showWelcome(this.isFirstLoad);
    }

    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        const icon = toggle.querySelector('i');

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        icon.className = savedTheme === 'dark' ? 'bx bx-moon' : 'bx bx-sun';

        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            icon.className = newTheme === 'dark' ? 'bx bx-moon' : 'bx bx-sun';
            
            // Dispatch custom event for theme changes
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: newTheme }
            }));
        });
    }

    setupMobilePreview() {
        const toggle = document.getElementById('mobilePreviewToggle');
        if (!toggle) return;

        this.mobilePreviewToggle = toggle;
        this.outsideClickHandler = null;

        toggle.addEventListener('click', () => {
            const isMobilePreview = toggle.classList.contains('active');
            
            if (!isMobilePreview) {
                this.enableMobilePreview(toggle);
            } else {
                this.disableMobilePreview(toggle);
            }
        });
        
        // Handle window resize - exit mockup mode if resizing below 768px
        this.handleMobilePreviewResize();
        window.addEventListener('resize', () => this.handleMobilePreviewResize());
    }
    
    handleMobilePreviewResize() {
        const toggle = document.getElementById('mobilePreviewToggle');
        if (!toggle) return;
        
        const isMobilePreview = toggle.classList.contains('active');
        const isBelowBreakpoint = window.innerWidth < 768;
        
        // If we're in mockup mode and resize below 768px, exit mockup mode
        if (isMobilePreview && isBelowBreakpoint) {
            this.disableMobilePreview(toggle);
        }
    }

    enableMobilePreview(toggle) {
        // Add active class to toggle button
        toggle.classList.add('active');

        // Pause animation carousel during transition for performance
        if (this.contentManager?.animationCarousel) {
            this.contentManager.animationCarousel.pause();
        }
        
        // Pause current mood experience during transition for performance
        if (this.contentManager?.currentModule && typeof this.contentManager.currentModule.pause === 'function') {
            this.contentManager.currentModule.pause();
        }

        // Close any open mobile menu first
        this.closeMobileMenu();

        // Get the body element
        const body = document.body;
        
        // Store original classes
        body.dataset.originalClass = body.className;
        
        // Add mobile preview class
        body.classList.add('mobile-preview-active');

        // Create iPhone mockup structure
        const appContainer = document.querySelector('.app-container');
        const mainContent = document.querySelector('.main-content');
        
        // Create wrapper for click-outside functionality
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-preview-wrapper-outer';
        wrapper.id = 'mobilePreviewWrapper';
        
        // Create mockup container (start hidden to allow canvas to render first)
        const mockupContainer = document.createElement('div');
        mockupContainer.className = 'iphone-mockup iphone-mockup-pre-animation';
        mockupContainer.innerHTML = `
            <div class="iphone-button power"></div>
            <div class="iphone-button volume-up"></div>
            <div class="iphone-button volume-down"></div>
            <div class="iphone-button mute"></div>
            <div class="iphone-screen">
                <div class="iphone-notch">
                    <div class="iphone-speaker"></div>
                    <div class="iphone-camera"></div>
                </div>
                <div class="iphone-content" id="iphoneContent"></div>
            </div>
        `;

        // Nest mockup in wrapper
        wrapper.appendChild(mockupContainer);

        // Insert wrapper and move content
        body.insertBefore(wrapper, body.firstChild);
        
        // Move app container into iPhone screen
        const iphoneContent = document.getElementById('iphoneContent');
        iphoneContent.appendChild(appContainer);
        
        // Render canvas frames, then start mockup animation
        if (this.contentManager?.animationCarousel) {
            // Use requestAnimationFrame to ensure DOM has fully updated
            requestAnimationFrame(() => {
                // Force resize check before rendering to match new container size
                this.contentManager.animationCarousel.renderSingleFrame(true);
                
                // Wait for canvas to fully render before starting mockup animation
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        mockupContainer.classList.remove('iphone-mockup-pre-animation');
                    });
                }, 100); // Small delay to ensure canvas is visible
            });
        } else {
            // No animation carousel, start animation immediately
            requestAnimationFrame(() => {
                mockupContainer.classList.remove('iphone-mockup-pre-animation');
            });
        }

        // Add preview badge
        const badge = document.createElement('div');
        badge.className = 'mobile-preview-badge';
        badge.textContent = 'Mobile Preview • 390×844';
        body.appendChild(badge);

        // Add click handler to close menu when clicking outside iPhone
        this.setupOutsideClickHandler(mockupContainer);
        
        // Resume animation carousel after transition completes (100ms delay + 0.6s animation)
        setTimeout(() => {
            // Use requestAnimationFrame to ensure DOM has fully settled
            requestAnimationFrame(() => {
                if (this.contentManager?.animationCarousel) {
                    this.contentManager.animationCarousel.resume();
                }
                
                // Resume current mood experience after transition completes
                if (this.contentManager?.currentModule && typeof this.contentManager.currentModule.resume === 'function') {
                    this.contentManager.currentModule.resume();
                }
            });
        }, 750); // Wait for 100ms delay + 650ms mockup zoom-in animation
    }

    setupOutsideClickHandler(mockupContainer) {
        // Get the wrapper element
        const wrapper = document.getElementById('mobilePreviewWrapper');
        if (!wrapper) return;

        // Listen for clicks anywhere in the wrapper
        this.outsideClickHandler = (e) => {
            const mockup = document.querySelector('.iphone-mockup');
            const toggle = document.getElementById('mobilePreviewToggle');
            
            // Check if click is outside the mockup (exit mobile preview mode)
            if (mockup && !mockup.contains(e.target)) {
                // Exit mobile preview mode entirely
                this.disableMobilePreview(toggle);
            }
        };

        // Add click handler to the wrapper
        wrapper.addEventListener('click', this.outsideClickHandler);
    }

    disableMobilePreview(toggle) {
        // Remove active class from toggle button
        toggle.classList.remove('active');
        
        // Pause animation carousel during transition for performance
        if (this.contentManager?.animationCarousel) {
            this.contentManager.animationCarousel.pause();
        }
        
        // Pause current mood experience during transition for performance
        if (this.contentManager?.currentModule && typeof this.contentManager.currentModule.pause === 'function') {
            this.contentManager.currentModule.pause();
        }

        const body = document.body;
        const appContainer = document.querySelector('.app-container');
        const wrapper = document.getElementById('mobilePreviewWrapper');
        const badge = document.querySelector('.mobile-preview-badge');
        const mockup = document.querySelector('.iphone-mockup');

        // Remove outside click handler
        if (this.outsideClickHandler) {
            const wrapperElement = document.getElementById('mobilePreviewWrapper');
            if (wrapperElement) {
                wrapperElement.removeEventListener('click', this.outsideClickHandler);
            }
            this.outsideClickHandler = null;
        }

        // Trigger zoom out animation
        if (mockup) {
            mockup.classList.add('mockup-exiting');
        }

        // Wait for animation to complete before removing elements
        setTimeout(() => {
            // Disable transitions temporarily for instant switch
            if (appContainer) {
                appContainer.style.transition = 'none';
                appContainer.style.animation = 'none';
            }

            // Move app container back to body
            if (appContainer && wrapper) {
                body.insertBefore(appContainer, body.firstChild);
            }
            
            // Render a single frame immediately after DOM move to prevent black canvas
            if (this.contentManager?.animationCarousel) {
                // Use requestAnimationFrame to ensure DOM has fully updated
                requestAnimationFrame(() => {
                    // Force resize check before rendering to match new container size
                    this.contentManager.animationCarousel.renderSingleFrame(true);
                });
            }

            // Remove wrapper and badge
            if (wrapper) wrapper.remove();
            if (badge) badge.remove();

            // Remove mobile preview class
            body.classList.remove('mobile-preview-active');

            // Re-enable transitions after a frame
            if (appContainer) {
                requestAnimationFrame(() => {
                    appContainer.style.transition = '';
                    appContainer.style.animation = '';
                });
            }
            
            // Resume animation carousel after exit transition completes
            // Use requestAnimationFrame to ensure DOM has fully settled
            requestAnimationFrame(() => {
                if (this.contentManager?.animationCarousel) {
                    this.contentManager.animationCarousel.resume();
                }
                
                // Resume current mood experience after exit transition completes
                if (this.contentManager?.currentModule && typeof this.contentManager.currentModule.resume === 'function') {
                    this.contentManager.currentModule.resume();
                }
            });
        }, 500); // Match animation duration
    }

    setupMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (!toggle || !sidebar || !overlay) {
            console.error('Mobile menu elements not found:', { toggle, sidebar, overlay });
            return;
        }

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
            toggle.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
    }

    setupLogoClick() {
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => {
                // Clear URL parameters
                window.history.pushState({}, '', window.location.pathname);
                
                // Clear active nav state
                this.navigation.setActive(null);
                
                // Direct DOM update to clear all active states
                setTimeout(() => {
                    console.log('logoClick: Clearing all active states');
                    const allNavLinks = document.querySelectorAll('.nav-link');
                    allNavLinks.forEach(link => link.classList.remove('active'));
                }, 0);
                
                // Close mobile nav if open
                this.closeMobileMenu();
                
                // Show welcome screen
                this.contentManager.showWelcome();
            });
        }
    }

    async animateFirstLoad() {
        const appContainer = document.querySelector('.app-container');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const isDesktop = window.innerWidth > 768;
        const isHomepage = !!document.querySelector('.home-hero');
        const hasVisualization = !!document.querySelector('.visualization-container');

        // Check if app container is already visible (from loading experience on first load)
        const isAlreadyVisible = appContainer && parseFloat(window.getComputedStyle(appContainer).opacity) === 1;
        
        // Fade in app container if not already visible
        if (!isAlreadyVisible && appContainer) {
            gsap.to(appContainer, {
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out'
            });
        }

        if (isDesktop && isHomepage) {
            // DESKTOP HOMEPAGE: Content starts full width, nav slides in and pushes content
            
            // Set initial states
            gsap.set(sidebar, { 
                x: -280, 
                opacity: 0 
            });
            
            gsap.set(mainContent, { 
                position: 'absolute',
                right: 0,
                width: '100%',
                opacity: 0,
                y: 20
            });

            // Fade in content at full width
            await gsap.to(mainContent, {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power2.out'
            });

            // Wait for cards to finish animating before nav flies in
            // Match hero collapse delay: 600ms
            await new Promise(resolve => setTimeout(resolve, 600));

            // Animate nav in AND resize content simultaneously
            // Match hero collapse timing: 1.0s duration, expo.inOut ease
            const tl = gsap.timeline();
            
            // Nav slides in
            tl.to(sidebar, {
                x: 0,
                opacity: 1,
                duration: 1.0,
                ease: 'expo.inOut'
            }, 0);
            
            // Content resizes to accommodate nav (which includes hero-container)
            tl.to(mainContent, {
                width: 'calc(100% - 280px)',
                duration: 1.0,
                ease: 'expo.inOut'
            }, 0);

            await tl;

            // Reset to static positioning (let CSS take over)
            gsap.set(mainContent, {
                clearProps: 'position,right,width'
            });

        } else if (isDesktop && hasVisualization) {
            // DESKTOP VISUALIZATION: Nav visible, main content visible for transition
            // The visualization's revealIn transition will handle the hero animation
            gsap.set(sidebar, { x: 0, opacity: 1 });
            
            // Set main content to visible immediately so transition can be seen
            gsap.set(mainContent, { opacity: 1 });

        } else if (isDesktop) {
            // DESKTOP OTHER PAGES: Nav already visible, simple fade in
            gsap.set(sidebar, { x: 0, opacity: 1 });

            await gsap.fromTo(mainContent,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                }
            );

        } else if (hasVisualization) {
            // MOBILE VISUALIZATION: Sidebar off-screen, main content visible for transition
            // The visualization's revealIn transition will handle the hero animation
            gsap.set(sidebar, { x: '-100%', opacity: 1 });
            
            // Set main content to visible immediately so transition can be seen
            gsap.set(mainContent, { opacity: 1 });
            
        } else {
            // MOBILE OTHER PAGES: Simple fade in
            gsap.set(sidebar, { x: '-100%', opacity: 1 });

            await gsap.fromTo(mainContent,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                }
            );
        }
    }

    setupResizeHandler() {
        let previousWidth = window.innerWidth;
        
        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            if (!sidebar || !mainContent) return;
            
            // Check if we crossed the desktop/mobile breakpoint
            const wasDesktop = previousWidth > 768;
            const isDesktop = currentWidth > 768;
            
            if (wasDesktop && !isDesktop) {
                // Crossed from desktop → mobile
                // Hide sidebar off-screen (unless mobile menu is explicitly open)
                const isMobileMenuOpen = sidebar.classList.contains('mobile-open');
                
                if (!isMobileMenuOpen) {
                    gsap.set(sidebar, { 
                        x: '-100%',
                        opacity: 1,
                        clearProps: 'transform' // Let CSS transitions take over
                    });
                }
                
                // Reset main content - clear GSAP inline styles, let CSS handle layout
                gsap.set(mainContent, {
                    clearProps: 'position,right,width'
                });
                
            } else if (!wasDesktop && isDesktop) {
                // Crossed from mobile → desktop
                // Show sidebar
                gsap.set(sidebar, { 
                    x: 0,
                    opacity: 1,
                    clearProps: 'transform'
                });
                
                // Reset main content - clear GSAP inline styles, let CSS handle layout
                gsap.set(mainContent, {
                    clearProps: 'position,right,width'
                });
            }
            
            previousWidth = currentWidth;
        });
    }

    hideLoader() {
        const loader = document.getElementById('pageLoader');
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 500);
    }
}

// Global animation utility using GSAP
window.triggerScaleReveal = function(container, selector = '.scale-reveal') {
    const elements = container.querySelectorAll(selector);
    
    if (elements.length === 0) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        gsap.set(elements, {
            clipPath: 'inset(0% 0% 0% 0% round 12px)',
            opacity: 1
        });
        return;
    }
    
    // Get the border radius from each element (or use default)
    elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const borderRadius = computedStyle.borderRadius || '12px';
        
        // Store the border radius on the element for transition out
        element.dataset.borderRadius = borderRadius;
        
        // Set initial state - small dot at top-left corner
        gsap.set(element, {
            clipPath: `inset(0% 100% 100% 0% round ${borderRadius})`,
            opacity: 1
        });
        
        // Animate to full reveal
        gsap.to(element, {
            clipPath: `inset(0% 0% 0% 0% round ${borderRadius})`,
            duration: 0.8,
            ease: 'expo.out',
            delay: index * 0.1,
            onComplete: () => {
                // Ensure clip-path stays set for transition out
                gsap.set(element, {
                    clipPath: `inset(0% 0% 0% 0% round ${borderRadius})`
                });
            }
        });
    });
};

// Global GSAP hover system - systematic approach
window.setupGSAPHovers = function(container, selector, options = {}) {
    const elements = container.querySelectorAll(selector);
    
    if (elements.length === 0) return;
    
    // Default hover configuration
    const config = {
        y: -4,
        scale: 1.02,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
        duration: 0.3,
        ease: 'power2.out',
        ...options
    };
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // Skip hover effects
    
    elements.forEach(element => {
        // Store original box-shadow for restoration
        const originalBoxShadow = window.getComputedStyle(element).boxShadow;
        
        element.addEventListener('mouseenter', () => {
            // Kill any ongoing animations on this element
            gsap.killTweensOf(element);
            
            // Animate to hover state
            gsap.to(element, {
                y: config.y,
                scale: config.scale,
                boxShadow: config.boxShadow,
                duration: config.duration,
                ease: config.ease,
                overwrite: 'auto'
            });
        });
        
        element.addEventListener('mouseleave', () => {
            // Kill any ongoing animations on this element
            gsap.killTweensOf(element);
            
            // Animate back to default state
            gsap.to(element, {
                y: 0,
                scale: 1,
                boxShadow: originalBoxShadow,
                duration: config.duration,
                ease: config.ease,
                overwrite: 'auto'
            });
        });
    });
};

// Initialize app
const app = new App();
app.init();

// Handle browser back/forward
window.addEventListener('popstate', () => {
    if (app.isReady) {
        app.handleUrlNavigation();
    }
});

