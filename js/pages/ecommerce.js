// E-Commerce Checkout Experience
// Complete user flow: Browse → Detail → Cart → Checkout → Confirmation

import { 
    Button, Input, Section, Badge, ProductCard, CartItem, OrderSummary,
    Stepper, StepperItem
} from '../components/index.js';
import { motionSystem, createTransition } from '../utils/motion-tokens.js';
import { triggerScaleReveal, createExperienceWrapperDOM } from '../utils/base-experience.js';

export const metadata = {
    id: 'ecommerce',
    title: 'E-Commerce Checkout Flow',
    icon: 'bx-cart',
    category: 'experiences',
    description: 'A complete shopping experience demonstrating how motion builds confidence'
};

// Sample product data
const products = [
    { id: 1, name: 'Wireless Headphones', category: 'Audio', price: 149.99, rating: 4.5, image: 'images/1.jpeg', description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.' },
    { id: 2, name: 'Smart Watch', category: 'Wearables', price: 299.99, rating: 4.8, image: 'images/2.jpeg', description: 'Advanced fitness tracking, heart rate monitoring, and seamless smartphone integration.' },
    { id: 3, name: 'Laptop Stand', category: 'Accessories', price: 49.99, rating: 4.3, image: 'images/3.jpeg', description: 'Ergonomic aluminum laptop stand with adjustable height and cooling design.' },
    { id: 4, name: 'Mechanical Keyboard', category: 'Accessories', price: 129.99, rating: 4.7, image: 'images/4.jpeg', description: 'Premium mechanical keyboard with RGB lighting and customizable switches.' },
    { id: 5, name: 'Wireless Charger', category: 'Accessories', price: 39.99, rating: 4.4, image: 'images/5.jpeg', description: 'Fast wireless charging pad compatible with all Qi-enabled devices.' },
    { id: 6, name: 'USB-C Hub', category: 'Accessories', price: 79.99, rating: 4.6, image: 'images/6.jpeg', description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery.' },
    { id: 7, name: 'Bluetooth Speaker', category: 'Audio', price: 89.99, rating: 4.5, image: 'images/7.jpeg', description: 'Portable Bluetooth speaker with 360° sound and 12-hour battery life.' },
    { id: 8, name: 'Webcam 4K', category: 'Accessories', price: 119.99, rating: 4.6, image: 'images/8.jpeg', description: '4K Ultra HD webcam with auto-focus and built-in noise-canceling microphone.' }
];

// Application state
let cart = [];
let selectedProduct = null;
let currentView = 'grid'; // 'grid', 'detail', 'cart', 'checkout', 'confirmation'
let currentCategory = 'all';
let checkoutStep = 1;
let orderNumber = null;
let components = [];

// Checkout form data
let checkoutFormData = {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: ''
};

let checkoutStepperItems = [];

let flowStepperItems = [];

export function render(container) {
    // Load page-specific styles
    loadPageStyles();
    
    // Clear existing
    container.innerHTML = '';
    components = [];
    
    // Create main content
    const contentDiv = document.createElement('div');
    
    // Main Demo Container
    const demoContainer = document.createElement('div');
    demoContainer.className = 'experience-demo scale-reveal';
    demoContainer.id = 'ecommerce-demo';
    
    // Shopping Header
    const header = createShopHeader();
    demoContainer.appendChild(header);
    
    // Dynamic Content Container
    const shopContent = document.createElement('div');
    shopContent.className = 'shop-content';
    shopContent.id = 'shopContent';
    demoContainer.appendChild(shopContent);
    
    contentDiv.appendChild(demoContainer);
    
    // Annotation
    const annotation = document.createElement('div');
    annotation.className = 'experience-annotation scale-reveal';
    annotation.innerHTML = `
        <div class="experience-annotation-title">Motion Principles Applied</div>
        <div class="experience-annotation-text">
            <strong>Confidence Through Motion:</strong> Slower, deliberate timing (${motionSystem.duration.gentle}ms) 
            during checkout reduces anxiety. Quick, responsive feedback (${motionSystem.duration.instant}ms) 
            for browsing maintains engagement.<br><br>
            <strong>Spatial Memory:</strong> Cart badge pulsing on add maintains spatial awareness. 
            Product detail expands from grid position. Multi-step form progresses horizontally, 
            not vertically, maintaining context.<br><br>
            <strong>Progressive Disclosure:</strong> Complex checkout broken into digestible steps. 
            Each step loads with staggered reveals (${motionSystem.stagger.tight}ms between fields).
        </div>
    `;
    contentDiv.appendChild(annotation);
    
    // Wrap in experience structure
    const experienceWrapper = createExperienceWrapperDOM(
        'ecommerce-experience',
        'Complete E-Commerce Checkout Flow',
        'This experience demonstrates how motion can reduce anxiety and build confidence during the purchase journey. From browsing to confirmation, every transition serves to maintain context, provide feedback, and create a seamless shopping experience.',
        contentDiv
    );
    
    container.appendChild(experienceWrapper);
    
    // Render initial view (skip exit animation on first load)
    renderProductGrid(true);
    
    // Trigger animations
    triggerScaleReveal(container);
}

export function init(container) {
    // Already initialized in render
}

export function dispose() {
    components.forEach(c => c.destroy && c.destroy());
    components = [];
}

function loadPageStyles() {
    const styleId = 'ecommerce-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/ecommerce.css';
    document.head.appendChild(link);
}

// ===== FLOW STEPS INDICATOR =====

function createFlowSteps() {
    flowStepperItems = [];
    const stepsData = [
        { id: 'grid', icon: 'bx-grid-alt', title: 'Browse' },
        { id: 'detail', icon: 'bx-info-circle', title: 'Details' },
        { id: 'cart', icon: 'bx-cart', title: 'Cart' },
        { id: 'checkout', icon: 'bx-credit-card', title: 'Checkout' },
        { id: 'confirmation', icon: 'bx-check-circle', title: 'Confirm' }
    ];
    
    const children = stepsData.map((stepData) => {
        const item = new StepperItem({
            icon: stepData.icon,
            title: stepData.title,
            active: stepData.id === currentView,
            variant: 'horizontal'
        });
        const renderedItem = item.render();
        renderedItem.dataset.step = stepData.id;
        flowStepperItems.push(item);
        return renderedItem;
    });
    
    const stepper = new Stepper({
        children,
        variant: 'horizontal',
        className: 'flow-steps scale-reveal',
        showConnectors: false
    });
    components.push(stepper);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'flow-filters';
    wrapper.appendChild(stepper.render());
    return wrapper;
}

function updateFlowStep(step) {
    flowStepperItems.forEach(item => {
        const isActive = item.element.dataset.step === step;
        item.element.classList.toggle('stepper-item--active', isActive);
    });
}

// ===== SHOP HEADER =====

function createShopHeader() {
    const header = document.createElement('div');
    header.className = 'shop-header';
    header.id = 'shopHeader';
    
    const leftSide = document.createElement('div');
    leftSide.className = 'shop-header-left';
    
    const backBtn = new Button({
        variant: 'secondary',
        iconLeft: 'bx-arrow-left',
        text: 'Back',
        className: 'back-btn',
        id: 'backBtn',
        onClick: handleBack
    });
    components.push(backBtn);
    const backBtnElement = backBtn.render();
    backBtnElement.style.display = 'none';
    leftSide.appendChild(backBtnElement);
    
    const title = document.createElement('h2');
    title.className = 'shop-title';
    title.id = 'shopTitle';
    title.textContent = 'Products';
    leftSide.appendChild(title);
    
    header.appendChild(leftSide);
    
    const cartBtn = document.createElement('button');
    cartBtn.className = 'cart-btn';
    cartBtn.id = 'cartBtn';
    cartBtn.innerHTML = '<i class="bx bx-cart"></i><span class="cart-badge" id="cartBadge">0</span>';
    cartBtn.addEventListener('click', showCart);
    header.appendChild(cartBtn);
    
    return header;
}

function updateBackButton(show, text = 'Back') {
    const backBtn = components.find(c => c.props && c.props.id === 'backBtn');
    if (backBtn && backBtn.element) {
        backBtn.element.style.display = show ? 'flex' : 'none';
        const textSpan = backBtn.element.querySelector('span');
        if (textSpan) textSpan.textContent = text;
    }
}

function updateShopTitle(title) {
    const titleEl = document.getElementById('shopTitle');
    if (titleEl) titleEl.textContent = title;
}

function handleBack() {
    if (currentView === 'detail') {
        showProductGrid();
    } else if (currentView === 'cart') {
        showProductGrid();
    } else if (currentView === 'checkout') {
        showCart();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (badge) {
        badge.textContent = totalItems;
        
        if (totalItems > 0) {
            badge.style.display = 'flex';
            badge.style.transform = 'scale(1.3)';
            setTimeout(() => {
                badge.style.transition = createTransition('transform', 'quick', 'expressive');
                badge.style.transform = 'scale(1)';
            }, 10);
        } else {
            badge.style.display = 'none';
        }
    }
}

// ===== PRODUCT GRID VIEW =====

function renderProductGrid(skipAnimation = false) {
    currentView = 'grid';
    updateFlowStep('grid');
    updateBackButton(false);
    updateShopTitle('Products');
    
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    // If there's existing content and not skipping animation, animate out first
    const existingGrid = content.querySelector('.product-grid');
    if (existingGrid && !skipAnimation) {
        const cards = existingGrid.querySelectorAll('.product-card');
        
        gsap.to(cards, {
            opacity: 0,
            x: 30,
            y: 30,
            scale: 0.9,
            duration: 0.25,
            stagger: 0.04,
            ease: 'power2.in',
            onComplete: () => {
                buildProductGrid(content);
            }
        });
        return;
    }
    
    buildProductGrid(content);
}

function buildProductGrid(content) {
    // Clear components
    components.forEach(c => {
        if (c.element && c.element.closest('#shopContent')) {
            c.destroy && c.destroy();
        }
    });
    components = components.filter(c => !c.element || !c.element.closest('#shopContent'));
    
    content.innerHTML = '';
    
    // Category Filter
    const categoryFilter = createCategoryFilter();
    content.appendChild(categoryFilter);
    
    // Product Grid
    const productGrid = document.createElement('div');
    productGrid.className = 'product-grid';
    productGrid.id = 'productGrid';
    
    getFilteredProducts().forEach(product => {
        const productCard = new ProductCard({
            ...product,
            className: 'scale-reveal',
            onClick: (prod) => showProductDetail(prod.id),
            onAddToCart: (prod) => {
                addToCart(prod.id);
                // Animate the button
                gsap.to(productCard.element.querySelector('.quick-add-btn'), {
                    scale: 1.2,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1
                });
            }
        });
        components.push(productCard);
        productGrid.appendChild(productCard.render());
    });
    
    content.appendChild(productGrid);
    
    animateIn(content);
}

function createCategoryFilter() {
    const filterDiv = document.createElement('div');
    filterDiv.className = 'category-filter';
    
    const categories = [
        { value: 'all', label: 'All Products' },
        { value: 'Audio', label: 'Audio' },
        { value: 'Wearables', label: 'Wearables' },
        { value: 'Accessories', label: 'Accessories' }
    ];
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${cat.value === currentCategory ? 'active' : ''}`;
        btn.dataset.category = cat.value;
        btn.textContent = cat.label;
        btn.addEventListener('click', () => {
            currentCategory = cat.value;
            renderProductGrid();
        });
        filterDiv.appendChild(btn);
    });
    
    return filterDiv;
}

function showProductGrid() {
    renderProductGrid();
}

function getFilteredProducts() {
    if (currentCategory === 'all') return products;
    return products.filter(p => p.category === currentCategory);
}

// ===== PRODUCT DETAIL VIEW =====

function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    selectedProduct = product;
    currentView = 'detail';
    updateFlowStep('detail');
    updateBackButton(true, 'Back to Products');
    updateShopTitle(product.name);
    
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    // Fade out and transition
    gsap.to(content, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        onComplete: () => {
            content.innerHTML = '';
            
            const detailDiv = document.createElement('div');
            detailDiv.className = 'product-detail';
            
            // Image
            const imageDiv = document.createElement('div');
            imageDiv.className = 'product-detail-image';
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.name;
            imageDiv.appendChild(img);
            detailDiv.appendChild(imageDiv);
            
            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-detail-info';
            
            const category = document.createElement('div');
            category.className = 'product-detail-category';
            category.textContent = product.category;
            infoDiv.appendChild(category);
            
            const name = document.createElement('h2');
            name.className = 'product-detail-name';
            name.textContent = product.name;
            infoDiv.appendChild(name);
            
            const rating = document.createElement('div');
            rating.className = 'product-detail-rating';
            rating.innerHTML = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating)) + `<span>${product.rating} out of 5</span>`;
            infoDiv.appendChild(rating);
            
            const price = document.createElement('div');
            price.className = 'product-detail-price';
            price.textContent = `$${product.price.toFixed(2)}`;
            infoDiv.appendChild(price);
            
            const description = document.createElement('div');
            description.className = 'product-detail-description';
            const descP = document.createElement('p');
            descP.textContent = product.description;
            description.appendChild(descP);
            infoDiv.appendChild(description);
            
            const features = document.createElement('div');
            features.className = 'product-detail-features';
            features.innerHTML = `
                <h4>Features:</h4>
                <ul>
                    <li>Premium build quality</li>
                    <li>30-day money-back guarantee</li>
                    <li>Free shipping on orders over $50</li>
                    <li>1-year warranty included</li>
                </ul>
            `;
            infoDiv.appendChild(features);
            
            const addBtn = new Button({
                variant: 'primary',
                iconLeft: 'bx-cart-add',
                text: 'Add to Cart',
                className: 'add-to-cart-btn',
                onClick: () => {
                    addToCart(product.id);
                    addBtn.element.innerHTML = '<i class="bx bx-check"></i><span>Added!</span>';
                    addBtn.element.style.background = 'var(--ecom-success)';
                    setTimeout(() => {
                        addBtn.element.innerHTML = '<i class="bx bx-cart-add"></i><span>Add to Cart</span>';
                        addBtn.element.style.background = '';
                    }, 1500);
                }
            });
            components.push(addBtn);
            infoDiv.appendChild(addBtn.render());
            
            detailDiv.appendChild(infoDiv);
            content.appendChild(detailDiv);
            
            gsap.fromTo(content, 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
        }
    });
}

// ===== CART MANAGEMENT =====

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product: product,
            quantity: 1
        });
    }
    
    updateCartBadge();
}

function showCart() {
    currentView = 'cart';
    updateFlowStep('cart');
    updateBackButton(true, 'Continue Shopping');
    updateShopTitle('Shopping Cart');
    
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    gsap.to(content, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            content.innerHTML = '';
            
            if (cart.length === 0) {
                renderEmptyCart(content);
            } else {
                renderCartWithItems(content);
            }
            
            gsap.fromTo(content, 
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
        }
    });
}

function renderEmptyCart(content) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-cart';
    emptyDiv.innerHTML = `
        <i class='bx bx-cart'></i>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
    `;
    
    const continueBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-right-arrow-alt',
        text: 'Continue Shopping',
        onClick: showProductGrid
    });
    components.push(continueBtn);
    emptyDiv.appendChild(continueBtn.render());
    
    content.appendChild(emptyDiv);
}

function renderCartWithItems(content) {
    const cartContainer = document.createElement('div');
    cartContainer.className = 'cart-container';
    
    // Cart Items
    const cartItems = document.createElement('div');
    cartItems.className = 'cart-items';
    
    cart.forEach((item, index) => {
        const cartItem = new CartItem({
            product: item.product,
            quantity: item.quantity,
            index: index,
            onQuantityChange: (idx, action) => {
                if (action === 'increase') {
                    cart[idx].quantity += 1;
                } else if (action === 'decrease') {
                    if (cart[idx].quantity > 1) {
                        cart[idx].quantity -= 1;
                    } else {
                        removeFromCart(idx);
                        return;
                    }
                }
                updateCartBadge();
                showCart();
            },
            onRemove: (idx) => removeFromCart(idx)
        });
        components.push(cartItem);
        cartItems.appendChild(cartItem.render());
    });
    
    cartContainer.appendChild(cartItems);
    
    // Cart Summary
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const tax = calculateTax();
    const total = calculateTotal();
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary';
    
    const orderSummary = new OrderSummary({
        subtotal,
        shipping,
        tax,
        total,
        showItems: false
    });
    components.push(orderSummary);
    summaryDiv.appendChild(orderSummary.render());
    
    const checkoutBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-right-arrow-alt',
        text: 'Proceed to Checkout',
        className: 'checkout-btn',
        onClick: renderCheckout
    });
    components.push(checkoutBtn);
    summaryDiv.appendChild(checkoutBtn.render());
    
    if (shipping > 0) {
        const notice = document.createElement('p');
        notice.className = 'shipping-notice';
        notice.innerHTML = `<i class='bx bx-info-circle'></i>Add $${(50 - subtotal).toFixed(2)} more for free shipping`;
        summaryDiv.appendChild(notice);
    }
    
    cartContainer.appendChild(summaryDiv);
    content.appendChild(cartContainer);
}

function removeFromCart(index) {
    const cartItem = components.find(c => c.props && c.props.index === index && c.element);
    
    if (cartItem && cartItem.element) {
        gsap.to(cartItem.element, {
            opacity: 0,
            x: -30,
            duration: 0.2,
            onComplete: () => {
                cart.splice(index, 1);
                updateCartBadge();
                showCart();
            }
        });
    }
}

// ===== CHECKOUT VIEW =====

function createCheckoutTimeline() {
    const timeline = document.createElement('div');
    timeline.className = 'checkout-timeline';
    timeline.id = 'checkoutTimeline';
    
    const steps = [
        { number: 1, title: 'Shipping', subtitle: 'Delivery details' },
        { number: 2, title: 'Payment', subtitle: 'Billing information' },
        { number: 3, title: 'Review', subtitle: 'Confirm order' }
    ];
    
    checkoutStepperItems = [];
    
    steps.forEach((step, index) => {
        const isActive = step.number === checkoutStep;
        const isCompleted = step.number < checkoutStep;
        
        const stepEl = document.createElement('div');
        stepEl.className = 'timeline-step';
        if (isActive) stepEl.classList.add('timeline-step--active');
        if (isCompleted) stepEl.classList.add('timeline-step--completed');
        stepEl.dataset.step = step.number;
        
        // Station dot (like a subway stop)
        const station = document.createElement('div');
        station.className = 'timeline-station';
        
        const dot = document.createElement('div');
        dot.className = 'timeline-dot';
        
        const ring = document.createElement('div');
        ring.className = 'timeline-ring';
        
        const checkIcon = document.createElement('i');
        checkIcon.className = 'bx bx-check timeline-check';
        
        dot.appendChild(ring);
        dot.appendChild(checkIcon);
        station.appendChild(dot);
        
        // Connect line (like a subway track)
        if (index < steps.length - 1) {
            const line = document.createElement('div');
            line.className = 'timeline-line';
            station.appendChild(line);
        }
        
        stepEl.appendChild(station);
        
        // Step info
        const info = document.createElement('div');
        info.className = 'timeline-info';
        
        const number = document.createElement('div');
        number.className = 'timeline-number';
        number.textContent = `Step ${step.number}`;
        info.appendChild(number);
        
        const title = document.createElement('div');
        title.className = 'timeline-title';
        title.textContent = step.title;
        info.appendChild(title);
        
        const subtitle = document.createElement('div');
        subtitle.className = 'timeline-subtitle';
        subtitle.textContent = step.subtitle;
        info.appendChild(subtitle);
        
        stepEl.appendChild(info);
        
        timeline.appendChild(stepEl);
        
        // Store reference for updates
        checkoutStepperItems.push({
            element: stepEl,
            number: step.number
        });
    });
    
    return timeline;
}

function updateCheckoutTimeline(step) {
    checkoutStepperItems.forEach((item) => {
        const isActive = item.number === step;
        const isCompleted = item.number < step;
        
        item.element.classList.toggle('timeline-step--active', isActive);
        item.element.classList.toggle('timeline-step--completed', isCompleted);
    });
}

function renderCheckout() {
    currentView = 'checkout';
    updateFlowStep('checkout');
    updateBackButton(true, 'Back to Cart');
    updateShopTitle('Checkout');
    
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    gsap.to(content, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            content.innerHTML = '';
            checkoutStep = 1;
            
            const checkoutContainer = document.createElement('div');
            checkoutContainer.className = 'checkout-container';
            
            // Create subway-style timeline
            const timeline = createCheckoutTimeline();
            checkoutContainer.appendChild(timeline);
            
            // Checkout Forms Container
            const formsDiv = document.createElement('div');
            formsDiv.className = 'checkout-forms';
            formsDiv.id = 'checkoutForms';
            checkoutContainer.appendChild(formsDiv);
            
            // Checkout Summary
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'checkout-summary';
            summaryDiv.id = 'checkoutSummary';
            
            const orderSummary = new OrderSummary({
                subtotal: calculateSubtotal(),
                shipping: calculateShipping(),
                tax: calculateTax(),
                total: calculateTotal(),
                items: cart,
                showItems: true
            });
            components.push(orderSummary);
            summaryDiv.appendChild(orderSummary.render());
            
            checkoutContainer.appendChild(summaryDiv);
            content.appendChild(checkoutContainer);
            
            // Render first step
            renderCheckoutStep(1);
            
            gsap.fromTo(content, 
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
        }
    });
}

function renderCheckoutStep(step) {
    checkoutStep = step;
    
    const formsDiv = document.getElementById('checkoutForms');
    if (!formsDiv) return;
    
    // Update timeline
    updateCheckoutTimeline(step);
    
    // Clear forms div
    formsDiv.innerHTML = '';
    
    if (step === 1) {
        renderShippingForm(formsDiv);
    } else if (step === 2) {
        renderPaymentForm(formsDiv);
    } else if (step === 3) {
        renderReviewForm(formsDiv);
    }
}

function renderShippingForm(container) {
    const form = document.createElement('div');
    form.className = 'checkout-form active';
    
    const title = document.createElement('h3');
    title.textContent = 'Shipping Information';
    form.appendChild(title);
    
    // Form fields
    const firstNameInput = new Input({
        id: 'firstName',
        label: 'First Name',
        placeholder: 'John',
        value: checkoutFormData.firstName,
        onChange: (val) => checkoutFormData.firstName = val
    });
    
    const lastNameInput = new Input({
        id: 'lastName',
        label: 'Last Name',
        placeholder: 'Doe',
        value: checkoutFormData.lastName,
        onChange: (val) => checkoutFormData.lastName = val
    });
    
    const nameRow = document.createElement('div');
    nameRow.className = 'form-grid';
    nameRow.appendChild(firstNameInput.render());
    nameRow.appendChild(lastNameInput.render());
    form.appendChild(nameRow);
    
    const emailInput = new Input({
        id: 'email',
        type: 'email',
        label: 'Email',
        placeholder: 'john@example.com',
        value: checkoutFormData.email,
        onChange: (val) => checkoutFormData.email = val
    });
    form.appendChild(emailInput.render());
    
    const addressInput = new Input({
        id: 'address',
        label: 'Address',
        placeholder: '123 Main St',
        value: checkoutFormData.address,
        onChange: (val) => checkoutFormData.address = val
    });
    form.appendChild(addressInput.render());
    
    const cityInput = new Input({
        id: 'city',
        label: 'City',
        placeholder: 'San Francisco',
        value: checkoutFormData.city,
        onChange: (val) => checkoutFormData.city = val
    });
    
    const stateInput = new Input({
        id: 'state',
        label: 'State',
        placeholder: 'CA',
        value: checkoutFormData.state,
        onChange: (val) => checkoutFormData.state = val
    });
    
    const zipInput = new Input({
        id: 'zip',
        label: 'ZIP Code',
        placeholder: '94102',
        value: checkoutFormData.zip,
        onChange: (val) => checkoutFormData.zip = val
    });
    
    const addressRow = document.createElement('div');
    addressRow.className = 'form-grid';
    addressRow.appendChild(cityInput.render());
    addressRow.appendChild(stateInput.render());
    addressRow.appendChild(zipInput.render());
    form.appendChild(addressRow);
    
    const continueBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-right-arrow-alt',
        text: 'Continue to Payment',
        className: 'full-width',
        onClick: () => {
            if (validateShippingForm()) {
                transitionCheckoutStep(2);
            }
        }
    });
    components.push(continueBtn);
    form.appendChild(continueBtn.render());
    
    components.push(firstNameInput, lastNameInput, emailInput, addressInput, cityInput, stateInput, zipInput);
    container.appendChild(form);
    
    // Animate in fields
    requestAnimationFrame(() => {
        const fields = form.querySelectorAll('.form-group, .form-grid, .btn');
        gsap.fromTo(fields,
            { opacity: 0, y: 10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.out'
            }
        );
    });
}

function renderPaymentForm(container) {
    const form = document.createElement('div');
    form.className = 'checkout-form active';
    
    const title = document.createElement('h3');
    title.textContent = 'Payment Information';
    form.appendChild(title);
    
    const cardNumberInput = new Input({
        id: 'cardNumber',
        label: 'Card Number',
        placeholder: '1234 5678 9012 3456',
        value: checkoutFormData.cardNumber,
        onChange: (val) => {
            // Format card number
            const formatted = val.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || val;
            checkoutFormData.cardNumber = formatted;
            cardNumberInput.element.querySelector('input').value = formatted;
        }
    });
    form.appendChild(cardNumberInput.render());
    
    const expiryInput = new Input({
        id: 'expiry',
        label: 'Expiry Date',
        placeholder: 'MM/YY',
        value: checkoutFormData.expiry,
        onChange: (val) => {
            // Format expiry
            let formatted = val.replace(/\D/g, '');
            if (formatted.length >= 2) {
                formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
            }
            checkoutFormData.expiry = formatted;
            expiryInput.element.querySelector('input').value = formatted;
        }
    });
    
    const cvvInput = new Input({
        id: 'cvv',
        label: 'CVV',
        placeholder: '123',
        value: checkoutFormData.cvv,
        onChange: (val) => checkoutFormData.cvv = val
    });
    
    const cardRow = document.createElement('div');
    cardRow.className = 'form-grid';
    cardRow.appendChild(expiryInput.render());
    cardRow.appendChild(cvvInput.render());
    form.appendChild(cardRow);
    
    const cardholderInput = new Input({
        id: 'cardholderName',
        label: 'Cardholder Name',
        placeholder: 'John Doe',
        value: checkoutFormData.cardholderName,
        onChange: (val) => checkoutFormData.cardholderName = val
    });
    form.appendChild(cardholderInput.render());
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'checkout-actions';
    
    const backBtn = new Button({
        variant: 'secondary',
        iconLeft: 'bx-left-arrow-alt',
        text: 'Back',
        onClick: () => transitionCheckoutStep(1)
    });
    
    const continueBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-right-arrow-alt',
        text: 'Continue to Review',
        onClick: () => {
            if (validatePaymentForm()) {
                transitionCheckoutStep(3);
            }
        }
    });
    
    components.push(backBtn, continueBtn);
    actionsDiv.appendChild(backBtn.render());
    actionsDiv.appendChild(continueBtn.render());
    form.appendChild(actionsDiv);
    
    components.push(cardNumberInput, expiryInput, cvvInput, cardholderInput);
    container.appendChild(form);
    
    // Animate in fields
    requestAnimationFrame(() => {
        const fields = form.querySelectorAll('.form-group, .form-grid, .checkout-actions');
        gsap.fromTo(fields,
            { opacity: 0, y: 10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.out'
            }
        );
    });
}

function renderReviewForm(container) {
    const form = document.createElement('div');
    form.className = 'checkout-form active';
    
    const title = document.createElement('h3');
    title.textContent = 'Review Your Order';
    form.appendChild(title);
    
    // Shipping section
    const shippingSection = document.createElement('div');
    shippingSection.className = 'review-section';
    shippingSection.innerHTML = `
        <h4>Shipping Address</h4>
        <p>${checkoutFormData.firstName} ${checkoutFormData.lastName}<br>
        ${checkoutFormData.address}<br>
        ${checkoutFormData.city}, ${checkoutFormData.state} ${checkoutFormData.zip}</p>
        <button class="edit-btn" id="editShipping">Edit</button>
    `;
    form.appendChild(shippingSection);
    
    document.getElementById('editShipping')?.addEventListener('click', () => transitionCheckoutStep(1));
    
    // Payment section
    const paymentSection = document.createElement('div');
    paymentSection.className = 'review-section';
    const lastFour = checkoutFormData.cardNumber.replace(/\s/g, '').slice(-4);
    paymentSection.innerHTML = `
        <h4>Payment Method</h4>
        <p>•••• •••• •••• ${lastFour}</p>
        <button class="edit-btn" id="editPayment">Edit</button>
    `;
    form.appendChild(paymentSection);
    
    document.getElementById('editPayment')?.addEventListener('click', () => transitionCheckoutStep(2));
    
    // Order items
    const itemsSection = document.createElement('div');
    itemsSection.className = 'review-section';
    itemsSection.innerHTML = '<h4>Order Items</h4><div class="review-items"></div>';
    
    const reviewItems = itemsSection.querySelector('.review-items');
    cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'review-item';
        itemDiv.innerHTML = `
            <span>${item.product.name} × ${item.quantity}</span>
            <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
        `;
        reviewItems.appendChild(itemDiv);
    });
    
    form.appendChild(itemsSection);
    
    // Total
    const totalDiv = document.createElement('div');
    totalDiv.className = 'review-total';
    totalDiv.innerHTML = `
        <span>Total:</span>
        <span>$${calculateTotal().toFixed(2)}</span>
    `;
    form.appendChild(totalDiv);
    
    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'checkout-actions';
    
    const backBtn = new Button({
        variant: 'secondary',
        iconLeft: 'bx-left-arrow-alt',
        text: 'Back',
        onClick: () => transitionCheckoutStep(2)
    });
    
    const placeOrderBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-check',
        text: 'Place Order',
        onClick: processPayment
    });
    
    components.push(backBtn, placeOrderBtn);
    actionsDiv.appendChild(backBtn.render());
    actionsDiv.appendChild(placeOrderBtn.render());
    form.appendChild(actionsDiv);
    
    container.appendChild(form);
    
    // Animate in sections
    requestAnimationFrame(() => {
        const sections = form.querySelectorAll('.review-section, .review-total, .checkout-actions');
        gsap.fromTo(sections,
            { opacity: 0, y: 10 },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.out'
            }
        );
    });
}

function transitionCheckoutStep(newStep) {
    const formsDiv = document.getElementById('checkoutForms');
    if (!formsDiv) return;
    
    gsap.to(formsDiv, {
        opacity: 0,
        x: newStep > checkoutStep ? -20 : 20,
        duration: 0.2,
        onComplete: () => {
            renderCheckoutStep(newStep);
            gsap.fromTo(formsDiv,
                { opacity: 0, x: newStep > checkoutStep ? 20 : -20 },
                { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            );
        }
    });
}

function validateShippingForm() {
    const required = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'zip'];
    for (const field of required) {
        if (!checkoutFormData[field] || checkoutFormData[field].trim() === '') {
            alert('Please fill in all shipping fields');
            return false;
        }
    }
    return true;
}

function validatePaymentForm() {
    const cardNumber = checkoutFormData.cardNumber.replace(/\s/g, '');
    if (!cardNumber || cardNumber.length < 16) {
        alert('Please enter a valid card number');
        return false;
    }
    if (!checkoutFormData.expiry || !checkoutFormData.cvv || !checkoutFormData.cardholderName) {
        alert('Please fill in all payment fields');
        return false;
    }
    return true;
}

// ===== PAYMENT PROCESSING =====

function processPayment() {
    const placeOrderBtn = components.find(c => c.element && c.element.textContent.includes('Place Order'));
    if (placeOrderBtn) {
        placeOrderBtn.element.disabled = true;
        placeOrderBtn.element.innerHTML = `
            <span class="processing-spinner"></span>
            <span>Processing...</span>
        `;
    }
    
    // Simulate payment processing
    setTimeout(() => {
        orderNumber = Math.floor(100000 + Math.random() * 900000);
        showConfirmation();
    }, 2500);
}

// ===== CONFIRMATION VIEW =====

function showConfirmation() {
    currentView = 'confirmation';
    updateFlowStep('confirmation');
    updateBackButton(false);
    updateShopTitle('Order Confirmed');
    
    const content = document.getElementById('shopContent');
    if (!content) return;
    
    gsap.to(content, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            content.innerHTML = '';
            
            const confirmationDiv = document.createElement('div');
            confirmationDiv.className = 'confirmation-container';
            
            confirmationDiv.innerHTML = `
                <div class="confirmation-icon">
                    <i class='bx bx-check-circle'></i>
                </div>
                <h2 class="confirmation-title">Order Placed Successfully!</h2>
                <p class="confirmation-subtitle">Thank you for your purchase</p>
                
                <div class="confirmation-details">
                    <div class="confirmation-row">
                        <span>Order Number:</span>
                        <strong>#${orderNumber}</strong>
                    </div>
                    <div class="confirmation-row">
                        <span>Order Total:</span>
                        <strong>$${calculateTotal().toFixed(2)}</strong>
                    </div>
                    <div class="confirmation-row">
                        <span>Estimated Delivery:</span>
                        <strong>${getEstimatedDelivery()}</strong>
                    </div>
                </div>
                
                <div class="confirmation-message">
                    <i class='bx bx-envelope'></i>
                    <p>A confirmation email has been sent to your email address with order details and tracking information.</p>
                </div>
            `;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'confirmation-actions';
            
            const continueBtn = new Button({
                variant: 'primary',
                iconRight: 'bx-right-arrow-alt',
                text: 'Continue Browsing',
                onClick: () => {
                    cart = [];
                    updateCartBadge();
                    checkoutStep = 1;
                    checkoutFormData = {
                        firstName: '', lastName: '', email: '', address: '', city: '', state: '', zip: '',
                        cardNumber: '', expiry: '', cvv: '', cardholderName: ''
                    };
                    showProductGrid();
                }
            });
            components.push(continueBtn);
            actionsDiv.appendChild(continueBtn.render());
            
            confirmationDiv.appendChild(actionsDiv);
            content.appendChild(confirmationDiv);
            
            // Celebration animation
            gsap.fromTo(content, 
                { opacity: 0 },
                { 
                    opacity: 1, 
                    duration: 0.3,
                    onComplete: () => {
                        const icon = content.querySelector('.confirmation-icon');
                        gsap.fromTo(icon,
                            { scale: 0, opacity: 0 },
                            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)' }
                        );
                        
                        const details = content.querySelectorAll('.confirmation-row, .confirmation-message, .confirmation-actions');
                        gsap.fromTo(details,
                            { opacity: 0, y: 10 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.4,
                                delay: 0.6,
                                stagger: 0.1,
                                ease: 'power2.out'
                            }
                        );
                    }
                }
            );
        }
    });
}

function getEstimatedDelivery() {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 5);
    
    return deliveryDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
}

// ===== UTILITY FUNCTIONS =====

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

function calculateShipping() {
    const subtotal = calculateSubtotal();
    return subtotal > 50 ? 0 : 9.99;
}

function calculateTax() {
    return calculateSubtotal() * 0.08;
}

function calculateTotal() {
    return calculateSubtotal() + calculateShipping() + calculateTax();
}

function animateIn(element) {
    requestAnimationFrame(() => {
        triggerScaleReveal(element);
    });
}
