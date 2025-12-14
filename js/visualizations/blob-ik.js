/**
 * 2D Blob IK Animation
 * Flattened blob system with inverse kinematics and visible line connections
 */

import * as THREE from 'three';

// Default settings for blob IK animation
export const BLOB_IK_SETTINGS = {
    blobs: {
        count: 15,
        minSize: 0.3,
        maxSize: 1.4,
        color: "var(--color-bg-primary)",
        accentColor: "var(--color-accent)",
        lineOpacity: 0.7,
        lineWidth: 3
    },
    physics: {
        gravity: 0.008, // Gentle gravity for natural settling
        damping: 0.95, // More damping to reduce jitter
        maxVelocity: 0.3, // Lower max speed for smoother motion
        friction: 0.9, // Higher friction for more stability
        collisionRepulsion: 0.2, // Very soft collisions to minimize jitter
        rotationForce: 0, // No additional rotation force, just box rotation
        rotationSpeed: 0.15 // Slow steady rotation to see tumbling effect
    },
    camera: {
        fov: 20,
        positionZ: 15,
        canvasOpacity: 1.0
    },
    background: {
        color: "var(--color-bg-secondary)"
    }
};

export class BlobIK {
    constructor(container, settings = BLOB_IK_SETTINGS) {
        this.container = container;
        this.settings = settings;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.blobs = [];
        this.lines = [];
        this.animationId = null;
        this.time = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.isPaused = false;
        
        // Physics parameters - box boundary
        this.boundaries = {
            x: 7,
            y: 5
        };
        this.rotationAngle = 0; // Track rotation of the boundary box
        this.gravity = this.settings.physics.gravity;
        
        // Audio reactivity
        this.smoothedEnergy = 0;
        this.baseRotationSpeed = this.settings.physics.rotationSpeed;
        
        // Drag state
        this.isDragging = false;
        this.draggedBlob = null;
        this.dragOffset = new THREE.Vector2();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        
        // Rotation time for washing machine effect
        this.rotationTime = 0;
        
        this.init();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    renderSingleFrame(forceResize = false) {
        if (this.canvas) {
            this.canvas.style.animation = 'none';
        }
        
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
            
            if (this.canvas) {
                this.canvas.style.animation = 'none';
            }
            
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
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'blob-ik-canvas';
        this.container.appendChild(this.canvas);
        
        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = this.parseCSSColor(this.settings.background.color);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            this.settings.camera.fov, 
            width / height, 
            0.1, 
            1000
        );
        this.camera.position.z = this.settings.camera.positionZ;
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: false,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Track initial size
        this.lastWidth = width;
        this.lastHeight = height;
        
        // Calculate boundaries based on camera view
        this.updateBoundaries();
        
        // Create blobs (no connections)
        this.createBlobs();
        
        // Create visible boundary box
        this.createBoundaryBox();
        
        // Handle resize
        this.handleResize = this.onResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Setup drag handlers
        this.setupDragHandlers();
        
        // Start animation
        this.animate();
        
        // Don't add GUI controls (removed for cleaner experience)
        // this.setupGUI();
        
        // Theme change listener
        this.themeChangeHandler = this.handleThemeChange.bind(this);
        window.addEventListener('themechange', this.themeChangeHandler);
    }
    
    handleThemeChange() {
        // Update scene background
        this.scene.background = this.parseCSSColor(this.settings.background.color);
        
        // Update blob materials
        this.blobs.forEach(blob => {
            blob.material.color = this.parseCSSColor(this.settings.blobs.color);
            if (blob.children.length > 0) {
                blob.children[0].material.color = this.parseCSSColor(this.settings.blobs.accentColor);
            }
            if (blob.children.length > 1) {
                // Update outline color (second child is the outline)
                blob.children[1].material.color = this.parseCSSColor("var(--color-border)");
            }
        });
    }
    
    createBoundaryBox() {
        // Create boundary box edges
        const material = new THREE.LineBasicMaterial({ 
            color: 0xFF3333, // Bright red for visibility
            opacity: 0.8,
            transparent: true,
            linewidth: 2 // Note: linewidth > 1 not supported in WebGL
        });
        
        // Create geometry for boundary box
        const geometry = new THREE.BufferGeometry();
        const points = [];
        
        // Initial points, will be updated in updateBoundaries
        points.push(-this.boundaries.x, -this.boundaries.y, 0);  // Bottom-left
        points.push(this.boundaries.x, -this.boundaries.y, 0);   // Bottom-right
        points.push(this.boundaries.x, this.boundaries.y, 0);    // Top-right
        points.push(-this.boundaries.x, this.boundaries.y, 0);   // Top-left
        points.push(-this.boundaries.x, -this.boundaries.y, 0);  // Back to bottom-left to close the shape
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        // Create line mesh
        this.boundaryBox = new THREE.Line(geometry, material);
        this.scene.add(this.boundaryBox);
    }
    
