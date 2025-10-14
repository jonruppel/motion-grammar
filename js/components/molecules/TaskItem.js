/**
 * TaskItem Component (Molecular)
 * Specialized list item for tasks
 * 
 * Props:
 * - task: object (required) - {id, title, category, priority, dueDate, completed}
 * - onCheckboxChange: function (optional) - checkbox toggle handler
 * - onEdit: function (optional) - edit handler
 * - onDelete: function (optional) - delete handler
 * - onView: function (optional) - view/click handler
 * - draggable: boolean (default: true) - enable drag and drop
 */
import { Component } from '../Component.js';
import { Icon } from '../atoms/Icon.js';
import { Badge } from '../atoms/Badge.js';
import { Button } from '../atoms/Button.js';

export class TaskItem extends Component {
    render() {
        const {
            task,
            onCheckboxChange,
            onEdit,
            onDelete,
            onView,
            draggable = true
        } = this.props;

        if (!task) {
            console.error('TaskItem: task prop is required');
            return this.createElement('div');
        }

        const { id, title, category, priority, dueDate, completed } = task;

        const item = this.createElement('div', {
            className: `task-item ${completed ? 'completed' : ''}`,
            dataset: { taskId: id },
            attributes: draggable ? { draggable: 'true' } : {}
        });

        // Drag handle
        if (draggable) {
            const dragHandle = this.createElement('div', {
                className: 'task-drag-handle',
                attributes: { title: 'Drag to reorder' }
            });
            const dragIcon = new Icon({ name: 'bx-menu' });
            this.children.push(dragIcon);
            dragHandle.appendChild(dragIcon.render());
            item.appendChild(dragHandle);
        }

        // Checkbox
        const checkboxContainer = this.createElement('div', {
            className: 'task-checkbox-container'
        });

        const checkbox = this.createElement('button', {
            className: `task-checkbox ${completed ? 'checked' : ''}`,
            dataset: { taskId: id }
        });

        const checkIcon = new Icon({ name: 'bx-check' });
        this.children.push(checkIcon);
        checkbox.appendChild(checkIcon.render());

        this.addEventListener(checkbox, 'click', (e) => {
            e.stopPropagation();
            if (onCheckboxChange) {
                onCheckboxChange(task, checkbox);
            }
        });

        checkboxContainer.appendChild(checkbox);
        item.appendChild(checkboxContainer);

        // Task content
        const content = this.createElement('div', {
            className: 'task-content',
            dataset: { taskId: id }
        });

        const titleElement = this.createElement('div', {
            className: 'task-title',
            text: title
        });
        content.appendChild(titleElement);

        // Meta
        const meta = this.createElement('div', {
            className: 'task-meta'
        });

        const categoryBadge = new Badge({
            text: category,
            variant: 'default',
            size: 'sm',
            className: 'task-category'
        });
        this.children.push(categoryBadge);
        meta.appendChild(categoryBadge.render());

        const priorityBadge = new Badge({
            text: priority,
            variant: priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'default',
            size: 'sm',
            className: `task-priority priority-${priority}`
        });
        this.children.push(priorityBadge);
        meta.appendChild(priorityBadge.render());

        // Due date
        const dueSpan = this.createElement('span', {
            className: 'task-due'
        });
        const calendarIcon = new Icon({ name: 'bx-calendar', size: 'sm' });
        this.children.push(calendarIcon);
        dueSpan.appendChild(calendarIcon.render());
        dueSpan.appendChild(document.createTextNode(' ' + this.formatDate(dueDate)));
        meta.appendChild(dueSpan);

        content.appendChild(meta);

        // Content click handler
        if (onView) {
            content.style.cursor = 'pointer';
            this.addEventListener(content, 'click', () => {
                onView(task);
            });
        }

        item.appendChild(content);

        // Actions
        const actions = this.createElement('div', {
            className: 'task-actions'
        });

        if (onEdit) {
            const editBtn = new Button({
                variant: 'icon',
                icon: 'bx-edit',
                className: 'task-action-btn task-edit-btn',
                title: 'Edit',
                onClick: (e) => {
                    e.stopPropagation();
                    onEdit(task);
                }
            });
            this.children.push(editBtn);
            actions.appendChild(editBtn.render());
        }

        if (onDelete) {
            const deleteBtn = new Button({
                variant: 'icon',
                icon: 'bx-trash',
                className: 'task-action-btn task-delete-btn',
                title: 'Delete',
                onClick: (e) => {
                    e.stopPropagation();
                    onDelete(task);
                }
            });
            this.children.push(deleteBtn);
            actions.appendChild(deleteBtn.render());
        }

        item.appendChild(actions);

        this.element = item;
        this.checkboxElement = checkbox;
        
        return item;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Reset hours for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * Update completed state
     */
    setCompleted(completed) {
        if (this.element) {
            if (completed) {
                this.element.classList.add('completed');
            } else {
                this.element.classList.remove('completed');
            }
        }

        if (this.checkboxElement) {
            if (completed) {
                this.checkboxElement.classList.add('checked');
            } else {
                this.checkboxElement.classList.remove('checked');
            }
        }
    }
}

