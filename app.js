const list = document.getElementById('todoList');
const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const KEY = 'todos_v1';

// Saqlangan vazifalarni yuklash
function load() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// Vazifalarni saqlash
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// Vazifalarni sahifaga chizish
function render(items) {
  list.innerHTML = '';
  for (const t of items) {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.innerHTML = `<span>${t.text}</span> <button class="del">O‘chirish</button>`;
    list.appendChild(li);
  }
}

let todos = load();
render(todos);

// Yangi vazifa qo‘shish
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const item = { id: Date.now(), text };
  todos.push(item);
  save(todos);
  render(todos);
  input.value = '';
});

// Vazifani o‘chirish
list.addEventListener('click', (e) => {
  if (!e.target.classList.contains('del')) return;
  const li = e.target.closest('li');
  const id = Number(li.dataset.id);
  todos = todos.filter(t => t.id !== id);
  save(todos);
  render(todos);
});

document.getElementById('helloBtn').addEventListener('click', () => {
  alert('Ассалому алайкум! Сайт ишлаяпти 🚀');
});
