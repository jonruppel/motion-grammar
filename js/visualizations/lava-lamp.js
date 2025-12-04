/**
 * Lava Lamp Effect using Three.js
 * Creates an organic, fluid metaball-style animation with post-processing
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Default settings - single source of truth for all lava lamp parameters
export const LAVA_LAMP_SETTINGS = {
    blobs: {
        color: "#3f8ef8",
        color2: "#3f8ef8",
        count: 12,
        minSize: 0.6,
        maxSize: 1.6,
        emissiveIntensity: 0.25,
        specularColor: "#000000",
        shininess: 0
    },
    bloom: {
        strength: 0.5,
        radius: 0.4,
        threshold: 0
    },
    lighting: {
        ambientIntensity: 1.4,
        keyLightColor: "#000000",
        keyLightIntensity: 0,
        fillLightColor: "#000000",
        fillLightIntensity: 0,
        rimLightIntensity: 2,
        pointLightIntensity: 0
    },
    animation: {
        speed: 0.005,
        boundaryX: 8.5,
        boundaryY: 8.5,
        boundaryZ: 1
    },
    camera: {
        fov: 20,
        positionZ: 15,
        toneMappingExposure: 0.1,
        canvasOpacity: 1.0
    }
};

export class LavaLamp {
    constructor(container, settings = LAVA_LAMP_SETTINGS) {
        this.container = container;
        this.settings = settings;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.blobs = [];
        this.animationId = null;
        this.time = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.isPaused = false;
        
        // Audio reactivity state
        this.smoothedEnergy = 0;
        this.cameraAngle = 0;
        
        // Animation parameters (exposed for controls)
        this.animSpeed = this.settings.animation.speed;
        this.boundaries = { 
            x: this.settings.animation.boundaryX, 
            y: this.settings.animation.boundaryY, 
            z: this.settings.animation.boundaryZ 
        };
        
        this.init();
    }
    
    parseCSSColor(cssValue) {
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
    
    pause() {
        this.isPaused = true;
    }
    
    renderSingleFrame(forceResize = false) {
        // Render one frame without resuming animation loop
        // Useful after DOM moves to prevent black canvas
        
        // Ensure canvas is visible (in case CSS animation hasn't completed)
        if (this.canvas) {
            this.canvas.style.animation = 'none';
            this.canvas.style.opacity = this.settings.camera.canvasOpacity;
        }
        
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
        if (this.composer) {
            // First render might be black due to WebGL context issues after DOM move
            this.composer.render();
            
            // Second render typically shows correctly
            requestAnimationFrame(() => {
                if (this.composer) {
                    this.composer.render();
                }
            });
        }
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            
            // Ensure canvas is visible (in case CSS animation hasn't completed)
            if (this.canvas) {
                this.canvas.style.animation = 'none';
                this.canvas.style.opacity = this.settings.camera.canvasOpacity;
            }
            
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
            if (this.composer) {
                this.composer.render();
            }
            
            this.animate(); // Restart animation loop
        }
    }
    
    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'lava-lamp-canvas';
        this.container.appendChild(this.canvas);
        
        // Get container dimensions
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.parseCSSColor("var(--color-bg-secondary)"));
        
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
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.settings.camera.toneMappingExposure;
        
        // Enable anti-aliasing for smoother edges
        this.renderer.shadowMap.enabled = false; // We don't need shadow maps for this effect
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Track initial size
        this.lastWidth = width;
        this.lastHeight = height;
        
        // Create blobs (metaballs)
        this.createBlobs();
        
        // Setup post-processing
        this.setupPostProcessing();
        
        // Setup lighting
        this.setupLighting();
        
        // Handle resize
        this.handleResize = this.onResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Listen for theme changes
        this.handleThemeChange = this.onThemeChange.bind(this);
        window.addEventListener('themechange', this.handleThemeChange);
        
        // Start animation
        this.animate();
        
        // Remove CSS animation after initial fade-in to prevent replay on DOM moves
        setTimeout(() => {
            if (this.canvas) {
                this.canvas.style.animation = 'none';
                this.canvas.style.opacity = this.settings.camera.canvasOpacity;
            }
        }, 1600); // After fadeInLavaLamp completes (1.5s + buffer)
    }
    
    createBlobs() {
        const blobCount = this.settings.blobs.count;
        const blobColor1 = new THREE.Color(this.settings.blobs.color);
        const blobColor2 = new THREE.Color(this.settings.blobs.color2);
        const specularColor = new THREE.Color(this.settings.blobs.specularColor);
        
        for (let i = 0; i < blobCount; i++) {
            const size = this.settings.blobs.minSize + Math.random() * (this.settings.blobs.maxSize - this.settings.blobs.minSize);
            const geometry = new THREE.SphereGeometry(size, 64, 64);
            
            // Randomly choose between color1 and color2
            const chosenColor = Math.random() < 0.5 ? blobColor1 : blobColor2;
            
            const material = new THREE.MeshPhongMaterial({
                color: chosenColor,
                emissive: chosenColor,
                emissiveIntensity: this.settings.blobs.emissiveIntensity,
                shininess: this.settings.blobs.shininess,
                specular: specularColor,
                transparent: false,
                opacity: 1.0,
                flatShading: false
            });
            
            const blob = new THREE.Mesh(geometry, material);
            
            // Random initial position - adjusted for flat view
            blob.position.x = (Math.random() - 0.5) * 8;
            blob.position.y = (Math.random() - 0.5) * 6;
            blob.position.z = (Math.random() - 0.5) * 1.5;
            
            // Store velocity and animation params (slow, meditative movement)
            blob.userData = {
                velocity: {
                    x: (Math.random() - 0.5) * 0.002,
                    y: (Math.random() - 0.5) * 0.002,
                    z: (Math.random() - 0.5) * 0.0008
                },
                phase: Math.random() * Math.PI * 2,
                baseSize: size,
                baseColor: chosenColor.clone()
            };
            
            this.blobs.push(blob);
            this.scene.add(blob);
        }
    }
    
    setupLighting() {
        const blobColor = new THREE.Color(this.settings.blobs.color);
        const keyLightColor = new THREE.Color(this.settings.lighting.keyLightColor);
        const fillLightColor = new THREE.Color(this.settings.lighting.fillLightColor);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, this.settings.lighting.ambientIntensity);
        this.scene.add(ambientLight);
        
        // Key directional light
        const keyLight = new THREE.DirectionalLight(keyLightColor, this.settings.lighting.keyLightIntensity);
        keyLight.position.set(6, 8, 5);
        this.scene.add(keyLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(fillLightColor, this.settings.lighting.fillLightIntensity);
        fillLight.position.set(-5, 2, 3);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(blobColor, this.settings.lighting.rimLightIntensity);
        rimLight.position.set(0, -4, -2);
        this.scene.add(rimLight);
        
        // Point lights
        const pointLight1 = new THREE.PointLight(blobColor, this.settings.lighting.pointLightIntensity, 12);
        pointLight1.position.set(4, 4, 4);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(blobColor, this.settings.lighting.pointLightIntensity, 12);
        pointLight2.position.set(-4, -2, 4);
        this.scene.add(pointLight2);
    }
    
    setupPostProcessing() {
        // Create composer
        this.composer = new EffectComposer(this.renderer);
        
        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom pass
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.settings.bloom.strength,
            this.settings.bloom.radius,
            this.settings.bloom.threshold
        );
        this.composer.addPass(bloomPass);
    }
    
    animate() {
        // Only request next frame if not paused
        if (!this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
        
        // Check for audio data
        let audioEnergy = 0;
        let audioData = null;
        
        if (window.audioAnalyser) {
            const bufferLength = window.audioAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            window.audioAnalyser.getByteFrequencyData(dataArray);
            
            // Calculate average energy
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Normalize (0-1) - Threshold for "playing"
            // Apply volume scaling
            const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
            
            if (average > 10) {
                audioEnergy = (average / 255) * volume;
                audioData = dataArray;
            }
        }
        
        // Smooth the energy value to prevent chaos
        // Lower factor = smoother/slower reaction, Higher = punchier
        this.smoothedEnergy += (audioEnergy - this.smoothedEnergy) * 0.1;
        
        // 1. Control Scene Rhythm (Global Time)
        // Base speed + boost from smoothed energy
        // "Fast song" (high energy) -> faster time -> faster blobs
        // "Chill song" (low energy) -> slower time -> chill blobs
        const currentSpeed = this.animSpeed * (1 + this.smoothedEnergy * 4);
        this.time += currentSpeed;
        
        // 2. Control Camera Rotation
        // Rotate camera around center based on energy
        // Base rotation + boost from energy
        const rotationSpeed = 0.0005 + (this.smoothedEnergy * 0.005);
        this.cameraAngle += rotationSpeed;
        
        // Update camera position (orbit radius determined by initial Z settings roughly)
        const orbitRadius = this.settings.camera.positionZ;
        this.camera.position.x = Math.sin(this.cameraAngle) * orbitRadius;
        this.camera.position.z = Math.cos(this.cameraAngle) * orbitRadius;
        this.camera.lookAt(0, 0, 0);
        
        // Check if container size changed (e.g., during hero collapse animation)
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            const currentWidth = Math.round(rect.width);
            const currentHeight = Math.round(rect.height);
            
            if (currentWidth !== this.lastWidth || currentHeight !== this.lastHeight) {
                this.lastWidth = currentWidth;
                this.lastHeight = currentHeight;
                this.onResize();
            }
        }
        
        // Animate each blob
        this.blobs.forEach((blob, index) => {
            const userData = blob.userData;
            const phaseOffset = userData.phase;
            
            // Base motion parameters
            let speedX = 0.002;
            let speedY = 0.002;
            let speedZ = 0.0008;
            let pulseIntensity = 0.15;
            let baseScale = userData.baseSize;
            
            // 3. Detailed Audio Reactivity
            if (this.smoothedEnergy > 0.01) {
                // Pulse based on specific frequency bin for this blob
                // Map blob index to frequency bin
                if (audioData) {
                    const binIndex = Math.floor((index / this.blobs.length) * (audioData.length / 2));
                    const volume = typeof window.musicVolume !== 'undefined' ? window.musicVolume : 1.0;
                    const freqValue = (audioData[binIndex] / 255) * volume;
                    
                    // Increase pulse intensity with specific frequency (beat)
                    // We combine smoothed energy (vibe) with immediate freq (beat)
                    // Boosted sensitivity: 1.0 multiplier instead of 0.6
                    pulseIntensity = 0.15 + (freqValue * 1.0) + (this.smoothedEnergy * 0.4);
                    
                    // Color Pulse (Blue -> Red) - Sharp transition
                    const redColor = new THREE.Color(1, 0, 0);
                    const threshold = 0.4;
                    // Boost input by 1.5x for earlier color change
                    const mix = Math.max(0, Math.min(1, (freqValue * 1.5 - threshold) * 3));
                    
                    blob.material.color.lerpColors(userData.baseColor, redColor, mix);
                    blob.material.emissive.lerpColors(userData.baseColor, redColor, mix);

                    // Add slight positional jitter on strong beats only (Lower threshold 0.4)
                    if (freqValue > 0.4) {
                        const jitter = freqValue * 0.05; // Slightly stronger jitter
                        blob.position.x += (Math.random() - 0.5) * jitter;
                        blob.position.y += (Math.random() - 0.5) * jitter;
                    }
                }
            }
            
            // Slow, organic floating motion
            blob.position.x += Math.sin(this.time * 0.4 + phaseOffset) * speedX + userData.velocity.x;
            blob.position.y += Math.cos(this.time * 0.25 + phaseOffset) * speedY + userData.velocity.y;
            blob.position.z += Math.sin(this.time * 0.5 + phaseOffset) * speedZ + userData.velocity.z;
            
            // Gentle pulsing/breathing
            const scale = baseScale * (1 + Math.sin(this.time * 0.6 + phaseOffset) * pulseIntensity);
            blob.scale.set(scale, scale, scale);
            
            // Boundary checks
            if (Math.abs(blob.position.x) > this.boundaries.x) {
                userData.velocity.x *= -1;
                blob.position.x = Math.sign(blob.position.x) * this.boundaries.x;
            }
            if (Math.abs(blob.position.y) > this.boundaries.y) {
                userData.velocity.y *= -1;
                blob.position.y = Math.sign(blob.position.y) * this.boundaries.y;
            }
            if (Math.abs(blob.position.z) > this.boundaries.z) {
                userData.velocity.z *= -1;
                blob.position.z = Math.sign(blob.position.z) * this.boundaries.z;
            }
        });
        
        // Render scene with post-processing
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
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
        if (this.composer) {
            this.composer.setSize(width, height);
        }
    }

    onThemeChange() {
        // Update background color when theme changes
        this.scene.background = new THREE.Color(this.parseCSSColor("var(--color-bg-secondary)"));
    }
    
    dispose() {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('themechange', this.handleThemeChange);
        
        // Dispose Three.js resources
        this.blobs.forEach(blob => {
            blob.geometry.dispose();
            blob.material.dispose();
        });
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

