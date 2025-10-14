/**
 * Toggle Component
 * A switch/toggle component for binary settings
 */

import { Component } from '../Component.js';

export class Toggle extends Component {
    constructor(props = {}) {
        super(props);
        this.state = {
            checked: props.checked || false
        };
    }

    setChecked(checked) {
        this.state.checked = checked;
        const input = this.element?.querySelector('input[type="checkbox"]');
        if (input) {
            input.checked = checked;
        }
    }

    render() {
        const {
            id = `toggle-${Math.random().toString(36).substr(2, 9)}`,
            label = '',
            checked = false,
            onChange = () => {},
            disabled = false,
            className = ''
        } = this.props;

        this.state.checked = checked;

        const toggle = document.createElement('label');
        toggle.className = `toggle ${className}`;
        toggle.htmlFor = id;

        if (disabled) {
            toggle.classList.add('toggle--disabled');
        }

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = checked;
        input.disabled = disabled;
        input.className = 'toggle__input';

        input.addEventListener('change', (e) => {
            this.state.checked = e.target.checked;
            onChange(e.target.checked, e);
        });

        const slider = document.createElement('span');
        slider.className = 'toggle__slider';

        toggle.appendChild(input);
        toggle.appendChild(slider);

        this.element = toggle;
        return toggle;
    }
}

