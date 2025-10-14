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

        // Navigation
        this.navigationComponent = new Navigation({
            navigationData,
            onNavigate
        });
        this.children.push(this.navigationComponent);
        sidebar.appendChild(this.navigationComponent.render());

        return sidebar;
    }

    /**
     * Get navigation component
     */
    getNavigation() {
        return this.navigationComponent;
    }
}

