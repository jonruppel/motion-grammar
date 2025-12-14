/**
 * HorizontalSlider Component
 * Handles horizontal slide navigation for case studies and slide decks
 * Supports touch, swipe, and keyboard navigation
 */

import { Component } from '../Component.js';
import { createIPhoneMockup, createLaptopMockup, createTVMockup } from '../../utils/mockup-helper.js';
import { ColorExtractor } from '../../utils/ColorExtractor.js';
import { lazyImageLoader } from '../../utils/lazy-image-loader.js';
import { globalPreloader } from '../../utils/global-preloader.js';

export class HorizontalSlider extends Component {
    constructor(props) {
        super(props);
        
        this.rawSlides = props.slides || [];
        // Group consecutive slides of same mockup type
        this.groupedSlides = this.groupSlides(this.rawSlides);
        
        // Map flat index (0..total-1) to { groupIndex, internalIndex }
        this.slideMap = this.createSlideMap(this.rawSlides, this.groupedSlides);
        
        this.currentFlatIndex = props.initialIndex || 0;
        
        // Create sections for category navigation
        this.sections = this.createSections(this.rawSlides);
        this.currentSectionIndex = this.sections.findIndex(s => 
            this.currentFlatIndex >= s.startIndex && this.currentFlatIndex <= s.endIndex
        );
        if (this.currentSectionIndex === -1) this.currentSectionIndex = 0;

        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0; // Initialize touchStartY
        this.onSlideChange = props.onSlideChange || (() => {});
        
        // Track if we're dragging so app can disable vertical navigation
        this.isDragging = false;
        
        // Cache for extracted colors
        this.colorCache = new Map();

        // Queue preloading of all images in this deck
        this.queueAllImages();
    }

    queueAllImages() {
        const urls = [];
        this.rawSlides.forEach(slide => {
            // Main source (if image)
            if (slide.src && !slide.src.endsWith('.mp4')) {
                urls.push(slide.src);
            }
            // Title image
            if (slide.titleImage) {
                urls.push(slide.titleImage);
            }
            // Composite mockup images
            if (slide.images && Array.isArray(slide.images)) {
                slide.images.forEach(img => {
                    const src = typeof img === 'string' ? img : img.src;
                    if (src) urls.push(src);
                });
            }
            // Thumbnails
            if (slide.thumbnail) {
                urls.push(slide.thumbnail);
            }
        });
        
        if (urls.length > 0) {
            globalPreloader.addToQueue(urls, false);
        }
    }

    groupSlides(slides) {
        const groups = [];
        let currentGroup = null;

        slides.forEach((slide, index) => {
            const isMockup = ['laptop', 'iphone', 'tv'].includes(slide.type);
            
            if (currentGroup && isMockup && slide.type === currentGroup.mockupType) {
                // Continue current group
                currentGroup.slides.push(slide);
            } else {
                // Push previous group if exists
                if (currentGroup) {
                    groups.push(currentGroup);
                    currentGroup = null;
                }

                // Start new group or push distinct slide
                // We only group if it's a mockup type.
                // Note: Even a single mockup is treated as a group of 1 for consistency if we want,
                // but to match previous behavior for single slides, we can check next/prev?
                // Actually, converting ALL mockups to composite structure simplifies rendering logic.
                if (isMockup) {
                    currentGroup = {
                        type: 'composite-mockup',
                        mockupType: slide.type,
                        slides: [slide]
                    };
                } else {
                    groups.push(slide);
                }
            }
        });

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return groups;
    }

    createSlideMap(rawSlides, groupedSlides) {
        const map = [];
        let rawIndex = 0;

        groupedSlides.forEach((group, groupIndex) => {
            if (group.type === 'composite-mockup') {
                group.slides.forEach((slide, internalIndex) => {
                    map.push({ groupIndex, internalIndex });
                });
            } else {
                map.push({ groupIndex, internalIndex: 0 });
            }
        });

        return map;
    }

