/**
 * StepperItem Component
 * Individual step item in a stepper navigation
 */

import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';

export class StepperItem extends Component {
    render() {
        const {
            icon = 'bx-circle',
            title = '',
            description = '',
            active = false,
            completed = false,
            onClick = () => {},
            variant = 'vertical', // 'vertical' or 'horizontal'
            className = ''
        } = this.props;

        const item = document.createElement('div');
        item.className = `stepper-item ${variant === 'horizontal' ? 'stepper-item--horizontal' : 'stepper-item--vertical'} ${className}`;
        
        if (active) item.classList.add('stepper-item--active');
        if (completed) item.classList.add('stepper-item--completed');

        // Icon container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'stepper-item__icon';

        const mainIcon = new Icon({ name: icon });
        const checkIcon = new Icon({ name: 'bx-check', className: 'stepper-item__check-icon' });
        
        iconContainer.appendChild(mainIcon.render());
        iconContainer.appendChild(checkIcon.render());

        item.appendChild(iconContainer);

        // Label container
        if (title || description) {
            const labelContainer = document.createElement('div');
            labelContainer.className = 'stepper-item__label';

            if (title) {
                const titleEl = document.createElement('div');
                titleEl.className = 'stepper-item__title';
                titleEl.textContent = title;
                labelContainer.appendChild(titleEl);
            }

            if (description) {
                const descEl = document.createElement('div');
                descEl.className = 'stepper-item__description';
                descEl.textContent = description;
                labelContainer.appendChild(descEl);
            }

            item.appendChild(labelContainer);
        }

        // Click handler
        item.addEventListener('click', onClick);

        this.element = item;
        return item;
    }
}

