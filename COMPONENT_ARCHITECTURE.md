# Component Architecture Overview

## 📁 Directory Structure

```
js/
├── components/
│   ├── Component.js                 # Base component class
│   ├── index.js                     # Central exports
│   ├── README.md                    # Component documentation
│   │
│   ├── atoms/                       # Atomic components
│   │   ├── Icon.js                  # Icon wrapper
│   │   ├── Button.js                # Button with variants
│   │   └── Text.js                  # Typography
│   │
│   ├── molecules/                   # Molecular components
│   │   ├── Logo.js                  # Site logo
│   │   ├── NavLink.js               # Navigation link
│   │   ├── NavGroup.js              # Nav group (collapsible)
│   │   └── Loader.js                # Page loader
│   │
│   └── organisms/                   # Organism components
│       ├── Navigation.js            # Navigation system
│       └── Sidebar.js               # Complete sidebar
│
├── navigation.js                    # Refactored (uses components)
├── navigation-old.js                # Backup (legacy)
├── app.js                           # Main application
└── content-manager.js               # Content management

styles/
├── global.css                       # Global styles + variables
├── components.css                   # Component styles + utilities ⭐ NEW
├── navigation.css                   # Navigation-specific styles
├── experiences.css                  # Experience styles
└── mobile-preview.css               # Mobile preview styles
```

## 🏗️ Component Hierarchy

```
Sidebar (Organism)
├── Logo (Molecule)
│   └── Text (Atom) × 2
└── Navigation (Organism)
    └── NavGroup (Molecule) × N
        ├── Icon (Atom) × 2
        └── NavLink (Molecule) × N
            └── Text (Atom)
```

## 🎨 Component Variants

### Button
```javascript
// Variants
variant: 'primary' | 'secondary' | 'ghost' | 'icon'

// Sizes
size: 'sm' | 'md' | 'lg'

// With icons
iconLeft: 'bx-icon-name'
iconRight: 'bx-icon-name'
icon: 'bx-icon-name'  // icon-only button
```

### Icon
```javascript
// Sizes
size: 'sm' | 'md' | 'lg' | 'xl'

// Usage
name: 'bx-icon-name'  // required
```

### Text
```javascript
// Tags
tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'

// Variants
variant: 'title' | 'heading' | 'body' | 'caption' | 'label'
```

## 🔧 Utility Classes

### Layout
```css
/* Flexbox */
.flex, .flex-col, .flex-row
.items-center, .items-start, .items-end
.justify-center, .justify-between, .justify-start, .justify-end
.gap-xs, .gap-sm, .gap-md, .gap-lg, .gap-xl

/* Grid */
.grid, .grid-2, .grid-3, .grid-4, .grid-auto
```

### Spacing
```css
/* Padding */
.p-xs, .p-sm, .p-md, .p-lg, .p-xl

/* Margin */
.m-xs, .m-sm, .m-md, .m-lg, .m-xl
```

### Display
```css
.block, .inline-block, .hidden
.w-full, .w-auto
.text-center, .text-left, .text-right
```

## 📊 Component API Reference

### Base Component

All components inherit from `Component` base class:

```javascript
class Component {
    constructor(props)       // Initialize with props
    render()                 // Create and return DOM element (override this)
    mount(parent)            // Mount to parent element
    update(newProps)         // Update props and re-render
    destroy()                // Cleanup and remove from DOM
    
    // Helper methods
    addEventListener(el, event, handler)  // Track event listeners
    emit(eventName, detail)              // Emit custom events
    createElement(tag, options)          // Create DOM elements
}
```

### Component Props Pattern

```javascript
// Standard props structure
{
    // Behavior
    onClick: Function,           // Event handlers
    onHover: Function,
    
    // State
    active: Boolean,
    disabled: Boolean,
    visible: Boolean,
    
    // Content
    text: String,
    html: String,
    icon: String,
    
    // Style
    variant: String,
    size: String,
    className: String,
    
    // Data
    dataset: Object,
    attributes: Object,
    
    // Children
    children: Array<Component>
}
```

## 🔄 Component Lifecycle

