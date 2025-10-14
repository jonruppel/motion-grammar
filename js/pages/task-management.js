// Task Management Experience
// Complete user flow: Create → Organize → Complete tasks

import { Button, Input, Select, Badge, Modal, Section, TaskItem } from '../components/index.js';
import { motionSystem, createTransition, getAdjustedDuration } from '../utils/motion-tokens.js';
import { triggerScaleReveal, createExperienceWrapperDOM } from '../utils/base-experience.js'; // Added createExperienceWrapperDOM

export const header = {
    title: 'Task Management System',
    description: 'A complete workflow demonstrating timing hierarchy, spatial relationships, and feedback patterns'
};

// State
let tasks = [
    { id: 1, title: 'Design new landing page', category: 'Design', completed: false, priority: 'high', dueDate: '2025-10-12' },
    { id: 2, title: 'Review pull requests', category: 'Development', completed: false, priority: 'medium', dueDate: '2025-10-10' },
    { id: 3, title: 'Update documentation', category: 'Documentation', completed: true, priority: 'low', dueDate: '2025-10-08' },
    { id: 4, title: 'Team meeting preparation', category: 'Planning', completed: false, priority: 'high', dueDate: '2025-10-11' },
    { id: 5, title: 'User research synthesis', category: 'Research', completed: false, priority: 'medium', dueDate: '2025-10-15' }
];

let currentView = 'all';
let currentEditingTaskId = null;
let components = [];
let taskComponents = [];
let createModal = null;
let taskListContainer = null;
let taskCountElement = null;
let filterButtons = [];

export function render(container) {
    // Load page-specific styles
    loadPageStyles();
    
    // Clear existing
    container.innerHTML = '';
    components = [];
    taskComponents = [];
    
    // Create main content (dashboard and annotation only)
    const contentDiv = document.createElement('div');
    
    // Dashboard
    const dashboard = document.createElement('div');
    dashboard.className = 'experience-demo scale-reveal';
    
    // Dashboard header (keep for internal title like 'My Tasks' and button)
    dashboard.appendChild(createDashboardHeader());
    
    // Filters
    dashboard.appendChild(createFilters());
    
    // Task list container
    taskListContainer = document.createElement('div');
    taskListContainer.className = 'task-list';
    taskListContainer.id = 'taskList';
    dashboard.appendChild(taskListContainer);
    
    contentDiv.appendChild(dashboard);
    
    // Annotation
    const annotation = document.createElement('div');
    annotation.className = 'experience-annotation scale-reveal';
    annotation.innerHTML = `
        <div class="experience-annotation-title">Motion Principles Applied</div>
        <div class="experience-annotation-text">
            <strong>Timing Hierarchy:</strong> Primary content (tasks) appears first at ${motionSystem.duration.moderate}ms, 
            secondary details follow with ${motionSystem.stagger.tight}ms stagger.<br><br>
            <strong>Spatial Relationships:</strong> Modal slides up from bottom (where action originated), 
            completed tasks slide down into archive section.<br><br>
            <strong>Feedback Patterns:</strong> Immediate hover response (${motionSystem.duration.instant}ms), 
            checkbox animation (${motionSystem.duration.quick}ms), completion celebration (${motionSystem.duration.deliberate}ms).
        </div>
    `;
    contentDiv.appendChild(annotation);
    
    // Wrap in experience wrapper (title/desc handled here, no duplicate)
    const experienceWrapper = createExperienceWrapperDOM(
        'task-management-container',
        'Task Management System',
        'A complete workflow demonstrating timing hierarchy, spatial relationships, and feedback patterns',
        contentDiv
    );
    
    container.appendChild(experienceWrapper);
    
    // Render tasks
    renderTasks();
    
    // Trigger scale reveal animation
    triggerScaleReveal(container);
}

export function init(container) {
    // Already initialized in render
}

export function dispose() {
    components.forEach(c => c.destroy && c.destroy());
    taskComponents.forEach(c => c.destroy && c.destroy());
    if (createModal) createModal.destroy();
    components = [];
    taskComponents = [];
    createModal = null;
}

// Load page-specific CSS
function loadPageStyles() {
    const styleId = 'task-management-page-styles';
    if (document.getElementById(styleId)) return;
    
    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.href = './styles/pages/task-management.css';
    document.head.appendChild(link);
}

// Helper functions
function createDashboardHeader() {
    const header = document.createElement('div');
    header.className = 'task-dashboard-header';

    const leftSide = document.createElement('div');
    leftSide.className = 'task-header-left';

    const title = document.createElement('h2');
    title.className = 'task-dashboard-title';
    title.textContent = 'My Tasks';
    leftSide.appendChild(title);

    taskCountElement = document.createElement('span');
    taskCountElement.className = 'task-count';
    updateTaskCount();
    leftSide.appendChild(taskCountElement);

    header.appendChild(leftSide);

    const createBtn = new Button({
        variant: 'primary',
        iconLeft: 'bx-plus',
        text: 'New Task',
        onClick: () => openCreateModal()
    });
    components.push(createBtn);
    header.appendChild(createBtn.render());

    return header;
}

