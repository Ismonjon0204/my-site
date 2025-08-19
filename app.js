/* =========================
   1) Doimiylar va yordamchilar
   ========================= */
const K_DB   = 'plant_db_v1';
const K_ENT  = 'plant_entries_v1';
const K_UI   = 'plant_ui_v1';
const K_NEXT = 'plant_nextindex_v1';

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const today = () => new Date().toISOString().slice(0,10);
const fmt = n => (Math.round((+n || 0) * 100) / 100).toFixed(2);

// JSON load/save
function load(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)) }

// Debounce util
function debounce(fn, ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms) } }

/* =========================
   2) Holat (State)
   ========================= */
let DB = load(K_DB, {
  productTypes: [{ id: 't1', name: 'Бетон шуруп', sizes: ['7.5x72','7.5x92','7.5x112'] }],
  machines: ['DG-12','DG-05','DG-01'],
  workshops: ['Ц-1','Ц-2']
});
let ENTRIES = load(K_ENT, []);
let UI = load(K_UI, { dark:false, sort:{key:'date',dir:'desc'}, page:1 });
let NEXT = load(K_NEXT, 1);

/* =========================
   3) Elementlar
   ========================= */
// Kontekst & forma
const fDate=$('#fDate'), fShift=$('#fShift'), fWorkshop=$('#fWorkshop'), fIndex=$('#fIndex');
const fType=$('#fType'), fSize=$('#fSize'), fMachine=$('#fMachine'), fTare=$('#fTare'), fKg=$('#fKg'), fNote=$('#fNote');
const btnSave=$('#btnSave'), btnClear=$('#btnClear'), editBadge=$('#editBadge');

// Filtrlash
const flFrom=$('#flFrom'), flTo=$('#flTo'), flShift=$('#flShift'), flWorkshop=$('#flWorkshop'),
      flType=$('#flType'), flSize=$('#flSize'), flMachine=$('#flMachine'), flSearch=$('#flSearch');
const btnExport=$('#btnExport'), btnResetFilters=$('#btnResetFilters');

// KPI & Jadval
const kpiCount=$('#kpiCount'), kpiKg=$('#kpiKg'), chipsByType=$('#chipsByType'), tfootKg=$('#tfootKg');
const tblBody = $('#tbl tbody');

// Theme & nav
const themeToggle = $('#themeToggle');
const navButtons = $$('.navlink');
const pages = {
  input: $('#page-input'),
  reports: $('#page-reports'),
  archives: $('#page-archives')
};

// Masters
const wInp=$('#wInp'), wAdd=$('#wAdd'), wList=$('#wList');
const mInp=$('#mInp'), mAdd=$('#mAdd'), mList=$('#mList');
const tInp=$('#tInp'), tAdd=$('#tAdd'), tSel=$('#tSel'), sInp=$('#sInp'), sAdd=$('#sAdd'), sList=$('#sList');

/* =========================
   4) Tema (kun/tun)
   ========================= */
function applyTheme(){
  document.body.classList.toggle('dark', !!UI.dark);
  themeToggle.textContent = UI.dark ? '☀️' : '🌙';
}
themeToggle.onclick = ()=>{ UI.dark = !UI.dark; save(K_UI, UI); applyTheme(); };

/* =========================
   5) Selectlarni to‘ldirish
   ========================= */
