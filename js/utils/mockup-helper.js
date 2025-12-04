/**
 * Mockup Helper - Utilities for device mockups
 * Currently supports iPhone mockup for case study displays
 */

export function createIPhoneMockup(imageSrcs = []) {
    const mockup = document.createElement('div');
    mockup.className = 'iphone-mockup';

    const frame = document.createElement('div');
    frame.className = 'iphone-frame';

    // Notch
    const notch = document.createElement('div');
    notch.className = 'iphone-notch';

    // Screen
    const screen = document.createElement('div');
    screen.className = 'iphone-screen';

    // Status Bar
    const statusBar = document.createElement('div');
    statusBar.className = 'iphone-status-bar';
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    statusBar.innerHTML = `
        <span class="status-time">${time}</span>
        <span class="status-icons">📶 📡 🔋</span>
    `;

    // Content area (scrollable)
    const content = document.createElement('div');
    content.className = 'iphone-content';

    // Add images to content
    imageSrcs.forEach(src => {
        const img = document.createElement('img');
        img.setAttribute('data-lazy-src', src);
        img.alt = 'Case study image';
        content.appendChild(img);
    });

    // Home indicator
    const homeIndicator = document.createElement('div');
    homeIndicator.className = 'iphone-home-indicator';
    homeIndicator.innerHTML = '<div class="home-indicator-bar"></div>';

    // Assemble screen
    screen.appendChild(notch);
    screen.appendChild(statusBar);
    screen.appendChild(content);
    screen.appendChild(homeIndicator);

    // Assemble frame
    frame.appendChild(screen);

    // Assemble mockup
    mockup.appendChild(frame);

    return mockup;
}

/**
 * Create an iPhone mockup from slide data
 * Useful for rendering case study image slides in device context
 */
export function createIPhoneMockupFromSlide(slide) {
    // Extract image source(s) from slide
    let imageSrcs = [];

    if (slide.type === 'image' && slide.src) {
        imageSrcs = [slide.src];
    } else if (slide.images && Array.isArray(slide.images)) {
        imageSrcs = slide.images.map(img => img.src || img);
    }

    return createIPhoneMockup(imageSrcs);
}

/**
 * Create a MacBook/Laptop mockup
 */
export function createLaptopMockup(imageSrcs = []) {
    const mockup = document.createElement('div');
    mockup.className = 'laptop-mockup';

    // Wrapper with side bezels
    const wrapper = document.createElement('div');
    wrapper.className = 'laptop-frame-wrapper';

    const frame = document.createElement('div');
    frame.className = 'laptop-frame';

    // Screen surface (no camera, no bands)
    const screen = document.createElement('div');
    screen.className = 'laptop-screen';

    // Content area (scrollable)
    const content = document.createElement('div');
    content.className = 'laptop-content';

    // Add images to content
    imageSrcs.forEach(src => {
        const img = document.createElement('img');
        img.setAttribute('data-lazy-src', src);
        img.alt = 'Case study image';
        content.appendChild(img);
    });

    // Assemble screen (single seamless surface inside frame)
    screen.appendChild(content);

    // Assemble frame
    frame.appendChild(screen);

    // Assemble wrapper
    wrapper.appendChild(frame);

    // Create base/hinge
    const base = document.createElement('div');
    base.className = 'laptop-base';

    // Assemble mockup
    mockup.appendChild(wrapper);
    mockup.appendChild(base);

    return mockup;
}

/**
 * Create a MacBook mockup from slide data
 * Useful for rendering case study image slides in device context
 */
export function createLaptopMockupFromSlide(slide) {
    // Extract image source(s) from slide
    let imageSrcs = [];

    if (slide.type === 'image' && slide.src) {
        imageSrcs = [slide.src];
    } else if (slide.images && Array.isArray(slide.images)) {
        imageSrcs = slide.images.map(img => img.src || img);
    }

    return createLaptopMockup(imageSrcs);
}

/**
 * Create a TV mockup
 */
export function createTVMockup(videoSrcs = []) {
    const mockup = document.createElement('div');
    mockup.className = 'tv-mockup';

    const frame = document.createElement('div');
    frame.className = 'tv-frame';

    // Screen surface (single masked area)
    const screen = document.createElement('div');
    screen.className = 'tv-screen';

    // Content area (scrollable)
    const content = document.createElement('div');
    content.className = 'tv-content';

    // Add videos or images to content
    videoSrcs.forEach(src => {
        let element;
        
        // Check if it's a video or image based on file extension
        if (src.includes('.mp4') || src.includes('.webm') || src.includes('.ogg')) {
            element = document.createElement('video');
            element.src = src;
            element.controls = true;
            element.style.width = '100%';
            element.style.height = 'auto';
        } else {
            element = document.createElement('img');
            element.setAttribute('data-lazy-src', src);
            element.alt = 'Case study video/image';
        }
        
        content.appendChild(element);
    });

    // Assemble screen
    screen.appendChild(content);

    // Assemble frame
    frame.appendChild(screen);

    // Assemble mockup
    mockup.appendChild(frame);

    return mockup;
}

/**
 * Create a TV mockup from slide data
 */
export function createTVMockupFromSlide(slide) {
    // Extract video/image source(s) from slide
    let videoSrcs = [];

    if (slide.type === 'video' && slide.src) {
        videoSrcs = [slide.src];
    } else if (slide.src && slide.src.includes(('mp4' || 'webm'))) {
        videoSrcs = [slide.src];
    } else if (slide.videos && Array.isArray(slide.videos)) {
        videoSrcs = slide.videos.map(video => video.src || video);
    }

    return createTVMockup(videoSrcs);
}

export default {
    createIPhoneMockup,
    createIPhoneMockupFromSlide,
    createLaptopMockup,
    createLaptopMockupFromSlide,
    createTVMockup,
    createTVMockupFromSlide
};

