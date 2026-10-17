const K='dragonShelf.v1';let db=JSON.parse(localStorage.getItem(K)||'{"books":[]}');
const save=()=>localStorage.setItem(K,JSON.stringify(db));
const $=s=>document.querySelector(s),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/^(the|a|an)\s+/,'').replace(/[^a-z0-9]/g,'');
const star=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const today=()=>new Date().toISOString().slice(0,10);
const last=b=>b.reads.slice().sort((x,y)=>y.date.localeCompare(x.date))[0]||{};
const avg=b=>b.reads.length?b.reads.reduce((s,r)=>s+(+r.stars||0),0)/b.reads.length:0;
let st={q:'',sort:'recent',filter:'all'};
function stats(){const y=new Date().getFullYear()+'';let t=0,yr=0;db.books.forEach(b=>b.reads.forEach(r=>{t++;if(r.date.startsWith(y))yr++}));
$('#sTotal').textContent=t;$('#sUnique').textContent=db.books.filter(b=>b.reads.length).length;$('#sYear').textContent=yr;$('#sYearL').textContent='in '+y}
function list(){stats();const q=norm(st.q);let bs=db.books.filter(b=>!q||norm(b.title+b.author+b.series).includes(q));
if(st.filter==='reread')bs=bs.filter(b=>b.reads.length>1);if(st.filter==='5')bs=bs.filter(b=>Math.round(avg(b))===5);
if(st.filter.startsWith('y'))bs=bs.filter(b=>b.reads.some(r=>r.date.startsWith(st.filter.slice(1))));
const S={recent:(a,b)=>(last(b).date||'').localeCompare(last(a).date||''),title:(a,b)=>norm(a.title).localeCompare(norm(b.title)),author:(a,b)=>(a.author||'').localeCompare(b.author||''),rating:(a,b)=>avg(b)-avg(a),reads:(a,b)=>b.reads.length-a.reads.length};
bs.sort(S[st.sort]);const years=[...new Set(db.books.flatMap(b=>b.reads.map(r=>r.date.slice(0,4))))].sort().reverse();
$('#view').innerHTML=`<input id="q" type="search" placeholder="🔍 Have I read it? Search…" value="${esc(st.q)}">
<div class="bar"><select id="sort">${[['recent','Recently read'],['title','Title A–Z'],['author','Author'],['rating','Top rated'],['reads','Most reread']].map(([v,l])=>`<option value="${v}"${st.sort==v?' selected':''}>${l}</option>`).join('')}</select>
<select id="filt">${[['all','All books'],['reread','Rereads'],['5','5 stars'],...years.map(y=>['y'+y,y])].map(([v,l])=>`<option value="${v}"${st.filter==v?' selected':''}>${l}</option>`).join('')}</select></div>
${st.q&&q?`<div class="hint">${bs.length?`✅ Yes — you've read ${bs.length==1?'this':'these'}!`:`📖 Not on your shelf yet. <a href="#" id="addq" style="color:var(--gold)">Log “${esc(st.q)}”</a>`}</div>`:''}
${bs.map(b=>{const l=last(b);return `<div class="book" data-id="${b.id}"><div class="spine"></div><div><div class="t">${esc(b.title)}</div><div class="a">${esc(b.author)}${b.series?' · '+esc(b.series):''}</div>${b.reads.length>1?`<span class="badge">🔥 Read ${b.reads.length}x</span>`:''}</div><div class="m"><div class="stars">${star(Math.round(avg(b)))}</div>${l.date||''}</div></div>`}).join('')}
${!db.books.length?'<div class="empty">Your shelf awaits, rider.<br>Tap <b>+ Log a Book</b> to add your first.</div>':''}
<div class="tools"><button id="exp">⬇ Export backup</button><button id="imp">⬆ Import backup</button></div><input type="file" id="file" accept=".json,application/json" hidden>`;
const qi=$('#q');qi.oninput=()=>{st.q=qi.value;list();const n=$('#q');n.focus();n.setSelectionRange(n.value.length,n.value.length)};
$('#sort').onchange=e=>{st.sort=e.target.value;list()};$('#filt').onchange=e=>{st.filter=e.target.value;list()};
document.querySelectorAll('.book').forEach(el=>el.onclick=()=>detail(el.dataset.id));
if($('#addq'))$('#addq').onclick=e=>{e.preventDefault();form({title:st.q})};
$('#exp').onclick=exp;$('#imp').onclick=()=>$('#file').click();$('#file').onchange=imp}
function close(){$('#modal').hidden=true;$('#modal').innerHTML='';list()}
function form(o={},book=null,read=null){const r=read||{date:today(),stars:0,review:''};const m=$('#modal');m.hidden=false;
m.innerHTML=`<div class="sheet"><h2>${read?'Edit read':book?'Log a reread':'Log a book'}</h2>
${book?`<div class="t" style="font-size:20px">${esc(book.title)}</div><div style="color:var(--mut)">${esc(book.author)}</div>`:`
<label>Title</label><input id="ft" value="${esc(o.title||'')}" list="tl" autocomplete="off"><datalist id="tl">${db.books.map(b=>`<option value="${esc(b.title)}">`).join('')}</datalist><div id="dup"></div>
<label>Author</label><input id="fa" value="${esc(o.author||'')}">
<label>Series (optional)</label><input id="fs" value="${esc(o.series||'')}" placeholder="e.g. Book 2 of …">`}
<label>Date finished</label><input id="fd" type="date" value="${r.date}">
<label>Rating</label><div class="rate">${[1,2,3,4,5].map(i=>`<button data-s="${i}" class="${i<=r.stars?'on':''}">★</button>`).join('')}</div>
<label>Review notes</label><textarea id="fr" rows="4" placeholder="Thoughts, favorite moments…">${esc(r.review)}</textarea>
<div class="row"><button id="cx">Cancel</button><button id="ok" class="gold">${read?'Save':'Add to shelf'}</button></div></div>`;
let s=r.stars;m.querySelectorAll('.rate button').forEach(b=>b.onclick=()=>{s=+b.dataset.s;m.querySelectorAll('.rate button').forEach(x=>x.classList.toggle('on',+x.dataset.s<=s))});
const ft=$('#ft');if(ft){const chk=()=>{const f=db.books.find(b=>norm(b.title)===norm(ft.value)&&norm(ft.value));$('#dup').innerHTML=f?`<div class="hint">You've read this ${f.reads.length}x — saving adds a reread.</div>`:'';if(f&&!$('#fa').value)$('#fa').value=f.author;};ft.oninput=chk;chk();}
$('#cx').onclick=()=>book?detail(book.id):close();
$('#ok').onclick=()=>{const entry={id:read?read.id:uid(),date:$('#fd').value||today(),stars:s,review:$('#fr').value.trim()};let b=book;
if(!b){const t=ft.value.trim();if(!t){ft.focus();return}b=db.books.find(x=>norm(x.title)===norm(t));
if(!b){b={id:uid(),title:t,author:$('#fa').value.trim(),series:$('#fs').value.trim(),reads:[]};db.books.push(b)}else{if($('#fs').value.trim())b.series=$('#fs').value.trim()}}
if(read){Object.assign(b.reads.find(x=>x.id===read.id),entry)}else b.reads.push(entry);save();
if(!read)celebrate(b);if(book)detail(b.id);else close()};if(ft&&!o.title)setTimeout(()=>ft.focus(),50)}
function editBook(b){const m=$('#modal');m.innerHTML=`<div class="sheet"><h2>Edit book</h2><label>Title</label><input id="et" value="${esc(b.title)}"><label>Author</label><input id="ea" value="${esc(b.author)}"><label>Series</label><input id="es" value="${esc(b.series)}">
<div class="row"><button id="cx">Cancel</button><button id="ok" class="gold">Save</button></div><div class="row"><button id="del" class="danger">Delete book &amp; all reads</button></div></div>`;
$('#cx').onclick=()=>detail(b.id);$('#ok').onclick=()=>{b.title=$('#et').value.trim()||b.title;b.author=$('#ea').value.trim();b.series=$('#es').value.trim();save();detail(b.id)};
$('#del').onclick=()=>{if(confirm(`Delete “${b.title}” and all ${b.reads.length} read(s)?`)){db.books=db.books.filter(x=>x!==b);save();close()}}}
function detail(id){const b=db.books.find(x=>x.id===id);if(!b)return close();const m=$('#modal');m.hidden=false;
const rs=b.reads.slice().sort((x,y)=>y.date.localeCompare(x.date));
m.innerHTML=`<div class="sheet"><svg class="wing" viewBox="0 0 512 340" style="width:60px;height:40px"><use href="#wingp"/></svg><h2 style="font-size:26px">${esc(b.title)}</h2>
<div style="color:var(--mut)">${esc(b.author)}${b.series?' · '+esc(b.series):''}</div>
<div style="margin:10px 0"><span class="badge">📚 Read ${b.reads.length}x</span> <span class="stars" style="font-size:20px">${star(Math.round(avg(b)))}</span></div>
<h3 style="color:var(--gold);margin-bottom:0">Read history</h3>
${rs.map((r,i)=>`<div class="read"><b>Read #${rs.length-i}</b> · ${r.date} <span class="stars">${star(+r.stars||0)}</span>${r.review?`<div style="white-space:pre-wrap;margin-top:6px">${esc(r.review)}</div>`:''}
<div class="row" style="margin-top:8px"><button data-e="${r.id}">Edit</button><button class="danger" data-d="${r.id}">Delete</button></div></div>`).join('')||'<p class="empty">No reads logged.</p>'}
<div class="row"><button id="rr" class="gold">🔥 Log a reread</button></div><div class="row"><button id="eb">Edit book</button><button id="bk">Back</button></div></div>`;
$('#bk').onclick=close;$('#rr').onclick=()=>form({},b);$('#eb').onclick=()=>editBook(b);
m.querySelectorAll('[data-e]').forEach(x=>x.onclick=()=>form({},b,b.reads.find(r=>r.id===x.dataset.e)));
m.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>{if(confirm('Delete this read?')){b.reads=b.reads.filter(r=>r.id!==x.dataset.d);save();detail(b.id)}});m.scrollTop=0}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,1)],{type:'application/json'}));a.download='dragon-shelf-backup-'+today()+'.json';a.click()}
function imp(e){const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!Array.isArray(d.books))throw 0;
const rep=confirm('OK = replace your shelf with this backup.\nCancel = merge it in.');if(rep)db=d;else d.books.forEach(nb=>{const b=db.books.find(x=>norm(x.title)===norm(nb.title));if(!b)db.books.push(nb);else nb.reads.forEach(r=>{if(!b.reads.some(x=>x.id===r.id))b.reads.push(r)})});save();list();alert('Backup imported!')}catch(_){alert('That file is not a Dragon Shelf backup.')}})}
function celebrate(b){const total=db.books.reduce((s,x)=>s+x.reads.length,0);const t=document.createElement('div');t.className='toast';
t.innerHTML=`🐉 Book #${total} claimed!<br><small style="color:var(--tx)">${esc(b.title)}${b.reads.length>1?` · Read ${b.reads.length}x`:''}</small>`;document.body.appendChild(t);setTimeout(()=>t.remove(),2300);
try{const ac=new (window.AudioContext||window.webkitAudioContext)();[523,659,784,1047].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,ac.currentTime+i*.09);g.gain.linearRampToValueAtTime(.15,ac.currentTime+i*.09+.02);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+i*.09+.5);o.connect(g).connect(ac.destination);o.start(ac.currentTime+i*.09);o.stop(ac.currentTime+i*.09+.6)})}catch(_){}
const c=$('#fx'),x=c.getContext('2d');c.width=innerWidth*2;c.height=innerHeight*2;x.scale(2,2);
const P=Array.from({length:90},()=>({x:innerWidth/2,y:innerHeight*.75,vx:(Math.random()-.5)*9,vy:-Math.random()*12-4,r:Math.random()*3+1.5,l:1,h:30+Math.random()*25}));
(function f(){x.clearRect(0,0,innerWidth,innerHeight);let a=0;P.forEach(p=>{if(p.l<=0)return;a=1;p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l-=.012;x.globalAlpha=p.l;x.fillStyle=`hsl(${p.h},95%,60%)`;x.shadowColor='#e0662a';x.shadowBlur=8;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()});if(a)requestAnimationFrame(f);else x.clearRect(0,0,innerWidth,innerHeight)})()}
$('#fab').onclick=()=>form();list();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
