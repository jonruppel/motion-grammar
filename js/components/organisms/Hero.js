/**
 * Hero Component (Organism)
 * Homepage hero with animated title and background
 * 
 * Props:
 * - title: string (required) - hero title
 * - subtitle: string (optional) - hero subtitle
 * - animated: boolean (default: true) - enable text animations
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';

export class Hero extends Component {
    render() {
        const {
            title = 'MOTION GRAMMAR',
            subtitle,
            animated = true,
            className = ''
        } = this.props;

        const classes = ['home-hero'];
        
        if (className) {
            classes.push(className);
        }

        const hero = this.createElement('div', {
            className: classes.join(' ')
        });

        // Create inner frame to handle padding/spacing
        // This separates structural sizing (hero) from visual spacing (frame)
        const frame = this.createElement('div', {
            className: 'hero-frame'
        });

        // Title - convert newlines to <br> tags
        const titleElement = this.createElement('h1', {
            className: 'page-title'
        });
        titleElement.innerHTML = title.replace(/\n/g, ' <br>');
        frame.appendChild(titleElement);

        // Subtitle
        if (subtitle) {
            const subtitleElement = this.createElement('p', {
                className: 'page-description',
                text: subtitle
            });
            frame.appendChild(subtitleElement);
        }

        hero.appendChild(frame);

        // Store element references
        this.element = hero;
        this.frameElement = frame;
        
        return hero;
    }

    /**
     * Split text into letters for animation
     */
    splitTextIntoLetters(element) {
        const html = element.innerHTML;
        element.innerHTML = '';
        
        // Split by <br> tags first to preserve line breaks
        const lines = html.split('<br>');
        const allLetters = [];
        
        lines.forEach((lineText) => {
            // Create line container
            const lineSpan = document.createElement('span');
            lineSpan.style.display = 'block';
            lineSpan.className = 'line-wrapper';
            
            // Split into words to preserve spacing
            const words = lineText.trim().split(' ');
            
            words.forEach((word, wordIndex) => {
                const wordSpan = document.createElement('span');
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';
                wordSpan.className = 'word-wrapper';
                
                // Split word into letters
                word.split('').forEach((letter) => {
                    const span = document.createElement('span');
                    span.textContent = letter;
                    span.className = 'letter';
                    span.style.display = 'inline-block';
                    
                    wordSpan.appendChild(span);
                    allLetters.push(span);
                });
                
                lineSpan.appendChild(wordSpan);
                
                // Add space between words (except after last word)
                if (wordIndex < words.length - 1) {
                    const space = document.createElement('span');
                    space.innerHTML = ' ';
                    space.className = 'word-space';
                    lineSpan.appendChild(space);
                }
            });
            
            element.appendChild(lineSpan);
        });
        
        // Mark element as ready to show
        element.classList.add('animated');
        
        return allLetters;
    }

    /**
     * Animate title text (call after mounting)
     */
    animateTitle() {
        if (!this.element || !window.gsap) return;
        
        const title = this.element.querySelector('.page-title');
        if (!title) return;
        
        const allLetters = this.splitTextIntoLetters(title);
        
        // Animate letters with GSAP
        gsap.fromTo(allLetters,
            {
                opacity: 0,
                y: 20,
                rotationX: -90,
                filter: 'blur(8px)'
            },
            {
                opacity: 1,
                y: 0,
                rotationX: 0,
                filter: 'blur(0px)',
                duration: 0.8,
                ease: 'expo.out',
                stagger: 0.025,
                clearProps: 'transform,filter'
            }
        );
    }

    /**
     * Animate subtitle (call after mounting)
     */
    animateSubtitle() {
        if (!this.element || !window.gsap) return;
        
        const subtitle = this.element.querySelector('.page-description');
        if (!subtitle) return;
        
        gsap.fromTo(subtitle,
            {
                opacity: 0,
                y: 20
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 1.1,
                ease: 'power2.out'
            }
        );
    }

    /**
     * Set fullscreen dimensions - now handled by CSS
     * Kept for API compatibility but does nothing
     */
    setFullscreen(isFirstLoad = false) {
        // Height is now 100% via CSS - no JS needed
    }

    /**
     * Set to collapsed size - now handled by CSS
     * Kept for API compatibility but does nothing
     */
    setCollapsed() {
        // Height is now 100% via CSS - no JS needed
    }

    /**
     * Collapse to normal size (kept for API compatibility)
     */
    collapseToNormal(isFirstLoad = false, onComplete = null) {
        // This method is now handled in HomePage.collapseHero()
        // Kept for backwards compatibility
        if (onComplete) onComplete();
    }
}

