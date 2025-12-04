/**
 * Cell Game Visualization - Fresh Start
 * A single cell with an organic blob membrane and an interactive nucleus
 * Features: draggable nucleus, blob-based membrane with physics interaction
 */

import * as THREE from 'three';

/**
 * Settings for the Cell visualization
 */
export const CELL_SETTINGS = {
    cell: {
        nucleusRadius: 2.5,
        membraneRadius: 7,
        nucleusColor: 'var(--color-accent)',
        membraneColor: 'var(--color-accent)',
        lineWidth: 1,  // Increased from 2.5
        blobCount: 24,  // Reduced from 24
        blobRadius: 0.1,  // Radius of each blob point
        showBlobPoints: false,  // Hide visual indicators of blob positions
        wallMargin: 0.15, // Very small gap between nucleus surface and membrane
    },
    membrane: {
        blobMass: 0.8,
        damping: 0.92,  // Increased from 0.88 - preserve momentum longer for ripples
        springStrength: 0.01,  // Reduced from 0.03 - blobs deform even more easily
        springDamping: 0.02,  // Reduced from 0.15 - allow more movement
        stiffness: 0.05,  // Increased from 0.25 - stronger blob-to-blob connections for ripple propagation
        maxDeformation: 10.0, // Increased from 3.0 - allow more dramatic stretch
        spinSpeed: 0.03, // Constant rotation speed of the membrane - increased to overcome damping
        undulationAmount: 0.3, // Amount of undulation offset - reduced even more for subtler waves
        undulationFrequency: 1.0, // Creates many peaks and valleys around the perimeter
    },
    physics: {
        mass: 1,
        drag: 0.92,  // Reduced from 0.90 - allow more momentum
        gravity: new THREE.Vector2(0, 0),  // No gravity!
        centerSpring: 0.08,  // Spring force pulling ghost nucleus back to center
        centerDamping: 0.85,  // Damping when returning to center
    },
    camera: {
        fov: 40,
        positionZ: 40,  // Increased from 25 to pan camera back
    },
    background: {
        color: 'var(--color-bg-secondary)',
    }
};

// Debug settings - toggle visibility of debug elements
export const DEBUG_SETTINGS = {
    showDragTarget: false,  // Show cyan wireframe for drag target
    showGhostNucleus: false,  // Show magenta wireframe for ghost nucleus
};

/**
 * Prey class - Small cells that move across the screen and can be consumed
 */
class Prey {
    constructor(id, position = new THREE.Vector2(0, 0), velocity = new THREE.Vector2(0, 0), settings = CELL_SETTINGS, radius = 0.8) {
        this.id = id;
        this.position = new THREE.Vector2().copy(position);
        this.velocity = new THREE.Vector2().copy(velocity);
        this.settings = settings;
        this.radius = radius;
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        // Create a small circle for prey
        const preyGeom = new THREE.CircleGeometry(this.radius, 32);
        
        // Get border color from CSS
        let borderColor = 0xFFAA00; // Default orange fallback
        const borderCSSValue = getComputedStyle(document.documentElement).getPropertyValue('--color-border');
        if (borderCSSValue) {
            borderColor = new THREE.Color(borderCSSValue.trim());
        }
        
        const preyMat = new THREE.MeshBasicMaterial({
            color: borderColor,  // Use app's border color
            transparent: true,
            opacity: 0.8,
        });
        this.mesh = new THREE.Mesh(preyGeom, preyMat);
        this.mesh.position.z = 0.05; // Slightly behind nucleus
    }
    
    update() {
        // Move prey
        this.position.add(this.velocity);
        
        // Update mesh position
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.position.y, 0.05);
        }
    }
    
    getMesh() {
        return this.mesh;
    }
    
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
        }
    }
}

/**
 * Nucleus class - Encapsulates a single nucleus with physics and visualization
 */
class Nucleus {
    constructor(id, position = new THREE.Vector2(0, 0), settings = CELL_SETTINGS, radius = null) {
        this.id = id;
        this.settings = settings;
        this.radius = radius || settings.cell.nucleusRadius; // Allow custom radius per nucleus
        
        // Physics properties
        this.ghostPosition = new THREE.Vector2().copy(position);
        this.visualPosition = new THREE.Vector2().copy(position);
        this.velocity = new THREE.Vector2(0, 0);
        this.visualVelocity = new THREE.Vector2(0, 0);
        this.currentScale = 1.0; // Track dynamic scale for collisions
        
        // Interaction
        this.dragTargetPosition = new THREE.Vector2().copy(position);
        this.isBeingDragged = false;
        this.dragOffset = new THREE.Vector2(0, 0);
        
        // Visual meshes
        this.visualMesh = null;
        this.ghostMesh = null;
        this.dragTargetMesh = null;
        
        // Color tween properties
        this.colorTweenProgress = 0; // 0 to 1
        this.colorTweenDuration = 60; // frames
        this.isNewNucleus = false; // Flag for red tween
        
        this.createMeshes();
    }
    
    createMeshes() {
        // Visual nucleus (filled circle)
        const nucleusGeom = new THREE.CircleGeometry(this.radius, 64);
        const nucleusMat = new THREE.MeshBasicMaterial({
            color: this.settings.cell.nucleusColor.startsWith('var(') 
                ? new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(this.settings.cell.nucleusColor.replace('var(', '').replace(')', '').trim()))
                : new THREE.Color(this.settings.cell.nucleusColor)
        });
        this.visualMesh = new THREE.Mesh(nucleusGeom, nucleusMat);
        this.visualMesh.position.z = 0.1;
        
