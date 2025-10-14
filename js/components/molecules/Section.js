/**
 * Section Component (Molecular)
 * Content section with optional title and description
 * 
 * Props:
 * - title: string (optional) - section title
 * - description: string (optional) - section description
 * - className: string (optional) - additional classes
 * - children: array (optional) - child components or elements
 * - marginTop: boolean (default: false) - add top margin
 */
import { Component } from '../Component.js';
import { Text } from '../atoms/Text.js';

export class Section extends Component {
    render() {
        const {
            title,
            description,
            className = '',
            children = [],
            marginTop = false
        } = this.props;

        const classes = ['experience-section'];
        
        if (className) {
            classes.push(className);
        }

        const section = this.createElement('div', {
            className: classes.join(' ')
        });

        if (marginTop) {
            section.style.marginTop = '4rem';
        }

        // Intro with title and description
        if (title || description) {
            const intro = this.createElement('div', {
                className: 'experience-intro'
            });

            if (title) {
                const titleElement = new Text({
                    tag: 'h2',
                    text: title
                });
                this.children.push(titleElement);
                intro.appendChild(titleElement.render());
            }

            if (description) {
                const descElement = new Text({
                    tag: 'p',
                    text: description
                });
                this.children.push(descElement);
                intro.appendChild(descElement.render());
            }

            section.appendChild(intro);
        }

        // Add children
        children.forEach(child => {
            if (child instanceof Component) {
                this.children.push(child);
                section.appendChild(child.render());
            } else if (child instanceof HTMLElement) {
                section.appendChild(child);
            }
        });

        // Store element reference
        this.element = section;
        
        return section;
    }
}

