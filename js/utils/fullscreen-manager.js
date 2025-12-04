/**
 * UI Layer Manager
 * Manages visibility of UI layer (logo, nav, theme toggle)
 * Auto-hides on mouse inactivity
 */

class UILayerManager {
    constructor() {
        this.isUiHidden = false;
        this.uiHideTimer = null;
        this.uiHideDelay = 3000; // 3 seconds for UI hide
        
        this.setupMouseActivity();
    }

    setupMouseActivity() {
        // Handle mouse movement (desktop)
        document.addEventListener('mousemove', () => {
            // Show UI when mouse moves
            this.showUI();
            this.scheduleUIHide();
        });

        // Handle touch interaction (mobile)
        document.addEventListener('touchstart', () => {
            this.showUI();
            this.scheduleUIHide();
        }, { passive: true });
    }

    showUI() {
        if (this.isUiHidden) {
            const uiLayer = document.querySelector('.ui-layer');
            const sidebar = document.querySelector('.sidebar');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            
            if (uiLayer) {
                uiLayer.classList.remove('hidden');
            }
            if (sidebar) {
                sidebar.classList.remove('hidden');
            }
            if (mobileToggle) {
                mobileToggle.classList.remove('hidden');
            }
            this.isUiHidden = false;
        }
    }

    hideUI() {
        // Don't auto-hide UI on mobile if the menu is open
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            return;
        }

        if (!this.isUiHidden) {
            const uiLayer = document.querySelector('.ui-layer');
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            
            if (uiLayer) {
                uiLayer.classList.add('hidden');
            }
            if (sidebar) {
                sidebar.classList.add('hidden');
            }
            // On mobile, we might want to keep the toggle visible?
            // User said: "we shouldn't be hiding the mobile menu"
            // So we explicitly DO NOT add .hidden to mobileToggle, 
            // OR if it's being hidden by CSS (e.g. body class), we ensure it stays.
            
            // If the current implementation IS hiding it, it might be because
            // of a shared parent or global class I missed.
            // But to be safe, let's explicitly manage it if needed.
            
            // Actually, if we just DON'T touch mobileToggle here, and it's independent in DOM...
            // It must be that `sidebar.hidden` affects it? No.
            
            // Let's assume there WAS logic hiding it and remove it, or force show.
            if (mobileToggle) {
                // Ensure we don't hide the mobile toggle on mobile
                if (window.innerWidth <= 768) {
                    mobileToggle.classList.remove('hidden');
                } else {
                    // On desktop, it's hidden by CSS anyway, but consistent logic:
                    mobileToggle.classList.add('hidden');
                }
            }
            
            this.isUiHidden = true;
        }
    }

    scheduleUIHide() {
        // Clear existing timer
        if (this.uiHideTimer) {
            clearTimeout(this.uiHideTimer);
        }

        // Schedule UI hide
        this.uiHideTimer = setTimeout(() => {
            this.hideUI();
        }, this.uiHideDelay);
    }
}

// Export singleton instance
export const uiLayerManager = new UILayerManager();