        // Ghost nucleus (outline, for testing)
        const ghostNucleusGeom = new THREE.CircleGeometry(this.radius, 64);
        const ghostNucleusMat = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,  // Magenta for visibility
            wireframe: true,
            transparent: true,
            opacity: 0.6,
        });
        this.ghostMesh = new THREE.Mesh(ghostNucleusGeom, ghostNucleusMat);
        this.ghostMesh.position.z = 0.15;
        this.ghostMesh.visible = DEBUG_SETTINGS.showGhostNucleus;
        
        // Drag target mesh (for testing)
        const dragTargetGeom = new THREE.CircleGeometry(this.radius, 64);
        const dragTargetMat = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,  // Cyan for visibility
            wireframe: true,
            transparent: true,
            opacity: 0.4,
        });
        this.dragTargetMesh = new THREE.Mesh(dragTargetGeom, dragTargetMat);
        this.dragTargetMesh.position.z = 0.12;
        this.dragTargetMesh.visible = DEBUG_SETTINGS.showDragTarget;
    }
    
    updateMeshPositions() {
        if (this.visualMesh) this.visualMesh.position.set(this.visualPosition.x, this.visualPosition.y, 0.1);
        if (this.ghostMesh) this.ghostMesh.position.set(this.ghostPosition.x, this.ghostPosition.y, 0.15);
        if (this.dragTargetMesh) this.dragTargetMesh.position.set(this.dragTargetPosition.x, this.dragTargetPosition.y, 0.12);
    }
    
    getMeshes() {
        return [this.visualMesh, this.ghostMesh, this.dragTargetMesh];
    }
    
    dispose() {
        for (const mesh of [this.visualMesh, this.ghostMesh, this.dragTargetMesh]) {
            if (mesh) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
            }
        }
    }
}

export class Cell {
    constructor(container, settings = CELL_SETTINGS) {
        this.container = container;
        this.settings = settings;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.cellGroup = null;
        this.nuclei = [];  // Array of nucleus objects
        this.membrane = null;
        this.membraneBlobs = [];  // Individual blob particles
        this.blobPoints = []; // Visual representations of blob points
        this.membranePositions = null; // Buffer to store membrane positions
        
        this.debug = DEBUG_SETTINGS;  // Add reference to debug settings
        this.animationId = null;
        this.time = 0;
        this.isPaused = false;
        
        // Cell membrane center (stationary)
        this.cellPosition = new THREE.Vector2(0, 0);
        
        // Prey system
        this.prey = [];  // Array of prey objects
        this.preyIdCounter = 0;
        this.preySpawnRate = 0.002;  // Spawn probability per frame - reduced to 10% of original
        this.preyMinRadius = 0.8;  // Increased from 0.5
        this.preyMaxRadius = 1.8;  // Increased from 1.2
        
        // Camera zoom tracking
        this.baselineNucleusRadius = 2.5; // Initial nucleus size for baseline zoom
        this.cameraZoomProgress = 0; // For smooth zoom transitions
        this.cameraZoomDuration = 60; // Frames for zoom tween
        this.targetCameraZoom = this.settings.camera.positionZ;
        
        // Mouse interaction
        this.mouse = new THREE.Vector2(0, 0);
        this.draggedNucleus = null;  // Track which nucleus is being dragged
        this.draggedBlob = null; // Track which blob is being dragged
        this.blobDragOffset = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();

        this.init();
    }

