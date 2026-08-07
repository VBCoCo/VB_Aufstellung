(() => {
"use strict";
const VERSION="2.3.0",KEY="volleyball-trainer-v2-2";
const ownRoster=[{id:"a1",role:"AA",base:1,team:"own"},{id:"z1",role:"Z",base:2,team:"own"},{id:"m1",role:"MB",base:3,team:"own"},{id:"a2",role:"AA",base:4,team:"own"},{id:"z2",role:"Z",base:5,team:"own"},{id:"m2",role:"MB",base:6,team:"own"}];
const opponentRoster=[{id:"oa1",role:"AA",base:1,team:"opponent"},{id:"oz1",role:"Z",base:2,team:"opponent"},{id:"om1",role:"MB",base:3,team:"opponent"},{id:"oa2",role:"AA",base:4,team:"opponent"},{id:"oz2",role:"Z",base:5,team:"opponent"},{id:"om2",role:"MB",base:6,team:"opponent"}];
const allPlayers=[...ownRoster,...opponentRoster];
const ownSlots={1:{x:520,y:735},2:{x:520,y:545},3:{x:350,y:545},4:{x:180,y:545},5:{x:180,y:735},6:{x:350,y:735}};
const opponentSlots={1:{x:180,y:165},2:{x:180,y:355},3:{x:350,y:355},4:{x:520,y:355},5:{x:520,y:165},6:{x:350,y:165}};
const ids=["infoButton","infoButtonBottom","editButton","rotationSelect","stepNumber","stepTotal","prevStep","playButton","nextStep","stepNameWrap","stepNameInput","saveStep","addStep","deleteStep","editPanel","situationSelect","rotationTitle","currentStepTitle","modeBadge","court","validationLayer","movementLayer","ballPathLayer","playerLayer","ballObject","tapNotice","status","infoDialog","closeInfo","closeInfoBottom","infoSituation"];
const e=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
const rot=(p,n)=>{let r=p;for(let i=0;i<n;i++)r=r===1?6:r-1;return r};
const initialStep=r=>{const positions={};ownRoster.forEach(p=>positions[p.id]={...ownSlots[rot(p.base,r)]});opponentRoster.forEach(p=>positions[p.id]={...opponentSlots[p.base]});return{name:"Grundposition",situation:"serveReceive",positions,ball:{x:450,y:650}}};
const fresh=()=>({rotation:0,step:0,rotations:Array.from({length:6},(_,r)=>({steps:[initialStep(r)]}))});
let state;try{state=JSON.parse(localStorage.getItem(KEY)||"null")||fresh()}catch{state=fresh()}
function migrate(){
  if(!state||!Array.isArray(state.rotations)||state.rotations.length!==6){state=fresh();return}
  state.rotations.forEach((rotation,r)=>{
    if(!Array.isArray(rotation.steps)||!rotation.steps.length)rotation.steps=[initialStep(r)];
    rotation.steps.forEach(step=>{
      step.positions=step.positions||{};
      ownRoster.forEach(p=>{if(!step.positions[p.id])step.positions[p.id]={...ownSlots[rot(p.base,r)]}});
      opponentRoster.forEach(p=>{if(!step.positions[p.id])step.positions[p.id]={...opponentSlots[p.base]}});
      if(!step.ball)step.ball={x:450,y:650};
      if(!step.situation)step.situation="serveReceive";
      if(!step.name)step.name="Grundposition";
    });
  });
  state.rotation=Math.max(0,Math.min(5,Number(state.rotation)||0));
  state.step=Math.max(0,Math.min(state.rotations[state.rotation].steps.length-1,Number(state.step)||0));
}
migrate();
let editing=false,selected=null,dragging=null,playing=false,animations=[];
const rd=()=>state.rotations[state.rotation],sd=()=>rd().steps[state.step],rname=n=>n===0?"Grundaufstellung":`Rotation +${n}`,prot=p=>rot(p.base,state.rotation),pat=n=>ownRoster.find(p=>prot(p)===n);
function save(msg){localStorage.setItem(KEY,JSON.stringify(state));e.status.textContent=msg}
function svg(name,a={}){const x=document.createElementNS("http://www.w3.org/2000/svg",name);Object.entries(a).forEach(([k,v])=>x.setAttribute(k,v));return x}
function createPlayers(){
  e.playerLayer.innerHTML="";
  allPlayers.forEach(p=>{
    const g=svg("g",{class:`player-object ${p.team}`,"data-id":p.id}),c=svg("circle",{r:29,fill:p.team==="opponent"?"#e32828":"#0d6efd",stroke:"#fff","stroke-width":3,filter:"url(#shadow)"}),t=svg("text",{"text-anchor":"middle",y:7,fill:"#fff","font-size":19,"font-weight":800}),l=svg("text",{"text-anchor":"middle",y:50,fill:"#fff","font-size":13,"font-weight":700,"data-label":"1"});
    t.textContent=p.role;g.append(c,t,l);e.playerLayer.appendChild(g);
  });
}
function line(layer,a,b,cls){layer.appendChild(svg("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:cls}))}
function validate(){
  e.validationLayer.innerHTML="";const bad=new Set;if(sd().situation!=="serveReceive")return bad;
  const p=n=>sd().positions[pat(n).id];
  [[4,3],[3,2],[5,6],[6,1]].forEach(([l,r])=>{const L=p(l),R=p(r),b=R.x+29,rem=b-(L.x-29),s=rem<=0?"invalid":rem<=18?"warning":"clear";if(s!=="clear"&&(editing||s==="invalid"))e.validationLayer.appendChild(svg("line",{x1:b,y1:455,x2:b,y2:840,class:s==="invalid"?"validation-invalid":"validation-warning"}));if(s==="invalid"){bad.add(pat(l).id);bad.add(pat(r).id)}});
  [[4,5],[3,6],[2,1]].forEach(([f,bk])=>{const F=p(f),B=p(bk),b=B.y+29,rem=b-(F.y-29),s=rem<=0?"invalid":rem<=18?"warning":"clear";if(s!=="clear"&&(editing||s==="invalid"))e.validationLayer.appendChild(svg("line",{x1:105,y1:b,x2:595,y2:b,class:s==="invalid"?"validation-invalid":"validation-warning"}));if(s==="invalid"){bad.add(pat(f).id);bad.add(pat(bk).id)}});
  return bad;
}
function paths(){e.movementLayer.innerHTML="";e.ballPathLayer.innerHTML="";if(state.step===0)return;const a=rd().steps[state.step-1],b=sd();allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line(e.movementLayer,A,B,"movement-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)line(e.ballPathLayer,a.ball,b.ball,"ball-path")}
function render(){
  e.rotationSelect.value=state.rotation;e.rotationTitle.textContent=rname(state.rotation);e.stepNumber.textContent=state.step+1;e.stepTotal.textContent=rd().steps.length;e.stepNameInput.value=sd().name;e.currentStepTitle.textContent=sd().name;e.situationSelect.value=sd().situation;e.modeBadge.textContent=editing?"Bearbeitung":"Ansicht";document.querySelectorAll(".mode-card").forEach(c=>c.classList.toggle("active",c.querySelector("input").checked));paths();const bad=validate();
  allPlayers.forEach(p=>{const g=e.playerLayer.querySelector(`[data-id="${p.id}"]`),pos=sd().positions[p.id];g.setAttribute("transform",`translate(${pos.x} ${pos.y})`);g.classList.toggle("editable",editing);g.classList.toggle("selected",selected?.type==="player"&&selected.id===p.id);g.querySelector("circle").setAttribute("fill",bad.has(p.id)?"#e32828":p.team==="opponent"?"#e32828":editing?"#f59e0b":"#0d6efd");g.querySelector("[data-label]").textContent=p.team==="opponent"?`Gegner · P${p.base}`:`Position ${prot(p)}`});
  e.ballObject.setAttribute("visibility","visible");e.ballObject.setAttribute("transform",`translate(${sd().ball.x} ${sd().ball.y})`);e.ballObject.classList.toggle("editable",editing);e.ballObject.classList.toggle("selected",selected?.type==="ball");
}
function stop(){playing=false;animations.forEach(a=>a.cancel());animations=[];e.playButton.textContent="▶"}
function edit(v){stop();editing=v;selected=dragging=null;e.editButton.textContent=v?"✓ Fertig":"✎ Bearbeiten";[e.stepNameWrap,e.saveStep,e.addStep,e.deleteStep,e.editPanel].forEach(x=>x.classList.toggle("hidden",!v));e.tapNotice.classList.add("hidden");render()}
function point(ev){const p=e.court.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(e.court.getScreenCTM().inverse())}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function playerPoint(p,player){
  if(sd().situation==="serveReceive"){
    const yMin=player.team==="own"?479:79,yMax=player.team==="own"?821:421;
    return{x:clamp(p.x,124,576),y:clamp(p.y,yMin,yMax)};
  }
  return{x:clamp(p.x,32,668),y:clamp(p.y,32,868)};
}
const cb=p=>({x:clamp(p.x,25,675),y:clamp(p.y,25,875)}),mode=()=>document.querySelector('input[name="moveMode"]:checked').value;
function keepServeReceiveInside(){if(sd().situation!=="serveReceive")return;allPlayers.forEach(player=>{sd().positions[player.id]=playerPoint(sd().positions[player.id],player)})}
e.court.addEventListener("pointerdown",ev=>{if(!editing||playing)return;ev.preventDefault();const pe=ev.target.closest("[data-id]"),be=ev.target.closest("#ballObject");if(mode()==="tap"){if(pe){selected={type:"player",id:pe.dataset.id};e.tapNotice.classList.remove("hidden");render();return}if(be){selected={type:"ball"};e.tapNotice.classList.remove("hidden");render();return}if(selected){const p=point(ev);if(selected.type==="player"){const player=allPlayers.find(x=>x.id===selected.id);sd().positions[selected.id]=playerPoint(p,player)}else sd().ball=cb(p);selected=null;e.tapNotice.classList.add("hidden");render()}return}if(pe){dragging={type:"player",id:pe.dataset.id};e.court.setPointerCapture(ev.pointerId)}else if(be){dragging={type:"ball"};e.court.setPointerCapture(ev.pointerId)}},{passive:false});
e.court.addEventListener("pointermove",ev=>{if(!dragging||!editing||playing)return;ev.preventDefault();const p=point(ev);if(dragging.type==="player"){const player=allPlayers.find(x=>x.id===dragging.id);sd().positions[dragging.id]=playerPoint(p,player)}else sd().ball=cb(p);render()},{passive:false});["pointerup","pointercancel"].forEach(n=>e.court.addEventListener(n,()=>dragging=null));
async function animate(target){target=Math.max(0,Math.min(rd().steps.length-1,target));if(target===state.step)return;stop();const a=sd(),b=rd().steps[target];playing=true;e.playButton.textContent="■";e.movementLayer.innerHTML="";e.ballPathLayer.innerHTML="";allPlayers.forEach(p=>{const A=a.positions[p.id],B=b.positions[p.id];if(A&&B&&(A.x!==B.x||A.y!==B.y))line(e.movementLayer,A,B,"movement-path")});if(a.ball.x!==b.ball.x||a.ball.y!==b.ball.y)line(e.ballPathLayer,a.ball,b.ball,"ball-path");const pa=allPlayers.map(p=>e.playerLayer.querySelector(`[data-id="${p.id}"]`).animate([{transform:`translate(${a.positions[p.id].x}px,${a.positions[p.id].y}px)`},{transform:`translate(${b.positions[p.id].x}px,${b.positions[p.id].y}px)`}],{duration:1450,easing:"ease-in-out",fill:"forwards"}));const ba=e.ballObject.animate([{transform:`translate(${a.ball.x}px,${a.ball.y}px) rotate(0deg)`},{transform:`translate(${b.ball.x}px,${b.ball.y}px) rotate(360deg)`}],{duration:1450,easing:"ease-in-out",fill:"forwards"});animations=[...pa,ba];await Promise.all(animations.map(x=>x.finished.catch(()=>{})));if(!playing)return;state.step=target;playing=false;animations=[];e.playButton.textContent="▶";render()}
e.prevStep.addEventListener("click",()=>animate(state.step-1));e.nextStep.addEventListener("click",()=>animate(state.step+1));e.playButton.addEventListener("click",()=>{if(playing){stop();render();return}if(rd().steps.length<2){e.status.textContent="Lege zuerst einen zweiten Schritt an.";return}animate(state.step>=rd().steps.length-1?0:state.step+1)});
e.editButton.addEventListener("click",()=>edit(!editing));e.rotationSelect.addEventListener("change",x=>{state.rotation=Number(x.target.value);state.step=0;render()});e.situationSelect.addEventListener("change",x=>{sd().situation=x.target.value;keepServeReceiveInside();render()});
e.saveStep.addEventListener("click",()=>{sd().name=e.stepNameInput.value.trim()||`Schritt ${state.step+1}`;keepServeReceiveInside();save("Schritt gespeichert.");render()});
e.addStep.addEventListener("click",()=>{sd().name=e.stepNameInput.value.trim()||`Schritt ${state.step+1}`;keepServeReceiveInside();const s=sd();rd().steps.splice(state.step+1,0,{name:`Schritt ${state.step+2}`,situation:s.situation,positions:structuredClone(s.positions),ball:structuredClone(s.ball)});state.step++;save("Neuer Schritt angelegt.");render()});
e.deleteStep.addEventListener("click",()=>{if(rd().steps.length===1){e.status.textContent="Der einzige Schritt kann nicht gelöscht werden.";return}rd().steps.splice(state.step,1);state.step=Math.max(0,state.step-1);save("Schritt gelöscht.");render()});
document.querySelectorAll('input[name="moveMode"]').forEach(i=>i.addEventListener("change",()=>{selected=null;e.tapNotice.classList.add("hidden");render()}));
function info(){e.infoSituation.textContent=`Aktuell: ${rname(state.rotation)} · Schritt ${state.step+1} · ${sd().name}`;e.infoDialog.showModal()}e.infoButton.addEventListener("click",info);e.infoButtonBottom.addEventListener("click",info);e.closeInfo.addEventListener("click",()=>e.infoDialog.close());e.closeInfoBottom.addEventListener("click",()=>e.infoDialog.close());e.infoDialog.addEventListener("click",x=>{if(x.target===e.infoDialog)e.infoDialog.close()});
createPlayers();save("Version 2.3.0 geladen.");edit(false);
})();
