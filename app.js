
// ===== DỮ LIỆU: 2 bộ câu hỏi (siquan / qncn). Mỗi câu: id, no (số gốc), q, opts[], ans[] (chỉ số phương án đúng; >1 phần tử = chọn nhiều) =====
let BANKS = window.__BANKS__ || {};
const SEG = 50, LET = "ABCDEFGH", HKEY = "ontap-ctri-history-v1";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pad = n => String(n).padStart(2,"0");
const fmtT = s => `${pad(Math.floor(s/60))}:${pad(s%60)}`;
const keyOf = it => it.q.ans.map(a=>LET[it.opts.indexOf(a)]).sort().join(", ");
const same = (a,b) => a.length===b.length && a.every(x=>b.includes(x));
const shuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const isAllAbove = o => /tất cả|cả a,? b|cả ba|cả hai|các đáp án trên|phương án trên/i.test(o) && o.length < 60;

/* ---------- theme ---------- */
(function(){ const r=document.documentElement; let s=null; try{s=localStorage.getItem("ctri-theme");}catch(e){} if(s==="dark"||s==="light") r.setAttribute("data-theme",s);
  $("#themeBtn").addEventListener("click",()=>{ const d=r.getAttribute("data-theme")==="dark"||(!r.getAttribute("data-theme")&&matchMedia("(prefers-color-scheme: dark)").matches); const n=d?"light":"dark"; r.setAttribute("data-theme",n); try{localStorage.setItem("ctri-theme",n);}catch(e){} }); })();

/* ---------- state ---------- */
const state = { bank: "siquan", screen: "home" };
let memHist = [];
function bank(){ return BANKS[state.bank]; }
function Q(){ return bank().questions; }
function segCount(){ return Math.ceil(Q().length / SEG); }
function segQs(i){ return Q().slice(i*SEG, (i+1)*SEG); }
function topics(){ return bank().topics; }
function rules(){ return bank().rules; }
function topicQs(i){ return Q().filter(q=>q.t===i); }
function tipHtml(q){ return q.tip ? `<div class="tip"><span class="ic">💡</span><span><b>Mẹo nhớ:</b> ${esc(q.tip)}</span></div>` : ""; }
function show(id){ $$(".screen").forEach(s=>s.hidden = s.id !== "s-"+id); state.screen=id; window.scrollTo({top:0}); }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),2200); }
function confirmDlg(title, text){ const d0=$("#dlg"); if(typeof d0.showModal!=="function") return Promise.resolve(window.confirm(title+"\n"+text)); return new Promise(res=>{ const d=$("#dlg"); $("#dlgT").textContent=title; $("#dlgP").textContent=text; const y=$("#dlgYes"), n=$("#dlgNo"); const done=v=>{ d.close(); y.onclick=n.onclick=null; res(v); }; y.onclick=()=>done(true); n.onclick=()=>done(false); d.showModal(); }); }

/* ---------- history ---------- */
function loadHist(){ try{ const v=localStorage.getItem(HKEY); if(v) return JSON.parse(v);}catch(e){} return memHist; }
function saveHist(h){ memHist=h; try{ localStorage.setItem(HKEY, JSON.stringify(h)); }catch(e){} }
function recordAttempt(a){ const h=loadHist(); h.unshift(a); saveHist(h.slice(0,200)); }
function renderHist(){
  const h=loadHist().filter(a=>a.bank===state.bank); const ul=$("#histList"); ul.innerHTML=""; $("#histEmpty").hidden = h.length>0;
  h.slice(0,30).forEach(a=>{ const p=Math.round(a.right/a.total*100); const li=document.createElement("li");
    li.innerHTML=`<span class="sc ${p<50?"low":p<80?"mid":""}">${p}%</span><span class="m">${esc(a.label)} · ${a.right}/${a.total} đúng · ${fmtT(a.secs)}</span><span class="t">${new Date(a.at).toLocaleString("vi-VN",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"})}</span>`; ul.appendChild(li); });
}
$("#clearHist").addEventListener("click", async()=>{ if(await confirmDlg("Xoá lịch sử?","Toàn bộ lịch sử làm bài của cả hai bộ sẽ bị xoá.")){ saveHist([]); renderHist(); renderHome(); toast("Đã xoá lịch sử"); } });

