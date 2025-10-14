/**
 * NavLink Component (Molecular)
 * Navigation link item
 * 
 * Props:
 * - id: string (required) - unique identifier
 * - title: string (required) - link text
 * - module: string (required) - module path
 * - description: string (optional) - link description
 * - active: boolean (default: false) - active state
 * - onClick: function (optional) - click handler
 */
import { Component } from '../Component.js';

export class NavLink extends Component {
    render() {
        const {
            id,
            title,
            module,
            description,
            active = false,
            onClick
        } = this.props;

        if (!id || !title || !module) {
            console.error('NavLink: id, title, and module props are required');
            return this.createElement('div');
        }

        const li = this.createElement('li', {
            className: 'nav-item'
        });

        const link = this.createElement('div', {
            className: `nav-link${active ? ' active' : ''}`,
            dataset: {
                itemId: id,
                module: module
            }
        });

        const textSpan = this.createElement('span', {
            className: 'nav-link-text',
            text: title
        });

        link.appendChild(textSpan);
        li.appendChild(link);

        // Hover effects
        let hoverTimeout = null;

        this.addEventListener(link, 'mouseenter', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            link.classList.add('nav-hovering');
        });

        this.addEventListener(link, 'mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                link.classList.remove('nav-hovering');
                hoverTimeout = null;
            }, 300);
        });

        // Click handler
        this.addEventListener(link, 'click', () => {
            link.classList.add('nav-expanding');
            setTimeout(() => {
                link.classList.remove('nav-expanding');
            }, 300);

            if (onClick) {
                onClick({ id, module });
                this.emit('navLinkClick', { id, module, title });
            }
        });

        return li;
    }

    /**
     * Set active state
     */
    setActive(isActive) {
        console.log('NavLink.setActive called with isActive:', isActive, 'for element:', this.element);
        if (this.element) {
            const link = this.element.querySelector('.nav-link');
            console.log('NavLink.setActive: Found link element:', link);
            if (link) {
                if (isActive) {
                    console.log('NavLink.setActive: Adding active class to', link);
                    link.classList.add('active');
                } else {
                    console.log('NavLink.setActive: Removing active class from', link);
                    link.classList.remove('active');
                }
            } else {
                console.log('NavLink.setActive: No .nav-link found in element');
            }
        } else {
            console.log('NavLink.setActive: No element available yet');
        }
    }
}

