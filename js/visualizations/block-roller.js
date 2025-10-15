/**
 * Block Roller Visualization
 * 3D isometric block that rolls and leaves a trail using Three.js
 */

export class BlockRoller {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.companionCubes = []; // Array of companion cubes
        this.animationFrame = null;
        this.isRunning = false;
        
        // Block properties
        this.blockSize = 1;
        this.blockPosition = { x: 0, y: 0 };
        this.gridSize = 100; // Much larger grid
        
        // Companion cubes data (4 total) - will be initialized with random positions
        this.companionData = [];
        
        // Trail system
        this.trail = [];
        this.trailMeshes = [];
        this.maxTrailLength = 10; // Keep only last 10 steps
        
        // Companion trails
        this.companionTrails = []; // Array of arrays, one per companion
        this.companionTrailMeshes = []; // Array of arrays of meshes
        
        // Rolling animation
        this.isRolling = false;
        this.rollStartPos = null;
        this.rollEndPos = null;
        this.rollProgress = 0;
        this.rollSpeed = 0.05; // Much faster rolling
        this.rollAxis = null;
        this.rollPivot = null;
        
        // Camera orbit - true isometric angle
        this.cameraAngle = 0;
        this.cameraOrbitSpeed = 0.002; // Much faster orbit
        this.cameraDistance = 15;
        this.cameraHeight = 15; // Equal distance for true isometric (45° angle)
        this.lightOffset = Math.PI / 2; // 90 degree offset from camera
        
