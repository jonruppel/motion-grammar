/**
 * Lazy Image Loader with Fade Animation
 * Loads images as they enter viewport and fades them in
 */

export class LazyImageLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '200px', // More aggressive for mobile Safari
            threshold: 0.01,
            fadeInDuration: 600,
            ...options
        };
        
        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers - load all images immediately
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );

        this.observeImages();
        
        // Safari iOS backup: Check on scroll/resize
        this.setupScrollBackup();
    }
    
    setupScrollBackup() {
        let scrollTimeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.checkVisibleImages();
            }, 150);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
    }

    observeImages() {
        const images = document.querySelectorAll('img[data-lazy-src]');
        images.forEach(img => this.observer.observe(img));
        
        // Safari iOS workaround: Force check after a delay
        // Sometimes Safari doesn't trigger IntersectionObserver immediately
        setTimeout(() => {
            this.checkVisibleImages();
        }, 100);
    }
    
    checkVisibleImages() {
        // Manually check if any lazy images are in viewport and load them
        const images = document.querySelectorAll('img[data-lazy-src]');
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            const isVisible = (
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0
            );
            
            if (isVisible) {
                this.loadImage(img);
                if (this.observer) {
                    this.observer.unobserve(img);
                }
            }
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }

    loadImage(img) {
        const src = img.getAttribute('data-lazy-src');
        if (!src) return;

        // Add loading spinner to parent
        const parent = img.parentElement;
        let spinner = null;
        if (parent && !parent.querySelector('.image-loading-spinner')) {
            spinner = document.createElement('div');
            spinner.className = 'image-loading-spinner';
            // Ensure parent has position context for absolute positioning
            const computedPosition = window.getComputedStyle(parent).position;
            if (computedPosition === 'static') {
                parent.style.position = 'relative';
            }
            parent.appendChild(spinner);
        }

        // Create a new image to preload
        const loader = new Image();
        
        loader.onload = () => {
            // Set the actual src
            img.src = src;
            img.removeAttribute('data-lazy-src');
            
            // Remove spinner
            if (spinner && spinner.parentElement) {
                spinner.remove();
            }
            
            // Trigger fade-in animation
            requestAnimationFrame(() => {
                img.classList.add('lazy-loaded');
            });
        };

        loader.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            // Still show the image, even if it fails
            img.src = src;
            img.removeAttribute('data-lazy-src');
            img.classList.add('lazy-loaded', 'lazy-error');
            
            // Remove spinner
            if (spinner && spinner.parentElement) {
                spinner.remove();
            }
        };

        // Start loading
        img.classList.add('lazy-loading');
        loader.src = src;
    }

    loadAllImages() {
        // Fallback for browsers without IntersectionObserver
        const images = document.querySelectorAll('img[data-lazy-src]');
        images.forEach(img => {
            const src = img.getAttribute('data-lazy-src');
            if (src) {
                img.src = src;
                img.removeAttribute('data-lazy-src');
                img.classList.add('lazy-loaded');
            }
        });
    }

    // Method to refresh observer for dynamically added images
    refresh() {
        if (this.observer) {
            this.observeImages();
            
            // Force an immediate check for Safari
            requestAnimationFrame(() => {
                this.checkVisibleImages();
            });
        }
    }

    // Destroy the observer
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Export singleton instance
export const lazyImageLoader = new LazyImageLoader();

