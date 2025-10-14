/**
 * Stepper Component
 * Container for stepper navigation (vertical or horizontal)
 */

import { Component } from '../Component.js';

export class Stepper extends Component {
    render() {
        const {
            children = [],
            variant = 'vertical', // 'vertical' or 'horizontal'
            className = '',
            showConnectors = false
        } = this.props;

        const stepper = document.createElement('div');
        stepper.className = `stepper ${variant === 'horizontal' ? 'stepper--horizontal' : 'stepper--vertical'} ${className}`;

        // Render children with optional connectors interleaved
        children.forEach((child, index) => {
            // Render and append child
            let childEl;
            if (child && typeof child.render === 'function') {
                childEl = child.render();
            } else if (child instanceof HTMLElement) {
                childEl = child;
            }
            if (childEl) {
                stepper.appendChild(childEl);
            }

            // If not last and showConnectors and horizontal, append connector
            if (variant === 'horizontal' && showConnectors && index < children.length - 1) {
                const connector = document.createElement('i');
                connector.className = 'bx bx-chevron-right stepper-connector';
                stepper.appendChild(connector);
            }
        });

        this.element = stepper;
        return stepper;
    }
}

