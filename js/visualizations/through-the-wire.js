import * as THREE from 'three';
import { loadMusicData, convertMusicData } from '../utils/music-utils.js';

// Heart and Soul Music Data
// Using music box style: 4 fixed pitch wires for melody (Front), 4 for bass (Back)
// Melody: C5, A4, G4, F4 (High to Low mapping)
// Bass: G3, F3, E3, C3 (High to Low mapping)
const HEART_AND_SOUL = {
    melody: [
        // Bar 1: C C C (Heart and soul)
        { bar: 0, notes: [
            { wire: 0, timing: 0.0, note: "C5" }, // Heart (beat 1)
            { wire: 0, timing: 0.25, note: "C5" }, // and (beat 2)
            { wire: 0, timing: 0.5, note: "C5" }  // Soul (beat 3, hold)
        ]},
        // Bar 2: A A A (I fell in love)
        { bar: 1, notes: [
            { wire: 1, timing: 0.0, note: "A4" },
            { wire: 1, timing: 0.25, note: "A4" },
            { wire: 1, timing: 0.5, note: "A4" }
        ]},
        // Bar 3: F F F (With you)
        { bar: 2, notes: [
            { wire: 3, timing: 0.0, note: "F4" },
            { wire: 3, timing: 0.25, note: "F4" },
            { wire: 3, timing: 0.5, note: "F4" }
        ]},
        // Bar 4: G G G (Lost control)
        { bar: 3, notes: [
            { wire: 2, timing: 0.0, note: "G4" },
            { wire: 2, timing: 0.25, note: "G4" },
            { wire: 2, timing: 0.5, note: "G4" }
        ]},
        // Bar 5: C C C (Heart and soul) - Repeat
        { bar: 4, notes: [
            { wire: 0, timing: 0.0, note: "C5" },
            { wire: 0, timing: 0.25, note: "C5" },
            { wire: 0, timing: 0.5, note: "C5" }
        ]},
        // Bar 6: A A A
        { bar: 5, notes: [
            { wire: 1, timing: 0.0, note: "A4" },
            { wire: 1, timing: 0.25, note: "A4" },
            { wire: 1, timing: 0.5, note: "A4" }
        ]},
        // Bar 7: F F F
        { bar: 6, notes: [
            { wire: 3, timing: 0.0, note: "F4" },
            { wire: 3, timing: 0.25, note: "F4" },
            { wire: 3, timing: 0.5, note: "F4" }
        ]},
        // Bar 8: G G G
        { bar: 7, notes: [
            { wire: 2, timing: 0.0, note: "G4" },
            { wire: 2, timing: 0.25, note: "G4" },
            { wire: 2, timing: 0.5, note: "G4" }
        ]},
        // Bar 9: C... B A G F E D (Little Bouncy part) - Simplified for 4 wires
        // Using available notes: C, A, G, F
        { bar: 8, notes: [
            { wire: 0, timing: 0.0, note: "C5" }, // C
            { wire: 1, timing: 0.5, note: "A4" }, // A
            { wire: 2, timing: 0.75, note: "G4" } // G
        ]},
        // Bar 10
        { bar: 9, notes: [
            { wire: 3, timing: 0.0, note: "F4" }, // F
            { wire: 2, timing: 0.5, note: "G4" }  // G
        ]},
        // Bar 11
        { bar: 10, notes: [
            { wire: 0, timing: 0.0, note: "C5" },
            { wire: 0, timing: 0.25, note: "C5" },
            { wire: 0, timing: 0.5, note: "C5" }
        ]},
        // Bar 12
        { bar: 11, notes: [
            { wire: 2, timing: 0.0, note: "G4" }
        ]}
    ],
    bass: [
        // Bar 1: C
        { bar: 0, notes: [
            { wire: 3, timing: 0.0, note: "C3" },
            { wire: 3, timing: 0.5, note: "C3" }
        ]},
        // Bar 2: A
        { bar: 1, notes: [
            { wire: 1, timing: 0.0, note: "F3" } // Using F wire for now? No, A is not in G, F, E, C set?
            // Let's Remap Bass Wires: A2, G2, F2, C2 -> Wire 0, 1, 2, 3
            // Let's explicitly use notes: A2
        ]},
        // Bar 3: F
        { bar: 2, notes: [
            { wire: 1, timing: 0.0, note: "F3" }
        ]},
        // Bar 4: G
        { bar: 3, notes: [
            { wire: 0, timing: 0.0, note: "G3" }
        ]},
        // Repeat
        { bar: 4, notes: [ { wire: 3, timing: 0.0, note: "C3" } ] },
        { bar: 5, notes: [ { wire: 1, timing: 0.0, note: "F3" } ] }, // F3 is close to A? No.
        { bar: 6, notes: [ { wire: 1, timing: 0.0, note: "F3" } ] },
        { bar: 7, notes: [ { wire: 0, timing: 0.0, note: "G3" } ] }
    ]
};

// Update Heart and Soul Bass Data to match new tuning:
// Wire 0: A3, Wire 1: G3, Wire 2: F3, Wire 3: C3
HEART_AND_SOUL.bass = [
    // Bar 1: C (Wire 3)
    { bar: 0, notes: [{ wire: 3, timing: 0.0, note: "C3" }, { wire: 3, timing: 0.5, note: "C3" }] },
    // Bar 2: Am (Wire 0 - A3)
    { bar: 1, notes: [{ wire: 0, timing: 0.0, note: "A3" }, { wire: 0, timing: 0.5, note: "A3" }] },
    // Bar 3: F (Wire 2 - F3)
    { bar: 2, notes: [{ wire: 2, timing: 0.0, note: "F3" }, { wire: 2, timing: 0.5, note: "F3" }] },
    // Bar 4: G (Wire 1 - G3)
    { bar: 3, notes: [{ wire: 1, timing: 0.0, note: "G3" }, { wire: 1, timing: 0.5, note: "G3" }] },
    // Repeat pattern
    { bar: 4, notes: [{ wire: 3, timing: 0.0, note: "C3" }, { wire: 3, timing: 0.5, note: "C3" }] },
    { bar: 5, notes: [{ wire: 0, timing: 0.0, note: "A3" }, { wire: 0, timing: 0.5, note: "A3" }] },
    { bar: 6, notes: [{ wire: 2, timing: 0.0, note: "F3" }, { wire: 2, timing: 0.5, note: "F3" }] },
    { bar: 7, notes: [{ wire: 1, timing: 0.0, note: "G3" }, { wire: 1, timing: 0.5, note: "G3" }] },
    // Continue simplistic bass
    { bar: 8, notes: [{ wire: 3, timing: 0.0, note: "C3" }] },
    { bar: 9, notes: [{ wire: 0, timing: 0.0, note: "A3" }] },
    { bar: 10, notes: [{ wire: 2, timing: 0.0, note: "F3" }] },
    { bar: 11, notes: [{ wire: 1, timing: 0.0, note: "G3" }] }
];

export const THROUGH_THE_WIRE_SETTINGS = {
    pole: {
        baseHeight: 8,
        heightVariation: 1.5, // ±1.5 units
        radius: 0.15,
        color: "var(--color-border)",
        groundY: -4,
        crossarm: {
            width: 2.0,
            height: 0.1,
            depth: 0.1,
            minOffsetY: 0,
            maxOffsetY: 0.5 // Variable offset from top
        },
        transformer: {
            radius: 0.08,
            height: 0.4,
            chance: 0.3 // 30% chance
        }
    },
    wire: {
        radius: 0.015, // Even thinner wires
        minSag: 1.5, // Noticeable slump on every wire
        maxSag: 4.0, // More variability in slump
        color: "var(--color-border)",
        numWires: 4 // Fixed 4 wires per pair
    },
    bird: {
        size: 0.0025, // Shrunk another 50% (total 40x smaller)
        color: "var(--color-accent)",
        maxPerWire: 5, // 0 to 5 birds per wire (sparser)
        outline: true // Add stroke for silhouette
    },
    insulator: {
        radius: 0.03, // Small spheres for wire attachments
        offsetBelow: 0.1 // Position slightly below connection point
    },
    scene: {
        maxPoles: 8,
        spawnX: 40, // Start on the right side
        cullX: -40, // Cull on the left side
        moveSpeed: -0.05, // Negative speed = move leftward
        poleSpacing: 12, // Much wider spacing between poles
        spawnInterval: 1.0
    },
    camera: {
        fov: 60, // Tighter framing
        position: {x: 0, y: 1.5, z: 6}, // Closer and slightly lower
        near: 0.1,
        far: 50
    },
    background: {
        color: "var(--color-bg-secondary)"
    }
};

