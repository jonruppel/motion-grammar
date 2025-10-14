// Analytics Dashboard Experience

import { 
    createLoadingState, 
    createErrorState, 
    createExperienceWrapperDOM,
    triggerScaleReveal,
    addStylesOnce 
} from '../utils/base-experience.js';

import {
    Button,
    StatCard,
    Section
} from '../components/index.js';

export const metadata = {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    icon: 'bx-bar-chart-alt-2',
    category: 'experiences',
    description: 'Interactive data visualization with sophisticated motion design'
};

// Data for different periods - more granular for organic feel
const periodData = {
    '7d': {
        labels: ['Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM', 'Thu AM', 'Thu PM', 'Fri AM', 'Fri PM', 'Sat AM', 'Sat PM', 'Sun AM', 'Sun PM'],
        shortLabels: ['Mon', '', 'Tue', '', 'Wed', '', 'Thu', '', 'Fri', '', 'Sat', '', 'Sun', ''],
        data: [1620, 1800, 1890, 2230, 2180, 2670, 1950, 2280, 2420, 2700, 1080, 1260, 1240, 1600],
        metrics: {
            visitors: [1620, 1800, 1890, 2230, 2180, 2670, 1950, 2280, 2420, 2700, 1080, 1260, 1240, 1600],
            pageViews: [4850, 5400, 5670, 6690, 6540, 8010, 5850, 6840, 7260, 8100, 3240, 3780, 3720, 4800],
            bounceRate: [42, 38, 35, 32, 34, 28, 36, 31, 29, 26, 48, 45, 47, 41]
        },
        stats: {
            users: '12,847',
            userChange: 12.5,
            revenue: '$48,392',
            revenueChange: 8.2,
            conversion: '3.2%',
            conversionChange: 0.4,
            session: '4:32',
            sessionChange: -0.3
        }
    },
    '30d': {
        labels: ['Day 1', 'Day 4', 'Day 7', 'Day 10', 'Day 13', 'Day 16', 'Day 19', 'Day 22', 'Day 25', 'Day 28', 'Day 30'],
        shortLabels: ['1', '4', '7', '10', '13', '16', '19', '22', '25', '28', '30'],
        data: [14200, 15800, 17200, 18900, 19200, 20400, 21100, 22300, 23400, 24100, 24890],
        metrics: {
            visitors: [14200, 15800, 17200, 18900, 19200, 20400, 21100, 22300, 23400, 24100, 24890],
            pageViews: [42600, 47400, 51600, 56700, 57600, 61200, 63300, 66900, 70200, 72300, 74670],
            bounceRate: [45, 42, 39, 36, 35, 33, 31, 30, 28, 27, 26]
        },
        stats: {
            users: '54,230',
            userChange: 18.3,
            revenue: '$186,420',
            revenueChange: 15.7,
            conversion: '3.8%',
            conversionChange: 1.2,
            session: '5:12',
            sessionChange: 2.1
        }
    },
    '90d': {
        labels: ['Jan 1', 'Jan 10', 'Jan 20', 'Jan 31', 'Feb 10', 'Feb 20', 'Feb 28', 'Mar 10', 'Mar 20', 'Mar 31'],
        shortLabels: ['Jan 1', 'Jan 10', 'Jan 20', 'Jan 31', 'Feb 10', 'Feb 20', 'Feb 28', 'Mar 10', 'Mar 20', 'Mar 31'],
        data: [132000, 138400, 144200, 151800, 158200, 165400, 172300, 178900, 186200, 194200],
        metrics: {
            visitors: [132000, 138400, 144200, 151800, 158200, 165400, 172300, 178900, 186200, 194200],
            pageViews: [396000, 415200, 432600, 455400, 474600, 496200, 516900, 536700, 558600, 582600],
            bounceRate: [48, 45, 42, 39, 37, 35, 33, 31, 29, 27]
        },
        stats: {
            users: '162,840',
            userChange: 24.6,
            revenue: '$542,800',
            revenueChange: 22.4,
            conversion: '4.1%',
            conversionChange: 1.8,
            session: '5:45',
            sessionChange: 3.4
        }
    }
};

