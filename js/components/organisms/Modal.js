/**
 * Modal Component (Organism)
 * Modal dialog with overlay, header, body, and footer
 * 
 * Props:
 * - title: string (required) - modal title
 * - children: array (optional) - child components for body
 * - footer: array (optional) - child components for footer
 * - visible: boolean (default: false) - visibility state
 * - size: 'small' | 'medium' | 'large' (default: 'medium') - modal size
 * - onClose: function (optional) - close handler
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';
import { Button } from '../atoms/Button.js';
import { Icon } from '../atoms/Icon.js';

export class Modal extends Component {
    render() {
        const {
            title,
            children = [],
            footer = [],
            visible = false,
            size = 'medium',
            onClose,
            className = ''
        } = this.props;

        if (!title) {
            console.error('Modal: title prop is required');
        }

        // Overlay
        const overlay = this.createElement('div', {
            className: `modal-overlay ${visible ? 'active' : ''} ${className}`.trim()
        });

        // Container with size class
        const containerClasses = ['modal-container'];
        if (size === 'small') {
            containerClasses.push('modal-container-small');
        } else if (size === 'large') {
            containerClasses.push('modal-container-large');
        }
        
        const container = this.createElement('div', {
            className: containerClasses.join(' ')
        });

        // Header
        const header = this.createElement('div', {
            className: 'modal-header'
        });

        const titleElement = this.createElement('h3', {
            text: title,
            className: 'modal-title'
        });
        header.appendChild(titleElement);

        const closeButton = new Button({
            variant: 'icon',
            icon: 'bx-x',
            className: 'modal-close',
            ariaLabel: 'Close modal',
            onClick: () => {
                this.close();
                if (onClose) onClose();
            }
        });
        this.children.push(closeButton);
        header.appendChild(closeButton.render());

        container.appendChild(header);

        // Body
        const body = this.createElement('div', {
            className: 'modal-body'
        });

        children.forEach(child => {
            if (child instanceof Component) {
                this.children.push(child);
                body.appendChild(child.render());
            } else if (child instanceof HTMLElement) {
                body.appendChild(child);
            }
        });

        container.appendChild(body);

        // Footer
        if (footer.length > 0) {
            const footerElement = this.createElement('div', {
                className: 'modal-footer'
            });

            footer.forEach(child => {
                if (child instanceof Component) {
                    this.children.push(child);
                    footerElement.appendChild(child.render());
                } else if (child instanceof HTMLElement) {
                    footerElement.appendChild(child);
                }
            });

            container.appendChild(footerElement);
        }

        overlay.appendChild(container);

        // Close on overlay click
        this.addEventListener(overlay, 'click', (e) => {
            if (e.target === overlay) {
                this.close();
                if (onClose) onClose();
            }
        });

        // Close on Escape key
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
                if (onClose) onClose();
            }
        });

        this.element = overlay;
        
        return overlay;
    }

    /**
     * Open modal
     */
    open() {
        if (this.element) {
            this.element.classList.add('active');
            this.element.style.display = 'flex';
            this.emit('modalOpen');
        }
    }

    /**
     * Close modal
     */
    close() {
        if (this.element) {
            this.element.classList.remove('active');
            // Wait for animation
            setTimeout(() => {
                if (this.element) {
                    this.element.style.display = 'none';
                }
            }, 300);
            this.emit('modalClose');
        }
    }

    /**
     * Check if modal is open
     */
    isOpen() {
        return this.element ? this.element.classList.contains('active') : false;
    }

    /**
     * Toggle modal
     */
    toggle() {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }
}

