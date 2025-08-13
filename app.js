// app.js — done + clear + filters + count
const list = document.getElementById('todoList');
const form = document.getElementById('todoForm');
const input = document.getElementById('todoInput');
const clearBtn = document.getElementById('clearDone');
const KEY = 'todos_v1';

let filter = 'all'; // all | active | done

function load(){ const raw = localStorage.getItem(KEY); return raw? JSON.parse(raw):[] }
function save(items){ localStorage.setItem(KEY, JSON.stringify(items)) }

function updateClearButton(items){
  const hasDone = items.some(t=>t.done);
  if (clearBtn) clearBtn.disabled = !hasDone;
}
function updateCount(items){
  const left = items.filter(t=>!t.done).length;
  const total = items.length;
  const el = document.getElementById('count');
  if (el) el.textContent = `${left}/${total} ochiq`;
}
function getVisible(items){
  if (filter==='active') return items.filter(t=>!t.done);
  if (filter==='done')   return items.filter(t=> t.done);
  return items;
}
function render(items){
  const data = getVisible(items);
  list.innerHTML = '';
  for (const t of data){
    const li = document.createElement('li');
    li.dataset.id = t.id;
    li.className = t.done ? 'done' : '';
    li.innerHTML = `
      <label style="display:flex;gap:8px;align-items:center;flex:1">
        <input type="checkbox" class="toggle" ${t.done ? 'checked' : ''}/>
        <span class="text">${t.text}</span>
      </label>
      <button class="del">O‘chirish</button>
    `;
    list.appendChild(li);
  }
  updateClearButton(items);
  updateCount(items);
}

let todos = load().map(t=>({id:t.id, text:t.text, done:!!t.done}));
render(todos);

form.addEventListener('submit', e=>{
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({id:Date.now(), text, done:false});
  save(todos); render(todos); input.value='';
});
list.addEventListener('click', e=>{
  const li = e.target.closest('li'); if(!li) return;
  const id = Number(li.dataset.id);
  if (e.target.classList.contains('del')){
    todos = todos.filter(t=>t.id!==id);
    save(todos); render(todos);
  }
  if (e.target.classList.contains('toggle')){
    const t = todos.find(t=>t.id===id);
    if (t){ t.done = e.target.checked; save(todos); render(todos); }
  }
});
if (clearBtn){
  clearBtn.addEventListener('click', ()=>{
    todos = todos.filter(t=>!t.done);
    save(todos); render(todos);
  });
}
// filter tugmalari
document.querySelectorAll('.filter').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active', b===btn));
    render(todos);
  });
});

document.getElementById('helloBtn').addEventListener('click', ()=>{
  alert('Ассалому алайкум! Filtrlash ham ishlayapti 🚀');
});