let currentPeriod = '7d';
let components = [];
let statCardComponents = [];

export function render(container) {
    // Load page-specific styles
    loadPageStyles();
    
    // Clear existing components
    components.forEach(c => c.destroy && c.destroy());
    statCardComponents.forEach(c => c.destroy && c.destroy());
    components = [];
    statCardComponents = [];
    
    renderDashboardUI(container);
}

export function dispose() {
    components.forEach(c => c.destroy && c.destroy());
    statCardComponents.forEach(c => c.destroy && c.destroy());
    components = [];
    statCardComponents = [];
}

function renderDashboardUI(container) {
    // Create content container
    const contentDiv = document.createElement('div');
    
    // Dashboard header with period filters
    const headerDiv = document.createElement('div');
    headerDiv.className = 'dashboard-header scale-reveal';
    
    const filtersDiv = document.createElement('div');
    filtersDiv.className = 'dashboard-period-filters';
    
    const periodOptions = [
        { period: '7d', label: '7 Days' },
        { period: '30d', label: '30 Days' },
        { period: '90d', label: '90 Days' }
    ];
    
    periodOptions.forEach(({ period, label }) => {
        const button = document.createElement('button');
        button.className = `period-btn ${period === currentPeriod ? 'active' : ''}`;
        button.dataset.period = period;
        button.textContent = label;
        button.addEventListener('click', () => {
            if (period !== currentPeriod) {
                currentPeriod = period;
                updateDashboard(container);
            }
        });
        filtersDiv.appendChild(button);
    });
    
    headerDiv.appendChild(filtersDiv);
    contentDiv.appendChild(headerDiv);
    
    // Dashboard grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'dashboard-grid';
    gridDiv.id = 'dashboardGrid';
    
    // Stat Cards
    const statsData = periodData[currentPeriod].stats;
    const statCardsData = [
        { 
            label: 'Total Users', 
            value: statsData.users,
            change: statsData.userChange,
            icon: 'bx-user',
            dataKey: 'users'
        },
        { 
            label: 'Revenue', 
            value: statsData.revenue,
            change: statsData.revenueChange,
            icon: 'bx-dollar',
            dataKey: 'revenue'
        },
        { 
            label: 'Conversion Rate', 
            value: statsData.conversion,
            change: statsData.conversionChange,
            icon: 'bx-bar-chart-alt-2',
            dataKey: 'conversion'
        },
        { 
            label: 'Avg. Session', 
            value: statsData.session,
            change: statsData.sessionChange,
            icon: 'bx-time',
            dataKey: 'session'
        }
    ];
    
    statCardsData.forEach(stat => {
        const statCard = createStatCard(stat);
        statCardComponents.push(statCard);
        gridDiv.appendChild(statCard);
    });
    
    // Chart Card
    const chartCard = createChartCard();
    gridDiv.appendChild(chartCard);
    
    // Geographic Distribution Map
    const mapCard = createMapCard();
    gridDiv.appendChild(mapCard);
    
    // Top Pages Card
    const pagesCard = createPagesCard();
    gridDiv.appendChild(pagesCard);
    
    contentDiv.appendChild(gridDiv);
    
    // Wrap content in standard experience structure using DOM method
    const experienceWrapper = createExperienceWrapperDOM(
        'dashboard-container',
        'Analytics Dashboard',
        'Interactive data visualization with sophisticated motion design. Explore metrics, drill down into details, and see how motion enhances data comprehension.',
        contentDiv
    );
    
    // Clear container and append the new wrapper
    container.innerHTML = '';
    container.appendChild(experienceWrapper);

    // Draw chart and map after DOM is ready
    setTimeout(() => {
        drawChart();
        drawUSMap();
        setupMapZoomPan();
        
        // Add resize handler for responsive charts and layout
        let resizeTimeout;
        let lastWidth = window.innerWidth;
        let lastOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentWidth = window.innerWidth;
                const currentOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
                
                const crossedBreakpoint = 
                    (lastWidth > 768 && currentWidth <= 768) || 
                    (lastWidth <= 768 && currentWidth > 768);
                
                const orientationChanged = lastOrientation !== currentOrientation;
                
                // Redraw chart if visible (on any resize or orientation change)
                const chartCanvas = document.getElementById('trafficChart');
                if (chartCanvas && chartCanvas.offsetParent !== null) {
                    drawChart();
                }
                
                // Reset map transforms when crossing mobile breakpoint
                if (crossedBreakpoint) {
                    const mapWrapper = document.getElementById('mapWrapper');
                    const dots = document.querySelectorAll('.map-dot');
                    
                    if (mapWrapper) {
                        gsap.set(mapWrapper, {
                            scale: 1,
                            x: 0,
                            y: 0,
                            clearProps: 'transform'
                        });
                    }
                    
                    if (dots.length > 0) {
                        dots.forEach(dot => {
                            gsap.set(dot, {
                                scale: 1,
                                clearProps: 'transform'
                            });
                        });
                    }
                }
                
                lastWidth = currentWidth;
                lastOrientation = currentOrientation;
            }, 250);
        });
    }, 800);
    
    // Trigger scale reveal animation
    triggerScaleReveal(container);
}

