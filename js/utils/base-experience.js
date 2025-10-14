/**
 * Base Experience Module
 * Common utilities and patterns for regular experience pages
 */

/**
 * Creates the standard experience wrapper with intro section
 * @param {string} className - Additional class name for the experience
 * @param {string} title - Experience title (h2)
 * @param {string} description - Experience description
 * @param {string} content - The main content HTML
 * @returns {string} Complete HTML structure
 */
export function createExperienceWrapper(className, title, description, content) {
    return `
        <div class="experience ${className}">
            <!-- Experience Intro -->
            <div class="experience-intro">
                <h2>${title}</h2>
                <p>${description}</p>
            </div>
            
            ${content}
        </div>
    `;
}

/**
 * Creates an experience wrapper as a DOM element (not string)
 * Use this when you need to preserve component instances and event listeners
 * @param {string} className - Container class name
 * @param {string} title - Experience title
 * @param {string} description - Experience description
 * @param {HTMLElement} contentElement - DOM element containing the content
 * @returns {HTMLElement} Experience wrapper element
 */
export function createExperienceWrapperDOM(className, title, description, contentElement) {
    const wrapper = document.createElement('div');
    wrapper.className = `experience ${className}`;
    
    // Intro
    const intro = document.createElement('div');
    intro.className = 'experience-intro';
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    intro.appendChild(titleEl);
    
    const descEl = document.createElement('p');
    descEl.textContent = description;
    intro.appendChild(descEl);
    
    wrapper.appendChild(intro);
    wrapper.appendChild(contentElement);
    
    return wrapper;
}

/**
 * Creates a loading state
 * @param {string} className - Container class name
 * @param {string} message - Loading message (default: "Loading...")
 * @returns {string} Loading HTML
 */
export function createLoadingState(className, message = 'Loading...') {
    return `
        <div class="experience ${className}">
            <div class="${className.replace('-container', '')}-loading">
                <i class='bx bx-loader-alt bx-spin'></i>
                <p>${message}</p>
            </div>
        </div>
    `;
}

/**
 * Creates an error state
 * @param {string} className - Container class name
 * @param {string} message - Error message
 * @returns {string} Error HTML
 */
export function createErrorState(className, message = 'Unable to load data') {
    return `
        <div class="experience ${className}">
            <div class="${className.replace('-container', '')}-error">
                <i class='bx bx-error-circle'></i>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        </div>
    `;
}

/**
 * Triggers scale reveal animations on a container
 * @param {HTMLElement} container - Container to animate
 * @param {number} delay - Delay before triggering (default: 100ms)
 */
export function triggerScaleReveal(container, delay = 100) {
    setTimeout(() => {
        if (window.triggerScaleReveal) {
            requestAnimationFrame(() => {
                window.triggerScaleReveal(container);
            });
        }
    }, delay);
}

/**
 * Adds styles to the document if not already present
 * @param {string} styleId - Unique ID for the style element
 * @param {string} css - CSS content to inject
 */
export function addStylesOnce(styleId, css) {
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Base experience lifecycle hooks
 */
export class BaseExperience {
    constructor(container) {
        this.container = container;
    }
    
    /**
     * Render the experience HTML
     * Override this in subclasses
     */
    render() {
        throw new Error('render() must be implemented by subclass');
    }
    
    /**
     * Initialize interactivity after render
     * Override this in subclasses
     */
    init() {
        // Optional: Override in subclasses if needed
    }
    
    /**
     * Cleanup when experience is disposed
     * Override this in subclasses
     */
    dispose() {
        // Optional: Override in subclasses if needed
    }
}

