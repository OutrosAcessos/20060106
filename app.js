(() => {
"use strict";
const KEY = "jm_planner_v1";
const THEME_KEY = "jm_theme";
const $ = (id) => document.getElementById(id);
const iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const plusDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+n); return iso(d); };
const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "t" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const icon = (name) => `<svg class="ico"><use href="#i-${name}"/></svg>`;
const mqDrawer = window.matchMedia("(max-width: 960px)");

const CATS = {"Universidade":"u","Programação":"p","Cibersegurança":"c","Inglês":"i","EduMind":"e","Pessoal":"x"};
const catKey = (c) => CATS[c] || "x";

const defaultSchedule = [
["06:30","07:00","Acordar e preparar o dia","Higiene, água, pequeno-almoço e organização."],
["07:00","08:15","Bloco de estudo 1","Disciplina prioritária; resolver exercícios sem consultar a solução primeiro."],
["08:15","08:30","Pausa","Levantar, descansar a vista e respirar."],
["08:30","09:15","Bloco de estudo 2","Segunda disciplina ou revisão das aulas."],
["09:15","09:40","Inglês","Escuta, vocabulário e falar ou escrever um pouco."],
["09:40","10:25","Desenvolvimento profissional","Programação, cibersegurança ou EduMind conforme o dia."],
["10:25","11:00","Preparar e sair","Mochila, alimentação e deslocação."],
["11:00","12:00","Caminho para a universidade","Áudio de inglês opcional, apenas se for seguro e confortável."],
["12:00","13:00","Almoço e preparação","Almoçar, descansar e preparar as aulas."],
["13:00","17:00","Aulas universitárias","Participar, apontar dúvidas e marcar matéria para rever."],
["17:00","21:00","Regresso a casa","Deslocação e outras necessidades do percurso."],
["21:00","22:00","Jantar e descanso","Comer, tomar banho e desligar um pouco."],
["22:00","22:15","Fecho do dia","Preparar mochila e escolher a prioridade de amanhã."],
["22:15","06:30","Sono","Proteger o descanso."]
];
const seedGoals = [
{title:"Estabilizar rotina universitária",area:"Universidade",desc:"Rever as seis disciplinas e identificar lacunas.",done:false},
{title:"Recuperar fundamentos de programação",area:"Programação",desc:"Praticar condições, ciclos, funções e estruturas de dados.",done:false},
{title:"Construir fundamentos de cibersegurança",area:"Cibersegurança",desc:"Redes, Linux, permissões e segurança defensiva.",done:false},
{title:"Praticar inglês regularmente",area:"Inglês",desc:"Escuta, vocabulário, leitura e conversação.",done:false},
{title:"Definir e construir o MVP do EduMind",area:"EduMind",desc:"Uma funcionalidade pequena, útil e demonstrável.",done:false}
];
const seedTasks = () => [
{id:uid(),title:"Rever Estrutura de Dados 1",category:"Universidade",date:iso(),time:"07:00",duration:75,details:"Listar dúvidas e resolver exercícios.",reminder:false,done:false},
{id:uid(),title:"Praticar inglês",category:"Inglês",date:iso(),time:"09:15",duration:25,details:"Escutar, anotar cinco palavras e falar durante cinco minutos.",reminder:false,done:false},
{id:uid(),title:"Rever a matéria das aulas",category:"Universidade",date:plusDays(iso(),1),time:"08:30",duration:45,details:"Ajustar à disciplina prioritária.",reminder:false,done:false}
];
const freshState = () => ({tasks:seedTasks(),goals:seedGoals.map(x=>({...x})),schedule:defaultSchedule.map((x,i)=>({id:i,start:x[0],end:x[1],title:x[2],detail:x[3]})),startDate:iso(),dailyReminder:"08:00",notes:{wins:"",challenges:"",next:""}});

let state = load();
let calendarDate = new Date(); calendarDate.setDate(1);
let selectedDate = iso();
let deferredInstall = null;
let toastTimer = null;
const notified = new Set();

