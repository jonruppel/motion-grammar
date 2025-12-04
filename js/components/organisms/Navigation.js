/**
 * Navigation Component (Organism)
 * Main navigation sidebar with groups and items
 * 
 * Props:
 * - navigationData: array (required) - navigation structure
 * - onNavigate: function (optional) - navigation handler
 */
import { Component } from '../Component.js';
import { NavGroup } from '../molecules/NavGroup.js';

export class Navigation extends Component {
    constructor(props) {
        super(props);
        this.navGroups = [];
        this.currentItemId = null;
    }

    render() {
        const { navigationData = [], onNavigate } = this.props;

        if (!navigationData.length) {
            console.warn('Navigation: navigationData is empty');
        }

        const container = this.createElement('div', {
            className: 'nav-content'
        });

        navigationData.forEach(group => {
            // Check if this is a group with children or a standalone item
            if (group.children && group.children.length > 0) {
                // Render as NavGroup with children
                const navGroup = new NavGroup({
                    id: group.id,
                    title: group.title,
                    icon: group.icon,
                    items: group.children,
                    expanded: true,
                    onItemClick: (data) => {
                        this.setActive(data.id);
                        if (onNavigate) {
                            // Pass the module/dataPath from the item
                            onNavigate(data.id, data.module || data.dataPath);
                        }
                    }
                });

                this.navGroups.push(navGroup);
                this.children.push(navGroup);
                container.appendChild(navGroup.render());
            } else {
                // Render as standalone clickable item
                const standaloneItem = this.createElement('div', {
                    className: 'nav-group nav-standalone',
                    dataset: { groupId: group.id }
                });

                const itemLink = this.createElement('div', {
                    className: 'nav-group-title nav-clickable',
                    dataset: { 
                        itemId: group.id,
                        module: group.dataPath || group.type
                    }
                });

                // Icon
                const iconComponent = this.createElement('i', {
                    className: `bx ${group.icon}`
                });
                itemLink.appendChild(iconComponent);

                // Title
                const titleSpan = this.createElement('span', {
                    text: group.title
                });
                itemLink.appendChild(titleSpan);

                standaloneItem.appendChild(itemLink);
                container.appendChild(standaloneItem);

                // Click handler
                this.addEventListener(itemLink, 'click', () => {
                    this.setActive(group.id);
                    if (onNavigate) {
                        onNavigate(group.id, group.dataPath || group.type);
                    }
                });

                // Track for active state management
                this.navGroups.push({
                    element: standaloneItem,
                    isStandalone: true,
                    id: group.id,
                    setActiveItem: (itemId) => {
                        const shouldBeActive = group.id === itemId;
                        if (shouldBeActive) {
                            itemLink.classList.add('active');
                        } else {
                            itemLink.classList.remove('active');
                        }
                    }
                });
            }
        });

        // Animate nav groups in with stagger
        requestAnimationFrame(() => {
            const groups = container.querySelectorAll('.nav-group');
            groups.forEach((group, index) => {
                setTimeout(() => {
                    group.classList.add('animate-in');
                }, index * 100);
            });
        });

        return container;
    }

    /**
     * Set active navigation item
     */
    setActive(itemId) {
        this.currentItemId = itemId;
        
        this.navGroups.forEach(navGroup => {
            navGroup.setActiveItem(itemId);
        });

        this.emit('navigationChange', { itemId });
    }

    /**
     * Get current active item
     */
    getActiveItem() {
        return this.currentItemId;
    }

    /**
     * Set active from URL
     */
    setActiveFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        
        if (experienceId) {
            this.setActive(experienceId);
            return experienceId;
        }
        
        return null;
    }
}

