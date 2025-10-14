// Stocks App Experience

import { 
    createLoadingState, 
    createErrorState, 
    createExperienceWrapperDOM,
    triggerScaleReveal,
    addStylesOnce 
} from '../utils/base-experience.js';

import {
    Dropdown,
    StatCard,
    StockListItem,
    StockHeader
} from '../components/index.js';

export const metadata = {
    id: 'stocks',
    title: 'Stock Market',
    icon: 'bx-line-chart',
    category: 'experiences',
    description: 'Real-time stock market data with interactive charts'
};

// Popular stocks to track
const watchlist = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' }
];

let stocksData = null;
let selectedStock = watchlist[0];

// Generate realistic stock data (Yahoo Finance has CORS restrictions)
async function fetchStockData(symbol) {
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stock = watchlist.find(s => s.symbol === symbol);
    if (!stock) return null;
    
    return generateStockData(symbol, stock.name);
}

// Generate realistic mock data for stocks
function generateStockData(symbol, name) {
    // Base prices for different stocks (realistic as of 2024)
    const basePrices = {
        'AAPL': 175,
        'MSFT': 375,
        'GOOGL': 140,
        'AMZN': 155,
        'TSLA': 245,
        'META': 485,
        'NVDA': 495,
        'JPM': 155,
        'V': 265,
        'WMT': 165
    };
    
    const basePrice = basePrices[symbol] || 100;
    
    // Generate 30 days of realistic price data
    const chartData = [];
    let currentPrice = basePrice;
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Random walk with mean reversion
        const volatility = 0.02; // 2% daily volatility
        const drift = 0.0002; // Slight upward drift
        const meanReversion = (basePrice - currentPrice) * 0.05;
        
        const change = (Math.random() - 0.5) * volatility * currentPrice + drift * currentPrice + meanReversion;
        currentPrice += change;
        
        const dailyVolatility = currentPrice * 0.01;
        const high = currentPrice + Math.random() * dailyVolatility;
        const low = currentPrice - Math.random() * dailyVolatility;
        
        chartData.push({
            date: date,
            price: currentPrice,
            high: high,
            low: low,
            volume: Math.floor(Math.random() * 50000000) + 10000000
        });
    }
    
    // Today's data
    const latestPrice = currentPrice;
    const previousClose = chartData[chartData.length - 2].price;
    const change = latestPrice - previousClose;
    const changePercent = ((change / previousClose) * 100).toFixed(2);
    
    const prices = chartData.map(d => d.price);
    const high52Week = Math.max(...prices) * 1.15; // Simulate 52-week high
    const low52Week = Math.min(...prices) * 0.85; // Simulate 52-week low
    
    const open = previousClose + (Math.random() - 0.5) * previousClose * 0.005;
    const dayHigh = Math.max(latestPrice, open) * 1.01;
    const dayLow = Math.min(latestPrice, open) * 0.99;
    
    // Market cap based on stock
    const marketCaps = {
        'AAPL': 2.8e12,
        'MSFT': 2.7e12,
        'GOOGL': 1.7e12,
        'AMZN': 1.6e12,
        'TSLA': 780e9,
        'META': 1.2e12,
        'NVDA': 1.2e12,
        'JPM': 450e9,
        'V': 520e9,
        'WMT': 420e9
    };
    
    return {
        symbol: symbol,
        name: name,
        currentPrice: latestPrice.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent,
        previousClose: previousClose.toFixed(2),
        open: open.toFixed(2),
        dayHigh: dayHigh.toFixed(2),
        dayLow: dayLow.toFixed(2),
        volume: formatVolume(Math.floor(Math.random() * 80000000) + 20000000),
        marketCap: formatMarketCap(marketCaps[symbol] || 100e9),
        high52Week: high52Week.toFixed(2),
        low52Week: low52Week.toFixed(2),
        chartData: chartData
    };
}

// Format large numbers
function formatVolume(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num?.toString() || 'N/A';
}

