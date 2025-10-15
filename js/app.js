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
        this.isTransitioning = false;
        this.modules = [];
        this.currentModuleIndex = 0;
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
                // Find all nav links and reset active state
                const allNavLinks = document.querySelectorAll('.nav-link');
                allNavLinks.forEach(link => link.classList.remove('active'));
                
                // Find the matching nav link by data-item-id and add active class
                const targetLink = document.querySelector(`.nav-link[data-item-id="${experienceId}"]`);
                if (targetLink) {
                    targetLink.classList.add('active');
                }
            }
        }, 50);

        // Initialize content manager
        const headerElement = document.querySelector('.content-header');
        const bodyElement = document.querySelector('.content-body');
        const heroContainer = document.querySelector('.hero-container');
        this.contentManager = new ContentManager(headerElement, bodyElement, heroContainer);

        // Connect navigation to content manager
        this.navigation.onNavigate = (itemId, modulePath) => {
            this.loadExperience(itemId, modulePath);
        };

        // Setup theme toggle
        this.setupThemeToggle();

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

        // Build module list for scroll navigation FIRST
        this.buildModuleList();

        // Handle URL navigation (load initial content) - active state already set above
        await this.handleUrlNavigation();

        // Hide loader
        this.hideLoader();

        // First load animation (now that content is loaded)
        await this.animateFirstLoad();

        // Setup resize handler to manage nav state across breakpoints
        this.setupResizeHandler();

        // Setup scroll and swipe navigation
        this.setupScrollNavigation();
        this.setupSwipeNavigation();

        // Mark first load as complete
        this.isFirstLoad = false;

        this.isReady = true;
    }

    async loadExperience(itemId, modulePath) {
        // Find the target index
        const targetIndex = this.modules.findIndex(m => m.id === itemId);
        if (targetIndex === -1) return;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('experience', itemId);
        window.history.pushState({}, '', url);

        // Update active nav
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Navigate with transition based on direction
        await this.navigateToModuleByIndex(targetIndex);

        // Close mobile menu
        this.closeMobileMenu();
    }

    async loadFromUrl(itemId, modulePath) {
        // Find the target index
        const targetIndex = this.modules.findIndex(m => m.id === itemId);
        if (targetIndex === -1) return;

        // Update active nav
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Navigate with transition based on direction
        await this.navigateToModuleByIndex(targetIndex);

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
                // Load the experience
                await this.contentManager.loadExperience(experienceId, modulePath);
                return;
            }
        }

        // No URL parameter - load random visualization on first load (without setting URL)
        if (this.isFirstLoad && this.modules.length > 0) {
            const randomModule = this.modules[this.currentModuleIndex];
            
            this.navigation.setActive(randomModule.id);
            await this.contentManager.loadExperience(randomModule.id, randomModule.module);
        }
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
            logo.addEventListener('click', async () => {
                // Clear URL
                window.history.pushState({}, '', window.location.pathname);
                
                // Show home state overlay
                await this.showHomeStateOverlay();
                
                // Close mobile nav if open
                this.closeMobileMenu();
            });
        }
    }
    
    async showHomeStateOverlay() {
        const mainContent = document.querySelector('.main-content');
        const isDesktop = window.innerWidth > 768;
        
        // Create home state overlay
        const homeOverlay = this.createHomeOverlay();
        document.body.appendChild(homeOverlay);
        
        // Set initial state (hidden)
        gsap.set(homeOverlay, { opacity: 0 });
        
        if (isDesktop) {
            // Desktop: Fade in overlay, pause, fade out
            await gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });
            
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });
        } else {
            // Mobile: Fade in overlay, pause, fade out
            await gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });
        }
        
        // Remove overlay
        homeOverlay.remove();
    }

    async animateFirstLoad() {
        const appContainer = document.querySelector('.app-container');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const isDesktop = window.innerWidth > 768;
        const hasVisualization = !!document.querySelector('.visualization-container');

        console.log('animateFirstLoad - hasVisualization:', hasVisualization);

        // Fade in app container
        gsap.to(appContainer, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        });

        // Only show home overlay if we have a visualization loaded
        if (!hasVisualization) {
            console.warn('No visualization loaded for home state');
            // Just show nav
            if (isDesktop) {
                gsap.set(sidebar, { x: 0, opacity: 1 });
            } else {
                gsap.set(sidebar, { x: '-100%', opacity: 1 });
            }
            gsap.set(mainContent, { opacity: 1 });
            return;
        }

        // Create home state overlay
        const homeOverlay = this.createHomeOverlay();
        document.body.appendChild(homeOverlay);

        if (isDesktop) {
            // DESKTOP: Show visualization, animate in nav and home overlay
            
            // Set initial states
            gsap.set(sidebar, { 
                x: -280, 
                opacity: 0 
            });
            
            gsap.set(mainContent, { 
                opacity: 1
            });

            gsap.set(homeOverlay, {
                opacity: 0
            });

            // Fade in home overlay
            await gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Animate nav in
            await gsap.to(sidebar, {
                x: 0,
                opacity: 1,
                duration: 1.0,
                ease: 'expo.inOut'
            });

            // Wait another moment
            await new Promise(resolve => setTimeout(resolve, 800));

            // Fade out home overlay
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });

            // Remove overlay
            homeOverlay.remove();

        } else {
            // MOBILE: Show visualization, animate in home overlay
            gsap.set(sidebar, { x: '-100%', opacity: 1 });
            gsap.set(mainContent, { opacity: 1 });
            gsap.set(homeOverlay, { opacity: 0 });

            // Fade in home overlay
            await gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Fade out home overlay
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });

            // Remove overlay
            homeOverlay.remove();
        }
    }

    createHomeOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'home-state-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            pointer-events: none;
        `;

        const title = document.createElement('h1');
        title.textContent = 'Motion Grammar';
        title.style.cssText = `
            font-size: 88px;
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin: 0 auto 20px;
            text-transform: uppercase;
            color: var(--color-text-primary);
            text-align: center;
        `;

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Dynamic design systems';
        subtitle.style.cssText = `
            font-size: 22px;
            margin: 0 auto;
            line-height: 1.5;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--color-text-primary);
            text-align: center;
        `;

        overlay.appendChild(title);
        overlay.appendChild(subtitle);

        return overlay;
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

    buildModuleList() {
        // Only add visualizations - no separate homepage
        navigationData.forEach(group => {
            if (group.children) {
                group.children.forEach(item => {
                    this.modules.push({
                        id: item.id,
                        title: item.title,
                        module: item.module
                    });
                });
            }
        });

        console.log('Built module list:', this.modules.length, 'modules');

        // Set current index based on URL or pick random for first load
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        
        if (experienceId) {
            const index = this.modules.findIndex(m => m.id === experienceId);
            if (index !== -1) {
                this.currentModuleIndex = index;
                console.log('Set current index from URL:', this.currentModuleIndex, experienceId);
            }
        } else if (this.isFirstLoad) {
            // Pick a random visualization for first load
            this.currentModuleIndex = Math.floor(Math.random() * this.modules.length);
            console.log('Picked random visualization:', this.currentModuleIndex, this.modules[this.currentModuleIndex]);
        }
    }

    setupScrollNavigation() {
        let lastScrollTime = 0;
        const scrollCooldown = 1000; // 1 second cooldown between scrolls

        console.log('Setting up scroll navigation');

        window.addEventListener('wheel', (e) => {
            // Prevent default scroll behavior
            e.preventDefault();

            // Check if we're already transitioning or in cooldown
            const now = Date.now();
            if (this.isTransitioning || (now - lastScrollTime) < scrollCooldown) {
                return;
            }

            // Only trigger on significant scroll
            if (Math.abs(e.deltaY) > 10) {
                lastScrollTime = now;
                console.log('Scroll detected, deltaY:', e.deltaY);
                
                if (e.deltaY > 0) {
                    // Scroll down - next
                    console.log('Navigating to next');
                    this.navigateToNext();
                } else if (e.deltaY < 0) {
                    // Scroll up - previous
                    console.log('Navigating to previous');
                    this.navigateToPrevious();
                }
            }
        }, { passive: false });
    }

    setupSwipeNavigation() {
        let touchStartY = 0;
        let touchEndY = 0;
        let lastSwipeTime = 0;
        const swipeThreshold = 50;
        const swipeCooldown = 1000; // 1 second cooldown between swipes

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (this.isTransitioning || (now - lastSwipeTime) < swipeCooldown) return;

            touchEndY = e.changedTouches[0].screenY;
            const swipeDistance = touchStartY - touchEndY;

            if (Math.abs(swipeDistance) > swipeThreshold) {
                lastSwipeTime = now;
                
                if (swipeDistance > 0) {
                    // Swipe up - next
                    this.navigateToNext();
                } else {
                    // Swipe down - previous
                    this.navigateToPrevious();
                }
            }
        }, { passive: true });
    }

    async navigateToNext() {
        // Loop to beginning if at the end
        const nextIndex = (this.currentModuleIndex + 1) % this.modules.length;
        await this.navigateToModuleByIndex(nextIndex, 'down');
    }

    async navigateToPrevious() {
        // Loop to end if at the beginning
        const prevIndex = this.currentModuleIndex === 0 
            ? this.modules.length - 1 
            : this.currentModuleIndex - 1;
        await this.navigateToModuleByIndex(prevIndex, 'up');
    }

    async navigateToModuleByIndex(targetIndex, forcedDirection = null) {
        if (this.isTransitioning || targetIndex === this.currentModuleIndex) return;

        this.isTransitioning = true;
        const targetModule = this.modules[targetIndex];
        
        // Use forced direction if provided (for scroll/swipe), otherwise calculate from indices
        const direction = forcedDirection || (targetIndex > this.currentModuleIndex ? 'down' : 'up');

        // Step 1: Slide out current content
        await this.slideOutContent(direction);

        // Step 2: Load new content while off-screen
        const url = new URL(window.location);
        url.searchParams.set('experience', targetModule.id);
        window.history.pushState({}, '', url);
        this.navigation.setActive(targetModule.id);
        
        // Update nav link active state
        setTimeout(() => {
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            const targetLink = document.querySelector(`.nav-link[data-item-id="${targetModule.id}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        await this.contentManager.loadExperience(targetModule.id, targetModule.module);

        // Step 3: Slide in new content
        await this.slideInContent(direction);

        this.currentModuleIndex = targetIndex;
        this.isTransitioning = false;
    }

    async slideOutContent(direction) {
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const multiplier = direction === 'down' ? 1 : -1;

        // Slide out current content
        await gsap.to([mainContent, heroContainer], {
            y: multiplier * -100,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }

    async slideInContent(direction) {
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const multiplier = direction === 'down' ? 1 : -1;

        // Position new content off-screen in the opposite direction
        gsap.set([mainContent, heroContainer], {
            y: multiplier * 100,
            opacity: 0
        });

        // Slide in new content
        await gsap.to([mainContent, heroContainer], {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut'
        });
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

