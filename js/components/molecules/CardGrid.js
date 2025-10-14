/**
 * CardGrid Component (Molecular)
 * Grid container for cards with responsive layout
 * 
 * Props:
 * - cards: array (required) - array of card data objects
 * - variant: 'experience' | 'principle' | 'default' (default: 'default')
 * - className: string (optional) - additional classes
 * - onCardClick: function (optional) - card click handler
 */
import { Component } from '../Component.js';
import { Card } from './Card.js';

export class CardGrid extends Component {
    render() {
        const {
            cards = [],
            variant = 'default',
            className = '',
            onCardClick
        } = this.props;

        if (!cards.length) {
            console.warn('CardGrid: cards array is empty');
            return this.createElement('div');
        }

        const classes = ['card-grid'];
        
        // Add variant-specific classes
        if (variant === 'experience') {
            classes.push('experience-cards');
        } else if (variant === 'principle') {
            classes.push('principles-grid');
        }
        
        if (className) {
            classes.push(className);
        }

        const grid = this.createElement('div', {
            className: classes.join(' ')
        });

        // Create card components
        cards.forEach(cardData => {
            const card = new Card({
                ...cardData,
                variant,
                onClick: () => {
                    if (onCardClick) {
                        onCardClick(cardData);
                    }
                }
            });
            
            this.children.push(card);
            grid.appendChild(card.render());
        });

        // Store element reference
        this.element = grid;
        
        return grid;
    }

    /**
     * Trigger scale reveal animation on cards
     */
    triggerScaleReveal() {
        if (this.element && window.triggerScaleReveal) {
            window.triggerScaleReveal(this.element, '.scale-reveal');
        }
    }
}

