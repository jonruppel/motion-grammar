// Weather App Experience

import { 
    createLoadingState, 
    createErrorState, 
    createExperienceWrapperDOM,
    triggerScaleReveal
} from '../utils/base-experience.js';

import {
    Dropdown,
    StatCard,
    WeatherCard,
    Section,
    Icon,
    Text
} from '../components/index.js';

export const metadata = {
    id: 'weather',
    title: 'Weather',
    icon: 'bx-cloud',
    category: 'experiences',
    description: 'Real-time weather visualization with motion design'
};

// Major US Cities with coordinates
const cities = [
    { name: 'New York, NY', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' },
    { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
    { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago' },
    { name: 'Houston, TX', lat: 29.7604, lon: -95.3698, timezone: 'America/Chicago' },
    { name: 'Phoenix, AZ', lat: 33.4484, lon: -112.0740, timezone: 'America/Phoenix' },
    { name: 'Philadelphia, PA', lat: 39.9526, lon: -75.1652, timezone: 'America/New_York' },
    { name: 'San Antonio, TX', lat: 29.4241, lon: -98.4936, timezone: 'America/Chicago' },
    { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611, timezone: 'America/Los_Angeles' },
    { name: 'Dallas, TX', lat: 32.7767, lon: -96.7970, timezone: 'America/Chicago' },
    { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194, timezone: 'America/Los_Angeles' }
];

// Weather code to icon mapping (WMO Weather interpretation codes)
const weatherCodeToIcon = {
    0: { icon: 'bx-sun', description: 'Clear sky' },
    1: { icon: 'bx-sun', description: 'Mainly clear' },
    2: { icon: 'bx-cloud', description: 'Partly cloudy' },
    3: { icon: 'bx-cloud', description: 'Overcast' },
    45: { icon: 'bx-cloud', description: 'Foggy' },
    48: { icon: 'bx-cloud', description: 'Foggy' },
    51: { icon: 'bx-cloud-drizzle', description: 'Light drizzle' },
    53: { icon: 'bx-cloud-drizzle', description: 'Moderate drizzle' },
    55: { icon: 'bx-cloud-drizzle', description: 'Dense drizzle' },
    61: { icon: 'bx-cloud-rain', description: 'Slight rain' },
    63: { icon: 'bx-cloud-rain', description: 'Moderate rain' },
    65: { icon: 'bx-cloud-rain', description: 'Heavy rain' },
    71: { icon: 'bx-cloud-snow', description: 'Slight snow' },
    73: { icon: 'bx-cloud-snow', description: 'Moderate snow' },
    75: { icon: 'bx-cloud-snow', description: 'Heavy snow' },
    77: { icon: 'bx-cloud-snow', description: 'Snow grains' },
    80: { icon: 'bx-cloud-rain', description: 'Slight showers' },
    81: { icon: 'bx-cloud-rain', description: 'Moderate showers' },
    82: { icon: 'bx-cloud-rain', description: 'Violent showers' },
    85: { icon: 'bx-cloud-snow', description: 'Slight snow showers' },
    86: { icon: 'bx-cloud-snow', description: 'Heavy snow showers' },
    95: { icon: 'bx-cloud-lightning', description: 'Thunderstorm' },
    96: { icon: 'bx-cloud-lightning', description: 'Thunderstorm with hail' },
    99: { icon: 'bx-cloud-lightning', description: 'Thunderstorm with heavy hail' }
};

let currentCity = cities[0]; // Default to New York
let weatherData = null;
let componentsMap = {}; // Track component instances for cleanup

// Fetch weather data from Open-Meteo API
async function fetchWeatherData(city) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${city.lat}&longitude=${city.lon}&` +
            `current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
            `weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,` +
            `visibility&` +
            `hourly=temperature_2m,precipitation_probability,weather_code&` +
            `daily=temperature_2m_max,temperature_2m_min,weather_code,` +
            `precipitation_probability_max,sunrise,sunset,uv_index_max&` +
            `temperature_unit=fahrenheit&wind_speed_unit=mph&` +
            `precipitation_unit=inch&timezone=${city.timezone}&` +
            `forecast_days=7`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather data fetch failed');
        
        const data = await response.json();
        return processWeatherData(data, city);
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Process API data into our format
function processWeatherData(data, city) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;
    
    // Get weather info from code
    const weatherInfo = weatherCodeToIcon[current.weather_code] || weatherCodeToIcon[0];
    
    // Wind direction from degrees
    const windDirection = getWindDirection(current.wind_direction_10m);
    
    // Format times
    const sunrise = formatTime(daily.sunrise[0]);
    const sunset = formatTime(daily.sunset[0]);
    
    // Get next 12 hours
    const now = new Date();
    const currentHour = now.getHours();
    const hourlyForecast = [];
    
    for (let i = 0; i < 12; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex < hourly.time.length) {
            const time = new Date(hourly.time[hourIndex]);
            const hourWeather = weatherCodeToIcon[hourly.weather_code[hourIndex]] || weatherCodeToIcon[0];
            
            hourlyForecast.push({
                time: i === 0 ? 'Now' : time.toLocaleTimeString('en-US', { hour: 'numeric' }),
                temp: Math.round(hourly.temperature_2m[hourIndex]),
                icon: hourWeather.icon,
                precip: hourly.precipitation_probability[hourIndex] || 0
            });
        }
    }
    
    // Get 7-day forecast
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyForecast = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayWeather = weatherCodeToIcon[daily.weather_code[i]] || weatherCodeToIcon[0];
        
        dailyForecast.push({
            day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
            icon: dayWeather.icon,
            precip: daily.precipitation_probability_max[i] || 0,
            condition: dayWeather.description
        });
    }
    
    return {
        current: {
            location: city.name,
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            condition: weatherInfo.description,
            icon: weatherInfo.icon,
            high: Math.round(daily.temperature_2m_max[0]),
            low: Math.round(daily.temperature_2m_min[0]),
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: Math.round(current.wind_speed_10m),
            windDirection: windDirection,
            pressure: (current.pressure_msl / 33.8639).toFixed(2), // Convert to inHg
            visibility: Math.round(current.visibility / 1609.34), // Convert to miles
            uvIndex: daily.uv_index_max[0] ? Math.round(daily.uv_index_max[0]) : 0,
            sunrise: sunrise,
            sunset: sunset
        },
        hourly: hourlyForecast,
        daily: dailyForecast
    };
}

