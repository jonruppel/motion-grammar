/**
 * Button Component (Atomic)
 * 
 * Props:
 * - variant: 'primary' | 'secondary' | 'ghost' | 'icon' (default: 'primary')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - icon: string (optional) - icon name for icon-only buttons
 * - iconLeft: string (optional) - icon on the left
 * - iconRight: string (optional) - icon on the right
 * - text: string (optional) - button text
 * - disabled: boolean (optional)
 * - className: string (optional) - additional classes
 * - ariaLabel: string (optional) - accessibility label
 * - title: string (optional) - tooltip
 * - onClick: function (optional) - click handler
 * - type: 'button' | 'submit' | 'reset' (default: 'button')
 */
import { Component } from '../Component.js';
import { Icon } from './Icon.js';

export class Button extends Component {
    render() {
        const {
            variant = 'primary',
            size = 'md',
            icon,
            iconLeft,
            iconRight,
            text,
            disabled = false,
            className = '',
            ariaLabel,
            title,
            onClick,
            type = 'button'
        } = this.props;

        const classes = ['btn', `btn-${variant}`, `btn-${size}`];
        
        if (className) {
            classes.push(className);
        }

        const attributes = {
            type
        };

        if (ariaLabel) {
            attributes['aria-label'] = ariaLabel;
        }

        if (title) {
            attributes.title = title;
        }

        if (disabled) {
            attributes.disabled = 'disabled';
        }

        const element = this.createElement('button', {
            className: classes.join(' '),
            attributes
        });

        // Icon-only button
        if (icon) {
            const iconComponent = new Icon({ name: icon });
            this.children.push(iconComponent);
            element.appendChild(iconComponent.render());
        } else {
            // Button with optional icons and text
            if (iconLeft) {
                const iconComponent = new Icon({ name: iconLeft, className: 'btn-icon-left' });
                this.children.push(iconComponent);
                element.appendChild(iconComponent.render());
            }

            if (text) {
                const textSpan = this.createElement('span', {
                    className: 'btn-text',
                    text
                });
                element.appendChild(textSpan);
            }

            if (iconRight) {
                const iconComponent = new Icon({ name: iconRight, className: 'btn-icon-right' });
                this.children.push(iconComponent);
                element.appendChild(iconComponent.render());
            }
        }

        // Add click handler
        if (onClick) {
            this.addEventListener(element, 'click', (e) => {
                if (!disabled) {
                    onClick(e);
                    this.emit('buttonClick', { button: this });
                }
            });
        }

        // Store element reference
        this.element = element;
        
        return element;
    }
}

