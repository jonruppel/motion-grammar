/**
 * ListItem Component (Molecular)
 * Generic list item with content and optional actions
 * 
 * Props:
 * - content: string | HTMLElement | Component (required) - item content
 * - actions: array (optional) - array of action components/elements
 * - onClick: function (optional) - click handler
 * - className: string (optional) - additional classes
 * - dataset: object (optional) - data attributes
 */
import { Component } from '../Component.js';

export class ListItem extends Component {
    render() {
        const {
            content,
            actions = [],
            onClick,
            className = '',
            dataset = {}
        } = this.props;

        if (!content) {
            console.error('ListItem: content prop is required');
            return this.createElement('li');
        }

        const li = this.createElement('li', {
            className: `list-item ${className}`.trim(),
            dataset
        });

        // Content wrapper
        const contentWrapper = this.createElement('div', {
            className: 'list-item-content'
        });

        // Add content
        if (typeof content === 'string') {
            contentWrapper.innerHTML = content;
        } else if (content instanceof Component) {
            this.children.push(content);
            contentWrapper.appendChild(content.render());
        } else if (content instanceof HTMLElement) {
            contentWrapper.appendChild(content);
        }

        li.appendChild(contentWrapper);

        // Actions
        if (actions.length > 0) {
            const actionsWrapper = this.createElement('div', {
                className: 'list-item-actions'
            });

            actions.forEach(action => {
                if (action instanceof Component) {
                    this.children.push(action);
                    actionsWrapper.appendChild(action.render());
                } else if (action instanceof HTMLElement) {
                    actionsWrapper.appendChild(action);
                }
            });

            li.appendChild(actionsWrapper);
        }

        // Click handler
        if (onClick) {
            li.style.cursor = 'pointer';
            this.addEventListener(li, 'click', (e) => {
                // Don't trigger if clicking on actions
                if (!e.target.closest('.list-item-actions')) {
                    onClick(e);
                    this.emit('listItemClick', { item: this });
                }
            });
        }

        this.element = li;
        
        return li;
    }
}