    createSections(slides) {
        const sections = [];
        let currentSection = null;

        slides.forEach((slide, index) => {
            if (slide.type === 'overview' || slide.type === 'intro') {
                if (currentSection) {
                    currentSection.endIndex = index - 1;
                    sections.push(currentSection);
                }
                currentSection = {
                    title: slide.title || (slide.type === 'overview' ? 'Overview' : 'Section'),
                    startIndex: index,
                    endIndex: slides.length - 1
                };
            }
        });
        
        if (currentSection) {
            sections.push(currentSection);
        }
        
        if (sections.length === 0 && slides.length > 0) {
             sections.push({ title: 'Gallery', startIndex: 0, endIndex: slides.length - 1 });
        }
        
        return sections;
    }

    renderIndicators() {
        let html = '';
        
        // If we have sections, use the Chapter Pill + Dots logic
        if (this.sections.length > 1) {
            this.sections.forEach((section, index) => {
                const isCurrentSection = index === this.currentSectionIndex;
                
                if (isCurrentSection) {
                    // Render dots for slides in this section
                    for (let i = section.startIndex; i <= section.endIndex; i++) {
                        html += `
                            <button class="slider-indicator ${i === this.currentFlatIndex ? 'active' : ''}" 
                                    data-slide="${i}"
                                    aria-label="Go to slide ${i + 1}">
                            </button>
                        `;
                    }
                } else {
                    // Render a single Chapter Pill
                    html += `
                        <button class="chapter-indicator" 
                                data-section-index="${index}"
                                aria-label="Go to ${section.title}"
                                title="${section.title}">
                        </button>
                    `;
                }
            });
        } else {
            // Default behavior: dots for all slides
            for (let i = 0; i < this.rawSlides.length; i++) {
                html += `
                    <button class="slider-indicator ${i === this.currentFlatIndex ? 'active' : ''}" 
                            data-slide="${i}"
                            aria-label="Go to slide ${i + 1}">
                    </button>
                `;
            }
        }
        
        return html;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'horizontal-slider';
        
        // Only show controls if there's more than one slide
        const showControls = this.rawSlides.length > 1;
        
        container.innerHTML = `
            <div class="horizontal-slider-track">
                ${this.groupedSlides.map((slide, index) => this.renderSlide(slide, index)).join('')}
            </div>
            ${showControls ? `
            <div class="horizontal-slider-controls">
                <button class="slider-nav slider-nav-prev" aria-label="Previous slide" disabled>
                    <i class='bx bx-chevron-left'></i>
                </button>
                <div class="slider-indicators">
                    ${this.renderIndicators()}
                </div>
                <button class="slider-nav slider-nav-next" aria-label="Next slide">
                    <i class='bx bx-chevron-right'></i>
                </button>
            </div>
            ` : ''}
        `;

        this.setupEventListeners(container);
        
        return container;
    }

    renderSlide(slide, index) {
        // Check if it's our new composite type
        if (slide.type === 'composite-mockup') {
            return this.renderCompositeMockupSlide(slide, index);
        }

        // Standard handling for non-grouped slides
        switch (slide.type) {
            case 'overview':
                return this.renderOverviewSlide(slide, index);
            case 'image':
                return this.renderImageSlide(slide, index);
            case 'video':
                return this.renderVideoSlide(slide, index);
            case 'intro':
            case 'philosophy':
            case 'approach':
            case 'background':
            case 'contact':
                return this.renderTextSlide(slide, index);
            // Single mockups that for some reason didn't get grouped (though our logic groups all mockups)
            case 'iphone':
                return this.renderIPhoneMockupSlide(slide, index);
            case 'laptop':
                return this.renderLaptopMockupSlide(slide, index);
            case 'tv':
                return this.renderTVMockupSlide(slide, index);
            default:
                return this.renderDefaultSlide(slide, index);
        }
    }

