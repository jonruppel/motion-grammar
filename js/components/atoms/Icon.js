/**
 * Icon Component (Atomic)
 * Renders Boxicons icons
 * 
 * Props:
 * - name: string (required) - icon name (e.g., 'bx-layout', 'bx-moon')
 * - size: 'sm' | 'md' | 'lg' | 'xl' (optional) - icon size
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';

export class Icon extends Component {
    render() {
        const { name, size, className = '' } = this.props;
        
        if (!name) {
            console.error('Icon: name prop is required');
            return this.createElement('span');
        }

        const classes = ['icon', `bx ${name}`];
        
        if (size) {
            classes.push(`icon-${size}`);
        }
        
        if (className) {
            classes.push(className);
        }

        const element = this.createElement('i', {
            className: classes.join(' ')
        });

        this.element = element;
        
        return element;
    }
}

