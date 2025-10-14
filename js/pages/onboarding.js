// User Onboarding Experience
// Structured onboarding flow with expand/collapse transitions and clean card-based design

import { 
    createExperienceWrapperDOM,
    triggerScaleReveal,
    addStylesOnce 
} from '../utils/base-experience.js';

import {
    Button,
    Input,
    Select,
    Icon,
    Toggle,
    Card,
    Stepper,
    StepperItem,
    Text,
    StatCard
} from '../components/index.js';

export const metadata = {
    id: 'onboarding',
    title: 'User Onboarding',
    icon: 'bx-rocket',
    category: 'experiences',
    description: 'Structured onboarding flow with expand/collapse transitions and clean card-based design'
};

// Onboarding steps configuration
const steps = [
    {
        id: 'welcome',
        title: 'Welcome',
        description: 'Let\'s get you started',
        icon: 'bx-rocket'
    },
    {
        id: 'profile',
        title: 'Profile',
        description: 'Tell us about yourself',
        icon: 'bx-user'
    },
    {
        id: 'preferences',
        title: 'Preferences',
        description: 'Customize your experience',
        icon: 'bx-cog'
    },
    {
        id: 'complete',
        title: 'All Set',
        description: 'You\'re ready to go',
        icon: 'bx-check-circle'
    }
];

let currentStepIndex = 0;
let components = [];
let stepperItems = [];

export function render(container) {
    currentStepIndex = 0;
    components = [];
    stepperItems = [];
    
    // Load page-specific styles
    loadPageStyles();
    
    // Create main content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'onboarding-container';
    
    // Desktop Sidebar Navigation
    const sidebar = createSidebar();
    contentDiv.appendChild(sidebar);
    
    // Mobile Breadcrumb Navigation
    const breadcrumb = createBreadcrumb();
    contentDiv.appendChild(breadcrumb);
    
    // Content Window (with mask for slide transitions)
    const contentWindow = document.createElement('div');
    contentWindow.className = 'content-window scale-reveal';
    
    const contentMask = document.createElement('div');
    contentMask.className = 'content-mask';
    
    const stepsContent = document.createElement('div');
    stepsContent.className = 'steps-content';
    
    // Render all step content
    steps.forEach((step, index) => {
        const stepWrapper = createStepContent(index);
        stepsContent.appendChild(stepWrapper);
    });
    
    contentMask.appendChild(stepsContent);
    contentWindow.appendChild(contentMask);
    contentDiv.appendChild(contentWindow);
    
    // Wrap in experience structure
    const experienceWrapper = createExperienceWrapperDOM(
        'onboarding-experience',
        'User Onboarding Flow',
        'Watch how content cards expand on entry and collapse on exit, creating a seamless progression through the onboarding process.',
        contentDiv
    );
    
    container.innerHTML = '';
    container.appendChild(experienceWrapper);
}

export function init(container) {
    // Set the first wrapper and card to active immediately
    const firstWrapper = container.querySelector('.step-content-wrapper[data-step="0"]');
    const firstCard = firstWrapper?.querySelector('.onboarding-card');
    if (firstWrapper && firstCard) {
        firstWrapper.classList.add('active');
        firstCard.classList.add('active');
    }
    
    // Trigger initial reveals
    setTimeout(() => {
        triggerScaleReveal(container);
    }, 100);
}

export function dispose() {
    currentStepIndex = 0;
    components.forEach(c => c.destroy && c.destroy());
    components = [];
    stepperItems = [];
}

// Load page-specific CSS
function loadPageStyles() {
    // Check if stylesheet already exists
    const styleId = 'onboarding-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/onboarding.css';
    document.head.appendChild(link);
}

// Create Sidebar
function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'step-sidebar scale-reveal';
    
    // Sidebar header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    const title = new Text({
        tag: 'h3',
        text: 'Setup Guide'
    });
    components.push(title);
    header.appendChild(title.render());
    
    const desc = new Text({
        tag: 'p',
        text: 'Follow these steps to complete your onboarding'
    });
    components.push(desc);
    header.appendChild(desc.render());
    
    sidebar.appendChild(header);
    
    // Step navigation
    const stepperContainer = document.createElement('div');
    stepperContainer.className = 'step-nav';
    
    steps.forEach((step, index) => {
        const stepItem = new StepperItem({
            icon: step.icon,
            title: step.title,
            description: step.description,
            active: index === 0,
            completed: false,
            variant: 'vertical',
            onClick: () => goToStep(index)
        });
        
        stepperItems.push(stepItem);
        components.push(stepItem);
        stepperContainer.appendChild(stepItem.render());
    });
    
    sidebar.appendChild(stepperContainer);
    
    return sidebar;
}

