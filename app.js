// app.js — done + clear + filters + count + inline edit
const list = document.getElementById('todoList');
const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const clearBtn = document.getElementById('clearDone');
const KEY = 'todos_v1';

let filter = 'all';     // all | active | done
let editingId = null;   // tahrir paytida boshqa kliklar ishlamasin

function load() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function updateClearButton(items) {
  const hasDone = items.some(t => t.done);
  if (clearBtn) clearBtn.disabled = !hasDone;
}
function updateCount(items) {
  const left = items.filter(t => !t.done).length;
  const total = items.length;
  const el = document.getElementById('count');
  if (el) el.textContent = `${left}/${total} ochiq`;
}
function getVisible(items) {
  if (filter === 'active') return items.filter(t => !t.done);
  if (filter === 'done')   return items.filter(t =>  t.done);
  return items;
}
function render(items) {
  const data = getVisible(items);
  list.innerHTML = '';
  for (const t of data) {
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = (t.done ? 'done ' : '') + (editingId === t.id ? 'editing' : '');
    li.innerHTML = `
      <label style="display:flex;gap:8px;align-items:center;flex:1">
        <input type="checkbox" class="toggle" ${t.done ? 'checked' : ''}/>
        <span class="text" ondblclick="editFromSpan(this)">${t.text}</span>
      </label>
      <button class="del">O‘chirish</button>
    `;
    list.appendChild(li);
  }
  updateClearButton(items);
  updateCount(items);
}

let todos = load().map(t => ({ id: t.id, text: t.text, done: !!t.done }));
render(todos);

// Yangi vazifa
form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  save(todos); render(todos); input.value = '';
});

// O‘chirish / Belgilash (tahrir payti blok)
list.addEventListener('click', e => {
  if (editingId !== null) return;
  const li = e.target.closest('li'); if (!li) return;
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

// === Double-click bilan joyida tahrirlash ===
list.addEventListener('dblclick', e => {
  const span = e.target.closest('span.text');
  if (!span) return;
  e.preventDefault();
  e.stopPropagation();
  const li = span.closest('li');
  startEdit(li, Number(li.dataset.id));
});

function startEdit(li, id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editingId = id;
  li.classList.add('editing');

  const span = li.querySelector('span.text');
  const editor = document.createElement('input');
  editor.className = 'edit-input';
  editor.value = todo.text;
  span.replaceWith(editor);
  editor.focus(); editor.select();

  const commit = () => {
    const v = editor.value.trim();
    if (v) { todo.text = v; save(todos); }
    editingId = null; render(todos);
  };
  const cancel = () => { editingId = null; render(todos); };

  editor.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') commit();
    if (ev.key === 'Escape') cancel();
  });
  editor.addEventListener('blur', commit);
}

// Bajarilganларни тозалаш
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    save(todos); render(todos);
  });
}

// Filtr tugmalari
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
    render(todos);
  });
});

// Demo tugma
document.getElementById('helloBtn')?.addEventListener('click', () => {
  alert('Ассалому алайкум! Hammasi ishlayapti 🚀');
});