    renderCompositeMockupSlide(group, index) {
        // We render one mockup frame
        // The content area contains a track of all slides in the group
        
        const wrapper = document.createElement('div');
        wrapper.className = 'horizontal-slide';
        wrapper.setAttribute('data-slide-index', index); // This is the GROUP index

        const content = document.createElement('div');
        content.className = 'slide-content slide-mockup';

        // Create the base mockup (empty)
        let mockup;
        if (group.mockupType === 'iphone') {
            mockup = createIPhoneMockup([]);
        } else if (group.mockupType === 'laptop') {
            mockup = createLaptopMockup([]);
        } else if (group.mockupType === 'tv') {
            mockup = createTVMockup([]);
            // Initialize title
            const titleEl = mockup.querySelector('.tv-title');
            if (titleEl && group.slides.length > 0) {
                const first = group.slides[0];
                titleEl.innerText = first.caption || first.alt || '';
            }
        }

        // Find the content container within the mockup
        // Based on mockup-helper.js classes:
        // iPhone: .iphone-content
        // Laptop: .laptop-content
        // TV: .tv-content
        const contentClass = `.${group.mockupType}-content`;
        const contentContainer = mockup.querySelector(contentClass);
        
        if (contentContainer) {
            // Style content container to be a slider
            contentContainer.style.overflow = 'hidden';
            contentContainer.style.display = 'flex';
            contentContainer.style.flexDirection = 'row'; // Force row
            
            // Create internal track
            const internalTrack = document.createElement('div');
            internalTrack.className = 'internal-slider-track';
            internalTrack.style.display = 'flex';
            internalTrack.style.width = '100%';
            internalTrack.style.height = '100%';
            internalTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Render each slide's content into the track
            group.slides.forEach(slide => {
                const slideItem = document.createElement('div');
                slideItem.className = 'internal-slide';
                slideItem.style.flex = '0 0 100%';
                slideItem.style.width = '100%';
                slideItem.style.height = '100%';
                slideItem.style.display = 'flex';
                slideItem.style.justifyContent = 'flex-start'; // Use flex-start to ensure top of scrolling content is accessible
                
                // Content alignment & Scrolling logic
                // Ensure content starts at top and is scrollable
                slideItem.style.flexDirection = 'column'; // Ensure column layout
                slideItem.style.overflowY = 'auto';
                slideItem.style.overflowX = 'hidden';
                slideItem.style.webkitOverflowScrolling = 'touch';
                
                // Add the image(s)/video(s)
                if (group.mockupType === 'tv' && (slide.videos || (slide.src && slide.src.includes('.mp4')))) {
                   // Handle TV Video
                   const videoSrcs = slide.videos ? slide.videos.map(v => v.src || v) : [slide.src];
                   const video = document.createElement('video');
                   video.src = videoSrcs[0];
                   video.controls = true;
                   video.style.width = '100%';
                   video.style.height = 'auto';
                   video.style.margin = 'auto'; // Center vertically if smaller
                   slideItem.appendChild(video);
                } else {
                    // Handle Images
                    const imageSrcs = slide.images ? slide.images.map(img => img.src || img) : [slide.src];
                    
                    const img = document.createElement('img');
                    img.src = imageSrcs[0];
                    img.alt = slide.alt || 'Case study image';
                    img.loading = 'lazy';
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.display = 'block';
                    img.style.margin = 'auto'; // Center vertically if smaller
                    slideItem.appendChild(img);
                }
                
                internalTrack.appendChild(slideItem);
            });
            
            contentContainer.appendChild(internalTrack);
        }

        content.appendChild(mockup);
        wrapper.appendChild(content);

        const temp = document.createElement('div');
        temp.appendChild(wrapper);
        return temp.innerHTML;
    }

