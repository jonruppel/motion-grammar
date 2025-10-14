// Component Library Showcase
// Browse and explore all design system components

import { 
    Button, Input, Select, Badge, Icon, Checkbox, Text, Toggle,
    Card, CardGrid, List, ListItem, Loader, Logo, Section, TaskItem,
    Modal, Dropdown, StatCard, StockListItem, StockHeader, WeatherCard,
    Stepper, StepperItem, ProductCard, CartItem, OrderSummary
} from '../components/index.js';
import { triggerScaleReveal } from '../utils/base-experience.js';

export const header = {
    title: 'Component Library',
    description: 'A complete showcase of all atoms, molecules, and organisms in the design system'
};

let showcaseModal = null;
let components = [];

// Component definitions with examples
const componentData = {
    atoms: [
        {
            name: 'Button',
            description: 'Interactive button with multiple variants and sizes',
            component: Button,
            examples: [
                { props: { variant: 'primary', text: 'Primary Button' }, label: 'Primary' },
                { props: { variant: 'secondary', text: 'Secondary Button' }, label: 'Secondary' },
                { props: { variant: 'ghost', text: 'Ghost Button' }, label: 'Ghost' },
                { props: { variant: 'primary', iconLeft: 'bx-plus', text: 'With Icon' }, label: 'Icon Left' },
                { props: { variant: 'icon', icon: 'bx-heart' }, label: 'Icon Only' }
            ],
            code: `new Button({
    variant: 'primary',
    text: 'Click Me',
    iconLeft: 'bx-plus',
    onClick: () => console.log('clicked')
})`
        },
        {
            name: 'Input',
            description: 'Text input field with label and validation states',
            component: Input,
            examples: [
                { props: { label: 'Email', placeholder: 'Enter your email', type: 'email' }, label: 'Standard' },
                { props: { label: 'Password', type: 'password', placeholder: 'Enter password' }, label: 'Password' },
                { props: { label: 'Disabled', value: 'Cannot edit', disabled: true }, label: 'Disabled' }
            ],
            code: `new Input({
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    onChange: (value) => console.log(value)
})`
        },
        {
            name: 'Badge',
            description: 'Status indicator with multiple variants',
            component: Badge,
            examples: [
                { props: { text: 'High Priority', variant: 'danger' }, label: 'Danger' },
                { props: { text: 'In Progress', variant: 'warning' }, label: 'Warning' },
                { props: { text: 'Completed', variant: 'success' }, label: 'Success' },
                { props: { text: 'Default', variant: 'default' }, label: 'Default' }
            ],
            code: `new Badge({
    text: 'High Priority',
    variant: 'danger'
})`
        },
        {
            name: 'Checkbox',
            description: 'Checkbox input with label',
            component: Checkbox,
            examples: [
                { props: { label: 'Unchecked', checked: false }, label: 'Unchecked' },
                { props: { label: 'Checked', checked: true }, label: 'Checked' },
                { props: { label: 'Disabled', disabled: true }, label: 'Disabled' }
            ],
            code: `new Checkbox({
    label: 'Accept terms',
    checked: false,
    onChange: (checked) => console.log(checked)
})`
        },
        {
            name: 'Select',
            description: 'Dropdown select with options',
            component: Select,
            examples: [
                { 
                    props: { 
                        label: 'Category',
                        options: [
                            { value: 'design', label: 'Design' },
                            { value: 'dev', label: 'Development' },
                            { value: 'research', label: 'Research' }
                        ]
                    }, 
                    label: 'Standard' 
                }
            ],
            code: `new Select({
    label: 'Category',
    options: [
        { value: 'design', label: 'Design' },
        { value: 'dev', label: 'Development' }
    ],
    onChange: (value) => console.log(value)
})`
        },
        {
            name: 'Icon',
            description: 'Icon component using BoxIcons',
            component: Icon,
            examples: [
                { props: { name: 'bx-heart' }, label: 'Heart' },
                { props: { name: 'bx-star' }, label: 'Star' },
                { props: { name: 'bx-user' }, label: 'User' },
                { props: { name: 'bx-check-circle' }, label: 'Check' }
            ],
            code: `new Icon({
    name: 'bx-heart'
})`
        },
        {
            name: 'Text',
            description: 'Flexible text component with semantic HTML tags',
            component: Text,
            examples: [
                { props: { tag: 'h1', text: 'Heading 1', variant: 'title' }, label: 'Title (H1)' },
                { props: { tag: 'h3', text: 'Heading 3', variant: 'heading' }, label: 'Heading (H3)' },
                { props: { tag: 'p', text: 'This is body text', variant: 'body' }, label: 'Body (P)' },
                { props: { tag: 'span', text: 'Small caption', variant: 'caption' }, label: 'Caption' }
            ],
            code: `new Text({
    tag: 'h2',
    text: 'Hello World',
    variant: 'heading',
    className: 'custom-class'
})`
        },
        {
            name: 'Toggle',
            description: 'Switch/toggle component for binary settings',
            component: Toggle,
            examples: [
                { props: { label: 'Notifications', checked: true }, label: 'Checked' },
                { props: { label: 'Dark Mode', checked: false }, label: 'Unchecked' },
                { props: { label: 'Disabled', checked: true, disabled: true }, label: 'Disabled' }
            ],
            code: `new Toggle({
    label: 'Notifications',
    checked: true,
    onChange: (checked) => console.log(checked)
})`
        }
    ],
    molecules: [
        {
            name: 'Card',
            description: 'Content card with optional image and actions',
            component: Card,
            examples: [
                { 
                    props: { 
                        title: 'Sample Card Title',
                        description: 'This is a detailed description for the card that demonstrates how it looks with actual content. Cards can contain images, buttons, and other components.',
                        className: 'scale-reveal'
                    }, 
                    label: 'Full Content Card' 
                }
            ],
            code: `new Card({
    title: 'Card Title',
    description: 'Card description text',
    className: 'scale-reveal'
})`
        },
        {
            name: 'Loader',
            description: 'Loading spinner animation',
            component: Loader,
            examples: [
                { props: { size: 'md' }, label: 'Medium Loader' },
                { props: { size: 'sm' }, label: 'Small Loader' },
                { props: { size: 'lg' }, label: 'Large Loader' }
            ],
            code: `new Loader({
    size: 'md'
})`
        },
        {
            name: 'Section',
            description: 'Content section with title and description',
            component: Section,
            examples: [
                { 
                    props: { 
                        title: 'Sample Section Title',
                        description: 'This is a sample section description that shows how sections work with full content. Sections are great for organizing page content hierarchically.'
                    }, 
                    label: 'Full Section' 
                }
            ],
            code: `new Section({
    title: 'Section Title',
    description: 'Section description',
    className: 'scale-reveal'
})`
        },
        {
            name: 'List',
            description: 'Unordered or ordered list container',
            component: List,
            examples: [
                { 
                    props: { 
                        items: ['First item', 'Second item', 'Third item']
                    }, 
                    label: 'Basic List' 
                }
            ],
            code: `new List({
    items: ['Item 1', 'Item 2', 'Item 3'],
    ordered: false
})`
        },
        {
            name: 'Dropdown',
            description: 'Custom dropdown with portal positioning',
            component: Dropdown,
            examples: [
                { 
                    props: { 
                        options: [
                            { value: 'aapl', label: 'AAPL', sublabel: 'Apple Inc.' },
                            { value: 'msft', label: 'MSFT', sublabel: 'Microsoft Corporation' },
                            { value: 'googl', label: 'GOOGL', sublabel: 'Alphabet Inc.' }
                        ],
                        value: 'aapl',
                        icon: 'bx-line-chart'
                    }, 
                    label: 'With Icon & Sublabels' 
                }
            ],
            code: `new Dropdown({
    options: [
        { value: 'opt1', label: 'Option 1', sublabel: 'Description' },
        { value: 'opt2', label: 'Option 2', sublabel: 'Description' }
    ],
    value: 'opt1',
    icon: 'bx-chevron-down',
    usePortal: true,
    onChange: (value, option) => console.log(value)
})`
        },
        {
            name: 'StatCard',
            description: 'Display label and value pairs for statistics',
            component: StatCard,
            examples: [
                { 
                    props: { 
                        label: 'Market Cap',
                        value: '$2.8T'
                    }, 
                    label: 'Financial Stat' 
                },
                { 
                    props: { 
                        label: 'Active Users',
                        value: '1.2M',
                        icon: 'bx-user'
                    }, 
                    label: 'With Icon' 
                }
            ],
            code: `new StatCard({
    label: 'Market Cap',
    value: '$2.8T',
    icon: 'bx-trending-up'
})`
        },
        {
            name: 'StockListItem',
            description: 'List item for stock watchlists',
            component: StockListItem,
            examples: [
                { 
                    props: { 
                        symbol: 'AAPL',
                        name: 'Apple Inc.',
                        active: false
                    }, 
                    label: 'Inactive Stock' 
                },
                { 
                    props: { 
                        symbol: 'MSFT',
                        name: 'Microsoft Corporation',
                        active: true
                    }, 
                    label: 'Active Stock' 
                }
            ],
            code: `new StockListItem({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    active: true,
    onClick: () => console.log('clicked')
})`
        },
        {
            name: 'WeatherCard',
            description: 'Display hourly or daily weather forecast information',
            component: WeatherCard,
            examples: [
                { 
                    props: { 
                        variant: 'hourly',
                        time: '3 PM',
                        temp: 72,
                        icon: 'bx-sun',
                        precip: 10
                    }, 
                    label: 'Hourly Forecast' 
                },
                { 
                    props: { 
                        variant: 'daily',
                        day: 'Monday',
                        high: 75,
                        low: 62,
                        icon: 'bx-cloud-rain',
                        condition: 'Partly cloudy',
                        precip: 30
                    }, 
                    label: 'Daily Forecast' 
                }
            ],
            code: `// Hourly
new WeatherCard({
    variant: 'hourly',
    time: '3 PM',
    temp: 72,
    icon: 'bx-sun',
    precip: 10
});`
        },
        {
            name: 'Stepper',
            description: 'Step navigation for multi-step flows (vertical or horizontal)',
            component: null, // Container component - renders StepperItems
            examples: [
                { 
                    props: null,
                    label: 'Custom Stepper Example',
                    custom: true
                }
            ],
            code: `// Create stepper items
const step1 = new StepperItem({
    icon: 'bx-user',
    title: 'Profile',
    description: 'Tell us about yourself',
    active: true,
    completed: false,
    variant: 'vertical'
});

const step2 = new StepperItem({
    icon: 'bx-cog',
    title: 'Settings',
    description: 'Configure preferences',
    active: false,
    completed: false,
    variant: 'vertical'
});

// Create stepper container
const stepper = new Stepper({
    children: [step1, step2],
    variant: 'vertical'
});`
        },
        {
            name: 'ProductCard',
            description: 'Product card with image, price, and add to cart button',
            component: ProductCard,
            examples: [
                { 
                    props: { 
                        id: 1,
                        name: 'Wireless Headphones',
                        category: 'Audio',
                        price: 149.99,
                        rating: 4.5,
                        image: 'images/1.jpeg', // Ensure path is correct or fallback
                        description: 'Premium wireless headphones with noise cancellation'
                    }, 
                    label: 'Full Product Card' 
                }
            ],
            code: `new ProductCard({
    id: 1,
    name: 'Wireless Headphones',
    category: 'Audio',
    price: 149.99,
    rating: 4.5,
    image: 'images/1.jpeg',
    onClick: (product) => console.log('View product:', product),
    onAddToCart: (product) => console.log('Add to cart:', product)
})`
        },
        {
            name: 'CartItem',
            description: 'Shopping cart item with quantity controls',
            component: CartItem,
            examples: [
                { 
                    props: { 
                        product: {
                            id: 1,
                            name: 'Wireless Headphones',
                            category: 'Audio',
                            price: 149.99,
                            image: 'images/1.jpeg'
                        },
                        quantity: 2,
                        index: 0
                    }, 
                    label: 'Cart Item with Quantity' 
                }
            ],
            code: `new CartItem({
    product: {
        id: 1,
        name: 'Wireless Headphones',
        price: 149.99,
        image: 'images/1.jpeg'
    },
    quantity: 2,
    index: 0,
    onQuantityChange: (index, action) => console.log('Quantity changed'),
    onRemove: (index) => console.log('Remove item')
})`
        },
        {
            name: 'OrderSummary',
            description: 'Order pricing breakdown with totals',
            component: OrderSummary,
            examples: [
                { 
                    props: { 
                        subtotal: 299.98,
                        shipping: 9.99,
                        tax: 24.00,
                        total: 333.97,
                        showItems: true,
                        items: [
                            { product: { name: 'Headphones', price: 149.99 }, quantity: 2 }
                        ]
                    }, 
                    label: 'Full Order Summary' 
                }
            ],
            code: `new OrderSummary({
    subtotal: 299.98,
    shipping: 9.99,
    tax: 24.00,
    total: 333.97,
    items: [...],
    showItems: true
})`
        }
    ],
    organisms: [
        {
            name: 'Modal',
            description: 'Modal dialog with title and content',
            component: Modal,
            examples: [
                { 
                    props: { 
                        title: 'Example Modal',
                        isOpen: false
                    }, 
                    label: 'Modal (Click to open)',
                    isModal: true
                }
            ],
            code: `const modal = new Modal({
    title: 'Modal Title',
    isOpen: false
});

// Open the modal
modal.open();

// Close the modal
modal.close();`
        },
        {
            name: 'StockHeader',
            description: 'Large display for stock price information',
            component: StockHeader,
            examples: [
                { 
                    props: { 
                        symbol: 'AAPL',
                        name: 'Apple Inc.',
                        currentPrice: '175.25',
                        change: '2.45',
                        changePercent: '1.42'
                    }, 
                    label: 'Positive Change' 
                },
                { 
                    props: { 
                        symbol: 'TSLA',
                        name: 'Tesla, Inc.',
                        currentPrice: '245.80',
                        change: '-3.20',
                        changePercent: '-1.28'
                    }, 
                    label: 'Negative Change' 
                }
            ],
            code: `new StockHeader({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: '175.25',
    change: '2.45',
    changePercent: '1.42'
})`
        }
    ]
};

