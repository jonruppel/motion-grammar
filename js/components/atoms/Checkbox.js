/**
 * Checkbox Component (Atomic)
 * Checkbox input with label
 * 
 * Props:
 * - checked: boolean (default: false) - checked state
 * - label: string (optional) - checkbox label
 * - id: string (optional) - checkbox id
 * - name: string (optional) - checkbox name
 * - disabled: boolean (default: false) - disabled state
 * - className: string (optional) - additional classes
 * - onChange: function (optional) - change handler
 */
import { Component } from '../Component.js';

export class Checkbox extends Component {
    render() {
        const {
            checked = false,
            label,
            id,
            name,
            disabled = false,
            className = '',
            onChange
        } = this.props;

        const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
        
        const wrapper = this.createElement('div', {
            className: `checkbox-wrapper ${className}`.trim()
        });

        // Checkbox
        const attributes = {
            type: 'checkbox',
            id: checkboxId
        };

        if (name) attributes.name = name;
        if (disabled) attributes.disabled = 'disabled';
        if (checked) attributes.checked = 'checked';

        const checkbox = this.createElement('input', {
            className: 'checkbox-input',
            attributes
        });

        // Change handler
        if (onChange) {
            this.addEventListener(checkbox, 'change', (e) => {
                onChange(e.target.checked, e);
                this.emit('checkboxChange', { checked: e.target.checked });
            });
        }

        wrapper.appendChild(checkbox);

        // Label
        if (label) {
            const labelElement = this.createElement('label', {
                text: label,
                attributes: {
                    for: checkboxId
                },
                className: 'checkbox-label'
            });
            wrapper.appendChild(labelElement);
        }

        // Store references
        this.element = wrapper;
        this.checkboxElement = checkbox;

        return wrapper;
    }

    /**
     * Get checked state
     */
    isChecked() {
        return this.checkboxElement ? this.checkboxElement.checked : false;
    }

    /**
     * Set checked state
     */
    setChecked(checked) {
        if (this.checkboxElement) {
            this.checkboxElement.checked = checked;
        }
    }

    /**
     * Toggle checked state
     */
    toggle() {
        if (this.checkboxElement) {
            this.checkboxElement.checked = !this.checkboxElement.checked;
            this.emit('checkboxChange', { checked: this.checkboxElement.checked });
        }
    }
}