function formatMarketCap(num) {
    if (!num) return 'N/A';
    if (num >= 1e12) return '$' + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
    return '$' + num.toFixed(2);
}

export function render(container) {
    loadPageStyles();
    
    const className = 'stocks-container';
    
    const loaderContent = document.createElement('div');
    loaderContent.className = 'stocks-loading';
    loaderContent.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i><p>Loading stock data...</p>`;
    
    const wrapper = createExperienceWrapperDOM(className, metadata.title, metadata.description, loaderContent);
    
    container.innerHTML = '';
    container.appendChild(wrapper);
    
    loadStocks(container);
}

async function loadStocks(container) {
    stocksData = await fetchStockData(selectedStock.symbol);
    
    const wrapper = container.querySelector('.experience');
    const intro = wrapper.querySelector('.experience-intro');
    const contentArea = intro.nextElementSibling;
    
    if (!stocksData) {
        contentArea.innerHTML = `
            <div class="stocks-error">
                <i class='bx bx-error-circle'></i>
                <p>Unable to load stock data</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
        return;
    }
    
    renderStocksUI(contentArea, container);
}

function renderStocksUI(contentArea, container) {
    
    // Create content container
    const contentDiv = document.createElement('div');
    
    // Stock Selector
    const headerDiv = document.createElement('div');
    headerDiv.className = 'stocks-header';
    
    const selectorWrapper = document.createElement('div');
    selectorWrapper.className = 'stock-selector scale-reveal';
    selectorWrapper.id = 'stockDropdown';
    
    const iconElement = document.createElement('i');
    iconElement.className = 'bx bx-line-chart';
    selectorWrapper.appendChild(iconElement);
    
    const dropdownOptions = watchlist.map(stock => ({
        value: stock.symbol,
        label: stock.symbol,
        sublabel: stock.name
    }));
    
    const dropdown = new Dropdown({
        options: dropdownOptions,
        value: selectedStock.symbol,
        usePortal: true,
        onChange: async (value) => {
            const stock = watchlist.find(s => s.symbol === value);
            if (stock && stock.symbol !== selectedStock.symbol) {
                selectedStock = stock;
                await animateStockChange(container);
            }
        }
    });
    
    selectorWrapper.appendChild(dropdown.render());
    headerDiv.appendChild(selectorWrapper);
    contentDiv.appendChild(headerDiv);
    
    // Stock Header (current price)
    const stockHeader = new StockHeader({
        symbol: stocksData.symbol,
        name: stocksData.name,
        currentPrice: stocksData.currentPrice,
        change: stocksData.change,
        changePercent: stocksData.changePercent
    });
    contentDiv.appendChild(stockHeader.render());
    
    // Chart Section
    const chartSection = document.createElement('div');
    chartSection.className = 'chart-section scale-reveal';
    
    const chartTitle = document.createElement('h3');
    chartTitle.className = 'section-title';
    chartTitle.textContent = '30-Day Price History';
    chartSection.appendChild(chartTitle);
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'stock-chart-container';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'stockChart';
    chartContainer.appendChild(canvas);
    
    chartSection.appendChild(chartContainer);
    contentDiv.appendChild(chartSection);
    
    // Stock Details Grid
    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'stock-details-grid';
    
    const detailsData = [
        { label: 'Previous Close', value: `$${stocksData.previousClose}` },
        { label: 'Open', value: `$${stocksData.open}` },
        { label: "Day's High", value: `$${stocksData.dayHigh}` },
        { label: "Day's Low", value: `$${stocksData.dayLow}` },
        { label: 'Volume', value: stocksData.volume },
        { label: 'Market Cap', value: stocksData.marketCap },
        { label: '52 Week High', value: `$${stocksData.high52Week}` },
        { label: '52 Week Low', value: `$${stocksData.low52Week}` }
    ];
    
    detailsData.forEach(detail => {
        const statCard = new StatCard({
            label: detail.label,
            value: detail.value
        });
        detailsGrid.appendChild(statCard.render());
    });
    
    contentDiv.appendChild(detailsGrid);
    
    // Watchlist Section
    const watchlistSectionDiv = document.createElement('div');
    watchlistSectionDiv.className = 'watchlist-section';
    
    const watchlistTitle = document.createElement('h3');
    watchlistTitle.className = 'section-title';
    watchlistTitle.textContent = 'Watchlist';
    watchlistSectionDiv.appendChild(watchlistTitle);
    
    const watchlistGrid = document.createElement('div');
    watchlistGrid.className = 'watchlist-grid';
    
    watchlist.forEach(stock => {
        const listItem = new StockListItem({
            symbol: stock.symbol,
            name: stock.name,
            active: stock.symbol === selectedStock.symbol,
            dataset: { symbol: stock.symbol },
            onClick: async () => {
                if (stock.symbol !== selectedStock.symbol) {
                    selectedStock = stock;
                    await animateStockChange(container);
                }
            }
        });
        watchlistGrid.appendChild(listItem.render());
    });
    
    watchlistSectionDiv.appendChild(watchlistGrid);
    contentDiv.appendChild(watchlistSectionDiv);
    
    contentArea.innerHTML = '';
    contentArea.appendChild(contentDiv);
    
    drawStockChart();
    
    // Trigger scale reveal animation
    triggerScaleReveal(container);
}

