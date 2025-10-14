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
            const navGroup = new NavGroup({
                id: group.id,
                title: group.title,
                icon: group.icon,
                items: group.children || [],
                expanded: true,
                onItemClick: (data) => {
                    this.setActive(data.id);
                    if (onNavigate) {
                        onNavigate(data.id, data.module);
                    }
                }
            });

            this.navGroups.push(navGroup);
            this.children.push(navGroup);
            container.appendChild(navGroup.render());
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
        console.log('Navigation.setActive called with itemId:', itemId);
        this.currentItemId = itemId;
        
        this.navGroups.forEach(navGroup => {
            console.log('Navigation.setActive: Calling setActiveItem on navGroup with', itemId);
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

