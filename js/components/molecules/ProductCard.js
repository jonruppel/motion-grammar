// ProductCard Component
// Displays product information with image, price, rating

import { Component } from '../Component.js';

export class ProductCard extends Component {
    constructor(props = {}) {
        super();
        this.props = {
            id: props.id || null,
            name: props.name || 'Product Name',
            category: props.category || '',
            price: props.price || 0,
            rating: props.rating || 0,
            image: props.image || '',
            description: props.description || '',
            onClick: props.onClick || null,
            onAddToCart: props.onAddToCart || null,
            className: props.className || ''
        };
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `product-card ${this.props.className}`;
        if (this.props.id) {
            this.element.dataset.productId = this.props.id;
        }

        const imageDiv = document.createElement('div');
        imageDiv.className = 'product-image';
        
        const img = document.createElement('img');
        img.src = this.props.image;
        img.alt = this.props.name;
        imageDiv.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'product-info';

        const category = document.createElement('div');
        category.className = 'product-category';
        category.textContent = this.props.category;
        infoDiv.appendChild(category);

        const name = document.createElement('h3');
        name.className = 'product-name';
        name.textContent = this.props.name;
        infoDiv.appendChild(name);

        const rating = document.createElement('div');
        rating.className = 'product-rating';
        const stars = '★'.repeat(Math.floor(this.props.rating)) + '☆'.repeat(5 - Math.floor(this.props.rating));
        rating.innerHTML = `${stars}<span>${this.props.rating}</span>`;
        infoDiv.appendChild(rating);

        const footer = document.createElement('div');
        footer.className = 'product-footer';

        const priceSpan = document.createElement('span');
        priceSpan.className = 'product-price';
        priceSpan.textContent = `$${this.props.price.toFixed(2)}`;
        footer.appendChild(priceSpan);

        const addBtn = document.createElement('button');
        addBtn.className = 'quick-add-btn';
        addBtn.innerHTML = '<i class="bx bx-cart-add"></i>';
        addBtn.dataset.productId = this.props.id;
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.props.onAddToCart) {
                this.props.onAddToCart(this.props);
            }
        });
        footer.appendChild(addBtn);

        infoDiv.appendChild(footer);

        this.element.appendChild(imageDiv);
        this.element.appendChild(infoDiv);

        // Click handler for the whole card
        if (this.props.onClick) {
            this.element.addEventListener('click', (e) => {
                // Don't trigger if clicking the add button
                if (e.target.closest('.quick-add-btn')) return;
                this.props.onClick(this.props);
            });
        }

        return this.element;
    }
}

