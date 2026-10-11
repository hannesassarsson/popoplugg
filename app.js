"use strict";
const SB_URL="https://bunltihhbbljpfmxiprn.supabase.co";
const SB_KEY="sb_publishable_aH8NerYmBtQv71laa3s6cA_brEMUT9E";
const AREAS=window.PP_AREAS;
const all={
  c:PP_CARDS.map((x,i)=>({id:"c"+i,a:x[0],t:x[1],d:x[2],r:x[3],label:x[1]})),
  q:PP_QUIZ.map((x,i)=>({id:"q"+i,a:x[0],q:x[1],o:x[2],e:x[3],label:x[1]})),
  f:PP_CASES.map((x,i)=>({id:"f"+i,a:x[0],s:x[1],o:x[2],e:x[3],label:x[1]})),
  t:PP_TF.map((x,i)=>({id:"t"+i,a:x[0],s:x[1],v:!!x[2],e:x[3],label:x[1]}))
};
const everything=[].concat(all.c,all.q,all.f,all.t);
const byId=Object.fromEntries(everything.map(x=>[x.id,x]));

/* ---------- state ---------- */
const KEY="polisplugg.v2";
function newCode(){
  const abc="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",b=new Uint8Array(20);crypto.getRandomValues(b);
  let s="";b.forEach((v,i)=>{s+=abc[v%32];if(i%4===3&&i<19)s+="-"});return "PLUGG-"+s;
}
let store={res:{},log:[],areas:["g","s","p"],code:""};
try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s)store=Object.assign(store,s)}catch(e){}
if(!store.code)store.code=newCode();
function save(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
save();

function dayKey(t){const d=new Date(t);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function xpTotal(){return store.log.reduce((s,l)=>s+(l.x||0),0)}
function xpByDay(){const m={};store.log.forEach(l=>{const k=dayKey(l.t);m[k]=(m[k]||0)+(l.x||0)});return m}
function streak(){
  const days=xpByDay();let d=new Date(),n=0;
  if(!(dayKey(d) in days))d.setDate(d.getDate()-1);
  while(dayKey(d) in days){n++;d.setDate(d.getDate()-1)}
  return n;
}
function mark(id,ok){const r=store.res[id]||{r:0,w:0};if(ok)r.r++;else r.w++;r.l=ok?1:0;r.t=Date.now();store.res[id]=r}
function last(id){const r=store.res[id];return r?r.l:undefined}
function merge(a,b){
  const out={res:Object.assign({},a.res),log:[],areas:a.areas,code:a.code};
  for(const id in (b.res||{})){const x=out.res[id],y=b.res[id];if(!x||(y.t||0)>(x.t||0))out.res[id]=y}
  const seen=new Set();
  [].concat(a.log||[],b.log||[]).forEach(l=>{const k=l.t+"|"+l.m;if(!seen.has(k)){seen.add(k);out.log.push(l)}});
  out.log.sort((x,y)=>x.t-y.t);if(out.log.length>2000)out.log=out.log.slice(-2000);
  return out;
}

/* ---------- sync ---------- */
let syncState={cls:"",msg:"Inte synkad än"};
function setSync(cls,msg){syncState={cls,msg};const el=document.getElementById("sync-status");if(el){el.className="status "+cls;el.textContent=msg}}
async function rpc(fn,body){
  const r=await fetch(SB_URL+"/rest/v1/rpc/"+fn,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return r.json();
}
let syncing=null;
function sync(){
  if(syncing)return syncing;
  setSync("","Synkar…");
  syncing=(async()=>{
    try{
      const remote=await rpc("polisplugg_load",{p_code:store.code});
      if(remote&&typeof remote==="object"){store=merge(store,remote);save()}
      await rpc("polisplugg_save",{p_code:store.code,p_data:{res:store.res,log:store.log}});
      const d=new Date();setSync("ok","Synkad "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"));
      meters();return true;
    }catch(e){setSync("err","Ingen kontakt med servern. Framstegen ligger kvar på enheten.");return false}
    finally{syncing=null}
  })();
  return syncing;
}

/* ---------- helpers ---------- */
const app=document.getElementById("app");
let timers=[],keyh=null,view="home";
function clear(){timers.forEach(clearInterval);timers=[];keyh=null}
document.addEventListener("keydown",e=>{if(keyh&&!e.metaKey&&!e.ctrlKey&&e.target.tagName!=="INPUT")keyh(e)});
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function inScope(x){return store.areas.includes(x.a)}
function pick(list,n){
  const pr=x=>last(x.id)===0?0:(last(x.id)===undefined?1:2);
  return shuffle(list.filter(inScope)).sort((a,b)=>pr(a)-pr(b)).slice(0,n);
}
function meters(){
  const s=streak();
  document.getElementById("m-streak").textContent=s+(s===1?" dag":" dagar")+" i rad";
  document.getElementById("m-xp").textContent=xpTotal()+" p";
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function topbar(i,n){return `<div class="bar-top"><button class="back" type="button" data-act="home">← Avsluta</button><span class="count">${i} / ${n}</span></div><div class="track"><div style="width:${Math.round(100*(i-1)/n)}%"></div></div>`}

/* ---------- home ---------- */
function home(){
  clear();view="home";meters();
  const chips=Object.keys(AREAS).map(k=>`<button class="chip" type="button" data-area="${k}" aria-pressed="${store.areas.includes(k)}">${AREAS[k].n}<small>${AREAS[k].t} · ${AREAS[k].hp}</small></button>`).join("");
  const cnt=l=>l.filter(inScope).length;
  const rows=Object.keys(AREAS).map(k=>{
    const items=everything.filter(x=>x.a===k),done=items.filter(x=>last(x.id)===1).length;
    return `<div class="row"><span><b>${AREAS[k].n}</b> <span class="muted">· ${AREAS[k].t.toLowerCase()}</span></span><span class="n">${done} av ${items.length}</span><div class="bar"><div style="width:${100*done/items.length}%"></div></div></div>`}).join("");
  app.innerHTML=`
  <section class="intro">
    <span class="eyebrow">Termin 1 · Grundläggande juridik · 15 hp</span>
    <h1>Vad vill du nöta idag?</h1>
    <p class="muted">Välj vilka tentor du övar inför. Det du svarar fel på kommer tillbaka först nästa runda.</p>
    <div class="chips" role="group" aria-label="Områden">${chips}</div>
  </section>
  <section class="modes" aria-label="Övningar">
    <button class="mode" type="button" data-act="cards"><i>10 kort</i><b>Begreppskort</b><span>Vänd kortet och säg ärligt om du kunde det. ${cnt(all.c)} begrepp.</span></button>
    <button class="mode" type="button" data-act="quiz"><i>8 frågor</i><b>Quiz</b><span>Fyra alternativ och en kort förklaring efter varje svar. ${cnt(all.q)} frågor.</span></button>
    <button class="mode" type="button" data-act="cases"><i>6 fall</i><b>Typfall</b><span>Läs händelsen och välj rätt brott eller rätt lagstöd. ${cnt(all.f)} fall.</span></button>
    <button class="mode" type="button" data-act="match"><i>6 par</i><b>Para ihop</b><span>Koppla begrepp till förklaring på tid.</span></button>
    <button class="mode" type="button" data-act="tf"><i>60 sek</i><b>Sant eller falskt</b><span>Så många påståenden du hinner på en minut.</span></button>
  </section>
  <section class="prog" aria-label="Framsteg">
    <div class="sec-head"><h2>Så långt har du kommit</h2><button class="link" type="button" data-act="stats">Historik och synk</button></div>${rows}</section>
  <p class="note">Innehållet bygger på lärandemålen i kursplanen för PO111B och stämdes av mot lagtext den 11 oktober 2026. Lagar ändras, så slå upp paragrafen vid kortet om något verkar fel.</p>`;
}

/* ---------- flashcards ---------- */
function cards(){
  clear();view="cards";
  const queue=pick(all.c,10),total=queue.length;let i=0,known=0,flipped=false;const missed=[];
  if(!total)return empty();
  function draw(){
    const c=queue[i];flipped=false;
    app.innerHTML=`<div class="stage">${topbar(i+1,total)}
      <button class="flip" type="button" id="flip" aria-label="Vänd kortet"><div class="in">
        <div class="face a"><span class="eyebrow">${AREAS[c.a].n}</span><span class="term">${esc(c.t)}</span><span class="muted">Tryck för att vända</span></div>
        <div class="face b"><span class="eyebrow">${esc(c.t)}</span><span class="def">${esc(c.d)}</span>${c.r?`<span class="ref">${esc(c.r)}</span>`:""}</div>
      </div></button>
      <div class="btnrow one" id="acts"><button class="btn primary" type="button" id="turn">Vänd kortet</button></div></div>`;
    document.getElementById("flip").onclick=flip;document.getElementById("turn").onclick=flip;
  }
  function flip(){
    if(flipped)return;flipped=true;document.getElementById("flip").classList.add("on");
    const a=document.getElementById("acts");a.className="btnrow";
    a.innerHTML=`<button class="btn no" type="button" id="no">Kunde inte</button><button class="btn ok" type="button" id="ok">Kunde</button>`;
    document.getElementById("no").onclick=()=>ans(false);document.getElementById("ok").onclick=()=>ans(true);
  }
  function ans(ok){
    const c=queue[i];mark(c.id,ok);
    if(ok)known++;else missed.push({h:c.t,e:c.d+(c.r?" ("+c.r+")":"")});
    save();i++;
    if(i>=total)result({title:"Begreppskort",score:known,of:total,xp:known*5,missed,again:cards});else draw();
  }
  keyh=e=>{if(e.key===" "||e.key==="Enter"){if(!flipped){e.preventDefault();flip()}}else if(flipped&&e.key==="1")ans(false);else if(flipped&&e.key==="2")ans(true)};
  draw();
}

/* ---------- quiz + typfall ---------- */
function choice(list,n,title,isCase,again){
  clear();view=isCase?"cases":"quiz";
  const qs=pick(list,n),total=qs.length;let i=0,right=0,answered=false;const missed=[];
  if(!total)return empty();
  function draw(){
    const q=qs[i];answered=false;
    const order=shuffle(q.o.map((t,k)=>({t,ok:k===0})));
    app.innerHTML=`<div class="stage">${topbar(i+1,total)}
      <span class="eyebrow">${AREAS[q.a].n}</span>
      ${isCase?`<div class="case">${esc(q.s)}</div><p class="q">Vad är rätt bedömning?</p>`:`<p class="q">${esc(q.q)}</p>`}
      <div class="opts">${order.map((o,k)=>`<button class="opt" type="button"><kbd>${k+1}</kbd><span>${esc(o.t)}</span></button>`).join("")}</div>
      <div id="fb"></div></div>`;
    const btns=[...app.querySelectorAll(".opt")];
    function choose(k){
      if(answered)return;answered=true;const ok=order[k].ok;
      btns.forEach((b,j)=>{b.disabled=true;if(order[j].ok)b.classList.add("right");else if(j===k)b.classList.add("wrong")});
      mark(q.id,ok);if(ok)right++;else missed.push({h:isCase?q.s:q.q,e:"Rätt svar: "+q.o[0]+". "+q.e});
      save();
      document.getElementById("fb").innerHTML=`<div class="fb ${ok?"right":"wrong"}"><b>${ok?"Rätt":"Fel"}</b>${esc(q.e)}</div><div class="btnrow one" style="margin-top:12px"><button class="btn primary" type="button" id="next">${i+1<total?"Nästa":"Se resultat"}</button></div>`;
      const nx=document.getElementById("next");nx.onclick=next;nx.focus();
    }
    btns.forEach((b,k)=>b.onclick=()=>choose(k));
    keyh=e=>{const k=parseInt(e.key,10);if(k>=1&&k<=order.length)choose(k-1)};
  }
  function next(){i++;if(i>=total)result({title,score:right,of:total,xp:right*10,missed,again});else draw()}
  draw();
}
const quiz=()=>choice(all.q,8,"Quiz",false,quiz);
const cases=()=>choice(all.f,6,"Typfall",true,cases);

/* ---------- sant/falskt ---------- */
function tf(){
  clear();view="tf";
  let pool=pick(all.t,999),i=0,right=0,left=60,busy=false;const missed=[];
  if(!pool.length)return empty();
  app.innerHTML=`<div class="stage"><div class="bar-top"><button class="back" type="button" data-act="home">← Avsluta</button><span class="count" id="tfn">0 rätt</span></div>
    <div class="timer" id="tm">60</div><div class="track"><div id="tb" style="width:100%"></div></div>
    <div class="state" id="st"></div>
    <div class="btnrow big"><button class="btn no" type="button" id="bf">Falskt</button><button class="btn ok" type="button" id="bs">Sant</button></div>
    <p class="muted mono">Tangenter: F och S</p></div>`;
  const st=document.getElementById("st");
  function show(){st.className="state";st.textContent=pool[i].s}
  function ans(v){
    if(busy||left<=0)return;const q=pool[i],ok=q.v===v;busy=true;
    mark(q.id,ok);if(ok)right++;else missed.push({h:q.s,e:(q.v?"Sant. ":"Falskt. ")+q.e});
    st.classList.add(ok?"right":"wrong");document.getElementById("tfn").textContent=right+" rätt";
    setTimeout(()=>{busy=false;i++;if(i>=pool.length){pool=shuffle(pool);i=0}if(left>0&&view==="tf")show()},ok?220:520);
  }
  document.getElementById("bf").onclick=()=>ans(false);document.getElementById("bs").onclick=()=>ans(true);
  keyh=e=>{const k=e.key.toLowerCase();if(k==="f"||e.key==="ArrowLeft")ans(false);else if(k==="s"||e.key==="ArrowRight")ans(true)};
  timers.push(setInterval(()=>{left--;document.getElementById("tm").textContent=left;document.getElementById("tb").style.width=(100*left/60)+"%";
    if(left<=0){save();result({title:"Sant eller falskt",score:right,of:null,unit:"rätt på 60 sekunder",xp:right*5,missed,again:tf})}},1000));
  show();
}

/* ---------- para ihop ---------- */
function match(){
  clear();view="match";
  const set=shuffle(all.c.filter(inScope)).slice(0,6);
  if(set.length<2)return empty();
  const defs=shuffle(set);let sel=null,done=0,errs=0,sec=0;const bad=new Set();
  app.innerHTML=`<div class="stage"><div class="bar-top"><button class="back" type="button" data-act="home">← Avsluta</button><span class="count" id="mt">0 s · 0 fel</span></div>
    <p class="muted">Välj ett begrepp och sedan förklaringen som hör till.</p>
    <div class="match"><div class="col">${set.map(c=>`<button class="tile t" type="button" data-t="${c.id}">${esc(c.t)}</button>`).join("")}</div>
    <div class="col">${defs.map(c=>`<button class="tile d" type="button" data-d="${c.id}">${esc(c.d)}</button>`).join("")}</div></div></div>`;
  const stat=()=>document.getElementById("mt").textContent=sec+" s · "+errs+" fel";
  timers.push(setInterval(()=>{sec++;stat()},1000));
  app.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{if(b.classList.contains("done"))return;app.querySelectorAll(".tile.sel").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");sel=b.dataset.t});
  app.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{
    if(!sel||b.classList.contains("done"))return;
    if(b.dataset.d===sel){const t=app.querySelector(`[data-t="${sel}"]`);[t,b].forEach(x=>{x.classList.remove("sel");x.classList.add("done");x.disabled=true});sel=null;done++;
      if(done===set.length){set.forEach(c=>mark(c.id,!bad.has(c.id)));save();
        result({title:"Para ihop",score:sec,of:null,unit:"sekunder, "+errs+" fel",xp:Math.max(10,60-errs*5),missed:set.filter(c=>bad.has(c.id)).map(c=>({h:c.t,e:c.d})),again:match})}}
    else{errs++;bad.add(sel);stat();b.classList.remove("shake");void b.offsetWidth;b.classList.add("shake")}
  });
}

/* ---------- result ---------- */
function result(r){
  clear();view="result";
  store.log.push({t:Date.now(),m:r.title,s:r.score,o:r.of,x:r.xp});save();meters();sync();
  const rev=r.missed.length?`<h2>Det här kommer tillbaka</h2><div class="review">${r.missed.map(m=>`<article><b>${esc(m.h)}</b>${esc(m.e)}</article>`).join("")}</div>`:`<p class="muted">Inga fel den här rundan.</p>`;
  app.innerHTML=`<div class="stage"><span class="eyebrow">${r.title} · klart</span>
    <div class="score">${r.score}${r.of!==null?`<small> / ${r.of}</small>`:""}</div>
    <p class="muted">${r.unit?r.unit+" · ":""}+${r.xp} poäng</p>
    <div class="btnrow"><button class="btn" type="button" data-act="home">Till start</button><button class="btn primary" type="button" id="again">En runda till</button></div>
    ${rev}</div>`;
  document.getElementById("again").onclick=r.again;
  window.scrollTo(0,0);
}
function empty(){app.innerHTML=`<div class="stage"><h2>Välj minst ett område</h2><p class="muted">Inget område är valt, så det finns inget att öva på.</p><div class="btnrow one"><button class="btn primary" type="button" data-act="home">Till start</button></div></div>`}

/* ---------- historik och synk ---------- */
function stats(){
  clear();view="stats";meters();
  let r=0,w=0;for(const id in store.res){r+=store.res[id].r||0;w+=store.res[id].w||0}
  const acc=r+w?Math.round(100*r/(r+w)):0;
  const days=xpByDay(),cells=[];
  for(let k=13;k>=0;k--){const d=new Date();d.setDate(d.getDate()-k);const x=days[dayKey(d)]||0;
    cells.push(`<div class="${x>=150?"l3":x>=60?"l2":x>0?"l1":""}${k===0?" today":""}" title="${dayKey(d)}: ${x} p"></div>`)}
  const fmt=t=>{const d=new Date(t);return d.getDate()+"/"+(d.getMonth()+1)+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
  const recent=store.log.slice(-8).reverse().map(l=>`<article><span><b>${esc(l.m)}</b> · ${l.s}${l.o!=null?" / "+l.o:l.m==="Para ihop"?" s":" rätt"}</span><span>${fmt(l.t)}</span></article>`).join("");
  const hard=Object.keys(store.res).filter(id=>byId[id]&&store.res[id].w>0&&store.res[id].l===0).sort((a,b)=>store.res[b].w-store.res[a].w).slice(0,6)
    .map(id=>`<article><span>${esc(byId[id].label)}</span><span>${store.res[id].w} fel</span></article>`).join("");
  app.innerHTML=`<div class="stage">
    <div class="bar-top"><button class="back" type="button" data-act="home">← Till start</button></div>
    <h1>Historik</h1>
    <div class="nums"><div><b>${store.log.length}</b><span>rundor</span></div><div><b>${r+w}</b><span>svar</span></div><div><b>${acc}%</b><span>rätt</span></div></div>
    <div><p class="eyebrow" style="margin-bottom:8px">Senaste 14 dagarna</p><div class="strip">${cells.join("")}</div></div>
    <h2>Senaste rundorna</h2>
    <div class="list">${recent||`<p class="muted">Inga rundor än. Spela en så dyker den upp här.</p>`}</div>
    <h2>Svårast just nu</h2>
    <div class="list">${hard||`<p class="muted">Inget du senast svarade fel på.</p>`}</div>
    <h2>Synk mellan enheter</h2>
    <p class="muted">Framstegen sparas på servern under din synkkod. Skriv in samma kod på en annan enhet för att fortsätta där. Koden är din nyckel, så dela den inte.</p>
    <div class="codebox"><code id="code">${esc(store.code)}</code><button class="btn" type="button" id="copy">Kopiera</button></div>
    <p class="status ${syncState.cls}" id="sync-status">${esc(syncState.msg)}</p>
    <div class="btnrow one"><button class="btn primary" type="button" id="sync-now">Synka nu</button></div>
    <h2>Har du redan en kod?</h2>
    <form class="codebox" id="link"><input id="code-in" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PLUGG-XXXX-XXXX-XXXX-XXXX-XXXX" aria-label="Synkkod"><button class="btn" type="submit">Koppla enheten</button></form>
    <p class="status" id="link-status"></p>
  </div>`;
  document.getElementById("sync-now").onclick=()=>sync().then(()=>{if(view==="stats")stats()});
  document.getElementById("copy").onclick=async e=>{
    try{await navigator.clipboard.writeText(store.code);e.target.textContent="Kopierad"}
    catch(_){const r=document.createRange();r.selectNodeContents(document.getElementById("code"));const s=getSelection();s.removeAllRanges();s.addRange(r)}
  };
  document.getElementById("link").onsubmit=async e=>{
    e.preventDefault();const st=document.getElementById("link-status");
    const v=document.getElementById("code-in").value.trim().toUpperCase();
    if(!/^PLUGG(-[A-Z2-9]{4}){5}$/.test(v)){st.className="status err";st.textContent="Koden ska se ut som PLUGG-XXXX-XXXX-XXXX-XXXX-XXXX.";return}
    const old=store.code;store.code=v;save();
    const ok=await sync();
    if(!ok){store.code=old;save();st.className="status err";st.textContent="Det gick inte att nå servern. Försök igen."}
    else if(view==="stats")stats();
  };
}

const routes={home,cards,quiz,cases,match,tf,stats};
app.addEventListener("click",e=>{
  const a=e.target.closest("[data-act]");if(a){routes[a.dataset.act]();window.scrollTo(0,0);return}
  const c=e.target.closest("[data-area]");if(c){const k=c.dataset.area,i=store.areas.indexOf(k);if(i>=0)store.areas.splice(i,1);else store.areas.push(k);save();home()}
});
document.getElementById("home-btn").onclick=home;
home();
sync().then(()=>{if(view==="home")home();else if(view==="stats")stats()});
if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("/sw.js").catch(()=>{});
