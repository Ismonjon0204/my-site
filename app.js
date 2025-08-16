/* =========================================================
   Zavod — ishlab chiqarish jurnal (Pro) • app.js (yagona fayl)
   ========================================================= */

/* ---------- Storage keys ---------- */
const K_DB   = 'plant_db_v1';
const K_ENT  = 'plant_entries_v1';
const K_ARC  = 'plant_archives_v1';
const K_UI   = 'plant_ui_v1';
const K_NEXT = 'plant_nextindex_v1';

/* ---------- Helpers ---------- */
const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const today = () => new Date().toISOString().slice(0,10);
const fmt   = n => (Math.round((+n || 0)*100)/100).toFixed(2);
function load(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch{ return d } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)) }

/* ---------- State ---------- */
let DB   = load(K_DB, {
  productTypes: [{id:'t1', name:'Бетон шуруп', sizes:['7.5x72','7.5x92','7.5x112']}],
  machines: ['DG-12','DG-05','DG-01'],
  workshops: ['Ц-1','Ц-2']
});
let ENTRIES  = load(K_ENT, []);
let ARCHIVES = load(K_ARC, []);
let UI       = load(K_UI, { dark:false, sort:{key:'date',dir:'desc'}, activePage:'page-input' });
let NEXT     = load(K_NEXT, 1);

/* ---------- UI refs ---------- */
// Smena konteksti
const fDate = $('#fDate'), fShift=$('#fShift'), fWorkshop=$('#fWorkshop'), fIndex=$('#fIndex');
const masterInp = $('#master');                   // ixtiyoriy
const operatorSel = $('#operator');               // ixtiyoriy (select)

// Entry form
const fType=$('#fType'), fSize=$('#fSize'), fMachine=$('#fMachine'), fTare=$('#fTare'), fKg=$('#fKg'), fNote=$('#fNote');
const btnSave=$('#btnSave'), btnClear=$('#btnClear'), editBadge=$('#editBadge');

// KPIs
const kpiCount=$('#kpiCount'), kpiKg=$('#kpiKg'), chipsByType=$('#chipsByType'), tfootKg=$('#tfootKg');

// Filters
const flFrom=$('#flFrom'), flTo=$('#flTo'), flShift=$('#flShift'), flWorkshop=$('#flWorkshop'), flType=$('#flType'), flSize=$('#flSize'), flMachine=$('#flMachine'), flSearch=$('#flSearch');
const btnExport=$('#btnExport'), btnResetFilters=$('#btnResetFilters');

// Theme
const themeToggle = $('#themeToggle');

// Masters
const wInp=$('#wInp'), wAdd=$('#wAdd'), wList=$('#wList');
const mInp=$('#mInp'), mAdd=$('#mAdd'), mList=$('#mList');
const tInp=$('#tInp'), tAdd=$('#tAdd'), tSel=$('#tSel'); const sInp=$('#sInp'), sAdd=$('#sAdd'), sList=$('#sList');

// Reports
const rFrom = $('#rFrom'), rTo = $('#rTo'), rShift = $('#rShift'), rWorkshop = $('#rWorkshop');
const reportArea = $('#reportArea');

// Archives
const archiveBtn = $('#archiveBtn');
const archGridBody = $('#archGrid tbody');

/* ---------- Theme ---------- */
function applyTheme(){
  document.body.classList.toggle('dark', !!UI.dark);
  if (themeToggle) themeToggle.textContent = UI.dark ? '☀️' : '🌙';
}
themeToggle && (themeToggle.onclick = () => { UI.dark=!UI.dark; save(K_UI,UI); applyTheme(); });

/* ---------- Page nav (sidebar) ---------- */
const PAGES = ['page-input','page-reports','page-archives'];
function showPage(id){
  PAGES.forEach(pid=>{
    const el = document.getElementById(pid);
    if (!el) return;
    if (pid===id) el.removeAttribute('hidden');
    else el.setAttribute('hidden','');
  });
  $$('.navlink').forEach(b=> b.classList.toggle('active', b.dataset.page===id));
  UI.activePage = id; save(K_UI,UI);
}
$$('.navlink').forEach(btn => btn.addEventListener('click', ()=> showPage(btn.dataset.page)));

