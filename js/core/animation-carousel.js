/**
 * Animation Carousel
 * Manages multiple ambient animations with channel switching and pagination
 */

import { LavaLamp } from '../visualizations/lava-lamp.js';
import { BlobIK } from '../visualizations/blob-ik.js';
import { Forest } from '../visualizations/forest.js';

export class AnimationCarousel {
    constructor(container) {
        this.container = container;
        this.animations = [];
        this.currentIndex = 0;
        this.currentAnimation = null;
        this.isTransitioning = false;
        this.paginationDots = null;
        
        this.init();
    }
    
    init() {
        // Register available animations (moods)
        this.animations = [
            {
                id: 'lava-lamp',
                name: 'Lava Lamp',
                class: LavaLamp,
                icon: 'bx-droplet'
            },
            {
                id: 'blob-ik',
                name: 'Blob Network',
                class: BlobIK,
                icon: 'bx-network-chart'
            },
            {
                id: 'forest',
                name: 'Forest',
                class: Forest,
                icon: 'bx-leaf'
            }
        ];
        
        // Create pagination dots
        this.createPaginationDots();
        
        // Start with first animation
        this.switchToAnimation(0, false);
    }
    
    createPaginationDots() {
        // Create container for pagination
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'animation-pagination';
        
        this.animations.forEach((anim, index) => {
            const dot = document.createElement('button');
            dot.className = 'pagination-dot';
            dot.setAttribute('aria-label', `Switch to ${anim.name}`);
            dot.setAttribute('title', anim.name);
            dot.dataset.index = index;
            
            // Add icon to dot
            const icon = document.createElement('i');
            icon.className = `bx ${anim.icon}`;
            dot.appendChild(icon);
            
            dot.addEventListener('click', () => {
                if (index !== this.currentIndex && !this.isTransitioning) {
                    this.switchToAnimation(index, true);
                }
            });
            
            paginationContainer.appendChild(dot);
        });
        
        // Insert pagination after container
        this.container.parentElement.insertBefore(
            paginationContainer, 
            this.container.nextSibling
        );
        
        this.paginationDots = paginationContainer;
        
        // Update active state
        this.updatePaginationDots();
    }
    
    updatePaginationDots() {
        const dots = this.paginationDots.querySelectorAll('.pagination-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    async switchToAnimation(index, animated = true) {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        const previousIndex = this.currentIndex;
        this.currentIndex = index;
        
        // Update pagination immediately
        this.updatePaginationDots();
        
        if (animated && this.currentAnimation) {
            // Pause and fade out current animation
            this.currentAnimation.pause();
            
            await this.fadeOut(this.currentAnimation.canvas);
            
            // Dispose old animation
            this.currentAnimation.dispose();
            this.currentAnimation = null;
        } else if (this.currentAnimation) {
            // No animation, just dispose
            this.currentAnimation.dispose();
            this.currentAnimation = null;
        }
        
        // Create new animation
        const AnimationClass = this.animations[index].class;
        this.currentAnimation = new AnimationClass(this.container);
        
        this.isTransitioning = false;
        
        console.log(`🎨 Switched to animation: ${this.animations[index].name}`);
    }
    
    async fadeOut(element) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transition = 'opacity 500ms ease-out';
            element.style.opacity = '0';
            
            setTimeout(resolve, 500);
        });
    }
    
    async fadeIn(element) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.style.transition = 'opacity 800ms ease-in';
            element.style.opacity = this.currentAnimation.settings.camera.canvasOpacity;
            
            setTimeout(resolve, 800);
        });
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    pause() {
        if (this.currentAnimation) {
            this.currentAnimation.pause();
        }
    }
    
    resume() {
        if (this.currentAnimation) {
            this.currentAnimation.resume();
        }
    }
    
    renderSingleFrame(forceResize = false) {
        if (this.currentAnimation) {
            this.currentAnimation.renderSingleFrame(forceResize);
        }
    }
    
    next() {
        const nextIndex = (this.currentIndex + 1) % this.animations.length;
        this.switchToAnimation(nextIndex, true);
    }
    
    previous() {
        const prevIndex = (this.currentIndex - 1 + this.animations.length) % this.animations.length;
        this.switchToAnimation(prevIndex, true);
    }
    
    dispose() {
        if (this.currentAnimation) {
            this.currentAnimation.dispose();
            this.currentAnimation = null;
        }
        
        if (this.paginationDots) {
            this.paginationDots.remove();
            this.paginationDots = null;
        }
    }
    
    // Get list of available moods for navigation
    static getMoods() {
        return [
            {
                id: 'mood-lava',
                name: 'Lava Lamp',
                icon: 'bx-droplet',
                index: 0
            },
            {
                id: 'mood-network',
                name: 'Blob Network',
                icon: 'bx-network-chart',
                index: 1
            },
            {
                id: 'mood-forest',
                name: 'Forest',
                icon: 'bx-leaf',
                index: 2
            }
        ];
    }
}