/* ---------- home ---------- */
function lvColor(p){ return `hsl(${Math.round(p*1.2)} 72% ${p>=70?36:44}%)`; }
function lvHtml(best){ const p=best??0; return `<span class="lv" style="--lc:${best===null?"var(--line)":lvColor(p)}"><span class="bar"><i style="width:${p}%"></i></span><span class="pct">${best===null?"Chưa luyện":"Tốt nhất "+best+"%"}</span></span>`; }
function bestFor(label){ const h=loadHist().filter(a=>a.bank===state.bank && a.label===label); if(!h.length) return null; return h.reduce((m,a)=>Math.max(m, Math.round(a.right/a.total*100)),0); }
function renderHome(){
  const qs=Q(), multi=qs.filter(q=>q.ans.length>1).length;
  $("#heroTitle").textContent = bank().name;
  $("#heroStats").innerHTML = `<div class="stat"><b>${qs.length}</b>câu hỏi</div><div class="stat"><b>${segCount()}</b>đoạn luyện tập</div><div class="stat"><b>${multi}</b>câu chọn nhiều đáp án</div><div class="stat"><b>${loadHist().filter(a=>a.bank===state.bank).length}</b>lượt đã làm</div>`;
  $("#segs").innerHTML = Array.from({length:segCount()},(_,i)=>{ const a=i*SEG+1, b=Math.min((i+1)*SEG, qs.length); const best=bestFor(`Đoạn ${i+1}`);
    return `<button class="seg" type="button" data-seg="${i}"><span class="n"><i>${i+1}</i>Đoạn ${i+1}</span><span class="r">Câu ${a} – ${b} · ${b-a+1} câu</span>${lvHtml(best)}</button>`; }).join("");
  $("#topics").innerHTML = topics().map((tp,i)=>{ const n=topicQs(i).length; const best=bestFor(`Chủ đề ${i+1}`);
    return `<button class="topic" type="button" data-topic="${i}"><i>${i+1}</i><span class="n">${esc(tp.name)}</span><span class="pk">${tp.pick} câu/đề</span><span class="r">${n} câu · số ${tp.from}–${tp.to}</span>${lvHtml(best)}</button>`; }).join("");
  renderHist();
}
$("#topics").addEventListener("click",e=>{ const b=e.target.closest(".topic"); if(!b) return; const i=+b.dataset.topic; startPractice(null, topicQs(i).map(q=>({q, opts:q.opts.map((o,k)=>k)})), `Chủ đề ${i+1}`, topics()[i].name); });
$$(".bankseg button").forEach(b=>b.addEventListener("click",()=>{ state.bank=b.dataset.bank; $$(".bankseg button").forEach(x=>x.classList.toggle("on",x===b)); renderHome(); if(state.screen==="list") renderList(); if(state.screen==="exam") fillScope(); if(state.screen!=="home"&&state.screen!=="list"&&state.screen!=="exam") show("home"); }));
$("#homeBtn").addEventListener("click",()=>goHome()); $("#homeBtn2").addEventListener("click",()=>goHome());
async function goHome(){ if((state.screen==="practice"||state.screen==="taking") && !(await confirmDlg("Thoát bài đang làm?","Tiến độ bài hiện tại sẽ không được lưu."))) return; stopTimers(); renderHome(); show("home"); }
$$(".mode").forEach(m=>m.addEventListener("click",()=>{ const g=m.dataset.go; if(g==="list"){ $("#lShow").checked=false; $("#lTips").checked=false; document.body.classList.remove("showans","showtips"); renderList(); show("list"); } else if(g==="tips"){ $("#lShow").checked=true; $("#lTips").checked=true; document.body.classList.add("showans","showtips"); renderList(); show("list"); } else if(g==="exam"){ fillScope(); show("exam"); } else { $("#segs").scrollIntoView({behavior:"smooth"}); } }));
$("#segs").addEventListener("click",e=>{ const b=e.target.closest(".seg"); if(b) startPractice(+b.dataset.seg); });