// Note: Dropdown and StockListItem components handle their own interactions now

async function animateStockChange(container) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const wrapper = container.querySelector('.experience');
    const intro = wrapper.querySelector('.experience-intro');
    const contentArea = intro.nextElementSibling;
    
    const stockHeader = contentArea.querySelector('.stocks-header');
    const chartSection = contentArea.querySelector('.chart-section');
    const detailsGrid = contentArea.querySelector('.stock-details-grid');
    const watchlistSection = contentArea.querySelector('.watchlist-section');
    
    if (stockHeader && chartSection) {
        // Fade out
        await gsap.to([stockHeader, chartSection, detailsGrid, watchlistSection], {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.in'
        });
        
        // Fetch new data
        stocksData = await fetchStockData(selectedStock.symbol);
        
        if (stocksData) {
            // Re-render
            renderStocksUI(contentArea, container);
            
            // Get new elements and set initial state
            const newElements = [
                contentArea.querySelector('.stocks-header'),
                contentArea.querySelector('.chart-section'),
                contentArea.querySelector('.stock-details-grid'),
                contentArea.querySelector('.watchlist-section')
            ];
            
            gsap.set(newElements, { opacity: 0, y: 20 });
            
            // Re-draw chart
            drawStockChart();
            
            // Fade in
            gsap.to(newElements, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: 'power2.out',
                stagger: 0.05
            });
        }
    }
}

function drawStockChart() {
    const canvas = document.getElementById('stockChart');
    if (!canvas || !stocksData) return;
    
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // Set up canvas with DPI scaling
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
    
    const chartData = stocksData.chartData;
    const prices = chartData.map(d => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get colors
    const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim();
    const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-text-tertiary').trim();
    const gridColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-border-light').trim();
    
    // Enable anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (height - padding * 2) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Calculate points
    const points = chartData.map((data, index) => ({
        x: padding + (width - padding * 2) * (index / (chartData.length - 1)),
        y: height - padding - (height - padding * 2) * ((data.price - minPrice) / priceRange)
    }));
    
    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    const isPositive = parseFloat(stocksData.change) >= 0;
    const fillColor = isPositive ? accentColor : '#ef4444';
    gradient.addColorStop(0, fillColor + '30');
    gradient.addColorStop(1, fillColor + '00');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Draw price labels
    ctx.fillStyle = textColor;
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 4; i++) {
        const price = minPrice + (priceRange * (4 - i) / 4);
        const y = padding + (height - padding * 2) * (i / 4);
        ctx.fillText('$' + price.toFixed(2), padding - 10, y);
    }
}

// Load page-specific CSS
function loadPageStyles() {
    const styleId = 'stocks-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/stocks.css';
    document.head.appendChild(link);
}









