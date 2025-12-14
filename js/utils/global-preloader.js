import { contentRegistry } from './content-registry.js';

/**
 * Global Image Preloader
 * Handles background sequential loading of images to improve experience.
 * Uses a concurrency-limited queue to avoid network congestion.
 */
class GlobalPreloader {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.maxConcurrency = 4; // Allow some parallelism
        this.activeRequests = 0;
        this.loadedCache = new Set();
    }

    /**
     * Add URLs to the preload queue
     * @param {string|string[]} urls - URL or array of URLs to preload
     * @param {boolean} highPriority - If true, adds to front of queue
     */
    addToQueue(urls, highPriority = false) {
        if (!urls) return;
        if (!Array.isArray(urls)) urls = [urls];
        
        // Filter valid strings and duplicates
        const newUrls = urls.filter(url => 
            url && 
            typeof url === 'string' && 
            !this.loadedCache.has(url) && 
            !this.queue.includes(url)
        );

        if (newUrls.length > 0) {
            if (highPriority) {
                this.queue.unshift(...newUrls);
            } else {
                this.queue.push(...newUrls);
            }
            this.processQueue();
        }
    }

    processQueue() {
        if (this.activeRequests >= this.maxConcurrency || this.queue.length === 0) return;

        // Process until max concurrency reached or queue empty
        while (this.activeRequests < this.maxConcurrency && this.queue.length > 0) {
            const url = this.queue.shift();
            this.activeRequests++;
            
            this.loadImage(url).finally(() => {
                this.activeRequests--;
                this.processQueue();
            });
        }
    }

    loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.loadedCache.add(url);
                resolve(true);
            };
            img.onerror = () => {
                // Determine if failure, but resolve anyway to continue queue
                // console.warn(`Failed to preload: ${url}`);
                resolve(false);
            };
            img.src = url;
        });
    }

    /**
     * Preloads title images for all registered content (Case Studies, etc.)
     * Called usually after initial load.
     */
    async preloadSiteTitleImages() {
        const items = contentRegistry.getAll();
        const urlsToPreload = [];

        // We fetch JSONs to find the title image
        // This is done sequentially or in parallel? Parallel fetch is fine, they are small text.
        
        const fetchPromises = items.map(async (item) => {
            if (item.dataPath) {
                try {
                    const response = await fetch(item.dataPath);
                    const data = await response.json();
                    
                    // Logic to find the "Title Page Image"
                    // 1. Explicit titleImage property on overview slide
                    // 2. First image slide source
                    
                    if (data.slides && data.slides.length > 0) {
                        // Check first slide (Overview)
                        if (data.slides[0].titleImage) {
                            return data.slides[0].titleImage;
                        }
                        
                        // Check first slide (if Image type)
                        if (data.slides[0].type === 'image' && data.slides[0].src) {
                            return data.slides[0].src;
                        }

                        // Check first slide (if Mockup type)
                        if (['iphone', 'laptop', 'tv'].includes(data.slides[0].type)) {
                             // Mockups might have images array or src
                             if (data.slides[0].src) return data.slides[0].src;
                             if (data.slides[0].images && data.slides[0].images.length > 0) return data.slides[0].images[0];
                        }
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
            return null;
        });

        const results = await Promise.all(fetchPromises);
        const validUrls = results.filter(url => url);
        
        if (validUrls.length > 0) {
            // Add to queue with lower priority than active project assets
            this.addToQueue(validUrls, false);
        }
    }
}

export const globalPreloader = new GlobalPreloader();

