/**
 * Motion Design System
 * Centralized timing, easing, and choreography tokens
 * 
 * These values are not arbitrary - each serves a specific purpose
 * in creating a cohesive, purposeful motion language across experiences.
 */

export const motionSystem = {
    /**
     * Duration Tokens
     * 
     * instant (100ms)   - Immediate feedback, micro-interactions
     * quick (200ms)     - UI state changes, toggles, highlights
     * moderate (300ms)  - Content transitions, modal reveals
     * gentle (500ms)    - Large spatial movements, page transitions
     * deliberate (800ms)- Ceremonial moments, celebrations
     */
    duration: {
        instant: 100,
        quick: 200,
        moderate: 300,
        gentle: 500,
        deliberate: 800
    },

    /**
     * Easing Functions
     * 
     * standard    - General purpose, most transitions
     * decelerate  - Elements entering the screen (ease-out)
     * accelerate  - Elements exiting the screen (ease-in)
     * expressive  - Attention-grabbing, playful moments
     * smooth      - Data visualizations, continuous motion
     */
    easing: {
        standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
        expressive: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
    },

    /**
     * Stagger Delays
     * Used when animating multiple related elements
     * 
     * tight (30ms)    - Tightly coupled items (list items, cards in a row)
     * moderate (60ms) - Related groups (sections, form fields)
     * relaxed (100ms) - Independent elements (navigation items, features)
     */
    stagger: {
        tight: 30,
        moderate: 60,
        relaxed: 100
    },

    /**
     * Hierarchy Timing
     * Controls the order and timing of content reveals
     * 
     * Primary content appears first (hero, main action)
     * Secondary content follows (supporting info)
     * Tertiary content last (additional details, decorative)
     */
    hierarchy: {
        primary: 0,
        secondary: 150,
        tertiary: 300
    },

    /**
     * Spring Physics
     * For organic, physics-based motion
     */
    spring: {
        gentle: { tension: 120, friction: 14 },
        snappy: { tension: 210, friction: 20 },
        bouncy: { tension: 180, friction: 12 }
    }
};

/**
 * Helper to create CSS transition string
 */
export function createTransition(property, duration, easing = 'standard') {
    const durationValue = typeof duration === 'number' ? duration : motionSystem.duration[duration];
    const easingValue = motionSystem.easing[easing] || easing;
    return `${property} ${durationValue}ms ${easingValue}`;
}

/**
 * Helper to create staggered animations
 */
export function staggerElements(elements, animationFn, delay = 'moderate') {
    const delayValue = typeof delay === 'number' ? delay : motionSystem.stagger[delay];
    elements.forEach((element, index) => {
        setTimeout(() => {
            animationFn(element, index);
        }, index * delayValue);
    });
}

/**
 * Prefers-reduced-motion check
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get adjusted duration based on user preference
 */
export function getAdjustedDuration(duration) {
    if (prefersReducedMotion()) {
        return 0; // Instant for reduced motion
    }
    return typeof duration === 'number' ? duration : motionSystem.duration[duration];
}