/* ---------- practice ---------- */
let P=null, pTick=null;
function stopTimers(){ clearInterval(pTick); clearInterval(tTick); pTick=tTick=null; }
function startPractice(segIdx, items, label, sub){
  const list = items || segQs(segIdx).map(q=>({q, opts:q.opts.map((o,i)=>i)}));
  const lab = label || `Đoạn ${segIdx+1}`;
  P={seg:segIdx, base:items||null, items:list, i:0, picked:list.map(()=>[]), status:list.map(()=>null), flags:new Set(), secs:0, label: lab, sub: sub||""};
  $("#pTitle").textContent = `${bank().name} · ${lab}`;
  $("#pSub").textContent = sub || (segIdx!==null ? `Câu ${segIdx*SEG+1} – ${Math.min((segIdx+1)*SEG, Q().length)} · chọn đáp án để biết đúng/sai ngay` : "");
  stopTimers(); pTick=setInterval(()=>{P.secs++; $("#pTimer").textContent=fmtT(P.secs);},1000); $("#pTimer").textContent="00:00";
  show("practice"); renderP();
}
function renderP(){
  const it=P.items[P.i], q=it.q, multi=q.ans.length>1, st=P.status[P.i], picked=P.picked[P.i];
  $("#pTags").innerHTML = `<span class="tag">Câu ${P.i+1}/${P.items.length}</span><span class="tag red">Câu gốc ${q.id}</span><span class="tag" title="${esc(topics()[q.t].name)}">${esc(topics()[q.t].short)}</span>${multi?`<span class="tag gold">Chọn ${q.ans.length} đáp án</span>`:""}`;
  $("#pQ").innerHTML = `<span class="num">${q.id}.</span>${esc(q.q)}`;
  $("#pOpts").innerHTML = it.opts.map((oi,k)=>{ const sel=picked.includes(oi); let cls=""; if(st!==null){ if(q.ans.includes(oi)) cls="correct"; else if(sel) cls="wrong"; } else if(sel) cls="sel";
    return `<li><button class="opt ${cls}" type="button" data-oi="${oi}" ${st!==null?"disabled":""}><span class="L">${LET[k]}</span><span>${esc(q.opts[oi])}</span>${multi?`<span class="ck">✓</span>`:""}</button></li>`; }).join("");
  const fb=$("#pFb"); if(st===null){ fb.innerHTML=""; $("#pTip").innerHTML=""; } else { const ansTxt=keyOf(it); fb.innerHTML = st ? `<div class="fb ok">✔ Chính xác!</div>` : `<div class="fb bad">✘ Chưa đúng. <span class="ans">Đáp án đúng: <b>${ansTxt}</b></span></div>`; $("#pTip").innerHTML = tipHtml(q); }
  $("#pCheck").hidden = !(multi && st===null); $("#pCheck").disabled = picked.length===0;
  $("#pPrev").disabled = P.i===0; $("#pNext").textContent = P.i===P.items.length-1 ? "Kết thúc" : "Câu tiếp →";
  $("#pFlag").classList.toggle("on", P.flags.has(P.i));
  $("#pProg").style.width = (P.status.filter(s=>s!==null).length/P.items.length*100)+"%";
  const done=P.status.filter(s=>s!==null).length, right=P.status.filter(s=>s===true).length;
  $("#pDone").textContent=`${done}/${P.items.length} đã làm`; $("#pRight").textContent=`✔ ${right}`; $("#pWrong").textContent=`✘ ${done-right}`;
  $("#pCells").innerHTML = P.items.map((_,i)=>`<button class="cell ${P.status[i]===true?"ok":P.status[i]===false?"bad":P.picked[i].length?"done":""} ${i===P.i?"cur":""} ${P.flags.has(i)?"flag":""}" type="button" data-i="${i}">${i+1}</button>`).join("");
}
$("#pOpts").addEventListener("click",e=>{ const b=e.target.closest(".opt"); if(!b||b.disabled) return; const oi=+b.dataset.oi, q=P.items[P.i].q;
  if(q.ans.length>1){ const p=P.picked[P.i]; const k=p.indexOf(oi); if(k>=0) p.splice(k,1); else p.push(oi); renderP(); return; }
  P.picked[P.i]=[oi]; grade(); });
$("#pCheck").addEventListener("click",()=>grade());
function grade(){ const q=P.items[P.i].q; const ok=same(P.picked[P.i], q.ans); P.status[P.i]=ok; renderP(); setTimeout(()=>{ const el=$("#pTip .tip")||$("#pFb"); if(el && window.innerWidth<=760) el.scrollIntoView({behavior:"smooth",block:"nearest"}); },50); if(ok && $("#pAuto").checked && P.i<P.items.length-1){ clearTimeout(P._adv); P._adv=setTimeout(()=>{ if(P && P.status[P.i]===true){ P.i++; renderP(); } },1800); } }
$("#pPrev").addEventListener("click",()=>{ clearTimeout(P._adv); if(P.i>0){P.i--; renderP();} });
$("#pNext").addEventListener("click",()=>{ clearTimeout(P._adv); if(P.i<P.items.length-1){P.i++; renderP();} else finishPractice(); });
$("#pFlag").addEventListener("click",()=>{ P.flags.has(P.i)?P.flags.delete(P.i):P.flags.add(P.i); renderP(); });
$("#pCells").addEventListener("click",e=>{ const c=e.target.closest(".cell"); if(c){ clearTimeout(P._adv); P.i=+c.dataset.i; renderP(); } });
$("#pBack").addEventListener("click",()=>goHome());
$("#pFinish").addEventListener("click",async()=>{ const left=P.status.filter(s=>s===null).length; if(left && !(await confirmDlg("Kết thúc đoạn?",`Còn ${left} câu chưa làm, các câu này sẽ tính là sai.`))) return; finishPractice(); });
function finishPractice(){ stopTimers(); const total=P.items.length, right=P.status.filter(s=>s===true).length;
  recordAttempt({bank:state.bank,label:P.label,right,total,secs:P.secs,at:Date.now()});
  const wrongItems = P.items.filter((_,i)=>P.status[i]!==true); const seg=P.seg, base=P.base, lab=P.label.replace(" (làm lại câu sai)",""), sub=P.sub;
  showResult({title:`${bank().name} · ${P.label}`, right, total, secs:P.secs, rows:P.items.map((it,i)=>({q:it.q, opts:it.opts, picked:P.picked[i], ok:P.status[i]===true})),
    retry:()=>startPractice(seg, base, base?lab:undefined, sub), retryWrong: wrongItems.length? ()=>startPractice(seg, wrongItems, lab+" (làm lại câu sai)", sub) : null}); }