function normalize(s){
  const base = freshState();
  s = s && typeof s === "object" ? s : base;
  s.tasks = Array.isArray(s.tasks) ? s.tasks : [];
  const seen = new Set();
  s.tasks.forEach(t => { if(!t.id || seen.has(t.id)) t.id = uid(); seen.add(t.id); }); // corrige ids em falta/duplicados
  s.goals = Array.isArray(s.goals) ? s.goals : base.goals;
  s.schedule = Array.isArray(s.schedule) && s.schedule.length ? s.schedule : base.schedule;
  s.startDate = s.startDate || iso();
  s.dailyReminder = s.dailyReminder || "08:00";
  s.notes = s.notes || base.notes;
  return s;
}
function load(){ try{ const raw = localStorage.getItem(KEY); if(raw) return normalize(JSON.parse(raw)); }catch(e){} return freshState(); }
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); $("saveState").textContent = "Guardado às " + new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}); }
  catch(e){ $("saveState").textContent = "Não foi possível guardar"; }
  renderAll();
}
function renderAll(){ renderDashboard(); renderTasks(); renderCalendar(); renderGoals(); renderSchedule(); updateNotificationStatus(); }
function toast(msg){ const el=$("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2800); }

/* ---------- Tema ---------- */
function applyTheme(t){
  document.documentElement.dataset.theme = t;
  $("themeIcon").innerHTML = `<use href="#i-${t==="dark"?"sun":"moon"}"/>`;
  $("themeMeta").setAttribute("content", t==="dark" ? "#0c1324" : "#0f1729");
}
function toggleTheme(){
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
  applyTheme(next);
}

/* ---------- Menu hambúrguer ---------- */
function setMenu(open){
  const drawer = mqDrawer.matches;
  if(drawer){
    document.body.classList.toggle("nav-open", open);
    $("overlay").hidden = !open;
    $("menuBtn").setAttribute("aria-expanded", String(open));
    $("menuBtn").setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if(open) setTimeout(()=>document.querySelector(".nav.active")?.focus(),250);
  }
}
function toggleMenu(){
  if(mqDrawer.matches){ setMenu(!document.body.classList.contains("nav-open")); }
  else{
    const c = document.body.classList.toggle("collapsed");
    $("menuBtn").setAttribute("aria-expanded", String(!c));
    try{ localStorage.setItem("jm_collapsed", c ? "1":"0"); }catch(e){}
  }
}
function syncMenuMode(){
  document.body.classList.remove("nav-open"); $("overlay").hidden = true;
  if(mqDrawer.matches){ $("menuBtn").setAttribute("aria-expanded","false"); $("menuBtn").setAttribute("aria-label","Abrir menu"); }
  else{ $("menuBtn").setAttribute("aria-expanded", String(!document.body.classList.contains("collapsed"))); $("menuBtn").setAttribute("aria-label","Recolher/expandir menu"); }
}

function showView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!=="view-"+name));
  document.querySelectorAll(".nav").forEach(b=>{const a=b.dataset.view===name;b.classList.toggle("active",a);if(a)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
  document.body.dataset.view = name;
  if(name==="calendar")renderCalendar(); if(name==="tasks")renderTasks(); if(name==="goals")renderGoals(); if(name==="schedule")updateNow();
  setMenu(false);
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ---------- Tarefas ---------- */
function dateLabel(d){ if(d===iso())return "Hoje"; if(d===plusDays(iso(),1))return "Amanhã"; return new Date(d+"T12:00:00").toLocaleDateString("pt-PT",{day:"2-digit",month:"short"}); }
function taskHTML(t){
  return `<div class="task-row ${t.done?"completed":""}"><input class="task-check" type="checkbox" data-check="${esc(t.id)}" ${t.done?"checked":""} aria-label="Marcar tarefa como concluída"><div class="task-body"><div class="task-title">${esc(t.title)}</div><div class="task-meta"><span class="tag" data-cat="${catKey(t.category)}">${esc(t.category)}</span><span class="m">${icon("calendar")}${esc(dateLabel(t.date))}</span>${t.time?`<span class="m">${icon("clock-s")}${esc(t.time)}</span>`:""}<span class="m">${Number(t.duration)||25} min</span>${t.reminder?`<span class="m">${icon("bell")}lembrete</span>`:""}</div>${t.details?`<div class="task-note">${esc(t.details)}</div>`:""}</div><div class="task-actions"><button class="mini-btn" data-edit="${esc(t.id)}" title="Editar" aria-label="Editar tarefa" type="button">${icon("edit")}</button><button class="mini-btn del" data-delete="${esc(t.id)}" title="Apagar" aria-label="Apagar tarefa" type="button">${icon("trash")}</button></div></div>`;
}
function bindTaskActions(root){
  root.querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>{const t=state.tasks.find(x=>x.id===el.dataset.check);if(t){t.done=el.checked;t.completedAt=t.done?iso():null;save();}}));
  root.querySelectorAll("[data-edit]").forEach(el=>el.addEventListener("click",()=>openTask(el.dataset.edit)));
  root.querySelectorAll("[data-delete]").forEach(el=>el.addEventListener("click",()=>{const t=state.tasks.find(x=>x.id===el.dataset.delete);if(t&&confirm(`Apagar a tarefa "${t.title}"?`)){state.tasks=state.tasks.filter(x=>x.id!==t.id);save();toast("Tarefa apagada.");}}));
}
const byTime = (a,b) => (a.time||"99:99").localeCompare(b.time||"99:99");