export function render(container) {
    container.innerHTML = '';
    components = [];

    const wrapper = document.createElement('div');
    wrapper.className = 'experience';

    // Intro
    const intro = new Section({
        title: 'Component Library',
        description: 'Click on any component to see it in action with its usage code. All components are built with a consistent API and work together seamlessly.',
        className: 'scale-reveal'
    });
    components.push(intro);
    wrapper.appendChild(intro.render());

    // Render each category
    ['atoms', 'molecules', 'organisms'].forEach(category => {
        const categorySection = createCategorySection(category);
        wrapper.appendChild(categorySection);
    });

    container.appendChild(wrapper);

    // Trigger animations
    triggerScaleReveal(container);
    
    // Setup GSAP hover effects on component cards
    requestAnimationFrame(() => {
        if (window.setupGSAPHovers) {
            window.setupGSAPHovers(container, '.component-card');
        }
    });
}

function createCategorySection(category) {
    const section = document.createElement('div');
    section.className = 'component-category';

    // Category header
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    const count = document.createElement('span');
    count.className = 'category-count';
    count.textContent = `${componentData[category].length} component${componentData[category].length !== 1 ? 's' : ''}`;
    
    header.appendChild(title);
    header.appendChild(count);
    section.appendChild(header);

    // Component grid
    const grid = document.createElement('div');
    grid.className = 'component-grid';

    componentData[category].forEach(comp => {
        const card = createComponentCard(comp, category);
        grid.appendChild(card);
    });

    // Add placeholders for incomplete rows to maintain consistent widths
    const numItems = componentData[category].length;
    const columns = 3; // Base desktop columns
    const emptySlots = (columns - (numItems % columns)) % columns;
    for (let i = 0; i < emptySlots; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'component-placeholder';
        grid.appendChild(placeholder);
    }

    section.appendChild(grid);
    return section;
}