function createStatCard({ label, value, change, icon, dataKey }) {
    const card = document.createElement('div');
    card.className = 'stat-card scale-reveal';
    card.dataset.stat = dataKey;
    
    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'stat-icon';
    const iconElement = document.createElement('i');
    iconElement.className = `bx ${icon}`;
    iconDiv.appendChild(iconElement);
    card.appendChild(iconDiv);
    
    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'stat-content';
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'stat-label';
    labelDiv.textContent = label;
    contentDiv.appendChild(labelDiv);
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'stat-value';
    valueDiv.dataset.value = dataKey;
    valueDiv.textContent = value;
    contentDiv.appendChild(valueDiv);
    
    const changeDiv = document.createElement('div');
    changeDiv.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
    changeDiv.dataset.change = dataKey;
    const changeIcon = document.createElement('i');
    changeIcon.className = `bx bx-trending-${change >= 0 ? 'up' : 'down'}`;
    const changeText = document.createElement('span');
    changeText.textContent = `${Math.abs(change)}% from last period`;
    changeDiv.appendChild(changeIcon);
    changeDiv.appendChild(changeText);
    contentDiv.appendChild(changeDiv);
    
    card.appendChild(contentDiv);
    
    return card;
}

function createChartCard() {
    const card = document.createElement('div');
    card.className = 'chart-card scale-reveal';
    
    // Header
    const header = document.createElement('div');
    header.className = 'chart-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Traffic Overview';
    header.appendChild(title);
    
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    
    const legendItems = [
        { label: 'Visitors', color: '#8B5CF6' },
        { label: 'Page Views', color: '#EC4899' },
        { label: 'Bounce Rate', color: '#F59E0B' }
    ];
    
    legendItems.forEach(({ label, color }) => {
        const item = document.createElement('span');
        item.className = 'legend-item';
        
        const dot = document.createElement('span');
        dot.className = 'legend-dot';
        dot.style.background = color;
        item.appendChild(dot);
        
        item.appendChild(document.createTextNode(label));
        legend.appendChild(item);
    });
    
    header.appendChild(legend);
    card.appendChild(header);
    
    // Chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'trafficChart';
    chartContainer.appendChild(canvas);
    
    card.appendChild(chartContainer);
    
    return card;
}

