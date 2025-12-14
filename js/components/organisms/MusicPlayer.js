import { Component } from '../Component.js';

export class MusicPlayer extends Component {
    constructor() {
        super();
        this.playlist = [
            { url: '/music/neon-currents.mp3', name: 'Neon Currents' },
            { url: '/music/neon-currents-alt.mp3', name: 'Neon Currents Alt' },
            { url: '/music/epic-tales.mp3', name: 'Epic Tales' },
            { url: '/music/escape-plan.mp3', name: 'Escape Plan' },
            { url: '/music/no-telling.mp3', name: 'No Telling' },
            { url: '/music/vibe-out.mp3', name: 'Vibe Out' }
        ];
        // Start with a random track
        this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);
        this.isPlaying = false;
        this.volume = 0.5;
        this.isHovered = false;
        
        // HTML5 Audio for streaming
        this.audioElement = null;
        this.nextAudioElement = null; // For preloading
        
        // Web Audio API context
        this.audioContext = null;
        this.mediaSource = null;
        this.gainNode = null;
        this.attenuationNode = null; // New: For "next door" volume drop
        this.filterNode = null;      // New: For "next door" lowpass filter
        this.analyser = null;
        
        // Visualizer
        this.canvas = null;
        this.canvasCtx = null;
        this.animationId = null;
        
        // Bindings
        this.togglePlay = this.togglePlay.bind(this);
        this.nextTrack = this.nextTrack.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
        this.draw = this.draw.bind(this);
        
