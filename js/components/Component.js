/**
 * Base Component Class
 * All components extend this base class
 */
export class Component {
    constructor(props = {}) {
        this.props = props;
        this.element = null;
        this.children = [];
        this.eventListeners = [];
    }

    /**
     * Create and return the component's DOM element
     * Must be implemented by child classes
     */
    render() {
        throw new Error('render() must be implemented by component');
    }

    /**
     * Mount component to a parent element
     */
    mount(parent) {
        if (!this.element) {
            this.element = this.render();
        }
        if (parent && this.element) {
            parent.appendChild(this.element);
        }
        return this.element;
    }

    /**
     * Update component props and re-render if needed
     */
    update(newProps) {
        this.props = { ...this.props, ...newProps };
        if (this.element && this.element.parentNode) {
            const parent = this.element.parentNode;
            const nextSibling = this.element.nextSibling;
            this.destroy();
            this.element = this.render();
            if (nextSibling) {
                parent.insertBefore(this.element, nextSibling);
            } else {
                parent.appendChild(this.element);
            }
        }
    }

    /**
     * Destroy component and cleanup
     */
    destroy() {
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];

        // Destroy children
        this.children.forEach(child => {
            if (child && typeof child.destroy === 'function') {
                child.destroy();
            }
        });
        this.children = [];

        // Remove element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Helper: Add event listener and track for cleanup
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Helper: Emit custom event
     */
    emit(eventName, detail = {}) {
        if (this.element) {
            this.element.dispatchEvent(new CustomEvent(eventName, {
                detail,
                bubbles: true,
                composed: true
            }));
        }
    }

    /**
     * Helper: Create element with classes and attributes
     */
    createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        return element;
    }
}