    parseCSSColor(cssValue) {
        if (cssValue.startsWith('var(')) {
            const varName = cssValue.replace('var(', '').replace(')', '').trim();
            const computedValue = getComputedStyle(document.documentElement).getPropertyValue(varName);
            if (computedValue) {
                return new THREE.Color(computedValue.trim());
            }
        }
        return new THREE.Color(cssValue);
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'cell-game-canvas';
        this.container.appendChild(this.canvas);

        const rect = this.container.getBoundingClientRect();
        
        this.scene = new THREE.Scene();
        this.scene.background = this.parseCSSColor(this.settings.background.color);

        this.camera = new THREE.PerspectiveCamera(
            this.settings.camera.fov,
            rect.width / rect.height,
            0.1,
            1000
        );
        this.camera.position.z = this.settings.camera.positionZ;

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true, 
            antialias: true 
        });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Ensure container also has touch-action: none
        this.container.style.touchAction = 'none';
        this.canvas.style.touchAction = 'none';

        // Create the cell
        this.createCell();

        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('themechange', () => this.onThemeChange());
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        
        // Touch event listeners for mobile support
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false }); // Add touchcancel handler
        
        // Prevent page swipe/scroll when dragging on the canvas
        document.addEventListener('touchmove', (e) => {
            // Get the touch position to see if it's on the canvas
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const isOnCanvas = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                                  touch.clientY >= rect.top && touch.clientY <= rect.bottom;
                
                const isDragging = this.draggedNucleus || this.draggedBlob;
                
                // Prevent default if dragging anywhere on the canvas area or if we have drag targets
                if ((isOnCanvas && isDragging) || isDragging) {
                    e.preventDefault();
                }
            }
        }, { passive: false });
        
        // Also prevent body scroll during any touch on the canvas
        this.canvas.addEventListener('touchstart', (e) => {
            document.body.style.overflow = 'hidden';
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            document.body.style.overflow = '';
        });

        this.animate();
    }

    createCell() {
        this.cellGroup = new THREE.Group();

        // Create nuclei
        this.nuclei = [];
        
        // Single nucleus - Center
        const nucleus1 = new Nucleus(0, new THREE.Vector2(0, 0), this.settings, 2.5);
        this.nuclei.push(nucleus1);
        
        // Add all nucleus meshes to cellGroup
        for (const nucleus of this.nuclei) {
            for (const mesh of nucleus.getMeshes()) {
                this.cellGroup.add(mesh);
            }
        }

        // Create membrane blobs
        this.createMembraneBlobs();

        this.scene.add(this.cellGroup);
    }

    createMembraneBlobs() {
        const count = this.settings.cell.blobCount;
        const radius = this.settings.cell.membraneRadius;

        this.membraneBlobs = [];
        this.blobPoints = []; // Clear previous blob points

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            this.membraneBlobs.push({
                current: new THREE.Vector2(x, y),
                previous: new THREE.Vector2(x, y),
                baseAngle: angle,
                baseRadius: radius,
                mass: this.settings.membrane.blobMass,
                velocity: new THREE.Vector2(0, 0),
                tangentialVelocity: new THREE.Vector2(0, 0), // New tangential velocity
            });

            // Create a visual representation for each blob point (if enabled)
            if (this.settings.cell.showBlobPoints) {
                const blobPointGeom = new THREE.CircleGeometry(this.settings.cell.blobRadius, 32);
                const blobPointMat = new THREE.MeshBasicMaterial({
                    color: this.parseCSSColor(this.settings.cell.membraneColor),
                    transparent: true,
                    opacity: 0.7,
                });
                const blobPointMesh = new THREE.Mesh(blobPointGeom, blobPointMat);
                blobPointMesh.position.set(x, y, 0.05); // Position slightly above membrane
                this.blobPoints.push(blobPointMesh);
                this.cellGroup.add(blobPointMesh); // Add to cellGroup
            }
        }

        // Create the membrane geometry once
        this.createMembraneGeometryOnce();
    }

    createMembraneGeometryOnce() {
        // Pre-calculate all points for the membrane curve
        const points = [];
        const blobs = this.membraneBlobs;
        const count = blobs.length;
        const segmentsPerBlob = 8;

        for (let i = 0; i < count; i++) {
            const p0 = blobs[(i - 1 + count) % count].current;
            const p1 = blobs[i].current;
            const p2 = blobs[(i + 1) % count].current;
            const p3 = blobs[(i + 2) % count].current;

            points.push(new THREE.Vector3(p1.x, p1.y, 0));

            for (let t = 1; t < segmentsPerBlob; t++) {
                const tNorm = t / segmentsPerBlob;
                const pt = this.catmullRom(p0, p1, p2, p3, tNorm);
                points.push(new THREE.Vector3(pt.x, pt.y, 0));
            }
        }

        // Create a curve from the points
        const curve = new THREE.CatmullRomCurve3(points);
        curve.closed = true;

        // Use TubeGeometry for thick, renderable lines
        const tubeGeom = new THREE.TubeGeometry(
            curve,
            points.length * 2,  // tubular segments
            this.settings.cell.lineWidth / 20,  // radius (scale down from pixel width)
            8,  // radial segments
            true  // closed
        );

        const mat = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.cell.membraneColor),
        });

        if (this.membrane) {
            this.scene.remove(this.membrane);
            this.membrane.geometry.dispose();
            this.membrane.material.dispose();
        }

        this.membrane = new THREE.Mesh(tubeGeom, mat);
        this.membrane.position.z = 0.05;
            this.cellGroup.add(this.membrane);

        // Store curve for updates
        this.membraneCurve = curve;
        this.membranePoints = points;
    }

    catmullRom(p0, p1, p2, p3, t) {
        const v0 = (p2.x - p0.x) * 0.5;
        const v1 = (p3.x - p1.x) * 0.5;
        const y0 = (p2.y - p0.y) * 0.5;
        const y1 = (p3.y - p1.y) * 0.5;

        const t2 = t * t;
        const t3 = t * t2;

        const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 + (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 + v0 * t + p1.x;
        const y = (2 * p1.y - 2 * p2.y + y0 + y1) * t3 + (-3 * p1.y + 3 * p2.y - 2 * y0 - y1) * t2 + y0 * t + p1.y;

        return new THREE.Vector2(x, y);
    }

    updateMembranePhysics() {
        const settings = this.settings.membrane;
        const count = this.membraneBlobs.length;
        const blobRadius = this.settings.cell.blobRadius;

        // Update blob velocities and positions based on forces
        for (let i = 0; i < count; i++) {
            const blob = this.membraneBlobs[i];

            // Spring force - tries to pull blob back toward base position
            const basePos = new THREE.Vector2(
                Math.cos(blob.baseAngle) * blob.baseRadius,
                Math.sin(blob.baseAngle) * blob.baseRadius
            );

            const diff = new THREE.Vector2().copy(basePos).sub(blob.current);
            const springForce = diff.clone().multiplyScalar(settings.springStrength);

            // Spring damping
            const damping = blob.velocity.clone().multiplyScalar(-settings.springDamping);

            // Active repulsion from ALL nuclei - pushes blob away when any nucleus gets close
            let nucleusForce = new THREE.Vector2(0, 0);
            let closestNucleus = null;
            let closestNucleusDistance = Infinity;
            
            for (const nucleus of this.nuclei) {
                const toNucleus = new THREE.Vector2().copy(nucleus.ghostPosition).sub(blob.current);
                const distToNucleus = toNucleus.length();
                
                // Track closest nucleus for undulation calculations
                if (distToNucleus < closestNucleusDistance) {
                    closestNucleusDistance = distToNucleus;
                    closestNucleus = nucleus;
                }
                
                // Apply repulsion based on nucleus's dynamic radius
                const influenceRadius = nucleus.radius * 2.5; // Use nucleus's actual radius
                if (distToNucleus < influenceRadius) {
                    // Falloff: strong near nucleus, weak at edge of influence
                    const falloff = Math.max(0, (influenceRadius - distToNucleus) / influenceRadius);
                    // Repulsion strength scales with nucleus size (larger nuclei push harder)
                    const repulsionStrength = falloff * falloff * nucleus.radius * 1.2;
                    if (distToNucleus > 0.001) {
                        nucleusForce.add(toNucleus.clone().normalize().multiplyScalar(-repulsionStrength));
                    }
                }
            }

            // Adjacent blob constraint forces (keep blobs connected)
            const prev = this.membraneBlobs[(i - 1 + count) % count];
            const next = this.membraneBlobs[(i + 1) % count];

            const toPrev = new THREE.Vector2().copy(prev.current).sub(blob.current);
            const toNext = new THREE.Vector2().copy(next.current).sub(blob.current);

            const avgDist = blob.baseRadius;
            const prevDist = toPrev.length();
            const nextDist = toNext.length();

            let constraintForce = new THREE.Vector2(0, 0);

            if (prevDist > avgDist * 1.1) {
                const f = toPrev.clone().normalize().multiplyScalar((prevDist - avgDist * 1.1) * settings.stiffness);
                constraintForce.add(f);
            }
            if (nextDist > avgDist * 1.1) {
                const f = toNext.clone().normalize().multiplyScalar((nextDist - avgDist * 1.1) * settings.stiffness);
                constraintForce.add(f);
            }

            // Apply all forces
            blob.velocity.add(springForce).add(damping).add(nucleusForce).add(constraintForce);
            blob.velocity.multiplyScalar(settings.damping);

            // Update position
            blob.current.add(blob.velocity);

            // Add undulation to blob position based on angle
            // Calculate proximity to closest visible nucleus to diminish undulation nearby
            let distToNearestVisualNucleus = Infinity;
            let closestVisualNucleus = null;
            for (const nucleus of this.nuclei) {
                const dist = blob.current.distanceTo(nucleus.visualPosition);
                if (dist < distToNearestVisualNucleus) {
                    distToNearestVisualNucleus = dist;
                    closestVisualNucleus = nucleus;
                }
            }
            
            const undulationProximityRange = closestVisualNucleus.radius * 3.0; // Range based on closest nucleus size
            const proximityMultiplier = Math.max(0, Math.min(1, (distToNearestVisualNucleus - closestVisualNucleus.radius) / (undulationProximityRange - closestVisualNucleus.radius)));
            
            const undulationX = Math.sin(blob.baseAngle * settings.undulationFrequency + this.time) * settings.undulationAmount * proximityMultiplier;
            const undulationY = Math.cos(blob.baseAngle * settings.undulationFrequency + this.time) * settings.undulationAmount * proximityMultiplier;
            blob.current.x += undulationX;
            blob.current.y += undulationY;

            // Constrain to max deformation
            const distFromBase = blob.current.distanceTo(basePos);
            if (distFromBase > blob.baseRadius * settings.maxDeformation) {
                const dir = new THREE.Vector2().copy(blob.current).sub(basePos).normalize();
                blob.current.copy(basePos).add(dir.multiplyScalar(blob.baseRadius * settings.maxDeformation));
            }
        }

        // Update all nuclei physics
        for (const nucleus of this.nuclei) {
            // Update visual nucleus position with constraints from closest nucleus center
            let predictedVisualPos;
            if (nucleus.isBeingDragged) {
                predictedVisualPos = new THREE.Vector2().copy(nucleus.dragTargetPosition);
            } else {
                predictedVisualPos = new THREE.Vector2().copy(nucleus.visualPosition).add(nucleus.visualVelocity);
            }
            
            const visualBoundaryMargin = 0.05;
            const maxDistFromGhost = nucleus.radius;
            
            const distFromGhost = predictedVisualPos.distanceTo(nucleus.ghostPosition);
            if (distFromGhost > maxDistFromGhost) {
                const dirFromGhost = new THREE.Vector2().copy(predictedVisualPos).sub(nucleus.ghostPosition).normalize();
                predictedVisualPos.copy(nucleus.ghostPosition).add(dirFromGhost.multiplyScalar(maxDistFromGhost));
            }
            
            nucleus.visualPosition.copy(predictedVisualPos);
            
            // Update mesh positions
            nucleus.updateMeshPositions();
        }

        // Update membrane geometry by updating vertex positions
        this.updateMembranePositions();

        // Update visual blob points (only if enabled)
        if (this.settings.cell.showBlobPoints) {
            for (let i = 0; i < count; i++) {
                const blob = this.membraneBlobs[i];
                const pointMesh = this.blobPoints[i];
                if (pointMesh) {
                    pointMesh.position.set(blob.current.x, blob.current.y, 0.05);
                }
            }
        }
    }

    updateMembranePositions() {
        // Recreate the membrane geometry from updated blob positions
        if (!this.membraneBlobs || this.membraneBlobs.length === 0) return;

        const points = [];
        const blobs = this.membraneBlobs;
        const count = blobs.length;
        const segmentsPerBlob = 8;

        // Recalculate curve points from updated blob positions
        for (let i = 0; i < count; i++) {
            const p0 = blobs[(i - 1 + count) % count].current;
            const p1 = blobs[i].current;
            const p2 = blobs[(i + 1) % count].current;
            const p3 = blobs[(i + 2) % count].current;

            points.push(new THREE.Vector3(p1.x, p1.y, 0));

            for (let t = 1; t < segmentsPerBlob; t++) {
                const tNorm = t / segmentsPerBlob;
                const pt = this.catmullRom(p0, p1, p2, p3, tNorm);
                points.push(new THREE.Vector3(pt.x, pt.y, 0));
            }
        }

        // Create new curve from updated points
        const curve = new THREE.CatmullRomCurve3(points);
        curve.closed = true;

        // Create new tube geometry
        const tubeGeom = new THREE.TubeGeometry(
            curve,
            points.length * 2,
            this.settings.cell.lineWidth / 20,
            8,
            true
        );

        // Replace old mesh with new one - remove from cellGroup, not scene
        if (this.membrane) {
            this.cellGroup.remove(this.membrane);
            this.membrane.geometry.dispose();
            this.membrane.material.dispose();
        }
        
        const mat = new THREE.MeshBasicMaterial({
            color: this.parseCSSColor(this.settings.cell.membraneColor),
        });
        
        this.membrane = new THREE.Mesh(tubeGeom, mat);
        this.membrane.position.z = 0.05;
        this.cellGroup.add(this.membrane);
    }

    updateCellPhysics() {
        const settings = this.settings.physics;
        const nucleusRadius = this.settings.cell.nucleusRadius;
        const blobRadius = this.settings.cell.blobRadius;
        const membraneRadius = this.settings.cell.membraneRadius;
        const wallMargin = this.settings.cell.wallMargin;
        const maxDistance = membraneRadius - nucleusRadius - wallMargin; // nucleus center max distance
        
        // Update physics for each nucleus
        for (const nucleus of this.nuclei) {
            // Apply drag to nucleus
            nucleus.velocity.multiplyScalar(settings.drag);
            
            // Apply damping to visual nucleus velocity to prevent jitter
            nucleus.visualVelocity.multiplyScalar(0.9);

            // Add spring force pulling back to center (but only when not dragging)
            if (!nucleus.isBeingDragged) {
                // Calculate spring force toward GHOST nucleus for VISUAL nucleus
                const visualToGhost = new THREE.Vector2().copy(nucleus.ghostPosition).sub(nucleus.visualPosition);
                const visualSpringForce = visualToGhost.multiplyScalar(settings.centerSpring);
                nucleus.visualVelocity.add(visualSpringForce);
                
                // Apply stronger damping during return for controlled elasticity
                nucleus.visualVelocity.multiplyScalar(settings.centerDamping);
                
                // Calculate spring force toward center (0, 0) for GHOST nucleus
                const toCenter = new THREE.Vector2().copy(nucleus.ghostPosition).negate();
                const springForce = toCenter.multiplyScalar(settings.centerSpring);
                nucleus.velocity.add(springForce);
                
                // Apply stronger damping during return for controlled elasticity
                nucleus.velocity.multiplyScalar(settings.centerDamping);
            }

            // Clamp velocity to prevent instability
            const maxVelocity = 1.5;
            if (nucleus.velocity.length() > maxVelocity) {
                nucleus.velocity.normalize().multiplyScalar(maxVelocity);
            }

            // Update ghost nucleus position (always constrained to circle)
            nucleus.ghostPosition.add(nucleus.velocity);

            // Global circular containment for GHOST nucleus - ALWAYS enforce
            const distFromCenter = nucleus.ghostPosition.length();

            // Extra damping when near boundary to prevent flickering
            const proximityToWall = maxDistance - distFromCenter;
            if (proximityToWall < 2.0) {
                // Within 2 units of boundary, apply extra damping
                const dampingFactor = Math.max(0.5, proximityToWall / 2.0); // 0.5 to 1.0
                nucleus.velocity.multiplyScalar(dampingFactor);
            }

            if (distFromCenter > maxDistance) {
                // Ghost nucleus hit the boundary - apply collision damping
                if (distFromCenter > 0.001) {
                    const pushDir = nucleus.ghostPosition.clone().normalize();
                    
                    // Hard constraint - snap back to boundary
                    nucleus.ghostPosition.copy(pushDir.multiplyScalar(maxDistance));
                    
                    // Kill outward velocity and dampen overall velocity
                    const velAlongNormal = nucleus.velocity.dot(pushDir);
                    if (velAlongNormal > 0) {
                        // Remove outward component
                        nucleus.velocity.sub(pushDir.multiplyScalar(velAlongNormal));
                    }
                    
                    // Apply strong damping on collision (lose energy)
                    nucleus.velocity.multiplyScalar(0.5); // Lose 50% velocity on wall hit
                }
            }
        }
        
        // Nucleus-to-nucleus collision detection and response
        for (let i = 0; i < this.nuclei.length; i++) {
            for (let j = i + 1; j < this.nuclei.length; j++) {
                const nucleusA = this.nuclei[i];
                const nucleusB = this.nuclei[j];
                
                // Calculate distance between ghost nuclei
                const toB = new THREE.Vector2().copy(nucleusB.ghostPosition).sub(nucleusA.ghostPosition);
                const distToB = toB.length();
                
                // Use dynamic scale for collision radius
                const radiusA = nucleusA.radius * (nucleusA.currentScale || 1.0);
                const radiusB = nucleusB.radius * (nucleusB.currentScale || 1.0);
                const minDistance = radiusA + radiusB + 0.1; // Small buffer
                
                // Check for collision
                if (distToB < minDistance && distToB > 0.001) {
                    // Collision detected - apply repulsion
                    const normal = toB.clone().normalize();
                    const overlap = minDistance - distToB;
                    
                    // Push nuclei apart proportional to their sizes (mass approximation)
                    const totalRadius = radiusA + radiusB;
                    const pushA = (radiusB / totalRadius) * overlap * 0.5;
                    const pushB = (radiusA / totalRadius) * overlap * 0.5;
                    
                    nucleusA.ghostPosition.sub(normal.clone().multiplyScalar(pushA));
                    nucleusB.ghostPosition.add(normal.clone().multiplyScalar(pushB));
                    
                    // Apply velocity impulse for elastic collision
                    const velocityAlongNormal = nucleusB.velocity.dot(normal) - nucleusA.velocity.dot(normal);
                    
                    // Only apply impulse if objects are moving toward each other
                    if (velocityAlongNormal < 0) {
                        const restitution = 0.6; // Elasticity of collision
                        const impulse = -(1 + restitution) * velocityAlongNormal / 2; // Divide by 2 for equal mass approximation
                        
                        nucleusA.velocity.sub(normal.clone().multiplyScalar(impulse));
                        nucleusB.velocity.add(normal.clone().multiplyScalar(impulse));
                    }
                }
            }
        }
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1;
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1;

        this.mouse.set(x, y);

        // Handle blob dragging
        if (this.draggedBlob) {
            const distance = this.settings.camera.positionZ;
            const vFOV = (this.settings.camera.fov * Math.PI) / 180;
            const height = 2 * Math.tan(vFOV / 2) * distance;
            const width = height * this.camera.aspect;

            const worldX = (x * width) / 2;
            const worldY = (y * height) / 2;

            this.draggedBlob.current.set(worldX + this.blobDragOffset.x, worldY + this.blobDragOffset.y);
            this.draggedBlob.velocity.set(0, 0); // Stop momentum while dragging
            return;
        }

        // Handle nucleus dragging
        if (this.draggedNucleus) {
            const distance = this.settings.camera.positionZ;
            const vFOV = (this.settings.camera.fov * Math.PI) / 180;
            const height = 2 * Math.tan(vFOV / 2) * distance;
            const width = height * this.camera.aspect;

            const worldX = (x * width) / 2;
            const worldY = (y * height) / 2;

            // Track the UNCONSTRAINED drag target (where user is trying to drag to)
            this.draggedNucleus.dragTargetPosition.set(worldX + this.draggedNucleus.dragOffset.x, worldY + this.draggedNucleus.dragOffset.y);
            this.draggedNucleus.dragTargetMesh.visible = this.debug.showDragTarget;
            this.draggedNucleus.dragTargetMesh.position.set(this.draggedNucleus.dragTargetPosition.x, this.draggedNucleus.dragTargetPosition.y, 0.12);
            
            // Drag the GHOST nucleus (constrained center)
            this.draggedNucleus.ghostPosition.set(worldX + this.draggedNucleus.dragOffset.x, worldY + this.draggedNucleus.dragOffset.y);
            this.draggedNucleus.velocity.set(0, 0);
            
            // Don't update visual nucleus here - let updateMembranePhysics calculate it
            // This ensures it's always constrained properly on every physics frame
            this.draggedNucleus.visualVelocity.set(0, 0);
        }
    }

    onMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 2 - 1;
        const y = -(event.clientY - rect.top) / rect.height * 2 + 1;

        // Convert to world coordinates with aspect ratio correction
        const distance = this.settings.camera.positionZ;
        const vFOV = (this.settings.camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFOV / 2) * distance;
        const width = height * this.camera.aspect;

        const worldX = (x * width) / 2;
        const worldY = (y * height) / 2;

        // First, check if clicking on a blob (membrane point)
        const blobClickRadius = this.settings.cell.blobRadius * 1.5; // Easier to click
        for (let i = 0; i < this.membraneBlobs.length; i++) {
            const blob = this.membraneBlobs[i];
            const dx = worldX - blob.current.x;
            const dy = worldY - blob.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < blobClickRadius) {
                // Clicked on a blob!
                this.draggedBlob = blob;
                this.blobDragOffset.set(blob.current.x - worldX, blob.current.y - worldY);
                this.canvas.style.cursor = 'grabbing';
                // Signal that visualization is using drag
                window.isVisualizationDragging = true;
                return; // Don't check nuclei
            }
        }

        // Otherwise, check if clicking on any nucleus
        for (const nucleus of this.nuclei) {
            const dx = worldX - nucleus.visualPosition.x;
            const dy = worldY - nucleus.visualPosition.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only allow dragging if clicking directly on the nucleus (using its actual radius)
            if (dist < nucleus.radius * 0.95) {
                nucleus.isBeingDragged = true;
                // Offset from ghost nucleus position for dragging
                nucleus.dragOffset.set(nucleus.ghostPosition.x - worldX, nucleus.ghostPosition.y - worldY);
                this.draggedNucleus = nucleus;
                this.canvas.style.cursor = 'grabbing';
                // Signal that visualization is using drag
                window.isVisualizationDragging = true;
                return;
            }
        }
    }

    onMouseUp(event) {
        // Release blob if dragging one
        if (this.draggedBlob) {
            this.draggedBlob = null;
            this.canvas.style.cursor = 'auto';
            // Clear visualization drag flag
            window.isVisualizationDragging = false;
            return;
        }

        // Release nucleus if dragging one
        if (this.draggedNucleus) {
            // Stop the nucleus immediately - no throw/inertia
            this.draggedNucleus.velocity.set(0, 0);
            this.draggedNucleus.visualVelocity.set(0, 0);
            // Hide the drag target based on debug setting
            this.draggedNucleus.dragTargetMesh.visible = this.debug.showDragTarget;
            this.draggedNucleus.isBeingDragged = false;
            this.draggedNucleus = null;
            // Clear visualization drag flag
            window.isVisualizationDragging = false;
        }
        this.canvas.style.cursor = 'auto';
    }
    
    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 0) return;
        
        const touch = event.touches[0];
        
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseDown(mouseEvent);
    }
    
    onTouchMove(event) {
        if (event.touches.length === 0) return;
        
        const touch = event.touches[0];
        
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.onMouseMove(mouseEvent);
        
        // Always prevent default on canvas to prevent page scroll/swipe
        event.preventDefault();
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        
        // Stop propagation to prevent app-level swipe handler from firing
        if (this.draggedNucleus || this.draggedBlob) {
            event.stopPropagation();
        }
        
        const mouseEvent = new MouseEvent('mouseup', {});
        this.onMouseUp(mouseEvent);
    }
    
    onThemeChange() {
        const bgColor = this.parseCSSColor(this.settings.background.color);
        this.scene.background = bgColor;
        
        const nucleusColor = this.parseCSSColor(this.settings.cell.nucleusColor);
        for (const nucleus of this.nuclei) {
            nucleus.visualMesh.material.color.set(nucleusColor);
        }

        const membraneColor = this.parseCSSColor(this.settings.cell.membraneColor);
        this.membrane.material.color.set(membraneColor);

        // Update colors of blob points
        for (const pointMesh of this.blobPoints) {
            pointMesh.material.color.set(membraneColor);
        }
        
        // Update colors of prey cells
        let borderColor = 0xFFAA00; // Default orange fallback
        const borderCSSValue = getComputedStyle(document.documentElement).getPropertyValue('--color-border');
        if (borderCSSValue) {
            borderColor = new THREE.Color(borderCSSValue.trim());
        }
        for (const p of this.prey) {
            if (p.mesh && p.mesh.material) {
                p.mesh.material.color.set(borderColor);
            }
        }
    }

    spawnPrey() {
        // Random chance to spawn prey each frame
        if (Math.random() > this.preySpawnRate) return;
        
        // Get camera bounds
        const distance = this.settings.camera.positionZ;
        const vFOV = (this.settings.camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFOV / 2) * distance;
        const width = height * this.camera.aspect;
        
        // Spawn from random edge
        let spawnX, spawnY;
        const edge = Math.floor(Math.random() * 4);
        const radius = THREE.MathUtils.randFloat(this.preyMinRadius, this.preyMaxRadius);
        
        switch(edge) {
            case 0: // Top
                spawnX = THREE.MathUtils.randFloat(-width / 2, width / 2);
                spawnY = height / 2 + 2;
                break;
            case 1: // Bottom
                spawnX = THREE.MathUtils.randFloat(-width / 2, width / 2);
                spawnY = -height / 2 - 2;
                break;
            case 2: // Left
                spawnX = -width / 2 - 2;
                spawnY = THREE.MathUtils.randFloat(-height / 2, height / 2);
                break;
            case 3: // Right
                spawnX = width / 2 + 2;
                spawnY = THREE.MathUtils.randFloat(-height / 2, height / 2);
                break;
        }
        
        // Random velocity toward center with some variation
        const targetX = (Math.random() - 0.5) * width * 0.4;
        const targetY = (Math.random() - 0.5) * height * 0.4;
        const velX = (targetX - spawnX) * 0.0005;
        const velY = (targetY - spawnY) * 0.0005;
        
        const prey = new Prey(this.preyIdCounter++, new THREE.Vector2(spawnX, spawnY), new THREE.Vector2(velX, velY), this.settings, radius);
        this.prey.push(prey);
        this.cellGroup.add(prey.getMesh());
    }

    updatePrey() {
        // Update and check prey
        for (let i = this.prey.length - 1; i >= 0; i--) {
            const p = this.prey[i];
            p.update();
            
            // Check if prey is consumed by any nucleus
            let consumed = false;
            for (const nucleus of this.nuclei) {
                // Check collision with membrane blobs - consume when prey touches the barrier
                const blobCollisionRadius = this.settings.cell.blobRadius;
                for (const blob of this.membraneBlobs) {
                    const distToBlob = p.position.distanceTo(blob.current);
                    // Check if prey touches the membrane blob surface
                    if (distToBlob < blobCollisionRadius + p.radius) {
                        // Prey consumed by touching membrane
                        // Place new nucleus at the prey's position
                        const newPosition = new THREE.Vector2().copy(p.position);
                        
                        const newNucleus = new Nucleus(this.nuclei.length, newPosition, this.settings, p.radius);
                        this.nuclei.push(newNucleus);
                        for (const mesh of newNucleus.getMeshes()) {
                            this.cellGroup.add(mesh);
                        }
                        
                        consumed = true;
                        break;
                    }
                }
                if (consumed) break;
            }
            
            if (consumed) {
                // Remove consumed prey
                this.cellGroup.remove(p.getMesh());
                p.dispose();
                this.prey.splice(i, 1);
                
                // Check if we should combine nuclei
                this.checkAndCombineNuclei();
            } else {
                // Check if prey left the screen
                const distance = this.settings.camera.positionZ;
                const vFOV = (this.settings.camera.fov * Math.PI) / 180;
                const height = 2 * Math.tan(vFOV / 2) * distance;
                const width = height * this.camera.aspect;
                
                if (Math.abs(p.position.x) > width || Math.abs(p.position.y) > height) {
                    // Remove off-screen prey
                    this.cellGroup.remove(p.getMesh());
                    p.dispose();
                    this.prey.splice(i, 1);
                }
            }
        }
    }

    checkAndCombineNuclei() {
        if (this.nuclei.length >= 10) {
            // Combine all nuclei into one
            let totalRadius = 0;
            let avgX = 0;
            let avgY = 0;
            
            // Calculate combined size and average position
            for (const nucleus of this.nuclei) {
                totalRadius += nucleus.radius;
                avgX += nucleus.ghostPosition.x;
                avgY += nucleus.ghostPosition.y;
            }
            
            const count = this.nuclei.length;
            avgX /= count;
            avgY /= count;
            
            // The new radius is the sum of all radii (volume conservation approximation)
            const newRadius = totalRadius * 0.35; // Reduced scale factor for subtle growth
            const newPosition = new THREE.Vector2(avgX, avgY);
            
            // Remove all old nuclei meshes from scene and dispose
            for (const nucleus of this.nuclei) {
                // Remove all three meshes (visual, ghost, drag target)
                for (const mesh of nucleus.getMeshes()) {
                    this.cellGroup.remove(mesh);
                    if (mesh && mesh.geometry) mesh.geometry.dispose();
                    if (mesh && mesh.material) mesh.material.dispose();
                }
                nucleus.dispose();
            }
            
            // Clear nuclei array completely
            this.nuclei.length = 0;
            
            // Create single combined nucleus
            const combinedNucleus = new Nucleus(0, newPosition, this.settings, newRadius);
            combinedNucleus.isNewNucleus = true; // Mark for color tween
            combinedNucleus.colorTweenProgress = 0; // Start tween from beginning
            // Set initial red color
            combinedNucleus.visualMesh.material.color.set(0xFF0000);
            this.nuclei.push(combinedNucleus);
            
            // Add the new nucleus meshes to the scene
            for (const mesh of combinedNucleus.getMeshes()) {
                this.cellGroup.add(mesh);
            }
            
            // Trigger camera zoom-out based on new nucleus size
            this.initiateZoomTween(combinedNucleus.radius);
        }
    }

    initiateZoomTween(newNucleusRadius) {
        // Calculate zoom needed to maintain proportional view of the new nucleus
        const radiusRatio = newNucleusRadius / this.baselineNucleusRadius;
        const baselineZoom = this.settings.camera.positionZ;
        
        // New zoom should be proportionally farther based on size increase
        this.targetCameraZoom = baselineZoom * radiusRatio;
        this.cameraZoomProgress = 0; // Start tween
    }

    updateCameraZoom() {
        if (this.cameraZoomProgress < 1.0) {
            // Increment zoom progress
            this.cameraZoomProgress += 1.0 / this.cameraZoomDuration;
            this.cameraZoomProgress = Math.min(1.0, this.cameraZoomProgress);
            
            // Interpolate camera position
            const baselineZoom = this.settings.camera.positionZ;
            const currentZoom = baselineZoom + (this.targetCameraZoom - baselineZoom) * this.cameraZoomProgress;
            this.camera.position.z = currentZoom;
            this.camera.updateProjectionMatrix();
        }
    }

    updateNucleusColorTweens() {
        const accentColor = this.parseCSSColor(this.settings.cell.nucleusColor);
        const redColor = new THREE.Color(0xFF0000);
        
        for (const nucleus of this.nuclei) {
            if (nucleus.isNewNucleus && nucleus.colorTweenProgress < 1.0) {
                // Increment tween progress
                nucleus.colorTweenProgress += 1.0 / nucleus.colorTweenDuration;
                nucleus.colorTweenProgress = Math.min(1.0, nucleus.colorTweenProgress);
                
                // Interpolate color from red to accent
                const tweenedColor = new THREE.Color().lerpColors(redColor, accentColor, nucleus.colorTweenProgress);
                nucleus.visualMesh.material.color.set(tweenedColor);
                
                // Mark as complete when tween finishes
                if (nucleus.colorTweenProgress >= 1.0) {
                    nucleus.isNewNucleus = false;
                }
            }
        }
    }

    animate() {
        if (this.isPaused) return;
        this.animationId = requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        // Audio reactivity
        let audioEnergy = 0;
        let audioData = null;
        if (window.audioAnalyser) {
            const bufferLength = window.audioAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            window.audioAnalyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for(let i=0; i<bufferLength; i++) sum += dataArray[i];
            const avg = sum / bufferLength;
            
            // Apply volume scaling
            const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
            
            if (avg > 10) {
                audioEnergy = (avg / 255) * volume;
                audioData = dataArray;
            }
        }
        
        // Use audio data to modulate cell properties
        if (audioData) {
            // Pulse Nucleus - Way way increased exaggeration
            const pulse = 1 + (audioEnergy * 1.2); // Increased from 0.3 to 1.2
            for (const nucleus of this.nuclei) {
                // Modulate scale (subtle)
                const baseScale = 1.0; // Assume 1.0 is base
                nucleus.currentScale = baseScale * pulse; // Store for physics
                nucleus.visualMesh.scale.setScalar(nucleus.currentScale);
                
                // Color Shift (Blue/Green -> Red)
                const freqValue = audioEnergy * 1.5; // Sensitivity boost
                const redColor = new THREE.Color(1, 0, 0);
                const accentColor = this.parseCSSColor(this.settings.cell.nucleusColor);
                
                // Sharp threshold logic
                const threshold = 0.4;
                const mix = Math.max(0, Math.min(1, (freqValue - threshold) * 3));
                
                // Only change if not in a tween
                if (!nucleus.isNewNucleus) {
                    nucleus.visualMesh.material.color.lerpColors(accentColor, redColor, mix);
                }
            }
            
            // Modulate membrane blob points (visualizer effect)
            const count = this.membraneBlobs.length;
            for (let i = 0; i < count; i++) {
                const blob = this.membraneBlobs[i];
                
                // Map blob index to frequency bin
                const binIndex = Math.floor((i / count) * (audioData.length / 2));
                const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
                const freq = (audioData[binIndex] / 255) * volume;
                
                // Visible Soundwaves: Sine wave ripple effect (like Through the Wire)
                // 1. Outward push (Bass/Kick) - reduced intensity
                const dir = blob.current.clone().normalize();
                const pushForce = dir.clone().multiplyScalar(freq * 0.15); 
                blob.velocity.add(pushForce);
                
                // 2. Wavelength Ripple (Squiggle)
                // Calculate wave based on angle around the membrane
                // freq > 0.1 checks if there's significant audio
                if (freq > 0.1) {
                    const waveFreq = 12.0; // Number of ripples around the circle
                    const waveSpeed = 8.0; // Speed of travel around the perimeter
                    const waveAmp = freq * 0.25; // Decreased severity from 0.8 to 0.25
                    
                    // Use blob.baseAngle for consistent wave position relative to the circle
                    // Add time component for movement
                    const wave = Math.sin(blob.baseAngle * waveFreq + this.time * waveSpeed) * waveAmp;
                    
                    // Apply wave to position (outward/inward)
                    blob.current.add(dir.multiplyScalar(wave));
                }
            }
            
            // Color Shift for Membrane
            const membraneFreq = audioEnergy * 2.0; // High sensitivity
            if (membraneFreq > 0.3) {
                 const redColor = new THREE.Color(1, 0, 0);
                 const baseMembraneColor = this.parseCSSColor(this.settings.cell.membraneColor);
                 const mix = Math.min((membraneFreq - 0.3) * 2, 1);
                 this.membrane.material.color.lerpColors(baseMembraneColor, redColor, mix);
            } else {
                 const baseMembraneColor = this.parseCSSColor(this.settings.cell.membraneColor);
                 this.membrane.material.color.lerp(baseMembraneColor, 0.1);
            }

        } else {
            // Reset scales/colors if no audio
             for (const nucleus of this.nuclei) {
                nucleus.visualMesh.scale.setScalar(1.0);
             }
             if (this.membrane) {
                 const baseMembraneColor = this.parseCSSColor(this.settings.cell.membraneColor);
                 this.membrane.material.color.copy(baseMembraneColor);
             }
        }

        this.updateCellPhysics();
        this.updateMembranePhysics();
        this.spawnPrey(); // Spawn prey
        this.updatePrey(); // Update and check prey
        this.updateNucleusColorTweens(); // Update color tweens for new nuclei
        this.updateCameraZoom(); // Update camera zoom
        
        // Rotate blob base angles to create spinning effect (without rotating the group)
        const spinAmount = this.settings.membrane.spinSpeed * 0.016;
        for (let blob of this.membraneBlobs) {
            blob.baseAngle += spinAmount;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        const rect = this.container.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.animate();
        }
    }

    dispose() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', () => this.onResize());
        window.removeEventListener('themechange', () => this.onThemeChange());
        this.canvas.removeEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.removeEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.removeEventListener('mouseup', (e) => this.onMouseUp(e));

        // Dispose of blob point meshes
        for (const pointMesh of this.blobPoints) {
            if (pointMesh.geometry) pointMesh.geometry.dispose();
            if (pointMesh.material) pointMesh.material.dispose();
        }

        this.scene.traverse(object => {
            if (object.isMesh || object.isLine) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            }
        });
        
        // Dispose all nuclei
        for (const nucleus of this.nuclei) {
            nucleus.dispose();
        }
        
        // Dispose all prey
        for (const p of this.prey) {
            p.dispose();
        }
        
        if (this.renderer) this.renderer.dispose();
        if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    }
}
