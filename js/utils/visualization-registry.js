/**
 * Visualization Registry
 * Central registry for all visualizations
 * Makes it easy to add new visualizations - just add one entry here!
 */

// ============================================================================
// ADD NEW VISUALIZATIONS HERE
// ============================================================================
const VISUALIZATION_MANIFEST = [
    {
        id: 'viz-lava',
        title: 'Lava Lamp',
        description: 'Organic flowing metaball animation with bloom effects',
        module: () => import('../visualizations/lava-lamp.js'),
        className: 'LavaLamp'
    },
    {
        id: 'viz-network',
        title: 'Tumble Dweebs',
        description: '2D IK system with visible connections',
        module: () => import('../visualizations/blob-ik.js'),
        className: 'BlobIK'
    },
    {
        id: 'viz-forest',
        title: 'Into the Woods',
        description: 'Infinite forest of Munari-style trees moving from horizon to foreground',
        module: () => import('../visualizations/forest.js'),
        className: 'Forest'
    },
    {
        id: 'viz-block-roller',
        title: 'Block and Roll',
        description: 'Rolling blocks with physics and collision detection',
        module: () => import('../visualizations/block-roller.js'),
        className: 'BlockRoller'
    }
    // Add more visualizations here as needed!
];
// ============================================================================

class VisualizationRegistry {
    constructor() {
        this.visualizations = new Map();
        this.loadedModules = new Map();
    }

    /**
     * Initialize the registry with all visualizations from the manifest
     */
    async initialize() {
        console.log('🎨 Visualization Registry: Initializing...');
        
        // Register all visualizations from manifest
        VISUALIZATION_MANIFEST.forEach(viz => {
            this.visualizations.set(viz.id, {
                id: viz.id,
                title: viz.title,
                description: viz.description,
                module: viz.module,
                className: viz.className,
                visualizationClass: null // Will be loaded on demand
            });
        });
        
        console.log(`✅ Visualization Registry: Registered ${this.visualizations.size} visualizations`);
    }

    /**
     * Get visualization config by ID (without loading the module)
     */
    get(id) {
        return this.visualizations.get(id);
    }

    /**
     * Check if visualization exists
     */
    has(id) {
        return this.visualizations.has(id);
    }

    /**
     * Get visualization class (loads module if needed)
     */
    async getVisualizationClass(id) {
        const config = this.visualizations.get(id);
        if (!config) {
            throw new Error(`Visualization "${id}" not found in registry`);
        }

        // Return cached class if already loaded
        if (config.visualizationClass) {
            return config.visualizationClass;
        }

        // Check if module is already loaded
        if (this.loadedModules.has(id)) {
            const module = this.loadedModules.get(id);
            config.visualizationClass = module[config.className];
            return config.visualizationClass;
        }

        // Load the module
        try {
            const module = await config.module();
            this.loadedModules.set(id, module);
            config.visualizationClass = module[config.className];
            return config.visualizationClass;
        } catch (error) {
            console.error(`Failed to load visualization "${id}":`, error);
            throw error;
        }
    }

    /**
     * Get all visualization IDs
     */
    getIds() {
        return Array.from(this.visualizations.keys());
    }

    /**
     * Get all visualizations as array
     */
    getAll() {
        return Array.from(this.visualizations.values());
    }

    /**
     * Get navigation data for all visualizations
     * Returns array in format expected by navigation system
     */
    getNavigationData() {
        return Array.from(this.visualizations.values()).map(viz => ({
            id: viz.id,
            title: viz.title,
            description: viz.description,
            module: 'pages/visualization' // All use unified visualization page
        }));
    }

    /**
     * Get count of registered visualizations
     */
    getCount() {
        return this.visualizations.size;
    }
}

// Export singleton instance
export const visualizationRegistry = new VisualizationRegistry();

// Auto-initialize on import
visualizationRegistry.initialize();