export class ThroughTheWire {
    constructor(container, settings = THROUGH_THE_WIRE_SETTINGS) {
        this.container = container;
        this.settings = settings;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.poles = [];
        this.wires = [];
        this.birds = [];
        this.secondPoles = [];
        this.secondWires = [];
        this.secondBirds = [];
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.isPaused = false;
        this.time = 0;
        this.animationId = null;
        this.birdTexture = null;
        this.secondLayerGroup = null;
        this.moon = null;
        
        // Music synchronization
        this.currentBarIndex = 0;
        this.polesGenerated = 0;
        
        // Music data - can be loaded from external source
        this.musicData = null;
        
        // Initialize with Heart and Soul
        this.musicData = HEART_AND_SOUL;
        
        this.init();
    }
    
    /**
     * Load music data from a JSON file
     * Expected format:
     * {
     *   melody: [{ bar: 0, notes: [{ note: "E5", timing: 0.0 }, ...] }, ...],
     *   bass: [{ bar: 0, notes: [{ note: "C4", timing: 0.0 }] }, ...]
     * }
     */
    async loadMusicData(url) {
        try {
            const { loadMusicData } = await import('../utils/music-utils.js');
            this.musicData = await loadMusicData(url);
            console.log('Music data loaded from:', url);
        } catch (error) {
            console.error('Failed to load music data, using default:', error);
        }
    }
    
    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    renderSingleFrame(forceResize = false) {
        if (forceResize && this.container) {
            const rect = this.container.getBoundingClientRect();
            const currentWidth = Math.round(rect.width);
            const currentHeight = Math.round(rect.height);
            
            if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
                this.onResize();
            }
        }
        
