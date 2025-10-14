/**
 * Badge Component (Atomic)
 * Small label/badge for status, categories, etc.
 * 
 * Props:
 * - text: string (required) - badge text
 * - variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' (default: 'default')
 * - size: 'sm' | 'md' | 'lg' (default: 'md')
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';

export class Badge extends Component {
    render() {
        const {
            text,
            variant = 'default',
            size = 'md',
            className = ''
        } = this.props;

        if (!text) {
            console.error('Badge: text prop is required');
            return this.createElement('span');
        }

        const classes = ['badge', `badge-${variant}`, `badge-${size}`];
        
        if (className) {
            classes.push(className);
        }

        const badge = this.createElement('span', {
            className: classes.join(' '),
            text
        });

        this.element = badge;
        
        return badge;
    }
}