    renderOverviewSlide(slide, index) {
        const hasTitleImage = !!slide.titleImage;
        const titleImageHtml = hasTitleImage 
            ? `<img data-lazy-src="${slide.titleImage}" alt="${slide.title || ''}" class="slide-title-image" />`
            : '';
        const extraClass = hasTitleImage ? 'has-title-image' : '';
        
        return `
            <div class="horizontal-slide" data-slide-index="${index}">
                <div class="slide-content slide-overview ${extraClass}">
                    <h1 class="slide-title">${slide.title || ''}</h1>
                    <p class="slide-description">${slide.description || ''}</p>
                    ${titleImageHtml}
                </div>
            </div>
        `;
    }

    renderImageSlide(slide, index) {
        return `
            <div class="horizontal-slide" data-slide-index="${index}">
                <div class="slide-content slide-image">
                    <div class="slide-image-container">
                        <img data-lazy-src="${slide.src}" 
                             alt="${slide.alt || ''}"
                             class="slide-image-element">
                    </div>
                </div>
            </div>
        `;
    }

    renderIPhoneMockupSlide(slide, index) {
        // Fallback for single slides if not grouped (though logic groups them)
        const wrapper = document.createElement('div');
        wrapper.className = 'horizontal-slide';
        wrapper.setAttribute('data-slide-index', index);

        const content = document.createElement('div');
        content.className = 'slide-content slide-mockup';

        const imageSrcs = slide.images ? slide.images.map(img => img.src || img) : [slide.src];
        const mockup = createIPhoneMockup(imageSrcs);
        content.appendChild(mockup);

        wrapper.appendChild(content);
        const temp = document.createElement('div');
        temp.appendChild(wrapper);
        return temp.innerHTML;
    }

    renderLaptopMockupSlide(slide, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'horizontal-slide';
        wrapper.setAttribute('data-slide-index', index);

        const content = document.createElement('div');
        content.className = 'slide-content slide-mockup';

        const imageSrcs = slide.images ? slide.images.map(img => img.src || img) : [slide.src];
        const mockup = createLaptopMockup(imageSrcs);
        content.appendChild(mockup);

        wrapper.appendChild(content);
        const temp = document.createElement('div');
        temp.appendChild(wrapper);
        return temp.innerHTML;
    }

    renderTVMockupSlide(slide, index) {
        const wrapper = document.createElement('div');
        wrapper.className = 'horizontal-slide';
        wrapper.setAttribute('data-slide-index', index);

        const content = document.createElement('div');
        content.className = 'slide-content slide-mockup';

        const videoSrcs = slide.videos ? slide.videos.map(v => v.src || v) : [slide.src];
        const mockup = createTVMockup(videoSrcs);
        content.appendChild(mockup);

        wrapper.appendChild(content);
        const temp = document.createElement('div');
        temp.appendChild(wrapper);
        return temp.innerHTML;
    }

    renderVideoSlide(slide, index) {
        return `
            <div class="horizontal-slide" data-slide-index="${index}">
                <div class="slide-content slide-video">
                    <div class="slide-video-container">
                        <video src="${slide.src}" 
                               poster="${slide.thumbnail || ''}"
                               controls
                               playsinline
                               class="slide-video-element">
                            Your browser does not support video playback.
                        </video>
                    </div>
                </div>
            </div>
        `;
    }

    renderTextSlide(slide, index) {
        const titleImageHtml = slide.titleImage 
            ? `<img data-lazy-src="${slide.titleImage}" alt="${slide.title || ''}" class="slide-title-image" />`
            : '';
        const hasTitleImageClass = slide.titleImage ? 'has-title-image' : '';
        
        return `
            <div class="horizontal-slide" data-slide-index="${index}">
                <div class="slide-content slide-text ${hasTitleImageClass}">
                    <h1 class="slide-title">${slide.title || ''}</h1>
                    ${slide.content ? `<p class="slide-text-content">${slide.content}</p>` : ''}
                    ${titleImageHtml}
                </div>
            </div>
        `;
    }

