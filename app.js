(() => {
  "use strict";

  const VERSION = "2.0.0";
  const STORAGE_KEY = "volleyball-trainer-v2";

  const roster = [
    { id:"a1", role:"AA", base:1 },
    { id:"z1", role:"Z", base:2 },
    { id:"m1", role:"MB", base:3 },
    { id:"a2", role:"AA", base:4 },
    { id:"z2", role:"Z", base:5 },
    { id:"m2", role:"MB", base:6 }
  ];

  const slots = {
    1:{x:650,y:480}, 2:{x:650,y:360}, 3:{x:450,y:360},
    4:{x:250,y:360}, 5:{x:250,y:480}, 6:{x:450,y:480}
  };

  const els = Object.fromEntries([
    "infoButton","infoButtonBottom","editButton","rotationSelect","stepNumber","stepTotal",
    "prevStep","playButton","nextStep","stepNameWrap","stepNameInput","saveStep","addStep",
    "deleteStep","editPanel","situationSelect","rotationTitle","currentStepTitle","modeBadge",
    "court","validationLayer","movementLayer","ballPathLayer","playerLayer","ballObject",
    "tapNotice","status","infoDialog","closeInfo","closeInfoBottom","infoSituation"
  ].map(id => [id, document.getElementById(id)]));

  function rotated(pos, steps){
    let result = pos;
    for(let i=0;i<steps;i++) result = result === 1 ? 6 : result - 1;
    return result;
  }

  function initialStep(rotation){
    const positions = {};
    roster.forEach(p => positions[p.id] = {...slots[rotated(p.base, rotation)]});
    return {
      name:"Grundposition",
      situation:"serveReceive",
      positions,
      ball:{x:560,y:415}
    };
  }

  function defaultState(){
    return {
      rotation:0,
      step:0,
      rotations:Array.from({length:6},(_,r)=>({steps:[initialStep(r)]}))
    };
  }

  function normalize(raw){
    const s = raw?.rotations ? raw : defaultState();
    s.rotation = Math.max(0,Math.min(5,Number(s.rotation)||0));
    s.step = Math.max(0,Number(s.step)||0);

    while(s.rotations.length<6){
      s.rotations.push({steps:[initialStep(s.rotations.length)]});
    }

    s.rotations.forEach((rotation,rIndex)=>{
      if(!Array.isArray(rotation.steps) || !rotation.steps.length){
        rotation.steps=[initialStep(rIndex)];
      }
      rotation.steps.forEach(step=>{
        step.name ||= "Grundposition";
        const map={opponentAttack:"defense",freeBall:"defense",ownAttack:"attack",custom:"attack"};
        step.situation = map[step.situation] || step.situation || "serveReceive";
        step.positions ||= initialStep(rIndex).positions;
        if(step.ball?.position) step.ball={...step.ball.position};
        if(step.ball?.contact) step.ball={...step.ball.contact};
        if(!step.ball?.x) step.ball={x:560,y:415};
      });
    });

    s.step=Math.min(s.step,s.rotations[s.rotation].steps.length-1);
    return s;
  }

  let state = normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  let editing = false;
  let selected = null;
  let dragging = null;
  let playing = false;
  let activeAnimations = [];

  const rotationData = () => state.rotations[state.rotation];
  const stepData = () => rotationData().steps[state.step];
  const rotationName = n => n===0 ? "Grundaufstellung" : `Rotation +${n}`;
  const playerRotation = p => rotated(p.base,state.rotation);
  const playerAt = pos => roster.find(p=>playerRotation(p)===pos);

  function save(message="Gespeichert."){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    els.status.textContent=message;
  }

  function svgEl(name,attrs={}){
    const el=document.createElementNS("http://www.w3.org/2000/svg",name);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    return el;
  }

  function createPlayers(){
    els.playerLayer.innerHTML="";
    roster.forEach(p=>{
      const g=svgEl("g",{class:"player-object","data-id":p.id});
      const c=svgEl("circle",{r:29,fill:"#0d6efd",stroke:"#fff","stroke-width":3,filter:"url(#shadow)"});
      const t=svgEl("text",{"text-anchor":"middle",y:7,fill:"#fff","font-size":19,"font-weight":800});
      t.textContent=p.role;
      const label=svgEl("text",{"text-anchor":"middle",y:50,fill:"#fff","font-size":13,"font-weight":700,"data-label":"1"});
      g.append(c,t,label);
      els.playerLayer.appendChild(g);
    });
  }

  function drawLine(layer,from,to,className){
    layer.appendChild(svgEl("line",{x1:from.x,y1:from.y,x2:to.x,y2:to.y,class:className}));
  }

  function validate(){
    els.validationLayer.innerHTML="";
    const invalid=new Set();
    if(stepData().situation!=="serveReceive") return invalid;

    const posByRot=n=>stepData().positions[playerAt(n).id];
    const horizontal=[[4,3],[3,2],[5,6],[6,1]];
    const vertical=[[4,5],[3,6],[2,1]];

    horizontal.forEach(([leftN,rightN])=>{
      const left=posByRot(leftN),right=posByRot(rightN);
      const boundary=right.x+29;
      const remaining=boundary-(left.x-29);
      const state=remaining<=0?"invalid":remaining<=18?"warning":"clear";
      if(state!=="clear" && (editing || state==="invalid")){
        els.validationLayer.appendChild(svgEl("line",{
          x1:boundary,y1:320,x2:boundary,y2:585,
          class:state==="invalid"?"validation-invalid":"validation-warning"
        }));
      }
      if(state==="invalid"){invalid.add(playerAt(leftN).id);invalid.add(playerAt(rightN).id)}
    });

    vertical.forEach(([frontN,backN])=>{
      const front=posByRot(frontN),back=posByRot(backN);
      const boundary=back.y+29;
      const remaining=boundary-(front.y-29);
      const state=remaining<=0?"invalid":remaining<=18?"warning":"clear";
      if(state!=="clear" && (editing || state==="invalid")){
        els.validationLayer.appendChild(svgEl("line",{
          x1:105,y1:boundary,x2:795,y2:boundary,
          class:state==="invalid"?"validation-invalid":"validation-warning"
        }));
      }
      if(state==="invalid"){invalid.add(playerAt(frontN).id);invalid.add(playerAt(backN).id)}
    });
    return invalid;
  }

  function renderPaths(){
    els.movementLayer.innerHTML="";
    els.ballPathLayer.innerHTML="";
    if(state.step===0) return;
    const prev=rotationData().steps[state.step-1];
    const cur=stepData();
    roster.forEach(p=>{
      const a=prev.positions[p.id],b=cur.positions[p.id];
      if(a.x!==b.x||a.y!==b.y) drawLine(els.movementLayer,a,b,"movement-path");
    });
    if(prev.ball.x!==cur.ball.x||prev.ball.y!==cur.ball.y){
      drawLine(els.ballPathLayer,prev.ball,cur.ball,"ball-path");
    }
  }

  function renderObjects(){
    const invalid=validate();
    roster.forEach(p=>{
      const g=els.playerLayer.querySelector(`[data-id="${p.id}"]`);
      const pos=stepData().positions[p.id];
      g.setAttribute("transform",`translate(${pos.x} ${pos.y})`);
      g.classList.toggle("editable",editing);
      g.classList.toggle("selected",selected?.type==="player"&&selected.id===p.id);
      g.querySelector("circle").setAttribute("fill",invalid.has(p.id)?"#e32828":editing?"#f59e0b":"#0d6efd");
      g.querySelector("[data-label]").textContent=`Position ${playerRotation(p)}`;
    });

    els.ballObject.setAttribute("visibility","visible");
    els.ballObject.setAttribute("transform",`translate(${stepData().ball.x} ${stepData().ball.y})`);
    els.ballObject.classList.toggle("editable",editing);
    els.ballObject.classList.toggle("selected",selected?.type==="ball");
  }

  function renderUI(){
    els.rotationSelect.value=state.rotation;
    els.rotationTitle.textContent=rotationName(state.rotation);
    els.stepNumber.textContent=state.step+1;
    els.stepTotal.textContent=rotationData().steps.length;
    els.stepNameInput.value=stepData().name;
    els.currentStepTitle.textContent=stepData().name;
    els.situationSelect.value=stepData().situation;
    els.modeBadge.textContent=editing?"Bearbeitung":"Ansicht";
    document.querySelectorAll(".mode-card").forEach(card=>{
      const input=card.querySelector("input");
      card.classList.toggle("active",input.checked);
    });
  }

  function render(){
    renderUI();
    renderPaths();
    renderObjects();
  }

  function setEditing(value){
    stopAnimation();
    editing=value;
    selected=null;
    dragging=null;
    els.editButton.textContent=editing?"✓ Fertig":"✎ Bearbeiten";
    [els.stepNameWrap,els.saveStep,els.addStep,els.deleteStep,els.editPanel]
      .forEach(el=>el.classList.toggle("hidden",!editing));
    els.tapNotice.classList.add("hidden");
    render();
  }

  function pointFromEvent(event){
    const p=els.court.createSVGPoint();
    p.x=event.clientX;p.y=event.clientY;
    return p.matrixTransform(els.court.getScreenCTM().inverse());
  }

  const clampPlayer=p=>({x:Math.max(130,Math.min(770,p.x)),y:Math.max(340,Math.min(555,p.y))});
  const clampBall=p=>({x:Math.max(115,Math.min(785,p.x)),y:Math.max(65,Math.min(565,p.y))});
  const moveMode=()=>document.querySelector('input[name="moveMode"]:checked').value;

  els.court.addEventListener("pointerdown",event=>{
    if(!editing||playing) return;
    event.preventDefault();
    const playerEl=event.target.closest("[data-id]");
    const ballEl=event.target.closest("#ballObject");

    if(moveMode()==="tap"){
      if(playerEl){
        selected={type:"player",id:playerEl.dataset.id};
        els.tapNotice.classList.remove("hidden");render();return;
      }
      if(ballEl){
        selected={type:"ball"};els.tapNotice.classList.remove("hidden");render();return;
      }
      if(selected){
        const p=pointFromEvent(event);
        if(selected.type==="player") stepData().positions[selected.id]=clampPlayer(p);
        else stepData().ball=clampBall(p);
        selected=null;els.tapNotice.classList.add("hidden");render();
      }
      return;
    }

    if(playerEl){dragging={type:"player",id:playerEl.dataset.id};els.court.setPointerCapture(event.pointerId)}
    else if(ballEl){dragging={type:"ball"};els.court.setPointerCapture(event.pointerId)}
  },{passive:false});

  els.court.addEventListener("pointermove",event=>{
    if(!dragging||!editing||playing)return;
    event.preventDefault();
    const p=pointFromEvent(event);
    if(dragging.type==="player") stepData().positions[dragging.id]=clampPlayer(p);
    else stepData().ball=clampBall(p);
    render();
  },{passive:false});

  ["pointerup","pointercancel"].forEach(name=>els.court.addEventListener(name,()=>dragging=null));

  function stopAnimation(){
    playing=false;
    activeAnimations.forEach(a=>a.cancel());
    activeAnimations=[];
    els.playButton.textContent="▶";
  }

  async function animateTo(targetIndex){
    const target=Math.max(0,Math.min(rotationData().steps.length-1,targetIndex));
    if(target===state.step)return;

    stopAnimation();
    const from=stepData();
    const to=rotationData().steps[target];
    playing=true;els.playButton.textContent="■";
    els.movementLayer.innerHTML="";els.ballPathLayer.innerHTML="";

    roster.forEach(p=>{
      const a=from.positions[p.id],b=to.positions[p.id];
      if(a.x!==b.x||a.y!==b.y) drawLine(els.movementLayer,a,b,"movement-path");
    });
    if(from.ball.x!==to.ball.x||from.ball.y!==to.ball.y) drawLine(els.ballPathLayer,from.ball,to.ball,"ball-path");

    const animations=roster.map(p=>{
      const a=from.positions[p.id],b=to.positions[p.id];
      return els.playerLayer.querySelector(`[data-id="${p.id}"]`).animate(
        [{transform:`translate(${a.x}px,${a.y}px)`},{transform:`translate(${b.x}px,${b.y}px)`}],
        {duration:1450,easing:"ease-in-out",fill:"forwards"}
      );
    });

    const ballAnim=els.ballObject.animate(
      [{transform:`translate(${from.ball.x}px,${from.ball.y}px) rotate(0deg)`},
       {transform:`translate(${to.ball.x}px,${to.ball.y}px) rotate(360deg)`}],
      {duration:1450,easing:"ease-in-out",fill:"forwards"}
    );

    activeAnimations=[...animations,ballAnim];
    await Promise.all(activeAnimations.map(a=>a.finished.catch(()=>{})));
    if(!playing)return;
    state.step=target;
    playing=false;activeAnimations=[];els.playButton.textContent="▶";render();
  }

  els.prevStep.addEventListener("click",()=>animateTo(state.step-1));
  els.nextStep.addEventListener("click",()=>animateTo(state.step+1));

  els.playButton.addEventListener("click",async()=>{
    if(playing){stopAnimation();render();return}
    if(rotationData().steps.length<2){els.status.textContent="Lege zuerst einen zweiten Schritt an.";return}
    let index=state.step>=rotationData().steps.length-1?0:state.step;
    while(index<rotationData().steps.length-1){
      await animateTo(index+1);
      if(playing) break;
      index=state.step;
      await new Promise(r=>setTimeout(r,300));
    }
  });

  els.editButton.addEventListener("click",()=>setEditing(!editing));
  els.rotationSelect.addEventListener("change",e=>{state.rotation=Number(e.target.value);state.step=0;render()});
  els.situationSelect.addEventListener("change",e=>{stepData().situation=e.target.value;render()});
  els.saveStep.addEventListener("click",()=>{
    stepData().name=els.stepNameInput.value.trim()||`Schritt ${state.step+1}`;
    save("Schritt gespeichert.");render();
  });
  els.addStep.addEventListener("click",()=>{
    stepData().name=els.stepNameInput.value.trim()||`Schritt ${state.step+1}`;
    const source=stepData();
    rotationData().steps.splice(state.step+1,0,{
      name:`Schritt ${state.step+2}`,
      situation:source.situation,
      positions:structuredClone(source.positions),
      ball:structuredClone(source.ball)
    });
    state.step++;save("Neuer Schritt angelegt.");render();
  });
  els.deleteStep.addEventListener("click",()=>{
    if(rotationData().steps.length===1){els.status.textContent="Der einzige Schritt kann nicht gelöscht werden.";return}
    rotationData().steps.splice(state.step,1);
    state.step=Math.max(0,state.step-1);save("Schritt gelöscht.");render();
  });

  document.querySelectorAll('input[name="moveMode"]').forEach(input=>{
    input.addEventListener("change",()=>{selected=null;els.tapNotice.classList.add("hidden");render()});
  });

  function openInfo(){
    els.infoSituation.textContent=`Aktuell: ${rotationName(state.rotation)} · Schritt ${state.step+1} · ${stepData().name}`;
    els.infoDialog.showModal();
  }
  els.infoButton.addEventListener("click",openInfo);
  els.infoButtonBottom.addEventListener("click",openInfo);
  els.closeInfo.addEventListener("click",()=>els.infoDialog.close());
  els.closeInfoBottom.addEventListener("click",()=>els.infoDialog.close());
  els.infoDialog.addEventListener("click",e=>{if(e.target===els.infoDialog)els.infoDialog.close()});

  createPlayers();
  setEditing(false);
  els.status.textContent=`Version ${VERSION} geladen.`;
})();