function renderDashboard(){
  const today=iso(), tasks=state.tasks, done=tasks.filter(t=>t.done).length;
  const h = new Date().getHours();
  $("todayLabel").textContent = new Date().toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"}).toUpperCase();
  $("greeting").textContent = (h<12?"Bom dia":h<19?"Boa tarde":"Boa noite") + ". Vamos avançar, um passo de cada vez.";
  const todayAll = tasks.filter(t=>t.date===today), todayDone = todayAll.filter(t=>t.done).length;
  const tp = todayAll.length ? Math.round(todayDone/todayAll.length*100) : 0;
  $("todayRing").style.setProperty("--p", tp); $("todayRingText").textContent = tp+"%";
  $("heroSub").textContent = todayAll.length ? `${todayDone} de ${todayAll.length} tarefas de hoje concluídas.` : "Ainda não tens tarefas para hoje. Cria a primeira.";
  $("doneCount").textContent=done; $("taskCountLabel").textContent=`de ${tasks.length} tarefas`;
  const pct = tasks.length?Math.round(done/tasks.length*100):0;
  $("planPercent").textContent=pct+"%"; $("planProgress").style.width=pct+"%";
  let streak=0; for(let i=0;i<90;i++){const day=plusDays(today,-i);if(tasks.some(t=>t.done&&t.completedAt===day))streak++;else if(i>0)break;}
  $("streakCount").textContent=`${streak} ${streak===1?"dia":"dias"}`;
  const next=tasks.filter(t=>!t.done&&t.date>=today&&t.time).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  $("nextReminder").textContent=next?next.time:"—";
  $("nextReminderSub").textContent=next?`${next.date===today?"Hoje":dateLabel(next.date)} · ${next.title}`:"Adiciona uma tarefa com hora";
  const todayTasks=todayAll.slice().sort(byTime);
  $("todayTasks").innerHTML=todayTasks.length?todayTasks.map(taskHTML).join(""):'<div class="empty-state">Ainda não há tarefas para hoje. Adiciona a primeira.</div>';
  bindTaskActions($("todayTasks"));
  const focus=[["Universidade","u","Prioridade principal","Resolver dúvidas das aulas e preparar avaliações."],["Programação","p","Prática deliberada","Tenta resolver antes de pedir ajuda à IA."],["Inglês","i","Pequeno hábito diário","Escuta, vocabulário e uma frase em voz alta."],["Cibersegurança","c","Fundamentos primeiro","Redes, Linux e prática em laboratório autorizado."]];
  $("weeklyFocus").innerHTML=focus.map(f=>`<div class="focus-item" data-cat="${f[1]}"><span class="focus-dot"></span><div><strong>${f[0]} <span class="muted">· ${f[2]}</span></strong><small>${f[3]}</small></div></div>`).join("");
  const pillars=[["🎓","u","Universidade","Seis disciplinas"],["💻","p","Programação","Código escrito por ti"],["🛡️","c","Cibersegurança","Redes, Linux, defesa"],["🌍","i","Inglês","25 minutos por dia"],["💡","e","EduMind","Uma funcionalidade de cada vez"]];
  $("pillarGrid").innerHTML=pillars.map(p=>`<div class="pillar" data-cat="${p[1]}"><div class="pillar-icon">${p[0]}</div><strong>${p[2]}</strong><p>${p[3]}</p></div>`).join("");
}

/* ---------- Horário ---------- */
const toMin = (s) => { const [h,m]=String(s).split(":").map(Number); return h*60+m; };
function isNow(item, nowMin){ const a=toMin(item.start), b=toMin(item.end); return a<=b ? (nowMin>=a&&nowMin<b) : (nowMin>=a||nowMin<b); }
function renderSchedule(){
  const n=new Date(), nowMin=n.getHours()*60+n.getMinutes();
  $("scheduleList").innerHTML=state.schedule.map(item=>`<div class="schedule-item ${isNow(item,nowMin)?"now":""}" data-sid="${item.id}"><div class="schedule-time">${esc(item.start)} – ${esc(item.end)}</div><div class="timeline-dot"><i></i></div><div class="schedule-card"><strong>${esc(item.title)}<span class="now-badge" ${isNow(item,nowMin)?"":"hidden"}>AGORA</span></strong><p>${esc(item.detail)}</p></div><div class="sched-edit"><input type="text" aria-label="Editar nome do bloco" value="${esc(item.title)}" data-schedule-title="${item.id}" title="Editar nome do bloco"></div></div>`).join("");
  $("scheduleList").querySelectorAll("[data-schedule-title]").forEach(input=>input.addEventListener("change",()=>{const item=state.schedule.find(x=>x.id===Number(input.dataset.scheduleTitle));if(item&&input.value.trim()){item.title=input.value.trim();save();toast("Horário atualizado.");}}));
}
function updateNow(){
  const n=new Date(), nowMin=n.getHours()*60+n.getMinutes();
  document.querySelectorAll(".schedule-item").forEach(el=>{const item=state.schedule.find(x=>x.id===Number(el.dataset.sid));if(!item)return;const on=isNow(item,nowMin);el.classList.toggle("now",on);const b=el.querySelector(".now-badge");if(b)b.hidden=!on;});
}

