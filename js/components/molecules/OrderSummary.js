// OrderSummary Component
// Displays order pricing breakdown

import { Component } from '../Component.js';

export class OrderSummary extends Component {
    constructor(props = {}) {
        super();
        this.props = {
            subtotal: props.subtotal || 0,
            shipping: props.shipping || 0,
            tax: props.tax || 0,
            total: props.total || 0,
            items: props.items || [],
            showItems: props.showItems !== false,
            title: props.title || 'Order Summary',
            className: props.className || ''
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `order-summary ${this.props.className}`;

        const title = document.createElement('h3');
        title.textContent = this.props.title;
        this.element.appendChild(title);

        // Show items if requested
        if (this.props.showItems && this.props.items.length > 0) {
            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'order-summary-items';

            this.props.items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'summary-item';

                if (item.product.image) {
                    const img = document.createElement('img');
                    img.src = item.product.image;
                    img.alt = item.product.name;
                    itemDiv.appendChild(img);
                }

                const infoDiv = document.createElement('div');
                infoDiv.className = 'summary-item-info';

                const name = document.createElement('p');
                name.textContent = item.product.name;
                infoDiv.appendChild(name);

                const qty = document.createElement('span');
                qty.textContent = `Qty: ${item.quantity}`;
                infoDiv.appendChild(qty);

                itemDiv.appendChild(infoDiv);

                const price = document.createElement('span');
                price.className = 'summary-item-price';
                price.textContent = `$${(item.product.price * item.quantity).toFixed(2)}`;
                itemDiv.appendChild(price);

                itemsContainer.appendChild(itemDiv);
            });

            this.element.appendChild(itemsContainer);
        }

        const divider1 = document.createElement('div');
        divider1.className = 'summary-divider';
        this.element.appendChild(divider1);

        // Subtotal
        const subtotalRow = this.createSummaryRow('Subtotal:', `$${this.props.subtotal.toFixed(2)}`);
        this.element.appendChild(subtotalRow);

        // Shipping
        const shippingText = this.props.shipping === 0 ? 'FREE' : `$${this.props.shipping.toFixed(2)}`;
        const shippingRow = this.createSummaryRow('Shipping:', shippingText);
        this.element.appendChild(shippingRow);

        // Tax
        const taxRow = this.createSummaryRow('Tax:', `$${this.props.tax.toFixed(2)}`);
        this.element.appendChild(taxRow);

        const divider2 = document.createElement('div');
        divider2.className = 'summary-divider';
        this.element.appendChild(divider2);

        // Total
        const totalRow = this.createSummaryRow('Total:', `$${this.props.total.toFixed(2)}`);
        totalRow.classList.add('summary-total');
        this.element.appendChild(totalRow);

        return this.element;
    }

    createSummaryRow(label, value) {
        const row = document.createElement('div');
        row.className = 'summary-row';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        row.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;
        row.appendChild(valueSpan);

        return row;
    }

    update(props) {
        this.props = { ...this.props, ...props };
        const oldElement = this.element;
        this.render();
        if (oldElement && oldElement.parentNode) {
            oldElement.parentNode.replaceChild(this.element, oldElement);
        }
    }
}

