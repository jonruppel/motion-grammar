/**
 * Loader Component (Molecular)
 * Page loading indicator
 * 
 * Props:
 * - visible: boolean (default: true) - show/hide loader
 */
import { Component } from '../Component.js';

export class Loader extends Component {
    render() {
        const { visible = true } = this.props;

        const loader = this.createElement('div', {
            className: 'page-loader',
            attributes: {
                id: 'pageLoader'
            }
        });

        if (!visible) {
            loader.style.display = 'none';
        }

        const circle = this.createElement('div', {
            className: 'loader-circle',
            html: `
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle class="loader-ring" cx="50" cy="50" r="45"/>
                </svg>
            `
        });

        loader.appendChild(circle);

        return loader;
    }

    /**
     * Hide loader with animation
     */
    hide(duration = 500) {
        if (this.element) {
            setTimeout(() => {
                this.element.style.opacity = '0';
                setTimeout(() => {
                    this.element.style.display = 'none';
                }, 300);
            }, duration);
        }
    }

    /**
     * Show loader
     */
    show() {
        if (this.element) {
            this.element.style.display = 'flex';
            this.element.style.opacity = '1';
        }
    }
}