function renderTasks(){
  if(!$("allTasks"))return;
  const q=($("taskSearch")?.value||"").toLowerCase(), filter=$("taskFilter")?.value||"all", cat=$("categoryFilter")?.value||"all";
  const list=state.tasks.filter(t=>(t.title+" "+(t.details||"")).toLowerCase().includes(q)&&(filter==="all"||(filter==="done"?t.done:!t.done))&&(cat==="all"||t.category===cat)).sort((a,b)=>(a.date+(a.time||"")).localeCompare(b.date+(b.time||"")));
  $("allTasks").innerHTML=list.length?list.map(taskHTML).join(""):'<div class="empty-state">Nenhuma tarefa corresponde a estes filtros.</div>';
  bindTaskActions($("allTasks"));
}

/* ---------- Calendário ---------- */
function buildLegend(){ $("calLegend").innerHTML = Object.entries(CATS).map(([n,k])=>`<span data-cat="${k}"><i></i>${n}</span>`).join(""); }
function renderCalendar(){
  const year=calendarDate.getFullYear(), month=calendarDate.getMonth(), todayKey=iso();
  $("monthLabel").textContent=cap(calendarDate.toLocaleDateString("pt-PT",{month:"long",year:"numeric"}));
  const offset=(new Date(year,month,1).getDay()+6)%7;
  const start=new Date(year,month,1-offset);
  const weeks = Math.ceil((offset + new Date(year,month+1,0).getDate())/7);
  const byDate={}; state.tasks.forEach(t=>{(byDate[t.date]=byDate[t.date]||[]).push(t);});
  let html="";
  for(let i=0;i<weeks*7;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=iso(d), list=(byDate[key]||[]).slice().sort(byTime), dow=(d.getDay()+6)%7;
    const doneN=list.filter(t=>t.done).length;
    const cls=["cal-day",d.getMonth()!==month?"outside":"",dow>=5?"weekend":"",key===selectedDate?"selected":"",key===todayKey?"today":""].join(" ");
    const label=`${d.toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"})}, ${list.length} tarefa${list.length===1?"":"s"}`;
    const chips=list.slice(0,3).map(t=>`<span class="chip ${t.done?"is-done":""}" data-cat="${catKey(t.category)}">${t.time?esc(t.time)+" ":""}${esc(t.title)}</span>`).join("")+(list.length>3?`<span class="chip-more">+${list.length-3} mais</span>`:"");
    const dots=list.slice(0,4).map(t=>`<span class="day-dot" data-cat="${catKey(t.category)}"></span>`).join("");
    html+=`<button type="button" class="${cls}" data-date="${key}" aria-label="${esc(label)}" aria-pressed="${key===selectedDate}" tabindex="${key===selectedDate?0:-1}"><div class="day-top"><span class="day-number">${d.getDate()}</span>${list.length?`<span class="day-done">${doneN}/${list.length}</span>`:""}</div>${list.length?`<div class="day-chips">${chips}</div><div class="day-dots">${dots}</div>`:""}</button>`;
  }
  $("calendarGrid").innerHTML=html;
  // resumo do mês
  const monthKey=`${year}-${String(month+1).padStart(2,"0")}`;
  const mt=state.tasks.filter(t=>t.date.startsWith(monthKey)), md=mt.filter(t=>t.done).length;
  $("monthStats").textContent = mt.length ? `${mt.length} tarefa${mt.length===1?"":"s"} neste mês · ${md} concluída${md===1?"":"s"}` : "Sem tarefas neste mês";
  // painel do dia
  const sd=new Date(selectedDate+"T12:00:00");
  $("selectedWeekday").textContent = selectedDate===todayKey ? "HOJE" : sd.toLocaleDateString("pt-PT",{weekday:"long"}).toUpperCase();
  $("selectedDateTitle").textContent = sd.toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"});
  const tasks=state.tasks.filter(t=>t.date===selectedDate).sort(byTime), dn=tasks.filter(t=>t.done).length;
  $("selectedSummary").textContent = tasks.length ? `${tasks.length} tarefa${tasks.length===1?"":"s"} · ${dn} concluída${dn===1?"":"s"}` : "Dia livre";
  $("selectedDateTasks").innerHTML=tasks.length?tasks.map(taskHTML).join(""):'<div class="empty-state">Dia livre. Podes adicionar uma tarefa.</div>';
  bindTaskActions($("selectedDateTasks"));
}
function selectDate(key, {scroll=false, focus=false}={}){
  selectedDate=key;
  const d=new Date(key+"T12:00:00");
  if(d.getMonth()!==calendarDate.getMonth()||d.getFullYear()!==calendarDate.getFullYear()){ calendarDate=new Date(d.getFullYear(),d.getMonth(),1); }
  renderCalendar();
  if(focus) $("calendarGrid").querySelector(`[data-date="${key}"]`)?.focus();
  if(scroll && window.matchMedia("(max-width:1180px)").matches) $("dayPanel").scrollIntoView({behavior:"smooth",block:"start"});
}
function shiftMonth(n){
  calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+n,1);
  const now=new Date();
  selectedDate = (calendarDate.getFullYear()===now.getFullYear()&&calendarDate.getMonth()===now.getMonth()) ? iso() : iso(calendarDate);
  renderCalendar();
}
function bindCalendar(){
  const grid=$("calendarGrid");
  grid.addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(b)selectDate(b.dataset.date,{scroll:true});});
  grid.addEventListener("keydown",e=>{
    const b=e.target.closest("[data-date]"); if(!b)return;
    const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
    if(step){e.preventDefault();selectDate(plusDays(b.dataset.date,step),{focus:true});}
  });
  let sx=0,sy=0;
  grid.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
  grid.addEventListener("touchend",e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>70&&Math.abs(dy)<45)shiftMonth(dx<0?1:-1);},{passive:true});
  $("prevMonth").addEventListener("click",()=>shiftMonth(-1));
  $("nextMonth").addEventListener("click",()=>shiftMonth(1));
  $("todayMonth").addEventListener("click",()=>{calendarDate=new Date();calendarDate.setDate(1);selectedDate=iso();renderCalendar();});
}