        this.init();
    }
    
    init() {
        // Setup Three.js scene
        this.setupScene();
        this.setupLights();
        this.createGround();
        this.createBlock();
        this.createCompanionCubes();
        
        // Start in center - use integers for grid alignment
        this.blockPosition = { 
            x: 0,
            y: 0
        };
        
        // Position cube exactly at grid position
        // Y position is half the block size (sitting on ground)
        this.cube.position.set(0, this.blockSize / 2, 0);
        
        // Add initial trail piece at exact cube position
        this.addToTrail(0, 0);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Watch for theme changes
        this.setupThemeObserver();
        
        // Start animation
        this.start();
        
        // Start rolling after a moment
        setTimeout(() => this.startRolling(), 1000);
    }
    
    setupThemeObserver() {
        // Watch for theme changes on both body and html elements
        const observer = new MutationObserver((mutations) => {
            console.log('Theme mutation detected:', mutations);
            this.updateThemeColors();
        });
        
        // Watch body element
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        
        // Also watch html/document element
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });
        
        // Store observer for cleanup
        this.themeObserver = observer;
    }
    
    updateThemeColors() {
        console.log('updateThemeColors called');
        
        // Get new colors from CSS variables
        const newBgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary') || '#ffffff';
        const newGroundColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-secondary') || '#f5f5f7';
        const newCompanionColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') || '#86868b';
        
        console.log('New BG Color:', newBgColor);
        console.log('New Ground Color:', newGroundColor);
        console.log('New Companion Color:', newCompanionColor);
        console.log('Ground exists:', !!this.ground);
        
        // Create target colors
        const targetBgColor = new THREE.Color(newBgColor.trim());
        const targetGroundColor = new THREE.Color(newGroundColor.trim());
        const targetCompanionColor = new THREE.Color(newCompanionColor.trim());
        
        // Animate background color transition
        const currentBgColor = { r: this.scene.background.r, g: this.scene.background.g, b: this.scene.background.b };
        gsap.to(currentBgColor, {
            r: targetBgColor.r,
            g: targetBgColor.g,
            b: targetBgColor.b,
            duration: 0.6,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.scene.background.setRGB(currentBgColor.r, currentBgColor.g, currentBgColor.b);
            }
        });
        
        // Animate ground color transition
        if (this.ground && this.ground.material) {
            console.log('Animating ground color from', this.ground.material.color, 'to', targetGroundColor);
            const currentGroundColor = { 
                r: this.ground.material.color.r, 
                g: this.ground.material.color.g, 
                b: this.ground.material.color.b 
            };
            gsap.to(currentGroundColor, {
                r: targetGroundColor.r,
                g: targetGroundColor.g,
                b: targetGroundColor.b,
                duration: 0.6,
                ease: 'power2.inOut',
                onUpdate: () => {
                    this.ground.material.color.setRGB(currentGroundColor.r, currentGroundColor.g, currentGroundColor.b);
                }
            });
        } else {
            console.warn('Ground or ground material not found');
        }
        
        // Animate all companion cube colors to match new secondary text color
        this.companionCubes.forEach((cube) => {
            if (cube && cube.material) {
                const currentCubeColor = { 
                    r: cube.material.color.r, 
                    g: cube.material.color.g, 
                    b: cube.material.color.b 
                };
                gsap.to(currentCubeColor, {
                    r: targetCompanionColor.r,
                    g: targetCompanionColor.g,
                    b: targetCompanionColor.b,
                    duration: 0.6,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                        cube.material.color.setRGB(currentCubeColor.r, currentCubeColor.g, currentCubeColor.b);
                    }
                });
            }
        });
    }
    
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Get background color from CSS variable
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary') || '#ffffff';
        this.scene.background = new THREE.Color(bgColor.trim());
        
        // Create camera - isometric view
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 10;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );
        
        // Position camera for isometric view
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = false; // Disable shadows
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupLights() {
        // Ambient light for base illumination
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        // Orbiting directional light (will follow camera at 90° offset)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.castShadow = false; // No shadows
        this.scene.add(this.directionalLight);
        
        // Point light above the main cube for extra illumination
        this.pointLight = new THREE.PointLight(0xffffff, 0.3, 20);
        this.pointLight.position.set(0, 5, 0);
        this.pointLight.castShadow = false;
        this.scene.add(this.pointLight);
    }
    
    createGround() {
        // Get ground color from CSS variable (slightly darker than background)
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-secondary') || '#f5f5f7';
        
        // Create ground plane with Phong material for specularity
        const groundGeometry = new THREE.PlaneGeometry(this.gridSize * 2, this.gridSize * 2);
        const groundMaterial = new THREE.MeshPhongMaterial({ 
            color: bgColor.trim(),
            shininess: 15, // Low shininess for subtle specularity
            specular: 0x444444 // Subtle gray specular highlight
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = 0; // Make sure ground is at y=0
        this.scene.add(this.ground);
    }
    
    createBlock() {
        // Get accent color
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || '#0071e3';
        
        // Create cube with Lambert material (responds to directional lighting)
        const geometry = new THREE.BoxGeometry(this.blockSize, this.blockSize, this.blockSize);
        const material = new THREE.MeshLambertMaterial({ 
            color: accentColor
        });
        
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }
    
    createCompanionCubes() {
        // Get secondary text color for companion cubes
        const companionColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') || '#86868b';
        
        // Generate random starting positions for 4 cubes
        const occupiedPositions = new Set([`${this.blockPosition.x},${this.blockPosition.y}`]);
        
        for (let i = 0; i < 4; i++) {
            let position;
            let attempts = 0;
            
            // Find a unique random position within range
            do {
                const distance = Math.floor(Math.random() * 5) + 2; // 2-6 units away
                const angle = Math.random() * Math.PI * 2;
                const x = Math.round(this.blockPosition.x + Math.cos(angle) * distance);
                const y = Math.round(this.blockPosition.y + Math.sin(angle) * distance);
                position = { x, y };
                attempts++;
            } while (occupiedPositions.has(`${position.x},${position.y}`) && attempts < 50);
            
            occupiedPositions.add(`${position.x},${position.y}`);
            
            // Add to companion data with random delay
            this.companionData.push({
                position: position,
                isMoving: false,
                rollProgress: 0,
                startPos: null,
                endPos: null,
                reactionDelay: 0, // Will be set when reaction is triggered
                reactionTimer: 0  // Countdown timer
            });
            
            // Create the mesh with Lambert material (responds to lighting)
            const geometry = new THREE.BoxGeometry(this.blockSize * 0.9, this.blockSize * 0.9, this.blockSize * 0.9);
            const material = new THREE.MeshLambertMaterial({ 
                color: companionColor.trim()
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                position.x,
                this.blockSize / 2,
                position.y
            );
            this.scene.add(cube);
            
            this.companionCubes.push(cube);
            
            // Initialize trail arrays for this companion
            this.companionTrails.push([]);
            this.companionTrailMeshes.push([]);
        }
    }
    
    onResize() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 10;
        
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    start() {
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.updateCamera();
        this.updateTrailVisuals();
        this.renderer.render(this.scene, this.camera);
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    updateTrailVisuals() {
        // Update main cube trail tiles
        this.trailMeshes.forEach((mesh, index) => {
            const age = this.trailMeshes.length - index;
            
            // Only the oldest tile (10th step) scales down
            if (index === 0 && this.trailMeshes.length >= this.maxTrailLength) {
                // This is the oldest tile about to be removed
                // Animate it to scale 0 and fade out
                const progress = mesh.userData.fadeProgress || 0;
                mesh.userData.fadeProgress = Math.min(progress + 0.05, 1);
                
                const scale = 1.0 - mesh.userData.fadeProgress;
                mesh.scale.set(scale, scale, scale);
                mesh.material.opacity = (1.0 - mesh.userData.fadeProgress) * 0.8;
            } else {
                // All other tiles stay at full size and opacity
                mesh.scale.set(1, 1, 1);
                mesh.material.opacity = 0.8;
            }
        });
        
        // Update companion trail tiles
        this.companionTrailMeshes.forEach((trailMeshes, companionIndex) => {
            trailMeshes.forEach((mesh, index) => {
                // Only the oldest tile scales down
                if (index === 0 && trailMeshes.length >= this.maxTrailLength) {
                    const progress = mesh.userData.fadeProgress || 0;
                    mesh.userData.fadeProgress = Math.min(progress + 0.05, 1);
                    
                    const scale = 1.0 - mesh.userData.fadeProgress;
                    mesh.scale.set(scale, scale, scale);
                    mesh.material.opacity = (1.0 - mesh.userData.fadeProgress) * 0.6;
                } else {
                    mesh.scale.set(1, 1, 1);
                    mesh.material.opacity = 0.6;
                }
            });
        });
    }
    
    updateCamera() {
        // Slowly orbit the camera around the cube's current position
        this.cameraAngle += this.cameraOrbitSpeed;
        
        // Get cube's current position
        const cubeX = this.cube.position.x;
        const cubeZ = this.cube.position.z;
        
        // Calculate camera position relative to cube
        const x = cubeX + Math.cos(this.cameraAngle) * this.cameraDistance;
        const z = cubeZ + Math.sin(this.cameraAngle) * this.cameraDistance;
        
        this.camera.position.set(x, this.cameraHeight, z);
        // Look at the cube
        this.camera.lookAt(cubeX, 0, cubeZ);
        
        // Update point light to follow the main cube
        if (this.pointLight) {
            this.pointLight.position.set(cubeX, 5, cubeZ);
        }
        
        // Update directional light to orbit at 90° offset from camera
        if (this.directionalLight) {
            const lightAngle = this.cameraAngle + this.lightOffset;
            const lightX = cubeX + Math.cos(lightAngle) * this.cameraDistance;
            const lightZ = cubeZ + Math.sin(lightAngle) * this.cameraDistance;
            
            this.directionalLight.position.set(lightX, this.cameraHeight, lightZ);
            // Make light point at the cube
            this.directionalLight.target.position.set(cubeX, 0, cubeZ);
            this.directionalLight.target.updateMatrixWorld();
        }
    }
    
    update() {
        // Update main cube
        if (this.isRolling && this.rollEndPos) {
            this.rollProgress += this.rollSpeed;
            
            if (this.rollProgress >= 1) {
                // Roll complete - use eased final position to prevent pop
                this.rollProgress = 1; // Clamp to exactly 1
                this.animateRoll(); // Do final frame with easing
                
                // Now finalize the position with exact integer coordinates
                this.blockPosition = { x: this.rollEndPos.x, y: this.rollEndPos.z };
                this.rollProgress = 0;
                this.isRolling = false;
                this.rollEndPos = null;
                this.rollStartPos = null;
                this.rollAxis = null;
                
                // Add to trail at exact final position
                // blockPosition.y is actually the Z coordinate in 3D space
                this.addToTrail(this.blockPosition.x, this.blockPosition.y);
                
                // Make all companion cubes react with random delays
                this.companionData.forEach((data, index) => {
                    // Set random delay between 0 and 0.5 seconds
                    data.reactionDelay = Math.random() * 0.5;
                    data.reactionTimer = data.reactionDelay;
                });
                
                // Start next roll after a brief pause
                setTimeout(() => this.startRolling(), 200);
            } else {
                // Animate rolling
                this.animateRoll();
            }
        }
        
        // Update all companion cubes
        this.companionData.forEach((data, index) => {
            // Handle reaction delay countdown
            if (data.reactionTimer > 0) {
                data.reactionTimer -= 0.016; // Approximate frame time
                if (data.reactionTimer <= 0) {
                    data.reactionTimer = 0;
                    // Trigger the actual reaction now
                    this.executeCompanionReaction(data, index);
                }
            }
            
            // Update movement animation
            if (data.isMoving && data.endPos) {
                data.rollProgress += this.rollSpeed * 1.2; // Slightly faster to escape
                
                if (data.rollProgress >= 1) {
                    data.rollProgress = 1;
                    this.animateCompanionCube(data, index);
                    
                    // Finalize companion cube position
                    data.position = { x: data.endPos.x, y: data.endPos.z };
                    data.rollProgress = 0;
                    data.isMoving = false;
                    data.endPos = null;
                    data.startPos = null;
                    
                    // Add to companion's trail
                    this.addToCompanionTrail(index, data.position.x, data.position.y);
                    
                    // Destroy any main trail tile at this position
                    this.destroyTrailAtPosition(data.position.x, data.position.y);
                } else {
                    this.animateCompanionCube(data, index);
                }
            }
        });
    }
    
    // Easing function for smooth roll animation
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    animateRoll() {
        const t = this.rollProgress;
        
        // Apply easing to the progress
        const easedT = this.easeInOutCubic(t);
        const angle = easedT * Math.PI / 2; // 0 to 90 degrees with easing
        
        // Calculate position along the roll path
        const startX = this.rollStartPos.x;
        const startZ = this.rollStartPos.z;
        const endX = this.rollEndPos.x;
        const endZ = this.rollEndPos.z;
        
        // Direction of roll
        const dx = endX - startX;
        const dz = endZ - startZ;
        
        // The cube rotates around an edge (bottom corner)
        const halfSize = this.blockSize / 2;
        
        // Calculate position and rotation for rolling motion
        // The cube pivots around its bottom edge, creating a circular arc
        let offsetX = 0;
        let offsetY = 0;
        let offsetZ = 0;
        
        // Distance from center to pivot point (diagonal of bottom face)
        const pivotRadius = halfSize * Math.sqrt(2);
        
        if (dx > 0) { // Rolling in +X direction (right)
            // Start position: center at halfSize up, pivot at bottom-right edge
            offsetX = halfSize + pivotRadius * Math.sin(angle) - halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            this.cube.rotation.set(0, 0, -angle);
        } else if (dx < 0) { // Rolling in -X direction (left)
            offsetX = -halfSize - pivotRadius * Math.sin(angle) + halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            this.cube.rotation.set(0, 0, angle);
        } else if (dz > 0) { // Rolling in +Z direction (forward)
            offsetZ = halfSize + pivotRadius * Math.sin(angle) - halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            this.cube.rotation.set(angle, 0, 0);
        } else if (dz < 0) { // Rolling in -Z direction (backward)
            offsetZ = -halfSize - pivotRadius * Math.sin(angle) + halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            this.cube.rotation.set(-angle, 0, 0);
        }
        
        // Ensure minimum height is half the cube size (sitting on ground)
        const minHeight = halfSize;
        offsetY = Math.max(offsetY, minHeight);
        
        // At the end of roll (easedT = 1), snap to exact final position
        if (easedT >= 0.99) {
            // Use exact integer grid coordinates for final position
            this.cube.position.set(
                Math.round(endX),  // Ensure exact integer position
                halfSize,           // Exact height (half block size)
                Math.round(endZ)    // Ensure exact integer position
            );
            // Reset rotation to 0 for clean grid alignment
            this.cube.rotation.set(0, 0, 0);
        } else {
            this.cube.position.set(
                startX + offsetX,
                offsetY,
                startZ + offsetZ
            );
        }
    }
    
    executeCompanionReaction(data, index) {
        // This is called after the delay timer expires
        this.companionCubeReact(data, index);
    }
    
    companionCubeReact(data, index) {
        if (data.isMoving) return;
        
        // Calculate distance to main cube
        const dx = data.position.x - this.blockPosition.x;
        const dz = data.position.y - this.blockPosition.y;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Desired range: stay between 2-4 units away
        const minDistance = 2;
        const maxDistance = 4;
        
        let directions = [];
        
        if (distance < minDistance) {
            // Too close! Move away
            const awayX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            const awayZ = dz > 0 ? 1 : (dz < 0 ? -1 : 0);
            
            // Primary escape directions (directly away)
            if (awayX !== 0) directions.push({ x: awayX, z: 0, priority: 1 });
            if (awayZ !== 0) directions.push({ x: 0, z: awayZ, priority: 1 });
            
            // Secondary escape directions (diagonal)
            if (awayX !== 0 && awayZ !== 0) {
                directions.push({ x: awayX, z: awayZ, priority: 2 });
            }
            
        } else if (distance > maxDistance) {
            // Too far! Move closer
            const towardsX = dx < 0 ? 1 : (dx > 0 ? -1 : 0);
            const towardsZ = dz < 0 ? 1 : (dz > 0 ? -1 : 0);
            
            // Primary approach directions (directly towards)
            if (towardsX !== 0) directions.push({ x: towardsX, z: 0, priority: 1 });
            if (towardsZ !== 0) directions.push({ x: 0, z: towardsZ, priority: 1 });
            
            // Secondary approach directions (diagonal)
            if (towardsX !== 0 && towardsZ !== 0) {
                directions.push({ x: towardsX, z: towardsZ, priority: 2 });
            }
            
        } else {
            // In sweet spot - maybe orbit/stay put or move randomly
            return;
        }
        
        const gridBounds = this.gridSize / 2;
        
        // Filter valid directions (check grid bounds AND collision with other cubes)
        const validDirections = directions.filter(dir => {
            const newX = data.position.x + dir.x;
            const newZ = data.position.y + dir.z;
            
            // Check grid bounds
            if (Math.abs(newX) >= gridBounds || Math.abs(newZ) >= gridBounds) {
                return false;
            }
            
            // Check collision with main cube
            if (newX === this.blockPosition.x && newZ === this.blockPosition.y) {
                return false;
            }
            
            // Check collision with other companion cubes (current position AND target position)
            const wouldCollide = this.companionData.some((otherData, otherIndex) => {
                if (otherIndex === index) return false; // Don't check against self
                
                // Check current position
                if (otherData.position.x === newX && otherData.position.y === newZ) {
                    return true;
                }
                
                // Check if another companion is currently moving to this position
                if (otherData.isMoving && otherData.endPos) {
                    if (otherData.endPos.x === newX && otherData.endPos.z === newZ) {
                        return true;
                    }
                }
                
                return false;
            });
            
            return !wouldCollide;
        });
        
        if (validDirections.length === 0) return;
        
        // Sort by priority and choose best option
        validDirections.sort((a, b) => a.priority - b.priority);
        const direction = validDirections[0];
        
        data.startPos = {
            x: data.position.x,
            z: data.position.y
        };
        
        data.endPos = {
            x: data.position.x + direction.x,
            z: data.position.y + direction.z
        };
        
        data.isMoving = true;
        data.rollProgress = 0;
    }
    
    animateCompanionCube(data, index) {
        const cube = this.companionCubes[index];
        if (!cube) return;
        
        const t = data.rollProgress;
        const easedT = this.easeInOutCubic(t);
        const angle = easedT * Math.PI / 2;
        
        const startX = data.startPos.x;
        const startZ = data.startPos.z;
        const endX = data.endPos.x;
        const endZ = data.endPos.z;
        
        const dx = endX - startX;
        const dz = endZ - startZ;
        
        const halfSize = this.blockSize * 0.9 / 2;
        const pivotRadius = halfSize * Math.sqrt(2);
        
        let offsetX = 0;
        let offsetY = 0;
        let offsetZ = 0;
        
        if (dx > 0) {
            offsetX = halfSize + pivotRadius * Math.sin(angle) - halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            cube.rotation.set(0, 0, -angle);
        } else if (dx < 0) {
            offsetX = -halfSize - pivotRadius * Math.sin(angle) + halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            cube.rotation.set(0, 0, angle);
        } else if (dz > 0) {
            offsetZ = halfSize + pivotRadius * Math.sin(angle) - halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            cube.rotation.set(angle, 0, 0);
        } else if (dz < 0) {
            offsetZ = -halfSize - pivotRadius * Math.sin(angle) + halfSize;
            offsetY = halfSize + pivotRadius * Math.cos(angle) - halfSize * Math.sqrt(2);
            cube.rotation.set(-angle, 0, 0);
        }
        
        const minHeight = halfSize;
        offsetY = Math.max(offsetY, minHeight);
        
        if (easedT >= 0.99) {
            cube.position.set(
                Math.round(endX),
                halfSize,
                Math.round(endZ)
            );
            cube.rotation.set(0, 0, 0);
        } else {
            cube.position.set(
                startX + offsetX,
                offsetY,
                startZ + offsetZ
            );
        }
    }
    
    startRolling() {
        if (this.isRolling) return;
        
        // Randomly select a companion cube to chase
        if (this.companionData.length === 0) {
            return;
        }
        
        const targetCompanion = this.companionData[Math.floor(Math.random() * this.companionData.length)];
        
        // Calculate direction towards target companion
        const dx = targetCompanion.position.x - this.blockPosition.x;
        const dz = targetCompanion.position.y - this.blockPosition.y;
        
        const directions = [
            { x: 1, z: 0 },   // right
            { x: -1, z: 0 },  // left
            { x: 0, z: 1 }    // forward
        ];
        
        // Prioritize directions that move towards the target
        const directionsPrioritized = directions.map(dir => {
            // Calculate how much this direction moves us towards target
            const newX = this.blockPosition.x + dir.x;
            const newZ = this.blockPosition.y + dir.z;
            const newDx = targetCompanion.position.x - newX;
            const newDz = targetCompanion.position.y - newZ;
            const newDistance = Math.sqrt(newDx * newDx + newDz * newDz);
            
            // Lower distance = better (higher priority)
            return { ...dir, priority: newDistance };
        });
        
        const gridBounds = this.gridSize / 2;
        
        // Filter valid directions (stay within grid AND not already visited)
        const validDirections = directionsPrioritized.filter(dir => {
            const newX = this.blockPosition.x + dir.x;
            const newZ = this.blockPosition.y + dir.z;
            
            // Check grid bounds
            if (Math.abs(newX) >= gridBounds || Math.abs(newZ) >= gridBounds) {
                return false;
            }
            
            // Check if position already visited (in trail)
            const posKey = `${newX},${newZ}`;
            const alreadyVisited = this.trail.some(pos => `${pos.x},${pos.z}` === posKey);
            
            return !alreadyVisited;
        });
        
        if (validDirections.length === 0) {
            // No valid moves, reset position
            this.blockPosition = { x: 0, y: 0 };
            this.cube.position.set(0, this.blockSize / 2, 0);
            this.cube.rotation.set(0, 0, 0);
            
            // Clear trail meshes
            this.trailMeshes.forEach(mesh => this.scene.remove(mesh));
            this.trailMeshes = [];
            this.trail = [];
            
            this.addToTrail(0, 0);
            setTimeout(() => this.startRolling(), 1000);
            return;
        }
        
        // Sort by priority (lowest distance first) and choose best direction
        validDirections.sort((a, b) => a.priority - b.priority);
        const direction = validDirections[0];
        
        this.rollStartPos = {
            x: this.blockPosition.x,
            z: this.blockPosition.y
        };
        
        this.rollEndPos = {
            x: this.blockPosition.x + direction.x,
            z: this.blockPosition.y + direction.z
        };
        
        this.isRolling = true;
        this.rollProgress = 0;
    }
    
    findTileAtPosition(x, z) {
        // Search in main trail
        for (let i = 0; i < this.trailMeshes.length; i++) {
            const mesh = this.trailMeshes[i];
            if (Math.abs(mesh.position.x - x) < 0.01 && Math.abs(mesh.position.z - z) < 0.01) {
                return { mesh, type: 'main', index: i };
            }
        }
        
        // Search in companion trails
        for (let companionIndex = 0; companionIndex < this.companionTrailMeshes.length; companionIndex++) {
            const trailMeshes = this.companionTrailMeshes[companionIndex];
            for (let i = 0; i < trailMeshes.length; i++) {
                const mesh = trailMeshes[i];
                if (Math.abs(mesh.position.x - x) < 0.01 && Math.abs(mesh.position.z - z) < 0.01) {
                    return { mesh, type: 'companion', companionIndex, index: i };
                }
            }
        }
        
        return null;
    }
    
    replaceTileWithMainTile(existingTile, x, z) {
        // Remove the existing tile from its array and scene
        if (existingTile.type === 'main') {
            this.trailMeshes.splice(existingTile.index, 1);
            this.trail.splice(existingTile.index, 1);
        } else if (existingTile.type === 'companion') {
            this.companionTrailMeshes[existingTile.companionIndex].splice(existingTile.index, 1);
            this.companionTrails[existingTile.companionIndex].splice(existingTile.index, 1);
        }
        
        existingTile.mesh.geometry.dispose();
        existingTile.mesh.material.dispose();
        this.scene.remove(existingTile.mesh);
        
        // Create new main tile
        this.trail.push({ x, z });
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || '#0071e3';
        const geometry = new THREE.PlaneGeometry(this.blockSize * 0.9, this.blockSize * 0.9);
        const material = new THREE.MeshBasicMaterial({ 
            color: accentColor.trim(),
            opacity: 0.8,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const tile = new THREE.Mesh(geometry, material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0.002, z);
        tile.receiveShadow = true;
        tile.userData.tileType = 'main';
        
        this.scene.add(tile);
        this.trailMeshes.push(tile);
    }
    
    replaceTileWithCompanionTile(existingTile, companionIndex, x, z) {
        // Remove the existing tile from its array and scene
        if (existingTile.type === 'main') {
            this.trailMeshes.splice(existingTile.index, 1);
            this.trail.splice(existingTile.index, 1);
        } else if (existingTile.type === 'companion') {
            this.companionTrailMeshes[existingTile.companionIndex].splice(existingTile.index, 1);
            this.companionTrails[existingTile.companionIndex].splice(existingTile.index, 1);
        }
        
        existingTile.mesh.geometry.dispose();
        existingTile.mesh.material.dispose();
        this.scene.remove(existingTile.mesh);
        
        // Create new companion tile
        this.companionTrails[companionIndex].push({ x, z });
        const companionColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') || '#86868b';
        const geometry = new THREE.PlaneGeometry(this.blockSize * 0.9, this.blockSize * 0.9);
        const material = new THREE.MeshBasicMaterial({ 
            color: companionColor.trim(),
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const tile = new THREE.Mesh(geometry, material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0.002, z);
        tile.receiveShadow = true;
        tile.userData.tileType = 'companion';
        tile.userData.companionIndex = companionIndex;
        
        this.scene.add(tile);
        this.companionTrailMeshes[companionIndex].push(tile);
    }
    
    destroyTrailAtPosition(x, z) {
        // Find trail tile at this position
        const posKey = `${x},${z}`;
        
        for (let i = 0; i < this.trail.length; i++) {
            const trailPos = this.trail[i];
            const trailKey = `${trailPos.x},${trailPos.z}`;
            
            if (trailKey === posKey) {
                // Found the tile to destroy
                const mesh = this.trailMeshes[i];
                
                if (mesh) {
                    // Animate the destruction
                    gsap.to(mesh.scale, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.3,
                        ease: 'back.in'
                    });
                    
                    gsap.to(mesh.material, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            // Remove from scene and dispose
                            mesh.geometry.dispose();
                            mesh.material.dispose();
                            this.scene.remove(mesh);
                        }
                    });
                    
                    // Remove from arrays
                    this.trail.splice(i, 1);
                    this.trailMeshes.splice(i, 1);
                }
                
                break;
            }
        }
    }
    
    addToCompanionTrail(companionIndex, x, z) {
        // Check if there's already a tile at this position
        const existingTile = this.findTileAtPosition(x, z);
        
        if (existingTile) {
            // Replace the existing tile with a companion tile
            this.replaceTileWithCompanionTile(existingTile, companionIndex, x, z);
            return;
        }
        
        // Always add new position to companion's trail
        this.companionTrails[companionIndex].push({ x, z });
        
        // Create visual trail tile with secondary text color (uniform size)
        const companionColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary') || '#86868b';
        const geometry = new THREE.PlaneGeometry(this.blockSize * 0.9, this.blockSize * 0.9);
        const material = new THREE.MeshBasicMaterial({ 
            color: companionColor.trim(),
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const tile = new THREE.Mesh(geometry, material);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0.002, z); // Same height as main tiles
        tile.receiveShadow = true;
        tile.userData.tileType = 'companion'; // Mark as companion tile
        tile.userData.companionIndex = companionIndex;
        
        this.scene.add(tile);
        this.companionTrailMeshes[companionIndex].push(tile);
        
        // Remove oldest trail tiles if we exceed max length
        while (this.companionTrailMeshes[companionIndex].length > this.maxTrailLength) {
            const oldestMesh = this.companionTrailMeshes[companionIndex].shift();
            const oldestTrail = this.companionTrails[companionIndex].shift();
            
            if (oldestMesh) {
                oldestMesh.geometry.dispose();
                oldestMesh.material.dispose();
                this.scene.remove(oldestMesh);
            }
        }
    }
    
    addToTrail(x, z) {
        // Check if there's already a tile at this position (from any source)
        const existingTile = this.findTileAtPosition(x, z);
        
        if (existingTile) {
            // Replace the existing tile with a new main cube tile
            this.replaceTileWithMainTile(existingTile, x, z);
            return;
        }
        
        // Always add new position to trail
        this.trail.push({ x, z });
        
        // Create visual trail tile as a plane with flat color (uniform size with companions)
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent') || '#0071e3';
        const geometry = new THREE.PlaneGeometry(this.blockSize * 0.9, this.blockSize * 0.9);
        const material = new THREE.MeshBasicMaterial({ 
            color: accentColor.trim(),
            opacity: 0.8,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const tile = new THREE.Mesh(geometry, material);
        tile.rotation.x = -Math.PI / 2; // Rotate to lie flat on ground
        tile.position.set(x, 0.002, z);
        tile.receiveShadow = true;
        tile.userData.tileType = 'main'; // Mark as main cube tile
        
        this.scene.add(tile);
        this.trailMeshes.push(tile);
        
        // Remove oldest trail tiles if we exceed max length
        while (this.trailMeshes.length > this.maxTrailLength) {
            const oldestMesh = this.trailMeshes.shift();
            const oldestTrail = this.trail.shift();
            
            // Dispose and remove from scene
            if (oldestMesh) {
                oldestMesh.geometry.dispose();
                oldestMesh.material.dispose();
                this.scene.remove(oldestMesh);
            }
        }
    }
    
    dispose() {
        this.stop();
        
        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
                this.container.removeChild(this.renderer.domElement);
            }
        }
        
        // Dispose geometries and materials
        if (this.cube) {
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }
        
        this.trailMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.scene.remove(mesh);
        });
        
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        
        // Disconnect theme observer
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }
}

