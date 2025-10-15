/**
 * Forest Visualization using Three.js - Munari Style
 * Simple tube-based trees inspired by Bruno Munari's "Drawing a Tree"
 * Trees grow from the ground with branching structure and green circular leaves
 */

import * as THREE from 'three';

// Settings for Munari-inspired tree
export const FOREST_SETTINGS = {
    tree: {
        trunkHeight: 3.5,
        branchAngle: 30 * Math.PI / 180, // Natural fork angle
        branchLengthRatio: 0.68,
        branchLengthVariation: 0.25, // Vary segment length ±25%
        branchWidthRatio: 0.7, // Branches get thinner
        branchWidthVariation: 0.2, // Vary thickness ±20%
        maxDepth: 6,
        asymmetryFactor: 0.15, // Random variation in angles
        curvature: 0.15, // How much branches curve (0 = straight, higher = more curve)
        leafClusterSize: 8, // Leaves per branch tip
        leafRadius: 0.12,
        leafColor: "var(--color-accent)", // Use CSS accent color
        lineColor: {
            light: "var(--color-border)", // Use border color for light theme
            dark: "var(--color-border)"   // Use border color for dark theme
        },
        groundY: -4
    },
    wind: {
        enabled: true,
        speed: 0.8, // Wind cycle speed
        strength: 0.15, // Maximum sway angle in radians
        gustVariation: 0.3 // Randomness in wind gusts
    },
    forest: {
        maxTrees: 5, // Maximum trees allowed on screen
        horizonZ: -40, // Where trees spawn (far away)
        foregroundZ: 15, // Where trees are culled (past camera)
        moveSpeed: 0.1, // Movement speed
        minOffsetX: 3, // Minimum distance from center (left or right)
        maxOffsetX: 8, // Maximum distance from center
        depthScaling: true, // Scale trees by distance for perspective
        spawnInterval: 2.0 // Spawn one tree every two seconds
    },
    growth: {
        enabled: true,
        duration: 2.5 // Seconds to fully grow a tree
    },
    camera: {
        fov: 50,
        positionZ: 0,
        positionY: 0,
        near: 0.1,
        far: 100
    },
    background: {
        color: "var(--color-bg-secondary)" // Use secondary background color
    }
};

export class Forest {
    constructor(container, settings = FOREST_SETTINGS) {
        this.container = container;
        this.settings = settings;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.trees = []; // Array of trees moving through scene
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.isPaused = false;
        this.time = 0;
        this.animationId = null;
        this.windOffset = Math.random() * Math.PI * 2; // Random wind phase
        this.timeSinceLastSpawn = 0; // Track time since last tree spawn
        
        this.init();
    }
    
    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    renderSingleFrame(forceResize = false) {
        // Render one frame without resuming animation loop
        // Useful after DOM moves to prevent black canvas
        
        // Optionally force a resize check first (important after DOM moves)
        if (forceResize && this.container) {
            const rect = this.container.getBoundingClientRect();
            const currentWidth = Math.round(rect.width);
            const currentHeight = Math.round(rect.height);
            
            // If size changed, trigger resize BEFORE rendering
            if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
                this.onResize();
            }
        }
        
        // Render multiple frames to ensure WebGL context updates after DOM move
        if (this.renderer) {
            // First render might be black due to WebGL context issues after DOM move
            this.renderer.render(this.scene, this.camera);
            
            // Second render typically shows correctly
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
            
            // Force a resize check after DOM restructuring (e.g., mockup transitions)
            // This ensures the canvas is properly sized after being moved
            if (this.container) {
                const rect = this.container.getBoundingClientRect();
                const currentWidth = Math.round(rect.width);
                const currentHeight = Math.round(rect.height);
                
                // If size changed while paused, trigger resize
                if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
                    this.onResize();
                }
            }
            
            // Render one frame immediately to ensure seamless visual continuity
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
            