    createBlobs() {
        const blobCount = this.settings.blobs.count;
        const blobColor = this.parseCSSColor(this.settings.blobs.color);
        const minSize = this.settings.blobs.minSize;
        const maxSize = this.settings.blobs.maxSize;
        
        // Create blobs in a loose formation (will settle with gravity)
        const spacing = this.settings.physics.springRestLength;
        
        for (let i = 0; i < blobCount; i++) {
            // Vary sizes
            const size = minSize + Math.random() * (maxSize - minSize);
            const geometry = new THREE.CircleGeometry(size, 32);
            
            const material = new THREE.MeshBasicMaterial({
                color: blobColor,
                transparent: false,
                opacity: 1.0
            });
            
            const blob = new THREE.Mesh(geometry, material);
            
            // Create inset indicator circle (1/10th the size)
            const indicatorSize = size / 10;
            const indicatorGeometry = new THREE.CircleGeometry(indicatorSize, 16);
            const indicatorMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor(this.settings.blobs.accentColor),
                transparent: false,
                opacity: 1.0
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            
            // Position indicator off-center (to the right)
            indicator.position.x = size * 0.5;
            indicator.position.y = 0;
            indicator.position.z = 0.01; // Slightly in front
            
            // Indicator Physics Data - Bouncing around inside
            indicator.userData = {
                velocity: { x: 0, y: 0 },
                radius: indicatorSize,
                baseColor: indicatorMaterial.color.clone()
            };
            
            // Add indicator as child of blob so it rotates with it
            blob.add(indicator);
            
            // Create outline/stroke using text color
            const outlineGeometry = new THREE.RingGeometry(size, size + 0.1, 32);
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: this.parseCSSColor("var(--color-border)"),
                transparent: false,
                opacity: 1.0,
                side: THREE.FrontSide
            });
            const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            outline.position.z = -0.01; // Position behind the blob
            
            // Add outline as child of blob so it moves and rotates with it
            blob.add(outline);
            
            // Position randomly throughout the box - they'll settle and tumble
            blob.position.x = (Math.random() - 0.5) * 8;
            blob.position.y = (Math.random() - 0.5) * 8;
            blob.position.z = 0;
            
            // Store physics data
            blob.userData = {
                velocity: {
                    x: 0,
                    y: 0
                },
                force: {
                    x: 0,
                    y: 0
                },
                baseSize: size,
                mass: size, // Bigger blobs are heavier
                index: i,
                rotation: 0, // Track rotation angle
                lastX: blob.position.x,
                lastY: blob.position.y
            };
            
