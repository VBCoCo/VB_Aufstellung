(() => {
  "use strict";
  const controller=window.VBTrainingPlayer, internals=window.VBTrainingPlayerInternals;
  if(!controller||!internals?.LibraryMusicEngine)return;
  const events=[], startedAt=performance.now();
  const runtime=controller.runtime;
  const record=(engine,type,extra={})=>{const a=engine?.audio||controller.music?.library?.audio||controller.music?.engine?.audio;const ctx=runtime?.context;const musicGain=runtime?.musicGain?.gain;events.push({t:Math.round(performance.now()-startedAt)/1000,type,track:engine?.currentTrackId||controller.music?.library?.currentTrackId||controller.music?.engine?.currentTrackId||"",currentTime:Number(a?.currentTime||0).toFixed(3),playbackRate:a?.playbackRate,defaultPlaybackRate:a?.defaultPlaybackRate,paused:a?.paused,ended:a?.ended,src:a?.currentSrc||a?.src||"",phaseIndex:controller?._musicPhaseIndex,audioContextState:ctx?.state,audioContextTime:ctx?Number(ctx.currentTime.toFixed(3)):undefined,musicGain:musicGain?Number(musicGain.value.toFixed(5)):undefined,runtimeVolume:runtime?.volume,runtimeDucking:runtime?.ducking,runtimeDucked:runtime?.ducked,...extra});};

  const libProto=internals.LibraryMusicEngine.prototype;
  if(!libProto.__audioDiagnosticsPatched){
    ["setConfig","selectTrack","start","pause","stop","onEnded"].forEach(name=>{const original=libProto[name];if(typeof original!=="function")return;libProto[name]=function(...args){record(this,`${name}:before`,{args:name==="setConfig"?args:undefined});const result=original.apply(this,args);if(result&&typeof result.then==="function")return result.then(v=>{record(this,`${name}:after`);return v;},e=>{record(this,`${name}:error`,{error:String(e)});throw e;});record(this,`${name}:after`);return result;};});
    const start=libProto.start;libProto.start=async function(...args){if(!this.__diagAudioBound&&this.audio){this.__diagAudioBound=true;["play","playing","pause","ratechange","seeking","seeked","ended","loadedmetadata","durationchange","waiting","stalled","suspend","emptied","canplay"].forEach(type=>this.audio.addEventListener(type,()=>record(this,`audio:${type}`)));}return start.apply(this,args);};libProto.__audioDiagnosticsPatched=true;
  }

  const runtimeProto=internals.AudioRuntime?.prototype;
  if(runtimeProto&&!runtimeProto.__audioDiagnosticsPatched){
    ["setVolume","setDucking","setDucked","applyMusicGain","cue","unlock"].forEach(name=>{const original=runtimeProto[name];if(typeof original!=="function")return;runtimeProto[name]=function(...args){record(controller.music?.library||controller.music?.engine||controller.music,`runtime:${name}:before`,{args});const result=original.apply(this,args);if(result&&typeof result.then==="function")return result.then(v=>{record(controller.music?.library||controller.music?.engine||controller.music,`runtime:${name}:after`);return v;},e=>{record(controller.music?.library||controller.music?.engine||controller.music,`runtime:${name}:error`,{error:String(e)});throw e;});record(controller.music?.library||controller.music?.engine||controller.music,`runtime:${name}:after`);return result;};});runtimeProto.__audioDiagnosticsPatched=true;
  }

  const cueProto=internals.TrainingCueEngine?.prototype;
  if(cueProto&&!cueProto.__audioDiagnosticsPatched){
    ["configure","setTempo","countdown","announce","speak","complete"].forEach(name=>{const original=cueProto[name];if(typeof original!=="function")return;cueProto[name]=function(...args){record(controller.music?.library||controller.music?.engine||controller.music,`cue:${name}:before`,{args});const result=original.apply(this,args);if(result&&typeof result.then==="function")return result.then(v=>{record(controller.music?.library||controller.music?.engine||controller.music,`cue:${name}:after`);return v;},e=>{record(controller.music?.library||controller.music?.engine||controller.music,`cue:${name}:error`,{error:String(e)});throw e;});record(controller.music?.library||controller.music?.engine||controller.music,`cue:${name}:after`);return result;};});cueProto.__audioDiagnosticsPatched=true;
  }

  const segmentStart=controller.onSegmentStart;controller.onSegmentStart=function(segment){record(this.music?.library||this.music?.engine||this.music,"segment:start",{segmentLabel:segment?.label,segmentType:segment?.kind||segment?.type,segmentPhaseIndex:segment?.phaseIndex,segmentBpm:segment?.music?.bpm});return segmentStart.call(this,segment);};

  if(runtime?.context&&!runtime.context.__vbDiagStateBound){runtime.context.__vbDiagStateBound=true;runtime.context.addEventListener("statechange",()=>record(controller.music?.library||controller.music?.engine||controller.music,"audio-context:statechange"));}

  let lastSample="",previousClockSample=null;
  const sampler=setInterval(()=>{const a=controller.music?.library?.audio||controller.music?.engine?.audio;const ctx=runtime?.context;if(!a&&!ctx)return;const wallTime=performance.now()/1000,mediaTime=Number(a?.currentTime||0),elapsedWall=previousClockSample?wallTime-previousClockSample.wallTime:null,elapsedMedia=previousClockSample?mediaTime-previousClockSample.mediaTime:null,mediaClockRatio=elapsedWall&&elapsedMedia!==null?elapsedMedia/elapsedWall:null;previousClockSample={wallTime,mediaTime};const sample={playbackRate:a?.playbackRate,currentTime:mediaTime.toFixed(3),paused:a?.paused,musicGain:runtime?.musicGain?.gain?Number(runtime.musicGain.gain.value.toFixed(5)):undefined,ducked:runtime?.ducked,ctx:ctx?.state,phase:controller?._musicPhaseIndex,elapsedWall:elapsedWall===null?undefined:Number(elapsedWall.toFixed(3)),elapsedMedia:elapsedMedia===null?undefined:Number(elapsedMedia.toFixed(3)),mediaClockRatio:mediaClockRatio===null?undefined:Number(mediaClockRatio.toFixed(3))};const key=JSON.stringify(sample);if(key!==lastSample){lastSample=key;record(controller.music?.library||controller.music?.engine||controller.music,"sample",sample);}},250);

  const api=window.VBTrainingAudioDiagnostics={events,dump:()=>events.slice(),clear:()=>{events.length=0;},stop:()=>clearInterval(sampler)};
  record(controller.music?.library||controller.music?.engine||controller.music,"diagnostics:ready");
})();