        if (this.renderer) {
            this.renderer.render(this.scene, this.camera);
            
            requestAnimationFrame(() => {
                if (this.renderer) {
                    this.renderer.render(this.scene, this.camera);
                }
            });
        }
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            
            if (this.container) {
                const rect = this.container.getBoundingClientRect();
                const currentWidth = Math.round(rect.width);
                const currentHeight = Math.round(rect.height);
                
                if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
                    this.onResize();
                }
            }
            
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
            
            this.animate();
        }
    }
    
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'telephone-canvas';
        this.container.appendChild(this.canvas);
        
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.parseCSSColor(this.settings.background.color));
        
        this.camera = new THREE.PerspectiveCamera(
            this.settings.camera.fov,
            width / height,
            this.settings.camera.near,
            this.settings.camera.far
        );
        this.camera.position.set(
            this.settings.camera.position.x,
            this.settings.camera.position.y,
            this.settings.camera.position.z
        );
        this.camera.lookAt(0, 2.5, 0);
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: false,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Load bird texture (400x400 PNG with four 200x200 birds in 2x2 grid)
        const loader = new THREE.TextureLoader();
        this.birdTexture = loader.load('/images/birds.png');
        this.birdTexture.magFilter = THREE.NearestFilter; // Pixel perfect
        this.birdTexture.minFilter = THREE.LinearMipMapLinearFilter;
        
        this.lastWidth = width;
        this.lastHeight = height;
        
        // First layer (foreground)
        this.spawnInitialPoles();
        
        // Second layer (background) for depth
        this.secondLayerGroup = new THREE.Group();
        this.secondLayerGroup.position.z = -5; // Further back
        this.secondLayerGroup.scale.set(0.8, 0.8, 0.8); // Slightly smaller
        this.scene.add(this.secondLayerGroup);
        this.spawnInitialPolesSecond();
        
        // Create moon behind second layer
        this.createMoon();
        
        this.handleResize = this.onResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        this.handleThemeChange = this.onThemeChange.bind(this);
        window.addEventListener('themechange', this.handleThemeChange);
        
        this.animate();
    }
    
    onThemeChange() {
        this.updateColors();
    }
    
    createMoon() {
        // Create moon as a circle with border, positioned behind second layer
        const moonRadius = 4;
        const moonGeometry = new THREE.CircleGeometry(moonRadius, 64);
        
        // Get light theme background color (always use light theme for moon)
        const lightBgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
        const borderColor = this.parseCSSColor(this.settings.wire.color);
        
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(lightBgColor)
        });
        
        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // Position moon in the sky, behind second layer (z < -5)
        moonMesh.position.set(0, 5, -10);
        
        // Create border using LineLoop
        const borderGeometry = new THREE.EdgesGeometry(moonGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({
            color: borderColor,
            linewidth: 2
        });
        const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
        borderMesh.position.copy(moonMesh.position);
        
        this.scene.add(moonMesh);
        this.scene.add(borderMesh);
        
        this.moon = {
            mesh: moonMesh,
            border: borderMesh
        };
    }
    
    updateColors() {
        this.scene.background = new THREE.Color(this.parseCSSColor(this.settings.background.color));
        
        this.poles.forEach(pole => {
            if (pole.poleMesh && pole.poleMesh.material) {
                pole.poleMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.poleMesh.material.needsUpdate = true;
            }
            if (pole.crossarmMesh && pole.crossarmMesh.material) {
                pole.crossarmMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.crossarmMesh.material.needsUpdate = true;
            }
            if (pole.transformerMesh && pole.transformerMesh.material) {
                pole.transformerMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.transformerMesh.material.needsUpdate = true;
            }
        });
        
        this.wires.forEach(wire => {
            if (wire.mesh && wire.mesh.material) {
                wire.mesh.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.mesh.material.needsUpdate = true;
            }
            if (wire.startInsulator && wire.startInsulator.material) {
                wire.startInsulator.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.startInsulator.material.needsUpdate = true;
            }
            if (wire.endInsulator && wire.endInsulator.material) {
                wire.endInsulator.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.endInsulator.material.needsUpdate = true;
            }
        });
        
        // Update all bird materials (first layer)
        this.birds.forEach(bird => {
            if (bird.group.material) {
                bird.group.material.color = this.parseCSSColor(this.settings.bird.color);
                bird.group.material.needsUpdate = true;
            }
        });
        
        // Update all second layer bird materials
        this.secondBirds.forEach(bird => {
            if (bird.group.material) {
                bird.group.material.color = this.parseCSSColor(this.settings.bird.color);
                bird.group.material.needsUpdate = true;
            }
        });
        
        // Update second layer poles
        this.secondPoles.forEach(pole => {
            if (pole.poleMesh && pole.poleMesh.material) {
                pole.poleMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.poleMesh.material.needsUpdate = true;
            }
            if (pole.crossarmMesh && pole.crossarmMesh.material) {
                pole.crossarmMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.crossarmMesh.material.needsUpdate = true;
            }
            if (pole.transformerMesh && pole.transformerMesh.material) {
                pole.transformerMesh.material.color = this.parseCSSColor(this.settings.pole.color);
                pole.transformerMesh.material.needsUpdate = true;
            }
        });
        
        // Update second layer wires
        this.secondWires.forEach(wire => {
            if (wire.mesh && wire.mesh.material) {
                wire.mesh.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.mesh.material.needsUpdate = true;
            }
            if (wire.startInsulator && wire.startInsulator.material) {
                wire.startInsulator.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.startInsulator.material.needsUpdate = true;
            }
            if (wire.endInsulator && wire.endInsulator.material) {
                wire.endInsulator.material.color = this.parseCSSColor(this.settings.wire.color);
                wire.endInsulator.material.needsUpdate = true;
            }
        });
        
        // Update moon border color
        if (this.moon && this.moon.border && this.moon.border.material) {
            this.moon.border.material.color = this.parseCSSColor(this.settings.wire.color);
            this.moon.border.material.needsUpdate = true;
        }
    }
    
    spawnInitialPoles() {
        // Create initial poles to have some scene in view
        const numInitialPoles = 3;
        // Start from leftmost position so array is ordered left-to-right [left, middle, right]
        let currentX = this.settings.scene.spawnX - (this.settings.scene.poleSpacing * (numInitialPoles - 1));
        
        for (let i = 0; i < numInitialPoles; i++) {
            this.createPoleAt(currentX);
            currentX += this.settings.scene.poleSpacing; // Move right (increase X)
        }
        
        // Create wires between initial poles (each span represents 4 bars)
        for (let i = 1; i < this.poles.length; i++) {
            this.createWires(this.poles[i - 1], this.poles[i]);
            // Increment bar index by 4 after creating wires for each span (4 bars per span)
            this.currentBarIndex += 4;
        }
    }
    
    createPoleAt(x) {
        const group = new THREE.Group();
        
        group.position.set(x, this.settings.pole.groundY, 0);
        
        // Random pole height
        const height = this.settings.pole.baseHeight + (Math.random() - 0.5) * 2 * this.settings.pole.heightVariation;
        
        // Pole cylinder
        const poleGeometry = new THREE.CylinderGeometry(
            this.settings.pole.radius,
            this.settings.pole.radius,
            height,
            8
        );
        const poleMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
        poleMesh.position.y = height / 2;
        group.add(poleMesh);
        
        // Random crossarm offset
        const crossarmOffsetY = this.settings.pole.crossarm.minOffsetY + Math.random() * (this.settings.pole.crossarm.maxOffsetY - this.settings.pole.crossarm.minOffsetY);
        
        // Crossarm at variable offset from top
        const crossarmGeometry = new THREE.BoxGeometry(
            this.settings.pole.crossarm.width,
            this.settings.pole.crossarm.height,
            this.settings.pole.crossarm.depth
        );
        const crossarmMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const crossarmMesh = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
        crossarmMesh.position.set(0, height - crossarmOffsetY, 0);
        group.add(crossarmMesh);
        
        // Occasional transformer (cylinder near top)
        let transformerMesh = null;
        if (Math.random() < this.settings.pole.transformer.chance) {
            const transformerGeometry = new THREE.CylinderGeometry(
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.height,
                12
            );
            const transformerMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.pole.color)
            });
            transformerMesh = new THREE.Mesh(transformerGeometry, transformerMaterial);
            transformerMesh.position.y = height - 0.3; // Near top, below crossarm
            transformerMesh.rotation.z = Math.PI / 4; // Slight rotation for realism
            group.add(transformerMesh);
        }
        
        this.scene.add(group);
        
        const topY = height - crossarmOffsetY + this.settings.pole.crossarm.height / 2;
        const poleData = {
            group: group,
            poleMesh: poleMesh,
            crossarmMesh: crossarmMesh,
            transformerMesh: transformerMesh,
            currentX: x,
            height: height,
            topY: topY,
            baseY: 0,
            crossarmHalfWidth: this.settings.pole.crossarm.width / 2,
            crossarmOffsetY: crossarmOffsetY
        };
        
        // Add random leaning to the entire pole structure
        const leanAngle = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1 radians
        group.rotation.z = leanAngle;
        
        this.poles.push(poleData);
    }
    
    spawnPole() {
        const group = new THREE.Group();
        
        // Always spawn at the same left position
        const x = this.settings.scene.spawnX;
        
        group.position.set(x, this.settings.pole.groundY, 0);
        
        // Random pole height
        const height = this.settings.pole.baseHeight + (Math.random() - 0.5) * 2 * this.settings.pole.heightVariation;
        
        // Pole cylinder
        const poleGeometry = new THREE.CylinderGeometry(
            this.settings.pole.radius,
            this.settings.pole.radius,
            height,
            8
        );
        const poleMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
        poleMesh.position.y = height / 2;
        group.add(poleMesh);
        
        // Random crossarm offset
        const crossarmOffsetY = this.settings.pole.crossarm.minOffsetY + Math.random() * (this.settings.pole.crossarm.maxOffsetY - this.settings.pole.crossarm.minOffsetY);
        
        // Crossarm at variable offset from top
        const crossarmGeometry = new THREE.BoxGeometry(
            this.settings.pole.crossarm.width,
            this.settings.pole.crossarm.height,
            this.settings.pole.crossarm.depth
        );
        const crossarmMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const crossarmMesh = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
        crossarmMesh.position.set(0, height - crossarmOffsetY, 0);
        group.add(crossarmMesh);
        
        // Occasional transformer (cylinder near top)
        let transformerMesh = null;
        if (Math.random() < this.settings.pole.transformer.chance) {
            const transformerGeometry = new THREE.CylinderGeometry(
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.height,
                12
            );
            const transformerMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.pole.color)
            });
            transformerMesh = new THREE.Mesh(transformerGeometry, transformerMaterial);
            transformerMesh.position.y = height - 0.3; // Near top, below crossarm
            transformerMesh.rotation.z = Math.PI / 4; // Slight rotation for realism
            group.add(transformerMesh);
        }
        
        this.scene.add(group);
        
        const topY = height - crossarmOffsetY + this.settings.pole.crossarm.height / 2;
        const poleData = {
            group: group,
            poleMesh: poleMesh,
            crossarmMesh: crossarmMesh,
            transformerMesh: transformerMesh,
            currentX: x,
            height: height,
            topY: topY,
            baseY: 0,
            crossarmHalfWidth: this.settings.pole.crossarm.width / 2,
            crossarmOffsetY: crossarmOffsetY
        };
        
        // Add random leaning to the entire pole structure
        const leanAngle = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1 radians
        group.rotation.z = leanAngle;
        
        // Push new pole to end (newest on right, since we're moving left)
        this.poles.push(poleData);
        
        // Create wires to the previous pole (left) if exists
        // Each new pole section represents 4 bars of music
        if (this.poles.length > 1) {
            const rightPole = this.poles[this.poles.length - 1]; // Newest (rightmost)
            const leftPole = this.poles[this.poles.length - 2]; // Previous one (to the left)
            this.createWires(leftPole, rightPole);
            // Increment bar index by 4 after creating wires (which spawns birds for 4 bars)
            this.currentBarIndex += 4;
        }
    }
    
    createWires(startPole, endPole) {
        const numWires = this.settings.wire.numWires; // 4 wires
        const crossarmWidth = this.settings.pole.crossarm.width;
        const wireSpacing = crossarmWidth / (numWires + 1); // Even spacing across crossarm
        
        for (let i = 1; i <= numWires; i++) {
            // Random sag for this specific wire (more variability)
            const sag = this.settings.wire.minSag + Math.random() * (this.settings.wire.maxSag - this.settings.wire.minSag);
            
            // Attachment points evenly spaced on crossarms (from left to right)
            const startOffsetX = -(crossarmWidth / 2) + i * wireSpacing;
            const endOffsetX = -(crossarmWidth / 2) + i * wireSpacing;
            
            // Get world positions accounting for pole rotation (lean)
            // Create temp vectors at attachment points
            const startLocalPos = new THREE.Vector3(startOffsetX, startPole.topY, 0);
            const endLocalPos = new THREE.Vector3(endOffsetX, endPole.topY, 0);
            
            // Transform by pole group rotation
            startLocalPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), startPole.group.rotation.z);
            endLocalPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), endPole.group.rotation.z);
            
            // Wire connects from crossarm of start pole to crossarm of end pole
            const startY = startLocalPos.y;
            const startX = startLocalPos.x;
            const endY = endLocalPos.y;
            const endX = endLocalPos.x;
            
            // Calculate distance between poles
            const distance = endPole.currentX - startPole.currentX;
            
            // Create curve points (relative to start pole position, accounting for rotation)
            const startPoint = new THREE.Vector3(startX, startY, 0);
            const endPoint = new THREE.Vector3(distance + endX, endY, 0);
            
            // Middle point sags down
            const midX = distance / 2 + (startX + endX) / 2;
            const midY = (startY + endY) / 2 - sag;
            const midPoint = new THREE.Vector3(midX, midY, 0);
            
            // Create smooth catenary-like curve
            const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
            
            // Create tube geometry for the wire with higher resolution for smoothness
            const geometry = new THREE.TubeGeometry(curve, 80, this.settings.wire.radius, 16, false);
            const material = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.wire.color)
            });
            const wireMesh = new THREE.Mesh(geometry, material);
            
            // Position wire group at start pole
            const wireGroup = new THREE.Group();
            wireGroup.position.copy(startPole.group.position);
            wireGroup.add(wireMesh);
            
            this.scene.add(wireGroup);
            
            // Create insulators (small spheres) at attachment points
            const insulatorMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.wire.color)
            });
            const insulatorGeometry = new THREE.SphereGeometry(this.settings.insulator.radius, 8, 6);
            
            // Start insulator on start pole's crossarm (local coordinates account for rotation)
            const startInsulator = new THREE.Mesh(insulatorGeometry, insulatorMaterial);
            startInsulator.position.set(startOffsetX, startPole.topY - this.settings.insulator.offsetBelow, 0);
            startPole.group.add(startInsulator);
            
            // End insulator on end pole's crossarm (local coordinates account for rotation)
            const endInsulator = new THREE.Mesh(insulatorGeometry, insulatorMaterial);
            endInsulator.position.set(endOffsetX, endPole.topY - this.settings.insulator.offsetBelow, 0);
            endPole.group.add(endInsulator);
            
            // Store wire data
            const wireData = {
                group: wireGroup,
                mesh: wireMesh,
                startPole: startPole,
                endPole: endPole,
                sag: sag,
                offsetX: startOffsetX, // Track attachment position
                startInsulator: startInsulator,
                endInsulator: endInsulator,
                curve: curve // Store curve for bird positioning
            };
            
            this.wires.push(wireData);
        }
        
        // Spawn birds on wires based on music notes for 4 bars (melody - front row)
        // Note: spawnBirdsForBars is async but we don't await it - it's fire-and-forget
        this.spawnBirdsForBars(startPole, endPole, this.wires.slice(-this.settings.wire.numWires), true).catch(err => {
            console.error('Error spawning birds:', err);
        });
    }
    
    async spawnBirdsForBars(startPole, endPole, wireDataArray, isMelody) {
        // Each wire section represents 4 bars of music
        // Position birds along the wire: bar 0 = 0.0-0.25, bar 1 = 0.25-0.5, bar 2 = 0.5-0.75, bar 3 = 0.75-1.0
        
        if (!this.musicData) {
            console.warn('No music data loaded');
            return;
        }
        
        const musicPart = isMelody ? this.musicData.melody : this.musicData.bass;
        const musicLength = musicPart ? musicPart.length : 0;
        
        // Import music utils once
        const { noteToWireIndex } = await import('../utils/music-utils.js');
        
        for (let barOffset = 0; barOffset < 4; barOffset++) {
            // Get current bar index (wrap around if needed)
            const barIndex = musicLength > 0 ? (this.currentBarIndex + barOffset) % musicLength : 0;
            const barData = musicPart && musicPart[barIndex] ? musicPart[barIndex] : null;
            
            if (!barData || !barData.notes) continue;
            
            // Wire index 0-3 maps to wires left-to-right
            // In createWires, wires are created with i=1 to 4, so:
            // i=1 (leftmost) -> array[0] -> should map to note.wire 0 (highest pitch)
            // i=2 -> array[1] -> should map to note.wire 1
            // i=3 -> array[2] -> should map to note.wire 2
            // i=4 (rightmost) -> array[3] -> should map to note.wire 3 (lowest pitch)
            // So note.wire directly maps to array index
            
            barData.notes.forEach(note => {
                // Get wire index from note name - support multiple formats
                const noteName = note.note || note.noteName || note.wireName;
                if (!noteName) {
                    console.warn('Note missing note name:', note);
                    return;
                }
                
                // Use wire index if provided, otherwise calculate from note name
                const wireIndex = note.wire !== undefined ? note.wire : noteToWireIndex(noteName);
                
                if (wireIndex >= 0 && wireIndex < wireDataArray.length) {
                    const wireData = wireDataArray[wireIndex];
                    if (wireData) {
                        // Calculate final timing: bar position + note timing within bar
                        // Time flows Left to Right (t=0 is Past/Left, t=1 is Future/Right relative to the wire span)
                        // Since scene moves Left, the Left side (t=0) crosses center first (Earlier)
                        
                        // Bar 0 is first (Leftmost), Bar 3 is last (Rightmost)
                        const barStart = barOffset * 0.25; 
                        
                        // Note timing 0.0 is start of bar (Left), 1.0 is end of bar (Right)
                        const noteTimingInSection = note.timing * 0.25;
                        
                        const positionInSection = barStart + noteTimingInSection;
                        
                        // Clamp to ensure it stays on wire
                        const finalTiming = Math.max(0.05, Math.min(0.95, positionInSection));
                        
                        if (isMelody) {
                            this.spawnBirdOnWire(wireData, finalTiming, true);
                        } else {
                            this.spawnBirdOnWireSecond(wireData, finalTiming, true);
                        }
                    }
                }
            });
        }
    }
    
    spawnBirdOnWire(wireData, timing = null, isFromMusic = false) {
        // Create plane for bird sprite (200x200 pixels at 100% scale)
        const birdPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1)
        );
        
        // Scale to 200 units (representing 200 pixels at 100% scale)
        const scale = 200 * this.settings.bird.size;
        birdPlane.scale.set(scale, scale, 1);
        
        const material = new THREE.MeshBasicMaterial({
            map: this.birdTexture,
            transparent: true,
            alphaTest: 0.1, // For PNG transparency
            color: this.parseCSSColor(this.settings.bird.color) // Tint with accent color
        });
        
        // Randomly select one of 4 birds (4x1 grid in 800x200 PNG)
        // Each bird is 200x200 pixels
        const birdIndex = Math.floor(Math.random() * 4);
        const uOffset = birdIndex * 0.25; // 0, 0.25, 0.5, 0.75 (each bird is 1/4 of width)
        
        // Set UV mapping to select the bird section (800x200 PNG with four 200x200 birds)
        const uvs = birdPlane.geometry.attributes.uv.array;
        // Bottom-left corner
        uvs[0] = uOffset; 
        uvs[1] = 1;
        // Bottom-right corner
        uvs[2] = uOffset + 0.25; 
        uvs[3] = 1;
        // Top-left corner
        uvs[4] = uOffset; 
        uvs[5] = 0;
        // Top-right corner
        uvs[6] = uOffset + 0.25; 
        uvs[7] = 0;
        birdPlane.geometry.attributes.uv.needsUpdate = true;
        
        birdPlane.material = material;
        birdPlane.name = 'bird';
        
        // Birds face right (direction of travel)
        const facingLeft = false;
        if (facingLeft) {
            birdPlane.scale.x = -scale;
        }
        
        // Position bird on wire - feet 50px from bottom (25% of 200px height)
        // If timing is provided (from music), use it; otherwise random
        const t = timing !== null ? Math.max(0.05, Math.min(0.95, timing)) : (0.1 + Math.random() * 0.8);
        const point = wireData.curve.getPoint(t);
        // Feet are 50px from bottom of 200px image, so offset by 25% of height from center
        birdPlane.position.set(point.x, point.y + 0.25 * scale, point.z + 0.05);
        
        // Add bird as child of wire group to move with it
        wireData.group.add(birdPlane);
        
        const birdData = {
            group: birdPlane,
            material: material,
            perchWire: wireData,
            perchT: t,
            facingLeft: facingLeft,
            animOffset: Math.random() * Math.PI * 2, // Add animOffset for animation
            isFromMusic: isFromMusic,
            baseColor: this.parseCSSColor(this.settings.bird.color),
            isBlinking: false,
            hasPlayedNote: false, // Track if this bird has played its note
            wireIndex: this.getWireIndex(wireData), // Store which wire this bird is on
            isMelody: true // Front row is melody
        };
        
        this.birds.push(birdData);
        return birdData; // Return so caller can set noteFrequency
    }
    
    createWiresSecond(startPole, endPole) {
        const numWires = this.settings.wire.numWires; // 4 wires
        const crossarmWidth = this.settings.pole.crossarm.width;
        const wireSpacing = crossarmWidth / (numWires + 1); // Even spacing across crossarm
        
        for (let i = 1; i <= numWires; i++) {
            // Random sag for this specific wire (more variability)
            const sag = this.settings.wire.minSag + Math.random() * (this.settings.wire.maxSag - this.settings.wire.minSag);
            
            // Attachment points evenly spaced on crossarms (from left to right)
            const startOffsetX = -(crossarmWidth / 2) + i * wireSpacing;
            const endOffsetX = -(crossarmWidth / 2) + i * wireSpacing;
            
            // Get world positions accounting for pole rotation (lean)
            // Create temp vectors at attachment points
            const startLocalPos = new THREE.Vector3(startOffsetX, startPole.topY, 0);
            const endLocalPos = new THREE.Vector3(endOffsetX, endPole.topY, 0);
            
            // Transform by pole group rotation
            startLocalPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), startPole.group.rotation.z);
            endLocalPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), endPole.group.rotation.z);
            
            // Wire connects from crossarm of start pole to crossarm of end pole
            const startY = startLocalPos.y;
            const startX = startLocalPos.x;
            const endY = endLocalPos.y;
            const endX = endLocalPos.x;
            
            // Calculate distance between poles
            const distance = endPole.currentX - startPole.currentX;
            
            // Create curve points (relative to start pole position, accounting for rotation)
            const startPoint = new THREE.Vector3(startX, startY, 0);
            const endPoint = new THREE.Vector3(distance + endX, endY, 0);
            
            // Middle point sags down
            const midX = distance / 2 + (startX + endX) / 2;
            const midY = (startY + endY) / 2 - sag;
            const midPoint = new THREE.Vector3(midX, midY, 0);
            
            // Create smooth catenary-like curve
            const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
            
            // Create tube geometry for the wire with higher resolution for smoothness
            const geometry = new THREE.TubeGeometry(curve, 80, this.settings.wire.radius, 16, false);
            const material = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.wire.color)
            });
            const wireMesh = new THREE.Mesh(geometry, material);
            
            // Position wire group at start pole
            const wireGroup = new THREE.Group();
            wireGroup.position.copy(startPole.group.position);
            wireGroup.add(wireMesh);
            
            this.secondLayerGroup.add(wireGroup);
            
            // Create insulators (small spheres) at attachment points
            const insulatorMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.wire.color)
            });
            const insulatorGeometry = new THREE.SphereGeometry(this.settings.insulator.radius, 8, 6);
            
            // Start insulator on start pole's crossarm (local coordinates account for rotation)
            const startInsulator = new THREE.Mesh(insulatorGeometry, insulatorMaterial);
            startInsulator.position.set(startOffsetX, startPole.topY - this.settings.insulator.offsetBelow, 0);
            startPole.group.add(startInsulator);
            
            // End insulator on end pole's crossarm (local coordinates account for rotation)
            const endInsulator = new THREE.Mesh(insulatorGeometry, insulatorMaterial);
            endInsulator.position.set(endOffsetX, endPole.topY - this.settings.insulator.offsetBelow, 0);
            endPole.group.add(endInsulator);
            
            // Store wire data
            const wireData = {
                group: wireGroup,
                mesh: wireMesh,
                startPole: startPole,
                endPole: endPole,
                sag: sag,
                offsetX: startOffsetX, // Track attachment position
                startInsulator: startInsulator,
                endInsulator: endInsulator,
                curve: curve // Store curve for bird positioning
            };
            
            this.secondWires.push(wireData);
        }
        
        // Spawn birds on wires based on music notes for 4 bars (bass - back row)
        this.spawnBirdsForBars(startPole, endPole, this.secondWires.slice(-this.settings.wire.numWires), false);
    }

    getWireIndex(wireData) {
        if (!wireData) return -1;
        const numWires = this.settings.wire.numWires;
        const crossarmWidth = this.settings.pole.crossarm.width;
        const wireSpacing = crossarmWidth / (numWires + 1);
        
        // offsetX = -(crossarmWidth / 2) + (wireIndex + 1) * wireSpacing
        // (offsetX + crossarmWidth/2) / wireSpacing = wireIndex + 1
        const wireIndex = Math.round((wireData.offsetX + crossarmWidth / 2) / wireSpacing) - 1;
        return Math.max(0, Math.min(numWires - 1, wireIndex));
    }
    
    spawnBirdOnWireSecond(wireData, timing = null, isFromMusic = false) {
        // Create plane for bird sprite in second layer
        const birdPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1)
        );
        
        const scale = 200 * this.settings.bird.size;
        birdPlane.scale.set(scale, scale, 1);
        
        const material = new THREE.MeshBasicMaterial({
            map: this.birdTexture,
            transparent: true,
            alphaTest: 0.1, // For PNG transparency
            color: this.parseCSSColor(this.settings.bird.color) // Tint with accent color
        });
        
        // Randomly select one of 4 birds (4x1 grid in 800x200 PNG)
        // Each bird is 200x200 pixels
        const birdIndex = Math.floor(Math.random() * 4);
        const uOffset = birdIndex * 0.25; // 0, 0.25, 0.5, 0.75 (each bird is 1/4 of width)
        
        // Set UV mapping to select the bird section (800x200 PNG with four 200x200 birds)
        const uvs = birdPlane.geometry.attributes.uv.array;
        // Bottom-left corner
        uvs[0] = uOffset; 
        uvs[1] = 1;
        // Bottom-right corner
        uvs[2] = uOffset + 0.25; 
        uvs[3] = 1;
        // Top-left corner
        uvs[4] = uOffset; 
        uvs[5] = 0;
        // Top-right corner
        uvs[6] = uOffset + 0.25; 
        uvs[7] = 0;
        birdPlane.geometry.attributes.uv.needsUpdate = true;
        
        birdPlane.material = material;
        birdPlane.name = 'bird';
        
        // Birds face right (direction of travel)
        const facingLeft = false;
        if (facingLeft) {
            birdPlane.scale.x = -scale;
        }
        
        // Position bird on wire - feet 50px from bottom (25% of 200px height)
        // If timing is provided (from music), use it; otherwise random
        const t = timing !== null ? Math.max(0.05, Math.min(0.95, timing)) : (0.1 + Math.random() * 0.8);
        const point = wireData.curve.getPoint(t);
        // Feet are 50px from bottom of 200px image, so offset by 25% of height from center
        birdPlane.position.set(point.x, point.y + 0.25 * scale, point.z + 0.05);
        
        // Add bird as child of wire group to move with it
        wireData.group.add(birdPlane);
        
        const birdData = {
            group: birdPlane,
            material: material,
            perchWire: wireData,
            perchT: t,
            facingLeft: facingLeft,
            animOffset: Math.random() * Math.PI * 2, // Add animOffset for animation
            isFromMusic: isFromMusic,
            baseColor: this.parseCSSColor(this.settings.bird.color),
            isBlinking: false,
            hasPlayedNote: false, // Track if this bird has played its note
            wireIndex: this.getWireIndex(wireData), // Store which wire this bird is on
            isMelody: false // Back row is bass
        };
        
        this.secondBirds.push(birdData);
        return birdData; // Return so caller can set noteFrequency
    }
    
    parseCSSColor(cssValue) {
        if (typeof cssValue === 'object' && cssValue !== null) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const themeColor = cssValue[currentTheme];
            
            if (themeColor) {
                return this.parseCSSColor(themeColor);
            }
            return this.parseCSSColor(cssValue.light || cssValue.dark || '#888888');
        }
        
        if (cssValue.startsWith('var(--')) {
            const varName = cssValue.match(/var\((--\w+(?:-\w+)*)\)/)?.[1];
            if (!varName) return new THREE.Color('#888888'); // Fallback
            
            const computedValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            
            if (computedValue && computedValue !== '') {
                try {
                    return new THREE.Color(computedValue);
                } catch (e) {
                    // Invalid color, will fall through
                }
            }
        }
        
        try {
            return new THREE.Color(cssValue);
        } catch (e) {
            return new THREE.Color('#888888');
        }
    }
    
    animate() {
        if (this.isPaused) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        const deltaTime = 0.016; // approx 60fps
        this.time += deltaTime;
        
        // Audio reactivity - only process if music is actually playing
        let audioEnergy = 0;
        let audioData = null;
        const isMusicPlaying = window.musicIsPlaying || false;
        
        if (window.audioAnalyser && isMusicPlaying) {
            const bufferLength = window.audioAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            window.audioAnalyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i=0; i<bufferLength; i++) sum += dataArray[i];
            const avg = sum / bufferLength;
            const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
            
            if (avg > 10) {
                audioEnergy = (avg / 255) * volume;
                audioData = dataArray;
            }
        }
        
        // Reset to null if music not playing
        this.currentAudioEnergy = isMusicPlaying ? audioEnergy : 0;
        this.currentAudioData = isMusicPlaying ? audioData : null;
        
        this.updateScene(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateScene(deltaTime) {
        const speed = this.settings.scene.moveSpeed;
        
        // Move first layer poles leftward (camera stays fixed)
        this.poles.forEach(pole => {
            pole.currentX += speed; // speed is negative, so this moves left
            pole.group.position.x = pole.currentX;
        });
        
        // Move second layer poles leftward
        this.secondPoles.forEach(pole => {
            pole.currentX += speed; // speed is negative, so this moves left
            pole.group.position.x = pole.currentX;
        });
        
        // Move first layer wires with their start pole
        this.wires.forEach(wire => {
            wire.group.position.x = wire.startPole.group.position.x;
        });
        
        // Move second layer wires with their start pole
        this.secondWires.forEach(wire => {
            wire.group.position.x = wire.startPole.group.position.x;
        });

        // Update Wires with Audio Waves (Calculated BEFORE birds so birds can follow)
        const updateWireWave = (wire) => {
             // Use this.currentAudioData directly
             const currentAudioData = this.currentAudioData;
             if (!wire.mesh || !wire.curve) return;
             
             // Lazy init original positions
             if (!wire.mesh.geometry.userData.originalPositions) {
                 wire.mesh.geometry.userData.originalPositions = wire.mesh.geometry.attributes.position.array.slice();
             }
             
             const positions = wire.mesh.geometry.attributes.position;
             const originalPositions = wire.mesh.geometry.userData.originalPositions;
             
             // If no audio data, reset wire to original positions
             if (!currentAudioData) {
                 // Reset to flat wire immediately
                 for (let i = 0; i < originalPositions.length; i++) {
                     positions.array[i] = originalPositions[i];
                 }
                 positions.needsUpdate = true;
                 wire.currentWaveFreq = 0;
                 return;
             }
             
             // Get frequency for this wire
             const isBass = this.secondWires.includes(wire);
             const wireIndex = isBass ? this.secondWires.indexOf(wire) % 4 : this.wires.indexOf(wire) % 4;
             
             // Map to frequency bin
             const binIndex = isBass ? wireIndex : wireIndex + 10;
             const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
             const freq = (currentAudioData[binIndex % currentAudioData.length] / 255) * volume;
             
             // Store current wave params on the wire for birds to use
             wire.currentWaveFreq = freq;
             wire.currentWaveTime = this.time;
             
             const tubularSegments = 80;
             const radialSegments = 16;
             
             // Iterate through each ring along the tube length
             for (let i = 0; i <= tubularSegments; i++) {
                 // t is 0..1 along the curve
                 const t = i / tubularSegments;
                 
                 // Damping: 0 at ends (0,1), 1 at center (0.5) using sine half-wave
                 const damping = Math.sin(t * Math.PI);

                 // Calculate wave offset for this entire ring
                 let waveY = 0;
                 if (freq > 0.1) {
                     // Sine wave that travels along the wire
                     waveY = Math.sin(t * 20 + this.time * 10) * freq * 0.5 * damping;
                 }
                 
                 // Apply this offset to all radial vertices in this ring
                 for (let j = 0; j <= radialSegments; j++) {
                     const index = (i * (radialSegments + 1) + j) * 3;
                     const ox = originalPositions[index];
                     const oy = originalPositions[index + 1];
                     const oz = originalPositions[index + 2];
                     
                     positions.array[index] = ox;
                     positions.array[index + 1] = oy + waveY;
                     positions.array[index + 2] = oz;
                 }
             }
             
             positions.needsUpdate = true;
        };
        
        // Apply to all visible wires
        this.wires.forEach(updateWireWave);
        this.secondWires.forEach(updateWireWave);
        
        // Animate first layer birds subtly and check centerpoint
        this.birds.forEach(bird => {
            // No vertical bobbing - birds stay fixed on wire
            
            // Head yaw oscillation
            bird.group.rotation.z = Math.sin(this.time * 1.5 + bird.animOffset) * 0.1; // Subtle rotation
            
            // Calculate base position from curve
            const point = bird.perchWire.curve.getPoint(bird.perchT);
            let waveY = 0;

            // Add wave offset if wire is moving (sync with wire geometry)
            if (bird.perchWire.currentWaveFreq > 0.1) {
                const t = bird.perchT;
                const damping = Math.sin(t * Math.PI);
                waveY = Math.sin(t * 20 + bird.perchWire.currentWaveTime * 10) * bird.perchWire.currentWaveFreq * 0.5 * damping;
            }

            const scale = Math.abs(bird.group.scale.x); // Get current scale magnitude
            // Position bird on wire + wave offset
            bird.group.position.set(point.x, point.y + waveY + 0.25 * scale, point.z + 0.05);
            
            // Check if bird is crossing centerpoint (x = 0)
            const wireWorldX = bird.perchWire.group.position.x;
            const birdWorldX = wireWorldX + point.x;
            
            // Check if bird is near centerpoint (within threshold)
            const centerThreshold = 1.0; // Distance threshold
            const isNearCenter = Math.abs(birdWorldX) < centerThreshold;
            
            // Dynamic color/scale based on music + center position
            const currentAudioData = this.currentAudioData;
            let musicIntensity = 0;
            
            if (currentAudioData && bird.isMelody) {
                 const binIndex = Math.floor((bird.wireIndex / 4) * (currentAudioData.length / 4));
                 const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
                 const freq = (currentAudioData[binIndex] / 255) * volume;
                 
                 // Map frequency to intensity (start at 0.2, max at 0.8)
                 musicIntensity = Math.max(0, (freq - 0.2) * 1.6);
                 musicIntensity = Math.min(1, musicIntensity);
            }

            // Center crossing effect (blink)
            let centerIntensity = 0;
            if (isNearCenter && bird.isFromMusic) {
                centerIntensity = Math.abs(Math.sin(this.time * 10));
            }
            
            const finalIntensity = Math.max(musicIntensity, centerIntensity);

            if (finalIntensity > 0.05) {
                if (!bird.isBlinking) {
                    bird.isBlinking = true;
                }
                
                // Lerp color based on intensity
                const redColor = new THREE.Color(1, 0, 0); // Red
                bird.material.color.lerpColors(bird.baseColor, redColor, finalIntensity);
                
                // Scale based on intensity
                const baseScale = 200 * this.settings.bird.size;
                const targetScale = baseScale * (1 + finalIntensity * 0.3); // Up to 1.3x scale
                bird.group.scale.set(bird.facingLeft ? -targetScale : targetScale, targetScale, 1);

            } else {
                if (bird.isBlinking) {
                    bird.isBlinking = false;
                }
                // Return to base color
                bird.material.color.copy(bird.baseColor);
                // Return to base scale
                const baseScale = 200 * this.settings.bird.size;
                bird.group.scale.set(bird.facingLeft ? -baseScale : baseScale, baseScale, 1);
            }
        });
        
        // Animate second layer birds subtly and check centerpoint
        this.secondBirds.forEach(bird => {
            bird.group.rotation.z = Math.sin(this.time * 1.5 + bird.animOffset) * 0.1; 
            
            // Calculate base position from curve
            const point = bird.perchWire.curve.getPoint(bird.perchT);
            let waveY = 0;

            // Add wave offset if wire is moving
            if (bird.perchWire.currentWaveFreq > 0.1) {
                const t = bird.perchT;
                const damping = Math.sin(t * Math.PI);
                waveY = Math.sin(t * 20 + bird.perchWire.currentWaveTime * 10) * bird.perchWire.currentWaveFreq * 0.5 * damping;
            }

            const scale = Math.abs(bird.group.scale.y); // Get current scale (y is always positive)
             // Position bird on wire + wave offset
            bird.group.position.set(point.x, point.y + waveY + 0.25 * scale, point.z + 0.05);

            const wireWorldX = bird.perchWire.group.position.x;
            const birdWorldX = wireWorldX + point.x;
            const centerThreshold = 1.0;
            const isNearCenter = Math.abs(birdWorldX) < centerThreshold;
            
            // Dynamic color/scale based on music + center position (Bass)
            let musicIntensity = 0;
            // Use this.currentAudioData directly
            const currentAudioData = this.currentAudioData;
            
            if (currentAudioData && !bird.isMelody) {
                 // Use lower frequency bins for bass birds
                 const binIndex = Math.floor((bird.wireIndex / 4) * 4); // First few bins
                 const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
                 const freq = (currentAudioData[binIndex] / 255) * volume;
                 
                 // Map frequency to intensity (start at 0.2, max at 0.8)
                 musicIntensity = Math.max(0, (freq - 0.2) * 1.6);
                 musicIntensity = Math.min(1, musicIntensity);
            }
            
            // Center crossing effect (blink)
            let centerIntensity = 0;
            if (isNearCenter && bird.isFromMusic) {
                centerIntensity = Math.abs(Math.sin(this.time * 10));
            }
            
            const finalIntensity = Math.max(musicIntensity, centerIntensity);
            
            if (finalIntensity > 0.05) {
                if (!bird.isBlinking) {
                    bird.isBlinking = true;
                }
                
                // Lerp color based on intensity
                const redColor = new THREE.Color(1, 0, 0); // Red
                bird.material.color.lerpColors(bird.baseColor, redColor, finalIntensity);
                
                 // Scale based on intensity
                const baseScale = 200 * this.settings.bird.size;
                const targetScale = baseScale * (1 + finalIntensity * 0.3); // Up to 1.3x scale
                bird.group.scale.set(bird.facingLeft ? -targetScale : targetScale, targetScale, 1);

            } else {
                if (bird.isBlinking) {
                    bird.isBlinking = false;
                }
                // Return to base color
                bird.material.color.copy(bird.baseColor);
                // Return to base scale
                const baseScale = 200 * this.settings.bird.size;
                bird.group.scale.set(bird.facingLeft ? -baseScale : baseScale, baseScale, 1);
            }
        });

        
        // Moon Beat Reaction
        if (this.moon && this.currentAudioData) {
            const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
            
            // Use mid-high frequency bins for snare/click detection (bins 20-30)
            let highFreqSum = 0;
            const startBin = 20;
            const endBin = 30;
            const binCount = endBin - startBin + 1;
            
            for (let i = startBin; i <= endBin && i < this.currentAudioData.length; i++) {
                highFreqSum += this.currentAudioData[i];
            }
            const highFreqEnergy = (highFreqSum / (binCount * 255)) * volume;
            
            // Calculate moon scale pulse (1.0 to 1.5 max) - More exaggerated
            const targetScale = 1.0 + (highFreqEnergy * 0.5);
            
            // Direct application - no smoothing for instant reaction
            this.moon.mesh.scale.set(targetScale, targetScale, 1);
            this.moon.border.scale.set(targetScale, targetScale, 1);
        } else {
            // No audio - reset moon scale to base immediately
            this.moon.mesh.scale.set(1.0, 1.0, 1);
            this.moon.border.scale.set(1.0, 1.0, 1);
        }
        
        // Cull first layer leftmost poles that moved past cullX (left side)
        this.poles = this.poles.filter((pole) => {
            if (pole.currentX < this.settings.scene.cullX) {
                this.scene.remove(pole.group);
                if (pole.poleMesh) {
                    pole.poleMesh.geometry.dispose();
                    pole.poleMesh.material.dispose();
                }
                if (pole.crossarmMesh) {
                    pole.crossarmMesh.geometry.dispose();
                    pole.crossarmMesh.material.dispose();
                }
                if (pole.transformerMesh) {
                    pole.transformerMesh.geometry.dispose();
                    pole.transformerMesh.material.dispose();
                }
                
                // Remove associated wires - find wires connected to this pole
                this.wires = this.wires.filter(wire => {
                    if (wire.startPole === pole || wire.endPole === pole) {
                        this.scene.remove(wire.group);
                        if (wire.mesh) {
                            wire.mesh.geometry.dispose();
                            wire.mesh.material.dispose();
                        }
                        if (wire.startInsulator) {
                            wire.startInsulator.geometry.dispose();
                            wire.startInsulator.material.dispose();
                        }
                        if (wire.endInsulator) {
                            wire.endInsulator.geometry.dispose();
                            wire.endInsulator.material.dispose();
                        }
                        // Birds on this wire are children, so they're removed with the group
                        // Remove from birds array
                        this.birds = this.birds.filter(b => b.perchWire !== wire);
                        return false;
                    }
                    return true;
                });
                
                // Remove birds perched on this pole (if any fallback, though unlikely now)
                this.birds = this.birds.filter(bird => {
                    if (bird.perchPole === pole) {
                        this.removeBird(bird);
                        return false;
                    }
                    return true;
                });
                
                return false;
            }
            return true;
        });
        
        // Cull second layer leftmost poles that moved past cullX (left side)
        this.secondPoles = this.secondPoles.filter((pole) => {
            if (pole.currentX < this.settings.scene.cullX) {
                this.secondLayerGroup.remove(pole.group);
                if (pole.poleMesh) {
                    pole.poleMesh.geometry.dispose();
                    pole.poleMesh.material.dispose();
                }
                if (pole.crossarmMesh) {
                    pole.crossarmMesh.geometry.dispose();
                    pole.crossarmMesh.material.dispose();
                }
                if (pole.transformerMesh) {
                    pole.transformerMesh.geometry.dispose();
                    pole.transformerMesh.material.dispose();
                }
                
                // Remove associated wires - find wires connected to this pole
                this.secondWires = this.secondWires.filter(wire => {
                    if (wire.startPole === pole || wire.endPole === pole) {
                        this.secondLayerGroup.remove(wire.group);
                        if (wire.mesh) {
                            wire.mesh.geometry.dispose();
                            wire.mesh.material.dispose();
                        }
                        if (wire.startInsulator) {
                            wire.startInsulator.geometry.dispose();
                            wire.startInsulator.material.dispose();
                        }
                        if (wire.endInsulator) {
                            wire.endInsulator.geometry.dispose();
                            wire.endInsulator.material.dispose();
                        }
                        // Birds on this wire are children, so they're removed with the group
                        // Remove from secondBirds array
                        this.secondBirds = this.secondBirds.filter(b => b.perchWire !== wire);
                        return false;
                    }
                    return true;
                });
                
                // Remove birds perched on this pole (if any fallback, though unlikely now)
                this.secondBirds = this.secondBirds.filter(bird => {
                    if (bird.perchPole === pole) {
                        this.removeBirdSecond(bird);
                        return false;
                    }
                    return true;
                });
                
                return false;
            }
            return true;
        });
        
        // Cull first layer stray birds if any (though unlikely)
        this.birds = this.birds.filter(bird => {
            if (bird.group.position.x < this.settings.scene.cullX - 10) {
                this.removeBird(bird);
                return false;
            }
            return true;
        });
        
        // Cull second layer stray birds if any (though unlikely)
        this.secondBirds = this.secondBirds.filter(bird => {
            if (bird.group.position.x < this.settings.scene.cullX - 10) {
                this.removeBirdSecond(bird);
                return false;
            }
            return true;
        });
        
        // Spawn new rightmost pole for first layer if rightmost has moved far enough left
        // Find rightmost pole (highest X value)
        const rightmostPole = this.poles.length > 0 ? this.poles.reduce((max, pole) => pole.currentX > max.currentX ? pole : max) : null;
        const shouldSpawn = !rightmostPole || (rightmostPole.currentX <= this.settings.scene.spawnX - this.settings.scene.poleSpacing);
        
        if (shouldSpawn && this.poles.length < this.settings.scene.maxPoles) {
            this.spawnPole();
        }
        
        // Spawn new rightmost pole for second layer if rightmost has moved far enough left
        const secondRightmostPole = this.secondPoles.length > 0 ? this.secondPoles.reduce((max, pole) => pole.currentX > max.currentX ? pole : max) : null;
        const shouldSpawnSecond = !secondRightmostPole || (secondRightmostPole.currentX <= this.settings.scene.spawnX - this.settings.scene.poleSpacing);
        
        if (shouldSpawnSecond && this.secondPoles.length < this.settings.scene.maxPoles) {
            this.spawnPoleSecond();
        }
    }
    
    removeBird(bird) {
        // If bird is child of a group, remove from parent first
        if (bird.group.parent) {
            bird.group.parent.remove(bird.group);
        }
        this.scene.remove(bird.group);
        bird.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    
    removeBirdSecond(bird) {
        // If bird is child of a group, remove from parent first
        if (bird.group.parent) {
            bird.group.parent.remove(bird.group);
        }
        this.secondLayerGroup.remove(bird.group);
        bird.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
    
    onResize() {
        if (!this.container || !this.renderer) return;
        
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        this.renderer.render(this.scene, this.camera);
        
        this.lastWidth = width;
        this.lastHeight = height;
    }
    
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('themechange', this.handleThemeChange);
        
        // First layer cleanup
        this.poles.forEach(pole => {
            this.scene.remove(pole.group);
            if (pole.poleMesh) {
                pole.poleMesh.geometry.dispose();
                pole.poleMesh.material.dispose();
            }
            if (pole.crossarmMesh) {
                pole.crossarmMesh.geometry.dispose();
                pole.crossarmMesh.material.dispose();
            }
            if (pole.transformerMesh) {
                pole.transformerMesh.geometry.dispose();
                pole.transformerMesh.material.dispose();
            }
        });
        
        this.wires.forEach(wire => {
            this.scene.remove(wire.group);
            if (wire.mesh) {
                wire.mesh.geometry.dispose();
                wire.mesh.material.dispose();
            }
            if (wire.startInsulator) {
                wire.startInsulator.geometry.dispose();
                wire.startInsulator.material.dispose();
            }
            if (wire.endInsulator) {
                wire.endInsulator.geometry.dispose();
                wire.endInsulator.material.dispose();
            }
        });
        
        this.birds.forEach(bird => {
            this.removeBird(bird);
        });
        
        // Second layer cleanup
        this.secondPoles.forEach(pole => {
            this.secondLayerGroup.remove(pole.group);
            if (pole.poleMesh) {
                pole.poleMesh.geometry.dispose();
                pole.poleMesh.material.dispose();
            }
            if (pole.crossarmMesh) {
                pole.crossarmMesh.geometry.dispose();
                pole.crossarmMesh.material.dispose();
            }
            if (pole.transformerMesh) {
                pole.transformerMesh.geometry.dispose();
                pole.transformerMesh.material.dispose();
            }
        });
        
        this.secondWires.forEach(wire => {
            this.secondLayerGroup.remove(wire.group);
            if (wire.mesh) {
                wire.mesh.geometry.dispose();
                wire.mesh.material.dispose();
            }
            if (wire.startInsulator) {
                wire.startInsulator.geometry.dispose();
                wire.startInsulator.material.dispose();
            }
            if (wire.endInsulator) {
                wire.endInsulator.geometry.dispose();
                wire.endInsulator.material.dispose();
            }
        });
        
        this.secondBirds.forEach(bird => {
            this.removeBirdSecond(bird);
        });
        
        this.poles = [];
        this.wires = [];
        this.birds = [];
        this.secondPoles = [];
        this.secondWires = [];
        this.secondBirds = [];
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        if (this.secondLayerGroup) {
            this.scene.remove(this.secondLayerGroup);
            this.secondLayerGroup = null;
        }
        
        // Cleanup moon
        if (this.moon) {
            if (this.moon.mesh) {
                this.scene.remove(this.moon.mesh);
                this.moon.mesh.geometry.dispose();
                this.moon.mesh.material.dispose();
            }
            if (this.moon.border) {
                this.scene.remove(this.moon.border);
                this.moon.border.geometry.dispose();
                this.moon.border.material.dispose();
            }
            this.moon = null;
        }
    }

    createPoleAtSecond(x) {
        const group = new THREE.Group();
        
        group.position.set(x, this.settings.pole.groundY, 0);
        
        // Random pole height
        const height = this.settings.pole.baseHeight + (Math.random() - 0.5) * 2 * this.settings.pole.heightVariation;
        
        // Pole cylinder
        const poleGeometry = new THREE.CylinderGeometry(
            this.settings.pole.radius,
            this.settings.pole.radius,
            height,
            8
        );
        const poleMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
        poleMesh.position.y = height / 2;
        group.add(poleMesh);
        
        // Random crossarm offset
        const crossarmOffsetY = this.settings.pole.crossarm.minOffsetY + Math.random() * (this.settings.pole.crossarm.maxOffsetY - this.settings.pole.crossarm.minOffsetY);
        
        // Crossarm at variable offset from top
        const crossarmGeometry = new THREE.BoxGeometry(
            this.settings.pole.crossarm.width,
            this.settings.pole.crossarm.height,
            this.settings.pole.crossarm.depth
        );
        const crossarmMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const crossarmMesh = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
        crossarmMesh.position.set(0, height - crossarmOffsetY, 0);
        group.add(crossarmMesh);
        
        // Occasional transformer (cylinder near top)
        let transformerMesh = null;
        if (Math.random() < this.settings.pole.transformer.chance) {
            const transformerGeometry = new THREE.CylinderGeometry(
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.height,
                12
            );
            const transformerMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.pole.color)
            });
            transformerMesh = new THREE.Mesh(transformerGeometry, transformerMaterial);
            transformerMesh.position.y = height - 0.3; // Near top, below crossarm
            transformerMesh.rotation.z = Math.PI / 4; // Slight rotation for realism
            group.add(transformerMesh);
        }
        
        this.secondLayerGroup.add(group);
        
        const topY = height - crossarmOffsetY + this.settings.pole.crossarm.height / 2;
        const poleData = {
            group: group,
            poleMesh: poleMesh,
            crossarmMesh: crossarmMesh,
            transformerMesh: transformerMesh,
            currentX: x,
            height: height,
            topY: topY,
            baseY: 0,
            crossarmHalfWidth: this.settings.pole.crossarm.width / 2,
            crossarmOffsetY: crossarmOffsetY
        };
        
        // Add random leaning to the entire pole structure
        const leanAngle = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1 radians
        group.rotation.z = leanAngle;
        
        this.secondPoles.push(poleData);
    }

    spawnInitialPolesSecond() {
        // Create initial poles to have some scene in view
        const numInitialPoles = 3;
        // Start from leftmost position so array is ordered left-to-right [left, middle, right]
        let currentX = this.settings.scene.spawnX - (this.settings.scene.poleSpacing * (numInitialPoles - 1));
        
        // Save current bar index (front row has already set it)
        const savedBarIndex = this.currentBarIndex;
        
        // Reset to 0 to match front row initialization sequence
        this.currentBarIndex = 0;
        
        for (let i = 0; i < numInitialPoles; i++) {
            this.createPoleAtSecond(currentX);
            currentX += this.settings.scene.poleSpacing; // Move right (increase X)
        }
        
        // Create wires between initial poles (bass uses same bar index as melody)
        // Match the bar index sequence used by front row
        // Poles are ordered left to right in array (poles[0] is leftmost, poles[length-1] is rightmost)
        for (let i = 1; i < this.secondPoles.length; i++) {
            // Use bar index (i-1)*4 (first span = bars 0-3, second = bars 4-7, etc.)
            this.currentBarIndex = (i - 1) * 4;
            this.createWiresSecond(this.secondPoles[i - 1], this.secondPoles[i]); // left pole, right pole
        }
        
        // Restore the bar index to match front row
        this.currentBarIndex = savedBarIndex;
    }

    spawnPoleSecond() {
        const group = new THREE.Group();
        
        // Always spawn at the same left position
        const x = this.settings.scene.spawnX;
        
        group.position.set(x, this.settings.pole.groundY, 0);
        
        // Random pole height
        const height = this.settings.pole.baseHeight + (Math.random() - 0.5) * 2 * this.settings.pole.heightVariation;
        
        // Pole cylinder
        const poleGeometry = new THREE.CylinderGeometry(
            this.settings.pole.radius,
            this.settings.pole.radius,
            height,
            8
        );
        const poleMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
        poleMesh.position.y = height / 2;
        group.add(poleMesh);
        
        // Random crossarm offset
        const crossarmOffsetY = this.settings.pole.crossarm.minOffsetY + Math.random() * (this.settings.pole.crossarm.maxOffsetY - this.settings.pole.crossarm.minOffsetY);
        
        // Crossarm at variable offset from top
        const crossarmGeometry = new THREE.BoxGeometry(
            this.settings.pole.crossarm.width,
            this.settings.pole.crossarm.height,
            this.settings.pole.crossarm.depth
        );
        const crossarmMaterial = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.pole.color)
        });
        const crossarmMesh = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
        crossarmMesh.position.set(0, height - crossarmOffsetY, 0);
        group.add(crossarmMesh);
        
        // Occasional transformer (cylinder near top)
        let transformerMesh = null;
        if (Math.random() < this.settings.pole.transformer.chance) {
            const transformerGeometry = new THREE.CylinderGeometry(
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.radius,
                this.settings.pole.transformer.height,
                12
            );
            const transformerMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.pole.color)
            });
            transformerMesh = new THREE.Mesh(transformerGeometry, transformerMaterial);
            transformerMesh.position.y = height - 0.3; // Near top, below crossarm
            transformerMesh.rotation.z = Math.PI / 4; // Slight rotation for realism
            group.add(transformerMesh);
        }
        
        this.secondLayerGroup.add(group);
        
        const topY = height - crossarmOffsetY + this.settings.pole.crossarm.height / 2;
        const poleData = {
            group: group,
            poleMesh: poleMesh,
            crossarmMesh: crossarmMesh,
            transformerMesh: transformerMesh,
            currentX: x,
            height: height,
            topY: topY,
            baseY: 0,
            crossarmHalfWidth: this.settings.pole.crossarm.width / 2,
            crossarmOffsetY: crossarmOffsetY
        };
        
        // Add random leaning to the entire pole structure
        const leanAngle = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1 radians
        group.rotation.z = leanAngle;
        
        // Push new pole to end (newest on right, since we're moving left)
        this.secondPoles.push(poleData);
        
        // Create wires to the previous pole (left) if exists
        // Bar index is shared with front row, so we don't increment here
        if (this.secondPoles.length > 1) {
            const rightPole = this.secondPoles[this.secondPoles.length - 1]; // Newest (rightmost)
            const leftPole = this.secondPoles[this.secondPoles.length - 2]; // Previous one (to the left)
            this.createWiresSecond(leftPole, rightPole);
        }
    }
}