/* ---------- Populate selects ---------- */
function fillWorkshops(){
  if (fWorkshop)   fWorkshop.innerHTML   = DB.workshops.map(w=>`<option value="${w}">${w}</option>`).join('');
  if (flWorkshop)  flWorkshop.innerHTML  = `<option value="">Барчаси</option>` + DB.workshops.map(w=>`<option value="${w}">${w}</option>`).join('');
  if (rWorkshop)   rWorkshop.innerHTML   = `<option value="">Hammasi</option>` + DB.workshops.map(w=>`<option value="${w}">${w}</option>`).join('');
}
function fillMachines(){
  if (fMachine)     fMachine.innerHTML    = DB.machines.map(m=>`<option value="${m}">${m}</option>`).join('');
  if (flMachine)    flMachine.innerHTML   = `<option value="">Барчаси</option>` + DB.machines.map(m=>`<option value="${m}">${m}</option>`).join('');
}
function fillTypes(){
  const opts = DB.productTypes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  if (fType)        fType.innerHTML       = opts;
  if (flType)       flType.innerHTML      = `<option value="">Барчасi</option>${opts}`;
  if (tSel)         tSel.innerHTML        = DB.productTypes.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  updateSizesFromType();
}
function updateSizesFromType(){
  if (!fSize) return;
  const id = (fType && fType.value) || (DB.productTypes[0] && DB.productTypes[0].id);
  const t = DB.productTypes.find(x=>x.id===id);
  fSize.innerHTML = (t?.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
}
fType && (fType.onchange = updateSizesFromType);

/* ---------- Masters render ---------- */
function renderMasters(){
  if (wList){
    wList.innerHTML = DB.workshops.map(w=>`<li>${w} <button data-w="${w}">×</button></li>`).join('');
    wList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      DB.workshops = DB.workshops.filter(x=>x!==b.dataset.w);
      save(K_DB,DB); fillWorkshops(); renderMasters(); render();
    });
  }
  if (mList){
    mList.innerHTML = DB.machines.map(m=>`<li>${m} <button data-m="${m}">×</button></li>`).join('');
    mList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      DB.machines = DB.machines.filter(x=>x!==b.dataset.m);
      save(K_DB,DB); fillMachines(); renderMasters(); render();
    });
  }
  if (tSel){
    const t = DB.productTypes.find(x=>x.id===tSel.value) || DB.productTypes[0];
    if (t) tSel.value = t.id;
    if (sList){
      sList.innerHTML = (t?.sizes||[]).map(s=>`<li>${s} <button data-s="${s}">×</button></li>`).join('');
      sList.querySelectorAll('button').forEach(b=>b.onclick=()=>{
        const tt = DB.productTypes.find(x=>x.id===tSel.value); if(!tt) return;
        tt.sizes = tt.sizes.filter(x=>x!==b.dataset.s);
        save(K_DB,DB); fillTypes(); renderMasters(); render();
      });
    }
  }
}
wAdd && (wAdd.onclick=()=>{ const v=wInp.value.trim(); if(!v||DB.workshops.includes(v)) return; DB.workshops.push(v); save(K_DB,DB); wInp.value=''; fillWorkshops(); renderMasters(); });
mAdd && (mAdd.onclick=()=>{ const v=mInp.value.trim(); if(!v||DB.machines.includes(v)) return; DB.machines.push(v); save(K_DB,DB); mInp.value=''; fillMachines(); renderMasters(); });
tAdd && (tAdd.onclick=()=>{ const v=tInp.value.trim(); if(!v) return; const id='t'+Math.random().toString(36).slice(2,8); DB.productTypes.push({id,name:v,sizes:[]}); save(K_DB,DB); tInp.value=''; fillTypes(); renderMasters(); });
tSel && (tSel.onchange=renderMasters);
sAdd && (sAdd.onclick=()=>{ const v=sInp.value.trim(); const t=DB.productTypes.find(x=>x.id===tSel.value); if(!t||!v||t.sizes.includes(v)) return; t.sizes.push(v); save(K_DB,DB); sInp.value=''; fillTypes(); renderMasters(); });

