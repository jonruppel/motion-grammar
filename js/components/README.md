# Component Library

A systematic component architecture following Atomic Design principles for Motion Grammar.

## Architecture

### Component Structure

```
components/
├── Component.js          # Base component class
├── index.js             # Central exports
├── atoms/               # Smallest building blocks
│   ├── Icon.js
│   ├── Button.js
│   └── Text.js
├── molecules/           # Simple combinations
│   ├── Logo.js
│   ├── NavLink.js
│   ├── NavGroup.js
│   └── Loader.js
└── organisms/           # Complex components
    ├── Navigation.js
    └── Sidebar.js
```

## Design Principles

1. **Atomic Design**: Components are organized by complexity (atoms → molecules → organisms)
2. **Vanilla JS**: Pure JavaScript classes, no framework dependencies
3. **Props-based**: Components accept configuration via props
4. **Event-driven**: Components can emit custom events and accept event handlers
5. **Self-contained**: Each component manages its own lifecycle
6. **No inline styles**: All styling through CSS classes (no custom CSS in components)

## Base Component Class

All components extend the `Component` base class which provides:

- **Lifecycle management**: `render()`, `mount()`, `update()`, `destroy()`
- **Event handling**: `addEventListener()`, `emit()`
- **Helper methods**: `createElement()`
- **Memory management**: Automatic cleanup of event listeners and child components

## Component Patterns

### Creating a Component

```javascript
import { Component } from '../Component.js';

export class MyComponent extends Component {
    render() {
        const { prop1, prop2 } = this.props;
        
        const element = this.createElement('div', {
            className: 'my-component',
            attributes: { id: 'unique-id' },
            dataset: { value: 'data' }
        });
        
        // Add event listeners
        this.addEventListener(element, 'click', () => {
            this.emit('myEvent', { data: 'value' });
        });
        
        return element;
    }
}
```

### Using a Component

```javascript
import { MyComponent } from './components/MyComponent.js';

// Create instance
const component = new MyComponent({
    prop1: 'value1',
    prop2: 'value2'
});

// Mount to DOM
component.mount(document.getElementById('container'));

// Listen to custom events
component.element.addEventListener('myEvent', (e) => {
    console.log('Event data:', e.detail);
});

// Update props
component.update({ prop1: 'newValue' });

// Clean up
component.destroy();
```

## Component Types

### Atoms

**Smallest, indivisible components**

- `Icon`: Boxicons icons with size variants
- `Button`: Buttons with variants (primary, secondary, ghost, icon)
- `Text`: Typography with semantic variants

### Molecules

**Simple combinations of atoms**

- `Logo`: Site logo with optional author byline
- `NavLink`: Navigation link with hover states
- `NavGroup`: Collapsible navigation group
- `Loader`: Page loading indicator

### Organisms

**Complex, feature-complete components**

- `Navigation`: Full navigation system with groups and items
- `Sidebar`: Complete sidebar with logo and navigation

## Props System

Components accept props as configuration objects:

```javascript
const button = new Button({
    variant: 'primary',      // Type of button
    size: 'md',              // Size variant
    text: 'Click me',        // Button text
    iconLeft: 'bx-save',     // Optional left icon
    onClick: (e) => { },     // Event handler
    disabled: false,         // State
    className: 'custom'      // Additional classes
});
```

## Event System

### Event Handlers (Props)

Pass functions as props:

```javascript
const button = new Button({
    onClick: (e) => {
        console.log('Clicked!');
    }
});
```

### Custom Events

Components emit custom events:

```javascript
const navLink = new NavLink({ ... });

navLink.element.addEventListener('navLinkClick', (e) => {
    console.log('Clicked:', e.detail);
});
```

## Styling

### CSS Organization

1. **components.css**: Component-specific styles and utilities
2. **global.css**: Global styles and CSS variables
3. **navigation.css**: Navigation-specific styles (legacy)
4. **experiences.css**: Experience-specific styles

### Style Variants

Components use variant props for styling:

```javascript
// Button variants
new Button({ variant: 'primary' });   // .btn-primary
new Button({ variant: 'secondary' }); // .btn-secondary
new Button({ variant: 'ghost' });     // .btn-ghost
new Button({ variant: 'icon' });      // .btn-icon

// Size variants
new Button({ size: 'sm' });  // .btn-sm
new Button({ size: 'md' });  // .btn-md
new Button({ size: 'lg' });  // .btn-lg
```

### Utility Classes

Use utility classes for layout and spacing:

```javascript
const container = this.createElement('div', {
    className: 'flex items-center gap-md p-lg'
});
```

Available utilities:
- **Flexbox**: `flex`, `flex-col`, `items-center`, `justify-between`, `gap-md`
- **Grid**: `grid`, `grid-2`, `grid-3`, `grid-auto`
- **Spacing**: `p-md`, `m-lg`, etc.
- **Display**: `block`, `hidden`, etc.

## Best Practices

1. **Always extend Component**: Don't create standalone elements
2. **Clean up**: Let the base class handle cleanup via `destroy()`
3. **Use createElement**: Don't use innerHTML for security
4. **Track children**: Add child components to `this.children` array
5. **Use addEventListener**: Track listeners for automatic cleanup
6. **Emit events**: Use `this.emit()` for component communication
7. **Props validation**: Check required props and log errors
8. **Immutable props**: Don't mutate props, use `update()` instead

## Migration Guide

### Old Pattern (innerHTML)

```javascript
// ❌ Old way
element.innerHTML = `
    <button class="btn btn-primary">
        <i class="bx bx-save"></i>
        <span>Save</span>
    </button>
`;
```

### New Pattern (Components)

```javascript
// ✅ New way
const button = new Button({
    variant: 'primary',
    iconLeft: 'bx-save',
    text: 'Save',
    onClick: handleSave
});
button.mount(container);
```

## Roadmap

### Phase 1: Core Components ✅
- Base Component class
- Atomic components (Icon, Button, Text)
- Navigation components
- Utility classes

### Phase 2: Form Components (Next)
- Input
- Textarea
- Select
- Checkbox
- Radio
- Form

### Phase 3: Layout Components
- Card
- Modal
- Container
- Grid
- Stack

### Phase 4: Feedback Components
- Toast
- Alert
- Progress
- Spinner

### Phase 5: Experience Components
- Hero
- Stats
- Timeline
- Chart components