function fillWorkshops(){
  fWorkshop.innerHTML = DB.workshops.map(w=>`<option value="${w}">${w}</option>`).join('');
  flWorkshop.innerHTML = `<option value="">Барчаси</option>` + DB.workshops.map(w=>`<option value="${w}">${w}</option>`).join('');
}
function fillMachines(){
  fMachine.innerHTML = DB.machines.map(m=>`<option value="${m}">${m}</option>`).join('');
  flMachine.innerHTML = `<option value="">Барчасi</option>` + DB.machines.map(m=>`<option value="${m}">${m}</option>`).join('');
}
function fillTypes(){
  const opts = DB.productTypes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  fType.innerHTML = opts;
  flType.innerHTML = `<option value="">Барчаси</option>${opts}`;
  tSel.innerHTML = DB.productTypes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  updateSizesFromType();
}
function updateSizesFromType(){
  const id = fType.value || (DB.productTypes[0] && DB.productTypes[0].id);
  const t = DB.productTypes.find(x=>x.id===id);
  fSize.innerHTML = (t?.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
}
fType.onchange = updateSizesFromType;

/* =========================
   6) Masters render/aksiya
   ========================= */
function renderMasters(){
  // Workshops
  wList.innerHTML = DB.workshops.map(w=>`<li>${w} <button data-w="${w}">×</button></li>`).join('');
  wList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    DB.workshops = DB.workshops.filter(x=>x!==b.dataset.w);
    saveDebounced(K_DB, DB); fillWorkshops(); renderMasters(); renderAll();
  });

  // Machines
  mList.innerHTML = DB.machines.map(m=>`<li>${m} <button data-m="${m}">×</button></li>`).join('');
  mList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    DB.machines = DB.machines.filter(x=>x!==b.dataset.m);
    saveDebounced(K_DB, DB); fillMachines(); renderMasters(); renderAll();
  });

  // Types + sizes
  const t = DB.productTypes.find(x=>x.id===tSel.value) || DB.productTypes[0];
  if (t) tSel.value = t.id;
  sList.innerHTML = (t?.sizes||[]).map(s=>`<li>${s} <button data-s="${s}">×</button></li>`).join('');
  sList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const tt = DB.productTypes.find(x=>x.id===tSel.value); if(!tt) return;
    tt.sizes = tt.sizes.filter(x=>x!==b.dataset.s); saveDebounced(K_DB, DB);
    fillTypes(); renderMasters(); renderAll();
  });
}
wAdd.onclick=()=>{ const v=wInp.value.trim(); if(!v||DB.workshops.includes(v)) return; DB.workshops.push(v); wInp.value=''; saveDebounced(K_DB,DB); fillWorkshops(); renderMasters(); renderAll(); };
mAdd.onclick=()=>{ const v=mInp.value.trim(); if(!v||DB.machines.includes(v)) return; DB.machines.push(v); mInp.value=''; saveDebounced(K_DB,DB); fillMachines(); renderMasters(); renderAll(); };
tAdd.onclick=()=>{ const v=tInp.value.trim(); if(!v) return; const id='t'+Math.random().toString(36).slice(2,8); DB.productTypes.push({id,name:v,sizes:[]}); tInp.value=''; saveDebounced(K_DB,DB); fillTypes(); renderMasters(); renderAll(); };
tSel.onchange=renderMasters;
sAdd.onclick=()=>{ const v=sInp.value.trim(); const t=DB.productTypes.find(x=>x.id===tSel.value); if(!t||!v || t.sizes.includes(v)) return; t.sizes.push(v); sInp.value=''; saveDebounced(K_DB,DB); fillTypes(); renderMasters(); renderAll(); };

/* =========================
   7) Forma holati
   ========================= */
let editingId = null;
function resetForm(){
  editingId = null;
  editBadge.hidden = true;
  fDate.value = today();
  fShift.value = '1';
  fWorkshop.value = DB.workshops[0] || '';
  fIndex.value = NEXT;
  fType.value = DB.productTypes[0]?.id || '';
  updateSizesFromType();
  fTare.value = '';
  fKg.value = '';
  fNote.value = '';
  fMachine.value = DB.machines[0] || '';
  btnSave.textContent = 'Қўшиш';
}
btnClear.onclick = resetForm;

/* =========================
   8) Saqlash (debounce bilan)
   ========================= */
const saveDebounced = debounce((k,v)=>save(k,v), 250);

btnSave.onclick = ()=>{
  // Dastgoh tekshiruv
  if(!DB.machines.includes(fMachine.value)){ alert('Дастгоҳ базадан танланиши керак!'); return; }
  if(!fDate.value || !fWorkshop.value || !fType.value || !fSize.value || !fKg.value){ alert('Қатор майдонлар тўлдирилмаган.'); return; }

  const entry = {
    id: editingId ?? ('e'+Math.random().toString(36).slice(2,10)),
    index: editingId ? +fIndex.value : NEXT,
    date: fDate.value,
    shift: +fShift.value,
    workshop: fWorkshop.value,
    typeId: fType.value,
    typeName: DB.productTypes.find(t=>t.id===fType.value)?.name ?? '',
    size: fSize.value,
    tare: (fTare.value||'').trim(),
    kg: +fKg.value,
    machine: fMachine.value,
    note: (fNote.value||'').trim()
  };

  if(editingId){
    ENTRIES = ENTRIES.map(e=>e.id===editingId ? entry : e);
  }else{
    ENTRIES.push(entry);
    NEXT++; saveDebounced(K_NEXT, NEXT);
  }
  saveDebounced(K_ENT, ENTRIES);
  resetForm(); renderAll(true);
};

