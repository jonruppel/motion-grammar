// Navigation Module (Component-based)
// Using new component architecture

import { Sidebar } from '../components/index.js';
import { visualizationRegistry } from '../utils/visualization-registry.js';

// Get navigation data with dynamic visualizations
function getNavigationData() {
    return [
        {
            id: 'visualizations',
            title: 'Visualizations',
            icon: 'bx-paint',
            children: visualizationRegistry.getNavigationData()
        },
    {
        id: 'page-examples',
        title: 'Page Examples',
        icon: 'bx-file',
        children: [
            { 
                id: 'exp-tasks', 
                title: 'Task Management', 
                module: 'pages/task-management',
                description: 'Complete task flow with create, organize, and complete states'
            },
            { 
                id: 'exp-ecommerce', 
                title: 'E-Commerce Checkout', 
                module: 'pages/ecommerce',
                description: 'Browse to purchase flow with cart and payment states'
            },
            { 
                id: 'exp-dashboard', 
                title: 'Analytics Dashboard', 
                module: 'pages/dashboard',
                description: 'Data visualization with filters and drill-down interactions'
            },
            { 
                id: 'exp-weather', 
                title: 'Weather', 
                module: 'pages/weather',
                description: 'Real-time weather visualization with motion design'
            },
            { 
                id: 'exp-onboarding', 
                title: 'User Onboarding', 
                module: 'pages/onboarding',
                description: 'Multi-step setup flow with progress and validation'
            },
            { 
                id: 'exp-stocks', 
                title: 'Stock Market', 
                module: 'pages/stocks',
                description: 'Real-time stock market data with interactive charts'
            }
        ]
    },
    {
        id: 'design-system',
        title: 'Design System',
        icon: 'bx-palette',
        children: [
            { 
                id: 'components-showcase', 
                title: 'Component Library', 
                module: 'pages/components-showcase',
                description: 'Browse all atoms, molecules, and organisms'
            }
        ]
    }
    ];
}

// Export navigation data as a getter so it's always fresh
export const navigationData = getNavigationData();

/**
 * Navigation class (backwards compatible wrapper)
 * Wraps the new Sidebar component
 */
export class Navigation {
    constructor(container) {
        this.container = container;
        this.sidebarComponent = null;
        this.currentItem = null;
        this.onNavigate = null;
    }

    render() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create sidebar component with fresh navigation data
        this.sidebarComponent = new Sidebar({
            navigationData: getNavigationData(),
            onNavigate: (itemId, modulePath) => {
                if (this.onNavigate) {
                    this.onNavigate(itemId, modulePath);
                }
            },
            onLogoClick: () => {
                // Emit event for app to handle
                if (this.container) {
                    this.container.dispatchEvent(new CustomEvent('logoClick', {
                        bubbles: true
                    }));
                }
            }
        });

        // Mount sidebar to container's parent (the actual sidebar element)
        const sidebarElement = this.container.closest('.sidebar');
        if (sidebarElement && sidebarElement.parentNode) {
            // Replace the entire sidebar
            const newSidebar = this.sidebarComponent.render();
            sidebarElement.parentNode.replaceChild(newSidebar, sidebarElement);
        } else {
            // Fallback: just mount navigation to container
            this.container.appendChild(this.sidebarComponent.getNavigation().render());
        }
    }

    setActive(itemId) {
        this.currentItem = itemId;
        if (this.sidebarComponent) {
            const nav = this.sidebarComponent.getNavigation();
            if (nav) {
                nav.setActive(itemId);
            }
        }
    }

    setActiveFromUrl() {
        if (this.sidebarComponent) {
            const nav = this.sidebarComponent.getNavigation();
            if (nav) {
                return nav.setActiveFromUrl();
            }
        }
        return null;
    }

    destroy() {
        if (this.sidebarComponent) {
            this.sidebarComponent.destroy();
            this.sidebarComponent = null;
        }
    }
}

