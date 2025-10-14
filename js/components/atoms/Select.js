/**
 * Select Component (Atomic)
 * Dropdown select field
 * 
 * Props:
 * - options: array (required) - array of {value, label} objects or strings
 * - value: string (optional) - selected value
 * - label: string (optional) - select label
 * - id: string (optional) - select id
 * - name: string (optional) - select name
 * - required: boolean (default: false) - required field
 * - disabled: boolean (default: false) - disabled state
 * - className: string (optional) - additional classes
 * - onChange: function (optional) - change handler
 */
import { Component } from '../Component.js';

export class Select extends Component {
    render() {
        const {
            options = [],
            value,
            label,
            id,
            name,
            required = false,
            disabled = false,
            className = '',
            onChange
        } = this.props;

        if (!options.length) {
            console.warn('Select: options array is empty');
        }

        const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
        const wrapper = this.createElement('div', {
            className: `form-group ${className}`.trim()
        });

        // Label
        if (label) {
            const labelElement = this.createElement('label', {
                text: label,
                attributes: {
                    for: selectId
                },
                className: 'form-label'
            });
            wrapper.appendChild(labelElement);
        }

        // Select
        const attributes = {
            id: selectId
        };

        if (name) attributes.name = name;
        if (required) attributes.required = 'required';
        if (disabled) attributes.disabled = 'disabled';

        const select = this.createElement('select', {
            className: 'form-select',
            attributes
        });

        // Options
        options.forEach(option => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            
            const optElement = this.createElement('option', {
                text: optLabel,
                attributes: {
                    value: optValue
                }
            });

            if (optValue === value) {
                optElement.selected = true;
            }

            select.appendChild(optElement);
        });

        // Change handler
        if (onChange) {
            this.addEventListener(select, 'change', (e) => {
                onChange(e.target.value, e);
                this.emit('selectChange', { value: e.target.value });
            });
        }

        wrapper.appendChild(select);
        
        // Store references
        this.element = wrapper;
        this.selectElement = select;

        return wrapper;
    }

    /**
     * Get selected value
     */
    getValue() {
        return this.selectElement ? this.selectElement.value : '';
    }

    /**
     * Set selected value
     */
    setValue(value) {
        if (this.selectElement) {
            this.selectElement.value = value;
        }
    }
}

