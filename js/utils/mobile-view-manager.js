/**
 * Mobile View Manager
 * Unified system for handling mobile styles in both:
 * 1. Actual mobile viewports (screen width <= 768px)
 * 2. Desktop mockup preview mode
 * 
 * This creates a single `.mobile-view` class that can be triggered by either condition,
 * eliminating the need for duplicate CSS rules.
 * 
 * Navigation is treated as a special case and is NOT affected by this system.
 */

export class MobileViewManager {
    constructor() {
        this.isMobileView = false;
        this.breakpoint = 768;
        this.mobileClass = 'mobile-view';
        this.observer = null;
    }

    /**
     * Check if we should be in mobile view
     * Triggered by: small screen OR mockup mode
     */
    shouldUseMobileView() {
        const isSmallScreen = window.innerWidth <= this.breakpoint;
        const isMockupMode = document.body.classList.contains('mobile-preview-active');
        return isSmallScreen || isMockupMode;
    }

    /**
     * Update mobile view state based on current conditions
     */
    updateMobileView() {
        const shouldBeMobile = this.shouldUseMobileView();
        
        if (shouldBeMobile && !this.isMobileView) {
            this.enableMobileView();
        } else if (!shouldBeMobile && this.isMobileView) {
            this.disableMobileView();
        }
    }

    /**
     * Enable mobile view styles
     */
    enableMobileView() {
        document.body.classList.add(this.mobileClass);
        this.isMobileView = true;
        console.log('📱 Mobile View: Enabled');
    }

    /**
     * Disable mobile view styles
     */
    disableMobileView() {
        document.body.classList.remove(this.mobileClass);
        this.isMobileView = false;
        console.log('🖥️ Mobile View: Disabled');
    }

    /**
     * Initialize the mobile view manager
     * Sets up responsive behavior and watches for mockup mode changes
     */
    init() {
        console.log('🎯 Mobile View Manager: Initializing...');
        
        // Set initial state
        this.updateMobileView();
        
        // Watch for window resize (actual mobile breakpoint)
        window.addEventListener('resize', () => {
            this.updateMobileView();
        });
        
        // Watch for mockup mode changes (mobile-preview-active class)
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.updateMobileView();
                }
            });
        });
        
        this.observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        console.log('✅ Mobile View Manager: Ready');
    }

    /**
     * Clean up (for hot reload/development)
     */
    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.disableMobileView();
    }

    /**
     * Get current mobile view state
     */
    isActive() {
        return this.isMobileView;
    }
}

// Export singleton instance
export const mobileViewManager = new MobileViewManager();

