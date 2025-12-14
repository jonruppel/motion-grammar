/**
 * Mockup Helper
 * Utilities for creating device mockups (iPhone, Laptop, TV)
 */

/**
 * Create iPhone Mockup Structure
 * @param {Array} contentArray - Array of content sources
 * @returns {HTMLElement} The mockup element
 */
export function createIPhoneMockup(contentArray) {
    const mockup = document.createElement('div');
    mockup.className = 'iphone-mockup';

    const frame = document.createElement('div');
    frame.className = 'iphone-frame';

    // Notch (hidden by default in CSS but structure exists)
    const notch = document.createElement('div');
    notch.className = 'iphone-notch';
    frame.appendChild(notch);

    // Status Bar (hidden by default)
    const statusBar = document.createElement('div');
    statusBar.className = 'iphone-status-bar';
    frame.appendChild(statusBar);

    const screen = document.createElement('div');
    screen.className = 'iphone-screen';

    const content = document.createElement('div');
    content.className = 'iphone-content';
    
    screen.appendChild(content);
    
    // Home Indicator (hidden by default)
    const homeIndicator = document.createElement('div');
    homeIndicator.className = 'iphone-home-indicator';
    screen.appendChild(homeIndicator);

    frame.appendChild(screen);
    mockup.appendChild(frame);

    return mockup;
}

/**
 * Create Laptop Mockup Structure
 * @param {Array} contentArray - Array of content sources
 * @returns {HTMLElement} The mockup element
 */
export function createLaptopMockup(contentArray) {
    const mockup = document.createElement('div');
    mockup.className = 'laptop-mockup';

    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'laptop-frame-wrapper';

    const frame = document.createElement('div');
    frame.className = 'laptop-frame';

    const screen = document.createElement('div');
    screen.className = 'laptop-screen';

    const content = document.createElement('div');
    content.className = 'laptop-content';

    screen.appendChild(content);
    frame.appendChild(screen);
    frameWrapper.appendChild(frame);
    mockup.appendChild(frameWrapper);

    const base = document.createElement('div');
    base.className = 'laptop-base';
    mockup.appendChild(base);

    return mockup;
}

/**
 * Create TV Mockup Structure
 * @param {Array} contentArray - Array of content sources
 * @returns {HTMLElement} The mockup element
 */
export function createTVMockup(contentArray) {
    const mockup = document.createElement('div');
    mockup.className = 'tv-mockup';
    
    // Title Element (New)
    const title = document.createElement('div');
    title.className = 'tv-title';
    mockup.appendChild(title);

    const frame = document.createElement('div');
    frame.className = 'tv-frame';

    const screen = document.createElement('div');
    screen.className = 'tv-screen';

    const content = document.createElement('div');
    content.className = 'tv-content';

    screen.appendChild(content);
    frame.appendChild(screen);
    mockup.appendChild(frame);

    return mockup;
}
