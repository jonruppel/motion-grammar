// Main Application Entry Point

import { Navigation } from './core/navigation.js';
import { ContentManager } from './core/content-manager.js';
import { navigationData } from './core/navigation.js';
import { Tutorial } from './components/index.js';
import { uiLayerManager } from './utils/fullscreen-manager.js';
import { MusicPlayer } from './components/organisms/MusicPlayer.js';
import { lazyImageLoader } from './utils/lazy-image-loader.js';
import { globalPreloader } from './utils/global-preloader.js';

class App {
    constructor() {
        this.navigation = null;
        this.contentManager = null;
        this.isReady = false;
        this.isFirstLoad = true;
        this.isTransitioning = false;
        this.modules = [];
        this.currentModuleIndex = 0;
    }

    // Helper to find module path by experience ID
    findModuleById(data, id) {
        for (let group of data) {
            if (group.id === id && (group.module || group.dataPath)) {
                return group.module || group.dataPath;
            }
            if (group.children) {
                const item = group.children.find(child => child.id === id);
                if (item) {
                    return item.module || item.dataPath;
                }
            }
        }
        return null;
    }

    async init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize tint layer immediately
        this.createTintLayer();

        // Initialize navigation
        const navContainer = document.querySelector('.nav-content');
        this.navigation = new Navigation(navContainer);
        this.navigation.render();

        // Ensure child components are fully initialized before setting active state
        setTimeout(() => {
            this.navigation.setActiveFromUrl();
        }, 0);

        // Fallback: Direct DOM manipulation to ensure active state is set
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const experienceId = params.get('experience');
            