/* ---------- result ---------- */
let R=null;
function showResult(r){ R=r; const p=Math.round(r.right/r.total*100); const pts=r.pts||null; $("#rRing").style.setProperty("--p",p); $("#rPct").textContent=p+"%"; $("#rFrac").textContent=`${r.right}/${r.total}`;
  $("#rTitle").textContent = p>=80?"Xuất sắc! 🎉":p>=50?"Khá tốt, tiếp tục luyện!":"Cần ôn lại kỹ hơn";
  $("#rLine").textContent = r.title + " · thời gian " + fmtT(r.secs);
  $("#rKpis").innerHTML = `<div class="kpi"><b>${r.right}</b>đúng</div><div class="kpi"><b>${r.total-r.right}</b>sai / bỏ trống</div>` + (pts ? `<div class="kpi"><b>${(r.right*pts).toFixed(2).replace(/\.?0+$/,"")}</b>điểm (${pts} đ/câu) · tối đa ${(r.total*pts).toFixed(1)}</div>` : `<div class="kpi"><b>${(r.right/r.total*10).toFixed(1)}</b>điểm / 10</div>`) + (r.note?`<div class="kpi" style="font-size:12px;color:var(--warn)">${esc(r.note)}</div>`:"");
  $("#rRetryWrong").hidden = !r.retryWrong;
  $("#rReview").innerHTML = r.rows.map((row,i)=>`<div class="rv ${row.ok?"ok":""}"><div class="q"><span class="num">${i+1}.</span>${esc(row.q.q)}</div>${row.opts.map((oi,k)=>{ const c=row.q.ans.includes(oi), w=row.picked.includes(oi)&&!c; return `<div class="o ${c?"c":w?"w":""}"><b>${LET[k]}.</b> ${esc(row.q.opts[oi])}${c?" ✔":""}${w?" ✘ (bạn chọn)":""}</div>`; }).join("")}${row.picked.length?"":`<div class="note">Bỏ trống</div>`}${row.q.tip?`<div class="tipline">💡 ${esc(row.q.tip)}</div>`:""}</div>`).join("");
  show("result"); }
$("#rRetry").addEventListener("click",()=>R.retry()); $("#rRetryWrong").addEventListener("click",()=>R.retryWrong&&R.retryWrong()); $("#rHome").addEventListener("click",()=>goHome());

/* ---------- list ---------- */
function fillSegSelect(sel, allLabel){ sel.innerHTML = `<option value="-1">${allLabel}</option>` + Array.from({length:segCount()},(_,i)=>`<option value="${i}">Đoạn ${i+1} (câu ${i*SEG+1}–${Math.min((i+1)*SEG,Q().length)})</option>`).join(""); }
function renderList(){ if($("#lSeg").options.length===0 || $("#lSeg")._bank!==state.bank){ fillSegSelect($("#lSeg"),"Tất cả các đoạn"); $("#lSeg")._bank=state.bank; $("#lTopic").innerHTML=`<option value="-1">Tất cả chủ đề</option>`+topics().map((tp,i)=>`<option value="${i}">${i+1}. ${esc(tp.short)} (${tp.pick} câu/đề)</option>`).join(""); }
  const kw=$("#lSearch").value.trim().toLowerCase(), seg=+$("#lSeg").value, tp=+$("#lTopic").value;
  let qs=Q(); if(seg>=0) qs=segQs(seg); if(tp>=0) qs=qs.filter(q=>q.t===tp);
  if(kw) qs=qs.filter(q=>(q.q+" "+q.opts.join(" ")).toLowerCase().includes(kw));
  const hl = s => kw ? esc(s).replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"), m=>`<mark>${m}</mark>`) : esc(s);
  $("#lCount").textContent = `${qs.length} câu`;
  $("#qlist").innerHTML = qs.map(q=>`<article class="qi"><div class="qh"><span class="num">Câu ${q.id}</span><span class="t">${hl(q.q)}</span>${q.ans.length>1?`<span class="tag gold multi">${q.ans.length} đáp án</span>`:""}</div><ol>${q.opts.map((o,i)=>`<li class="${q.ans.includes(i)?"c":""}"><b>${LET[i]}.</b><span>${hl(o)}</span></li>`).join("")}</ol>${q.tip?`<div class="tipline">💡<span>${esc(q.tip)}</span></div>`:""}<div class="topicline">Chủ đề ${q.t+1}: ${esc(topics()[q.t].short)}</div></article>`).join("") || `<div class="empty">Không có câu nào khớp.</div>`;
}
let lT; $("#lSearch").addEventListener("input",()=>{clearTimeout(lT); lT=setTimeout(renderList,120);}); $("#lSeg").addEventListener("change",renderList); $("#lTopic").addEventListener("change",renderList);
$("#lTips").addEventListener("change",e=>document.body.classList.toggle("showtips",e.target.checked));
$("#lShow").addEventListener("change",e=>document.body.classList.toggle("showans",e.target.checked));
$("#lBack").addEventListener("click",()=>goHome()); $("#lPrint").addEventListener("click",()=>print());

