/**
 * Logo Component (Molecular)
 * 
 * Props:
 * - onClick: function (optional) - click handler for logo
 * - showAuthor: boolean (default: true) - show author byline
 */
import { Component } from '../Component.js';
import { Text } from '../atoms/Text.js';

export class Logo extends Component {
    render() {
        const {
            onClick,
            showAuthor = true
        } = this.props;

        const container = this.createElement('div', {
            className: 'logo-container'
        });

        // Main logo
        const logoTitle = new Text({
            tag: 'h1',
            className: 'logo',
            html: 'MOTION<br>GRAMMAR'
        });
        this.children.push(logoTitle);
        container.appendChild(logoTitle.render());

        // Author byline
        if (showAuthor) {
            const author = new Text({
                tag: 'p',
                className: 'logo-author',
                text: 'by Jon Ruppel'
            });
            this.children.push(author);
            container.appendChild(author.render());
        }

        // Click handler
        if (onClick) {
            this.addEventListener(container, 'click', (e) => {
                onClick(e);
                this.emit('logoClick', { logo: this });
            });
            container.style.cursor = 'pointer';
        }

        return container;
    }
}