/* ---------- Form state ---------- */
let editingId = null;
function resetForm(){
  editingId = null;
  if (editBadge) editBadge.hidden = true;
  if (fDate)     fDate.value = today();
  if (fShift)    fShift.value = '1';
  if (fWorkshop) fWorkshop.value = DB.workshops[0] || '';
  if (fIndex)    fIndex.value = NEXT;
  if (fType)     fType.value = DB.productTypes[0]?.id || '';
  updateSizesFromType();
  if (fTare)     fTare.value = '';
  if (fKg)       fKg.value   = '';
  if (fNote)     fNote.value = '';
  if (fMachine)  fMachine.value = DB.machines[0] || '';
  if (masterInp) masterInp.value = '';
  if (operatorSel) operatorSel.value = '';
  if (btnSave)   btnSave.textContent = 'Қўшиш';
}
btnClear && (btnClear.onclick = resetForm);

/* ---------- Save entry ---------- */
btnSave && (btnSave.onclick = ()=>{
  const machineOk = !fMachine || DB.machines.includes(fMachine.value);
  if(!machineOk){ alert('Дастгоҳ базадан танланиши керак!'); return; }
  if(!(fDate && fDate.value) || !(fWorkshop && fWorkshop.value) || !(fType && fType.value) || !(fSize && fSize.value) || !(fKg && fKg.value)){
    alert('Қатор майдонлар тўлдирилмаган.'); return;
  }
  const entry = {
    id: editingId ?? ('e'+Math.random().toString(36).slice(2,10)),
    index: editingId ? +(fIndex?.value||NEXT) : NEXT,
    date: fDate.value,
    shift: +(fShift?.value||1),
    workshop: fWorkshop.value,
    typeId: fType.value,
    typeName: DB.productTypes.find(t=>t.id===fType.value)?.name ?? '',
    size: fSize.value,
    tare: (fTare?.value||'').trim(),
    kg: +(fKg?.value||0),
    machine: fMachine?.value || '',
    note: (fNote?.value||'').trim(),
    master: (masterInp?.value||'').trim(),
    operator: operatorSel?.value || ''
  };
  if (editingId) ENTRIES = ENTRIES.map(e=>e.id===editingId ? entry : e);
  else { ENTRIES.push(entry); NEXT++; save(K_NEXT,NEXT); }
  save(K_ENT, ENTRIES);
  resetForm(); render();
});

/* ---------- Edit / Delete ---------- */
function startEdit(id){
  const e = ENTRIES.find(x=>x.id===id); if(!e) return;
  editingId = id; if (editBadge) editBadge.hidden=false; if (btnSave) btnSave.textContent='Сақлаш';
  if (fDate) fDate.value = e.date; if (fShift) fShift.value = e.shift; if (fWorkshop) fWorkshop.value = e.workshop;
  if (fIndex) fIndex.value = e.index; if (fType) fType.value = e.typeId; updateSizesFromType(); if (fSize) fSize.value = e.size;
  if (fTare) fTare.value = e.tare; if (fKg) fKg.value = e.kg; if (fMachine) fMachine.value = e.machine; if (fNote) fNote.value = e.note;
  if (masterInp) masterInp.value = e.master || '';
  if (operatorSel) operatorSel.value = e.operator || '';
  window.scrollTo({top:0, behavior:'smooth'});
}
function removeEntry(id){
  if(!confirm('Ўчирilsinmi?')) return;
  ENTRIES = ENTRIES.filter(e=>e.id!==id);
  save(K_ENT,ENTRIES);
  render();
}

