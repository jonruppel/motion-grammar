// CartItem Component
// Displays cart line item with quantity controls

import { Component } from '../Component.js';

export class CartItem extends Component {
    constructor(props = {}) {
        super();
        this.props = {
            product: props.product || {},
            quantity: props.quantity || 1,
            index: props.index || 0,
            onQuantityChange: props.onQuantityChange || null,
            onRemove: props.onRemove || null,
            className: props.className || ''
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `cart-item ${this.props.className}`;
        this.element.dataset.cartIndex = this.props.index;

        const img = document.createElement('img');
        img.src = this.props.product.image;
        img.alt = this.props.product.name;
        img.className = 'cart-item-image';
        this.element.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'cart-item-info';

        const name = document.createElement('h4');
        name.textContent = this.props.product.name;
        infoDiv.appendChild(name);

        const category = document.createElement('p');
        category.className = 'cart-item-category';
        category.textContent = this.props.product.category;
        infoDiv.appendChild(category);

        const price = document.createElement('p');
        price.className = 'cart-item-price';
        price.textContent = `$${this.props.product.price.toFixed(2)}`;
        infoDiv.appendChild(price);

        this.element.appendChild(infoDiv);

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'cart-item-controls';

        const quantityControl = document.createElement('div');
        quantityControl.className = 'quantity-control';

        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn';
        decreaseBtn.innerHTML = '<i class="bx bx-minus"></i>';
        decreaseBtn.addEventListener('click', () => {
            if (this.props.onQuantityChange) {
                this.props.onQuantityChange(this.props.index, 'decrease');
            }
        });
        quantityControl.appendChild(decreaseBtn);

        this.quantityValue = document.createElement('span');
        this.quantityValue.className = 'quantity-value';
        this.quantityValue.textContent = this.props.quantity;
        quantityControl.appendChild(this.quantityValue);

        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'quantity-btn';
        increaseBtn.innerHTML = '<i class="bx bx-plus"></i>';
        increaseBtn.addEventListener('click', () => {
            if (this.props.onQuantityChange) {
                this.props.onQuantityChange(this.props.index, 'increase');
            }
        });
        quantityControl.appendChild(increaseBtn);

        controlsDiv.appendChild(quantityControl);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-item-btn';
        removeBtn.innerHTML = '<i class="bx bx-trash"></i>';
        removeBtn.addEventListener('click', () => {
            if (this.props.onRemove) {
                this.props.onRemove(this.props.index);
            }
        });
        controlsDiv.appendChild(removeBtn);

        this.element.appendChild(controlsDiv);

        return this.element;
    }

    updateQuantity(newQuantity) {
        this.props.quantity = newQuantity;
        if (this.quantityValue) {
            this.quantityValue.textContent = newQuantity;
        }
    }
}