function startEdit(id){
  const e = ENTRIES.find(x=>x.id===id); if(!e) return;
  editingId = id; editBadge.hidden=false; btnSave.textContent='Сақлаш';
  fDate.value = e.date; fShift.value = e.shift; fWorkshop.value = e.workshop;
  fIndex.value = e.index; fType.value = e.typeId; updateSizesFromType(); fSize.value = e.size;
  fTare.value = e.tare; fKg.value = e.kg; fMachine.value = e.machine; fNote.value = e.note;
  window.scrollTo({top:0, behavior:'smooth'});
}
function removeEntry(id){
  if(!confirm('Ўчирilsinmi?')) return;
  ENTRIES = ENTRIES.filter(e=>e.id!==id);
  saveDebounced(K_ENT, ENTRIES);
  renderAll(true);
}

/* =========================
   9) Filtrlash (debounce)
   ========================= */
function getFilters(){
  return {
    from: flFrom.value || null,
    to: flTo.value || null,
    shift: flShift.value || '',
    workshop: flWorkshop.value || '',
    typeId: flType.value || '',
    size: flSize.value || '',
    machine: flMachine.value || '',
    q: (flSearch.value||'').trim().toLowerCase()
  };
}
function applyFilters(rows, f){
  return rows.filter(e=>{
    if(f.from && e.date < f.from) return false;
    if(f.to && e.date > f.to) return false;
    if(f.shift && String(e.shift)!==f.shift) return false;
    if(f.workshop && e.workshop!==f.workshop) return false;
    if(f.typeId && e.typeId!==f.typeId) return false;
    if(f.size && e.size!==f.size) return false;
    if(f.machine && e.machine!==f.machine) return false;
    if(f.q){
      const blob = `${e.index} ${e.tare} ${e.note}`.toLowerCase();
      if(!blob.includes(f.q)) return false;
    }
    return true;
  });
}
btnResetFilters.onclick = ()=>{
  flFrom.value=''; flTo.value=''; flShift.value=''; flWorkshop.value='';
  flType.value=''; flSize.innerHTML='<option value="">Барчаси</option>';
  flMachine.value=''; flSearch.value='';
  UI.page = 1; save(K_UI, UI); renderAll(true);
};
flType.onchange = ()=>{
  const t = DB.productTypes.find(x=>x.id===flType.value);
  flSize.innerHTML = `<option value="">Барчаси</option>` + (t?.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
  UI.page = 1; renderAll(true);
};
// debounce qilingan inputlar
[flFrom,flTo,flShift,flWorkshop,flSize,flMachine,flSearch].forEach(el=>{
  el.oninput = debounce(()=>{ UI.page=1; renderAll(true); }, 150);
});

/* =========================
   10) Sort + Paginatsiya
   ========================= */
const PAGE_SIZE = 200;
function sortRows(rows){
  const {key, dir} = UI.sort;
  const s = [...rows].sort((a,b)=>{
    let va = a[key], vb = b[key];
    if(key==='kg' || key==='shift' || key==='index') return (Number(va)-Number(vb))*(dir==='asc'?1:-1);
    va = (va??'').toString(); vb = (vb??'').toString();
    return va.localeCompare(vb) * (dir==='asc'?1:-1);
  });
  return s;
}
$('#tbl thead').onclick = (ev)=>{
  const th = ev.target.closest('th'); if(!th || !th.dataset.sort) return;
  const k = th.dataset.sort;
  if(UI.sort.key===k) UI.sort.dir = UI.sort.dir==='asc' ? 'desc':'asc';
  else UI.sort = {key:k, dir:'asc'};
  UI.page = 1;
  save(K_UI, UI);
  renderAll(true);
};

/* =========================
   11) CSV eksport
   ========================= */
btnExport.onclick = ()=>{
  const f = getFilters();
  const rows = sortRows(applyFilters(ENTRIES, f));
  const head = ['Т/р','Сана','Смена','Цех','Тур','Ўлчам','Тара','Кг','Дастгоҳ','Изоҳ'];
  const sep = ';';
  const lines = [head.join(sep)].concat(rows.map(e=>[
    e.index, e.date, e.shift, e.workshop,
    `"${e.typeName}"`, `"${e.size}"`, `"${e.tare}"`,
    String(e.kg).replace('.', ','), `"${e.machine}"`, `"${e.note||''}"`
  ].join(sep)));
  const BOM = '\ufeff';
  const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'plant-entries.csv'; a.click();
  URL.revokeObjectURL(a.href);
};

/* =========================
   12) RenderAll (KPI + jadval + pager + chips)
   ========================= */
let lastKey = ''; // filtr/sort kesh kaliti

function buildKey(){
  const f = getFilters();
  return JSON.stringify({f, s:UI.sort});
}

function renderAll(force=false){
  // KPI va jadval uchun tayyorlanish
  const key = buildKey();
  const need = force || key !== lastKey;

  const f = getFilters();
  const filtered = sortRows(applyFilters(ENTRIES, f));
  const totalKg = filtered.reduce((s,e)=>s+e.kg,0);

  // KPI
  kpiCount.textContent = filtered.length;
  kpiKg.textContent = fmt(totalKg);
  tfootKg.textContent = fmt(totalKg);

  // Chips (tur -> kg)
  const byType = {};
  filtered.forEach(e=>{ byType[e.typeName] = (byType[e.typeName]||0)+e.kg; });
  chipsByType.innerHTML = Object.entries(byType).map(([k,v])=>`<span class="chip">${k}: <b>${fmt(v)}</b> кг</span>`).join('');

  // Jadval + Paginatsiya
  const pagesCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if(UI.page > pagesCount) UI.page = pagesCount;

  const start = (UI.page-1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  // Jadvalni chizish
  tblBody.innerHTML = slice.map(e=>`
    <tr>
      <td>${e.index}</td>
      <td>${e.date}</td>
      <td>${e.shift}</td>
      <td>${e.workshop}</td>
      <td>${e.typeName}</td>
      <td>${e.size}</td>
      <td>${e.tare}</td>
      <td>${fmt(e.kg)}</td>
      <td>${e.machine}</td>
      <td>${e.note||''}</td>
      <td>
        <button class="ghost" data-edit="${e.id}" title="Таҳрир">✏️</button>
        <button class="ghost" data-del="${e.id}" title="Ўчириш">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Edit/Delete delegatsiya
  tblBody.querySelectorAll('[data-edit]').forEach(b=> b.onclick=()=> startEdit(b.dataset.edit));
  tblBody.querySelectorAll('[data-del]').forEach(b=> b.onclick=()=> removeEntry(b.dataset.del));

  // Paginatsiya UI (agar bo‘lmasa yaratamiz)
  let pager = document.getElementById('pager');
  if(!pager){
    pager = document.createElement('div');
    pager.id = 'pager';
    pager.className = 'row-center muted';
    $('#tbl').after(pager);
  }
  pager.innerHTML = `
    <button class="ghost" ${UI.page<=1?'disabled':''} id="pgPrev">⟨</button>
    <span> ${UI.page} / ${pagesCount} </span>
    <button class="ghost" ${UI.page>=pagesCount?'disabled':''} id="pgNext">⟩</button>
  `;
  const prev = $('#pgPrev'), next = $('#pgNext');
  if(prev) prev.onclick = ()=>{ if(UI.page>1){ UI.page--; save(K_UI,UI); renderAll(true); } };
  if(next) next.onclick = ()=>{ if(UI.page<pagesCount){ UI.page++; save(K_UI,UI); renderAll(true); } };

  if(need) lastKey = key;
}

/* =========================
   13) Navigatsiya (sidebar)
   ========================= */
function showPage(name){
  pages.input.hidden = name!=='input';
  pages.reports.hidden = name!=='reports';
  pages.archives.hidden = name!=='archives';
  navButtons.forEach(b=> b.classList.toggle('active', b.dataset.page===`page-${name}`));
}
navButtons.forEach(b=>{
  b.onclick = ()=>{ const page = b.dataset.page.replace('page-',''); showPage(page); };
});

/* =========================
   14) Init
   ========================= */
function init(){
  fDate.value = today();
  fillWorkshops(); fillMachines(); fillTypes(); renderMasters();
  flFrom.value=''; flTo.value='';
  fIndex.value = NEXT;

  applyTheme();
  resetForm();
  renderAll(true);

  // Filtr: tur o'zgarganda o'lchamni yangilash
  flType.dispatchEvent(new Event('change'));

  // Birinchi sahifa – Kiritish
  showPage('input');
}
init();