// Create Breadcrumb (Mobile)
function createBreadcrumb() {
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'step-breadcrumb scale-reveal';
    
    steps.forEach((step, index) => {
        const item = document.createElement('div');
        item.className = `breadcrumb-item ${index === 0 ? 'active' : ''}`;
        item.dataset.step = index;
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'breadcrumb-icon';
        
        const icon = new Icon({ name: step.icon });
        const checkIcon = new Icon({ name: 'bx-check', className: 'breadcrumb-check' });
        
        iconContainer.appendChild(icon.render());
        iconContainer.appendChild(checkIcon.render());
        item.appendChild(iconContainer);
        
        const label = document.createElement('span');
        label.className = 'breadcrumb-label';
        label.textContent = step.title;
        item.appendChild(label);
        
        item.addEventListener('click', () => goToStep(index));
        
        breadcrumb.appendChild(item);
    });
    
    return breadcrumb;
}

// Create Step Content
function createStepContent(index) {
    const step = steps[index];
    const isActive = index === currentStepIndex;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'step-content-wrapper';
    wrapper.dataset.step = index;
    
    if (index === 0) {
        wrapper.style.display = 'flex';
    }
    
    // Card container
    const card = document.createElement('div');
    card.className = `onboarding-card ${isActive ? 'active' : ''}`;
    
    // Step-specific content
    switch(index) {
        case 0:
            renderWelcomeStep(card);
            break;
        case 1:
            renderProfileStep(card);
            break;
        case 2:
            renderPreferencesStep(card);
            break;
        case 3:
            renderCompleteStep(card);
            break;
    }
    
    wrapper.appendChild(card);
    
    // Step actions (buttons)
    const actions = document.createElement('div');
    actions.className = 'step-actions';
    
    if (index === steps.length - 1) {
        const backBtn = new Button({
            variant: 'secondary',
            iconLeft: 'bx-chevron-left',
            text: 'Back',
            onClick: () => goToStep(index - 1)
        });
        components.push(backBtn);
        actions.appendChild(backBtn.render());
        actions.appendChild(document.createElement('div'));
    } else {
        const backBtn = new Button({
            variant: 'secondary',
            iconLeft: 'bx-chevron-left',
            text: 'Back',
            disabled: index === 0,
            onClick: () => goToStep(index - 1)
        });
        
        const nextBtn = new Button({
            variant: 'primary',
            text: 'Next Step',
            iconRight: 'bx-chevron-right',
            onClick: () => goToStep(index + 1)
        });
        
        components.push(backBtn, nextBtn);
        actions.appendChild(backBtn.render());
        actions.appendChild(nextBtn.render());
    }
    
    wrapper.appendChild(actions);
    
    return wrapper;
}

// Step 1: Welcome
function renderWelcomeStep(card) {
    const iconLarge = document.createElement('div');
    iconLarge.className = 'card-icon-large';
    const icon = new Icon({ name: 'bx-rocket' });
    iconLarge.appendChild(icon.render());
    card.appendChild(iconLarge);
    
    const title = new Text({
        tag: 'h2',
        text: 'Welcome to Motion Grammar'
    });
    components.push(title);
    card.appendChild(title.render());
    
    const desc = new Text({
        tag: 'p',
        text: 'Experience how thoughtful motion design creates intuitive user interfaces. This onboarding flow demonstrates progressive disclosure, card-based layouts, and smooth expand/collapse transitions.'
    });
    components.push(desc);
    card.appendChild(desc.render());
    
    const featureGrid = document.createElement('div');
    featureGrid.className = 'feature-grid';
    
    const features = [
        { icon: 'bx-palette', title: 'Beautiful Design', description: 'Clean, modern interface' },
        { icon: 'bx-rocket', title: 'Fast Performance', description: 'Optimized for speed' },
        { icon: 'bx-shield', title: 'Secure & Private', description: 'Your data is safe' },
        { icon: 'bx-support', title: '24/7 Support', description: 'Always here to help' }
    ];
    
    features.forEach(feature => {
        const featureCard = new Card({
            title: feature.title,
            description: feature.description,
            className: ''
        });
        
        // Add icon to the card
        const cardElement = featureCard.render();
        const cardIcon = new Icon({ name: feature.icon, className: 'feature-card-icon' });
        cardElement.insertBefore(cardIcon.render(), cardElement.firstChild);
        
        components.push(featureCard);
        featureGrid.appendChild(cardElement);
    });
    
    card.appendChild(featureGrid);
}