function createComponentCard(compData, category) {
    const card = document.createElement('div');
    card.className = 'component-card scale-reveal';

    // Header
    const header = document.createElement('div');
    header.className = 'component-card-header';
    
    const name = document.createElement('h3');
    name.className = 'component-name';
    name.textContent = compData.name;
    
    const badge = new Badge({
        text: category,
        variant: category === 'atoms' ? 'default' : category === 'molecules' ? 'info' : 'success'
    });
    components.push(badge);
    
    header.appendChild(name);
    header.appendChild(badge.render());
    card.appendChild(header);

    // Description
    const desc = document.createElement('p');
    desc.className = 'component-description';
    desc.textContent = compData.description;
    card.appendChild(desc);

    // Examples count
    const exampleCount = document.createElement('div');
    exampleCount.className = 'example-count';
    exampleCount.textContent = `${compData.examples.length} example${compData.examples.length !== 1 ? 's' : ''}`;
    card.appendChild(exampleCount);

    // Click handler
    card.addEventListener('click', () => {
        openComponentModal(compData);
    });

    return card;
}

function openComponentModal(compData) {
    // Close existing modal if any
    if (showcaseModal) {
        showcaseModal.destroy();
    }

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'component-modal-content';

    // Component examples
    const examplesSection = document.createElement('div');
    examplesSection.className = 'modal-examples-section';
    
    const examplesTitle = document.createElement('h3');
    examplesTitle.textContent = 'Examples';
    examplesSection.appendChild(examplesTitle);

    const examplesContainer = document.createElement('div');
    examplesContainer.className = 'modal-examples';
    
    // Special layout for WeatherCard - stack vertically for better display
    if (compData.name === 'WeatherCard') {
        examplesContainer.style.gridTemplateColumns = '1fr';
    }

    compData.examples.forEach(example => {
        const exampleWrapper = document.createElement('div');
        exampleWrapper.className = 'modal-example';
        
        const label = document.createElement('div');
        label.className = 'example-label';
        label.textContent = example.label;
        exampleWrapper.appendChild(label);

        const preview = document.createElement('div');
        preview.className = 'example-preview';
        
        // Add special classes for weather cards
        if (compData.name === 'WeatherCard') {
            if (example.props.variant === 'daily') {
                preview.classList.add('preview-weather-daily');
            } else if (example.props.variant === 'hourly') {
                preview.classList.add('preview-weather-hourly');
            }
        }
        
        // Expanded list of components needing contrast backgrounds in previews
        const componentsNeedingContrast = [
            'StockListItem', 'TaskItem', 'ListItem', 'StatCard', 
            'Card', 'StockHeader', 'Dropdown', 'ProductCard', 'CartItem', 'OrderSummary',
            'List', 'NavLink', 'NavGroup', 'Stepper', 'Modal' // Added more for molecules/organisms
        ];
        if (componentsNeedingContrast.includes(compData.name)) {
            preview.classList.add('preview-needs-contrast');
        }
        
        // Special handling for modal
        if (example.isModal) {
            const demoButton = new Button({
                variant: 'primary',
                text: 'Open Modal',
                onClick: () => {
                    const demoModal = new Modal({
                        title: 'Example Modal',
                        isOpen: true,
                        size: 'small'
                    });
                    
                    const demoContent = document.createElement('div');
                    demoContent.innerHTML = `
                        <p>This is an example modal dialog.</p>
                        <p>It can contain any content you want!</p>
                    `;
                    demoModal.element.querySelector('.modal-body').appendChild(demoContent);
                    
                    document.body.appendChild(demoModal.render());
                    demoModal.open();
                }
            });
            preview.appendChild(demoButton.render());
        } else if (example.custom && compData.name === 'Stepper') {
            // Custom rendering for Stepper component - vertical with bg
            preview.classList.add('preview-stepper-vertical');
            
            const step1 = new StepperItem({
                icon: 'bx-user',
                title: 'Profile',
                description: 'Tell us about yourself',
                active: true,
                completed: false,
                variant: 'vertical'
            });
            
            const step2 = new StepperItem({
                icon: 'bx-cog',
                title: 'Settings',
                description: 'Configure preferences',
                active: false,
                completed: false,
                variant: 'vertical'
            });
            
            const step3 = new StepperItem({
                icon: 'bx-check-circle',
                title: 'Complete',
                description: 'All done!',
                active: false,
                completed: false,
                variant: 'vertical'
            });
            
            const stepper = new Stepper({
                children: [step1, step2, step3],
                variant: 'vertical'
            });
            
            components.push(step1, step2, step3, stepper);
            preview.appendChild(stepper.render());
            preview.style.background = 'var(--color-bg-secondary)';
            preview.style.padding = 'var(--spacing-xl)';
            preview.style.borderRadius = 'var(--radius-lg)';
        } else if (compData.name === 'Loader') {
            // Render loader in a container with text
            const loaderContainer = document.createElement('div');
            loaderContainer.style.display = 'flex';
            loaderContainer.style.flexDirection = 'column';
            loaderContainer.style.alignItems = 'center';
            loaderContainer.style.gap = 'var(--spacing-sm)';
            loaderContainer.style.minHeight = '100px';
            
            const loader = new compData.component(example.props);
            components.push(loader);
            loaderContainer.appendChild(loader.render());
            
            const loaderText = document.createElement('p');
            loaderText.textContent = 'Loading...';
            loaderText.style.color = 'var(--color-text-secondary)';
            loaderText.style.fontSize = 'var(--font-size-sm)';
            loaderContainer.appendChild(loaderText);
            
            preview.appendChild(loaderContainer);
        } else if (compData.name === 'Section') {
            // Render section with full content
            const section = new compData.component(example.props);
            components.push(section);
            preview.appendChild(section.render());
            preview.style.minHeight = '150px';
            preview.style.padding = 'var(--spacing-md)';
        } else if (compData.name === 'List' || compData.name === 'ListItem') {
            // For List, render full list with ListItem instances
            if (compData.name === 'List') {
                const listItems = ['First item', 'Second item', 'Third item'].map(content => {
                    return new ListItem({
                        content: content,
                        actions: [] // No actions for simple demo
                    });
                });
                const list = new List({
                    items: listItems,
                    ordered: false
                });
                components.push(...listItems, list);
                preview.appendChild(list.render());
            } else {
                // For ListItem, render single
                const listItem = new ListItem({
                    content: 'Sample List Item',
                    actions: [{ icon: 'bx-edit', onClick: () => {} }]
                });
                components.push(listItem);
                preview.appendChild(listItem.render());
            }
        } else if (compData.name === 'Card') {
            // For Card, add sample content
            const card = new Card({
                title: 'Sample Card',
                description: 'This is a sample card with title and description.',
                className: 'scale-reveal'
            });
            components.push(card);
            preview.appendChild(card.render());
        } else if (compData.name === 'Dropdown') {
            // Ensure dropdown has space for portal in modal
            preview.style.minHeight = '200px';
            preview.style.position = 'relative';
            const dropdown = new Dropdown({
                options: [
                    { value: 'aapl', label: 'AAPL', sublabel: 'Apple Inc.' },
                    { value: 'msft', label: 'MSFT', sublabel: 'Microsoft Corporation' },
                    { value: 'googl', label: 'GOOGL', sublabel: 'Alphabet Inc.' }
                ],
                value: 'aapl',
                icon: 'bx-line-chart',
                usePortal: true,
                onChange: (value, option) => console.log(value)
            });
            components.push(dropdown);
            preview.appendChild(dropdown.render());
        } else if (compData.name === 'StatCard') {
            // Add icon to StatCard for full styling
            example.props.icon = 'bx-trending-up';
            const statCard = new compData.component(example.props);
            components.push(statCard);
            preview.appendChild(statCard.render());
        } else {
            const comp = new compData.component(example.props);
            components.push(comp);
            
            // Special handling for WeatherCard - wrap in appropriate container
            if (compData.name === 'WeatherCard') {
                const wrapper = document.createElement('div');
                if (example.props.variant === 'hourly') {
                    wrapper.className = 'hourly-forecast';
                    wrapper.style.width = 'auto';
                    wrapper.style.justifyContent = 'center';
                } else if (example.props.variant === 'daily') {
                    wrapper.className = 'daily-forecast';
                }
                wrapper.appendChild(comp.render());
                preview.appendChild(wrapper);
            } else {
                preview.appendChild(comp.render());
            }
        }
        
        exampleWrapper.appendChild(preview);
        examplesContainer.appendChild(exampleWrapper);
    });

    examplesSection.appendChild(examplesContainer);
    modalContent.appendChild(examplesSection);

    // Code section
    const codeSection = document.createElement('div');
    codeSection.className = 'modal-code-section';
    
    const codeTitle = document.createElement('h3');
    codeTitle.textContent = 'Usage';
    codeSection.appendChild(codeTitle);

    const codeBlock = document.createElement('pre');
    codeBlock.className = 'code-block';
    const code = document.createElement('code');
    code.textContent = compData.code;
    codeBlock.appendChild(code);
    codeSection.appendChild(codeBlock);

    modalContent.appendChild(codeSection);

    // Create and open modal
    showcaseModal = new Modal({
        title: compData.name,
        isOpen: true,
        size: 'large'
    });

    const modalElement = showcaseModal.render();
    modalElement.querySelector('.modal-body').appendChild(modalContent);
    document.body.appendChild(modalElement);
    showcaseModal.open();
    
    components.push(showcaseModal);
}

export function init(container) {
    // Already initialized in render
}

export function dispose() {
    if (showcaseModal) {
        showcaseModal.destroy();
        showcaseModal = null;
    }
    components.forEach(c => c.destroy && c.destroy());
    components = [];
}

