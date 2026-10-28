(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const STORE = 'tradeflow_cent_journal_v1';
  const nowISO = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); };
  const today = () => nowISO().slice(0,10);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (n, digits=2) => (Number(n)||0).toLocaleString('id-ID',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const usd = n => '$'+fmt(n,2);
  const idr = n => 'Rp'+Math.round(Number(n)||0).toLocaleString('id-ID');
  const cent = n => fmt(n,2)+' USC';
  const icon = (name, cls='w-4 h-4') => `<i data-lucide="${name}" class="${cls}"></i>`;
  let state = {name:'Trader',photo:'',capital:10000,rate:16000,trades:[],notes:[],activeTab:'home'};
  let equityChart=null, winChart=null, editingId=null, toastTimer;
  try { const saved=JSON.parse(localStorage.getItem(STORE)||'null'); if(saved) state={...state,...saved,trades:Array.isArray(saved.trades)?saved.trades:[],notes:Array.isArray(saved.notes)?saved.notes:[]}; } catch(e){}
  function save(){ try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){toast('Penyimpanan penuh. Hapus foto berukuran besar atau ekspor CSV.');} }
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),2400);}
  function totalPnL(){return state.trades.reduce((s,t)=>s+Number(t.pnl||0),0)}
  function wins(){return state.trades.filter(t=>Number(t.pnl)>0)}
  function losses(){return state.trades.filter(t=>Number(t.pnl)<0)}
  function profit(){return wins().reduce((s,t)=>s+Number(t.pnl),0)}
  function loss(){return losses().reduce((s,t)=>s+Math.abs(Number(t.pnl)),0)}
  function money3(n){return `<div class="space-y-1"><div class="font-extrabold text-base">${cent(n)}</div><div class="text-xs text-muted">${usd(n/100)}</div><div class="text-xs text-muted">${idr(n/100*state.rate)}</div></div>`}
  function compact3(n){return `<span class="font-bold">${cent(n)}</span><span class="text-muted text-[11px]">${usd(n/100)} · ${idr(n/100*state.rate)}</span>`}
  function equity(){return Number(state.capital||0)+totalPnL()}
  function roi(){return Number(state.capital)>0?totalPnL()/Number(state.capital)*100:0}
  function groupedDays(){const m=new Map();state.trades.forEach(t=>{m.set(t.date,(m.get(t.date)||0)+Number(t.pnl||0))});return [...m.entries()]}
  function render(){
    $('headerName').textContent=state.name||'Trader';
    $('avatar').innerHTML=state.photo?`<img src="${state.photo}" class="w-full h-full object-cover" alt="Foto profil">`:icon('user-round','w-5 h-5 text-muted');
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab));
    const page=$('page'); page.innerHTML=({home:homePage,journal:journalPage,analytics:analyticsPage,notes:notesPage}[state.activeTab]||homePage)();
    if(window.lucide) lucide.createIcons();
    if(state.activeTab==='analytics') drawCharts();
  }
  function card(title,content,extra=''){return `<section class="panel p-4 ${extra}"><div class="flex items-center justify-between gap-3 mb-3"><h2 class="font-bold text-sm">${title}</h2></div>${content}</section>`}
  function homePage(){
    const p=totalPnL(), e=equity(), winRate=state.trades.length?wins().length/state.trades.length*100:0;
    return `<div class="tabpage space-y-4">
      <div class="panel p-5 overflow-hidden relative"><div class="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-emerald-400/5 blur-2xl"></div>
        <div class="flex items-center justify-between gap-2"><span class="text-xs text-muted font-semibold">TOTAL EQUITY</span><span class="pill">AKUN CENT</span></div>
        <div class="mt-4"><div class="text-3xl font-extrabold tracking-tight">${cent(e)}</div><div class="text-sm text-muted mt-1">${usd(e/100)}</div><div class="text-sm text-muted">${idr(e/100*state.rate)}</div></div>
        <div class="mt-5 flex items-end justify-between gap-4"><div><p class="metric-label mb-1">ROI Kumulatif</p><p class="text-xl font-extrabold ${roi()>=0?'mint':'coral'}">${roi()>=0?'+':''}${fmt(roi())}%</p></div><div class="text-right"><p class="metric-label mb-1">Modal Awal</p><p class="font-bold">${cent(Number(state.capital))}</p><p class="text-xs text-muted">${idr(Number(state.capital)/100*state.rate)}</p></div></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="panel p-4"><div class="flex items-center gap-2 text-xs text-muted mb-3">${icon('trending-up','w-4 h-4 mint')} Total Profit</div>${money3(profit())}</div>
        <div class="panel p-4"><div class="flex items-center gap-2 text-xs text-muted mb-3">${icon('trending-down','w-4 h-4 coral')} Total Loss</div>${money3(-loss())}</div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <div class="panel p-3"><p class="metric-label">Posisi</p><p class="text-xl font-extrabold mt-1">${state.trades.length}</p></div>
        <div class="panel p-3"><p class="metric-label">Win rate</p><p class="text-xl font-extrabold mt-1">${fmt(winRate,1)}%</p></div>
        <div class="panel p-3"><p class="metric-label">Kurs USD/IDR</p><p class="text-sm font-extrabold mt-2">${fmt(state.rate,0)}</p></div>
      </div>
      ${card('Aktivitas Terbaru',state.trades.length?`<div>${[...state.trades].sort((a,b)=>b.timestamp-a.timestamp).slice(0,4).map(tradeRow).join('')}</div>`:`<div class="py-7 text-center">${icon('notebook-pen','w-8 h-8 mx-auto text-muted mb-3')}<p class="font-bold text-sm">Belum ada posisi</p><p class="text-xs text-muted mt-1">Tambahkan transaksi pertama untuk mulai melacak performa.</p><button class="btn btn-primary mt-4" data-action="add-trade">${icon('plus')} Tambah Posisi</button></div>`)}
      <p class="text-[10px] leading-relaxed text-muted px-1">Kurs IDR digunakan untuk estimasi nilai ekuivalen, bukan kurs broker. Semua data tersimpan lokal di perangkat ini.</p>
    </div>`;
  }
  function tradeRow(t){
    const positive=Number(t.pnl)>=0;
    return `<div class="trade-row flex items-start justify-between gap-3"><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><span class="font-bold text-sm">${esc(t.instrument)}</span><span class="pill">${esc(t.side)}</span></div><p class="text-[11px] text-muted mt-1">${esc(t.date)} · ${esc(t.time||'--:--')} · ${fmt(t.lot,2)} lot</p>${t.note?`<p class="text-[11px] text-muted mt-1 truncate">${esc(t.note)}</p>`:''}</div><div class="text-right shrink-0"><p class="font-extrabold text-sm ${positive?'mint':'coral'}">${positive?'+':'−'}${cent(Math.abs(Number(t.pnl)))}</p><p class="text-[10px] text-muted mt-1">${usd(Number(t.pnl)/100)}</p><div class="flex gap-1 justify-end mt-2"><button class="p-1.5 text-muted" data-action="edit-trade" data-id="${t.id}" aria-label="Edit">${icon('pencil','w-3.5 h-3.5')}</button><button class="p-1.5 text-muted" data-action="delete-trade" data-id="${t.id}" aria-label="Hapus">${icon('trash-2','w-3.5 h-3.5')}</button></div></div></div>`;
  }
  function journalPage(){
    const sorted=[...state.trades].sort((a,b)=>(b.date+'T'+(b.time||'00:00')).localeCompare(a.date+'T'+(a.time||'00:00')));
    const byDate={};sorted.forEach(t=>(byDate[t.date]??=[]).push(t));
    return `<div class="tabpage space-y-4">
      <div class="flex items-center justify-between gap-3"><div><h2 class="text-xl font-extrabold">Jurnal Trading</h2><p class="text-xs text-muted mt-1">${state.trades.length} posisi tercatat</p></div><button class="btn btn-primary" data-action="add-trade">${icon('plus')} Tambah Posisi</button></div>
      <div class="grid grid-cols-2 gap-3"><div class="panel p-4"><p class="metric-label mb-2">Net PnL</p><p class="font-extrabold ${totalPnL()>=0?'mint':'coral'}">${cent(totalPnL())}</p><p class="text-xs text-muted mt-1">${usd(totalPnL()/100)}</p></div><div class="panel p-4"><p class="metric-label mb-2">Total Posisi</p><p class="font-extrabold text-xl">${state.trades.length}</p><p class="text-xs text-muted mt-1">${wins().length} win · ${losses().length} loss</p></div></div>
      <div class="flex flex-wrap gap-2"><button class="btn btn-ghost" data-action="export">${icon('file-spreadsheet')} Ekspor CSV</button><button class="btn btn-ghost" data-action="add-trade">${icon('plus')} Catat posisi</button></div>
      ${sorted.length?Object.entries(byDate).map(([date,items])=>`<section class="panel px-4 py-2"><div class="flex justify-between items-center py-2"><h3 class="font-bold text-xs">${esc(date)}</h3><span class="text-[10px] text-muted">${items.length} posisi · Net ${cent(items.reduce((s,t)=>s+Number(t.pnl),0))}</span></div>${items.map(tradeRow).join('')}</section>`).join(''):`<section class="panel py-12 px-5 text-center">${icon('clipboard-list','w-9 h-9 mx-auto text-muted mb-3')}<p class="font-bold">Jurnal masih kosong</p><p class="text-xs text-muted mt-2">Setiap posisi dapat dicatat terpisah, termasuk beberapa posisi di tanggal yang sama.</p><button class="btn btn-primary mt-4" data-action="add-trade">${icon('plus')} Tambah Posisi</button></section>`}
    </div>`;
  }
  function analyticsPage(){
    const wr=state.trades.length?wins().length/state.trades.length*100:0, avg=state.trades.length?totalPnL()/state.trades.length:0, days=groupedDays(), pd=days.filter(x=>x[1]>0).length, ld=days.filter(x=>x[1]<0).length;
    return `<div class="tabpage space-y-4"><div><h2 class="text-xl font-extrabold">Analitik & Statistik</h2><p class="text-xs text-muted mt-1">Kinerja akun berdasarkan posisi yang dicatat.</p></div>
      ${card('Kurva Equity (USC)',`<div class="h-56"><canvas id="equityChart"></canvas></div><p class="text-[10px] text-muted mt-2">Dimulai dari modal awal, kemudian setiap posisi ditambahkan berdasarkan waktu.</p>`)}
      ${card('Distribusi Win / Loss',`<div class="grid grid-cols-2 items-center gap-3"><div class="h-40"><canvas id="winChart"></canvas></div><div class="space-y-4"><div><p class="text-xs text-muted">Win rate</p><p class="text-2xl font-extrabold mint">${fmt(wr,1)}%</p><p class="text-[10px] text-muted">${wins().length} posisi profit</p></div><div><p class="text-xs text-muted">Loss rate</p><p class="text-xl font-extrabold coral">${fmt(100-wr,1)}%</p><p class="text-[10px] text-muted">${losses().length} posisi rugi</p></div></div></div>`)}
      <div class="grid grid-cols-2 gap-3"><div class="panel p-4"><p class="metric-label">Rata-rata PnL</p><p class="font-extrabold mt-2 ${avg>=0?'mint':'coral'}">${cent(avg)}</p><p class="text-xs text-muted mt-1">${usd(avg/100)}</p></div><div class="panel p-4"><p class="metric-label">Net PnL</p><p class="font-extrabold mt-2 ${totalPnL()>=0?'mint':'coral'}">${cent(totalPnL())}</p><p class="text-xs text-muted mt-1">${idr(totalPnL()/100*state.rate)}</p></div><div class="panel p-4"><p class="metric-label">Hari Profit</p><p class="text-xl font-extrabold mint mt-2">${pd}</p></div><div class="panel p-4"><p class="metric-label">Hari Loss</p><p class="text-xl font-extrabold coral mt-2">${ld}</p></div></div>
      <div class="panel p-4"><p class="text-xs text-muted leading-relaxed">Catatan metodologi: win rate dihitung dari posisi dengan PnL positif dibanding semua posisi. Posisi impas tidak dihitung sebagai win atau loss, tetapi tetap masuk penyebut win rate. Equity mengurutkan transaksi berdasarkan tanggal, jam, dan waktu pencatatan.</p></div>
    </div>`;
  }
  function notesPage(){
    const notes=[...state.notes].sort((a,b)=>b.updatedAt-a.updatedAt);
    return `<div class="tabpage space-y-4"><div class="flex items-center justify-between gap-3"><div><h2 class="text-xl font-extrabold">Catatan & Evaluasi</h2><p class="text-xs text-muted mt-1">Jurnal psikologi, strategi, dan review harian.</p></div><button class="btn btn-primary" data-action="add-note">${icon('plus')} Catatan</button></div>
      <div class="panel p-4"><div class="flex items-center gap-2 mb-2">${icon('brain','w-4 h-4 mint')}<h3 class="font-bold text-sm">Checklist evaluasi</h3></div><p class="text-xs text-muted leading-relaxed">Sebelum menutup hari, tinjau apakah entry sesuai rencana, risiko terkendali, dan keputusan diambil tanpa mengejar kerugian.</p></div>
      ${notes.length?notes.map(n=>`<article class="panel p-4"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-[10px] text-muted">${esc(n.date)} · ${esc(new Date(n.updatedAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}))}</p><h3 class="font-bold mt-2">${esc(n.title||'Evaluasi harian')}</h3></div><div class="flex gap-1"><button class="p-2 text-muted" data-action="edit-note" data-id="${n.id}">${icon('pencil','w-4 h-4')}</button><button class="p-2 text-muted" data-action="delete-note" data-id="${n.id}">${icon('trash-2','w-4 h-4')}</button></div></div><p class="text-sm leading-relaxed whitespace-pre-wrap mt-3 text-slate-200">${esc(n.body)}</p></article>`).join(''):`<div class="panel text-center px-5 py-12">${icon('book-open-text','w-9 h-9 mx-auto text-muted mb-3')}<p class="font-bold">Belum ada evaluasi</p><p class="text-xs text-muted mt-2">Simpan rencana, emosi, kesalahan, dan pelajaran trading di sini.</p><button class="btn btn-primary mt-4" data-action="add-note">${icon('plus')} Tulis evaluasi</button></div>`}
    </div>`;
  }
  function drawCharts(){
    if(!window.Chart)return;
    if(equityChart)equityChart.destroy();if(winChart)winChart.destroy();
    const ctx=$('equityChart');if(ctx){
      const ordered=[...state.trades].sort((a,b)=>(a.date+'T'+(a.time||'00:00')).localeCompare(b.date+'T'+(b.time||'00:00'))||a.timestamp-b.timestamp);
      let bal=Number(state.capital)||0;const labels=['Modal awal'],values=[bal];ordered.forEach(t=>{bal+=Number(t.pnl)||0;labels.push((t.date||'')+' '+(t.time||''));values.push(bal)});
      equityChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data:values,label:'Equity USC',borderColor:'#42f5b3',backgroundColor:'rgba(66,245,179,.10)',fill:true,tension:.28,pointRadius:ordered.length>30?0:2,pointBackgroundColor:'#42f5b3',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#91a1b8',maxTicksLimit:5,maxRotation:0},grid:{display:false}},y:{ticks:{color:'#91a1b8',callback:v=>Number(v).toLocaleString('id-ID')},grid:{color:'rgba(145,161,184,.12)'}}}}});
    }
    const wc=$('winChart');if(wc)winChart=new Chart(wc,{type:'doughnut',data:{labels:['Win','Loss','Impas'],datasets:[{data:[wins().length,losses().length,state.trades.filter(t=>Number(t.pnl)===0).length],backgroundColor:['#42f5b3','#ff6b78','#64748b'],borderColor:'#101c2e',borderWidth:3,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{legend:{display:false}}}});
  }
  function openDrawer(content){$('modalRoot').innerHTML=`<div class="drawer-backdrop" data-action="backdrop"><div class="drawer" role="dialog" aria-modal="true">${content}</div></div>`;if(window.lucide)lucide.createIcons();}
  function closeDrawer(){$('modalRoot').innerHTML='';editingId=null;}
  const instruments=['Forex — EURUSD','Forex — GBPUSD','Forex — USDJPY','Forex — AUDUSD','Komoditas — XAUUSD (Gold)','Komoditas — XAGUSD (Silver)','Komoditas — Oil / USOIL','Indeks — S&P 500 / US500','Indeks — Nasdaq / NAS100','Indeks — Dow Jones / US30','Crypto — BTCUSD','Crypto — ETHUSD','Lainnya'];
  function tradeForm(id){
    const t=id?state.trades.find(x=>x.id===id):null;editingId=id||null;
    const inst=t?.instrument||'Komoditas — XAUUSD (Gold)';
    return `<div class="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-5"></div><div class="flex items-center justify-between mb-5"><div><p class="text-[10px] uppercase tracking-widest text-muted">TRADE ENTRY</p><h2 class="text-xl font-extrabold mt-1">${t?'Edit Posisi':'Tambah Posisi'}</h2></div><button class="p-2 text-muted" data-action="close">${icon('x','w-5 h-5')}</button></div>
      <form id="tradeForm" class="space-y-4"><div class="grid grid-cols-2 gap-3"><div><label class="label">Tanggal</label><input class="field" name="date" type="date" value="${esc(t?.date||today())}" required></div><div><label class="label">Waktu</label><input class="field" name="time" type="time" value="${esc(t?.time||nowISO().slice(11,16))}" required></div></div>
      <div><label class="label">Instrumen</label><select class="field" name="instrument">${instruments.map(x=>`<option ${x===inst?'selected':''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="grid grid-cols-2 gap-3"><div><label class="label">Jenis posisi</label><select class="field" name="side"><option ${!t||t.side==='BUY'?'selected':''}>BUY</option><option ${t?.side==='SELL'?'selected':''}>SELL</option></select></div><div><label class="label">Lot / Size</label><input class="field" name="lot" type="number" min="0" step="any" value="${esc(t?.lot??'0.01')}" placeholder="0.01" required></div></div>
      <div><label class="label">Hasil PnL (USC / cent)</label><input class="field" name="pnl" type="number" step="any" value="${t?esc(t.pnl):''}" placeholder="Contoh: 250 atau -120" required><p class="text-[10px] text-muted mt-2">Masukkan hasil bersih posisi dalam cent. Profit positif, loss negatif.</p></div>
      <div><label class="label">Catatan transaksi (opsional)</label><textarea class="field" name="note" rows="2" placeholder="Alasan entry, setup, atau kesalahan...">${esc(t?.note||'')}</textarea></div>
      <div class="panel p-3"><p class="text-[10px] text-muted mb-2">Pratinjau PnL</p><div id="pnlPreview" class="font-extrabold text-sm">—</div></div>
      <div class="flex gap-2 pt-1"><button type="button" class="btn btn-ghost flex-1" data-action="close">Batal</button><button class="btn btn-primary flex-1" type="submit">${icon('check')} ${t?'Simpan Perubahan':'Simpan Posisi'}</button></div></form>`;
  }
  function openTrade(id){openDrawer(tradeForm(id));const f=$('tradeForm');f.querySelector('[name=pnl]').addEventListener('input',e=>{const n=Number(e.target.value)||0;$('pnlPreview').innerHTML=`<span class="${n>=0?'mint':'coral'}">${n>=0?'+':'−'}${cent(Math.abs(n))}</span><span class="text-muted font-normal ml-2">${usd(n/100)} · ${idr(n/100*state.rate)}</span>`;});f.querySelector('[name=pnl]').dispatchEvent(new Event('input'));}
  function noteForm(id){
    const n=id?state.notes.find(x=>x.id===id):null;editingId=id||null;
    return `<div class="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-5"></div><div class="flex items-center justify-between mb-5"><div><p class="text-[10px] uppercase tracking-widest text-muted">TRADING MINDSET</p><h2 class="text-xl font-extrabold mt-1">${n?'Edit Evaluasi':'Catatan & Evaluasi'}</h2></div><button class="p-2 text-muted" data-action="close">${icon('x','w-5 h-5')}</button></div>
    <form id="noteForm" class="space-y-4"><div><label class="label">Tanggal</label><input class="field" name="date" type="date" value="${esc(n?.date||today())}" required></div><div><label class="label">Judul</label><input class="field" name="title" value="${esc(n?.title||'')}" placeholder="Contoh: Review sesi London" required></div><div><label class="label">Evaluasi harian</label><textarea class="field" name="body" rows="7" placeholder="1. Rencana hari ini&#10;2. Apakah mengikuti setup?&#10;3. Emosi saat entry/exit&#10;4. Kesalahan dan pelajaran&#10;5. Perbaikan besok" required>${esc(n?.body||'')}</textarea></div><div class="flex gap-2"><button type="button" class="btn btn-ghost flex-1" data-action="close">Batal</button><button type="submit" class="btn btn-primary flex-1">${icon('save')} Simpan Catatan</button></div></form>`;
  }
  function openNote(id){openDrawer(noteForm(id));}
  function settingsForm(){
    return `<div class="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-5"></div><div class="flex items-center justify-between mb-5"><div><p class="text-[10px] uppercase tracking-widest text-muted">PREFERENSI</p><h2 class="text-xl font-extrabold mt-1">Pengaturan</h2></div><button class="p-2 text-muted" data-action="close">${icon('x','w-5 h-5')}</button></div>
    <form id="settingsForm" class="space-y-4"><div><label class="label">Nama pengguna</label><input class="field" name="name" maxlength="40" value="${esc(state.name)}" required></div><div><label class="label">Foto profil (opsional)</label><input class="field" name="photo" type="file" accept="image/png,image/jpeg,image/webp"><p class="text-[10px] text-muted mt-1">Foto diperkecil sebelum disimpan agar hemat ruang.</p></div><div><label class="label">Modal awal akun (USC)</label><input class="field" name="capital" type="number" step="any" min="0" value="${esc(state.capital)}" required></div><div><label class="label">Kurs USD → IDR</label><div class="flex gap-2"><input class="field" name="rate" type="number" min="1" step="any" value="${esc(state.rate)}" required><button type="button" class="btn btn-ghost shrink-0" data-action="fetch-rate">${icon('refresh-cw')} Auto</button></div><p class="text-[10px] text-muted mt-1">Kurs otomatis membutuhkan internet; nilai yang dipakai tersimpan sebagai kurs kerja.</p></div><div class="panel p-3"><p class="text-xs font-bold">Konversi akun cent</p><p class="text-[11px] text-muted mt-1">100 USC = 1 USD. Nilai IDR = USD × kurs kerja. Perubahan modal awal mengubah ROI dan kurva equity, bukan riwayat PnL.</p></div><div class="flex gap-2"><button type="button" class="btn btn-ghost flex-1" data-action="close">Batal</button><button type="submit" class="btn btn-primary flex-1">${icon('check')} Simpan</button></div><button type="button" class="btn btn-danger w-full" data-action="reset">Reset semua data</button></form>`;
  }
  function openSettings(){openDrawer(settingsForm());}
  async function fetchRate(){
    try{const r=await fetch('https://open.er-api.com/v6/latest/USD');if(!r.ok)throw Error();const d=await r.json();const rate=Number(d?.rates?.IDR);if(!rate)throw Error();const input=$('settingsForm')?.elements.rate;if(input)input.value=rate;toast('Kurs berhasil dimuat. Simpan untuk menerapkan.');}
    catch(e){toast('Kurs online gagal dimuat. Masukkan kurs manual.');}
  }
  function exportCSV(){
    const rows=[['Tanggal','Jam','Instrumen','Tipe','Lot','PnL (Cent)','PnL ($)','PnL (IDR)','Persentase ROI','Catatan Transaksi']];
    const ordered=[...state.trades].sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time));
    ordered.forEach(t=>{const n=Number(t.pnl)||0;rows.push([t.date,t.time,t.instrument,t.side,t.lot,n,(n/100).toFixed(2),Math.round(n/100*state.rate),(Number(state.capital)>0?(n/Number(state.capital)*100):0).toFixed(4),t.note||'']);});
    const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tradeflow-cent-journal-'+today()+'.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('CSV berhasil diekspor.');
  }
  $('page').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='add-trade')openTrade();if(a==='edit-trade')openTrade(id);
    if(a==='delete-trade'&&confirm('Hapus posisi ini?')){state.trades=state.trades.filter(t=>t.id!==id);save();render();toast('Posisi dihapus.');}
    if(a==='add-note')openNote();if(a==='edit-note')openNote(id);
    if(a==='delete-note'&&confirm('Hapus catatan ini?')){state.notes=state.notes.filter(n=>n.id!==id);save();render();toast('Catatan dihapus.');}
    if(a==='export')exportCSV();
  });
  document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;state.activeTab=b.dataset.tab;save();render();});
  $('settingsBtn').addEventListener('click',openSettings);
  $('modalRoot').addEventListener('click',e=>{
    if(e.target.classList.contains('drawer-backdrop')||e.target.closest('[data-action="close"]')){closeDrawer();return;}
    const b=e.target.closest('[data-action]');if(!b)return;
    if(b.dataset.action==='fetch-rate')fetchRate();
    if(b.dataset.action==='reset'&&confirm('Semua posisi, catatan, profil, dan pengaturan akan dihapus. Lanjutkan?')){state={name:'Trader',photo:'',capital:10000,rate:16000,trades:[],notes:[],activeTab:'home'};save();closeDrawer();render();toast('Data lokal direset.');}
  });
  $('modalRoot').addEventListener('submit',e=>{
    e.preventDefault();const f=e.target,fd=new FormData(f);
    if(f.id==='tradeForm'){
      const date=fd.get('date'),time=fd.get('time'),pnlValue=Number(fd.get('pnl')),lot=Number(fd.get('lot'));
      if(!date||!time||!Number.isFinite(pnlValue)||!Number.isFinite(lot)||lot<0){toast('Periksa tanggal, jam, PnL, dan lot.');return;}
      const old=editingId?state.trades.find(t=>t.id===editingId):null;
      const t={id:editingId||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date,time,instrument:fd.get('instrument'),side:fd.get('side'),lot,pnl:pnlValue,note:fd.get('note').trim(),timestamp:old?.timestamp||Date.now(),createdAt:old?.createdAt||Date.now()};
      if(editingId)state.trades=state.trades.map(x=>x.id===editingId?t:x);else state.trades.push(t);
      save();closeDrawer();render();toast(old?'Posisi diperbarui.':'Posisi disimpan.');
    }
    if(f.id==='noteForm'){
      const old=editingId?state.notes.find(n=>n.id===editingId):null;
      const n={id:editingId||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date:fd.get('date'),title:fd.get('title').trim(),body:fd.get('body').trim(),updatedAt:Date.now(),createdAt:old?.createdAt||Date.now()};
      if(editingId)state.notes=state.notes.map(x=>x.id===editingId?n:x);else state.notes.push(n);
      save();closeDrawer();render();toast('Evaluasi disimpan.');
    }
    if(f.id==='settingsForm'){
      state.name=String(fd.get('name')||'Trader').trim()||'Trader';state.capital=Math.max(0,Number(fd.get('capital'))||0);state.rate=Math.max(1,Number(fd.get('rate'))||16000);
      const file=f.elements.photo.files?.[0];
      const apply=()=>{save();closeDrawer();render();toast('Pengaturan disimpan.');};
      if(file){if(file.size>5*1024*1024){toast('Foto maksimal 5 MB.');return;}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas'),max=300,scale=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);state.photo=c.toDataURL('image/jpeg',.78);apply();};img.src=reader.result;};reader.readAsDataURL(file);}else apply();
    }
  });
  if('serviceWorker' in navigator && location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
  render();
})();