```
1. Construction
   ↓
   new Component(props)
   
2. Rendering
   ↓
   component.render()
   → Creates DOM element
   → Attaches event listeners
   → Renders child components
   
3. Mounting
   ↓
   component.mount(parent)
   → Appends to parent
   → Becomes visible in DOM
   
4. Updating (optional)
   ↓
   component.update(newProps)
   → Re-renders with new props
   → Maintains position in DOM
   
5. Destruction
   ↓
   component.destroy()
   → Removes event listeners
   → Destroys child components
   → Removes from DOM
```

## 📝 Usage Patterns

### Pattern 1: Simple Component

```javascript
import { Button } from './components/index.js';

const button = new Button({
    variant: 'primary',
    text: 'Click me',
    onClick: () => console.log('Clicked!')
});

button.mount(document.getElementById('container'));
```

### Pattern 2: Nested Components

```javascript
import { Card, Button, Text } from './components/index.js';

const card = new Card({ variant: 'elevated' });

const heading = new Text({
    tag: 'h3',
    variant: 'heading',
    text: 'Card Title'
});

const button = new Button({
    variant: 'primary',
    text: 'Action'
});

heading.mount(card.element);
button.mount(card.element);
card.mount(container);
```

### Pattern 3: Component with Children

```javascript
class MyComponent extends Component {
    render() {
        const container = this.createElement('div', {
            className: 'my-component'
        });
        
        // Create child components
        const button = new Button({ text: 'Child' });
        this.children.push(button);  // Track for cleanup
        
        container.appendChild(button.render());
        return container;
    }
}
```

### Pattern 4: Event Communication

```javascript
// Parent component
const parent = new ParentComponent();

// Listen to child events
parent.element.addEventListener('customEvent', (e) => {
    console.log('Child emitted:', e.detail);
});

// Child component
class ChildComponent extends Component {
    handleClick() {
        this.emit('customEvent', { data: 'value' });
    }
}
```

## 🎯 Design System Integration

### CSS Variables (from global.css)

```css
/* Colors */
--color-accent
--color-accent-hover
--color-text-primary
--color-text-secondary
--color-bg-primary
--color-bg-secondary

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Typography */
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px
--font-size-lg: 18px
--font-size-xl: 24px

/* Border Radius */
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px

/* Transitions */
--transition-fast: 150ms
--transition-base: 250ms
--transition-slow: 350ms
```

## 🚀 Performance Optimization

### Memory Management
- ✅ Automatic event listener cleanup
- ✅ Child component destruction
- ✅ No memory leaks

### Rendering
- ✅ DOM element reuse
- ✅ Efficient updates
- ✅ Minimal re-renders

### Best Practices
```javascript
// ✅ Good: Reuse components
const button = new Button({ text: 'Click' });
// button used multiple times

// ❌ Bad: Create duplicates
for (let i = 0; i < 10; i++) {
    new Button({ text: 'Click' }).mount(container);
}

// ✅ Good: Track children
this.children.push(childComponent);

// ✅ Good: Clean up
component.destroy();
```

## 📈 Migration Progress

### ✅ Phase 1: Core Infrastructure (Complete)
- [x] Base Component class
- [x] Component system architecture
- [x] Atomic components (Icon, Button, Text)
- [x] Navigation components
- [x] Utility classes system
- [x] Documentation

### 🎯 Phase 2: Home Page (Next)
- [ ] Card components
- [ ] Hero component
- [ ] Section components
- [ ] Grid components
- [ ] Refactor content-manager.js

### 📋 Future Phases
- [ ] Phase 3: Form components (Task Management)
- [ ] Phase 4: Data components (Dashboard)
- [ ] Phase 5: Flow components (Onboarding)
- [ ] Phase 6: Commerce components (E-commerce)

## 🎓 Learning Resources

### Component Files to Study
1. `Component.js` - Base class patterns
2. `atoms/Button.js` - Props and variants
3. `molecules/NavGroup.js` - Parent-child relationship
4. `organisms/Navigation.js` - Complex composition

### Key Concepts
1. **Composition over Inheritance**: Build complex UIs from simple parts
2. **Props Pattern**: Configure components via objects
3. **Event System**: Communication between components
4. **Lifecycle Management**: Create, update, destroy
5. **Utility-First CSS**: Use utility classes for layout

---

**Questions?** See `/js/components/README.md` for detailed documentation.