// Step 2: Profile
function renderProfileStep(card) {
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const icon = new Icon({ name: 'bx-user' });
    header.appendChild(icon.render());
    
    const title = new Text({
        tag: 'h3',
        text: 'Create Your Profile'
    });
    components.push(title);
    header.appendChild(title.render());
    
    card.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'profile-grid';
    
    const nameInput = new Input({
        id: 'profileName',
        label: 'Full Name',
        placeholder: 'Jon Ruppel',
        value: 'Jon Ruppel',
        iconLeft: 'bx-user',
        className: ''
    });
    
    const emailInput = new Input({
        id: 'profileEmail',
        type: 'email',
        label: 'Email Address',
        placeholder: 'jon@example.com',
        value: 'jon@example.com',
        iconLeft: 'bx-envelope',
        className: ''
    });
    
    const roleSelect = new Select({
        id: 'profileRole',
        label: 'Role',
        options: ['Designer', 'Developer', 'Product Manager', 'Marketing'],
        value: 'Designer',
        iconLeft: 'bx-briefcase',
        className: ''
    });
    
    const companyInput = new Input({
        id: 'profileCompany',
        label: 'Company',
        placeholder: 'Acme Inc.',
        value: 'Motion Grammar',
        iconLeft: 'bx-buildings',
        className: ''
    });
    
    components.push(nameInput, emailInput, roleSelect, companyInput);
    
    grid.appendChild(nameInput.render());
    grid.appendChild(emailInput.render());
    grid.appendChild(roleSelect.render());
    grid.appendChild(companyInput.render());
    
    card.appendChild(grid);
}

// Step 3: Preferences
function renderPreferencesStep(card) {
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const icon = new Icon({ name: 'bx-cog' });
    header.appendChild(icon.render());
    
    const title = new Text({
        tag: 'h3',
        text: 'Customize Your Experience'
    });
    components.push(title);
    header.appendChild(title.render());
    
    card.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'preferences-grid';
    
    const preferences = [
        { icon: 'bx-bell', title: 'Notifications', desc: 'Get updates about your account', checked: true },
        { icon: 'bx-envelope', title: 'Email Updates', desc: 'Receive weekly newsletters', checked: true },
        { icon: 'bx-moon', title: 'Dark Mode', desc: 'Use dark theme by default', checked: false },
        { icon: 'bx-data', title: 'Analytics', desc: 'Help us improve the experience', checked: true }
    ];
    
    preferences.forEach(pref => {
        const prefCard = document.createElement('div');
        prefCard.className = 'preference-card';
        
        const prefIcon = document.createElement('div');
        prefIcon.className = 'pref-icon';
        const iconEl = new Icon({ name: pref.icon });
        prefIcon.appendChild(iconEl.render());
        prefCard.appendChild(prefIcon);
        
        const prefContent = document.createElement('div');
        prefContent.className = 'pref-content';
        
        const prefTitle = new Text({
            tag: 'div',
            text: pref.title,
            className: 'pref-title'
        });
        components.push(prefTitle);
        prefContent.appendChild(prefTitle.render());
        
        const prefDesc = new Text({
            tag: 'div',
            text: pref.desc,
            className: 'pref-desc'
        });
        components.push(prefDesc);
        prefContent.appendChild(prefDesc.render());
        
        prefCard.appendChild(prefContent);
        
        const toggle = new Toggle({
            checked: pref.checked,
            onChange: (checked) => {
                console.log(`${pref.title} toggled:`, checked);
            }
        });
        components.push(toggle);
        prefCard.appendChild(toggle.render());
        
        grid.appendChild(prefCard);
    });
    
    card.appendChild(grid);
}