/* ---------- Metas ---------- */
function renderGoals(){
  const start=state.startDate||iso();
  $("planDates").textContent=`${new Date(start+"T12:00:00").toLocaleDateString("pt-PT")} — ${new Date(plusDays(start,89)+"T12:00:00").toLocaleDateString("pt-PT")}`;
  const phases=[["FASE 01 · DIAS 1–30","Organização e fundamentos",["Identificar lacunas nas seis disciplinas","Rever fundamentos de programação","Começar redes e sistemas operativos","Praticar inglês diariamente","Definir o MVP do EduMind"]],["FASE 02 · DIAS 31–60","Prática e construção",["Resolver exercícios progressivamente difíceis","Construir uma aplicação pequena","Praticar Linux e segurança defensiva","Ler documentação simples em inglês","Implementar a primeira função do EduMind"]],["FASE 03 · DIAS 61–90","Consolidação e demonstração",["Fazer simulados e rever erros","Testar e documentar o projeto","Documentar um laboratório autorizado","Gravar apresentação curta em inglês","Demonstrar uma funcionalidade do EduMind"]]];
  $("phaseGrid").innerHTML=phases.map(p=>`<article class="phase-card"><span class="phase-number">${p[0]}</span><h2>${p[1]}</h2><ul>${p[2].map(x=>`<li>${esc(x)}</li>`).join("")}</ul></article>`).join("");
  $("goalList").innerHTML=state.goals.map((g,i)=>`<div class="goal-item ${g.done?"done":""}"><input class="task-check" type="checkbox" data-goal="${i}" ${g.done?"checked":""} aria-label="Concluir meta"><div><strong>${esc(g.title)}</strong><p>${esc(g.desc||g.area||"Meta pessoal")}</p><span class="tag" data-cat="${catKey(g.area||"Pessoal")}">${esc(g.area||"Pessoal")}</span></div><button class="mini-btn del" data-goal-delete="${i}" title="Apagar meta" aria-label="Apagar meta" type="button">${icon("trash")}</button></div>`).join("")||'<div class="empty-state">Ainda não existem metas.</div>';
  $("goalList").querySelectorAll("[data-goal]").forEach(el=>el.addEventListener("change",()=>{state.goals[Number(el.dataset.goal)].done=el.checked;save();}));
  $("goalList").querySelectorAll("[data-goal-delete]").forEach(el=>el.addEventListener("click",()=>{state.goals.splice(Number(el.dataset.goalDelete),1);save();}));
}