function createFilters() {
    const filters = document.createElement('div');
    filters.className = 'task-filters';

    const filterData = [
        { view: 'all', label: 'All Tasks' },
        { view: 'active', label: 'Active' },
        { view: 'completed', label: 'Completed' }
    ];

    filterData.forEach(({ view, label }) => {
        const button = document.createElement('button');
        button.className = `task-filter-btn ${view === currentView ? 'active' : ''}`;
        button.dataset.view = view;

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        button.appendChild(labelSpan);

        const count = getFilterCount(view);
        const countSpan = document.createElement('span');
        countSpan.className = 'filter-count';
        countSpan.textContent = count;
        button.appendChild(countSpan);

        button.addEventListener('click', () => changeFilter(view));

        filterButtons.push({ button, view, countSpan });
        filters.appendChild(button);
    });

    return filters;
}

function renderTasks() {
    if (!taskListContainer) return;

    taskComponents.forEach(tc => tc.destroy());
    taskComponents = [];
    taskListContainer.innerHTML = '';

    const filteredTasks = getFilteredTasks();

    filteredTasks.forEach((task) => {
        const taskItem = new TaskItem({
            task,
            onCheckboxChange: (task, checkbox) => toggleTaskComplete(task, checkbox),
            onEdit: (task) => editTask(task),
            onDelete: (task) => deleteTask(task),
            onView: (task) => viewTask(task),
            draggable: true
        });

        taskComponents.push(taskItem);
        taskListContainer.appendChild(taskItem.render());
    });

    // Setup drag and drop
    setupDragAndDrop();

    // Animate tasks in with simple fade
    requestAnimationFrame(() => {
        const taskItems = taskListContainer.querySelectorAll('.task-item');
        taskItems.forEach((item, index) => {
            gsap.fromTo(item,
                { opacity: 0, y: 10 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: 'power2.out'
                }
            );
        });
    });
}

// Note: Individual task items animate with simple fade/slide
// The dashboard container's scale-reveal handles the overall collapse

function getFilteredTasks() {
    if (currentView === 'all') return tasks;
    if (currentView === 'active') return tasks.filter(t => !t.completed);
    if (currentView === 'completed') return tasks.filter(t => t.completed);
    return tasks;
}

function getFilterCount(view) {
    if (view === 'all') return tasks.length;
    if (view === 'active') return tasks.filter(t => !t.completed).length;
    if (view === 'completed') return tasks.filter(t => t.completed).length;
    return 0;
}

function updateTaskCount() {
    if (taskCountElement) {
        const count = tasks.length;
        taskCountElement.textContent = `${count} task${count !== 1 ? 's' : ''}`;
    }

    filterButtons.forEach(({ view, countSpan }) => {
        countSpan.textContent = getFilterCount(view);
    });
}

function changeFilter(view) {
    currentView = view;

    filterButtons.forEach(({ button, view: btnView }) => {
        if (btnView === view) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    renderTasks();
}

function toggleTaskComplete(task, checkbox) {
    const taskData = tasks.find(t => t.id === task.id);
    if (!taskData) return;

    taskData.completed = !taskData.completed;
    checkbox.classList.toggle('checked');

    const taskComponent = taskComponents.find(tc => tc.props.task.id === task.id);
    if (taskComponent) {
        taskComponent.setCompleted(taskData.completed);
    }

    updateTaskCount();

    if (taskData.completed && taskComponent && taskComponent.element) {
        gsap.to(taskComponent.element, {
            scale: 1.02,
            duration: 0.2,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
    }
}

function openCreateModal() {
    currentEditingTaskId = null;

    if (createModal) {
        createModal.destroy();
    }

    const titleInput = new Input({
        id: 'taskTitle',
        label: 'Task Title',
        placeholder: 'What needs to be done?',
        required: true
    });

    const categorySelect = new Select({
        id: 'taskCategory',
        label: 'Category',
        options: ['Design', 'Development', 'Documentation', 'Planning', 'Research']
    });

    const prioritySelect = new Select({
        id: 'taskPriority',
        label: 'Priority',
        options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
        ],
        value: 'medium'
    });

    const dueDateInput = new Input({
        id: 'taskDueDate',
        type: 'date',
        label: 'Due Date'
    });

    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    formRow.appendChild(categorySelect.render());
    formRow.appendChild(prioritySelect.render());

    const cancelBtn = new Button({
        variant: 'secondary',
        text: 'Cancel',
        onClick: () => createModal.close()
    });

    const saveBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-check',
        text: 'Create Task',
        onClick: () => saveTask(titleInput, categorySelect, prioritySelect, dueDateInput)
    });

    createModal = new Modal({
        title: 'Create New Task',
        children: [titleInput, formRow, dueDateInput],
        footer: [cancelBtn, saveBtn]
    });

    components.push(createModal);
    document.body.appendChild(createModal.render());
    createModal.open();

    setTimeout(() => titleInput.focus(), 100);
}

function saveTask(titleInput, categorySelect, prioritySelect, dueDateInput) {
    const title = titleInput.getValue();
    if (!title) {
        alert('Please enter a task title');
        return;
    }

    if (currentEditingTaskId !== null) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === currentEditingTaskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                category: categorySelect.getValue(),
                priority: prioritySelect.getValue(),
                dueDate: dueDateInput.getValue() || tasks[taskIndex].dueDate
            };
        }
    } else {
        // Create new task
        const newTask = {
            id: Math.max(...tasks.map(t => t.id), 0) + 1,
            title,
            category: categorySelect.getValue(),
            priority: prioritySelect.getValue(),
            dueDate: dueDateInput.getValue() || new Date().toISOString().split('T')[0],
            completed: false
        };
        tasks.unshift(newTask);
    }

    createModal.close();
    renderTasks();
    updateTaskCount();
}