/* ---------- exam: build ---------- */
function examMode(){ return document.querySelector('input[name=eMode]:checked').value; }
function structN(){ return topics().reduce((s,tp)=>s+tp.pick,0); }
function fillScope(){ fillSegSelect($("#eScope"),"Toàn bộ bộ câu hỏi"); $("#eN").max = Q().length; const r=rules(); $("#eT").value=r.mins;
  $("#eStruct").innerHTML = `<table><thead><tr><th>#</th><th>Nội dung</th><th>Câu/đề</th></tr></thead><tbody>${topics().map((tp,i)=>`<tr><td>${i+1}</td><td>${esc(tp.name)}</td><td>${tp.pick}</td></tr>`).join("")}<tr class="ex"><td>+</td><td>${esc(r.extraLabel)} – chưa có trong bộ câu hỏi, do đơn vị bổ sung</td><td>${r.extra}</td></tr><tr class="tot"><td></td><td>Tổng theo quy định (${structN()} câu có sẵn + ${r.extra} câu bổ sung) · ${r.pts} điểm/câu · ${r.mins} phút</td><td>${r.examN}</td></tr></tbody></table>`;
  $("#eFree").hidden = examMode()!=="free"; $("#eStruct").hidden = examMode()==="struct" ? false : true; }
$$('input[name=eMode]').forEach(r=>r.addEventListener("change",()=>{ $("#eFree").hidden = examMode()!=="free"; $("#eStruct").hidden = examMode()!=="struct"; }));
function withOpts(q, sh){ let opts=q.opts.map((_,i)=>i); if(sh){ const tail=opts.filter(i=>isAllAbove(q.opts[i])); const head=shuffle(opts.filter(i=>!tail.includes(i))); opts=head.concat(tail); } return {q, opts}; }
function buildExam(){ const sh=$("#eShuffleOpts").checked;
  if(examMode()==="struct"){ const out=[]; topics().forEach((tp,i)=>{ const pool=shuffle(topicQs(i).slice()); out.push(...pool.slice(0,Math.min(tp.pick,pool.length)).map(q=>withOpts(q,sh))); }); return out; }
  const n=Math.max(1,Math.min(+$("#eN").value||30, Q().length)), scope=+$("#eScope").value;
  let pool = scope>=0 ? segQs(scope) : Q(); return shuffle(pool.slice()).slice(0, Math.min(n,pool.length)).map(q=>withOpts(q,sh)); }
$("#eBack").addEventListener("click",()=>goHome());