        this.hasAutoPlayed = false;
        this.isDucked = false;
        this.isMuffled = false; // Store target muffle state
    }

    initAudioContext() {
        if (this.audioContext) return Promise.resolve();
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        // Create audio element for streaming
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto'; // Start loading as soon as src is set
        this.audioElement.volume = 1.0; // Control volume via gainNode instead
        
        // Create media source from audio element
        this.mediaSource = this.audioContext.createMediaElementSource(this.audioElement);
        
        // Create nodes
        this.gainNode = this.audioContext.createGain(); // Master Volume
        this.attenuationNode = this.audioContext.createGain(); // Effect Volume
        this.filterNode = this.audioContext.createBiquadFilter(); // Effect Filter
        this.analyser = this.audioContext.createAnalyser();
        
        // Configure Nodes
        this.gainNode.gain.value = this.volume;
        this.analyser.fftSize = 64;
        
        this.filterNode.type = 'lowpass';
        
        // Apply initial muffle state immediately
        if (this.isMuffled) {
            this.filterNode.frequency.value = 600;
            this.attenuationNode.gain.value = 0.4;
        } else {
            this.filterNode.frequency.value = 22000;
            this.attenuationNode.gain.value = 1.0;
        }
        
        // Connect Graph:
        // MediaSource -> Analyser -> Filter -> Attenuation -> MasterGain -> Destination
        this.mediaSource.connect(this.analyser);
        this.analyser.connect(this.filterNode);
        this.filterNode.connect(this.attenuationNode);
        this.attenuationNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // Handle track ending
        this.audioElement.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        // Expose analyser globally for visualizations
        window.audioAnalyser = this.analyser;
        window.musicVolume = this.volume;
        window.musicIsPlaying = false;
        
        return Promise.resolve();
    }

    async playTrack(index) {
        if (!this.audioContext) await this.initAudioContext();
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();

        const track = this.playlist[index];
        
        // Set new source and start playing immediately (streaming)
        this.audioElement.src = track.url;
        
        try {
            await this.audioElement.play();
            this.currentTrackIndex = index;
            this.isPlaying = true;
            window.musicIsPlaying = true;
            this.updateUIState();
            this.startVisualizer();
            this.updateTrackInfo();
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }

    stopCurrentTrack() {
        if (this.audioElement) {
            this.audioElement.pause();
        }
    }

    togglePlay() {
        // Always expand when interacting
        const player = this.element.querySelector('.music-player');
        player.classList.add('expanded');

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        if (!this.audioContext) {
            await this.initAudioContext();
        }
        
        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        if (!this.audioElement.src || this.audioElement.src === '') {
            // First play - start with current track
            await this.playTrack(this.currentTrackIndex);
        } else {
            // Resume existing track
            try {
                // Only play if paused
                if (this.audioElement.paused) {
                    await this.audioElement.play();
                }
                this.isPlaying = true;
                window.musicIsPlaying = true;
                this.updateUIState();
                this.startVisualizer();
            } catch (error) {
                console.error('Error resuming playback:', error);
            }
        }
    }

    pause() {
        if (!this.isPlaying) return;
        
        // Pause the audio element first
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        // Suspend the audio context to stop processing
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        
        this.isPlaying = false;
        window.musicIsPlaying = false;
        this.updateUIState();
        this.stopVisualizer();
    }

    nextTrack() {
        const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playTrack(nextIndex);
    }

    setMuffled(isMuffled) {
        this.isMuffled = isMuffled;
        
        if (!this.audioContext || !this.filterNode || !this.attenuationNode) return;
        
        const now = this.audioContext.currentTime;
        const timeConstant = 0.5; // smooth transition duration
        
        if (isMuffled) {
            // Muffle: Filter down to 600Hz, Volume down to 0.4
            this.filterNode.frequency.setTargetAtTime(600, now, timeConstant);
            this.attenuationNode.gain.setTargetAtTime(0.4, now, timeConstant);
        } else {
            // Normal: Filter up to 22000Hz, Volume up to 1.0
            this.filterNode.frequency.setTargetAtTime(22000, now, timeConstant);
            this.attenuationNode.gain.setTargetAtTime(1.0, now, timeConstant);
        }
    }

    setVolume(val) {
        this.volume = val;
        // Only apply immediate volume change if not ducked
        if (this.gainNode && !this.isDucked) {
            this.gainNode.gain.value = this.volume;
        }
        window.musicVolume = this.volume;
    }

    duck() {
        if (!this.gainNode || !this.isPlaying || this.isDucked) return;
        
        this.isDucked = true;
        
        // Fade out to 0
        const now = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    }

    unduck() {
        if (!this.gainNode || !this.isPlaying || !this.isDucked) return;
        
        this.isDucked = false;
        
        // Fade back to set volume
        const now = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, now + 1.0);
    }

    handleVolumeChange(e) {
        const val = parseFloat(e.target.value);
        this.setVolume(val);
    }

    startVisualizer() {
        if (!this.animationId) {
            this.draw();
        }
    }

    stopVisualizer() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            // Clear both canvases
            if (this.canvasCtx) {
                this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            if (this.canvasModalCtx) {
                this.canvasModalCtx.clearRect(0, 0, this.canvasModal.width, this.canvasModal.height);
            }
        }
    }

    draw() {
        if (!this.analyser || !this.canvasCtx || !this.isPlaying) return;

        this.animationId = requestAnimationFrame(this.draw);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const color = theme === 'dark' ? '255, 255, 255' : '0, 0, 0';

        // Draw on main canvas
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.canvasCtx.clearRect(0, 0, width, height);

        // 2px bars with spaces between, alternating blue and red
        const barWidth = 2;
        const barGap = 2;
        const barUnit = barWidth + barGap; // 4px per bar
        const totalBars = Math.floor(width / barUnit);
        const channelCount = 12; // Number of frequency channels
        let x = 0;

        for (let i = 0; i < totalBars; i++) {
            const isBlue = i % 2 === 0; // Alternate: blue, red, blue, red...
            
            if (isBlue) {
                // Blue: left to right, low to high frequency
                const blueIndex = Math.floor(i / 2);
                const blueBarsTotal = Math.ceil(totalBars / 2);
                const channel = Math.floor((blueIndex / blueBarsTotal) * channelCount);
                const dataIndex = Math.floor((channel / channelCount) * bufferLength);
                const barHeight = (dataArray[dataIndex] / 255) * height * this.volume;
                
                this.canvasCtx.fillStyle = `rgba(59, 130, 246, 0.6)`; // Blue
                this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            } else {
                // Red: left to right position but high to low frequency (inverted)
                const redIndex = Math.floor(i / 2);
                const redBarsTotal = Math.floor(totalBars / 2);
                const progress = redIndex / Math.max(1, redBarsTotal - 1);
                const channel = Math.min(channelCount - 1, Math.floor((1 - progress) * channelCount));
                const dataIndex = Math.floor((channel / channelCount) * bufferLength);
                const barHeight = (dataArray[dataIndex] / 255) * height * this.volume;
                
                this.canvasCtx.fillStyle = `rgba(239, 68, 68, 0.6)`; // Red
                this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            }
            
            x += barUnit;
        }
        
        // Draw on modal canvas if it exists
        if (this.canvasModalCtx) {
            const modalWidth = this.canvasModal.width;
            const modalHeight = this.canvasModal.height;
            this.canvasModalCtx.clearRect(0, 0, modalWidth, modalHeight);

            // 2px bars with spaces between, alternating blue and red
            const modalBarWidth = 2;
            const modalBarGap = 2;
            const modalBarUnit = modalBarWidth + modalBarGap; // 4px per bar
            const modalTotalBars = Math.floor(modalWidth / modalBarUnit);
            const modalChannelCount = 12; // Number of frequency channels
            let modalX = 0;

            for (let i = 0; i < modalTotalBars; i++) {
                const isBlue = i % 2 === 0; // Alternate: blue, red, blue, red...
                
                if (isBlue) {
                    // Blue: left to right, low to high frequency
                    const blueIndex = Math.floor(i / 2);
                    const blueBarsTotal = Math.ceil(modalTotalBars / 2);
                    const channel = Math.floor((blueIndex / blueBarsTotal) * modalChannelCount);
                    const dataIndex = Math.floor((channel / modalChannelCount) * bufferLength);
                    const barHeight = (dataArray[dataIndex] / 255) * modalHeight * this.volume;
                    
                    this.canvasModalCtx.fillStyle = `rgba(59, 130, 246, 0.6)`; // Blue
                    this.canvasModalCtx.fillRect(modalX, modalHeight - barHeight, modalBarWidth, barHeight);
                } else {
                    // Red: left to right position but high to low frequency (inverted)
                    const redIndex = Math.floor(i / 2);
                    const redBarsTotal = Math.floor(modalTotalBars / 2);
                    const progress = redIndex / Math.max(1, redBarsTotal - 1);
                    const channel = Math.min(modalChannelCount - 1, Math.floor((1 - progress) * modalChannelCount));
                    const dataIndex = Math.floor((channel / modalChannelCount) * bufferLength);
                    const barHeight = (dataArray[dataIndex] / 255) * modalHeight * this.volume;
                    
                    this.canvasModalCtx.fillStyle = `rgba(239, 68, 68, 0.6)`; // Red
                    this.canvasModalCtx.fillRect(modalX, modalHeight - barHeight, modalBarWidth, barHeight);
                }
                
                modalX += modalBarUnit;
            }
        }
    }

    updateUIState() {
        const container = this.element.querySelector('.music-player');
        const icon = this.element.querySelector('.toggle-icon');
        const iconModal = this.element.querySelector('.toggle-icon-modal');
        
        if (this.isPlaying) {
            container.classList.add('playing');
            icon.className = 'toggle-icon bx bx-music blink-active';
            // Remove inline opacity if it was set
            icon.style.opacity = "";
            
            if (iconModal) iconModal.className = 'toggle-icon-modal bx bx-pause';
        } else {
            container.classList.remove('playing');
            icon.className = 'toggle-icon bx bx-music paused-state';
            // Remove inline opacity so CSS can handle it properly with the pseudo-element
            icon.style.opacity = "";
            
            if (iconModal) iconModal.className = 'toggle-icon-modal bx bx-play';
        }
        
        // Update track info
        this.updateTrackInfo();
    }
    
    updateTrackInfo() {
        const track = this.playlist[this.currentTrackIndex];
        const trackNumber = this.currentTrackIndex + 1;
        const totalTracks = this.playlist.length;
        
        // Update desktop track info
        const trackInfo = this.element.querySelector('.track-info');
        if (trackInfo) {
            trackInfo.textContent = `${trackNumber}/${totalTracks} · ${track.name}`;
        }
        
        // Update modal track info
        const trackInfoModal = this.element.querySelector('.track-info-modal');
        if (trackInfoModal) {
            trackInfoModal.textContent = `Track ${trackNumber} of ${totalTracks}`;
        }
        
        const trackNameModal = this.element.querySelector('.track-name-modal');
        if (trackNameModal) {
            trackNameModal.textContent = track.name;
        }
    }

    openModal() {
        if (this.modal) {
            this.modal.classList.add('active');
            // Only prevent scrolling on mobile (fullscreen modal)
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'music-controls';
        
        container.innerHTML = `
            <div class="music-player">
                <button class="music-toggle" aria-label="Toggle Music" tabindex="-1">
                    <i class="toggle-icon bx bx-music paused-state"></i>
                </button>
                
                <div class="music-content">
                    <div class="track-info">1/6 · Neon Currents</div>
                    <canvas class="audio-visualizer" width="60" height="24"></canvas>
                    
                    <div class="player-controls">
                        <button class="control-btn prev-btn" aria-label="Previous Track" tabindex="-1">
                            <i class='bx bx-skip-previous'></i>
                        </button>
                        <button class="control-btn next-btn" aria-label="Next Track" tabindex="-1">
                            <i class='bx bx-skip-next'></i>
                        </button>
                    </div>
                    
                    <div class="volume-slider-container">
                        <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="${this.volume}" tabindex="-1">
                    </div>
                </div>
            </div>
            
            <!-- Mobile Modal -->
            <div class="music-modal">
                <div class="music-modal-content">
                    <button class="music-modal-close" aria-label="Close VibeTracks" tabindex="-1">
                        <i class='bx bx-x'></i>
                    </button>
                    
                    <h3 class="music-modal-title">VibeTracks</h3>
                    
                    <div class="track-info-modal">Track 1 of 6</div>
                    <div class="track-name-modal">Neon Currents</div>
                    
                    <canvas class="audio-visualizer-modal" width="280" height="60"></canvas>
                    
                    <div class="music-modal-controls">
                        <button class="music-modal-btn prev-btn-modal" aria-label="Previous Track" tabindex="-1">
                            <i class='bx bx-skip-previous'></i>
                        </button>
                        <button class="music-modal-btn play-btn-modal" aria-label="Play/Pause" tabindex="-1">
                            <i class="toggle-icon-modal bx bx-play"></i>
                        </button>
                        <button class="music-modal-btn next-btn-modal" aria-label="Next Track" tabindex="-1">
                            <i class='bx bx-skip-next'></i>
                        </button>
                    </div>
                    
                    <div class="music-modal-volume">
                        <i class='bx bx-volume-full'></i>
                        <input type="range" class="volume-slider-modal" min="0" max="1" step="0.01" value="${this.volume}" tabindex="-1">
                    </div>
                </div>
            </div>
        `;

        // Elements
        this.element = container;
        this.canvas = container.querySelector('.audio-visualizer');
        this.canvasCtx = this.canvas.getContext('2d');
        
        // Modal elements
        this.modal = container.querySelector('.music-modal');
        this.canvasModal = container.querySelector('.audio-visualizer-modal');
        this.canvasModalCtx = this.canvasModal.getContext('2d');
        
        // Listeners
        const toggleBtn = container.querySelector('.music-toggle');
        
        // Hover behavior for desktop - keep open when hovering over container or modal
        let hoverTimeout;
        
        const showDropdown = () => {
            if (window.innerWidth > 768) {
                clearTimeout(hoverTimeout);
                this.openModal();
            }
        };
        
        const hideDropdown = () => {
            if (window.innerWidth > 768) {
                hoverTimeout = setTimeout(() => {
                    this.closeModal();
                }, 200); // Small delay to allow moving to modal
            }
        };
        
        container.addEventListener('mouseenter', showDropdown);
        container.addEventListener('mouseleave', hideDropdown);
        
        // Keep modal open when hovering over it
        this.modal.addEventListener('mouseenter', showDropdown);
        this.modal.addEventListener('mouseleave', hideDropdown);
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent container click
            toggleBtn.blur(); // Release focus immediately
            
            if (window.innerWidth <= 768) {
                // Mobile: Just open modal
                this.openModal();
            } else {
                // Desktop: Toggle play/pause (dropdown shows on hover)
                this.togglePlay();
            }
        });

        // For better mobile touch handling
        toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double-firing with click
            e.stopPropagation();
            toggleBtn.blur();
            
            if (window.innerWidth <= 768) {
                this.openModal();
            } else {
                this.togglePlay();
            }
        }, { passive: false });
        
        const nextBtn = container.querySelector('.next-btn');
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextBtn.blur(); // Release focus immediately
            this.nextTrack();
        });
        
        const prevBtn = container.querySelector('.prev-btn');
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevBtn.blur(); // Release focus immediately
            this.nextTrack(); // Simple toggle
        });
        
        const volumeSlider = container.querySelector('.volume-slider');
        volumeSlider.addEventListener('input', (e) => {
            e.stopPropagation(); // Prevent collapse while dragging
            this.handleVolumeChange(e);
        });
        // Release focus from slider when interaction ends
        volumeSlider.addEventListener('change', () => volumeSlider.blur());
        volumeSlider.addEventListener('mouseup', () => volumeSlider.blur());
        volumeSlider.addEventListener('touchend', () => volumeSlider.blur());
        
        // Modal listeners
        const modalCloseBtn = container.querySelector('.music-modal-close');
        modalCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            modalCloseBtn.blur();
            this.closeModal();
        });
        
        const playBtnModal = container.querySelector('.play-btn-modal');
        playBtnModal.addEventListener('click', (e) => {
            e.stopPropagation();
            playBtnModal.blur();
            this.togglePlay();
        });
        
        const nextBtnModal = container.querySelector('.next-btn-modal');
        nextBtnModal.addEventListener('click', (e) => {
            e.stopPropagation();
            nextBtnModal.blur();
            this.nextTrack();
        });
        
        const prevBtnModal = container.querySelector('.prev-btn-modal');
        prevBtnModal.addEventListener('click', (e) => {
            e.stopPropagation();
            prevBtnModal.blur();
            this.nextTrack();
        });
        
        const volumeSliderModal = container.querySelector('.volume-slider-modal');
        volumeSliderModal.addEventListener('input', (e) => {
            e.stopPropagation();
            this.handleVolumeChange(e);
        });
        volumeSliderModal.addEventListener('change', () => volumeSliderModal.blur());
        volumeSliderModal.addEventListener('mouseup', () => volumeSliderModal.blur());
        volumeSliderModal.addEventListener('touchend', () => volumeSliderModal.blur());
        
        // Close modal on overlay click (mobile)
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close modal when clicking outside (mobile only)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.modal && this.modal.classList.contains('active')) {
                // On mobile, check if click is outside the modal and the toggle button
                if (!this.modal.contains(e.target) && !toggleBtn.contains(e.target) && !container.contains(e.target)) {
                    this.closeModal();
                }
            }
        });

        // Auto-play / Unlock Audio Context on first interaction
        const unlockAudio = async () => {
            if (!this.audioContext) await this.initAudioContext();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            if (!this.isPlaying && !this.hasAutoPlayed) {
                this.hasAutoPlayed = true;
                this.play();
            }
            
            // Remove listeners once unlocked
            if (this.audioContext && this.audioContext.state === 'running') {
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        return container;
    }
}

