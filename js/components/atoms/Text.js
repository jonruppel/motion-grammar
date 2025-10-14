/**
 * Text Component (Atomic)
 * 
 * Props:
 * - tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' (default: 'p')
 * - variant: 'title' | 'heading' | 'body' | 'caption' | 'label' (optional)
 * - text: string (required) - text content
 * - html: string (optional) - HTML content (use with caution)
 * - className: string (optional) - additional classes
 */
import { Component } from '../Component.js';

export class Text extends Component {
    render() {
        const {
            tag = 'p',
            variant,
            text,
            html,
            className = ''
        } = this.props;

        const classes = ['text'];
        
        if (variant) {
            classes.push(`text-${variant}`);
        }
        
        if (className) {
            classes.push(className);
        }

        const options = {
            className: classes.join(' ')
        };

        if (html) {
            options.html = html;
        } else if (text) {
            options.text = text;
        }

        const element = this.createElement(tag, options);
        this.element = element;
        
        return element;
    }
}

