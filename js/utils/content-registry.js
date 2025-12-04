/**
 * Content Registry
 * Central registry for all content types and their configurations
 */

export class ContentRegistry {
    constructor() {
        this.content = new Map();
        this.initialize();
    }

    initialize() {
        // Case Studies
        this.register({
            type: 'case-study',
            id: 'oneover-com',
            title: 'OneOver.com',
            category: 'case-studies',
            dataPath: '/data/case-studies/oneover-com.json'
        });

        this.register({
            type: 'case-study',
            id: 'nano-banana',
            title: 'Nano Banana Apps',
            category: 'case-studies',
            dataPath: '/data/case-studies/nano-banana.json'
        });

        this.register({
            type: 'case-study',
            id: 'lexus-com',
            title: 'Lexus.com',
            category: 'case-studies',
            dataPath: '/data/case-studies/lexus-com.json'
        });

        this.register({
            type: 'case-study',
            id: 'lexus-april-fools',
            title: 'Lexus April Fools',
            category: 'case-studies',
            dataPath: '/data/case-studies/lexus-april-fools.json'
        });

        this.register({
            type: 'case-study',
            id: 'koko-ai',
            title: 'Koko AI',
            category: 'case-studies',
            dataPath: '/data/case-studies/koko-ai.json'
        });

        this.register({
            type: 'case-study',
            id: 'more-work',
            title: 'More Work',
            category: 'case-studies',
            dataPath: '/data/case-studies/more-work.json'
        });

        // About
        this.register({
            type: 'slide-deck',
            id: 'about',
            title: 'About',
            category: 'about',
            dataPath: '/data/about.json'
        });

        // Contact
        this.register({
            type: 'contact',
            id: 'contact',
            title: 'Contact',
            category: 'contact',
            data: {
                email: 'jon@motiongrammar.com',
                linkedin: 'https://www.linkedin.com/in/jonruppel/',
                twitter: 'https://twitter.com/jonruppel'
            }
        });
    }

    register(config) {
        this.content.set(config.id, config);
    }

    get(id) {
        return this.content.get(id);
    }

    getByCategory(category) {
        return Array.from(this.content.values())
            .filter(item => item.category === category);
    }

    getAll() {
        return Array.from(this.content.values());
    }

    getNavigationData() {
        // Group content by category for navigation
        const categories = {
            'case-studies': [],
            'about': [],
            'contact': []
        };

        this.content.forEach(item => {
            if (categories[item.category]) {
                categories[item.category].push({
                    id: item.id,
                    title: item.title,
                    type: item.type
                });
            }
        });

        return categories;
    }
}

// Export singleton instance
export const contentRegistry = new ContentRegistry();