function createMapCard() {
    const card = document.createElement('div');
    card.className = 'map-card scale-reveal';
    
    // Header
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Geographic Distribution';
    header.appendChild(title);
    
    const stats = document.createElement('div');
    stats.className = 'map-stats';
    stats.innerHTML = `
        <span class="map-stat"><strong>54%</strong> US</span>
        <span class="map-stat"><strong>46%</strong> Other</span>
    `;
    header.appendChild(stats);
    
    card.appendChild(header);
    
    // Map container
    const mapContainer = document.createElement('div');
    mapContainer.className = 'map-container';
    mapContainer.id = 'mapContainer';
    
    const mapWrapper = document.createElement('div');
    mapWrapper.className = 'map-wrapper';
    mapWrapper.id = 'mapWrapper';
    
    const mapImage = document.createElement('img');
    mapImage.src = 'images/map.PNG';
    mapImage.alt = 'World Map';
    mapImage.className = 'map-image';
    mapImage.draggable = false;
    mapWrapper.appendChild(mapImage);
    
    const dotsLayer = document.createElement('div');
    dotsLayer.id = 'mapDotsLayer';
    dotsLayer.className = 'map-dots-layer';
    mapWrapper.appendChild(dotsLayer);
    
    mapContainer.appendChild(mapWrapper);
    
    const tooltip = document.createElement('div');
    tooltip.id = 'mapTooltip';
    tooltip.className = 'map-tooltip';
    mapContainer.appendChild(tooltip);
    
    // Map controls
    const controls = document.createElement('div');
    controls.className = 'map-controls';
    controls.innerHTML = `
        <button class="map-control-btn" id="zoomIn" title="Zoom In">
            <i class='bx bx-plus'></i>
        </button>
        <button class="map-control-btn" id="zoomOut" title="Zoom Out">
            <i class='bx bx-minus'></i>
        </button>
        <button class="map-control-btn" id="resetZoom" title="Reset">
            <i class='bx bx-reset'></i>
        </button>
    `;
    mapContainer.appendChild(controls);
    
    card.appendChild(mapContainer);
    
    // Map regions
    const regions = document.createElement('div');
    regions.className = 'map-regions';
    
    const regionData = [
        { name: 'West', value: '28,420', color: '#8B5CF6' },
        { name: 'East', value: '24,230', color: '#EC4899' },
        { name: 'Central', value: '18,940', color: '#10B981' },
        { name: 'South', value: '16,120', color: '#F59E0B' }
    ];
    
    regionData.forEach(({ name, value, color }) => {
        const item = document.createElement('div');
        item.className = 'region-item';
        
        const info = document.createElement('div');
        info.className = 'region-info';
        
        const dot = document.createElement('div');
        dot.className = 'region-dot';
        dot.style.background = color;
        info.appendChild(dot);
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'region-name';
        nameSpan.textContent = name;
        info.appendChild(nameSpan);
        
        item.appendChild(info);
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'region-value';
        valueSpan.textContent = value;
        item.appendChild(valueSpan);
        
        regions.appendChild(item);
    });
    
    card.appendChild(regions);
    
    return card;
}

function createPagesCard() {
    const card = document.createElement('div');
    card.className = 'pages-card scale-reveal';
    
    // Header
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Top Pages';
    header.appendChild(title);
    
    card.appendChild(header);
    
    // Pages list
    const list = document.createElement('div');
    list.className = 'pages-list';
    
    const pagesData = [
        { path: '/dashboard', views: '8,420', width: '100%' },
        { path: '/products', views: '6,230', width: '74%' },
        { path: '/pricing', views: '4,120', width: '49%' },
        { path: '/about', views: '3,840', width: '46%' }
    ];
    
    pagesData.forEach(({ path, views, width }) => {
        const item = document.createElement('div');
        item.className = 'page-item';
        
        const info = document.createElement('div');
        info.className = 'page-info';
        
        const pathDiv = document.createElement('div');
        pathDiv.className = 'page-path';
        pathDiv.textContent = path;
        info.appendChild(pathDiv);
        
        const meta = document.createElement('div');
        meta.className = 'page-meta';
        meta.textContent = `${views} views`;
        info.appendChild(meta);
        
        item.appendChild(info);
        
        const bar = document.createElement('div');
        bar.className = 'page-bar';
        
        const fill = document.createElement('div');
        fill.className = 'page-bar-fill';
        fill.style.width = width;
        bar.appendChild(fill);
        
        item.appendChild(bar);
        list.appendChild(item);
    });
    
    card.appendChild(list);
    
    return card;
}

