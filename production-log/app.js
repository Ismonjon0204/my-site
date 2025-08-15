// Screw production log — localStorage based SPA
const KEY = 'screw_logs_v1';

// Elements
const themeBtn  = document.getElementById('themeToggle');
const form      = document.getElementById('entryForm');
const serialEl  = document.getElementById('serialNo');
const machineEl = document.getElementById('machineNo');
const dateEl    = document.getElementById('date');
const taraEl    = document.getElementById('taraNo');
const sizeEl    = document.getElementById('size');
const kgEl      = document.getElementById('kg');
const operatorEl= document.getElementById('operator');
const workshopEl= document.getElementById('workshop');
const resetBtn  = document.getElementById('resetBtn');
const saveBtn   = document.getElementById('saveBtn');
const searchEl  = document.getElementById('search');
const exportBtn = document.getElementById('exportCsv');

const tableBody = document.querySelector('#logTable tbody');
const tableHead = document.querySelector('#logTable thead');
const sumKgEl   = document.getElementById('sumKg');
const totalKgEl = document.getElementById('totalKg');
const totalCountEl = document.getElementById('totalCount');

// State
let entries = load();
let sortBy = 'date';
let sortDir = 'desc';
let editingId = null;

// Init theme
(function themeInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);
  updateThemeIcon();
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon();
  });
  function updateThemeIcon(){
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.title = dark ? "Ёруғ режим" : "Тунги режим";
  }
})();

// Helpers
function load(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(entries)); }
function toNumber(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
function nextSerial(){
  const max = entries.reduce((m,e)=>Math.max(m, toNumber(e.serialNo)||0), 0);
  return String(max + 1);
}
function fmtKg(n){ return (Math.round(n*100)/100).toFixed(2); }

// Prefill serial
if (!serialEl.value) serialEl.value = nextSerial();

// Search
let query = '';
searchEl.addEventListener('input', () => { query = searchEl.value.trim().toLowerCase(); render(); });

// Sorting
tableHead.addEventListener('click', (e)=>{
  const th = e.target.closest('th[data-sort]'); if (!th) return;
  const key = th.dataset.sort;
  if (sortBy === key) sortDir = (sortDir === 'asc' ? 'desc' : 'asc');
  else { sortBy = key; sortDir = (key==='date' || key==='kg' || key==='serialNo') ? 'desc' : 'asc'; }
  render();
});

// Form submit
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = {
    id: editingId ?? Date.now(),
    serialNo: serialEl.value.trim(),
    machineNo: machineEl.value.trim(),
    date: dateEl.value,
    taraNo: taraEl.value.trim(),
    size: sizeEl.value.trim(),
    kg: toNumber(kgEl.value),
    operator: operatorEl.value.trim(),
    workshop: workshopEl.value.trim(),
  };
  // basic validation
  if (!data.serialNo || !data.machineNo || !data.date || !data.taraNo || !data.size || !data.operator || !data.workshop){
    alert('Илтимос, барча майдонларни тўлдиринг.');
    return;
  }
  if (data.kg <= 0){ alert('Кг 0 дан катта бўлиши керак.'); return; }

  if (editingId){
    const i = entries.findIndex(e=>e.id===editingId);
    if (i>=0) entries[i] = data;
    editingId = null;
    saveBtn.textContent = 'Қўшиш';
  } else {
    entries.push(data);
    serialEl.value = nextSerial();
  }
  save();
  render();
  form.reset();
  dateEl.value = dateEl.value || new Date().toISOString().slice(0,10);
  serialEl.value = nextSerial();
});

resetBtn.addEventListener('click', ()=>{
  form.reset();
  editingId = null;
  saveBtn.textContent = 'Қўшиш';
  dateEl.value = new Date().toISOString().slice(0,10);
  serialEl.value = nextSerial();
});

// Export CSV
exportBtn.addEventListener('click', ()=>{
  if (!entries.length){ alert('Экспорт қилиш учун ёзувлар йўқ.'); return; }
  const headers = ['tartib_raqam','dastgoh','sana','tara','olcham','kg','operator','cex'];
  const rows = entries.map(e=>[e.serialNo,e.machineNo,e.date,e.taraNo,e.size,fmtKg(e.kg),e.operator,e.workshop]);
  const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'screw_logs.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Render
function render(){
  let data = [...entries];

  // search filter
  if (query){
    data = data.filter(e=>{
      const s = `${e.serialNo} ${e.machineNo} ${e.date} ${e.taraNo} ${e.size} ${e.operator} ${e.workshop}`.toLowerCase();
      return s.includes(query);
    });
  }

  // sorting
  data.sort((a,b)=>{
    const dir = (sortDir==='asc'?1:-1);
    const ka = a[sortBy], kb = b[sortBy];
    if (sortBy==='kg' || sortBy==='serialNo'){
      return (toNumber(ka) - toNumber(kb)) * dir;
    }
    if (sortBy==='date'){
      return (new Date(ka) - new Date(kb)) * dir;
    }
    return String(ka).localeCompare(String(kb), 'uz') * dir;
  });

  // table body
  tableBody.innerHTML = '';
  for (const e of data){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.serialNo}</td>
      <td>${e.machineNo}</td>
      <td>${e.date}</td>
      <td>${e.taraNo}</td>
      <td>${e.size}</td>
      <td class="num">${fmtKg(e.kg)}</td>
      <td>${e.operator}</td>
      <td>${e.workshop}</td>
      <td class="actions">
        <button class="mini" data-act="edit">✏️</button>
        <button class="mini danger" data-act="del">🗑️</button>
      </td>
    `;
    // actions
    tr.querySelector('[data-act="edit"]').addEventListener('click', ()=>startEdit(e.id));
    tr.querySelector('[data-act="del"]').addEventListener('click', ()=>{
      if (confirm('Ўчирилсинми?')){
        entries = entries.filter(x=>x.id!==e.id);
        save(); render();
      }
    });
    tableBody.appendChild(tr);
  }

  // header sort indicators
  tableHead.querySelectorAll('th[data-sort]').forEach(th=>{
    th.querySelector('.sort-ind')?.remove();
    if (th.dataset.sort===sortBy){
      const span = document.createElement('span');
      span.className = 'sort-ind';
      span.textContent = sortDir==='asc' ? '▲' : '▼';
      th.appendChild(span);
    }
  });

  // totals
  const sum = data.reduce((s,e)=>s+toNumber(e.kg),0);
  sumKgEl.textContent = fmtKg(sum);
  totalKgEl.textContent = fmtKg(entries.reduce((s,e)=>s+toNumber(e.kg),0));
  totalCountEl.textContent = String(entries.length);
}

// Start edit
function startEdit(id){
  const e = entries.find(x=>x.id===id); if (!e) return;
  editingId = id;
  saveBtn.textContent = 'Сақлаш';
  serialEl.value = e.serialNo;
  machineEl.value = e.machineNo;
  dateEl.value = e.date;
  taraEl.value = e.taraNo;
  sizeEl.value = e.size;
  kgEl.value = e.kg;
  operatorEl.value = e.operator;
  workshopEl.value = e.workshop;
  serialEl.focus();
}

// initial render
render();
