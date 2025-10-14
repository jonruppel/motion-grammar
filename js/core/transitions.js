// Page Transition System
// Modular system for animating content changes

export const transitionTypes = {
    CROSSFADE: 'crossfade',
    SLIDE_UP: 'slide-up',
    FADE_SCALE: 'fade-scale'
};

// Current transition type - can be changed globally
let currentTransition = transitionTypes.CROSSFADE;

export function setTransitionType(type) {
    if (transitionTypes[Object.keys(transitionTypes).find(key => transitionTypes[key] === type)]) {
        currentTransition = type;
    }
}

export function getTransitionType() {
    return currentTransition;
}

// Helper to normalize border-radius for clip-path
function normalizeBorderRadius(borderRadius) {
    // Always use the CSS variable for consistent border radius
    return 'var(--radius-lg)';
}

// Transition configurations - GSAP powered
const transitions = {
    [transitionTypes.CROSSFADE]: {
        duration: 300,
        out: async (element) => {
            // Collapse scale-reveal elements
            const scaleRevealElements = Array.from(element.querySelectorAll('.scale-reveal'));
            
            const promises = [];
            
            if (scaleRevealElements.length > 0) {
                // Same order as entry (top to bottom, left to right)
                scaleRevealElements.forEach((el, index) => {
                    const rawBorderRadius = el.dataset.borderRadius || 
                                           window.getComputedStyle(el).borderRadius || 
                                           '12px';
                    const borderRadius = normalizeBorderRadius(rawBorderRadius);
                    
                    // Animate directly from current state (no instant set needed)
                    // The clip-path should already be at the fully revealed state
                    // from the transition in, which we preserve in cleanup
                    
                    // Collapse to bottom-right corner (opposite of entry)
                    const promise = gsap.to(el, {
                        clipPath: `inset(100% 0% 0% 100% round ${borderRadius})`,
                        duration: 0.3,
                        ease: 'expo.in',
                        delay: index * 0.04
                    });
                    
                    promises.push(promise);
                });
            }
            
            // Simple fade out for the main element
            promises.push(gsap.to(element, {
                opacity: 0.5,
                duration: 0.3,
                ease: 'none'
            }));
            
            // Wait for all animations to complete
            return Promise.all(promises);
        },
        in: (element) => {
            // Fade in main element with GSAP (linear ease)
            return gsap.fromTo(element, 
                { opacity: 0.5 },
                { 
                    opacity: 1, 
                    duration: 0.15,
                    ease: 'none'
                }
            );
        },
        cleanup: (element) => {
            // Clear props on main element
            gsap.set(element, { clearProps: 'opacity' });
            
            // DON'T clear clip-path - leave it at fully revealed state
            // This prevents popping when transition out starts
            // The clip-path will be animated from its current state
        }
    },
    
    [transitionTypes.SLIDE_UP]: {
        duration: 300,
        out: async (element) => {
            // Collapse scale-reveal elements
            const scaleRevealElements = Array.from(element.querySelectorAll('.scale-reveal'));
            
            const promises = [];
            
            if (scaleRevealElements.length > 0) {
                // Same order as entry (top to bottom, left to right)
                scaleRevealElements.forEach((el, index) => {
                    const rawBorderRadius = el.dataset.borderRadius || 
                                           window.getComputedStyle(el).borderRadius || 
                                           '12px';
                    const borderRadius = normalizeBorderRadius(rawBorderRadius);
                    
                    // Animate directly from current state (no instant set needed)
                    // The clip-path should already be at the fully revealed state
                    // from the transition in, which we preserve in cleanup
                    
                    // Collapse to bottom-right corner (opposite of entry)
                    const promise = gsap.to(el, {
                        clipPath: `inset(100% 0% 0% 100% round ${borderRadius})`,
                        duration: 0.3,
                        ease: 'expo.in',
                        delay: index * 0.04
                    });
                    
                    promises.push(promise);
                });
            }
            
            // Slide up and fade out with GSAP (linear ease)
            promises.push(gsap.to(element, {
                y: -20,
                opacity: 0.5,
                duration: 0.3,
                ease: 'none'
            }));
            
            // Wait for all animations to complete
            return Promise.all(promises);
        },
        in: (element) => {
            // Slide down and fade in with GSAP (linear ease)
            return gsap.fromTo(element,
                { y: 20, opacity: 0.5 },
                { 
                    y: 0,
                    opacity: 1,
                    duration: 0.175,
                    ease: 'none'
                }
            );
        },
        cleanup: (element) => {
            // Clear props on main element
            gsap.set(element, { clearProps: 'y,opacity' });
            
            // DON'T clear clip-path - leave it at fully revealed state
            // This prevents popping when transition out starts
            // The clip-path will be animated from its current state
        }
    },
    
    [transitionTypes.FADE_SCALE]: {
        duration: 300,
        out: async (element) => {
            // Collapse scale-reveal elements
            const scaleRevealElements = Array.from(element.querySelectorAll('.scale-reveal'));
            
            const promises = [];
            
            if (scaleRevealElements.length > 0) {
                // Same order as entry (top to bottom, left to right)
                scaleRevealElements.forEach((el, index) => {
                    const rawBorderRadius = el.dataset.borderRadius || 
                                           window.getComputedStyle(el).borderRadius || 
                                           '12px';
                    const borderRadius = normalizeBorderRadius(rawBorderRadius);
                    
                    // Animate directly from current state (no instant set needed)
                    // The clip-path should already be at the fully revealed state
                    // from the transition in, which we preserve in cleanup
                    
                    // Collapse to bottom-right corner (opposite of entry)
                    const promise = gsap.to(el, {
                        clipPath: `inset(100% 0% 0% 100% round ${borderRadius})`,
                        duration: 0.3,
                        ease: 'expo.in',
                        delay: index * 0.04
                    });
                    
                    promises.push(promise);
                });
            }
            
            // Scale down and fade out with GSAP (linear ease)
            promises.push(gsap.to(element, {
                scale: 0.97,
                opacity: 0.5,
                duration: 0.3,
                ease: 'none'
            }));
            
            // Wait for all animations to complete
            return Promise.all(promises);
        },
        in: (element) => {
            // Scale up and fade in with GSAP (linear ease)
            return gsap.fromTo(element,
                { scale: 0.97, opacity: 0.5 },
                { 
                    scale: 1,
                    opacity: 1,
                    duration: 0.175,
                    ease: 'none'
                }
            );
        },
        cleanup: (element) => {
            // Clear props on main element
            gsap.set(element, { clearProps: 'scale,opacity' });
            
            // DON'T clear clip-path - leave it at fully revealed state
            // This prevents popping when transition out starts
            // The clip-path will be animated from its current state
        }
    }
};

