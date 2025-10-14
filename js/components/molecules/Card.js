/**
 * Card Component (Molecular)
 * Versatile card component for displaying content
 * 
 * Props:
 * - variant: 'default' | 'experience' | 'principle' (default: 'default')
 * - icon: string (optional) - icon name
 * - iconGradient: boolean (default: false) - use gradient background for icon
 * - title: string (required) - card title
 * - description: string (optional) - card description
 * - meta: array (optional) - array of meta items (strings or objects)
 * - onClick: function (optional) - click handler
 * - className: string (optional) - additional classes
 * - dataset: object (optional) - data attributes
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';
import { Text } from '../atoms/Text.js';

export class Card extends Component {
    render() {
        const {
            variant = 'default',
            icon,
            iconGradient = false,
            title,
            description,
            meta = [],
            onClick,
            className = '',
            dataset = {}
        } = this.props;

        if (!title) {
            console.error('Card: title prop is required');
            return this.createElement('div');
        }

        const classes = ['card'];
        
        // Add variant classes
        if (variant === 'experience') {
            classes.push('experience-card', 'scale-reveal');
        } else if (variant === 'principle') {
            classes.push('principle-card', 'scale-reveal');
        }
        
        if (className) {
            classes.push(className);
        }

        const card = this.createElement('div', {
            className: classes.join(' '),
            dataset
        });

        // Experience card structure
        if (variant === 'experience') {
            // Icon with gradient
            if (icon) {
                const iconContainer = this.createElement('div', {
                    className: 'experience-card-icon'
                });
                const iconComponent = new Icon({ name: icon });
                this.children.push(iconComponent);
                iconContainer.appendChild(iconComponent.render());
                card.appendChild(iconContainer);
            }

            // Title
            const titleElement = new Text({
                tag: 'h3',
                text: title
            });
            this.children.push(titleElement);
            card.appendChild(titleElement.render());

            // Description
            if (description) {
                const descElement = new Text({
                    tag: 'p',
                    text: description
                });
                this.children.push(descElement);
                card.appendChild(descElement.render());
            }

            // Meta
            if (meta.length > 0) {
                const metaContainer = this.createElement('div', {
                    className: 'experience-card-meta'
                });
                meta.forEach(item => {
                    const metaSpan = this.createElement('span', {
                        text: item
                    });
                    metaContainer.appendChild(metaSpan);
                });
                card.appendChild(metaContainer);
            }
        }
        
        // Principle card structure
        else if (variant === 'principle') {
            // Header with icon and title
            const header = this.createElement('div', {
                className: 'principle-card-header'
            });

            if (icon) {
                const iconContainer = this.createElement('div', {
                    className: 'principle-icon'
                });
                const iconComponent = new Icon({ name: icon });
                this.children.push(iconComponent);
                iconContainer.appendChild(iconComponent.render());
                header.appendChild(iconContainer);
            }

            const titleElement = new Text({
                tag: 'h3',
                text: title
            });
            this.children.push(titleElement);
            header.appendChild(titleElement.render());

            card.appendChild(header);

            // Description
            if (description) {
                const descElement = new Text({
                    tag: 'p',
                    text: description
                });
                this.children.push(descElement);
                card.appendChild(descElement.render());
            }
        }
        
        // Default card structure
        else {
            if (icon) {
                const iconComponent = new Icon({ name: icon, size: 'lg' });
                this.children.push(iconComponent);
                card.appendChild(iconComponent.render());
            }

            const titleElement = new Text({
                tag: 'h3',
                text: title
            });
            this.children.push(titleElement);
            card.appendChild(titleElement.render());

            if (description) {
                const descElement = new Text({
                    tag: 'p',
                    text: description
                });
                this.children.push(descElement);
                card.appendChild(descElement.render());
            }
        }

        // Click handler
        if (onClick) {
            card.style.cursor = 'pointer';
            this.addEventListener(card, 'click', () => {
                onClick();
                this.emit('cardClick', { title, dataset });
            });
        }

        // Store element reference
        this.element = card;
        
        return card;
    }
}