/* ---------- Diálogo de tarefa ---------- */
function openTask(id=null,date=null){
  const t=id?state.tasks.find(x=>x.id===id):null;
  $("taskForm").reset(); $("taskId").value=t?.id||"";
  $("taskDialogTitle").textContent=t?"Editar tarefa":"Nova tarefa";
  $("taskTitle").value=t?.title||""; $("taskCategory").value=t?.category||"Universidade";
  $("taskDate").value=t?.date||date||selectedDate||iso(); $("taskTime").value=t?.time||"";
  $("taskDuration").value=String(t?.duration||45); $("taskDetails").value=t?.details||""; $("taskReminder").checked=!!t?.reminder;
  setMenu(false);
  if(!$("taskDialog").open)$("taskDialog").showModal();
  setTimeout(()=>$("taskTitle").focus(),60);
}
function closeTask(){ $("taskDialog").close(); }
function saveTask(e){
  e.preventDefault();
  const id=$("taskId").value;
  const obj={id:id||uid(),title:$("taskTitle").value.trim(),category:$("taskCategory").value,date:$("taskDate").value,time:$("taskTime").value,duration:Number($("taskDuration").value),details:$("taskDetails").value.trim(),reminder:$("taskReminder").checked,done:false};
  if(!obj.title||!obj.date)return;
  if(id){const old=state.tasks.find(t=>t.id===id);obj.done=old?.done||false;obj.completedAt=old?.completedAt||null;state.tasks=state.tasks.map(t=>t.id===id?obj:t);}else state.tasks.push(obj);
  selectedDate=obj.date;
  save(); closeTask();
  toast(obj.reminder ? "Tarefa guardada. Lembrete ativo enquanto a app estiver aberta." : (id?"Tarefa atualizada.":"Tarefa criada."));
}

/* ---------- Ligação, notificações, dados ---------- */
function setConnection(){ const el=$("connection"); el.querySelector("b").textContent=navigator.onLine?"Online":"Offline"; el.classList.toggle("online",navigator.onLine); el.classList.toggle("offline",!navigator.onLine); }
function updateNotificationStatus(){ if(!("Notification" in window)){$("notificationStatus").textContent="Este navegador não suporta notificações.";return;} const map={granted:"Permissão concedida",denied:"Permissão bloqueada nas definições do navegador",default:"Ainda não autorizadas"}; $("notificationStatus").textContent=map[Notification.permission]||"Estado desconhecido"; }
async function enableNotifications(){ if(!("Notification" in window)){toast("Este navegador não suporta notificações.");return;} try{const r=await Notification.requestPermission();updateNotificationStatus();toast(r==="granted"?"Notificações ativadas.":"Permissão não concedida.");}catch(e){toast("Não foi possível pedir permissão.");} }
function notify(title,body){ if(!("Notification" in window)||Notification.permission!=="granted")return; try{ if("serviceWorker" in navigator&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:"icon.svg",badge:"icon.svg",tag:"jm-"+title})).catch(()=>new Notification(title,{body}));} else new Notification(title,{body}); }catch(e){console.warn("Notificação indisponível",e);} }
function checkReminders(){
  if(document.visibilityState==="hidden")return;
  const now=new Date(), today=iso(), hhmm=now.toTimeString().slice(0,5);
  for(const t of state.tasks){ if(t.done||t.date!==today||!t.time||!t.reminder)continue; const key=t.id+"-"+today+"-"+t.time; if(t.time===hhmm&&!notified.has(key)){notified.add(key);notify("Jornada Milionária",`Está na hora: ${t.title}`);} }
  if(state.dailyReminder===hhmm){const key="daily-"+today;if(!notified.has(key)){notified.add(key);notify("Jornada Milionária","Confere as tuas prioridades de hoje.");}}
}
function exportData(){ const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`jornada-milionaria-${iso()}.json`;a.click();URL.revokeObjectURL(url);toast("Cópia de segurança exportada."); }
function importData(file){ const r=new FileReader(); r.onload=()=>{try{const obj=JSON.parse(r.result);if(!obj||!Array.isArray(obj.tasks)||!Array.isArray(obj.goals))throw Error("formato");if(confirm("Substituir os dados atuais pelos dados importados?")){state=normalize({...state,...obj});save();renderNotes();toast("Dados importados.");}}catch(e){toast("Ficheiro inválido ou incompatível.");}}; r.readAsText(file); }

