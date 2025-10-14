/**
 * Dropdown Component (Molecular)
 * Custom dropdown with portal positioning support
 * 
 * Props:
 * - options: array (required) - array of {value, label, sublabel?} objects
 * - value: string (optional) - selected value
 * - icon: string (optional) - icon to show before selected text
 * - placeholder: string (optional) - placeholder text
 * - className: string (optional) - additional classes
 * - onChange: function (optional) - change handler (receives value, option)
 * - usePortal: boolean (default: true) - use portal positioning
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';

export class Dropdown extends Component {
    constructor(props) {
        super(props);
        this.isOpen = false;
        this.dropdownMenu = null;
        this.dropdownSelected = null;
        this.containerElement = null;
    }

    render() {
        const {
            options = [],
            value,
            icon,
            placeholder = 'Select...',
            className = '',
            onChange,
            usePortal = true
        } = this.props;

        if (!options.length) {
            console.warn('Dropdown: options array is empty');
        }

        const selectedOption = options.find(opt => opt.value === value);

        // Container
        const container = this.createElement('div', {
            className: `custom-dropdown-container ${className} ${this.isOpen ? 'open' : ''}`.trim()
        });
        this.containerElement = container;

        // Selected display
        const selected = this.createElement('div', {
            className: 'dropdown-selected'
        });
        this.dropdownSelected = selected;

        // Icon
        if (icon) {
            const iconComponent = new Icon({ name: icon, size: 'md' });
            this.children.push(iconComponent);
            selected.appendChild(iconComponent.render());
        }

        // Selected text
        const selectedText = this.createElement('span', {
            className: 'selected-text',
            text: selectedOption ? selectedOption.label : placeholder
        });
        selected.appendChild(selectedText);

        // Chevron
        const chevronIcon = new Icon({ name: 'bx-chevron-down', className: 'dropdown-arrow' });
        this.children.push(chevronIcon);
        selected.appendChild(chevronIcon.render());

        container.appendChild(selected);

        // Dropdown menu
        const menu = this.createElement('div', {
            className: `dropdown-menu ${usePortal ? 'dropdown-portal' : ''}`
        });
        this.dropdownMenu = menu;

        // Options
        options.forEach(option => {
            const item = this.createElement('div', {
                className: `dropdown-item ${option.value === value ? 'active' : ''}`
            });
            item.dataset.value = option.value;

            const info = this.createElement('div', {
                className: 'dropdown-option-info'
            });

            const label = this.createElement('span', {
                className: 'dropdown-option-label',
                text: option.label
            });
            info.appendChild(label);

            if (option.sublabel) {
                const sublabel = this.createElement('span', {
                    className: 'dropdown-option-sublabel',
                    text: option.sublabel
                });
                info.appendChild(sublabel);
            }

            item.appendChild(info);
            menu.appendChild(item);

            // Click handler
            this.addEventListener(item, 'click', (e) => {
                e.stopPropagation();
                if (onChange) {
                    onChange(option.value, option);
                    this.emit('dropdownChange', { value: option.value, option });
                }
                selectedText.textContent = option.label;
                
                // Update active states
                menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                this.close();
            });
        });

        // Append menu to body if using portal, otherwise to container
        if (usePortal) {
            // Append to body immediately - container will be in DOM by now
            document.body.appendChild(menu);
        } else {
            container.appendChild(menu);
        }

        // Toggle handler
        this.addEventListener(selected, 'click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close on outside click
        const outsideClickHandler = (e) => {
            if (this.containerElement && 
                !this.containerElement.contains(e.target) && 
                this.dropdownMenu &&
                !this.dropdownMenu.contains(e.target)) {
                this.close();
            }
        };
        this.addEventListener(document, 'click', outsideClickHandler);

        // Update position on resize if using portal
        if (usePortal) {
            let resizeTimeout;
            const resizeHandler = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (this.isOpen) {
                        this.updatePosition();
                    }
                }, 100);
            };
            this.addEventListener(window, 'resize', resizeHandler);
        }

        // Store element reference
        this.element = container;

        return container;
    }

    updatePosition() {
        if (!this.dropdownSelected || !this.dropdownMenu) return;

        const rect = this.dropdownSelected.getBoundingClientRect();
        
        // Position dropdown right below the trigger
        this.dropdownMenu.style.position = 'fixed';
        this.dropdownMenu.style.top = `${rect.bottom + 8}px`;
        this.dropdownMenu.style.left = `${rect.left}px`;
        this.dropdownMenu.style.minWidth = `${rect.width}px`;
        
        // Ensure it doesn't go off-screen at the bottom
        const menuHeight = this.dropdownMenu.offsetHeight || 300; // estimate if not rendered
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom - 8;
        
        // If not enough space below, position above the trigger
        if (menuHeight > spaceBelow && rect.top > menuHeight) {
            this.dropdownMenu.style.top = `${rect.top - menuHeight - 8}px`;
            this.dropdownMenu.style.transformOrigin = 'bottom center';
        } else {
            this.dropdownMenu.style.transformOrigin = 'top center';
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        if (this.containerElement) {
            this.containerElement.classList.add('open');
        }
        if (this.dropdownMenu) {
            this.dropdownMenu.classList.add('open');
            if (this.props.usePortal !== false) {
                this.updatePosition();
            }
        }
        this.emit('dropdownOpen');
    }

    close() {
        this.isOpen = false;
        if (this.containerElement) {
            this.containerElement.classList.remove('open');
        }
        if (this.dropdownMenu) {
            this.dropdownMenu.classList.remove('open');
        }
        this.emit('dropdownClose');
    }

    destroy() {
        // Remove menu from body if it was portaled
        if (this.dropdownMenu && this.dropdownMenu.classList.contains('dropdown-portal')) {
            document.body.removeChild(this.dropdownMenu);
        }
        super.destroy();
    }
}

