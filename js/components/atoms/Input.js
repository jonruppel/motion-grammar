/**
 * Input Component (Atomic)
 * Form input field with various types
 * 
 * Props:
 * - type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' (default: 'text')
 * - value: string (optional) - input value
 * - placeholder: string (optional) - placeholder text
 * - label: string (optional) - input label
 * - id: string (optional) - input id
 * - name: string (optional) - input name
 * - required: boolean (default: false) - required field
 * - disabled: boolean (default: false) - disabled state
 * - className: string (optional) - additional classes
 * - onChange: function (optional) - change handler
 * - onFocus: function (optional) - focus handler
 * - onBlur: function (optional) - blur handler
 */
import { Component } from '../Component.js';

export class Input extends Component {
    render() {
        const {
            type = 'text',
            value = '',
            placeholder,
            label,
            id,
            name,
            required = false,
            disabled = false,
            className = '',
            onChange,
            onFocus,
            onBlur
        } = this.props;

        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const wrapper = this.createElement('div', {
            className: `form-group ${className}`.trim()
        });

        // Label
        if (label) {
            const labelElement = this.createElement('label', {
                text: label,
                attributes: {
                    for: inputId
                },
                className: 'form-label'
            });
            wrapper.appendChild(labelElement);
        }

        // Input
        const attributes = {
            type,
            id: inputId,
            placeholder: placeholder || ''
        };

        if (name) attributes.name = name;
        if (required) attributes.required = 'required';
        if (disabled) attributes.disabled = 'disabled';
        if (value) attributes.value = value;

        const input = this.createElement('input', {
            className: 'form-input',
            attributes
        });

        // Event handlers
        if (onChange) {
            this.addEventListener(input, 'input', (e) => {
                onChange(e.target.value, e);
                this.emit('inputChange', { value: e.target.value });
            });
        }

        if (onFocus) {
            this.addEventListener(input, 'focus', onFocus);
        }

        if (onBlur) {
            this.addEventListener(input, 'blur', onBlur);
        }

        wrapper.appendChild(input);
        
        // Store references
        this.element = wrapper;
        this.inputElement = input;

        return wrapper;
    }

    /**
     * Get input value
     */
    getValue() {
        return this.inputElement ? this.inputElement.value : '';
    }

    /**
     * Set input value
     */
    setValue(value) {
        if (this.inputElement) {
            this.inputElement.value = value;
        }
    }

    /**
     * Focus input
     */
    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }
}

