/**
 * StockListItem Component (Molecular)
 * List item for displaying stock in a watchlist
 * 
 * Props:
 * - symbol: string (required) - stock symbol
 * - name: string (required) - stock name
 * - active: boolean (default: false) - active/selected state
 * - className: string (optional) - additional classes
 * - onClick: function (optional) - click handler
 * - dataset: object (optional) - data attributes
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';

export class StockListItem extends Component {
    render() {
        const {
            symbol,
            name,
            active = false,
            className = '',
            onClick,
            dataset = {}
        } = this.props;

        if (!symbol || !name) {
            console.error('StockListItem: symbol and name props are required');
            return this.createElement('div');
        }

        const classes = ['stock-list-item', 'scale-reveal'];
        
        if (active) {
            classes.push('active');
        }
        
        if (className) {
            classes.push(className);
        }

        const item = this.createElement('div', {
            className: classes.join(' '),
            dataset
        });

        // Symbol
        const symbolElement = this.createElement('div', {
            className: 'stock-list-symbol',
            text: symbol
        });
        item.appendChild(symbolElement);

        // Name
        const nameElement = this.createElement('div', {
            className: 'stock-list-name',
            text: name
        });
        item.appendChild(nameElement);

        // Chevron icon
        const chevronIcon = new Icon({ name: 'bx-chevron-right' });
        this.children.push(chevronIcon);
        item.appendChild(chevronIcon.render());

        // Click handler
        if (onClick) {
            item.style.cursor = 'pointer';
            this.addEventListener(item, 'click', () => {
                onClick();
                this.emit('stockListItemClick', { symbol, name });
            });
        }

        // Store element reference
        this.element = item;
        
        return item;
    }
}

