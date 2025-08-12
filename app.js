// app.js — done-chekbox qo‘shilgan (eski ma'lumot saqlanadi)
const list = document.getElementById('todoList');
const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const KEY = 'todos_v1';

function load() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function render(items) {
  list.innerHTML = '';
  for (const t of items) {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = t.done ? 'done' : '';
    li.innerHTML = `
      <label style="display:flex;gap:8px;align-items:center;flex:1">
        <input type="checkbox" class="toggle" ${t.done ? 'checked' : ''}/>
        <span>${t.text}</span>
      </label>
      <button class="del">O‘chirish</button>
    `;
    list.appendChild(li);
  }
}

// Eski yozuvlarda done yo‘q bo‘lishi mumkin — ularni done:false qilib olamiz
let todos = load().map(t => ({ id: t.id, text: t.text, done: !!t.done }));
render(todos);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const item = { id: Date.now(), text, done: false };
  todos.push(item);
  save(todos);
  render(todos);
  input.value = '';
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.classList.contains('del')) {
    todos = todos.filter(t => t.id !== id);
    save(todos); render(todos);
  }
  if (e.target.classList.contains('toggle')) {
    const t = todos.find(t => t.id === id);
    if (t) { t.done = e.target.checked; save(todos); render(todos); }
  }
});

document.getElementById('helloBtn').addEventListener('click', () => {
  alert('Ассалому алайкум! Done belgisi bilan ishlayapti 🚀');
});