    renderDefaultSlide(slide, index) {
        return `
            <div class="horizontal-slide" data-slide-index="${index}">
                <div class="slide-content">
                    <p>Slide ${index + 1}</p>
                </div>
            </div>
        `;
    }

    setupEventListeners(container) {
        // Chapter Indicators
        const chapterIndicators = container.querySelectorAll('.chapter-indicator');
        if (chapterIndicators.length > 0) {
            chapterIndicators.forEach(pill => {
                pill.addEventListener('click', (e) => {
                    const sectionIndex = parseInt(e.target.dataset.sectionIndex);
                    const section = this.sections[sectionIndex];
                    if (section) {
                        this.goToSlide(section.startIndex);
                        e.target.blur();
                    }
                });
            });
        }

        const track = container.querySelector('.horizontal-slider-track');
        const prevBtn = container.querySelector('.slider-nav-prev');
        const nextBtn = container.querySelector('.slider-nav-next');
        const indicators = container.querySelectorAll('.slider-indicator');
        const videos = container.querySelectorAll('video');

        // Button navigation (only if controls exist)
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.goToPrevious();
                prevBtn.blur();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToNext();
                nextBtn.blur();
            });
        }

        // Indicator navigation (only if indicators exist)
        if (indicators.length > 0) {
            indicators.forEach(indicator => {
                indicator.addEventListener('click', (e) => {
                    const slideIndex = parseInt(e.target.dataset.slide);
                    this.goToSlide(slideIndex);
                    indicator.blur();
                });
            });
        }

        // Touch/swipe navigation
        track.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            window.isVisualizationDragging = true;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY; // Track Y for vertical scroll detection
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (this.isDragging) {
                const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
                const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
                
                // If horizontal drag is dominant, prevent default (scroll)
                // If vertical drag is dominant, allow default (native scroll)
                if (deltaX > deltaY) {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                } else {
                    // Let browser handle vertical scroll
                    // But if we're in a scrollable container (mockup content), make sure we don't interfere
                }
            }
        }, { passive: false });

        track.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
            this.isDragging = false;
            window.isVisualizationDragging = false;
        }, { passive: true });

        // Ensure only one video plays at a time and set start time
        videos.forEach(video => {
            // Start at 2s to avoid black frame (static frame)
            const setStartTime = () => {
                // Ensure we don't seek past the end if video is very short
                // Check if duration is valid (not Infinity or NaN)
                if (video.duration && video.duration > 2) {
                    video.currentTime = 2;
                }
            };

            if (video.readyState >= 1) {
                setStartTime();
            } else {
                video.addEventListener('loadedmetadata', setStartTime, { once: true });
            }

            video.addEventListener('play', () => {
                videos.forEach(other => {
                    if (other !== video && !other.paused) {
                        other.pause();
                    }
                });
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!container.offsetParent) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToPrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.goToNext();
            }
        });

        // Initialize background color and state
        this.initializeState(container);
    }

    initializeState(container) {
        // Initialize background color
        this.updateBackgroundForSlide(this.currentFlatIndex);
        
        // If not at 0, update positions and controls
        if (this.currentFlatIndex > 0) {
            // 1. Main track
            const { groupIndex, internalIndex } = this.slideMap[this.currentFlatIndex];
            const track = container.querySelector('.horizontal-slider-track');
            if (track) {
                const offset = -groupIndex * 100;
                track.style.transition = 'none'; // Ensure no animation on init
                track.style.transform = `translateX(${offset}%)`;
            }
            
            // 2. Internal track (if applicable)
            const currentGroup = this.groupedSlides[groupIndex];
            if (currentGroup && currentGroup.type === 'composite-mockup') {
                const groupSlideEl = container.querySelector(`.horizontal-slide[data-slide-index="${groupIndex}"]`);
                if (groupSlideEl) {
                    const internalTrack = groupSlideEl.querySelector('.internal-slider-track');
                    if (internalTrack) {
                         const internalOffset = -internalIndex * 100;
                         internalTrack.style.transition = 'none';
                         internalTrack.style.transform = `translateX(${internalOffset}%)`;
                         
                         // Update TV Title
                         if (currentGroup.mockupType === 'tv') {
                             const titleEl = groupSlideEl.querySelector('.tv-title');
                             if (titleEl) {
                                 const currentSlide = currentGroup.slides[internalIndex];
                                 titleEl.innerText = currentSlide.caption || currentSlide.alt || '';
                             }
                         }
                    }
                }
            }
            
            // 3. Update buttons
            const prevBtn = container.querySelector('.slider-nav-prev');
            const nextBtn = container.querySelector('.slider-nav-next');
            if (prevBtn) prevBtn.disabled = this.currentFlatIndex === 0;
            if (nextBtn) nextBtn.disabled = this.currentFlatIndex === this.rawSlides.length - 1;
        }
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = this.touchStartX - this.touchEndX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                this.goToNext();
            } else {
                this.goToPrevious();
            }
        }
    }

    goToSlide(flatIndex, animated = true) {
        if (this.isTransitioning || flatIndex === this.currentFlatIndex) return;
        if (flatIndex < 0 || flatIndex >= this.rawSlides.length) return;

        // Map flat index to group/internal index
        const { groupIndex, internalIndex } = this.slideMap[flatIndex];
        const { groupIndex: currentGroupIndex } = this.slideMap[this.currentFlatIndex];

        this.isTransitioning = true;
        
        // Pause videos
        // Note: Logic needs to be robust for finding videos in composite slides
        // For now, pause all in container
        if (this.element) {
            const allVideos = this.element.querySelectorAll('video');
            allVideos.forEach(v => v.pause());
        }

        this.currentFlatIndex = flatIndex;

        // 1. Move MAIN track if group changed
        if (groupIndex !== currentGroupIndex || !this.element) {
            const track = this.element.querySelector('.horizontal-slider-track');
            const slideWidth = 100;
            const offset = -groupIndex * slideWidth;
            
            if (animated) {
                track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            } else {
                track.style.transition = 'none';
            }
            track.style.transform = `translateX(${offset}%)`;
        }

        // 2. Move INTERNAL track if it's a composite slide
        const currentGroup = this.groupedSlides[groupIndex];
        if (currentGroup.type === 'composite-mockup') {
            const groupSlideEl = this.element.querySelector(`.horizontal-slide[data-slide-index="${groupIndex}"]`);
            if (groupSlideEl) {
                const internalTrack = groupSlideEl.querySelector('.internal-slider-track');
                if (internalTrack) {
                    const offset = -internalIndex * 100;
                    if (animated) {
                        internalTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    } else {
                        internalTrack.style.transition = 'none';
                    }
                    internalTrack.style.transform = `translateX(${offset}%)`;

                    // Update TV Title
                    if (currentGroup.mockupType === 'tv') {
                        const titleEl = groupSlideEl.querySelector('.tv-title');
                        if (titleEl) {
                            const currentSlide = currentGroup.slides[internalIndex];
                            titleEl.innerText = currentSlide.caption || currentSlide.alt || '';
                        }
                    }
                }
            }
        }

        // Update Section and Indicators
        const newSectionIndex = this.sections.findIndex(s => 
            flatIndex >= s.startIndex && flatIndex <= s.endIndex
        );
        
        if (newSectionIndex !== -1 && newSectionIndex !== this.currentSectionIndex) {
            this.currentSectionIndex = newSectionIndex;
            
            // Re-render indicators (which includes chapter pills now)
            const indicatorsContainer = this.element.querySelector('.slider-indicators');
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = this.renderIndicators();
                
                // Re-bind listeners for dots
                const newIndicators = indicatorsContainer.querySelectorAll('.slider-indicator');
                newIndicators.forEach(indicator => {
                    indicator.addEventListener('click', (e) => {
                        const slideIndex = parseInt(e.target.dataset.slide);
                        this.goToSlide(slideIndex);
                        indicator.blur();
                    });
                });

                // Re-bind listeners for chapter pills
                const chapterIndicators = indicatorsContainer.querySelectorAll('.chapter-indicator');
                chapterIndicators.forEach(pill => {
                    pill.addEventListener('click', (e) => {
                        const sectionIndex = parseInt(e.target.dataset.sectionIndex);
                        const section = this.sections[sectionIndex];
                        if (section) {
                            this.goToSlide(section.startIndex);
                            e.target.blur();
                        }
                    });
                });
            }
        } else {
            // Same section, just update active class
            const indicators = this.element.querySelectorAll('.slider-indicator');
            indicators.forEach(indicator => {
                const i = parseInt(indicator.dataset.slide);
                indicator.classList.toggle('active', i === flatIndex);
            });
        }

        // Update button states (only if they exist)
        const prevBtn = this.element.querySelector('.slider-nav-prev');
        const nextBtn = this.element.querySelector('.slider-nav-next');
        
        if (prevBtn) prevBtn.disabled = flatIndex === 0;
        if (nextBtn) nextBtn.disabled = flatIndex === this.rawSlides.length - 1;

        // Callback
        this.onSlideChange(flatIndex, this.rawSlides[flatIndex]);

        // Update background color based on slide image
        this.updateBackgroundForSlide(flatIndex);

        setTimeout(() => {
            this.isTransitioning = false;
            
            // Force lazy loader check after slide transition (Safari iOS fix)
            lazyImageLoader.checkVisibleImages();
        }, 500);
    }

    goToNext() {
        if (this.currentFlatIndex < this.rawSlides.length - 1) {
            this.goToSlide(this.currentFlatIndex + 1);
        }
    }

    goToPrevious() {
        if (this.currentFlatIndex > 0) {
            this.goToSlide(this.currentFlatIndex - 1);
        }
    }

    async updateBackgroundForSlide(index) {
        const slide = this.rawSlides[index];
        const body = document.body;
        
        // Reset to default if not an image slide or no source
        if (slide.type !== 'image' || !slide.src) {
            document.documentElement.style.setProperty('--current-tint-color', 'transparent');
            document.documentElement.style.removeProperty('--dominant-color');
            return;
        }

        // Apply color with 75% opacity over the base theme background
        const applyColor = (rgbString) => {
            // rgbString is expected to be "rgb(r, g, b)"
            // Convert to rgba with 0.75 opacity
            const rgbaString = rgbString.replace('rgb', 'rgba').replace(')', ', 0.75)');
            
            // Set the tint color variable which is used by body::after
            document.documentElement.style.setProperty('--current-tint-color', rgbaString);
            
            document.documentElement.style.setProperty('--dominant-color', rgbString);
        };

        // Check cache
        if (this.colorCache.has(slide.src)) {
            applyColor(this.colorCache.get(slide.src));
            return;
        }

        // Extract color
        try {
            const color = await ColorExtractor.getDominantColor(slide.src);
            if (color) {
                this.colorCache.set(slide.src, color);
                // Ensure we are still on the same slide before applying
                if (this.currentFlatIndex === index) {
                    applyColor(color);
                }
            } else {
                document.documentElement.style.setProperty('--current-tint-color', 'transparent');
            }
        } catch (e) {
            console.error('Failed to update background color:', e);
            document.documentElement.style.setProperty('--current-tint-color', 'transparent');
        }
    }

    destroy() {
        // Reset background when destroying the slider
        document.documentElement.style.setProperty('--current-tint-color', 'transparent');
        document.documentElement.style.removeProperty('--dominant-color');

        window.isVisualizationDragging = false;
        super.destroy();
    }
}
