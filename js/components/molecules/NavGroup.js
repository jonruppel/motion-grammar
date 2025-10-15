/**
 * NavGroup Component (Molecular)
 * Collapsible navigation group
 * 
 * Props:
 * - id: string (required) - unique identifier
 * - title: string (required) - group title
 * - icon: string (required) - icon name
 * - items: array (required) - array of nav items
 * - expanded: boolean (default: true) - initial expanded state
 * - onItemClick: function (optional) - item click handler
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';
import { NavLink } from './NavLink.js';

export class NavGroup extends Component {
    constructor(props) {
        super(props);
        this.navLinks = [];
    }

    render() {
        const {
            id,
            title,
            icon,
            items = [],
            expanded = true,
            onItemClick
        } = this.props;

        if (!id || !title || !icon) {
            console.error('NavGroup: id, title, and icon props are required');
            return this.createElement('div');
        }

        const groupDiv = this.createElement('div', {
            className: `nav-group${expanded ? ' expanded' : ''}`,
            dataset: { groupId: id }
        });

        // Title
        const titleDiv = this.createElement('div', {
            className: 'nav-group-title'
        });

        const iconLeft = new Icon({ name: icon });
        this.children.push(iconLeft);
        titleDiv.appendChild(iconLeft.render());

        const titleSpan = this.createElement('span', {
            text: title
        });
        titleDiv.appendChild(titleSpan);

        const chevronIcon = new Icon({ 
            name: 'bx-chevron-down', 
            className: 'nav-group-chevron' 
        });
        this.children.push(chevronIcon);
        titleDiv.appendChild(chevronIcon.render());

        groupDiv.appendChild(titleDiv);

        // Toggle handler
        this.addEventListener(titleDiv, 'click', () => {
            groupDiv.classList.toggle('expanded');
            this.emit('navGroupToggle', { 
                id, 
                expanded: groupDiv.classList.contains('expanded') 
            });
        });

        // Items list
        const itemsList = this.createElement('ul', {
            className: 'nav-items'
        });

        items.forEach(item => {
            const navLink = new NavLink({
                ...item,
                onClick: (data) => {
                    if (onItemClick) {
                        onItemClick(data);
                    }
                }
            });
            
            this.navLinks.push(navLink);
            this.children.push(navLink);
            itemsList.appendChild(navLink.render());
        });

        groupDiv.appendChild(itemsList);

        return groupDiv;
    }

    /**
     * Set active item by id
     */
    setActiveItem(itemId) {
        this.navLinks.forEach(navLink => {
            const shouldBeActive = navLink.props.id === itemId;
            navLink.setActive(shouldBeActive);
        });
    }
}