// Step 4: Complete
function renderCompleteStep(card) {
    const completionIcon = document.createElement('div');
    completionIcon.className = 'completion-icon';
    const icon = new Icon({ name: 'bx-check-circle' });
    completionIcon.appendChild(icon.render());
    card.appendChild(completionIcon);
    
    const title = new Text({
        tag: 'h2',
        text: 'You\'re All Set!'
    });
    components.push(title);
    card.appendChild(title.render());
    
    const desc = new Text({
        tag: 'p',
        text: 'Your account has been configured and you\'re ready to start exploring.'
    });
    components.push(desc);
    card.appendChild(desc.render());
    
    const statsDiv = document.createElement('div');
    statsDiv.className = 'completion-stats';
    
    const stats = [
        { value: '100%', label: 'Profile Complete' },
        { value: '4/4', label: 'Steps Completed' },
        { value: 'Ready', label: 'Status' }
    ];
    
    stats.forEach(stat => {
        const statCard = new StatCard({
            value: stat.value,
            label: stat.label,
            className: ''
        });
        components.push(statCard);
        statsDiv.appendChild(statCard.render());
    });
    
    card.appendChild(statsDiv);
    
    const getStartedBtn = new Button({
        variant: 'primary',
        text: 'Get Started',
        iconRight: 'bx-arrow-right',
        className: 'btn-large',
        onClick: () => {
            console.log('Get started clicked');
        }
    });
    components.push(getStartedBtn);
    card.appendChild(getStartedBtn.render());
}

// Navigation
function goToStep(newIndex) {
    if (newIndex < 0 || newIndex >= steps.length) return;
    
    const container = document.querySelector('.onboarding-experience');
    if (!container) return;
    
    const fromIndex = currentStepIndex;
    const toIndex = newIndex;
    const isForward = toIndex > fromIndex;
    
    const contentWindow = container.querySelector('.content-window');
    const stepsContent = container.querySelector('.steps-content');
    const fromWrapper = container.querySelector(`.step-content-wrapper[data-step="${fromIndex}"]`);
    const toWrapper = container.querySelector(`.step-content-wrapper[data-step="${toIndex}"]`);
    const fromCard = fromWrapper?.querySelector('.onboarding-card');
    const toCard = toWrapper?.querySelector('.onboarding-card');
    
    if (!fromCard || !toCard || !stepsContent || !contentWindow) return;
    
    // Update navigation state
    updateStepNav(container, toIndex);
    updateBreadcrumb(container, toIndex);
    
    // Measure heights for smooth resize
    // Force layout to get accurate heights
    toWrapper.style.display = 'flex';
    toWrapper.classList.add('active');
    const fromHeight = fromWrapper.offsetHeight;
    const toHeight = toWrapper.offsetHeight;
    
    // Set content window to outgoing height and enable transitions
    contentWindow.style.height = `${fromHeight}px`;
    contentWindow.style.transition = 'height 0.5s ease-in-out';
    
    // Animate the transition
    const tl = gsap.timeline();
    
    // Prepare the incoming wrapper
    gsap.set(toWrapper, { x: isForward ? '100%' : '-100%' });
    gsap.set(toCard, { 
        opacity: 0, 
        scale: 0.95
    });
    
    // Slide out current
    tl.to(fromWrapper, {
        x: isForward ? '-100%' : '100%',
        duration: 0.5,
        ease: 'power2.inOut'
    }, 0);
    
    // Slide in new
    tl.to(toWrapper, {
        x: '0%',
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
            fromCard.classList.remove('active');
            fromWrapper.classList.remove('active');
            gsap.set(fromWrapper, { display: 'none', x: '0%' });
            
            // Reset content window height to auto after transition
            contentWindow.style.height = 'auto';
            contentWindow.style.transition = '';
        }
    }, 0);
    
    // Animate height change in parallel with slide
    tl.to(contentWindow, {
        height: `${toHeight}px`,
        duration: 0.5,
        ease: 'power2.inOut'
    }, 0);
    
    // Fade and scale cards
    tl.to(fromCard, {
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: 'power2.in'
    }, 0);
    
    tl.to(toCard, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out',
        onStart: () => {
            toCard.classList.add('active');
        }
    }, 0.1);
    
    currentStepIndex = toIndex;
}

function updateStepNav(container, activeIndex) {
    const navItems = container.querySelectorAll('.stepper-item');
    
    navItems.forEach((item, index) => {
        item.classList.remove('stepper-item--active');
        if (index < activeIndex) {
            item.classList.add('stepper-item--completed');
        } else {
            item.classList.remove('stepper-item--completed');
        }
        
        if (index === activeIndex) {
            item.classList.add('stepper-item--active');
        }
    });
}

function updateBreadcrumb(container, activeIndex) {
    const breadcrumbItems = container.querySelectorAll('.breadcrumb-item');
    
    breadcrumbItems.forEach((item, index) => {
        item.classList.remove('active');
        if (index < activeIndex) {
            item.classList.add('completed');
        } else {
            item.classList.remove('completed');
        }
        
        if (index === activeIndex) {
            item.classList.add('active');
        }
    });
}
