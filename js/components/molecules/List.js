/**
 * List Component (Molecular)
 * Container for list items
 * 
 * Props:
 * - items: array (required) - array of ListItem components or data
 * - emptyMessage: string (optional) - message when list is empty
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';
import { ListItem } from './ListItem.js';

export class List extends Component {
    render() {
        const {
            items = [],
            emptyMessage = 'No items to display',
            className = ''
        } = this.props;

        const ul = this.createElement('ul', {
            className: `list ${className}`.trim()
        });

        if (items.length === 0) {
            // Empty state
            const emptyState = this.createElement('div', {
                className: 'list-empty',
                text: emptyMessage
            });
            ul.appendChild(emptyState);
        } else {
            // Render items
            items.forEach(item => {
                if (item instanceof ListItem || item instanceof Component) {
                    this.children.push(item);
                    ul.appendChild(item.render());
                } else if (item instanceof HTMLElement) {
                    ul.appendChild(item);
                } else {
                    console.warn('List: item should be a ListItem component or HTMLElement');
                }
            });
        }

        this.element = ul;
        
        return ul;
    }

    /**
     * Add item to list
     */
    addItem(item) {
        if (this.element && item) {
            // Remove empty state if exists
            const emptyState = this.element.querySelector('.list-empty');
            if (emptyState) {
                emptyState.remove();
            }

            if (item instanceof Component) {
                this.children.push(item);
                this.element.appendChild(item.render());
            } else if (item instanceof HTMLElement) {
                this.element.appendChild(item);
            }

            this.emit('listItemAdded', { item });
        }
    }

    /**
     * Remove item from list
     */
    removeItem(item) {
        if (item && item.element) {
            item.element.remove();
            const index = this.children.indexOf(item);
            if (index > -1) {
                this.children.splice(index, 1);
            }
            this.emit('listItemRemoved', { item });

            // Add empty state if no items left
            if (this.children.length === 0) {
                const emptyState = this.createElement('div', {
                    className: 'list-empty',
                    text: this.props.emptyMessage || 'No items to display'
                });
                this.element.appendChild(emptyState);
            }
        }
    }

    /**
     * Clear all items
     */
    clearItems() {
        this.children.forEach(child => {
            if (child instanceof Component) {
                child.destroy();
            }
        });
        this.children = [];
        
        if (this.element) {
            this.element.innerHTML = '';
            const emptyState = this.createElement('div', {
                className: 'list-empty',
                text: this.props.emptyMessage || 'No items to display'
            });
            this.element.appendChild(emptyState);
        }

        this.emit('listCleared');
    }
}