            this.animate(); // Restart animation loop
        }
    }
    
    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'forest-canvas';
        this.container.appendChild(this.canvas);
        
        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.parseCSSColor(this.settings.background.color));
        
        // Setup camera - fixed position to view trees passing by
        this.camera = new THREE.PerspectiveCamera(
            this.settings.camera.fov,
            width / height,
            this.settings.camera.near,
            this.settings.camera.far
        );
        this.camera.position.set(0, this.settings.camera.positionY, this.settings.camera.positionZ);
        this.camera.lookAt(0, 0, 0);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: false,
            antialias: false
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(1); // Lower pixel ratio for better performance
        
        // Track initial size
        this.lastWidth = width;
        this.lastHeight = height;
        
        // Create initial forest
        this.createInitialForest();
        
        // Handle resize
        this.handleResize = this.onResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Listen for theme changes
        this.handleThemeChange = this.onThemeChange.bind(this);
        window.addEventListener('themechange', this.handleThemeChange);
        
        // Start animation loop
        this.animate();
    }
    
    onThemeChange() {
        // Update all colors when theme changes
        this.updateColors();
    }
    
    updateColors() {
        // Update scene background
        this.scene.background = new THREE.Color(this.parseCSSColor(this.settings.background.color));
        
        // Update all tree materials
        this.trees.forEach(treeData => {
            treeData.group.traverse((child) => {
                if (child.material) {
                    if (child.userData && child.userData.type === 'branch') {
                        child.material.color = this.parseCSSColor(this.settings.tree.lineColor);
                    } else if (child.userData && child.userData.type === 'leaves') {
                        child.material.color = this.parseCSSColor(this.settings.tree.leafColor);
                    }
                    child.material.needsUpdate = true;
                }
            });
        });
    }
    
    createInitialForest() {
        // Start with one tree at the horizon
        this.spawnTree(this.settings.forest.horizonZ);
        this.timeSinceLastSpawn = 0;
    }
    
    spawnTree(z) {
        const group = new THREE.Group();
        
        // Spawn trees anywhere from -maxOffsetX to +maxOffsetX, including center
        const offsetX = Math.random() * this.settings.forest.maxOffsetX * 2 - this.settings.forest.maxOffsetX;
        const x = offsetX;
        
        group.position.set(x, this.settings.tree.groundY, z);
        
        // Calculate scale based on depth for perspective
        let scale = 1;
        if (this.settings.forest.depthScaling) {
            // Trees at horizon (far) are smaller, trees close to camera are larger
            const normalizedDepth = (z - this.settings.forest.horizonZ) / 
                (this.settings.forest.foregroundZ - this.settings.forest.horizonZ);
            scale = 0.3 + normalizedDepth * 0.7; // Scale from 30% to 100%
        }
        group.scale.set(scale, scale, scale);
        
        // Start from ground with trunk
        const startPos = new THREE.Vector3(0, 0, 0);
        const trunkHeight = this.settings.tree.trunkHeight;
        const trunkWidth = 0.1;
        
        // Draw complete tree starting from ground
        // Always upward (PI/2 radians = 90 degrees = straight up)
        this.drawBranch(
            startPos,
            Math.PI / 2, // Upward (positive Y direction)
            trunkHeight,
            trunkWidth,
            1,
            group
        );
        
        this.scene.add(group);
        
        // Store tree data with growth state
        const treeData = {
            group: group,
            baseX: x,
            currentZ: z,
            scale: scale,
            growthProgress: 0, // 0 to 1
            isGrowing: this.settings.growth.enabled,
            maxDepth: this.getMaxDepth(group) // Calculate max depth for this tree
        };
        
        // Initially hide all branches if growth is enabled
        if (this.settings.growth.enabled) {
            this.hideAllBranches(group);
        }
        
        this.trees.push(treeData);
    }
    
    getMaxDepth(group) {
        let maxDepth = 0;
        group.traverse((child) => {
            if (child.userData && child.userData.type === 'branch' && child.userData.depth > maxDepth) {
                maxDepth = child.userData.depth;
            }
        });
        return maxDepth;
    }
    
    hideAllBranches(group) {
        group.traverse((child) => {
            if (child.userData && (child.userData.type === 'branch' || child.userData.type === 'leaves')) {
                child.visible = false;
            }
        });
    }
    
    drawBranch(startPos, angle, length, width, depth, parentGroup, parentDelay = 0, parentDuration = 0) {
        if (depth > this.settings.tree.maxDepth || length < 0.15) {
            // Add leaf cluster at branch tip
            this.addLeafCluster(startPos, parentGroup, depth, parentDelay, parentDuration);
            return;
        }
        
        // Add variation to segment length and width
        const lengthVariation = 1 + (Math.random() - 0.5) * this.settings.tree.branchLengthVariation;
        const widthVariation = 1 + (Math.random() - 0.5) * this.settings.tree.branchWidthVariation;
        const actualLength = length * lengthVariation;
        const actualWidth = width * widthVariation;
        
        // Create curved branch using multiple segments
        const curveSegments = Math.max(3, Math.floor(length * 2)); // More segments for longer branches
        const curvature = this.settings.tree.curvature * (Math.random() - 0.5) * 2; // Random curve direction
        
        // Create a group for this branch segment and its children
        const branchGroup = new THREE.Group();
        branchGroup.position.copy(startPos);
        
        // Calculate local points (relative to branch base at 0,0,0)
        const localPoints = [];
        for (let i = 0; i <= curveSegments; i++) {
            const t = i / curveSegments;
            
            // Quadratic curve formula
            const curveOffset = curvature * Math.sin(t * Math.PI) * actualLength * 0.3;
            const currentAngle = angle + curveOffset;
            
            const x = Math.cos(currentAngle) * actualLength * t;
            const y = Math.sin(currentAngle) * actualLength * t;
            
            localPoints.push(new THREE.Vector3(x, y, 0));
        }
        
        const localEndPos = localPoints[localPoints.length - 1];
        
        // Calculate tube radius based on depth for tapering thickness
        const tubeRadius = Math.max(0.005, 0.05 - (depth - 1) * 0.006); // Trunk 0.05, decreases to ~0.005

        // Create smooth curve for tube
        const curve = new THREE.CatmullRomCurve3(localPoints);

        // Create tube geometry for thick branch
        const tubeGeometry = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({ 
            color: this.parseCSSColor(this.settings.tree.lineColor) 
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

        branchGroup.add(tube);

        // Calculate sequential growth timing
        // This branch starts after parent finishes
        const myDelay = parentDelay + parentDuration;
        const myDuration = 0.08 + Math.random() * 0.08; // Each segment takes 8-16% of total time

        // Store branch metadata for wind animation and growth
        branchGroup.userData = {
            type: 'branch',
            depth: depth,
            baseAngle: angle,
            length: actualLength,
            localEndPos: localEndPos.clone(),
            originalLocalPoints: localPoints.map(p => p.clone()),
            windPhase: Math.random() * Math.PI * 2, // Random wind phase per branch
            currentWindRotation: 0, // Track current wind rotation
            growthDelay: myDelay,
            growthDuration: myDuration
        };

        parentGroup.add(branchGroup);
        
        // Create 2-3 child branches from local end point (will be transformed by parent)
        const numBranches = Math.random() > 0.6 ? 3 : 2;
        const newLength = actualLength * this.settings.tree.branchLengthRatio;
        const newWidth = actualWidth * this.settings.tree.branchWidthRatio;
        
        // Use the final angle (including curve) for child branches
        // Ensure branches always point upward or sideways (never downward)
        let finalAngle = angle + curvature;
        // Clamp final angle to keep branches growing upward (between 0 and PI)
        finalAngle = Math.max(0, Math.min(Math.PI, finalAngle));
        
        if (numBranches === 2) {
            // Left and right branches
            let leftAngle = finalAngle - this.settings.tree.branchAngle + 
                (Math.random() - 0.5) * this.settings.tree.asymmetryFactor;
            let rightAngle = finalAngle + this.settings.tree.branchAngle + 
                (Math.random() - 0.5) * this.settings.tree.asymmetryFactor;
            
            // Ensure branches grow upward (0 to PI range, never negative/downward)
            leftAngle = Math.max(0.1, Math.min(Math.PI - 0.1, leftAngle));
            rightAngle = Math.max(0.1, Math.min(Math.PI - 0.1, rightAngle));
            
            // Child branches start at the tip of this branch in local space
            // Pass timing so children start after this branch finishes
            this.drawBranch(localEndPos, leftAngle, newLength, newWidth, depth + 1, branchGroup, myDelay, myDuration);
            this.drawBranch(localEndPos, rightAngle, newLength, newWidth, depth + 1, branchGroup, myDelay, myDuration);
        } else {
            // Three branches for bushier look
            let leftAngle = finalAngle - this.settings.tree.branchAngle * 1.2;
            let centerAngle = finalAngle + (Math.random() - 0.5) * 0.2;
            let rightAngle = finalAngle + this.settings.tree.branchAngle * 1.2;
            
            // Ensure all branches grow upward
            leftAngle = Math.max(0.1, Math.min(Math.PI - 0.1, leftAngle));
            centerAngle = Math.max(0.1, Math.min(Math.PI - 0.1, centerAngle));
            rightAngle = Math.max(0.1, Math.min(Math.PI - 0.1, rightAngle));
            
            this.drawBranch(localEndPos, leftAngle, newLength * 0.85, newWidth, depth + 1, branchGroup, myDelay, myDuration);
            this.drawBranch(localEndPos, centerAngle, newLength * 0.9, newWidth, depth + 1, branchGroup, myDelay, myDuration);
            this.drawBranch(localEndPos, rightAngle, newLength * 0.85, newWidth, depth + 1, branchGroup, myDelay, myDuration);
        }
    }
    
    addLeafCluster(position, parentGroup, depth, parentDelay = 0, parentDuration = 0) {
        // Create cluster of circular leaves
        const clusterSize = this.settings.tree.leafClusterSize;
        
        // Leaves start after parent branch finishes
        const leafDelay = parentDelay + parentDuration;
        const leafDuration = 0.05 + Math.random() * 0.05; // Quick pop-in
        
        // Create a group for leaves at this position
        const leafGroup = new THREE.Group();
        leafGroup.position.copy(position);
        leafGroup.userData = { 
            type: 'leaves', 
            depth: depth,
            growthDelay: leafDelay,
            growthDuration: leafDuration
        };
        
        // Get the actual color value from CSS variable
        const leafColor = this.parseCSSColor(this.settings.tree.leafColor);
        
        for (let i = 0; i < clusterSize; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 0.3;
            
            const leafGeometry = new THREE.CircleGeometry(this.settings.tree.leafRadius, 8);
            const leafMaterial = new THREE.MeshBasicMaterial({ 
                color: leafColor,
                side: THREE.DoubleSide
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position relative to leaf group
            leaf.position.set(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance,
                (Math.random() - 0.5) * 0.1
            );
            
            leafGroup.add(leaf);
        }
        
        parentGroup.add(leafGroup);
    }
    
    parseCSSColor(cssValue) {
        // Handle theme-specific color objects
        if (typeof cssValue === 'object' && cssValue !== null) {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const themeColor = cssValue[currentTheme];
            
            if (themeColor) {
                return this.parseCSSColor(themeColor);
            }
            // Fallback to light theme if specified theme not found
            return this.parseCSSColor(cssValue.light || cssValue.dark || '#000000');
        }
        
        if (cssValue.startsWith('var(--')) {
            // Extract variable name
            const varName = cssValue.replace('var(', '').replace(')', '').trim();
            // Get computed value from document
            const computedValue = getComputedStyle(document.documentElement).getPropertyValue(varName);
            
            if (computedValue) {
                // Convert CSS color to THREE.js color
                return new THREE.Color(computedValue.trim());
            }
        }
        
        // Fallback to default parsing (hex, rgb, etc.)
        return new THREE.Color(cssValue);
    }
    
    animate() {
        if (this.isPaused) return;
        
        this.animationId = requestAnimationFrame(() => this.animate());
        this.time += 0.016; // ~60fps
        
        // Move trees forward
        this.updateForest();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    updateForest() {
        // Move trees forward (increase z)
        this.trees.forEach(treeData => {
            treeData.currentZ += this.settings.forest.moveSpeed;
            treeData.group.position.z = treeData.currentZ;
            
            // Update scale based on depth for perspective
            if (this.settings.forest.depthScaling) {
                const normalizedDepth = (treeData.currentZ - this.settings.forest.horizonZ) / 
                    (this.settings.forest.foregroundZ - this.settings.forest.horizonZ);
                const scale = 0.3 + normalizedDepth * 0.7;
                treeData.group.scale.set(scale, scale, scale);
                treeData.scale = scale;
            }
            
            // Update growth animation
            if (treeData.isGrowing) {
                treeData.growthProgress += 0.016 / this.settings.growth.duration;
                
                if (treeData.growthProgress >= 1) {
                    treeData.growthProgress = 1;
                    treeData.isGrowing = false;
                }
                
                this.updateTreeGrowth(treeData);
            }
            
            // Apply wind animation if enabled
            if (this.settings.wind.enabled) {
                this.applyWindToTree(treeData.group);
            }
        });
        
        // Remove trees that passed the camera (foreground)
        this.trees = this.trees.filter(treeData => {
            if (treeData.currentZ > this.settings.forest.foregroundZ) {
                // Tree passed camera, remove it
                this.scene.remove(treeData.group);
                treeData.group.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                return false; // Remove from array
            }
            return true; // Keep in array
        });
        
        // Spawn new tree every X seconds (time-based spawning)
        this.timeSinceLastSpawn += 0.016; // ~60fps
        
        if (this.timeSinceLastSpawn >= this.settings.forest.spawnInterval) {
            // Only spawn if we haven't hit max trees
            if (this.trees.length < this.settings.forest.maxTrees) {
                this.spawnTree(this.settings.forest.horizonZ);
                this.timeSinceLastSpawn = 0; // Reset timer
            }
        }
    }
    
    updateTreeGrowth(treeData) {
        const progress = treeData.growthProgress;
        
        // Animate each branch independently based on its own delay and duration
        treeData.group.traverse((child) => {
            if (child.userData && child.userData.type === 'branch') {
                const delay = child.userData.growthDelay || 0;
                const duration = child.userData.growthDuration || 0.2;
                
                // Calculate when this specific branch starts and ends
                const startTime = delay;
                const endTime = delay + duration;
                
                // Calculate this branch's individual growth progress
                let branchGrowth = (progress - startTime) / (endTime - startTime);
                branchGrowth = Math.max(0, Math.min(1, branchGrowth));
                
                if (branchGrowth > 0) {
                    child.visible = true;
                    // Animate the branch line geometry by scaling Y
                    // This makes the branch "draw" from base to tip
                    child.scale.set(1, branchGrowth, 1);
                } else {
                    child.visible = false;
                }
            }
            
            // Animate each leaf cluster independently
            if (child.userData && child.userData.type === 'leaves') {
                const delay = child.userData.growthDelay || 0;
                const duration = child.userData.growthDuration || 0.05;
                
                const startTime = delay;
                const endTime = delay + duration;
                
                let leafGrowth = (progress - startTime) / (endTime - startTime);
                leafGrowth = Math.max(0, Math.min(1, leafGrowth));
                
                if (leafGrowth > 0) {
                    child.visible = true;
                    // Quick pop-in for leaves
                    const leafScale = Math.min(1, leafGrowth * 2);
                    child.scale.set(leafScale, leafScale, leafScale);
                } else {
                    child.visible = false;
                }
            }
        });
    }
    
    applyWindToTree(treeGroup) {
        const windTime = this.time * this.settings.wind.speed + this.windOffset;
        
        // Recursively apply wind to branch hierarchy
        this.applyWindToGroup(treeGroup, windTime);
    }
    
    applyWindToGroup(group, windTime) {
        // Process all children
        group.children.forEach((child) => {
            if (child.userData && child.userData.type === 'branch') {
                const depth = child.userData.depth;
                const windPhase = child.userData.windPhase;
                
                // Higher branches sway more (depth-based multiplier)
                const depthMultiplier = Math.pow(depth / this.settings.tree.maxDepth, 1.5);
                
                // Calculate wind sway with variation per branch
                const swayAngle = Math.sin(windTime + windPhase) * 
                    this.settings.wind.strength * 
                    depthMultiplier;
                
                // Add gusts (secondary oscillation)
                const gustAngle = Math.sin(windTime * 1.7 + windPhase * 0.7) * 
                    this.settings.wind.strength * 
                    this.settings.wind.gustVariation * 
                    depthMultiplier;
                
                const totalSway = swayAngle + gustAngle;
                
                // Apply rotation to this branch group around Z axis
                // This rotation affects both the branch geometry AND all children
                child.rotation.z = totalSway;
                child.userData.currentWindRotation = totalSway;
                
                // Recursively apply wind to children (they inherit parent rotation)
                this.applyWindToGroup(child, windTime);
            }
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
        
        // Re-render after resize
        this.renderer.render(this.scene, this.camera);
        
        this.lastWidth = width;
        this.lastHeight = height;
    }
    
    dispose() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('themechange', this.handleThemeChange);
        
        // Dispose all trees
        this.trees.forEach(treeData => {
            this.scene.remove(treeData.group);
            treeData.group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.trees = [];
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

