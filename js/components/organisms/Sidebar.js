/**
 * Sidebar Component (Organism)
 * Main sidebar with logo and navigation
 * 
 * Props:
 * - navigationData: array (required) - navigation structure
 * - onLogoClick: function (optional) - logo click handler
 * - onNavigate: function (optional) - navigation handler
 */
import { Component } from '../Component.js';
import { Logo } from '../molecules/Logo.js';
import { Navigation } from './Navigation.js';

export class Sidebar extends Component {
    constructor(props) {
        super(props);
        this.navigationComponent = null;
        this.isDesktop = window.innerWidth > 768;
        this._hideTimer = null;
        this._sidebarElement = null;
        this._mousemoveHandler = null;
    }

    render() {
        const {
            navigationData = [],
            onLogoClick,
            onNavigate
        } = this.props;

        const sidebar = this.createElement('nav', {
            className: 'sidebar',
            attributes: {
                id: 'sidebar'
            }
        });
        this._sidebarElement = sidebar;

        // Add class to trigger CSS hover behavior if needed
        sidebar.classList.add('auto-hide-nav');

        // Header with logo
        const header = this.createElement('div', {
            className: 'sidebar-header'
        });

        const logo = new Logo({
            showAuthor: true,
            onClick: onLogoClick
        });
        this.children.push(logo);
        header.appendChild(logo.render());

        sidebar.appendChild(header);

        // Navigation container
        const navContainer = this.createElement('div', {
            className: 'nav-content'
        });

        // Use standard Navigation structure for both Desktop and Mobile
        this.navigationComponent = new Navigation({
            navigationData,
            onNavigate
        });
        this.children.push(this.navigationComponent);
        const navElement = this.navigationComponent.render();
        navContainer.appendChild(navElement);

        sidebar.appendChild(navContainer);

        // Setup mouse move visibility toggle for desktop
        this.setupVisibilityHandler(sidebar);

        // Initially trigger temporary visibility on desktop so users know nav is there
        if (this.isDesktop) {
            this.showUI(3000); // Show initially for 3s
        }

        return sidebar;
    }

    /**
     * Show UI and set delay for hiding
     */
    showUI(delay = 3000) {
        if (!this._sidebarElement) return;

        // Mobile always shows (or handled by mobile menu toggle), this logic is for desktop auto-hide
        if (window.innerWidth <= 768) return;

        // 1. Show UI
        this.setSidebarVisible(true);
        
        // 2. Clear any existing timer
        clearTimeout(this._hideTimer);
        
        // 3. Set delay to Hide UI
        this._hideTimer = setTimeout(() => {
            // Check if user is currently hovering the sidebar
            // If hovering, we DO NOT hide it.
            // We check the hover state by seeing if the mouse is currently over the sidebar element.
            // Since we don't have direct access to ":hover" state in JS easily without tracking,
            // we rely on the fact that 'mouseleave' on the sidebar will re-trigger the hide timer.
            // However, the original request was to NOT hide if hovering. 
            // The 'mouseenter' handler clears the timer. 
            // If this timer fires, it means 'mouseenter' hasn't happened or 'mouseleave' happened long ago?
            // Actually, if the mouse is sitting still over the sidebar, no events fire.
            // But 'mouseenter' clears the timer. So if we are inside, the timer shouldn't be running unless
            // it was started by something else (like a global mousemove) and not cleared.
            
            // To be safe, we can check if the sidebar matches :hover
            if (this._sidebarElement.matches(':hover')) {
                // If hovering, don't hide.
                // We don't need to reschedule because 'mouseleave' will trigger the hide sequence.
                return;
            }

            this.hideUI();
        }, delay);
    }

    /**
     * Hide UI immediately
     */
    hideUI() {
        if (!this._sidebarElement) return;
        
        // Mobile guard
        if (window.innerWidth <= 768) return;

        this.setSidebarVisible(false);
    }

    setSidebarVisible(visible) {
        if (!this._sidebarElement) return;
        
        // Prevent hiding on mobile
        if (!visible && window.innerWidth <= 768) {
            return;
        }

        // Clear any potential inline styles from GSAP to allow CSS classes to work
        this._sidebarElement.style.transform = '';
        this._sidebarElement.style.opacity = '';

        if (visible) {
            this._sidebarElement.classList.add('visible');
            document.body.classList.add('nav-visible');
            // Explicitly show theme controls
            const themeControls = document.querySelector('.theme-controls');
            if (themeControls) {
                themeControls.style.opacity = '1';
                themeControls.style.pointerEvents = 'auto';
            }
        } else {
            this._sidebarElement.classList.remove('visible');
            document.body.classList.remove('nav-visible');
            // Explicitly hide theme controls
            const themeControls = document.querySelector('.theme-controls');
            if (themeControls) {
                themeControls.style.opacity = '0';
                themeControls.style.pointerEvents = 'none';
            }
        }
    }

    setupVisibilityHandler(sidebar) {
        // --- 1. MOUSE MOVEMENT ---
        this._mousemoveHandler = (e) => {
            if (window.innerWidth > 768) {
                this.showUI();
            }
        };
        document.addEventListener('mousemove', this._mousemoveHandler);

        // --- 2. CLICKS ---
        this._clickHandler = (e) => {
            if (window.innerWidth > 768) {
                this.showUI();
            }
        };
        document.addEventListener('click', this._clickHandler);

        // --- 3. KEYBOARD ---
        this._keydownHandler = (e) => {
            if (window.innerWidth > 768) {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    return; 
                }
                this.showUI();
            }
        };
        document.addEventListener('keydown', this._keydownHandler);

        // --- 4. WHEEL / SCROLL ---
        this._wheelHandler = (e) => {
            if (window.innerWidth > 768) {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    this.showUI();
                }
            }
        };
        document.addEventListener('wheel', this._wheelHandler, { passive: true });

        // --- SIDEBAR HOVER ---
        sidebar.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                clearTimeout(this._hideTimer);
                this.setSidebarVisible(true);
            }
        });

        sidebar.addEventListener('mouseleave', () => {
            if (window.innerWidth > 768) {
                // When leaving sidebar, start the hide timer
                this.showUI(1000); // Hide after 1s
            }
        });
    }

    /**
     * Get navigation component
     */
    getNavigation() {
        return this.navigationComponent;
    }

    destroy() {
        // Clean up listeners
        if (this._mousemoveHandler) document.removeEventListener('mousemove', this._mousemoveHandler);
        if (this._clickHandler) document.removeEventListener('click', this._clickHandler);
        if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);
        if (this._wheelHandler) document.removeEventListener('wheel', this._wheelHandler);
        
        clearTimeout(this._hideTimer);
        
        // Reset global state if destroying
        document.body.classList.remove('nav-visible');
        
        super.destroy();
    }
}