            if (experienceId) {
                // Find all nav links and reset active state
                const allNavLinks = document.querySelectorAll('.nav-link');
                allNavLinks.forEach(link => link.classList.remove('active'));
                
                // Find the matching nav link by data-item-id and add active class
                const targetLink = document.querySelector(`.nav-link[data-item-id="${experienceId}"]`);
                if (targetLink) {
                    targetLink.classList.add('active');
                }
            }
        }, 50);

        // Initialize content manager
        const headerElement = document.querySelector('.content-header');
        const bodyElement = document.querySelector('.content-body');
        const heroContainer = document.querySelector('.hero-container');
        this.contentManager = new ContentManager(headerElement, bodyElement, heroContainer);

        // Connect navigation to content manager
        this.navigation.onNavigate = (itemId, modulePathOrType) => {
            this.loadContent(itemId, modulePathOrType);
        };

        // Setup theme toggle
        this.setupThemeToggle();

        // Setup music player
        this.setupMusicPlayer();
        
        // Setup global media handling (videos vs music)
        this.setupGlobalMediaHandling();
        
        // Setup mobile menu
        this.setupMobileMenu();

        // Setup logo click to return home
        this.setupLogoClick();

        // Check if we're loading an experience (not homepage) on first load
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        
        // If loading an experience on first load, make app visible immediately
        // so the reveal transition will be visible
        if (experienceId && this.isFirstLoad) {
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                gsap.set(appContainer, { opacity: 1 });
            }
        }

        // Build module list for scroll navigation FIRST
        this.buildModuleList();

        // Handle URL navigation (load initial content) - active state already set above
        await this.handleUrlNavigation();

        // Hide loader
        this.hideLoader();

        // Check if first visit - show tutorial instead of home state
        // if (!Tutorial.hasSeenTutorial()) {
        //     await this.showTutorial();
        // } else {
        // First load animation (now that content is loaded)
        await this.animateFirstLoad();
        // }

        // Setup resize handler to manage nav state across breakpoints
        this.setupResizeHandler();

        // Setup scroll and swipe navigation
        this.setupScrollNavigation();
        this.setupSwipeNavigation();
        this.setupKeyboardNavigation();

        // Mark first load as complete
        this.isFirstLoad = false;

        this.isReady = true;

        // Start background preloading of site title images
        setTimeout(() => {
            globalPreloader.preloadSiteTitleImages();
        }, 2000);
    }

    async loadContent(itemId, modulePathOrType) {
        // Close mobile menu immediately to show transition
        this.closeMobileMenu();

        // Find the target index
        const targetIndex = this.modules.findIndex(m => m.id === itemId);
        if (targetIndex === -1) return;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('experience', itemId);
        url.searchParams.delete('slide'); // Clear slide param on new navigation
        window.history.pushState({}, '', url);

        // Update active nav
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Navigate with transition based on direction
        await this.navigateToModuleByIndex(targetIndex);
    }

    async loadFromUrl(itemId, modulePath) {
        // Close mobile menu immediately
        this.closeMobileMenu();

        // Find the target index
        const targetIndex = this.modules.findIndex(m => m.id === itemId);
        if (targetIndex === -1) return;

        // Update active nav
        this.navigation.setActive(itemId);

        // Direct DOM update for active state
        setTimeout(() => {
            // Clear all active states first
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            
            // Set active state on the correct link
            const targetLink = document.querySelector(`.nav-link[data-item-id="${itemId}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        // Navigate with transition based on direction
        await this.navigateToModuleByIndex(targetIndex);
    }

    async loadRandomVisualization() {
        const visualizations = this.modules.filter(m => !m.type || m.type === 'visualization');
        if (visualizations.length > 0) {
            let randomViz;
            // If we have a current module and multiple options, try to pick a different one
            if (this.modules[this.currentModuleIndex] && visualizations.length > 1) {
                let attempts = 0;
                do {
                    randomViz = visualizations[Math.floor(Math.random() * visualizations.length)];
                    attempts++;
                } while (randomViz.id === this.modules[this.currentModuleIndex].id && attempts < 5);
            } else {
                randomViz = visualizations[Math.floor(Math.random() * visualizations.length)];
            }

            this.currentModuleIndex = this.modules.findIndex(m => m.id === randomViz.id);
            
            // Highlight in navigation
            if (this.navigation) {
                this.navigation.setActive(randomViz.id);
                
                // Ensure the active item is visible/expanded
                // Navigation component handles this internal logic, but we make sure we call it
            }

            await this.contentManager.loadContent(randomViz.id, randomViz.module);
            
            // Refresh lazy image loader for initial content
            lazyImageLoader.refresh();
        }
    }

    async handleUrlNavigation() {
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        const slideIndex = parseInt(params.get('slide'), 10) || 0;

        if (experienceId) {
            // Find the module path using navigationData
            const modulePath = this.findModuleById(navigationData, experienceId);
            if (modulePath) {
                // Active nav already set via setActiveFromUrl on initial load
                // For popstate, set it again
                if (!this.isFirstLoad) {
                    this.navigation.setActive(experienceId);
                }
                // Load the content (handles all types)
                await this.contentManager.loadContent(experienceId, modulePath, null, slideIndex);
                
                // Refresh lazy image loader for initial content
                lazyImageLoader.refresh();
                
                // Muffle music if initially loading a case study
                if (this.musicPlayer) {
                    const targetModule = this.modules.find(m => m.id === experienceId);
                    if (targetModule) {
                        const isVisualization = (!targetModule.type || targetModule.type === 'visualization');
                        // Use a short delay or immediate? Immediate is fine as player is created.
                        // However, audio context might be suspended. setMuffled handles check.
                        this.musicPlayer.setMuffled(!isVisualization);
                    }
                }
                return;
            }
        }

        // No URL parameter - load random visualization on first load (without setting URL)
        if (this.isFirstLoad && this.modules.length > 0) {
            await this.loadRandomVisualization();
        }
    }

    setupMusicPlayer() {
        this.musicPlayer = new MusicPlayer();
        const playerElement = this.musicPlayer.render();
        
        // Append directly to UI layer for absolute positioning (bottom right)
        const uiLayer = document.querySelector('.ui-layer');
        if (uiLayer) {
            uiLayer.appendChild(playerElement);
        }
    }

    setupGlobalMediaHandling() {
        // Use capture phase to detect play/pause events from any video element
        
        // When a video starts playing
        document.addEventListener('play', (e) => {
            if (e.target.tagName !== 'VIDEO') return;
            
            // 1. Stop all other videos
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach(video => {
                if (video !== e.target && !video.paused) {
                    video.pause();
                }
            });
            
            // 2. Duck music if playing
            if (this.musicPlayer) {
                this.musicPlayer.duck();
            }
        }, true); // Capture phase
        
        // When a video stops (pause or ended)
        const checkResumeMusic = (e) => {
            if (e.target.tagName !== 'VIDEO') return;
            
            // Wait a tick to see if another video started immediately
            setTimeout(() => {
                // Check if ANY video is currently playing
                const allVideos = document.querySelectorAll('video');
                let isAnyPlaying = false;
                
                allVideos.forEach(video => {
                    if (!video.paused && !video.ended && video.readyState > 2) {
                        isAnyPlaying = true;
                    }
                });
                
                // If no videos are playing, resume music
                if (!isAnyPlaying && this.musicPlayer) {
                    this.musicPlayer.unduck();
                }
            }, 50);
        };
        
        document.addEventListener('pause', checkResumeMusic, true);
        document.addEventListener('ended', checkResumeMusic, true);
    }

    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        const icon = toggle.querySelector('i');

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        icon.className = savedTheme === 'dark' ? 'bx bx-moon' : 'bx bx-sun';

        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            icon.className = newTheme === 'dark' ? 'bx bx-moon' : 'bx bx-sun';
            
            // Dispatch custom event for theme changes
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: newTheme }
            }));

            // Blur the toggle button to prevent keyboard focus trap
            toggle.blur();
        });
    }

    setupMobileMenu() {
        const toggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (!toggle || !sidebar || !overlay) {
            console.error('Mobile menu elements not found:', { toggle, sidebar, overlay });
            return;
        }

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
            toggle.classList.toggle('active');

            // Blur the toggle button to prevent keyboard focus trap
            toggle.blur();
        });

        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        const toggle = document.getElementById('mobileMenuToggle');

        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
    }

    setupLogoClick() {
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', async () => {
                // Close mobile nav immediately if open
                this.closeMobileMenu();

                // Unmuffle music (returning to home/hub)
                if (this.musicPlayer) {
                    this.musicPlayer.setMuffled(false);
                }

                // Clear URL
                window.history.pushState({}, '', window.location.pathname);
                
                // 1. Transition out current content (Standard Page Transition - slide DOWN)
                // 'up' direction means move current content DOWN (y: 100%) to reveal from top
                await this.slideOutContent('up'); 
                
                // 2. Show home state overlay sliding in from TOP
                await this.showHomeStateOverlay(async () => {
                    // Load new random visualization while overlay covers
                    await this.loadRandomVisualization();
                }, true); // true = use slide-in animation
            });
        }
    }

    async showTutorial() {
        const appContainer = document.querySelector('.app-container');
        
        // Make app visible for tutorial
        gsap.set(appContainer, { opacity: 1 });

        // Create and show tutorial
        const tutorial = new Tutorial({
            onComplete: async () => {
                // After tutorial, show first load animation
                await this.animateFirstLoad();
            }
        });

        const tutorialElement = tutorial.render();
        document.body.appendChild(tutorialElement);
        tutorial.element = tutorialElement;

        // Fade in tutorial
        gsap.fromTo(tutorialElement, 
            { opacity: 0 },
            { opacity: 1, duration: 0.6, ease: 'power2.out' }
        );
    }
    
    // Beautiful typography animation for home title
    async animateHomeTitle(duration = 3000) {
        const header = document.querySelector('.content-header');
        if (!header) return;
        
        const title = header.querySelector('.page-title');
        const desc = header.querySelector('.page-description');
        
        // Save original description text if not saved
        if (!desc.dataset.originalText) {
            desc.dataset.originalText = desc.innerHTML;
        }
        
        // Find the appropriate container to insert the overlay into
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        // Create a background overlay specifically for the title animation
        const titleOverlay = document.createElement('div');
        titleOverlay.className = 'home-title-overlay';
        titleOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--color-bg-primary);
            opacity: 0;
            z-index: 9; /* Below header (10) but above visualization */
            pointer-events: none;
        `;
        
        // Insert overlay into main-content, before the header
        mainContent.insertBefore(titleOverlay, header);
        
        // Ensure visible
        gsap.set(header, { 
            display: 'block', 
            opacity: 1, 
            pointerEvents: 'none',
            top: '50%',
            y: '-50%',
            position: 'absolute',
            zIndex: 10
        });
        
        // Split text if needed
        this.splitTextToChars(title);
        
        const chars = title.querySelectorAll('.char');
        
        // Reset state
        gsap.set(chars, { 
            y: 100, 
            opacity: 0, 
            rotateX: -90,
            scale: 0.5
        });
        
        // Reset desc for scramble - START HIDDEN
        desc.style.opacity = 0;
        desc.innerText = ''; // Start empty/ready for scramble
        
        const tl = gsap.timeline();
        
        // Animate Overlay In (to 0.5 opacity)
        tl.to(titleOverlay, {
            opacity: 0.5,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);
        
        // Animate In - Beautiful Build (logo characters)
        tl.to(chars, {
            y: 0,
            opacity: 1,
            rotateX: 0,
            scale: 1,
            duration: 1.2,
            stagger: 0.04,
            ease: 'expo.out' // Dramatic easing
        }, 0.3);
        
        // Fade in description container, then trigger scramble
        tl.to(desc, {
            opacity: 1,
            duration: 0.3,
            onStart: () => {
                // Trigger scramble in once visible
                this.scrambleText(desc, desc.dataset.originalText, 1500, 'in');
            }
        }, 1.0);
        
        // Wait
        tl.to({}, { duration: duration / 1000 });
        
        // Trigger scramble out
        tl.add(() => {
            this.scrambleText(desc, '', 800, 'out');
        }, '-=0.2');
        
        // Animate Out - Elegant Fade
        tl.to(chars, {
            y: -60,
            opacity: 0,
            rotateX: 60,
            duration: 0.8,
            stagger: 0.02,
            ease: 'power2.in'
        });
        
        // Animate Overlay Out
        tl.to(titleOverlay, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                titleOverlay.remove();
            }
        }, '-=0.8');
        
        await tl;
    }

    // Helper for text scramble effect
    scrambleText(element, finalText, duration = 1000, mode = 'in') {
        // Character sets by visual weight (lightest to heaviest)
        const charsLight = '.,:;\'"`-';
        const charsMedium = '+<>/!?(){}[]';
        // Special chars only as requested for heavy
        const charsHeavy = '#@$%&'; 
        
        const fps = 60;
        const totalFrames = Math.max((duration / 1000) * fps, 1);
        let frame = 0;
        
        // Helper to split by BR tags
        const splitByBr = (html) => html.split(/<br\s*\/?>/i);
        
        const targetLines = mode === 'in' ? splitByBr(finalText) : [''];
        const originalLines = mode === 'in' ? [''] : splitByBr(element.dataset.originalText || element.innerHTML);
        
        // Use the source content (target for IN, original for OUT) to determine structure/length
        const sourceLines = mode === 'in' ? targetLines : originalLines;
        // Total characters across all lines (excluding BRs)
        const totalChars = sourceLines.reduce((acc, line) => acc + line.length, 0);
        
        if (element.scrambleInterval) clearInterval(element.scrambleInterval);
        element.style.opacity = 1;
        
        element.scrambleInterval = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            
            if (progress >= 1) {
                element.innerHTML = finalText;
                clearInterval(element.scrambleInterval);
                if (mode === 'out') element.style.opacity = 0;
                return;
            }
            
            let finalOutputLines = [];
            let globalCharIndex = 0;
            
            // Iterate over the lines of the source text
            for (let lineIdx = 0; lineIdx < sourceLines.length; lineIdx++) {
                const lineContent = sourceLines[lineIdx];
                let lineOutput = '';
                
                for (let i = 0; i < lineContent.length; i++) {
                    const currentGlobalIndex = globalCharIndex + i;
                    
                    // Wave stagger logic
                    let charProgress;
                    if (mode === 'in') {
                        const charDuration = 0.4; 
                        const startDelay = (currentGlobalIndex / Math.max(totalChars, 1)) * (1 - charDuration);
                        charProgress = (progress - startDelay) / charDuration;
                    } else {
                        // OUT: Reverse
                        const charDuration = 0.4;
                        const startDelay = (currentGlobalIndex / Math.max(totalChars, 1)) * (1 - charDuration);
                        charProgress = 1 - ((progress - startDelay) / charDuration);
                    }
                    
                    // Clamp
                    if (charProgress < 0) charProgress = 0;
                    if (charProgress > 1) charProgress = 1;
                    
                    // Determine char
                    if (charProgress === 1) {
                        // Show correct char
                        lineOutput += lineContent[i];
                    } else if (charProgress > 0.8) {
                        lineOutput += charsHeavy[Math.floor(Math.random() * charsHeavy.length)];
                    } else if (charProgress > 0.5) {
                        lineOutput += charsMedium[Math.floor(Math.random() * charsMedium.length)];
                    } else if (charProgress > 0.2) {
                        lineOutput += charsLight[Math.floor(Math.random() * charsLight.length)];
                    } else {
                        // Invisible / Space
                        lineOutput += '&nbsp;';
                    }
                }
                
                finalOutputLines.push(lineOutput);
                globalCharIndex += lineContent.length;
            }
            
            // Join lines with BR
            element.innerHTML = finalOutputLines.join('<br>');
            
        }, 1000 / fps);
    }

    splitTextToChars(element) {
        if (!element || element.classList.contains('splitted')) return;
        element.classList.add('splitted');

        const nodes = Array.from(element.childNodes);
        element.innerHTML = '';
        
        nodes.forEach(node => {
            if (node.nodeType === 3) { // Text node
                const text = node.nodeValue;
                // Preserve spaces as non-breaking or normal spaces
                // We split by character
                const chars = text.split('');
                chars.forEach(char => {
                    if (char.trim() === '') {
                        element.appendChild(document.createTextNode(char));
                    } else {
                        const span = document.createElement('span');
                        span.textContent = char;
                        span.className = 'char';
                        span.style.display = 'inline-block';
                        span.style.transformStyle = 'preserve-3d';
                        span.style.backfaceVisibility = 'hidden';
                        // Add minimal margin to prevent letters colliding if font has kerning
                        span.style.minWidth = '0.2em'; 
                        // Actually minWidth might break layout for narrow letters like 'I'.
                        // Let's remove minWidth, usually inline-block respects font metrics.
                        span.style.minWidth = ''; 
                        element.appendChild(span);
                    }
                });
            } else {
                element.appendChild(node.cloneNode(true));
            }
        });
    }

    async showHomeStateOverlay(onVisibleCallback = null, slideIn = false) {
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const isDesktop = window.innerWidth > 768;
        
        // Create home state overlay
        const homeOverlay = this.createHomeOverlay();
        document.body.appendChild(homeOverlay);
        
        // Set initial state
        if (slideIn) {
            // Slide in from TOP (since we slid current content DOWN)
            gsap.set(homeOverlay, { 
                y: '-100%', 
                opacity: 1 
            });
        } else {
            gsap.set(homeOverlay, { opacity: 0 });
        }
        
        // Entrance Animation
        if (slideIn) {
            await gsap.to(homeOverlay, {
                y: '0%',
                duration: 0.5,
                ease: 'power2.inOut'
            });
        } else {
            await gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });
        }
        
        // Callback while overlay is visible (load content)
        if (onVisibleCallback) {
            
            // Ensure main content is reset and ready behind overlay
            // We set opacity to 0 first, then animate to 1 to ensure a smooth "ready" state
            // This prevents any frame glitches where content might be partially rendered
            gsap.set([mainContent, heroContainer], { 
                y: 0,
                opacity: 0,
                clearProps: 'transform' 
            });

            // Show header if it was hidden (for home state)
            const headerElement = document.querySelector('.content-header');
            if (headerElement) {
                // Ensure header is visible and positioned correctly for the transition
                // This makes it "sit above" the visualization
                gsap.set(headerElement, { 
                    display: 'block', 
                    opacity: 0,
                    y: 20,
                    position: 'absolute', // Enforce positioning
                    zIndex: 10,           // Enforce layering
                    pointerEvents: 'none' // Enforce click-through
                });
            }

            await onVisibleCallback();

            // Wait a frame to ensure DOM updates are processed
            await new Promise(resolve => requestAnimationFrame(resolve));

            // Fade content in (behind the overlay)
            gsap.to([mainContent, heroContainer], {
                opacity: 1,
                duration: 0.1, // Quick fade in behind overlay
                overwrite: true
            });

            // Animate header in
            if (headerElement) {
                // Show temporarily via helper
                this.animateHomeTitle(3000);
            }
        }
        
        // Hold to ensure visualization is fully initialized
        await new Promise(resolve => setTimeout(resolve, isDesktop ? 1200 : 2000));
        
        // Exit Animation (Fade out overlay to reveal content)
        // await gsap.to(homeOverlay, {
        //     opacity: 0,
        //     duration: 1.2, // Slower fade out for smoother reveal
        //     ease: 'power2.inOut'
        // });
        
        // Remove overlay
        // homeOverlay.remove();
    }

    async animateFirstLoad() {
        const appContainer = document.querySelector('.app-container');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const isDesktop = window.innerWidth > 768;
        const hasVisualization = !!document.querySelector('.visualization-container');

        // Check if we have a deep link
        const params = new URLSearchParams(window.location.search);
        const hasDeepLink = !!params.get('experience');

        // Fade in app container
        gsap.to(appContainer, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
        });

        // Only show home overlay if we have a visualization loaded AND NO deep link
        if (!hasVisualization || hasDeepLink) {
            // Just show nav
            if (isDesktop) {
                // Ensure proper handoff to Sidebar component
                gsap.set(sidebar, { x: 0, opacity: 1 });
                
                // Clear inline styles so CSS classes can control visibility
                gsap.set(sidebar, { clearProps: 'opacity' });
                
                if (this.navigation && this.navigation.sidebarComponent) {
                    this.navigation.sidebarComponent.showUI(3000);
                } else {
                    document.body.classList.add('nav-visible');
                    sidebar.classList.add('visible');
                }
            } else {
                gsap.set(sidebar, { x: '-100%', opacity: 1 });
            }
            gsap.set(mainContent, { opacity: 1 });
            return;
        }

        // Create home state overlay
        const homeOverlay = this.createHomeOverlay();
        document.body.appendChild(homeOverlay);

        // Prepare header for animation
        const headerElement = document.querySelector('.content-header');
        if (headerElement) {
            gsap.set(headerElement, { 
                display: 'block', 
                opacity: 0,
                top: '50%',
                y: '-50%', // Center vertically
                position: 'absolute',
                zIndex: 10,
                pointerEvents: 'none'
            });
        }

        if (isDesktop) {
            // DESKTOP: Show visualization, animate in nav and home overlay
            
            // Set initial states
            gsap.set(sidebar, { 
                x: -280, 
                opacity: 0 
            });
            
            gsap.set(mainContent, { 
                opacity: 1
            });

            gsap.set(homeOverlay, {
                opacity: 0
            });

            // Fade in home overlay (if it has styles)
            gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });

            // Animate header in
            if (headerElement) {
                // Show temporarily via helper
                this.animateHomeTitle(3000);
            }

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Animate nav in
            await gsap.to(sidebar, {
                x: 0,
                opacity: 1,
                duration: 1.0,
                ease: 'expo.inOut'
            });

            // Hand off visibility control to Sidebar component and CSS
            // 1. Activate the "visible" state in Sidebar component (adds classes)
            if (this.navigation && this.navigation.sidebarComponent) {
                this.navigation.sidebarComponent.showUI(3000);
            } else {
                // Fallback if component access fails
                document.body.classList.add('nav-visible');
                sidebar.classList.add('visible');
            }

            // 2. Clear GSAP inline styles so CSS classes can control visibility
            gsap.set(sidebar, { clearProps: 'opacity' });
            
            // Wait another moment
            await new Promise(resolve => setTimeout(resolve, 800));

            // Fade out home overlay
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });

            // Remove overlay
            homeOverlay.remove();

        } else {
            // MOBILE: Show visualization, animate in home overlay
            gsap.set(sidebar, { x: '-100%', opacity: 1 });
            gsap.set(mainContent, { opacity: 1 });
            gsap.set(homeOverlay, { opacity: 0 });

            // Fade in home overlay
            gsap.to(homeOverlay, {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            });

            // Animate header in
            if (headerElement) {
                // Show temporarily via helper
                this.animateHomeTitle(3000);
            }

            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Fade out home overlay
            await gsap.to(homeOverlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            });

            // Remove overlay
            homeOverlay.remove();
        }
    }

    createHomeOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'home-state-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            pointer-events: none;
        `;
        
        // We do NOT create any content here. The overlay itself is just a background/scrim.
        // The title/content is managed via the .content-header in the main DOM structure.

        return overlay;
    }

    createTintLayer() {
        // Check if it exists
        if (document.querySelector('.global-tint-layer')) return;

        const tintLayer = document.createElement('div');
        tintLayer.className = 'global-tint-layer';
        // Insert as first child of body to be at the bottom
        document.body.prepend(tintLayer);
    }

    setupResizeHandler() {
        let previousWidth = window.innerWidth;
        
        window.addEventListener('resize', () => {
            const currentWidth = window.innerWidth;
            const sidebar = document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content');
            
            if (!sidebar || !mainContent) return;
            
            // Check if we crossed the desktop/mobile breakpoint
            const wasDesktop = previousWidth > 768;
            const isDesktop = currentWidth > 768;
            
            if (wasDesktop && !isDesktop) {
                // Crossed from desktop → mobile
                // Hide sidebar off-screen (unless mobile menu is explicitly open)
                const isMobileMenuOpen = sidebar.classList.contains('mobile-open');
                
                if (!isMobileMenuOpen) {
                    gsap.set(sidebar, { 
                        x: '-100%',
                        opacity: 1,
                        clearProps: 'transform' // Let CSS transitions take over
                    });
                }
                
                // Reset main content - clear GSAP inline styles, let CSS handle layout
                gsap.set(mainContent, {
                    clearProps: 'position,right,width'
                });
                
            } else if (!wasDesktop && isDesktop) {
                // Crossed from mobile → desktop
                
                // Ensure mobile menu is closed when moving to desktop
                this.closeMobileMenu();

                // Show sidebar
                gsap.set(sidebar, { 
                    x: 0,
                    opacity: 1,
                    clearProps: 'transform'
                });
                
                // Reset main content - clear GSAP inline styles, let CSS handle layout
                gsap.set(mainContent, {
                    clearProps: 'position,right,width'
                });
            }
            
            previousWidth = currentWidth;
        });
    }

    hideLoader() {
        const loader = document.getElementById('pageLoader');
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 500);
    }

    buildModuleList() {
        // Add all content types to module list for scroll navigation
        navigationData.forEach(group => {
            if (group.children && group.children.length > 0) {
                // Groups with children (Visualizations, Interaction Studies, Case Studies)
                group.children.forEach(item => {
                    // Only add items with valid module/dataPath
                    const modulePath = item.module || item.dataPath;
                    if (modulePath) {
                    this.modules.push({
                        id: item.id,
                        title: item.title,
                            module: modulePath,
                            type: item.type
                        });
                    }
                });
            } else if (!group.children) {
                // Top-level items (About, Contact)
                const modulePath = group.dataPath || group.type;
                if (modulePath) {
                    this.modules.push({
                        id: group.id,
                        title: group.title,
                        module: modulePath,
                        type: group.type
                    });
                }
            }
            // Skip groups with empty children arrays (like Interaction Studies placeholder)
        });


        // Set current index based on URL or pick random visualization for first load
        const params = new URLSearchParams(window.location.search);
        const experienceId = params.get('experience');
        
        if (experienceId) {
            const index = this.modules.findIndex(m => m.id === experienceId);
            if (index !== -1) {
                this.currentModuleIndex = index;
            }
        } else if (this.isFirstLoad) {
            // Pick a random VISUALIZATION (not case study or about) for first load
            const visualizations = this.modules.filter(m => !m.type || m.type === 'visualization');
            if (visualizations.length > 0) {
                const randomViz = visualizations[Math.floor(Math.random() * visualizations.length)];
                this.currentModuleIndex = this.modules.findIndex(m => m.id === randomViz.id);
            }
        }
    }

    setupScrollNavigation() {
        let lastScrollTime = 0;
        const scrollCooldown = 1000; // 1 second cooldown between scrolls

        window.addEventListener('wheel', (e) => {
            // Allow native scrolling inside device mockups (phone, laptop, TV)
            const mockupScrollable = e.target.closest('.iphone-content, .laptop-content, .tv-content');
            if (mockupScrollable) {
                return; // let the inner scroller handle this wheel event
            }

            // Prevent pagination when scrolling over the sidebar/navigation
            const sidebarScrollable = e.target.closest('.sidebar, .nav-content');
            if (sidebarScrollable) {
                return; // let the sidebar handle its own scrolling
            }

            // Prevent default scroll behavior for global section navigation
            e.preventDefault();

            // Check if we're already transitioning or in cooldown
            const now = Date.now();
            if (this.isTransitioning || (now - lastScrollTime) < scrollCooldown) {
                return;
            }

            // Only trigger on significant scroll
            if (Math.abs(e.deltaY) > 10) {
                lastScrollTime = now;
                
                if (e.deltaY > 0) {
                    // Scroll down - next
                    this.navigateToNext();
                } else if (e.deltaY < 0) {
                    // Scroll up - previous
                    this.navigateToPrevious();
                }
            }
        }, { passive: false });
    }

    setupSwipeNavigation() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        let lastSwipeTime = 0;
        let isValidSwipeStart = false;
        const swipeThreshold = 50;
        const swipeCooldown = 1000; // 1 second cooldown between swipes

        document.addEventListener('touchstart', (e) => {
            // Ignore if touching sidebar or menu toggle
            if (e.target.closest('.sidebar') || 
                e.target.closest('.mobile-menu-toggle')) {
                isValidSwipeStart = false;
                return;
            }
            
            isValidSwipeStart = true;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isValidSwipeStart) return;
            // Skip swipe navigation if any visualization is actively using touch/drag
            if (window.isVisualizationDragging) {
                return;
            }
            
            const now = Date.now();
            if (this.isTransitioning || (now - lastSwipeTime) < swipeCooldown) return;

            const touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            const swipeDistanceX = touchStartX - touchEndX;
            const swipeDistanceY = touchStartY - touchEndY;

            // If horizontal movement is significant and greater than vertical, assume horizontal swipe and ignore
            // This prevents diagonal swipes from triggering vertical navigation
            if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) && Math.abs(swipeDistanceX) > 30) {
                return;
            }

            if (Math.abs(swipeDistanceY) > swipeThreshold) {
                lastSwipeTime = now;
                
                if (swipeDistanceY > 0) {
                    // Swipe up - next
                    this.navigateToNext();
                } else {
                    // Swipe down - previous
                    this.navigateToPrevious();
                }
            }
            
            isValidSwipeStart = false;
        }, { passive: true });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ignore input elements
            if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName)) return;

            if (this.isTransitioning) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateToNext();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateToPrevious();
            }
        });
    }

    async navigateToNext() {
        // Loop to beginning if at the end
        const nextIndex = (this.currentModuleIndex + 1) % this.modules.length;
        await this.navigateToModuleByIndex(nextIndex, 'down');
    }

    async navigateToPrevious() {
        // Loop to end if at the beginning
        const prevIndex = this.currentModuleIndex === 0 
            ? this.modules.length - 1 
            : this.currentModuleIndex - 1;
        await this.navigateToModuleByIndex(prevIndex, 'up');
    }

    async navigateToModuleByIndex(targetIndex, forcedDirection = null) {
        if (this.isTransitioning || targetIndex === this.currentModuleIndex) return;

        this.isTransitioning = true;
        const targetModule = this.modules[targetIndex];
        
        // Use forced direction if provided (for scroll/swipe), otherwise calculate from indices
        const direction = forcedDirection || (targetIndex > this.currentModuleIndex ? 'down' : 'up');

        // Muffle music if navigating to a case study (anything not a visualization)
        if (this.musicPlayer) {
            const isVisualization = (!targetModule.type || targetModule.type === 'visualization');
            this.musicPlayer.setMuffled(!isVisualization);
        }

        // Step 1: Slide out current content
        await this.slideOutContent(direction);

        // Step 2: Load new content while off-screen
        const url = new URL(window.location);
        url.searchParams.set('experience', targetModule.id);
        url.searchParams.delete('slide'); // Clear slide param on new navigation
        window.history.pushState({}, '', url);
        this.navigation.setActive(targetModule.id);
        
        // Update nav link active state
        setTimeout(() => {
            const allNavLinks = document.querySelectorAll('.nav-link');
            allNavLinks.forEach(link => link.classList.remove('active'));
            const targetLink = document.querySelector(`.nav-link[data-item-id="${targetModule.id}"]`);
            if (targetLink) {
                targetLink.classList.add('active');
            }
        }, 0);

        await this.contentManager.loadContent(targetModule.id, targetModule.module);

        // Refresh lazy image loader for newly loaded content
        lazyImageLoader.refresh();

        // SHOW NAVIGATION TEMPORARILY ON VERTICAL TRANSITION
        // This ensures users know where they are when switching projects
        if (this.navigation && this.navigation.sidebarComponent) {
            this.navigation.sidebarComponent.showUI(3000);
        }

        // Step 3: Slide in new content
        await this.slideInContent(direction);

        this.currentModuleIndex = targetIndex;
        this.isTransitioning = false;
    }

    async slideOutContent(direction) {
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const multiplier = direction === 'down' ? 1 : -1;

        // Slide out current content
        await gsap.to([mainContent, heroContainer], {
            y: multiplier * -100,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }

    async slideInContent(direction) {
        const mainContent = document.querySelector('.main-content');
        const heroContainer = document.querySelector('.hero-container');
        const multiplier = direction === 'down' ? 1 : -1;

        // Position new content off-screen in the opposite direction
        gsap.set([mainContent, heroContainer], {
            y: multiplier * 100,
            opacity: 0
        });

        // Slide in new content
        await gsap.to([mainContent, heroContainer], {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }
}

// Global animation utility using GSAP
window.triggerScaleReveal = function(container, selector = '.scale-reveal') {
    const elements = container.querySelectorAll(selector);
    
    if (elements.length === 0) return;
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        gsap.set(elements, {
            clipPath: 'inset(0% 0% 0% 0% round 12px)',
            opacity: 1
        });
        return;
    }
    
    // Get the border radius from each element (or use default)
    elements.forEach((element, index) => {
        const computedStyle = window.getComputedStyle(element);
        const borderRadius = computedStyle.borderRadius || '12px';
        
        // Store the border radius on the element for transition out
        element.dataset.borderRadius = borderRadius;
        
        // Set initial state - small dot at top-left corner
        gsap.set(element, {
            clipPath: `inset(0% 100% 100% 0% round ${borderRadius})`,
            opacity: 1
        });
        
        // Animate to full reveal
        gsap.to(element, {
            clipPath: `inset(0% 0% 0% 0% round ${borderRadius})`,
            duration: 0.8,
            ease: 'expo.out',
            delay: index * 0.1,
            onComplete: () => {
                // Ensure clip-path stays set for transition out
                gsap.set(element, {
                    clipPath: `inset(0% 0% 0% 0% round ${borderRadius})`
                });
            }
        });
    });
};

// Global GSAP hover system - systematic approach
window.setupGSAPHovers = function(container, selector, options = {}) {
    const elements = container.querySelectorAll(selector);
    
    if (elements.length === 0) return;
    
    // Default hover configuration
    const config = {
        y: -4,
        scale: 1.02,
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.12)',
        duration: 0.3,
        ease: 'power2.out',
        ...options
    };
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // Skip hover effects
    
    elements.forEach(element => {
        // Store original box-shadow for restoration
        const originalBoxShadow = window.getComputedStyle(element).boxShadow;
        
        element.addEventListener('mouseenter', () => {
            // Kill any ongoing animations on this element
            gsap.killTweensOf(element);
            
            // Animate to hover state
            gsap.to(element, {
                y: config.y,
                scale: config.scale,
                boxShadow: config.boxShadow,
                duration: config.duration,
                ease: config.ease,
                overwrite: 'auto'
            });
        });
        
        element.addEventListener('mouseleave', () => {
            // Kill any ongoing animations on this element
            gsap.killTweensOf(element);
            
            // Animate back to default state
            gsap.to(element, {
                y: 0,
                scale: 1,
                boxShadow: originalBoxShadow,
                duration: config.duration,
                ease: config.ease,
                overwrite: 'auto'
            });
        });
    });
};

// Initialize app
const app = new App();
app.init();

// Handle browser back/forward
window.addEventListener('popstate', () => {
    if (app.isReady) {
        app.handleUrlNavigation();
    }
});

// Global helper to reset and show tutorial again
window.showTutorial = () => {
    Tutorial.resetTutorial();
    location.reload();
};