function updateDashboard(container) {
    const data = periodData[currentPeriod];
    
    // Update period buttons
    const buttons = container.querySelectorAll('.period-btn');
    buttons.forEach(btn => {
        if (btn.dataset.period === currentPeriod) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Animate stat values update
    const statValues = container.querySelectorAll('.stat-value');
    const statChanges = container.querySelectorAll('.stat-change');
    
    gsap.to([...statValues, ...statChanges], {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
            // Update users
            const usersValue = container.querySelector('[data-value="users"]');
            const usersChange = container.querySelector('[data-change="users"]');
            if (usersValue) usersValue.textContent = data.stats.users;
            if (usersChange) {
                usersChange.className = `stat-change ${data.stats.userChange >= 0 ? 'positive' : 'negative'}`;
                usersChange.innerHTML = `
                    <i class='bx bx-trending-${data.stats.userChange >= 0 ? 'up' : 'down'}'></i>
                    <span>${Math.abs(data.stats.userChange)}% from last period</span>
                `;
            }
            
            // Update revenue
            const revenueValue = container.querySelector('[data-value="revenue"]');
            const revenueChange = container.querySelector('[data-change="revenue"]');
            if (revenueValue) revenueValue.textContent = data.stats.revenue;
            if (revenueChange) {
                revenueChange.className = `stat-change ${data.stats.revenueChange >= 0 ? 'positive' : 'negative'}`;
                revenueChange.innerHTML = `
                    <i class='bx bx-trending-${data.stats.revenueChange >= 0 ? 'up' : 'down'}'></i>
                    <span>${Math.abs(data.stats.revenueChange)}% from last period</span>
                `;
            }
            
            // Update conversion
            const conversionValue = container.querySelector('[data-value="conversion"]');
            const conversionChange = container.querySelector('[data-change="conversion"]');
            if (conversionValue) conversionValue.textContent = data.stats.conversion;
            if (conversionChange) {
                conversionChange.className = `stat-change ${data.stats.conversionChange >= 0 ? 'positive' : 'negative'}`;
                conversionChange.innerHTML = `
                    <i class='bx bx-trending-${data.stats.conversionChange >= 0 ? 'up' : 'down'}'></i>
                    <span>${Math.abs(data.stats.conversionChange)}% from last period</span>
                `;
            }
            
            // Update session
            const sessionValue = container.querySelector('[data-value="session"]');
            const sessionChange = container.querySelector('[data-change="session"]');
            if (sessionValue) sessionValue.textContent = data.stats.session;
            if (sessionChange) {
                sessionChange.className = `stat-change ${data.stats.sessionChange >= 0 ? 'positive' : 'negative'}`;
                sessionChange.innerHTML = `
                    <i class='bx bx-trending-${data.stats.sessionChange >= 0 ? 'up' : 'down'}'></i>
                    <span>${Math.abs(data.stats.sessionChange)}% from last period</span>
                `;
            }
            
            // Animate in
            gsap.to([...statValues, ...statChanges], {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out',
                stagger: 0.05
            });
            
            // Redraw chart
            drawChart();
        }
    });
}

function drawChart() {
    const canvas = document.getElementById('trafficChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // Set up proper canvas sizing with DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const padding = 50;
    
    // Data points from current period
    const currentData = periodData[currentPeriod];
    const labels = currentData.shortLabels;
    const metrics = currentData.metrics;
    
    // Define metrics to display with colors
    const metricLines = [
        { name: 'Visitors', data: metrics.visitors, color: '#8B5CF6', axis: 'left' },
        { name: 'Page Views', data: metrics.pageViews, color: '#EC4899', axis: 'left' },
        { name: 'Bounce Rate', data: metrics.bounceRate, color: '#F59E0B', axis: 'right', suffix: '%' }
    ];
    
    // Calculate max values for each axis
    const leftMetrics = metricLines.filter(m => m.axis === 'left');
    const rightMetrics = metricLines.filter(m => m.axis === 'right');
    const maxLeft = Math.max(...leftMetrics.flatMap(m => m.data)) * 1.1;
    const maxRight = Math.max(...rightMetrics.flatMap(m => m.data)) * 1.1;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get colors from CSS
    const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text-tertiary').trim();
    const gridColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-border-light').trim();
    
    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Calculate points for each metric
    const metricPoints = metricLines.map(metric => {
        const maxValue = metric.axis === 'left' ? maxLeft : maxRight;
        return {
            ...metric,
            points: metric.data.map((value, index) => ({
                x: padding + (width - padding * 2) * (index / (metric.data.length - 1)),
                y: height - padding - (height - padding * 2) * (value / maxValue)
            }))
        };
    });
    
    // Animate points rising from bottom with stagger
    const startTime = Date.now();
    const duration = 600; // ms - how long each point takes to rise
    const staggerDelay = 50; // ms per point - delay between each point starting
    
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    
    function animate() {
        const elapsed = Date.now() - startTime;
        
        ctx.clearRect(0, 0, width, height);
        
        // Enable anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Redraw grid
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-border-light').trim();
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height - padding * 2) * (i / 4);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw X-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const firstMetricPoints = metricPoints[0].points;
        labels.forEach((label, index) => {
            if (label && firstMetricPoints[index]) {
                ctx.fillText(label, firstMetricPoints[index].x, height - 30);
            }
        });
        
        // Draw each metric line
        metricPoints.forEach((metric, metricIndex) => {
            // Calculate animated points
            const animatedPoints = metric.points.map((point, index) => {
                const pointStartTime = index * staggerDelay;
                const pointElapsed = Math.max(0, elapsed - pointStartTime);
                const pointProgress = Math.min(pointElapsed / duration, 1);
                const easedProgress = easeOutExpo(pointProgress);
                
                const startY = height - padding;
                const targetY = point.y;
                const currentY = startY + (targetY - startY) * easedProgress;
                
                return {
                    x: point.x,
                    y: currentY,
                    progress: easedProgress
                };
            });
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(animatedPoints[0].x, animatedPoints[0].y);
            
            for (let i = 1; i < animatedPoints.length; i++) {
                ctx.lineTo(animatedPoints[i].x, animatedPoints[i].y);
            }
            
            ctx.strokeStyle = metric.color;
            ctx.lineWidth = metricIndex === 0 ? 2.5 : 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // Draw points
            animatedPoints.forEach((point, index) => {
                if (point.progress <= 0) return;
                
                const radius = metricIndex === 0 ? 4 : 3;
                
                // Outer circle (white border)
                ctx.beginPath();
                ctx.arc(point.x, point.y, (radius + 0.5) * point.progress, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                
                // Inner circle (metric color)
                ctx.beginPath();
                ctx.arc(point.x, point.y, radius * point.progress, 0, Math.PI * 2);
                ctx.fillStyle = metric.color;
                ctx.fill();
            });
        });
        
        // Check if animation is complete
        const totalAnimationTime = (metricPoints[0].points.length - 1) * staggerDelay + duration;
        if (elapsed < totalAnimationTime) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

function drawUSMap() {
    const dotsLayer = document.getElementById('mapDotsLayer');
    const tooltip = document.getElementById('mapTooltip');
    if (!dotsLayer) return;
    
    // Global data points distributed across landmasses (percentage-based coordinates)
    const regions = [
        // North America
        { cx: 9, cy: 37, color: '#8B5CF6' }, { cx: 17, cy: 52, color: '#8B5CF6' },
        { cx: 23, cy: 48, color: '#8B5CF6' }, { cx: 22, cy: 54, color: '#8B5CF6' },
        { cx: 23, cy: 54, color: '#8B5CF6' }, { cx: 26, cy: 54, color: '#8B5CF6' },
        { cx: 29, cy: 49, color: '#8B5CF6' }, { cx: 16, cy: 50, color: '#8B5CF6' },
        { cx: 16, cy: 48, color: '#8B5CF6' }, { cx: 22, cy: 51, color: '#8B5CF6' },

        // South America
        { cx: 31, cy: 63, color: '#EC4899' }, { cx: 34, cy: 70, color: '#EC4899' },
        { cx: 31, cy: 78, color: '#EC4899' }, { cx: 29, cy: 84, color: '#EC4899' },
        { cx: 27, cy: 67, color: '#EC4899' },

        // Europe
        { cx: 46, cy: 51, color: '#10B981' }, { cx: 51, cy: 41, color: '#10B981' },
        { cx: 47, cy: 45, color: '#10B981' }, { cx: 54, cy: 46, color: '#10B981' },
        { cx: 51, cy: 50, color: '#10B981' }, { cx: 48, cy: 48, color: '#10B981' },
        { cx: 52, cy: 45, color: '#10B981' }, { cx: 45, cy: 44, color: '#10B981' },

        // Africa
        { cx: 50, cy: 53, color: '#F59E0B' }, { cx: 55, cy: 59, color: '#F59E0B' },
        { cx: 57, cy: 63, color: '#F59E0B' }, { cx: 59, cy: 73, color: '#F59E0B' },
        { cx: 54, cy: 76, color: '#F59E0B' }, { cx: 53, cy: 77, color: '#F59E0B' },
        { cx: 44, cy: 59, color: '#F59E0B' },

        // Asia
        { cx: 58, cy: 43, color: '#3B82F6' }, { cx: 65, cy: 47, color: '#3B82F6' },
        { cx: 83, cy: 53, color: '#3B82F6' }, { cx: 76, cy: 56, color: '#3B82F6' },
        { cx: 73, cy: 48, color: '#3B82F6' }, { cx: 68, cy: 58, color: '#3B82F6' },
        { cx: 66, cy: 40, color: '#3B82F6' }, { cx: 82, cy: 37, color: '#3B82F6' },
        { cx: 77, cy: 48, color: '#3B82F6' }, { cx: 88, cy: 43, color: '#3B82F6' },

        // Oceania / Australia
        { cx: 91, cy: 82, color: '#F97316' }, { cx: 83, cy: 67, color: '#F97316' },
        { cx: 77, cy: 76, color: '#F97316' }, { cx: 86, cy: 78, color: '#F97316' }
    ];
    
    // Clear existing content
    dotsLayer.innerHTML = '';
    
    // Add data points
    regions.forEach((region, index) => {
        const value = Math.floor(Math.random() * 1000) + 1;
        
        // Dot container
        const dotContainer = document.createElement('div');
        dotContainer.className = 'map-dot';
        dotContainer.style.left = region.cx + '%';
        dotContainer.style.top = region.cy + '%';
        dotContainer.dataset.value = value;
        
        // Inner dot
        const dot = document.createElement('div');
        dot.className = 'map-dot-inner';
        dot.style.background = region.color;
        dotContainer.appendChild(dot);
        
        // Pulse effect
        const pulse = document.createElement('div');
        pulse.className = 'map-dot-pulse';
        pulse.style.background = region.color;
        pulse.style.animationDelay = (index * 0.08) + 's';
        dotContainer.appendChild(pulse);
        
        dotsLayer.appendChild(dotContainer);
        
        // Hover events
        dotContainer.addEventListener('mouseenter', (e) => {
            tooltip.textContent = value.toLocaleString();
            tooltip.style.display = 'block';
            updateTooltipPosition(e);
            
            gsap.to(dot, {
                scale: 1.5,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
        
        dotContainer.addEventListener('mousemove', updateTooltipPosition);
        
        dotContainer.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
            
            gsap.to(dot, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
        });
        
        // Staggered entrance animation
        gsap.fromTo(dotContainer,
            { scale: 0, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: 'expo.out',
                delay: index * 0.02 + 0.3
            }
        );
    });
    
    function updateTooltipPosition(e) {
        const container = document.getElementById('mapContainer');
        const rect = container.getBoundingClientRect();
        
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 15) + 'px';
    }
}

function setupMapZoomPan() {
    const wrapper = document.getElementById('mapWrapper');
    const container = document.getElementById('mapContainer');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetBtn = document.getElementById('resetZoom');
    
    if (!wrapper || !container) return;
    
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    function updateTransform() {
        gsap.to(wrapper, {
            scale: scale,
            x: translateX,
            y: translateY,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // Inversely scale individual dots to keep them fixed size
        const dots = document.querySelectorAll('.map-dot');
        dots.forEach(dot => {
            gsap.to(dot, {
                scale: 1 / scale,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }
    
    // Zoom controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale * 1.3, 3);
            updateTransform();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(scale / 1.3, 1);
            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            }
            updateTransform();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        });
    }
    
    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(scale * delta, 1), 3);
        
        if (newScale !== scale) {
            scale = newScale;
            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            }
            updateTransform();
        }
    }, { passive: false });
    
    // Pan functionality
    wrapper.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            wrapper.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            
            // Constrain panning
            const maxTranslate = (scale - 1) * container.offsetWidth / 2;
            translateX = Math.max(Math.min(translateX, maxTranslate), -maxTranslate);
            translateY = Math.max(Math.min(translateY, maxTranslate), -maxTranslate);
            
            gsap.set(wrapper, {
                x: translateX,
                y: translateY
            });
            
            // Keep individual dots at fixed size
            const dots = document.querySelectorAll('.map-dot');
            dots.forEach(dot => {
                gsap.set(dot, { scale: 1 / scale });
            });
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            wrapper.style.cursor = scale > 1 ? 'grab' : 'default';
        }
    });
    
    // Touch support
    let touchStartDist = 0;
    let touchStartScale = 1;
    
    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
            isDragging = true;
            startX = e.touches[0].clientX - translateX;
            startY = e.touches[0].clientY - translateY;
        }
    });
    
    wrapper.addEventListener('touchmove', (e) => {
        e.preventDefault();
        
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            scale = Math.min(Math.max(touchStartScale * (dist / touchStartDist), 1), 3);
            updateTransform();
        } else if (isDragging && e.touches.length === 1) {
            translateX = e.touches[0].clientX - startX;
            translateY = e.touches[0].clientY - startY;
            
            const maxTranslate = (scale - 1) * container.offsetWidth / 2;
            translateX = Math.max(Math.min(translateX, maxTranslate), -maxTranslate);
            translateY = Math.max(Math.min(translateY, maxTranslate), -maxTranslate);
            
            gsap.set(wrapper, {
                x: translateX,
                y: translateY
            });
            
            // Keep individual dots at fixed size
            const dots = document.querySelectorAll('.map-dot');
            dots.forEach(dot => {
                gsap.set(dot, { scale: 1 / scale });
            });
        }
    }, { passive: false });
    
    wrapper.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// Load page-specific CSS
function loadPageStyles() {
    const styleId = 'dashboard-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/dashboard.css';
    document.head.appendChild(link);
}
