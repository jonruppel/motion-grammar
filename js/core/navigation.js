// Navigation Module (Component-based)
// Using new component architecture

import { Sidebar } from '../components/index.js';
import { visualizationRegistry } from '../utils/visualization-registry.js';
import { contentRegistry } from '../utils/content-registry.js';

// Get navigation data with dynamic visualizations and content
function getNavigationData() {
    const caseStudies = contentRegistry.getByCategory('case-studies');
    const aboutContent = contentRegistry.getByCategory('about');
    
    return [
        {
            id: 'about',
            title: 'About',
            icon: 'bx-user',
            type: 'slide-deck',
            dataPath: aboutContent[0]?.dataPath || '/data/about.json'
        },
        {
            id: 'visualizations',
            title: 'Vibes',
            icon: 'bx-paint',
            children: visualizationRegistry.getNavigationData()
        },
        {
            id: 'case-studies',
            title: 'Work Samples',
            icon: 'bx-briefcase',
            children: caseStudies.map(study => ({
                id: study.id,
                title: study.title,
                type: study.type,
                dataPath: study.dataPath
            }))
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
            if (nav && typeof nav.setActive === 'function') {
                nav.setActive(itemId);
            }
        }
    }

    setActiveFromUrl() {
        if (this.sidebarComponent) {
            const nav = this.sidebarComponent.getNavigation();
            if (nav && typeof nav.setActiveFromUrl === 'function') {
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