/**
 * Execute a page transition - GSAP powered
 * @param {HTMLElement} element - The content body element to transition
 * @param {HTMLElement} heroElement - The hero/visualization element (if present)
 * @param {Function} contentUpdateCallback - Function to call to update content during transition
 * @param {HTMLElement} newHeroElement - The new hero/visualization element after transition (if present)
 */
export async function executeTransition(element, heroElement, contentUpdateCallback, newHeroElement = null) {
    const config = transitions[currentTransition];
    
    if (!config) {
        // Fallback: just update content
        contentUpdateCallback();
        return;
    }
    
    // Check if there's any content to transition out (not first load)
    const hasExistingContent = heroElement || element.children.length > 0;
    
    // Transition OUT (skip if no existing content)
    const promises = [];
    
    if (hasExistingContent) {
        // If there's a hero element, hide body content immediately to prevent jump
        // (when hero becomes position:absolute, it leaves the flow and content jumps up)
        if (heroElement) {
            gsap.set(element, { opacity: 0 });
            // Only animate hero out
            promises.push(revealOut(heroElement));
        } else {
            // No hero, just fade out body content normally
            promises.push(config.out(element));
        }
        
        await Promise.all(promises);
    }
    
    // Update content (await in case callback is async)
    const result = await contentUpdateCallback();
    
    // Check if callback returns a hero element, or use provided newHeroElement
    const heroToReveal = result || newHeroElement;
    
    // Transition IN
    const inPromises = [];
    
    // If there's a new hero element, reveal it in and fade body content separately
    if (heroToReveal) {
        inPromises.push(revealIn(heroToReveal));
        // Fade in body content after hero starts revealing
        inPromises.push(
            gsap.to(element, {
                opacity: 1,
                duration: 0.3,
                delay: 0.2,
                ease: 'none'
            })
        );
    } else {
        // No hero, just fade in body content normally
        inPromises.push(config.in(element));
    }
    
    await Promise.all(inPromises);
    
    // Cleanup
    config.cleanup(element);
    if (heroToReveal) {
        // Clear transition properties but keep height (needed for hero fullscreen state)
        // clearProps will restore CSS values for margin, width, etc.
        gsap.set(heroToReveal, { 
            clearProps: 'width,position,left,top,margin,boxSizing'
        });
    }
}

/**
 * Reveal OUT animation - shrink width and height to bottom-right corner
 * Works for both homepage hero (.home-hero with margin: 16px) and visualizations
 */
