/**
 * StatCard Component (Molecular)
 * Simple card displaying a label and value
 * 
 * Props:
 * - label: string (required) - stat label/description
 * - value: string (required) - stat value
 * - icon: string (optional) - icon name
 * - className: string (optional) - additional classes
 * - onClick: function (optional) - click handler
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';
import { Text } from '../atoms/Text.js';

export class StatCard extends Component {
    render() {
        const {
            label,
            value,
            icon,
            className = '',
            onClick
        } = this.props;

        if (!label || !value) {
            console.error('StatCard: label and value props are required');
            return this.createElement('div');
        }

        const classes = ['stat-card', 'scale-reveal'];
        
        if (className) {
            classes.push(className);
        }

        const card = this.createElement('div', {
            className: classes.join(' ')
        });

        // Icon (optional)
        if (icon) {
            const iconComponent = new Icon({ name: icon, size: 'lg', className: 'stat-card-icon' });
            this.children.push(iconComponent);
            card.appendChild(iconComponent.render());
        }

        // Label
        const labelElement = new Text({
            tag: 'div',
            text: label,
            className: 'stat-card-label'
        });
        this.children.push(labelElement);
        card.appendChild(labelElement.render());

        // Value
        const valueElement = new Text({
            tag: 'div',
            text: value,
            className: 'stat-card-value'
        });
        this.children.push(valueElement);
        card.appendChild(valueElement.render());

        // Click handler
        if (onClick) {
            card.style.cursor = 'pointer';
            this.addEventListener(card, 'click', () => {
                onClick();
                this.emit('statCardClick', { label, value });
            });
        }

        // Store element reference
        this.element = card;
        
        return card;
    }
}

