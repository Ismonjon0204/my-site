// app.js — done + clear + filters + count + inline edit + drag & drop
const list = document.getElementById('todoList');
const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const clearBtn = document.getElementById('clearDone');
const KEY = 'todos_v1';

let filter = 'all';      // all | active | done
let editingId = null;    // tahrir paytida boshqa kliklar ishlamasin
let draggingId = null;   // hozir surilayotgan element id’si

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) { try { return JSON.parse(raw); } catch {} }
  return [];
}
function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }

function updateClearButton(items){
  const hasDone = items.some(t => t.done);
  if (clearBtn) clearBtn.disabled = !hasDone;
}
function updateCount(items){
  const left = items.filter(t => !t.done).length;
  const total = items.length;
  const el = document.getElementById('count');
  if (el) el.textContent = `${left}/${total} ochiq`;
}
function getVisible(items){
  if (filter === 'active') return items.filter(t => !t.done);
  if (filter === 'done')   return items.filter(t =>  t.done);
  return items;
}
function render(items){
  const data = getVisible(items);
  list.innerHTML = '';
  for (const t of data){
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = (t.done ? 'done ' : '') + (editingId === t.id ? 'editing' : '');
    // Drag faqat "Hammasi" rejимида ишлайди (filter==='all') ва таҳрир эмас пайтда
    li.draggable = (filter === 'all' && editingId === null);

    li.innerHTML = `
      <label style="display:flex;gap:8px;align-items:center;flex:1">
        <input type="checkbox" class="toggle" ${t.done ? 'checked' : ''}/>
        <span class="text" title="Ikki marta bosing — tahrirlash">${t.text}</span>
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

// yangi vazifa
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  save(todos); render(todos); input.value = '';
});

// del / toggle — tahrir paytida blok
list.addEventListener('click', (e) => {
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
list.addEventListener('dblclick', (e) => {
  const span = e.target.closest('span.text');
  if (!span) return;
  e.preventDefault(); e.stopPropagation();
  const li = span.closest('li');
  startEdit(li, Number(li.dataset.id));
});

function startEdit(li, id){
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

  editor.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') commit();
    if (ev.key === 'Escape') cancel();
  });
  editor.addEventListener('blur', commit);
}

// === Clear done ===
if (clearBtn){
  clearBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    save(todos); render(todos);
  });
}

// === Filters ===
document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
    render(todos);
  });
});

// === Drag & Drop (HTML5) — faqat filter==='all' bo‘lganda ===
list.addEventListener('dragstart', (e) => {
  const li = e.target.closest('li');
  if (!li || filter !== 'all' || editingId !== null) { e.preventDefault(); return; }
  draggingId = Number(li.dataset.id);
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
});
list.addEventListener('dragend', (e) => {
  const li = e.target.closest('li');
  if (li) li.classList.remove('dragging');
  draggingId = null;
});
list.addEventListener('dragover', (e) => {
  if (filter !== 'all' || editingId !== null) return;
  e.preventDefault(); // drop'ni рухсат қилиш
  const after = getDragAfterElement(list, e.clientY);
  const draggingEl = list.querySelector('.dragging');
  if (!draggingEl) return;
  if (after == null) {
    list.appendChild(draggingEl);
  } else {
    list.insertBefore(draggingEl, after);
  }
});
list.addEventListener('drop', () => {
  if (filter !== 'all') return;
  // DOM'даги янги тартибдан массивни янгилаймиз
  const ids = Array.from(list.querySelectorAll('li')).map(li => Number(li.dataset.id));
  const byId = new Map(todos.map(t => [t.id, t]));
  todos = ids.map(id => byId.get(id)).filter(Boolean);
  save(todos);
  render(todos);
});

function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll('li:not(.dragging)')];
  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
  for (const el of els){
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset){
      closest = { offset, element: el };
    }
  }
  return closest.element;
}

// Demo tugma
document.getElementById('helloBtn')?.addEventListener('click', () => {
  alert('Ассалому алайкум! Drag & drop ҳам бор 🚀');
});
