/**
 * WeatherCard Component (Molecular)
 * Cards for displaying hourly and daily weather forecasts
 * 
 * Props:
 * - variant: 'hourly' | 'daily' (default: 'hourly')
 * - time: string (required) - time label (e.g., "Now", "3 PM")
 * - day: string (optional) - day label for daily variant
 * - temp: number (required) - temperature value
 * - high: number (optional) - high temp for daily variant
 * - low: number (optional) - low temp for daily variant
 * - icon: string (required) - weather icon name
 * - condition: string (optional) - weather condition text
 * - precip: number (optional) - precipitation probability
 * - className: string (optional) - additional classes
 * - delay: number (optional) - animation delay in ms
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';

export class WeatherCard extends Component {
    render() {
        const {
            variant = 'hourly',
            time,
            day,
            temp,
            high,
            low,
            icon,
            condition,
            precip,
            className = '',
            delay = 0
        } = this.props;

        // Validation: icon is always required
        if (!icon) {
            console.error('WeatherCard: icon prop is required');
            return this.createElement('div');
        }
        
        // For hourly variant, temp is required
        if (variant === 'hourly' && temp === undefined) {
            console.error('WeatherCard: temp prop is required for hourly variant');
            return this.createElement('div');
        }
        
        // For daily variant, high and low are required
        if (variant === 'daily' && (high === undefined || low === undefined)) {
            console.error('WeatherCard: high and low props are required for daily variant');
            return this.createElement('div');
        }

        const classes = [];
        
        if (variant === 'hourly') {
            classes.push('hourly-item');
        } else if (variant === 'daily') {
            classes.push('daily-item', 'scale-reveal');
        }
        
        if (className) {
            classes.push(className);
        }

        const card = this.createElement('div', {
            className: classes.join(' ')
        });

        if (delay > 0) {
            card.style.animationDelay = `${delay}ms`;
        }

        // Hourly variant
        if (variant === 'hourly') {
            // Time
            const timeElement = this.createElement('div', {
                className: 'hourly-time',
                text: time || 'Now'
            });
            card.appendChild(timeElement);

            // Icon
            const iconComponent = new Icon({ 
                name: icon, 
                className: 'hourly-icon' 
            });
            this.children.push(iconComponent);
            card.appendChild(iconComponent.render());

            // Temperature
            const tempElement = this.createElement('div', {
                className: 'hourly-temp',
                text: `${Math.round(temp)}°`
            });
            card.appendChild(tempElement);

            // Precipitation
            if (precip !== undefined) {
                const precipContainer = this.createElement('div', {
                    className: 'hourly-precip'
                });
                
                const precipIcon = new Icon({ 
                    name: 'bx-droplet', 
                    size: 'xs' 
                });
                this.children.push(precipIcon);
                precipContainer.appendChild(precipIcon.render());
                
                const precipText = this.createElement('span', {
                    text: `${precip}%`
                });
                precipContainer.appendChild(precipText);
                
                card.appendChild(precipContainer);
            }
        }
        
        // Daily variant
        else if (variant === 'daily') {
            // Day
            const dayElement = this.createElement('div', {
                className: 'daily-day',
                text: day || time
            });
            card.appendChild(dayElement);

            // Condition with icon
            const conditionContainer = this.createElement('div', {
                className: 'daily-condition'
            });
            
            const iconComponent = new Icon({ name: icon });
            this.children.push(iconComponent);
            conditionContainer.appendChild(iconComponent.render());
            
            if (condition) {
                const conditionText = this.createElement('span', {
                    text: condition
                });
                conditionContainer.appendChild(conditionText);
            }
            
            card.appendChild(conditionContainer);

            // Precipitation
            if (precip !== undefined) {
                const precipContainer = this.createElement('div', {
                    className: 'daily-precip'
                });
                
                const precipIcon = new Icon({ name: 'bx-droplet' });
                this.children.push(precipIcon);
                precipContainer.appendChild(precipIcon.render());
                
                const precipText = this.createElement('span', {
                    text: `${precip}%`
                });
                precipContainer.appendChild(precipText);
                
                card.appendChild(precipContainer);
            }

            // Temperature range
            if (high !== undefined && low !== undefined) {
                const tempsContainer = this.createElement('div', {
                    className: 'daily-temps'
                });
                
                const highElement = this.createElement('span', {
                    className: 'daily-high',
                    text: `${Math.round(high)}°`
                });
                tempsContainer.appendChild(highElement);
                
                // Temperature bar
                const tempBar = this.createElement('div', {
                    className: 'temp-bar'
                });
                const tempBarFill = this.createElement('div', {
                    className: 'temp-bar-fill'
                });
                // Width based on high temperature (normalized to 50-100 range)
                const width = Math.min(100, Math.max(0, (high - 50) * 2));
                tempBarFill.style.width = `${width}%`;
                tempBar.appendChild(tempBarFill);
                tempsContainer.appendChild(tempBar);
                
                const lowElement = this.createElement('span', {
                    className: 'daily-low',
                    text: `${Math.round(low)}°`
                });
                tempsContainer.appendChild(lowElement);
                
                card.appendChild(tempsContainer);
            }
        }

        // Store element reference
        this.element = card;
        
        return card;
    }
}