/* ---------- exam: take ---------- */
let T=null, tTick=null;
$("#eStart").addEventListener("click",()=>{ const items=buildExam(); const mins=Math.max(1,+$("#eT").value||30);
  T={items, picked:items.map(()=>[]), left:mins*60, secs:0, code:String(Math.floor(100+Math.random()*900)), struct: examMode()==="struct"};
  $("#tTitle").textContent=`Đề kiểm tra · Mã đề ${T.code}`; $("#tSub").textContent=`${bank().name} · ${items.length} câu${T.struct?" (theo cấu trúc chính thức)":""} · ${mins} phút`;
  $("#tList").innerHTML = items.map((it,i)=>`<article class="eq" id="eq${i}"><div class="tags"><span class="tag">Câu ${i+1}</span><span class="tag" style="background:var(--surface-2);color:var(--ink-3)">${esc(topics()[it.q.t].short)}</span>${it.q.ans.length>1?`<span class="tag gold">Chọn ${it.q.ans.length} đáp án</span>`:""}</div><p class="qtext">${esc(it.q.q)}</p><ul class="opts">${it.opts.map((oi,k)=>`<li><button class="opt" type="button" data-i="${i}" data-oi="${oi}"><span class="L">${LET[k]}</span><span>${esc(it.q.opts[oi])}</span>${it.q.ans.length>1?`<span class="ck">✓</span>`:""}</button></li>`).join("")}</ul></article>`).join("");
  stopTimers(); $("#tTimer").classList.remove("low"); $("#tTimer").textContent=fmtT(T.left);
  tTick=setInterval(()=>{ T.left--; T.secs++; $("#tTimer").textContent=fmtT(T.left); if(T.left<=60) $("#tTimer").classList.add("low"); if(T.left<=0){ toast("Hết giờ! Bài được nộp tự động."); submitExam(); } },1000);
  renderT(); show("taking"); });
function renderT(){ T.items.forEach((it,i)=>{ $$(`#eq${i} .opt`).forEach(b=>b.classList.toggle("sel", T.picked[i].includes(+b.dataset.oi))); });
  const done=T.picked.filter(p=>p.length).length; $("#tDone").textContent=`${done}/${T.items.length} đã trả lời`; $("#tProg").style.width=(done/T.items.length*100)+"%";
  $("#tCells").innerHTML=T.items.map((_,i)=>`<button class="cell ${T.picked[i].length?"done":""}" type="button" data-i="${i}">${i+1}</button>`).join(""); }
$("#tList").addEventListener("click",e=>{ const b=e.target.closest(".opt"); if(!b) return; const i=+b.dataset.i, oi=+b.dataset.oi, q=T.items[i].q;
  if(q.ans.length>1){ const p=T.picked[i]; const k=p.indexOf(oi); if(k>=0)p.splice(k,1); else p.push(oi); } else T.picked[i]=[oi]; renderT(); });
$("#tCells").addEventListener("click",e=>{ const c=e.target.closest(".cell"); if(c) document.getElementById("eq"+c.dataset.i).scrollIntoView({behavior:"smooth",block:"start"}); });
async function askSubmit(){ const left=T.picked.filter(p=>!p.length).length; if(left && !(await confirmDlg("Nộp bài?",`Còn ${left} câu chưa trả lời.`))) return; submitExam(); }
$("#tSubmit").addEventListener("click",askSubmit); $("#tSubmit2").addEventListener("click",askSubmit);
$("#tQuit").addEventListener("click",()=>goHome());
function submitExam(){ stopTimers(); const rows=T.items.map((it,i)=>({q:it.q,opts:it.opts,picked:T.picked[i],ok:same(T.picked[i],it.q.ans)})); const right=rows.filter(r=>r.ok).length;
  recordAttempt({bank:state.bank,label:`Đề ${T.code} (${T.items.length} câu)`,right,total:T.items.length,secs:T.secs,at:Date.now()});
  const r=rules(); showResult({title:`Đề kiểm tra mã ${T.code}${T.struct?" · theo cấu trúc chính thức":""}`,right,total:T.items.length,secs:T.secs,rows,retry:()=>{ $("#eStart").click(); },retryWrong:null,
    pts: T.struct ? r.pts : null, note: T.struct ? `Đề chính thức có thêm ${r.extra} câu ${r.extraLabel.split(",")[0]}… (${(r.extra*r.pts).toFixed(1)} điểm) chưa có trong bộ câu hỏi.` : ""}); }

/* ---------- exam: export .docx (tự tạo file Word, không cần thư viện) ---------- */
const CRC_T = (()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c>>>8); return (c ^ 0xFFFFFFFF)>>>0; }
function zipStore(files){ // files: [{name, data:string}] -> Blob (ZIP, method store)
  const enc=new TextEncoder(); const parts=[]; const cd=[]; let off=0;
  const u16=n=>[n&255,(n>>8)&255], u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
  for(const f of files){ const name=enc.encode(f.name), data=enc.encode(f.data), crc=crc32(data);
    const lh=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)]);
    parts.push(lh,name,data);
    cd.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]), name);
    off += lh.length+name.length+data.length; }
  const cdStart=off; let cdLen=0; cd.forEach(x=>cdLen+=x.length);
  const eocd=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(cdStart),...u16(0)]);
  return new Blob([...parts,...cd,eocd],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}); }