async function revealOut(element) {
    // Get computed styles FIRST to preserve spacing
    // This captures margins from .home-hero, .visualization-container, etc.
    const computedStyle = window.getComputedStyle(element);
    const parent = element.parentElement;
    const parentStyle = parent ? window.getComputedStyle(parent) : null;
    
    // Get margins and parent padding
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    
    // Get parent's padding (if any)
    const parentPaddingLeft = parentStyle ? parseFloat(parentStyle.paddingLeft) || 0 : 0;
    const parentPaddingTop = parentStyle ? parseFloat(parentStyle.paddingTop) || 0 : 0;
    
    // Get current dimensions and position BEFORE any changes
    const currentWidth = element.offsetWidth;
    const currentHeight = element.offsetHeight;
    const rect = element.getBoundingClientRect();
    const parentRect = parent ? parent.getBoundingClientRect() : null;
    
    // Calculate exact position relative to parent's padding box
    // This is where the element currently appears visually
    const leftPos = parentPaddingLeft + marginLeft;
    const topPos = parentPaddingTop + marginTop;
    
    // Create a wrapper element to maintain document flow and prevent content jump
    const placeholder = document.createElement('div');
    placeholder.style.width = `${currentWidth}px`;
    placeholder.style.height = `${currentHeight}px`;
    placeholder.style.marginTop = `${marginTop}px`;
    placeholder.style.marginLeft = `${marginLeft}px`;
    placeholder.style.marginBottom = `${marginBottom}px`;
    placeholder.style.marginRight = `${marginRight}px`;
    placeholder.style.visibility = 'hidden';
    
    // Insert placeholder before element to hold its space
    element.parentNode.insertBefore(placeholder, element);
    
    // Now set element to absolute positioning at exact same visual position
    element.style.position = 'absolute';
    element.style.width = `${currentWidth}px`;
    element.style.height = `${currentHeight}px`;
    element.style.left = `${leftPos}px`;
    element.style.top = `${topPos}px`;
    element.style.margin = '0';
    element.style.boxSizing = 'border-box';
    
    // Animate the collapse to bottom-right corner
    await gsap.to(element, {
        width: 0,
        height: 0,
        left: leftPos + currentWidth,  // Move right
        top: topPos + currentHeight,   // Move down
        duration: 0.5,
        ease: 'expo.in'
    });
    
    // Remove placeholder after animation
    if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
}

/**
 * Reveal IN animation - expand width and height from top-left corner
 * Works for both homepage hero (.home-hero with margin: 16px) and visualizations
 */
async function revealIn(element) {
    // Get the parent container
    const parent = element.parentElement;
    
    // Calculate target dimensions BEFORE modifying the element
    let targetWidth, targetHeight;
    
    // Get element's computed dimensions (before any modifications)
    // This captures margins from .home-hero, .visualization-container, etc.
    const computedStyle = window.getComputedStyle(element);
    const parentStyle = parent ? window.getComputedStyle(parent) : null;
    
    // Get margins and parent padding
    const marginLeft = parseFloat(computedStyle.marginLeft) || 0;
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;
    
    // Get parent's padding (if any)
    const parentPaddingLeft = parentStyle ? parseFloat(parentStyle.paddingLeft) || 0 : 0;
    const parentPaddingTop = parentStyle ? parseFloat(parentStyle.paddingTop) || 0 : 0;
    const parentPaddingRight = parentStyle ? parseFloat(parentStyle.paddingRight) || 0 : 0;
    const parentPaddingBottom = parentStyle ? parseFloat(parentStyle.paddingBottom) || 0 : 0;
    
    // Calculate exact position relative to parent's padding box
    const rect = element.getBoundingClientRect();
    const parentRect = parent ? parent.getBoundingClientRect() : null;
    
    // Calculate initial position (where element should start)
    // Start from parent's padding edge
    const startLeft = parentPaddingLeft + marginLeft;
    const startTop = parentPaddingTop + marginTop;
    
    // Try to get dimensions from element's current state
    // offsetWidth/offsetHeight give us the element's actual rendered dimensions (excluding margins)
    const elementWidth = element.offsetWidth || parseFloat(computedStyle.width);
    const elementHeight = element.offsetHeight || parseFloat(computedStyle.height);
    
    if (elementWidth > 0) {
        targetWidth = elementWidth;
    } else if (parent) {
        // Available width = parent width - parent padding - element margins
        targetWidth = parent.offsetWidth - (parentPaddingLeft + parentPaddingRight) - (marginLeft + marginRight);
    } else {
        targetWidth = window.innerWidth - (marginLeft + marginRight);
    }
    
    if (elementHeight > 0) {
        // Element has explicit height - use it
        // The height we read is the element's content height (margins are separate)
        targetHeight = elementHeight;
    } else if (parent) {
        // Calculate dimensions that will work with margins and padding
        const parentHeight = parent.offsetHeight;
        
        if (parentHeight > 100) {
            // Use parent height minus padding and margins
            targetHeight = parentHeight - (parentPaddingTop + parentPaddingBottom) - (marginTop + marginBottom);
        } else {
            // Parent has no height, calculate from viewport
            targetHeight = window.innerHeight - (marginTop + marginBottom);
        }
    } else {
        // Final fallback
        targetHeight = window.innerHeight - (marginTop + marginBottom);
    }
    
    // Start from top-left corner (collapsed at size 0)
    // Position accounts for margins and parent padding
    gsap.set(element, {
        position: 'absolute',
        width: 0,
        height: 0,
        left: startLeft,
        top: startTop,
        margin: 0,  // Clear margin since position accounts for it
        boxSizing: 'border-box'
    });
    
    // Expand to full size from top-left
    await gsap.to(element, {
        width: targetWidth,
        height: targetHeight,
        duration: 0.6,
        ease: 'expo.out'
    });
}