/* ---------- Assistente local ---------- */
function aiReply(prompt){
  const q=prompt.toLowerCase();
  const pending=state.tasks.filter(t=>!t.done).sort((a,b)=>(a.date+(a.time||"99:99")).localeCompare(b.date+(b.time||"99:99")));
  const today=state.tasks.filter(t=>!t.done&&t.date===iso()).sort(byTime);
  if(/hoje|prioridade|estudar|estudo/.test(q)){
    if(!today.length)return "Ainda não tens tarefas pendentes para hoje. Sugestão: escolhe uma disciplina mais difícil, faz 45 minutos de exercícios e termina com 10 minutos a registar dúvidas. Podes criar a tarefa no separador Tarefas.";
    return "Sugestão de prioridades para hoje:\n"+today.slice(0,5).map((t,i)=>`${i+1}. ${t.time?t.time+" — ":""}${t.title} (${t.category}, ${t.duration||25} min)`).join("\n")+"\n\nComeça pela tarefa mais exigente. Faz uma pausa curta entre blocos e deixa espaço para imprevistos.";
  }
  if(/semana|semanal|organizar/.test(q)){
    const byCat={};pending.forEach(t=>byCat[t.category]=(byCat[t.category]||0)+1);
    const summary=Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`• ${k}: ${v} tarefa(s) pendente(s)`).join("\n");
    return "Plano simples para a semana:\n1. Dá prioridade às avaliações e às matérias em que tens mais dúvidas.\n2. Reserva 2 sessões para programação e 1 para cibersegurança.\n3. Pratica inglês durante 15–25 minutos por dia.\n4. Faz uma sessão curta do EduMind apenas depois das tarefas académicas prioritárias.\n\nTarefas pendentes por área:\n"+(summary||"Ainda não há tarefas pendentes.")+"\n\nNo domingo, revê o que ficou por fazer e escolhe no máximo três prioridades.";
  }
  if(/edumind|projeto|projecto|aplica[cç][aã]o/.test(q)) return "Vamos manter o EduMind pequeno e demonstrável. Sugestão de etapas:\n1. Definir o utilizador e o problema de estudo que vais resolver.\n2. Desenhar uma única página simples.\n3. Criar uma lista de disciplinas e tarefas.\n4. Guardar os dados localmente.\n5. Testar com 2–3 utilizadores e registar o feedback.\n6. Corrigir os problemas mais importantes e preparar uma demonstração.\n\nEscolhe apenas a próxima etapa; não precisas de construir toda a plataforma agora.";
  if(/cdi|cálculo|calculo|limite|derivad|integral/.test(q)) return "Para estudar CDI 1, tenta este ciclo:\n1. Escreve a definição ou regra com as tuas palavras.\n2. Estuda um exemplo resolvido e identifica cada passo.\n3. Fecha a solução e resolve dois exercícios semelhantes.\n4. Marca o passo exato onde ficaste bloqueado.\n5. Revê esse ponto no dia seguinte.\n\nDiz-me o tópico específico (por exemplo, limites ou derivadas) para eu sugerir uma sequência de prática mais direcionada.";
  if(/programa|código|codigo|javascript|algorit|estrutura de dados/.test(q)) return "Para recuperar a prática de programação, usa este método: tenta resolver o problema durante 15 minutos; escreve o algoritmo em passos; implementa uma versão pequena; testa com três entradas; só depois pede uma pista à IA. Termina explicando o código sem o olhar. Posso ajudar-te a transformar um tema específico num exercício.";
  if(/ciber|seguran|linux|rede|ip/.test(q)) return "Ordem recomendada para os fundamentos de cibersegurança:\n1. Sistemas operativos e permissões.\n2. Redes: IP, DNS, HTTP/HTTPS e portas.\n3. Linha de comandos Linux.\n4. Atualizações, palavras-passe e autenticação multifator.\n5. Registos e práticas defensivas num laboratório próprio ou autorizado.\n\nComeça com uma sessão de 30–45 minutos e anota três coisas que aprendeste.";
  if(/ingl[eê]s|english|vocabul|falar/.test(q)) return "Sessão de inglês de 25 minutos:\n• 10 min: ouvir um vídeo ou áudio curto em inglês.\n• 5 min: anotar cinco expressões e criar uma frase com cada uma.\n• 5 min: ler um parágrafo em voz alta.\n• 5 min: explicar oralmente o que estudaste hoje.\n\nÉ melhor praticar um pouco todos os dias do que fazer uma sessão longa de vez em quando.";
  if(/cansad|descans|sono|sem tempo|atras/.test(q)) return "Se estás cansado ou atrasado, reduz o plano em vez de tentar compensar tudo à noite:\n1. Escolhe apenas a tarefa académica mais urgente.\n2. Faz 20–25 minutos de trabalho concentrado.\n3. Prepara o essencial para amanhã.\n4. Descansa e protege o sono.\n\nUm dia mais leve não estraga o plano. Retoma no próximo bloco disponível.";
  return "Posso ajudar-te a organizar prioridades e estudar com passos concretos. Experimenta perguntar:\n• “O que devo estudar hoje?”\n• “Ajuda-me com CDI 1”\n• “Como pratico programação sem copiar?”\n• “Cria um plano de cibersegurança”\n• “Divide o EduMind em tarefas”\n\nEsta versão funciona offline e usa regras locais; não tem conhecimento geral de um modelo generativo online.";
}
function sendAI(prompt){
  const clean=prompt.trim(); if(!clean)return;
  const box=$("aiMessages");
  const u=document.createElement("div");u.className="ai-message user";u.innerHTML=`<strong>Tu</strong><p>${esc(clean)}</p>`;box.appendChild(u);
  const a=document.createElement("div");a.className="ai-message bot";a.innerHTML=`<strong>Assistente JM</strong><p>${esc(aiReply(clean))}</p>`;box.appendChild(a);
  $("aiPrompt").value="";box.scrollTop=box.scrollHeight;
}