const X = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function wP(runs, o={}){ // runs: [{t, b, i}] ; o: {align, ind, before, after, size}
  const pPr = `<w:pPr>${o.align?`<w:jc w:val="${o.align}"/>`:""}<w:spacing w:before="${o.before??0}" w:after="${o.after??60}" w:line="300" w:lineRule="auto"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:""}</w:pPr>`;
  return `<w:p>${pPr}${runs.map(r=>`<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${r.b?"<w:b/>":""}${r.i?"<w:i/>":""}<w:sz w:val="${o.size??26}"/></w:rPr><w:t xml:space="preserve">${X(r.t)}</w:t></w:r>`).join("")}</w:p>`; }
function wTable(rows){ const tc = s => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${wP([{t:s}],{align:"center",after:0})}</w:tc>`;
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>${rows.map(r=>`<w:tr>${r.map(tc).join("")}</w:tr>`).join("")}</w:tbl>`; }
function docx(bodyXml){ return zipStore([
  {name:"[Content_Types].xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`},
  {name:"_rels/.rels", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`},
  {name:"word/document.xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`}]); }
function keyRows(items, per){ const cells=items.map((it,i)=>[String(i+1), keyOf(it)]); const rows=[]; for(let i=0;i<cells.length;i+=per){ const g=cells.slice(i,i+per); rows.push(g.map(c=>c[0])); rows.push(g.map(c=>c[1])); } return rows; }
function examDocx(items, code, withKey){ const title=$("#xTitle").value||"ĐỀ KIỂM TRA"; const mins=+$("#eT").value||30;
  let b = wP([{t:title,b:true}],{align:"center",size:30,after:80}) + wP([{t:`${bank().name} · Mã đề: ${code} · Số câu: ${items.length}${examMode()==="struct"?` (+${rules().extra} câu ${rules().extraLabel.split(",")[0]} do đơn vị bổ sung)`:""} · Thời gian: ${mins} phút · ${examMode()==="struct"?rules().pts+" điểm/câu":""}`}],{align:"center",after:80}) + wP([{t:"Họ và tên: ……………………………………………  Đơn vị: ………………………………………"}],{align:"center",after:200});
  items.forEach((it,i)=>{ b += wP([{t:`Câu ${i+1}. `,b:true},{t:it.q.q},...(it.q.ans.length>1?[{t:` (chọn ${it.q.ans.length} đáp án)`,i:true}]:[])],{before:120,after:40,align:"both"}); it.opts.forEach((oi,k)=>{ b += wP([{t:`${LET[k]}. ${it.q.opts[oi]}`}],{ind:360,after:20}); }); });
  if(withKey){ b += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>` + wP([{t:`ĐÁP ÁN – MÃ ĐỀ ${code}`,b:true}],{align:"center",size:28,after:160}) + wTable(keyRows(items,10)); }
  return docx(b); }
function keysDocx(keys){ let b = wP([{t:`BẢNG ĐÁP ÁN – ${bank().name}`,b:true}],{align:"center",size:30,after:200}); keys.forEach(k=>{ b += wP([{t:`Mã đề ${k.code}`,b:true}],{before:160,after:80}) + wTable(keyRows(k.items,10)); }); return docx(b); }
async function saveFile(name, blob){ let dl=null; try{ if(window.claude && claude.use) dl = await claude.use("downloads"); }catch(e){ dl=null; }
  if(dl){ try{ await dl.save({filename:name, data:blob}); return true; }catch(e){ if(e&&e.code==="declined") return false; if(e&&e.code!=="unavailable"&&e.code!=="not_granted"){ toast("Không lưu được: "+(e.message||e.code)); return false; } } }
  const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); return true; }
$("#xGo").addEventListener("click",async()=>{ const n=Math.max(1,Math.min(20,+$("#xCount").value||1)), start=+$("#xStart").value||101, withKey=$("#xKey").checked, keyFile=$("#xKeyFile").checked; const keys=[]; let saved=0;
  for(let k=0;k<n;k++){ const code=String(start+k).padStart(3,"0"); const items=buildExam(); keys.push({code, items}); if(await saveFile(`De_${state.bank}_${code}.docx`, examDocx(items, code, withKey))) saved++; await new Promise(r=>setTimeout(r,400)); }
  if(keyFile) await saveFile(`DapAn_${state.bank}_${String(start).padStart(3,"0")}-${String(start+n-1).padStart(3,"0")}.docx`, keysDocx(keys));
  toast(`Đã tạo ${saved}/${n} đề${keyFile?" + file đáp án":""}`); });
function previewHtml(items, code, withKey){ const title=esc($("#xTitle").value||"ĐỀ KIỂM TRA"); const mins=+$("#eT").value||30;
  return `<html><head><meta charset="utf-8"><title>${title} - Mã đề ${code}</title><style>body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.4;max-width:800px;margin:30px auto}h1{text-align:center;font-size:15pt;margin:0}.hd{text-align:center;margin-bottom:14pt}.q{margin:9pt 0 2pt;text-align:justify}.o{margin:0 0 0 18pt}table{border-collapse:collapse;margin:0 auto}td{border:1px solid #000;padding:3pt 10pt;text-align:center}</style></head><body><div class="hd"><h1>${title}</h1><p><b>${esc(bank().name)}</b> · Mã đề: <b>${code}</b> · Số câu: ${items.length} · Thời gian: ${mins} phút</p></div>${items.map((it,i)=>`<p class="q"><b>Câu ${i+1}.</b> ${esc(it.q.q)}${it.q.ans.length>1?` <i>(chọn ${it.q.ans.length} đáp án)</i>`:""}</p>${it.opts.map((oi,k)=>`<p class="o">${LET[k]}. ${esc(it.q.opts[oi])}</p>`).join("")}`).join("")}${withKey?`<h2 style="text-align:center">ĐÁP ÁN – MÃ ĐỀ ${code}</h2><table>${keyRows(items,10).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</table>`:""}</body></html>`; }
$("#xPreview").addEventListener("click",()=>{ const w=window.open("","_blank"); if(!w){ toast("Trình duyệt chặn cửa sổ mới"); return; } w.document.write(previewHtml(buildExam(), String(+$("#xStart").value||101).padStart(3,"0"), $("#xKey").checked)); w.document.close(); });

/* ---------- mobile: bottom sheet navigator ---------- */
function openSheet(which){ const side=$(which==="practice"?"#s-practice .side":"#s-taking .side"); side.classList.add("open"); $("#sheetbg").classList.add("show"); }
function closeSheets(){ $$(".side.open").forEach(s=>s.classList.remove("open")); $("#sheetbg").classList.remove("show"); }
$$(".mnav").forEach(b=>b.addEventListener("click",()=>openSheet(b.dataset.sheet)));
$("#sheetbg").addEventListener("click",closeSheets);
$("#pCells").addEventListener("click",e=>{ if(e.target.closest(".cell")) closeSheets(); });
$("#tCells").addEventListener("click",e=>{ if(e.target.closest(".cell")) closeSheets(); });
$("#pFinish").addEventListener("click",closeSheets); $("#tSubmit2").addEventListener("click",closeSheets);
const _renderP=renderP; renderP=function(){ _renderP(); $("#pMini").textContent=`${P.status.filter(s=>s!==null).length}/${P.items.length}`; };
const _renderT=renderT; renderT=function(){ _renderT(); $("#tMini").textContent=`${T.picked.filter(p=>p.length).length}/${T.items.length}`; };
(function(){ const b=$("#iosBanner"); if(!b) return; let hid=false; try{ hid=localStorage.getItem("ctri-ios-banner")==="1"; }catch(e){} if(hid) b.classList.add("hide"); b.querySelector("button").addEventListener("click",()=>{ b.classList.add("hide"); try{localStorage.setItem("ctri-ios-banner","1");}catch(e){} }); })();

(function(){ try{ if(localStorage.getItem("ctri-auto")==="0") $("#pAuto").checked=false; }catch(e){} $("#pAuto").addEventListener("change",e=>{ try{ localStorage.setItem("ctri-auto", e.target.checked?"1":"0"); }catch(x){} }); })();

(function(){ const f=()=>document.documentElement.style.setProperty("--toph", $(".top").offsetHeight+"px"); f(); window.addEventListener("resize",f); window.addEventListener("load",f); setTimeout(f,300); })();

/* ---------- nạp dữ liệu JSON + khởi động ---------- */
const BANK_FILES = { siquan: "data/siquan.json", qncn: "data/qncn.json" };
async function loadBanks(){
  if (window.__BANKS__ && Object.keys(window.__BANKS__).length) { BANKS = window.__BANKS__; return; }
  const out = {};
  for (const [k,u] of Object.entries(BANK_FILES)) { const r = await fetch(u); if(!r.ok) throw new Error(u+" → "+r.status); out[k] = await r.json(); }
  BANKS = out;
}
loadBanks().then(()=>{ renderHome(); show("home"); }).catch(err=>{
  $("#s-home").innerHTML = '<div class="empty">Không tải được file dữ liệu JSON ('+esc(err.message)+').<br>Hãy chạy web qua máy chủ, ví dụ: <b>python3 -m http.server</b> rồi mở <b>http://localhost:8000</b> (mở trực tiếp file:// trình duyệt sẽ chặn fetch). Hoặc dùng bản <b>on-luyen-standalone.html</b>.</div>';
});