function editTask(task) {
    currentEditingTaskId = task.id;

    if (createModal) {
        createModal.destroy();
    }

    const titleInput = new Input({
        id: 'taskTitle',
        label: 'Task Title',
        placeholder: 'What needs to be done?',
        required: true,
        value: task.title
    });

    const categorySelect = new Select({
        id: 'taskCategory',
        label: 'Category',
        options: ['Design', 'Development', 'Documentation', 'Planning', 'Research'],
        value: task.category
    });

    const prioritySelect = new Select({
        id: 'taskPriority',
        label: 'Priority',
        options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
        ],
        value: task.priority
    });

    const dueDateInput = new Input({
        id: 'taskDueDate',
        type: 'date',
        label: 'Due Date',
        value: task.dueDate
    });

    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    formRow.appendChild(categorySelect.render());
    formRow.appendChild(prioritySelect.render());

    const cancelBtn = new Button({
        variant: 'secondary',
        text: 'Cancel',
        onClick: () => createModal.close()
    });

    const saveBtn = new Button({
        variant: 'primary',
        iconRight: 'bx-check',
        text: 'Save Changes',
        onClick: () => saveTask(titleInput, categorySelect, prioritySelect, dueDateInput)
    });

    createModal = new Modal({
        title: 'Edit Task',
        children: [titleInput, formRow, dueDateInput],
        footer: [cancelBtn, saveBtn]
    });

    components.push(createModal);
    document.body.appendChild(createModal.render());
    createModal.open();

    setTimeout(() => titleInput.focus(), 100);
}

function deleteTask(task) {
    const taskComponent = taskComponents.find(tc => tc.props.task.id === task.id);
    
    if (taskComponent && taskComponent.element) {
        gsap.to(taskComponent.element, {
            opacity: 0,
            x: 100,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                tasks = tasks.filter(t => t.id !== task.id);
                updateTaskCount();
                renderTasks();
            }
        });
    }
}

function viewTask(task) {
    console.log('View task:', task);
}

// Drag and Drop functionality
let draggedElement = null;
let draggedTaskId = null;

function setupDragAndDrop() {
    const taskItems = taskListContainer.querySelectorAll('.task-item');

    taskItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = e.currentTarget;
    draggedTaskId = parseInt(e.currentTarget.dataset.taskId);
    
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    
    // Remove all drop indicator classes
    const items = taskListContainer.querySelectorAll('.task-item');
    items.forEach(item => {
        item.classList.remove('drop-above', 'drop-below');
    });
    
    draggedElement = null;
    draggedTaskId = null;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Show insertion indicator
    const dropTarget = e.currentTarget;
    if (dropTarget !== draggedElement) {
        // Calculate if mouse is in top or bottom half of the item
        const rect = dropTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        // Remove all existing indicators
        const allItems = taskListContainer.querySelectorAll('.task-item');
        allItems.forEach(item => {
            item.classList.remove('drop-above', 'drop-below');
        });
        
        // Add appropriate class based on mouse position
        if (e.clientY < midpoint) {
            dropTarget.classList.add('drop-above');
        } else {
            dropTarget.classList.add('drop-below');
        }
    }
    
    return false;
}

function handleDragEnter(e) {
    // Handled in dragOver for more precise positioning
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drop-above', 'drop-below');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.preventDefault();
    
    const dropTarget = e.currentTarget;
    const dropTaskId = parseInt(dropTarget.dataset.taskId);
    const isDropAbove = dropTarget.classList.contains('drop-above');
    
    if (draggedElement !== dropTarget && draggedTaskId && dropTaskId) {
        // Find the actual indices in the main tasks array
        const actualDraggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
        const actualDropIndex = tasks.findIndex(t => t.id === dropTaskId);
        
        if (actualDraggedIndex !== -1 && actualDropIndex !== -1) {
            // Remove the dragged item from its current position
            const [removed] = tasks.splice(actualDraggedIndex, 1);
            
            // Calculate the new insert position
            let insertIndex = actualDropIndex;
            
            // If we removed an item before the drop position, adjust the index
            if (actualDraggedIndex < actualDropIndex) {
                insertIndex--;
            }
            
            // If dropping below, insert after the target
            if (!isDropAbove) {
                insertIndex++;
            }
            
            // Insert at the new position
            tasks.splice(insertIndex, 0, removed);
            
            // Re-render with animation
            renderTasks();
        }
    }
    
    // Clean up classes
    dropTarget.classList.remove('drop-above', 'drop-below');
    
    return false;
}

