const STORAGE_KEY = 'daily-todo-list-v1';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const pendingList = document.getElementById('pending-list');
const completedList = document.getElementById('completed-list');
const pendingCount = document.getElementById('pending-count');
const completedCount = document.getElementById('completed-count');
const pendingEmpty = document.getElementById('pending-empty');
const completedEmpty = document.getElementById('completed-empty');

let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(timestamp) {
  if (!timestamp) return '—';

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function createTask(text) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
    completedAt: null
  };
}

function updateCounts() {
  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  pendingCount.textContent = `${pending.length} pending`;
  completedCount.textContent = `${completed.length} completed`;

  pendingEmpty.classList.toggle('hidden', pending.length > 0);
  completedEmpty.classList.toggle('hidden', completed.length > 0);
}

function renderTaskItem(task) {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-check';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? 'Mark task as pending' : 'Mark task as complete');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const textWrap = document.createElement('div');
  textWrap.className = 'task-text-wrap';

  const text = document.createElement('p');
  text.className = 'task-text';
  text.textContent = task.text;

  const meta = document.createElement('div');
  meta.className = 'task-meta';
  meta.textContent = task.completed
    ? `Completed: ${formatDate(task.completedAt)} • Added: ${formatDate(task.createdAt)}`
    : `Added: ${formatDate(task.createdAt)}`;

  textWrap.appendChild(text);
  textWrap.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const statusButton = document.createElement('button');
  statusButton.type = 'button';
  statusButton.className = 'secondary-btn';
  statusButton.textContent = task.completed ? 'Mark Pending' : 'Mark Complete';
  statusButton.addEventListener('click', () => toggleTask(task.id));

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'secondary-btn';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => startEdit(task.id, textWrap, actions));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-btn';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => deleteTask(task.id));

  actions.append(statusButton, editButton, deleteButton);
  li.append(checkbox, textWrap, actions);
  return li;
}

function renderTasks() {
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  pendingTasks.forEach((task) => {
    pendingList.appendChild(renderTaskItem(task));
  });

  completedTasks.forEach((task) => {
    completedList.appendChild(renderTaskItem(task));
  });

  updateCounts();
}

function addTask(event) {
  event.preventDefault();

  const text = taskInput.value;
  if (!text.trim()) {
    taskInput.focus();
    return;
  }

  tasks.unshift(createTask(text));
  saveTasks();
  renderTasks();
  taskForm.reset();
  taskInput.focus();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;

    const completed = !task.completed;
    return {
      ...task,
      completed,
      completedAt: completed ? Date.now() : null
    };
  });

  saveTasks();
  renderTasks();
}

function startEdit(taskId, textWrap, actions) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const currentText = task.text;
  const editContainer = document.createElement('div');
  editContainer.className = 'inline-edit';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.maxLength = 200;

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'inline-save-btn';
  saveButton.textContent = 'Save';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'inline-cancel-btn';
  cancelButton.textContent = 'Cancel';

  const handleSave = () => {
    const nextValue = input.value.trim();
    if (!nextValue) {
      input.focus();
      return;
    }

    tasks = tasks.map((item) => (item.id === taskId ? { ...item, text: nextValue } : item));
    saveTasks();
    renderTasks();
  };

  saveButton.addEventListener('click', handleSave);
  cancelButton.addEventListener('click', renderTasks);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSave();
    if (event.key === 'Escape') renderTasks();
  });

  editContainer.append(input, saveButton, cancelButton);
  textWrap.replaceChildren(editContainer);
  actions.innerHTML = '';
  input.focus();
  input.select();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

taskForm.addEventListener('submit', addTask);
renderTasks();