            this.blobs.push(blob);
            this.scene.add(blob);
        }
    }
    
    // No connection lines needed - blobs are independent
    
    applyPhysics() {
        const damping = this.settings.physics.damping;
        const maxVelocity = this.settings.physics.maxVelocity;
        const collisionRepulsion = this.settings.physics.collisionRepulsion;
        const rotationForce = this.settings.physics.rotationForce;
        
        // Update rotation time
        this.rotationTime += this.settings.physics.rotationSpeed * 0.016; // ~60fps
        
        // Reset forces
        this.blobs.forEach(blob => {
            blob.userData.force.x = 0;
            blob.userData.force.y = 0;
        });
        
        // Apply washing machine rotation force (circular motion)
        this.blobs.forEach(blob => {
            if (blob !== this.draggedBlob) {
                // Calculate angle from center to blob
                const angle = Math.atan2(blob.position.y, blob.position.x);
                const rotatedAngle = angle + Math.PI / 2; // Perpendicular for circular motion
                
                // Apply tangential force for rotation
                blob.userData.force.x += Math.cos(rotatedAngle) * rotationForce * blob.userData.mass;
                blob.userData.force.y += Math.sin(rotatedAngle) * rotationForce * blob.userData.mass;
                
                // Add slight gravity downward
                blob.userData.force.y -= this.gravity * blob.userData.mass;
            }
        });
        
        // Blob-to-blob collisions
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                const blob1 = this.blobs[i];
                const blob2 = this.blobs[j];
                
                const dx = blob2.position.x - blob1.position.x;
                const dy = blob2.position.y - blob1.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const minDistance = blob1.userData.baseSize + blob2.userData.baseSize;
                
                if (distance < minDistance && distance > 0.01) {
                    const overlap = minDistance - distance;
                    const force = overlap * collisionRepulsion;
                    
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    if (blob1 !== this.draggedBlob) {
                        blob1.userData.force.x -= fx;
                        blob1.userData.force.y -= fy;
                    }
                    if (blob2 !== this.draggedBlob) {
                        blob2.userData.force.x += fx;
                        blob2.userData.force.y += fy;
                    }
                }
            }
        }
        
        // Apply forces and damping
        this.blobs.forEach(blob => {
            if (blob !== this.draggedBlob) {
                blob.userData.velocity.x += blob.userData.force.x / blob.userData.mass;
                blob.userData.velocity.y += blob.userData.force.y / blob.userData.mass;
                
                // Air resistance
                blob.userData.velocity.x *= damping;
                blob.userData.velocity.y *= damping;
                
                // Clamp velocity
                const speed = Math.sqrt(
                    blob.userData.velocity.x * blob.userData.velocity.x + 
                    blob.userData.velocity.y * blob.userData.velocity.y
                );
                if (speed > maxVelocity) {
                    blob.userData.velocity.x = (blob.userData.velocity.x / speed) * maxVelocity;
                    blob.userData.velocity.y = (blob.userData.velocity.y / speed) * maxVelocity;
                }
            }
        });
    }
    
    animate() {
        if (this.isPaused) return;
        this.animationId = requestAnimationFrame(() => this.animate());
        
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
            // Apply volume scaling
            const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
            
            if (avg > 10) {
                audioEnergy = (avg / 255) * volume;
                audioData = dataArray;
            }
        }
        
        // Immediately reset to 0 if no audio data or music not playing, otherwise smooth it
        if (!audioData || !isMusicPlaying) {
            this.smoothedEnergy = 0;
        } else {
            this.smoothedEnergy += (audioEnergy - this.smoothedEnergy) * 0.1;
        }
        
        // Rotation speed (constant, removed audio modulation)
        const currentRotationSpeed = this.settings.physics.rotationSpeed;
        
        this.time += 0.016; // Approximate 60fps delta time
        
        // Update rotation angle for the boundary box - continuous rotation
        this.rotationAngle += currentRotationSpeed * 0.016;
        if (this.rotationAngle > Math.PI * 2) {
            this.rotationAngle -= Math.PI * 2;
        }
        
            // Update boundary box rotation but keep it hidden
            if (this.boundaryBox) {
                this.boundaryBox.rotation.z = this.rotationAngle;
                this.boundaryBox.visible = false; // Hidden for cleaner look
            }
        
        // Apply physics to blobs
        this.blobs.forEach((blob, i) => {
            const userData = blob.userData;
            const indicator = blob.children[0]; // The accent-colored inner circle
            
            // Reset blob scale (don't scale the whole body)
            blob.scale.set(1, 1, 1);
            
            // Audio reactivity for Inner Circle (Indicator) - Bouncing Physics
            if (indicator) {
                const iData = indicator.userData;
                const limit = userData.baseSize * 0.9 - iData.radius; // Inner radius limit
                
                if (audioData) {
                    const binIndex = Math.floor((i / this.blobs.length) * (audioData.length / 2));
                    const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
                    const freqValue = (audioData[binIndex] / 255) * volume;
                    
                    // 1. Scale Pulse (Boosted sensitivity)
                    const pulse = 1 + (freqValue * 5.0) + (this.smoothedEnergy * 0.8);
                    indicator.scale.set(pulse, pulse, pulse);
                    
                    // 2. Color Pulse (Blue -> Red) - Sharp transition
                    const redColor = new THREE.Color(1, 0, 0);
                    // Create a steep curve to minimize purple state
                    // 0.0-0.4 = Blue, 0.4-0.7 = Fast transition, 0.7+ = Red
                    const threshold = 0.4;
                    // Boost input frequency by 1.5x to trigger red more easily at lower volumes
                    const mix = Math.max(0, Math.min(1, (freqValue * 1.5 - threshold) * 3));
                    indicator.material.color.lerpColors(iData.baseColor, redColor, mix);
                    
                    // 3. Velocity Kick on Beat (Lower threshold)
                    if (freqValue > 0.3) {
                        const kick = freqValue * 0.08;
                        iData.velocity.x += (Math.random() - 0.5) * kick;
                        iData.velocity.y += (Math.random() - 0.5) * kick;
                    }
                } else {
                    indicator.scale.set(1, 1, 1);
                    indicator.material.color.copy(iData.baseColor);
                }
                
                // Update position
                indicator.position.x += iData.velocity.x;
                indicator.position.y += iData.velocity.y;
                
                // Bounce off walls (Circular container)
                const distSq = indicator.position.x**2 + indicator.position.y**2;
                if (distSq > limit**2) {
                    const dist = Math.sqrt(distSq);
                    const nx = indicator.position.x / dist;
                    const ny = indicator.position.y / dist;
                    
                    // Push back inside
                    indicator.position.x = nx * limit;
                    indicator.position.y = ny * limit;
                    
                    // Reflect velocity
                    const dot = iData.velocity.x * nx + iData.velocity.y * ny;
                    iData.velocity.x -= 2 * dot * nx;
                    iData.velocity.y -= 2 * dot * ny;
                    
                    // Damping
                    iData.velocity.x *= 0.8;
                    iData.velocity.y *= 0.8;
                }
                
                // Friction
                iData.velocity.x *= 0.95;
                iData.velocity.y *= 0.95;
            } else if (indicator) {
                // Should be covered above, but fallback
                indicator.scale.set(1, 1, 1);
                indicator.position.set(userData.baseSize * 0.5, 0, 0.01);
            }
            
            // Skip physics for dragged blob
            if (this.isDragging && blob === this.draggedBlob) {
                return;
            }
            
            // Apply gravity (always points down in global coordinates)
            // This causes balls to fall toward the bottom of the screen
            // As the box rotates, they naturally pile up in the "lowest" corner
            userData.velocity.y -= this.gravity;
            
            // Apply damping (air resistance)
            userData.velocity.x *= this.settings.physics.damping;
            userData.velocity.y *= this.settings.physics.damping;
            
            // Limit maximum velocity
            const speed = Math.sqrt(userData.velocity.x * userData.velocity.x + userData.velocity.y * userData.velocity.y);
            if (speed > this.settings.physics.maxVelocity) {
                const scale = this.settings.physics.maxVelocity / speed;
                userData.velocity.x *= scale;
                userData.velocity.y *= scale;
            }
            
            // Velocity threshold to reduce jitter (sleep when nearly stationary)
            if (speed < 0.001) {
                userData.velocity.x *= 0.5;
                userData.velocity.y *= 0.5;
            }
            
            // Update position
            blob.position.x += userData.velocity.x;
            blob.position.y += userData.velocity.y;
            
            // Blob-to-blob collisions
            for (let j = i + 1; j < this.blobs.length; j++) {
                const otherBlob = this.blobs[j];
                const otherData = otherBlob.userData;
                
                const dx = otherBlob.position.x - blob.position.x;
                const dy = otherBlob.position.y - blob.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = userData.baseSize + otherData.baseSize;
                
                if (distance < minDistance) {
                    // Push away from each other
                    const overlap = minDistance - distance;
                    const pushX = (dx / distance) * overlap * 0.5 * this.settings.physics.collisionRepulsion;
                    const pushY = (dy / distance) * overlap * 0.5 * this.settings.physics.collisionRepulsion;
                    
                    userData.velocity.x -= pushX;
                    userData.velocity.y -= pushY;
                    otherData.velocity.x += pushX;
                    otherData.velocity.y += pushY;
                    
                    // No rotation effects from collisions
                }
            }
            
            // Calculate rotation based on movement (rolling physics)
            const dx = blob.position.x - userData.lastX;
            const dy = blob.position.y - userData.lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0.001) {
                // Rolling rotation: balls rotate naturally based on their movement
                // The amount of rotation = distance traveled / radius
                const rotationDelta = distance / userData.baseSize;
                
                // Calculate the direction of rotation based on movement
                // Movement to the right = counter-clockwise rotation (negative)
                // Movement to the left = clockwise rotation (positive)
                const movementAngle = Math.atan2(dy, dx);
                
                // Apply rotation in the appropriate direction
                // We use the perpendicular angle to determine rotation direction
                const rotationSign = -Math.sign(Math.cos(movementAngle));
                
                // Initialize rotation if needed
                if (userData.rotation === undefined) {
                    userData.rotation = 0;
                }
                
                // Update rotation
                userData.rotation += rotationDelta * rotationSign;
                blob.rotation.z = userData.rotation;
            }
            
            // Update last position for next frame
            userData.lastX = blob.position.x;
            userData.lastY = blob.position.y;
            
            // Rotating box boundary containment with friction
            const friction = this.settings.physics.friction;
            const bounce = 0.02; // Minimal bounce to reduce jitter
            
            // Transform blob position into rotated box coordinate system
            // We need this to check if the blob is colliding with the rotating box boundaries
            const cosAngle = Math.cos(-this.rotationAngle);
            const sinAngle = Math.sin(-this.rotationAngle);
            const rotatedX = blob.position.x * cosAngle - blob.position.y * sinAngle;
            const rotatedY = blob.position.x * sinAngle + blob.position.y * cosAngle;
            
            // Transform velocity into rotated space
            const velRotatedX = userData.velocity.x * cosAngle - userData.velocity.y * sinAngle;
            const velRotatedY = userData.velocity.x * sinAngle + userData.velocity.y * cosAngle;
            
            // Check boundaries in rotated space
            let hitBoundary = false;
            let newRotatedX = rotatedX;
            let newRotatedY = rotatedY;
            let newVelRotatedX = velRotatedX;
            let newVelRotatedY = velRotatedY;
            
            // Left and right walls in rotated space
            if (rotatedX < -this.boundaries.x) {
                newRotatedX = -this.boundaries.x;
                newVelRotatedX = -velRotatedX * bounce;
                newVelRotatedY *= friction; // Friction along wall
                hitBoundary = true;
            } else if (rotatedX > this.boundaries.x) {
                newRotatedX = this.boundaries.x;
                newVelRotatedX = -velRotatedX * bounce;
                newVelRotatedY *= friction;
                hitBoundary = true;
            }
            
            // Floor and ceiling in rotated space
            if (rotatedY < -this.boundaries.y) {
                newRotatedY = -this.boundaries.y;
                newVelRotatedY = -velRotatedY * bounce;
                newVelRotatedX *= friction; // Friction on floor
                hitBoundary = true;
            } else if (rotatedY > this.boundaries.y) {
                newRotatedY = this.boundaries.y;
                newVelRotatedY = -velRotatedY * bounce;
                newVelRotatedX *= friction;
                hitBoundary = true;
            }
            
            if (hitBoundary) {
                // Transform position back to world coordinates
                blob.position.x = newRotatedX * cosAngle + newRotatedY * sinAngle;
                blob.position.y = -newRotatedX * sinAngle + newRotatedY * cosAngle;
                
                // Transform velocity back to world coordinates
                userData.velocity.x = newVelRotatedX * cosAngle + newVelRotatedY * sinAngle;
                userData.velocity.y = -newVelRotatedX * sinAngle + newVelRotatedY * cosAngle;
                
                // No rotation from wall collisions
            }
        });
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    setupDragHandlers() {
        // Enable pointer events on canvas
        this.canvas.style.cursor = 'grab';
        this.canvas.style.pointerEvents = 'auto';
        
        // Apply a fixed square boundary on startup if needed
        this.updateBoundaries();
        
        // Mouse/touch move handler
        this.handlePointerMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            // Convert to normalized device coordinates (-1 to +1)
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            
            if (this.isDragging && this.draggedBlob) {
                // Update raycaster
                this.raycaster.setFromCamera(this.mouse, this.camera);
                
                // Calculate intersection with z=0 plane
                const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                const intersectPoint = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(plane, intersectPoint);
                
                // Update blob position with offset
                this.draggedBlob.position.x = intersectPoint.x + this.dragOffset.x;
                this.draggedBlob.position.y = intersectPoint.y + this.dragOffset.y;
                
                // Reset velocity when dragging
                this.draggedBlob.userData.velocity.x = 0;
                this.draggedBlob.userData.velocity.y = 0;
                
                // Keep within bounds while dragging
                this.draggedBlob.position.x = Math.max(-this.boundaries.x, Math.min(this.boundaries.x, this.draggedBlob.position.x));
                this.draggedBlob.position.y = Math.max(-this.boundaries.y, Math.min(this.boundaries.y, this.draggedBlob.position.y));
            }
        };
        
        // Mouse/touch down handler
        this.handlePointerDown = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let clientX, clientY;
            
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            
            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            
            // Update raycaster
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Check for intersections
            const intersects = this.raycaster.intersectObjects(this.blobs);
            
            if (intersects.length > 0) {
                this.isDragging = true;
                this.draggedBlob = intersects[0].object;
                
                // Calculate offset from blob center to click point
                const intersectPoint = intersects[0].point;
                this.dragOffset.x = this.draggedBlob.position.x - intersectPoint.x;
                this.dragOffset.y = this.draggedBlob.position.y - intersectPoint.y;
                
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
                
                // Signal that visualization is using drag
                window.isVisualizationDragging = true;
            }
        };
        
        // Mouse/touch up handler
        this.handlePointerUp = (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.draggedBlob = null;
                this.canvas.style.cursor = 'grab';
                
                // Clear visualization drag flag
                window.isVisualizationDragging = false;
            }
            
            // Stop propagation to prevent app-level swipe handler from firing
            if (this.isDragging) {
                e.stopPropagation();
            }
        };
        
        // Add event listeners
        this.canvas.addEventListener('mousedown', this.handlePointerDown);
        this.canvas.addEventListener('mousemove', this.handlePointerMove);
        this.canvas.addEventListener('mouseup', this.handlePointerUp);
        this.canvas.addEventListener('mouseleave', this.handlePointerUp);
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handlePointerDown, { passive: false });
        this.canvas.addEventListener('touchmove', this.handlePointerMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handlePointerUp);
        this.canvas.addEventListener('touchcancel', this.handlePointerUp);
    }
    
    updateBoundaries() {
        // Calculate visible area based on camera FOV and position
        const vFov = (this.camera.fov * Math.PI) / 180;
        const height = 2 * Math.tan(vFov / 2) * this.camera.position.z;
        const width = height * this.camera.aspect;
        
        // Use actual viewport dimensions for rectangular boundary (not square)
        // Set boundaries with margin
        this.boundaries.x = (width / 2) - 0.5;
        this.boundaries.y = (height / 2) - 0.5;
        
        // Update boundary box geometry if it exists
        if (this.boundaryBox) {
            const positions = this.boundaryBox.geometry.attributes.position.array;
            
            // Update vertices for the rectangular box matching viewport
            // Bottom-left
            positions[0] = -this.boundaries.x;
            positions[1] = -this.boundaries.y;
            
            // Bottom-right
            positions[3] = this.boundaries.x;
            positions[4] = -this.boundaries.y;
            
            // Top-right
            positions[6] = this.boundaries.x;
            positions[7] = this.boundaries.y;
            
            // Top-left
            positions[9] = -this.boundaries.x;
            positions[10] = this.boundaries.y;
            
            // Back to bottom-left
            positions[12] = -this.boundaries.x;
            positions[13] = -this.boundaries.y;
            
            this.boundaryBox.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    onResize() {
        if (!this.container || !this.renderer) return;
        
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Update boundaries when resizing
        this.updateBoundaries();
    }
    
    dispose() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Remove drag event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handlePointerDown);
            this.canvas.removeEventListener('mousemove', this.handlePointerMove);
            this.canvas.removeEventListener('mouseup', this.handlePointerUp);
            this.canvas.removeEventListener('mouseleave', this.handlePointerUp);
            this.canvas.removeEventListener('touchstart', this.handlePointerDown);
            this.canvas.removeEventListener('touchmove', this.handlePointerMove);
            this.canvas.removeEventListener('touchend', this.handlePointerUp);
            this.canvas.removeEventListener('touchcancel', this.handlePointerUp);
        }
        
        // Dispose Three.js resources
        this.blobs.forEach(blob => {
            // Dispose indicator if exists
            if (blob.children.length > 0) {
                blob.children[0].geometry.dispose();
                blob.children[0].material.dispose();
            }
            blob.geometry.dispose();
            blob.material.dispose();
            this.scene.remove(blob);
        });
        
        // Dispose boundary box
        if (this.boundaryBox) {
            this.boundaryBox.geometry.dispose();
            this.boundaryBox.material.dispose();
            this.scene.remove(this.boundaryBox);
        }
        
        // Dispose GUI if it exists
        if (this.gui) {
            try {
                this.gui.destroy();
            } catch (error) {
                console.error('Error disposing GUI:', error);
            }
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Remove theme change listener
        window.removeEventListener('themechange', this.themeChangeHandler);
    }

    setupGUI() {
        // Check if dat.GUI is available
        if (typeof dat === 'undefined') {
            console.log('dat.GUI not found. Skipping GUI setup.');
            return;
        }
        
        try {
            // Create GUI
            this.gui = new dat.GUI({ name: 'Blob Physics Controls' });
            this.gui.domElement.style.zIndex = 1000; // Ensure it's above other elements
            this.gui.domElement.style.position = 'absolute';
            this.gui.domElement.style.top = '10px';
            this.gui.domElement.style.right = '10px';
            
            // Save reference to the parent element
            this.guiContainer = this.gui.domElement.parentElement;
            
            // Organize into folders
            const physicsFolder = this.gui.addFolder('Physics');
            const blobsFolder = this.gui.addFolder('Blobs');
            
            // Physics controls
            physicsFolder.add(this.settings.physics, 'gravity', -1, 1, 0.01).name('Gravity');
            physicsFolder.add(this.settings.physics, 'damping', 0, 1, 0.01).name('Damping');
            physicsFolder.add(this.settings.physics, 'maxVelocity', 0, 1, 0.01).name('Max Velocity');
            physicsFolder.add(this.settings.physics, 'friction', 0, 1, 0.01).name('Friction');
            physicsFolder.add(this.settings.physics, 'collisionRepulsion', 0, 2, 0.01).name('Collision Repulsion');
            physicsFolder.add(this.settings.physics, 'rotationForce', 0, 1, 0.01).name('Rotation Force');
            physicsFolder.add(this.settings.physics, 'rotationSpeed', 0, 2, 0.01).name('Rotation Speed');
            
            // Blob controls
            blobsFolder.add(this.settings.blobs, 'count', 2, 20, 1).name('Count').onChange(() => {
                this.recreateBlobs();
            });
            blobsFolder.add(this.settings.blobs, 'minSize', 0.1, 2, 0.1).name('Min Size');
            blobsFolder.add(this.settings.blobs, 'maxSize', 0.1, 2, 0.1).name('Max Size');
            blobsFolder.addColor(this.settings.blobs, 'color').name('Color');
            blobsFolder.addColor(this.settings.blobs, 'accentColor').name('Accent Color');
            
            // Add copy to clipboard button
            const copyObj = { 'Copy Settings': () => this.copySettingsToClipboard() };
            this.gui.add(copyObj, 'Copy Settings');
            
            // Open folders by default
            physicsFolder.open();
            blobsFolder.open();
            
            console.log('GUI controls initialized');
        } catch (error) {
            console.error('Error setting up GUI:', error);
        }
    }
    
    copySettingsToClipboard() {
        const settingsText = `BLOB_IK_SETTINGS = {
    blobs: {
        count: ${this.settings.blobs.count},
        minSize: ${this.settings.blobs.minSize},
        maxSize: ${this.settings.blobs.maxSize},
        color: "${this.settings.blobs.color}",
        accentColor: "${this.settings.blobs.accentColor}",
        lineOpacity: ${this.settings.blobs.lineOpacity},
        lineWidth: ${this.settings.blobs.lineWidth}
    },
    physics: {
        gravity: ${this.settings.physics.gravity},
        damping: ${this.settings.physics.damping},
        maxVelocity: ${this.settings.physics.maxVelocity},
        friction: ${this.settings.physics.friction},
        collisionRepulsion: ${this.settings.physics.collisionRepulsion},
        rotationForce: ${this.settings.physics.rotationForce},
        rotationSpeed: ${this.settings.physics.rotationSpeed}
    },
    background: {
        color: "${this.settings.background.color}"
    }
};`;
        
        navigator.clipboard.writeText(settingsText).then(() => {
            alert('Settings copied to clipboard!');
        }, () => {
            alert('Failed to copy settings to clipboard.');
            console.error('Clipboard copy failed');
        });
    }
    
    recreateBlobs() {
        // Remove existing blobs
        this.blobs.forEach(blob => {
            this.scene.remove(blob);
        });
        this.blobs = [];
        
        // Create new blobs with updated count
        this.createBlobs();
    }

    parseCSSColor(cssColor) {
        if (cssColor.startsWith('var(')) {
            const variableName = cssColor.substring(4, cssColor.length - 1);
            const element = document.documentElement;
            const computedStyle = getComputedStyle(element);
            return new THREE.Color(computedStyle.getPropertyValue(variableName));
        }
        return new THREE.Color(cssColor);
    }
}

