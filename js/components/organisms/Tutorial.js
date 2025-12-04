/**
 * Tutorial Component
 * First-time visitor tutorial explaining navigation
 */

import { Component } from '../Component.js';

export class Tutorial extends Component {
    constructor(props) {
        super(props);
        this.onComplete = props.onComplete || (() => {});
        this.currentStep = 0;
        const isMobile = window.innerWidth <= 768;
        
        this.steps = isMobile ? [
            {
                title: 'Welcome to Motion Grammar',
                description: 'An interactive portfolio showcasing motion design, interaction studies, and product work.',
                icon: 'bx-palette'
            },
            {
                title: 'Navigate with Swipes',
                description: 'Swipe up and down to browse through visualizations, case studies, and more.',
                icon: 'bx-up-arrow-alt',
                hint: 'Swipe to navigate'
            },
            {
                title: 'Explore Projects',
                description: 'In case studies and about sections, swipe left and right to see multiple slides.',
                icon: 'bx-left-arrow-alt',
                hint: 'Swipe horizontally'
            },
            {
                title: 'Ready to Explore',
                description: 'You\'ll start with a random visualization. Swipe to discover more.',
                icon: 'bx-rocket',
                hint: 'Let\'s go!'
            }
        ] : [
            {
                title: 'Welcome to Motion Grammar',
                description: 'An interactive portfolio showcasing motion design, interaction studies, and product work.',
                icon: 'bx-palette'
            },
            {
                title: 'Navigate with Arrow Keys',
                description: 'Use ↑ and ↓ to browse through content. The centered item in the sidebar is active.',
                icon: 'bx-up-arrow-alt',
                hint: 'Try arrow keys'
            },
            {
                title: 'Explore Projects',
                description: 'In case studies and about sections, use ← → arrow keys to see multiple slides.',
                icon: 'bx-left-arrow-alt',
                hint: 'Left and right'
            },
            {
                title: 'Fullscreen Mode',
                description: 'Press Spacebar or F to hide navigation and go fullscreen. Press again or ESC to return.',
                icon: 'bx-fullscreen',
                hint: 'Space or F'
            },
            {
                title: 'Ready to Explore',
                description: 'You\'ll start with a random visualization. Use arrow keys to explore more.',
                icon: 'bx-rocket',
                hint: 'Let\'s go!'
            }
        ];
    }

    render() {
        const overlay = this.createElement('div', {
            className: 'tutorial-overlay'
        });

        const content = this.createElement('div', {
            className: 'tutorial-content'
        });

        const stepContent = this.createElement('div', {
            className: 'tutorial-step'
        });

        content.appendChild(stepContent);

        // Navigation
        const nav = this.createElement('div', {
            className: 'tutorial-nav'
        });

        const skipBtn = this.createElement('button', {
            className: 'tutorial-btn tutorial-skip',
            text: 'Skip'
        });

        const nextBtn = this.createElement('button', {
            className: 'tutorial-btn tutorial-next',
            text: 'Next'
        });

        nav.appendChild(skipBtn);
        nav.appendChild(nextBtn);
        content.appendChild(nav);

        // Progress indicators
        const progress = this.createElement('div', {
            className: 'tutorial-progress'
        });

        this.steps.forEach((_, index) => {
            const dot = this.createElement('div', {
                className: `tutorial-dot ${index === 0 ? 'active' : ''}`
            });
            progress.appendChild(dot);
        });

        content.appendChild(progress);

        overlay.appendChild(content);

        // Event listeners
        this.addEventListener(skipBtn, 'click', () => {
            this.complete();
        });

        this.addEventListener(nextBtn, 'click', () => {
            this.nextStep();
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                e.preventDefault();
                this.nextStep();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.complete();
            }
        };
        document.addEventListener('keydown', keyHandler);
        this._keyHandler = keyHandler;

        // Render first step
        this.renderStep(stepContent);

        return overlay;
    }

    renderStep(container) {
        const step = this.steps[this.currentStep];
        
        container.innerHTML = `
            <div class="tutorial-step-content">
                <div class="tutorial-icon">
                    <i class='bx ${step.icon}'></i>
                </div>
                <h2 class="tutorial-title">${step.title}</h2>
                <p class="tutorial-description">${step.description}</p>
                ${step.hint ? `<div class="tutorial-hint">${step.hint}</div>` : ''}
            </div>
        `;

        // Animate in
        gsap.fromTo(container.querySelector('.tutorial-step-content'), 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            
            const stepContent = this.element.querySelector('.tutorial-step');
            const dots = this.element.querySelectorAll('.tutorial-dot');
            const nextBtn = this.element.querySelector('.tutorial-next');
            
            // Update progress dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentStep);
            });

            // Update button text on last step
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.textContent = 'Start Exploring';
            }

            // Render new step
            this.renderStep(stepContent);
        } else {
            this.complete();
        }
    }

    complete() {
        // Fade out and remove
        if (this.element) {
            gsap.to(this.element, {
                opacity: 0,
                duration: 0.4,
                ease: 'power2.inOut',
                onComplete: () => {
                    this.onComplete();
                    this.destroy();
                }
            });
        }

        // Mark tutorial as seen
        localStorage.setItem('motion-grammar-tutorial-seen', 'true');
    }

    destroy() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
        }
        super.destroy();
    }

    static hasSeenTutorial() {
        return localStorage.getItem('motion-grammar-tutorial-seen') === 'true';
    }

    static resetTutorial() {
        localStorage.removeItem('motion-grammar-tutorial-seen');
    }
}