// Helper functions
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return directions[index];
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function render(container) {
    // Load page-specific styles
    loadPageStyles();
    
    const className = 'weather-container';
    
    const loaderContent = document.createElement('div');
    loaderContent.className = 'weather-loading';
    loaderContent.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i><p>Loading weather data...</p>`;
    
    const wrapper = createExperienceWrapperDOM(className, 'Weather', 'Real-time weather data with forecasts and motion design', loaderContent);
    
    container.innerHTML = '';
    container.appendChild(wrapper);
    
    // Fetch weather data and render
    loadWeather(container);
}

async function loadWeather(container) {
    weatherData = await fetchWeatherData(currentCity);
    
    const wrapper = container.querySelector('.experience');
    const intro = wrapper.querySelector('.experience-intro');
    const contentArea = intro.nextElementSibling;
    
    if (!weatherData) {
        // Show error state using base utility
        contentArea.innerHTML = `
            <div class="weather-error">
                <i class='bx bx-error-circle'></i>
                <p>Unable to load weather data</p>
                <button onclick="location.reload()" class="retry-button">Retry</button>
            </div>
        `;
        return;
    }
    
    renderWeatherUI(contentArea, container);
}

function renderWeatherUI(contentArea, container) {
    if (!weatherData) return;
    
    // Clean up previous components
    Object.values(componentsMap).forEach(comp => comp.destroy && comp.destroy());
    componentsMap = {};
    
    // Create content container
    const content = document.createElement('div');
    
    // === LOCATION HEADER ===
    const locationHeader = document.createElement('div');
    locationHeader.className = 'weather-header';
    
    const locationSelector = document.createElement('div');
    locationSelector.className = 'location-selector scale-reveal';
    
    const mapIcon = new Icon({ name: 'bx-map', size: 'md' });
    componentsMap.mapIcon = mapIcon;
    locationSelector.appendChild(mapIcon.render());
    
    const dropdown = new Dropdown({
        options: cities.map(city => ({
            value: city.name,
            label: city.name
        })),
        value: currentCity.name,
        onChange: async (value) => {
            const selectedCity = cities.find(city => city.name === value);
            if (selectedCity && selectedCity.name !== currentCity.name) {
                currentCity = selectedCity;
                await animateLocationChange(container);
            }
        }
    });
    componentsMap.dropdown = dropdown;
    locationSelector.appendChild(dropdown.render());
    
    locationHeader.appendChild(locationSelector);
    content.appendChild(locationHeader);
    
    // === CURRENT WEATHER ===
    const currentWeather = document.createElement('div');
    currentWeather.className = 'current-weather scale-reveal';
    
    const currentMain = document.createElement('div');
    currentMain.className = 'current-main';
    
    // Icon wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'current-icon-wrapper';
    
    const weatherIcon = new Icon({ 
        name: weatherData.current.icon, 
        className: 'weather-icon' 
    });
    componentsMap.weatherIcon = weatherIcon;
    iconWrapper.appendChild(weatherIcon.render());
    
    currentMain.appendChild(iconWrapper);
    
    // Temperature info
    const tempWrapper = document.createElement('div');
    tempWrapper.className = 'current-temp-wrapper';
    
    const currentTemp = document.createElement('div');
    currentTemp.className = 'current-temp';
    currentTemp.textContent = `${weatherData.current.temp}°`;
    tempWrapper.appendChild(currentTemp);
    
    const currentCondition = document.createElement('div');
    currentCondition.className = 'current-condition';
    currentCondition.textContent = weatherData.current.condition;
    tempWrapper.appendChild(currentCondition);
    
    const tempRange = document.createElement('div');
    tempRange.className = 'temp-range';
    tempRange.innerHTML = `
        <span class="temp-high">
            <i class='bx bx-up-arrow-alt'></i>
            ${weatherData.current.high}°
        </span>
        <span class="temp-divider">•</span>
        <span class="temp-low">
            <i class='bx bx-down-arrow-alt'></i>
            ${weatherData.current.low}°
        </span>
    `;
    tempWrapper.appendChild(tempRange);
    
    currentMain.appendChild(tempWrapper);
    currentWeather.appendChild(currentMain);
    content.appendChild(currentWeather);
    
    // === WEATHER DETAILS GRID ===
    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'weather-details-grid';
    
    // Humidity with progress bar
    const humidityCard = document.createElement('div');
    humidityCard.className = 'detail-card scale-reveal';
    humidityCard.innerHTML = `
        <div class="detail-header">
            <i class='bx bx-droplet'></i>
            <span>Humidity</span>
        </div>
        <div class="detail-value">${weatherData.current.humidity}%</div>
        <div class="detail-indicator">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${weatherData.current.humidity}%"></div>
            </div>
        </div>
    `;
    detailsGrid.appendChild(humidityCard);
    
    // Wind
    const windCard = new StatCard({
        icon: 'bx-wind',
        label: 'Wind',
        value: `${weatherData.current.windSpeed} mph`,
        className: 'detail-card-stat'
    });
    componentsMap.windCard = windCard;
    const windEl = windCard.render();
    const windSubtitle = document.createElement('div');
    windSubtitle.className = 'detail-subtitle';
    windSubtitle.textContent = weatherData.current.windDirection;
    windEl.appendChild(windSubtitle);
    detailsGrid.appendChild(windEl);
    
    // Pressure
    const pressureCard = new StatCard({
        icon: 'bx-tachometer',
        label: 'Pressure',
        value: weatherData.current.pressure,
        className: 'detail-card-stat'
    });
    componentsMap.pressureCard = pressureCard;
    const pressureEl = pressureCard.render();
    const pressureSubtitle = document.createElement('div');
    pressureSubtitle.className = 'detail-subtitle';
    pressureSubtitle.textContent = 'inHg';
    pressureEl.appendChild(pressureSubtitle);
    detailsGrid.appendChild(pressureEl);
    
    // Visibility
    const visibilityCard = new StatCard({
        icon: 'bx-low-vision',
        label: 'Visibility',
        value: `${weatherData.current.visibility} mi`,
        className: 'detail-card-stat'
    });
    componentsMap.visibilityCard = visibilityCard;
    const visibilityEl = visibilityCard.render();
    const visibilitySubtitle = document.createElement('div');
    visibilitySubtitle.className = 'detail-subtitle';
    visibilitySubtitle.textContent = 'Clear';
    visibilityEl.appendChild(visibilitySubtitle);
    detailsGrid.appendChild(visibilityEl);
    
    // UV Index
    const uvCard = new StatCard({
        icon: 'bx-sun',
        label: 'UV Index',
        value: `${weatherData.current.uvIndex}`,
        className: 'detail-card-stat'
    });
    componentsMap.uvCard = uvCard;
    const uvEl = uvCard.render();
    const uvSubtitle = document.createElement('div');
    uvSubtitle.className = 'detail-subtitle';
    uvSubtitle.textContent = 'High';
    uvEl.appendChild(uvSubtitle);
    detailsGrid.appendChild(uvEl);
    
    // Sun Times
    const sunCard = document.createElement('div');
    sunCard.className = 'detail-card scale-reveal';
    sunCard.innerHTML = `
        <div class="detail-header">
            <i class='bx bx-time'></i>
            <span>Sun Times</span>
        </div>
        <div class="sun-times">
            <div class="sun-time">
                <i class='bx bx-sunrise'></i>
                <span>${weatherData.current.sunrise}</span>
            </div>
            <div class="sun-time">
                <i class='bx bx-sunset'></i>
                <span>${weatherData.current.sunset}</span>
            </div>
        </div>
    `;
    detailsGrid.appendChild(sunCard);
    
    content.appendChild(detailsGrid);
    
    // === HOURLY FORECAST ===
    const hourlySection = document.createElement('div');
    hourlySection.className = 'forecast-section';
    
    const hourlyTitle = document.createElement('h3');
    hourlyTitle.className = 'section-title';
    hourlyTitle.textContent = 'Hourly Forecast';
    hourlySection.appendChild(hourlyTitle);
    
    const hourlyForecast = document.createElement('div');
    hourlyForecast.className = 'hourly-forecast scale-reveal';
    
    weatherData.hourly.forEach((hour, index) => {
        const hourCard = new WeatherCard({
            variant: 'hourly',
            time: hour.time,
            temp: hour.temp,
            icon: hour.icon,
            precip: hour.precip,
            delay: index * 50
        });
        componentsMap[`hourly-${index}`] = hourCard;
        hourlyForecast.appendChild(hourCard.render());
    });
    
    hourlySection.appendChild(hourlyForecast);
    content.appendChild(hourlySection);
    
    // === DAILY FORECAST ===
    const dailySection = document.createElement('div');
    dailySection.className = 'forecast-section';
    
    const dailyTitle = document.createElement('h3');
    dailyTitle.className = 'section-title';
    dailyTitle.textContent = '7-Day Forecast';
    dailySection.appendChild(dailyTitle);
    
    const dailyForecast = document.createElement('div');
    dailyForecast.className = 'daily-forecast';
    
    weatherData.daily.forEach((day, index) => {
        const dayCard = new WeatherCard({
            variant: 'daily',
            day: day.day,
            high: day.high,
            low: day.low,
            icon: day.icon,
            condition: day.condition,
            precip: day.precip,
            delay: index * 50
        });
        componentsMap[`daily-${index}`] = dayCard;
        dailyForecast.appendChild(dayCard.render());
    });
    
    dailySection.appendChild(dailyForecast);
    content.appendChild(dailySection);
    
    contentArea.innerHTML = '';
    contentArea.appendChild(content);
    
    // Initialize animations
    initializeWeather();
    
    // Trigger scale reveal animation using base utility
    triggerScaleReveal(container);
}

function initializeWeather() {
    // Animate progress bars
    animateProgressBars();
}

async function animateLocationChange(container) {
    const wrapper = container.querySelector('.experience');
    const intro = wrapper.querySelector('.experience-intro');
    const contentArea = intro.nextElementSibling;
    
    const currentWeather = contentArea.querySelector('.current-weather');
    const detailsGrid = contentArea.querySelector('.weather-details-grid');
    const forecastSections = contentArea.querySelectorAll('.forecast-section');
    
    if (currentWeather && detailsGrid) {
        // Fade out
        await gsap.to([currentWeather, detailsGrid, ...forecastSections], {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.in'
        });
        
        // Fetch new data
        weatherData = await fetchWeatherData(currentCity);
        
        if (weatherData) {
            // Re-render
            renderWeatherUI(contentArea, container);
        }
    }
}

function animateProgressBars() {
    const progressFills = document.querySelectorAll('.progress-fill');
    progressFills.forEach((fill, index) => {
        const targetWidth = fill.style.width;
        fill.style.width = '0%';
        
        setTimeout(() => {
            gsap.to(fill, {
                width: targetWidth,
                duration: 1.2,
                ease: 'expo.out',
                delay: index * 0.1
            });
        }, 600);
    });
}

// Load page-specific CSS
function loadPageStyles() {
    const styleId = 'weather-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/weather.css';
    document.head.appendChild(link);
}





