(() => {
  "use strict";
  const controller=window.VBTrainingPlayer, internals=window.VBTrainingPlayerInternals;
  if(!controller||!internals?.LibraryMusicEngine)return;
  const events=[], startedAt=performance.now();
  const record=(engine,type,extra={})=>{const a=engine?.audio;events.push({t:Math.round(performance.now()-startedAt)/1000,type,track:engine?.currentTrackId||"",currentTime:Number(a?.currentTime||0).toFixed(3),playbackRate:a?.playbackRate,defaultPlaybackRate:a?.defaultPlaybackRate,paused:a?.paused,ended:a?.ended,src:a?.currentSrc||a?.src||"",phaseIndex:controller?._musicPhaseIndex,...extra});};
  const proto=internals.LibraryMusicEngine.prototype;
  if(!proto.__audioDiagnosticsPatched){
    ["setConfig","selectTrack","start","pause","stop","onEnded"].forEach(name=>{const original=proto[name];if(typeof original!=="function")return;proto[name]=function(...args){record(this,`${name}:before`,{args:name==="setConfig"?args:undefined});const result=original.apply(this,args);if(result&&typeof result.then==="function")return result.then(v=>{record(this,`${name}:after`);return v;},e=>{record(this,`${name}:error`,{error:String(e)});throw e;});record(this,`${name}:after`);return result;};});
    const start=proto.start;proto.start=async function(...args){if(!this.__diagAudioBound&&this.audio){this.__diagAudioBound=true;["play","playing","pause","ratechange","seeking","seeked","ended","loadedmetadata","durationchange","waiting","stalled","suspend","emptied","canplay"].forEach(type=>this.audio.addEventListener(type,()=>record(this,`audio:${type}`)));}return start.apply(this,args);};proto.__audioDiagnosticsPatched=true;
  }
  const segmentStart=controller.onSegmentStart;controller.onSegmentStart=function(segment){record(this.music?.library||this.music,"segment:start",{segmentLabel:segment?.label,segmentType:segment?.type,segmentPhaseIndex:segment?.phaseIndex,segmentBpm:segment?.music?.bpm});return segmentStart.call(this,segment);};
  const api=window.VBTrainingAudioDiagnostics={events,dump:()=>events.slice(),clear:()=>{events.length=0;}};
  const button=document.createElement("button"),panel=document.createElement("div");
  button.type="button";button.textContent="Audio-Diagnose";button.style.cssText="position:fixed;right:8px;bottom:8px;z-index:99999;padding:9px 12px;border-radius:10px;border:1px solid #666;background:#fff;color:#111;font:600 13px system-ui";
  panel.hidden=true;panel.style.cssText="position:fixed;inset:8px;z-index:100000;background:#fff;color:#111;border-radius:12px;padding:12px;box-sizing:border-box;overflow:auto;font:12px ui-monospace,monospace";panel.innerHTML='<div style="display:flex;gap:8px;position:sticky;top:0;background:#fff;padding-bottom:8px"><button data-a="copy">Protokoll kopieren</button><button data-a="clear">Leeren</button><button data-a="close">Schliessen</button></div><pre style="white-space:pre-wrap;word-break:break-word;margin:0"></pre>';
  const render=()=>panel.querySelector("pre").textContent=JSON.stringify(api.dump(),null,2);
  button.onclick=()=>{render();panel.hidden=false;};panel.onclick=async e=>{const a=e.target?.dataset?.a;if(a==="close")panel.hidden=true;if(a==="clear"){api.clear();render();}if(a==="copy"){render();const text=panel.querySelector("pre").textContent;try{await navigator.clipboard.writeText(text);e.target.textContent="Kopiert";setTimeout(()=>e.target.textContent="Protokoll kopieren",1200);}catch(_){panel.querySelector("pre").focus();}}};
  document.body.append(button,panel);
})();