/* ---------- Notas ---------- */
function renderNotes(){ $("weekWins").value=state.notes?.wins||""; $("weekChallenges").value=state.notes?.challenges||""; $("weekNext").value=state.notes?.next||""; }
function saveNotes(){ state.notes={wins:$("weekWins").value,challenges:$("weekChallenges").value,next:$("weekNext").value}; save(); $("notesStatus").textContent="Revisão guardada neste dispositivo às "+new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}); toast("Revisão semanal guardada."); }

/* ---------- Eventos ---------- */
function bind(){
  $("menuBtn").addEventListener("click",toggleMenu);
  $("closeMenu").addEventListener("click",()=>setMenu(false));
  $("overlay").addEventListener("click",()=>setMenu(false));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&document.body.classList.contains("nav-open")){setMenu(false);$("menuBtn").focus();} });
  (mqDrawer.addEventListener?mqDrawer.addEventListener("change",syncMenuMode):mqDrawer.addListener(syncMenuMode));
  $("themeBtn").addEventListener("click",toggleTheme); $("themeBtn2").addEventListener("click",toggleTheme);

  $("aiForm").addEventListener("submit",e=>{e.preventDefault();sendAI($("aiPrompt").value);});
  $("aiPrompt").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendAI($("aiPrompt").value);} });
  document.querySelectorAll("[data-ai-prompt]").forEach(b=>b.addEventListener("click",()=>sendAI(b.dataset.aiPrompt)));
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
  $("quickAdd").addEventListener("click",()=>openTask(null,iso()));
  $("addTaskBtn").addEventListener("click",()=>openTask());
  $("fab").addEventListener("click",()=>openTask(null,document.body.dataset.view==="calendar"?selectedDate:iso()));
  $("calendarAdd").addEventListener("click",()=>openTask(null,selectedDate));
  $("taskForm").addEventListener("submit",saveTask);
  $("closeTaskDialog").addEventListener("click",closeTask); $("cancelTask").addEventListener("click",closeTask);
  $("taskDialog").addEventListener("click",e=>{ if(e.target===$("taskDialog"))closeTask(); });
  $("taskSearch").addEventListener("input",renderTasks); $("taskFilter").addEventListener("change",renderTasks); $("categoryFilter").addEventListener("change",renderTasks);
  bindCalendar();
  $("resetSchedule").addEventListener("click",()=>{if(confirm("Restaurar o horário-base?")){state.schedule=defaultSchedule.map((x,i)=>({id:i,start:x[0],end:x[1],title:x[2],detail:x[3]}));save();toast("Horário restaurado.");}});
  $("addGoal").addEventListener("click",()=>{const title=prompt("Nome da nova meta:");if(!title?.trim())return;const desc=prompt("Como vais medir esta meta?")||"";state.goals.push({title:title.trim(),desc,area:"Pessoal",done:false});save();});
  $("startDate").value=state.startDate||iso();
  $("startDate").addEventListener("change",()=>{if($("startDate").value){state.startDate=$("startDate").value;save();toast("Data de início atualizada.");}});
  $("dailyReminder").value=state.dailyReminder||"08:00";
  $("dailyReminder").addEventListener("change",()=>{state.dailyReminder=$("dailyReminder").value;save();});
  $("enableNotifications").addEventListener("click",enableNotifications);
  $("testNotification").addEventListener("click",()=>{if("Notification" in window&&Notification.permission==="granted")notify("Jornada Milionária","As notificações estão a funcionar neste dispositivo.");else toast("Ativa primeiro a permissão de notificações.");});
  $("exportData").addEventListener("click",exportData);
  $("importData").addEventListener("change",e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value="";});
  $("clearData").addEventListener("click",()=>{if(confirm("Apagar permanentemente as tarefas, metas e notas deste navegador? Exporta uma cópia primeiro, se precisares.")){localStorage.removeItem(KEY);state=load();save();renderNotes();toast("Dados locais apagados.");}});
  $("saveNotes").addEventListener("click",saveNotes);
  window.addEventListener("online",setConnection); window.addEventListener("offline",setConnection);
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden");});
  $("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").classList.add("hidden");});
}

function init(){
  try{ if(localStorage.getItem("jm_collapsed")==="1") document.body.classList.add("collapsed"); }catch(e){}
  applyTheme(document.documentElement.dataset.theme||"light");
  buildLegend(); bind(); syncMenuMode(); setConnection(); renderAll(); renderNotes();
  if("serviceWorker" in navigator&&location.protocol!=="file:"){ navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("Service worker não registado",err)); }
  setInterval(checkReminders,15000);
  setInterval(updateNow,60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){checkReminders();updateNow();}});
}
init();
})();