/* ---------- Filters ---------- */
function getFilters(){
  return {
    from: flFrom?.value || null,
    to: flTo?.value || null,
    shift: flShift?.value || '',
    workshop: flWorkshop?.value || '',
    typeId: flType?.value || '',
    size: flSize?.value || '',
    machine: flMachine?.value || '',
    q: (flSearch?.value||'').trim().toLowerCase()
  };
}
function applyFilters(rows){
  const f = getFilters();
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
btnResetFilters && (btnResetFilters.onclick=()=>{
  if (flFrom) flFrom.value=''; if (flTo) flTo.value=''; if (flShift) flShift.value='';
  if (flWorkshop) flWorkshop.value=''; if (flType) flType.value='';
  if (flSize) flSize.innerHTML='<option value="">Барчаси</option>';
  if (flMachine) flMachine.value=''; if (flSearch) flSearch.value='';
  render();
});
flType && (flType.onchange=()=>{
  const t = DB.productTypes.find(x=>x.id===flType.value);
  if (flSize) flSize.innerHTML = `<option value="">Барчаси</option>` + (t?.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join('');
  render();
});
[flFrom,flTo,flShift,flWorkshop,flSize,flMachine,flSearch].forEach(el=> el && (el.oninput=render));

/* ---------- Export CSV ---------- */
btnExport && (btnExport.onclick = ()=> exportCSV(sortRows(applyFilters(ENTRIES))));
function exportCSV(rows){
  const head = ['Т/р','Сана','Смена','Цех','Тур','Ўлчам','Тара','Кг','Дастгоҳ','Оператор','Изоҳ'];
  const sep = ';';
  const lines = [head.join(sep)].concat(
    rows.map(e => [
      e.index,
      e.date,
      e.shift,
      e.workshop,
      `"${e.typeName}"`,
      `"${e.size}"`,
      `"${e.tare}"`,
      String(e.kg).replace('.', ','),
      `"${e.machine}"`,
      `"${e.operator||''}"`,
      `"${e.note||''}"`
    ].join(sep))
  );
  const BOM = '\ufeff';
  const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'plant-entries.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Sort ---------- */
$('#tbl thead') && ($('#tbl thead').onclick = (ev)=>{
  const th = ev.target.closest('th'); if(!th || !th.dataset.sort) return;
  const k = th.dataset.sort;
  if(UI.sort.key===k) UI.sort.dir = UI.sort.dir==='asc'?'desc':'asc';
  else UI.sort = {key:k, dir:'asc'};
  save(K_UI, UI); render();
});
function sortRows(rows){
  const {key, dir} = UI.sort;
  const s = [...rows].sort((a,b)=>{
    const va = (a[key]??'').toString(), vb = (b[key]??'').toString();
    if(key==='kg' || key==='shift' || key==='index') return (Number(va)-Number(vb))*(dir==='asc'?1:-1);
    return va.localeCompare(vb) * (dir==='asc'?1:-1);
  });
  return s;
}

/* ---------- Render (main list) ---------- */
function render(){
  const rows = sortRows(applyFilters(ENTRIES));

  if (kpiCount) kpiCount.textContent = rows.length;
  if (kpiKg){
    const sumKg = rows.reduce((s,e)=>s+e.kg,0);
    kpiKg.textContent = fmt(sumKg);
  }
  if (tfootKg) tfootKg.textContent = kpiKg ? kpiKg.textContent : '0.00';

  if (chipsByType){
    const byType = {};
    rows.forEach(e=>{ byType[e.typeName] = (byType[e.typeName]||0)+e.kg; });
    chipsByType.innerHTML = Object.entries(byType).map(([k,v])=>`<span class="chip">${k}: <b>${fmt(v)}</b> кг</span>`).join('');
  }

  const tb = $('#tbl tbody');
  if (tb){
    tb.innerHTML = rows.map(e=>`
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
    tb.querySelectorAll('[data-edit]').forEach(b=> b.onclick=()=> startEdit(b.dataset.edit));
    tb.querySelectorAll('[data-del]').forEach(b=> b.onclick=()=> removeEntry(b.dataset.del));
  }
}

/* ---------- Archives (smena yakunlash) ---------- */
if (archiveBtn){
  archiveBtn.onclick = () => {
    const cur = {
      date: fDate?.value || today(),
      shift: +(fShift?.value||1),
      workshop: fWorkshop?.value || '',
      master: (masterInp?.value||'').trim()
    };
    const grp = ENTRIES.filter(e => e.date===cur.date && e.shift===cur.shift && e.workshop===cur.workshop);
    if (!grp.length) { alert('Bu smena uchun yozuv topilmadi.'); return; }

    const kg = grp.reduce((s,e)=>s+e.kg,0);
    const item = {
      id: 'a'+Math.random().toString(36).slice(2,10),
      ...cur,
      count: grp.length,
      kg: +kg.toFixed(2),
      createdAt: new Date().toISOString(),
      entries: grp
    };

    ARCHIVES.push(item);
    save(K_ARC, ARCHIVES);

    ENTRIES = ENTRIES.filter(e => !(e.date===cur.date && e.shift===cur.shift && e.workshop===cur.workshop));
    save(K_ENT, ENTRIES);

    render();
    renderArchives();
    alert('Smena arxivlandi ✅');
  };
}
function renderArchives(){
  if (!archGridBody) return;
  archGridBody.innerHTML = ARCHIVES.map(a => `
    <tr>
      <td>${a.id}</td>
      <td>${a.date}</td>
      <td>${a.shift}</td>
      <td>${a.workshop}</td>
      <td>${a.master||''}</td>
      <td>${a.count}</td>
      <td>${fmt(a.kg)}</td>
      <td><button class="ghost" data-view="${a.id}">Ko'rish</button></td>
    </tr>
  `).join('');
  archGridBody.querySelectorAll('[data-view]').forEach(b=>{
    b.onclick = () => {
      const a = ARCHIVES.find(x=>x.id===b.dataset.view);
      if (!a) return;
      const msg = a.entries.map(e=>`${e.index}) ${e.date} sm:${e.shift} ${e.workshop} ${e.typeName} ${e.size} ${e.kg}kg`).join('\n');
      alert(`Arxiv: ${a.date} / smena ${a.shift} / ${a.workshop}\n${a.master?('master: '+a.master+'\n'):''}Yozuvlar:\n\n${msg}`);
    };
  });
}

/* ---------- Reports ---------- */
function getReportRows(){
  const from = rFrom?.value || null;
  const to   = rTo?.value   || null;
  const shift = rShift?.value || '';
  const ws   = rWorkshop?.value || '';
  return ENTRIES.filter(e=>{
    if (from && e.date < from) return false;
    if (to   && e.date > to)   return false;
    if (shift && String(e.shift)!==shift) return false;
    if (ws && e.workshop!==ws) return false;
    return true;
  });
}
function renderDaily(){
  const rows = getReportRows();
  const byDay = {};
  rows.forEach(e=>{
    (byDay[e.date] ||= {count:0, kg:0});
    byDay[e.date].count++;
    byDay[e.date].kg += e.kg;
  });
  reportArea.innerHTML = `
    <table class="table">
      <thead><tr><th>Sana</th><th>Yozuv</th><th>Kg</th></tr></thead>
      <tbody>${Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b)).map(([d, s])=>
        `<tr><td>${d}</td><td>${s.count}</td><td>${fmt(s.kg)}</td></tr>`).join('')}</tbody>
    </table>`;
}
function renderMonthly(){
  const rows = getReportRows();
  const mon = e => e.date.slice(0,7);
  const byMon = {};
  rows.forEach(e=>{
    const m = mon(e);
    (byMon[m] ||= {count:0, kg:0});
    byMon[m].count++;
    byMon[m].kg += e.kg;
  });
  reportArea.innerHTML = `
    <table class="table">
      <thead><tr><th>Oy</th><th>Yozuv</th><th>Kg</th></tr></thead>
      <tbody>${Object.entries(byMon).sort(([a],[b])=>a.localeCompare(b)).map(([m, s])=>
        `<tr><td>${m}</td><td>${s.count}</td><td>${fmt(s.kg)}</td></tr>`).join('')}</tbody>
    </table>`;
}
function renderPivot(){
  const rows = getReportRows();
  const map = {};
  rows.forEach(e=>{
    (map[e.typeName] ||= {});
    map[e.typeName][e.size] = (map[e.typeName][e.size]||0) + e.kg;
  });
  reportArea.innerHTML = `
    <table class="table">
      <thead><tr><th>Tur</th><th>O'lcham</th><th>Kg</th></tr></thead>
      <tbody>${
        Object.entries(map).map(([t, sizes])=>
          Object.entries(sizes).map(([s, kg])=>`<tr><td>${t}</td><td>${s}</td><td>${fmt(kg)}</td></tr>`).join('')
        ).join('')
      }</tbody>
    </table>`;
}
$('#runDaily')   && ($('#runDaily').onclick   = renderDaily);
$('#runMonthly') && ($('#runMonthly').onclick = renderMonthly);
$('#runPivot')   && ($('#runPivot').onclick   = renderPivot);

/* ---------- Init ---------- */
function init(){
  // defaults
  if (fDate) fDate.value = today();
  if (flFrom) flFrom.value=''; if (flTo) flTo.value='';

  // fill bases
  fillWorkshops(); fillMachines(); fillTypes(); renderMasters();

  // filters : type → size
  flType && flType.dispatchEvent(new Event('change'));

  // next index
  if (fIndex) fIndex.value = NEXT;

  applyTheme();
  resetForm();
  render();
  renderArchives();

  // show saved page
  showPage(UI.activePage || 'page-input');
}
init();
