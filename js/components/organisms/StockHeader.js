/**
 * StockHeader Component (Organism)
 * Large display for current stock price and information
 * 
 * Props:
 * - symbol: string (required) - stock symbol
 * - name: string (required) - stock name
 * - currentPrice: string (required) - current price
 * - change: string (required) - price change
 * - changePercent: string (required) - percentage change
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';

export class StockHeader extends Component {
    render() {
        const {
            symbol,
            name,
            currentPrice,
            change,
            changePercent,
            className = ''
        } = this.props;

        if (!symbol || !name || !currentPrice || change === undefined || !changePercent) {
            console.error('StockHeader: symbol, name, currentPrice, change, and changePercent props are required');
            return this.createElement('div');
        }

        const isPositive = parseFloat(change) >= 0;

        const classes = ['stock-header', 'scale-reveal'];
        
        if (className) {
            classes.push(className);
        }

        const header = this.createElement('div', {
            className: classes.join(' ')
        });

        // Main info container
        const mainInfo = this.createElement('div', {
            className: 'stock-header-main'
        });

        // Name section
        const nameSection = this.createElement('div', {
            className: 'stock-header-name-section'
        });

        const symbolElement = this.createElement('h2', {
            className: 'stock-header-symbol',
            text: symbol
        });
        nameSection.appendChild(symbolElement);

        const nameElement = this.createElement('p', {
            className: 'stock-header-name',
            text: name
        });
        nameSection.appendChild(nameElement);

        mainInfo.appendChild(nameSection);

        // Price section
        const priceSection = this.createElement('div', {
            className: 'stock-header-price-section'
        });

        const priceElement = this.createElement('div', {
            className: 'stock-header-price',
            text: `$${currentPrice}`
        });
        priceSection.appendChild(priceElement);

        // Change
        const changeElement = this.createElement('div', {
            className: `stock-header-change ${isPositive ? 'positive' : 'negative'}`
        });

        const changeIcon = new Icon({
            name: `bx-${isPositive ? 'up' : 'down'}-arrow-alt`
        });
        this.children.push(changeIcon);
        changeElement.appendChild(changeIcon.render());

        const changeText = this.createElement('span', {
            text: `${isPositive ? '+' : ''}$${change} (${isPositive ? '+' : ''}${changePercent}%)`
        });
        changeElement.appendChild(changeText);

        priceSection.appendChild(changeElement);

        mainInfo.appendChild(priceSection);

        header.appendChild(mainInfo);

        // Store element reference
        this.element = header;
        
        return header;
    }
}

