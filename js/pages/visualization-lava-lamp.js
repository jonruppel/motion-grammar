// Lava Lamp Visualization
// Full-screen ambient animation

import { LavaLamp } from '../visualizations/lava-lamp.js';

export const header = {
    title: 'Lava Lamp',
    description: 'Organic flowing metaball animation with bloom effects'
};

let visualization = null;
let container = null;

export async function render(containerElement) {
    // Load page-specific styles and wait for them to load
    await loadPageStyles();
    
    // Return just the visualization container (will be mounted to hero-container)
    const vizContainer = document.createElement('div');
    vizContainer.className = 'visualization-container';
    vizContainer.id = 'lavaLampContainer';
    
    container = vizContainer;
    return vizContainer;
}

export function init(containerElement) {
    if (container) {
        visualization = new LavaLamp(container);
    }
}

export function pause() {
    if (visualization && typeof visualization.pause === 'function') {
        visualization.pause();
    }
}

export function resume() {
    if (visualization && typeof visualization.resume === 'function') {
        visualization.resume();
    }
}

export function dispose() {
    if (visualization && typeof visualization.dispose === 'function') {
        visualization.dispose();
        visualization = null;
    }
}

// Load page-specific CSS and wait for it to load
function loadPageStyles() {
    const styleId = 'visualizations-page-styles';
    const existingLink = document.getElementById(styleId);
    
    // If stylesheet already exists, resolve immediately
    if (existingLink) {
        return Promise.resolve();
    }
    
    // Create and load new stylesheet
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = './styles/pages/visualizations.css';
        
        // Wait for stylesheet to load
        link.onload = () => resolve();
        link.onerror = () => {
            console.warn('Failed to load visualizations.css, but continuing anyway');
            resolve(); // Resolve anyway to not block rendering
        };
        
        document.head.appendChild(link);
    });
}

