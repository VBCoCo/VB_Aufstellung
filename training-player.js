(() => {
"use strict";

const VERSION = "3.2.0";
const STORAGE_PREFIX = "vb-training-player-v1";
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const clone = value => JSON.parse(JSON.stringify(value));
const uid = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const formatTime = totalSeconds => {
  const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const defaultMusic = () => ({style:"workout", bpm:128, intensity:"medium", volume:0.7});
const defaultOptions = () => ({countdownEnabled:true, countdownSeconds:3, speechEnabled:true, speechVolume:0.7, signalsEnabled:true, signalVolume:0.55, ducking:0.6});
const continuousPhase = (name="Neue Phase") => ({
  id:uid(), name, type:"continuous", durationSeconds:120, announcement:name,
  music:{style:"", bpm:null, intensity:""}
});
const intervalPhase = (name="Intervall") => ({
  id:uid(), name, type:"interval", workSeconds:20, pauseSeconds:10, repetitions:8, blocks:1,
  longPauseSeconds:0, workLabel:"ACTION", pauseLabel:"PAUSE", longPauseLabel:"BLOCKPAUSE",
  music:{style:"", bpm:null, intensity:""}
});

const BUILTIN_TEMPLATES = [
  {
    id:"builtin-tabata", builtin:true, name:"Tabata",
    music:{style:"workout", bpm:132, intensity:"high", volume:0.72}, options:defaultOptions(),
    phases:[{...intervalPhase("Tabata"), id:"tabata-main", workSeconds:20, pauseSeconds:10, repetitions:8, blocks:1, longPauseSeconds:0, workLabel:"ACTION", pauseLabel:"PAUSE", music:{style:"workout", bpm:132, intensity:"high"}}]
  },
  {
    id:"builtin-volleyball-power", builtin:true, name:"Volleyball Power",
    music:{style:"electronic", bpm:130, intensity:"high", volume:0.75}, options:defaultOptions(),
    phases:[{...intervalPhase("Power"), id:"power-main", workSeconds:30, pauseSeconds:15, repetitions:6, blocks:1, longPauseSeconds:60, workLabel:"ACTION", pauseLabel:"PAUSE", longPauseLabel:"SATZPAUSE", music:{style:"electronic", bpm:130, intensity:"high"}}]
  },
  {
    id:"builtin-warmup", builtin:true, name:"Warm-up 105–118 BPM",
    music:{style:"house", bpm:105, intensity:"low", volume:0.66}, options:defaultOptions(),
    phases:[
      {...continuousPhase("Warm-up locker"), id:"warmup-low", durationSeconds:120, announcement:"Warm-up locker", music:{style:"house", bpm:105, intensity:"low"}},
      {...continuousPhase("Warm-up Steigerung"), id:"warmup-rise", durationSeconds:180, announcement:"Tempo steigern", music:{style:"house", bpm:118, intensity:"medium"}}
    ]
  }
];

function normalizeMusic(music={}) {
  const styles = ["electronic", "workout", "house", "techno", "ambient"];
  const intensities = ["low", "medium", "high"];
  return {
    style:styles.includes(music.style) ? music.style : "workout",
    bpm:clamp(music.bpm || 128, 70, 160),
    intensity:intensities.includes(music.intensity) ? music.intensity : "medium",
    volume:clamp(music.volume ?? 0.7, 0, 1)
  };
}
function normalizeOptions(options={}) {
  return {
    countdownEnabled:options.countdownEnabled !== false,
    countdownSeconds:[3,5].includes(Number(options.countdownSeconds)) ? Number(options.countdownSeconds) : 3,
    speechEnabled:options.speechEnabled !== false,
    speechVolume:clamp(options.speechVolume ?? 0.7, 0.2, 1),
    signalsEnabled:options.signalsEnabled !== false,
    signalVolume:clamp(options.signalVolume ?? 0.55, 0.1, 1),
    ducking:clamp(options.ducking ?? 0.6, 0.2, 0.9)
  };
}
function normalizePhase(phase={}, index=0) {
  const music = {
    style:["electronic", "workout", "house", "techno", "ambient"].includes(phase.music?.style) ? phase.music.style : "",
    bpm:phase.music?.bpm ? clamp(phase.music.bpm, 70, 160) : null,
    intensity:["low", "medium", "high"].includes(phase.music?.intensity) ? phase.music.intensity : ""
  };
  if (phase.type === "interval") return {
    id:phase.id || uid(), name:String(phase.name || `Intervall ${index + 1}`).slice(0,80), type:"interval",
    workSeconds:clamp(phase.workSeconds || 20, 1, 3600), pauseSeconds:clamp(phase.pauseSeconds ?? 10, 0, 3600),
    repetitions:clamp(phase.repetitions || 1, 1, 99), blocks:clamp(phase.blocks || 1, 1, 30),
    longPauseSeconds:clamp(phase.longPauseSeconds ?? 0, 0, 3600),
    workLabel:String(phase.workLabel || "ACTION").slice(0,80), pauseLabel:String(phase.pauseLabel || "PAUSE").slice(0,80),
    longPauseLabel:String(phase.longPauseLabel || "BLOCKPAUSE").slice(0,80), music
  };
  return {
    id:phase.id || uid(), name:String(phase.name || `Phase ${index + 1}`).slice(0,80), type:"continuous",
    durationSeconds:clamp(phase.durationSeconds || 60, 1, 7200),
    announcement:String(phase.announcement || phase.name || `Phase ${index + 1}`).slice(0,180), music
  };
}
function normalizeTemplate(template={}) {
  const phases = Array.isArray(template.phases) && template.phases.length ? template.phases : [continuousPhase()];
  return {
    id:template.id || uid(), builtin:Boolean(template.builtin), name:String(template.name || "Training").slice(0,80),
    schema:1, music:normalizeMusic(template.music), options:normalizeOptions(template.options),
    phases:phases.map(normalizePhase)
  };
}
function segmentMusic(template, phase) {
  return {
    style:phase.music?.style || template.music.style,
    bpm:phase.music?.bpm || template.music.bpm,
    intensity:phase.music?.intensity || template.music.intensity,
    volume:template.music.volume
  };
}
function buildTimeline(template) {
  const result = [];
  template.phases.forEach((phase, phaseIndex) => {
    const music = segmentMusic(template, phase);
    if (phase.type === "continuous") {
      result.push({kind:"continuous", label:phase.announcement || phase.name, phaseName:phase.name, durationSeconds:phase.durationSeconds, phaseIndex, music});
      return;
    }
    for (let block=1; block<=phase.blocks; block++) {
      for (let repeat=1; repeat<=phase.repetitions; repeat++) {
        result.push({kind:"work", label:phase.workLabel, phaseName:phase.name, durationSeconds:phase.workSeconds, phaseIndex, repeat, repetitions:phase.repetitions, block, blocks:phase.blocks, music});
        if (repeat < phase.repetitions && phase.pauseSeconds > 0) {
          result.push({kind:"pause", label:phase.pauseLabel, phaseName:phase.name, durationSeconds:phase.pauseSeconds, phaseIndex, repeat, repetitions:phase.repetitions, block, blocks:phase.blocks, music});
        }
      }
      if (phase.longPauseSeconds > 0) {
        result.push({kind:"long-pause", label:phase.longPauseLabel, phaseName:phase.name, durationSeconds:phase.longPauseSeconds, phaseIndex, repeat:phase.repetitions, repetitions:phase.repetitions, block, blocks:phase.blocks, music:{...music, intensity:"low"}});
      }
    }
  });
  return result;
}

class TrainingIntervalEngine {
  constructor(callbacks={}) {
    this.callbacks = callbacks;
    this.template = null;
    this.timeline = [];
    this.status = "idle";
    this.index = 0;
    this.remainingMs = 0;
    this.deadline = 0;
    this.timer = null;
    this.lastCountdown = null;
  }
  load(template) {
    this.clearTimer();
    this.template = normalizeTemplate(template);
    this.timeline = buildTimeline(this.template);
    this.status = "idle";
    this.index = 0;
    this.remainingMs = (this.timeline[0]?.durationSeconds || 0) * 1000;
    this.lastCountdown = null;
    this.emit();
  }
  current() { return this.timeline[this.index] || null; }
  play() {
    if (!this.timeline.length) return;
    if (this.status === "completed") this.stop();
    const starting = this.status === "idle";
    this.status = "running";
    this.deadline = Date.now() + Math.max(1, this.remainingMs);
    if (starting) this.callbacks.onSegmentStart?.(this.current(), this.index, this.timeline.length);
    this.clearTimer();
    this.timer = setInterval(() => this.tick(), 100);
    this.tick();
  }
  pause() {
    if (this.status !== "running") return;
    this.remainingMs = Math.max(0, this.deadline - Date.now());
    this.status = "paused";
    this.clearTimer();
    this.emit();
  }
  stop() {
    this.clearTimer();
    this.status = "idle";
    this.index = 0;
    this.remainingMs = (this.timeline[0]?.durationSeconds || 0) * 1000;
    this.lastCountdown = null;
    this.emit();
  }
  clearTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  tick() {
    if (this.status !== "running") return;
    let now = Date.now();
    while (now >= this.deadline && this.status === "running") {
      const overshoot = now - this.deadline;
      this.index += 1;
      this.lastCountdown = null;
      if (this.index >= this.timeline.length) {
        this.status = "completed";
        this.remainingMs = 0;
        this.clearTimer();
        this.emit();
        this.callbacks.onComplete?.();
        return;
      }
      this.remainingMs = this.current().durationSeconds * 1000;
      this.deadline = now + Math.max(1, this.remainingMs - overshoot);
      this.callbacks.onSegmentStart?.(this.current(), this.index, this.timeline.length);
      now = Date.now();
    }
    this.remainingMs = Math.max(0, this.deadline - now);
    const remainingSeconds = Math.ceil(this.remainingMs / 1000);
    const countdown = this.template.options.countdownEnabled ? this.template.options.countdownSeconds : 0;
    if (countdown && remainingSeconds > 0 && remainingSeconds <= countdown && remainingSeconds !== this.lastCountdown) {
      this.lastCountdown = remainingSeconds;
      this.callbacks.onCountdown?.(remainingSeconds);
    }
    this.emit();
  }
  emit() {
    this.callbacks.onState?.({status:this.status, index:this.index, total:this.timeline.length, remainingMs:this.remainingMs, segment:this.current()});
  }
}

class AudioRuntime {
  constructor() {
    this.context = null;
    this.musicGain = null;
    this.synthGain = null;
    this.drumGain = null;
    this.cueGain = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.samples = {};
    this.volume = 0.7;
    this.ducking = 0.6;
    this.signalVolume = 0.55;
    this.ducked = false;
  }
  async unlock() {
    try {
      if (navigator.audioSession && "type" in navigator.audioSession) navigator.audioSession.type = "playback";
    } catch {}
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("Web Audio wird von diesem Browser nicht unterstützt.");
      this.context = new AudioContext();
      this.musicGain = this.context.createGain();
      this.synthGain = this.context.createGain();
      this.drumGain = this.context.createGain();
      this.cueGain = this.context.createGain();
      this.compressor = this.context.createDynamicsCompressor();
      this.synthGain.connect(this.musicGain);
      this.drumGain.connect(this.musicGain);
      this.musicGain.connect(this.compressor);
      this.cueGain.connect(this.compressor);
      this.compressor.connect(this.context.destination);
      this.synthGain.gain.value = 1;
      this.drumGain.gain.value = 1;
      this.cueGain.gain.value = this.signalVolume;
      this.compressor.threshold.value = -10;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.2;
      this.createNoiseBuffer();
      this.createPercussionSamples();
      this.applyMusicGain(true);
    }
    if (this.context.state !== "running") await this.context.resume();
    return this.context;
  }
  createNoiseBuffer() {
    const length = Math.max(1, Math.floor(this.context.sampleRate * 0.8));
    this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i=0; i<length; i++) data[i] = Math.random() * 2 - 1;
  }
  createPercussionSamples() {
    const rate = this.context.sampleRate;
    const make = (name, duration, render) => {
      const buffer = this.context.createBuffer(1, Math.max(1, Math.floor(rate * duration)), rate);
      const data = buffer.getChannelData(0);
      let phase = 0;
      for (let i=0; i<data.length; i++) data[i] = clamp(render(i / rate, i, () => phase, value => { phase = value; }), -1, 1);
      this.samples[name] = buffer;
    };
    make("kick", 0.52, (t,_i,getPhase,setPhase) => {
      const frequency = 43 + 125 * Math.exp(-t * 30);
      const phase = getPhase() + Math.PI * 2 * frequency / rate;
      setPhase(phase);
      const body = Math.sin(phase) * Math.exp(-t * 10.5);
      const click = (Math.random() * 2 - 1) * 0.16 * Math.exp(-t * 75);
      return body + click;
    });
    make("clap", 0.3, t => {
      const burst = [0.012,0.04,0.072].reduce((sum,center) => sum + Math.exp(-Math.pow((t-center)*52,2)),0);
      return (Math.random()*2-1) * Math.min(1, burst*0.52 + Math.exp(-t*18)*0.3);
    });
    make("hat", 0.09, t => (Math.random()*2-1) * Math.exp(-t*55));
    make("openHat", 0.34, t => (Math.random()*2-1) * Math.exp(-t*13));
    make("tom", 0.28, (t,_i,getPhase,setPhase) => {
      const frequency = 105 - 45 * Math.min(1,t/0.28);
      const phase = getPhase() + Math.PI * 2 * frequency / rate;
      setPhase(phase);
      return Math.sin(phase) * Math.exp(-t*13);
    });
  }
  output(destination) {
    if (destination === "cue") return this.cueGain;
    if (destination === "drum") return this.drumGain;
    return this.synthGain;
  }
  setVolume(value) { this.volume = clamp(value, 0, 1); this.applyMusicGain(); }
  setDucking(value) { this.ducking = clamp(value, 0.2, 0.9); this.applyMusicGain(); }
  setSignalVolume(value) {
    this.signalVolume = clamp(value, 0.1, 1);
    if (!this.cueGain || !this.context) return;
    this.cueGain.gain.setTargetAtTime(this.signalVolume, this.context.currentTime, 0.025);
  }
  setDucked(value) { this.ducked = Boolean(value); this.applyMusicGain(); }
  applyMusicGain(immediate=false) {
    if (!this.musicGain || !this.context) return;
    const target = this.volume * (this.ducked ? this.ducking : 1);
    const now = this.context.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    if (immediate) this.musicGain.gain.setValueAtTime(target, now);
    else this.musicGain.gain.setTargetAtTime(target, now, 0.055);
  }
  tone(freq, time, duration, {type="sine", gain=0.12, destination="music", endFreq=null, filterFreq=null, filterEndFreq=null, filterQ=1}={}) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20,freq), time);
    if (endFreq) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq), time + duration);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002,gain), time + Math.min(0.012,duration/4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    if (filterFreq) {
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = filterQ;
      filter.frequency.setValueAtTime(Math.max(80,filterFreq),time);
      if (filterEndFreq) filter.frequency.exponentialRampToValueAtTime(Math.max(80,filterEndFreq),time+duration);
      envelope.connect(filter).connect(this.output(destination));
    } else envelope.connect(this.output(destination));
    oscillator.start(time);
    oscillator.stop(time + duration + 0.03);
  }
  sample(name, time, {gain=0.2, destination="drum", playbackRate=1}={}) {
    if (!this.context || !this.samples[name]) return;
    const source = this.context.createBufferSource();
    const envelope = this.context.createGain();
    source.buffer = this.samples[name];
    source.playbackRate.value = playbackRate;
    envelope.gain.value = gain;
    source.connect(envelope).connect(this.output(destination));
    source.start(time);
  }
  noise(time, duration, {gain=0.05, highpass=3500, destination="music"}={}) {
    if (!this.context || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = highpass;
    envelope.gain.setValueAtTime(Math.max(0.0002,gain), time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(envelope).connect(this.output(destination));
    source.start(time);
    source.stop(time + duration + 0.02);
  }
  pump(time, depth=0.5, release=0.2) {
    if (!this.synthGain) return;
    const gain = this.synthGain.gain;
    gain.setValueAtTime(Math.max(0.18,depth),time);
    gain.exponentialRampToValueAtTime(1,time+release);
  }
  cue(kind="short") {
    if (!this.context) return;
    const now = this.context.currentTime + 0.01;
    if (kind === "end") {
      this.tone(660, now, 0.12, {destination:"cue", gain:0.22});
      this.tone(880, now + 0.15, 0.28, {destination:"cue", gain:0.25});
    } else if (kind === "change") {
      this.tone(740, now, 0.08, {destination:"cue", gain:0.18});
      this.tone(980, now + 0.1, 0.13, {destination:"cue", gain:0.2});
    } else this.tone(880, now, 0.08, {destination:"cue", gain:0.16});
  }
}

class ProceduralMusicEngine {
  constructor(runtime) {
    this.runtime = runtime;
    this.active = false;
    this.timer = null;
    this.nextStepTime = 0;
    this.step = 0;
    this.config = defaultMusic();
    this.seed = Math.random() * 10000;
  }
  async start(config={}) {
    await this.runtime.unlock();
    this.setConfig(config);
    if (this.active) return;
    this.active = true;
    this.nextStepTime = this.runtime.context.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }
  pause() { this.active = false; if (this.timer) clearInterval(this.timer); this.timer = null; }
  stop() { this.pause(); this.step = 0; this.nextStepTime = 0; this.seed = Math.random() * 10000; }
  setConfig(config={}) {
    this.config = normalizeMusic({...this.config, ...config});
    this.runtime.setVolume(this.config.volume);
  }
  variation(step,salt=0) {
    const value = Math.sin((step+1+this.seed)*12.9898 + salt*78.233) * 43758.5453;
    return value - Math.floor(value);
  }
  schedule() {
    if (!this.active || !this.runtime.context) return;
    const horizon = this.runtime.context.currentTime + 0.2;
    while (this.nextStepTime < horizon) {
      this.scheduleStep(this.step, this.nextStepTime);
      this.nextStepTime += 60 / this.config.bpm / 4;
      this.step += 1;
    }
  }
  scheduleStep(step, time) {
    const {style,intensity,bpm} = this.config;
    const local = step % 16;
    const bar = Math.floor(step / 16);
    const phraseBar = bar % 8;
    const cycle = Math.floor(bar / 8) % 4;
    const energy = intensity === "high" ? 1 : intensity === "low" ? 0.55 : 0.78;
    const sixteenth = 60 / bpm / 4;
    const progressions = {
      techno:[0,0,3,5,0,7,5,3],
      workout:[0,5,3,7,0,5,8,7],
      electronic:[0,3,7,5,0,8,7,3],
      house:[0,5,7,3,0,5,8,7],
      ambient:[0,5,3,7,8,5,3,0]
    };
    const rootShift = progressions[style][phraseBar] + (cycle === 2 ? 2 : cycle === 3 ? -2 : 0);
    const root = 55 * Math.pow(2,rootShift/12);
    if (style === "ambient") {
      this.scheduleAmbient(local,bar,root,time,energy,sixteenth);
      return;
    }

    const breakdown = phraseBar === 7 && local < 8;
    const fourFloor = local % 4 === 0;
    if (fourFloor && (!breakdown || local === 0)) {
      this.runtime.sample("kick",time,{gain:(style === "techno" ? 0.62 : 0.5)*energy});
      this.runtime.pump(time,style === "techno" ? 0.34 : 0.5,Math.min(0.28,sixteenth*3.2));
    }
    if ((local === 4 || local === 12) && !breakdown) {
      this.runtime.sample("clap",time,{gain:(style === "workout" ? 0.25 : 0.2)*energy});
      this.runtime.tone(185,time,0.08,{type:"triangle",gain:0.025*energy,destination:"drum"});
    }

    const hatSteps = intensity === "low" ? [2,6,10,14] : [2,4,6,10,12,14];
    if (!breakdown && (hatSteps.includes(local) || (intensity === "high" && local%2 === 1 && this.variation(step,1)>.38))) {
      this.runtime.sample("hat",time,{gain:(style === "techno" ? 0.11 : 0.085)*energy,playbackRate:0.92+this.variation(step,2)*0.18});
    }
    if (!breakdown && (local === 6 || (local === 14 && phraseBar%2===1))) {
      this.runtime.sample("openHat",time,{gain:0.065*energy,playbackRate:0.96+cycle*0.025});
    }

    const riffs = {
      techno:[[0,0],[3,0],[6,3],[7,0],[10,7],[12,5],[14,3]],
      workout:[[0,0],[2,0],[6,5],[8,0],[11,7],[14,3]],
      electronic:[[0,0],[3,7],[7,3],[10,0],[12,5],[15,7]],
      house:[[0,0],[3,0],[6,7],[10,5],[14,3]]
    };
    const note = riffs[style].find(([position]) => position === local);
    if (note && !breakdown) {
      const semitone = note[1] + ((phraseBar===3 || phraseBar===6) && local>=12 ? 2 : 0);
      const frequency = root * Math.pow(2,semitone/12);
      const duration = sixteenth * (style === "techno" ? 1.9 : 1.45);
      this.runtime.tone(frequency,time,duration,{type:"sine",gain:(style==="techno"?0.11:0.075)*energy});
      this.runtime.tone(frequency*2,time,duration*0.82,{
        type:style === "house" ? "square" : "sawtooth",
        gain:(style==="techno"?0.055:0.032)*energy,
        filterFreq:style==="techno"?650:900,
        filterEndFreq:style==="techno"?180:420,
        filterQ:style==="techno"?8:3
      });
    }

    const stabSteps = style === "house" ? [2,10] : style === "electronic" ? [4,12] : style === "workout" ? [6,14] : [7,15];
    if (!breakdown && stabSteps.includes(local) && (intensity !== "low" || phraseBar%2===1)) {
      const chord = style === "techno" ? [0,3,7] : [0,4,7];
      chord.forEach((semitone,index) => this.runtime.tone(root*2*Math.pow(2,semitone/12),time+index*0.004,sixteenth*1.7,{
        type:style==="techno"?"sawtooth":"triangle",gain:0.014*energy,
        filterFreq:style==="techno"?1250:1700,filterEndFreq:320,filterQ:4
      }));
    }

    if (intensity === "high" && !breakdown && phraseBar%2===1 && [1,5,9,13].includes(local)) {
      const arp = [0,7,12,10][Math.floor(local/4)];
      this.runtime.tone(root*4*Math.pow(2,arp/12),time,sixteenth*0.8,{type:"square",gain:0.012,filterFreq:2200,filterEndFreq:900,filterQ:2});
    }

    if (phraseBar === 7 && local >= 12) {
      const fillIndex = local - 12;
      this.runtime.sample("tom",time,{gain:(0.14+fillIndex*0.025)*energy,playbackRate:0.8+fillIndex*0.14});
      if (local === 15) this.runtime.noise(time,0.24,{gain:0.045*energy,highpass:2600,destination:"drum"});
    }
    if (breakdown && local === 0) {
      [0,3,7].forEach((semitone,index) => this.runtime.tone(root*2*Math.pow(2,semitone/12),time+index*0.01,sixteenth*7,{
        type:"sawtooth",gain:0.018*energy,filterFreq:1800,filterEndFreq:180,filterQ:5
      }));
    }
  }
  scheduleAmbient(local,bar,root,time,energy,sixteenth) {
    if (local === 0) {
      const chord = bar%2 ? [0,3,7] : [0,4,7];
      chord.forEach((semitone,index) => this.runtime.tone(root*2*Math.pow(2,semitone/12),time+index*0.035,sixteenth*15,{
        type:index===0?"sine":"triangle",gain:(index===0?0.035:0.018)*energy,
        filterFreq:1500,filterEndFreq:520,filterQ:1.2
      }));
    }
    if ([2,6,10,14].includes(local)) {
      const arp = [0,7,12,10][Math.floor(local/4)];
      this.runtime.tone(root*4*Math.pow(2,arp/12),time,sixteenth*2.5,{type:"sine",gain:0.014*energy});
    }
    if (local%4===2 && this.variation(bar*16+local,7)>0.35) this.runtime.sample("openHat",time,{gain:0.012*energy,playbackRate:1.35});
  }
}

class TrainingCueEngine {
  constructor(runtime, music) {
    this.runtime = runtime;
    this.music = music;
    this.options = defaultOptions();
    this.voice = null;
    this.speechToken = 0;
    this.loadVoices();
    if (window.speechSynthesis) window.speechSynthesis.addEventListener?.("voiceschanged", () => this.loadVoices());
  }
  loadVoices() {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    this.voice = voices.find(v => /^de[-_]/i.test(v.lang)) || voices.find(v => /^de/i.test(v.lang)) || voices.find(v => v.default) || null;
  }
  configure(options={}) {
    this.options = normalizeOptions(options);
    this.runtime.setDucking(this.options.ducking);
    this.runtime.setSignalVolume(this.options.signalVolume);
  }
  countdown(number) {
    if (this.options.signalsEnabled) this.runtime.cue("short");
    if (this.options.speechEnabled) this.speak(String(number));
  }
  announce(text) {
    if (this.options.signalsEnabled) this.runtime.cue("change");
    if (this.options.speechEnabled && text) this.speak(text);
  }
  complete() {
    if (this.options.signalsEnabled) this.runtime.cue("end");
    if (this.options.speechEnabled) this.speak("Training beendet");
  }
  speak(text) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance || !text) return;
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = this.voice?.lang || "de-DE";
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = /^\d+$/.test(String(text)) ? 0.85 : 1;
    utterance.volume = this.options.speechVolume;
    const token = ++this.speechToken;
    this.runtime.setDucked(true);
    const restore = () => { if (token === this.speechToken) this.runtime.setDucked(false); };
    utterance.onend = restore;
    utterance.onerror = restore;
    window.speechSynthesis.speak(utterance);
  }
  stop() {
    this.speechToken += 1;
    window.speechSynthesis?.cancel?.();
    this.runtime.setDucked(false);
  }
}

class TrainingPlayerController {
  constructor() {
    this.root = document.getElementById("trainingPlayer");
    if (!this.root) return;
    const ids = ["trainingPlayerToggle","trainingPlayerTemplateName","trainingPlayerSection","trainingPlayerRepeat","trainingPlayerTime","trainingPlayerPlay","trainingPlayerPause","trainingPlayerStop","trainingPlayerExpand","trainingPlayerEditor","trainingTemplateSelect","trainingTemplateName","trainingTemplateNew","trainingTemplateSave","trainingTemplateDelete","trainingMusicStyle","trainingBpm","trainingBpmOutput","trainingIntensity","trainingVolume","trainingVolumeOutput","trainingCountdownEnabled","trainingCountdownSeconds","trainingSpeechEnabled","trainingSpeechVolume","trainingSpeechVolumeOutput","trainingSignalsEnabled","trainingSignalVolume","trainingSignalVolumeOutput","trainingDucking","trainingDuckingOutput","trainingPhaseAdd","trainingPhases","trainingPlayerStatus"];
    this.e = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
    this.scope = "anonymous";
    this.customTemplates = [];
    this.current = normalizeTemplate(BUILTIN_TEMPLATES[0]);
    this.currentId = this.current.id;
    this.runtime = new AudioRuntime();
    this.music = new ProceduralMusicEngine(this.runtime);
    this.cues = new TrainingCueEngine(this.runtime, this.music);
    this.engine = new TrainingIntervalEngine({
      onState:state => this.renderState(state),
      onSegmentStart:segment => this.onSegmentStart(segment),
      onCountdown:value => this.cues.countdown(value),
      onComplete:() => this.onComplete()
    });
    this.wakeLock = null;
    this.bind();
    this.loadStorage();
    this.renderTemplateSelect();
    this.loadTemplate(this.readLastTemplateId() || BUILTIN_TEMPLATES[0].id, false);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.engine.status === "running") {
        this.pause();
        this.setStatus("Automatisch pausiert, weil die App nicht mehr im Vordergrund ist.");
      }
    });
  }
  storageKey(suffix) { return `${STORAGE_PREFIX}:${this.scope}:${suffix}`; }
  setContext({visible=false,userId="",teamId=""}={}) {
    const scope = `${userId || "local"}:${teamId || "no-team"}`;
    if (scope !== this.scope) {
      this.stop();
      this.scope = scope;
      this.loadStorage();
      this.renderTemplateSelect();
      this.loadTemplate(this.readLastTemplateId() || BUILTIN_TEMPLATES[0].id, false);
    }
    this.setVisible(Boolean(visible));
  }
  setVisible(visible) {
    const wasVisible = !this.root.classList.contains("hidden");
    this.root.classList.toggle("hidden", !visible);
    if (!visible && wasVisible) this.stop();
  }
  bind() {
    this.e.trainingPlayerToggle.addEventListener("click", () => this.toggleExpanded());
    this.e.trainingPlayerExpand.addEventListener("click", () => this.toggleExpanded());
    this.e.trainingPlayerPlay.addEventListener("click", () => this.play());
    this.e.trainingPlayerPause.addEventListener("click", () => this.pause());
    this.e.trainingPlayerStop.addEventListener("click", () => this.stop());
    this.e.trainingTemplateSelect.addEventListener("change", () => this.loadTemplate(this.e.trainingTemplateSelect.value));
    this.e.trainingTemplateNew.addEventListener("click", () => this.newTemplate());
    this.e.trainingTemplateSave.addEventListener("click", () => this.saveTemplate());
    this.e.trainingTemplateDelete.addEventListener("click", () => this.deleteTemplate());
    this.e.trainingPhaseAdd.addEventListener("click", () => { this.readEditor(); this.current.phases.push(continuousPhase()); this.renderPhases(); this.refreshIdleTimeline(); });
    [this.e.trainingMusicStyle,this.e.trainingBpm,this.e.trainingIntensity,this.e.trainingVolume,this.e.trainingCountdownEnabled,this.e.trainingCountdownSeconds,this.e.trainingSpeechEnabled,this.e.trainingSpeechVolume,this.e.trainingSignalsEnabled,this.e.trainingSignalVolume,this.e.trainingDucking].forEach(control => control.addEventListener("input", () => { this.updateOutputs(); this.readEditor(); this.refreshIdleTimeline(); }));
    this.e.trainingPhases.addEventListener("input", event => this.onPhaseInput(event));
    this.e.trainingPhases.addEventListener("change", event => this.onPhaseInput(event));
    this.e.trainingPhases.addEventListener("click", event => this.onPhaseAction(event));
    window.addEventListener("pagehide", () => { this.music.stop(); this.cues.stop(); this.releaseWakeLock(); });
  }
  toggleExpanded() {
    const expanded = this.root.classList.contains("is-collapsed");
    this.root.classList.toggle("is-collapsed", !expanded);
    this.e.trainingPlayerEditor.classList.toggle("hidden", !expanded);
    [this.e.trainingPlayerToggle,this.e.trainingPlayerExpand].forEach(button => button.setAttribute("aria-expanded", String(expanded)));
    this.e.trainingPlayerExpand.textContent = expanded ? "⌃" : "⌄";
    this.e.trainingPlayerExpand.title = expanded ? "Einstellungen einklappen" : "Einstellungen aufklappen";
  }
  allTemplates() { return [...BUILTIN_TEMPLATES.map(normalizeTemplate), ...this.customTemplates.map(normalizeTemplate)]; }
  loadStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.storageKey("templates")) || "[]");
      this.customTemplates = Array.isArray(stored) ? stored.map(t => ({...normalizeTemplate(t), builtin:false})) : [];
    } catch { this.customTemplates = []; }
  }
  persist() { localStorage.setItem(this.storageKey("templates"), JSON.stringify(this.customTemplates)); }
  readLastTemplateId() { return localStorage.getItem(this.storageKey("last-template")) || ""; }
  renderTemplateSelect() {
    const selected = this.currentId;
    const group = (label, rows) => `<optgroup label="${label}">${rows.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</optgroup>`;
    const known = [...BUILTIN_TEMPLATES, ...this.customTemplates].some(t => t.id === selected);
    const unsaved = selected && !known ? group("Nicht gespeichert", [{id:selected,name:`${this.current.name} (neu)`}]) : "";
    this.e.trainingTemplateSelect.innerHTML = unsaved + group("Standardvorlagen", BUILTIN_TEMPLATES) + (this.customTemplates.length ? group("Eigene Vorlagen", this.customTemplates) : "");
    if ([...this.e.trainingTemplateSelect.options].some(o => o.value === selected)) this.e.trainingTemplateSelect.value = selected;
  }
  newTemplate() {
    this.stop();
    this.current = normalizeTemplate({
      id:uid(), builtin:false, name:"Neue Trainingsvorlage",
      music:defaultMusic(), options:defaultOptions(), phases:[intervalPhase("Intervall 1")]
    });
    this.currentId = this.current.id;
    this.renderTemplateSelect();
    this.writeEditor();
    this.engine.load(this.current);
    this.setStatus("Neue Vorlage angelegt. Namen und Ablauf bearbeiten, danach speichern.");
    this.e.trainingTemplateName.focus();
    this.e.trainingTemplateName.select();
  }
  loadTemplate(id, announce=true) {
    const source = this.allTemplates().find(t => t.id === id) || normalizeTemplate(BUILTIN_TEMPLATES[0]);
    this.stop();
    this.current = normalizeTemplate(source);
    this.currentId = source.id;
    this.current.id = source.id;
    this.current.builtin = Boolean(source.builtin);
    localStorage.setItem(this.storageKey("last-template"), this.currentId);
    this.renderTemplateSelect();
    this.writeEditor();
    this.engine.load(this.current);
    if (announce) this.setStatus(`Vorlage „${this.current.name}“ geladen.`);
  }
  writeEditor() {
    const {music,options} = this.current;
    this.e.trainingTemplateName.value = this.current.name;
    this.e.trainingMusicStyle.value = music.style;
    this.e.trainingBpm.value = music.bpm;
    this.e.trainingIntensity.value = music.intensity;
    this.e.trainingVolume.value = Math.round(music.volume * 100);
    this.e.trainingCountdownEnabled.checked = options.countdownEnabled;
    this.e.trainingCountdownSeconds.value = String(options.countdownSeconds);
    this.e.trainingSpeechEnabled.checked = options.speechEnabled;
    this.e.trainingSpeechVolume.value = Math.round(options.speechVolume * 100);
    this.e.trainingSignalsEnabled.checked = options.signalsEnabled;
    this.e.trainingSignalVolume.value = Math.round(options.signalVolume * 100);
    this.e.trainingDucking.value = Math.round(options.ducking * 100);
    this.renderPhases();
    this.updateOutputs();
    this.e.trainingTemplateDelete.disabled = this.current.builtin || !this.customTemplates.some(t => t.id === this.currentId);
    this.e.trainingPlayerTemplateName.textContent = this.current.name;
  }
  readEditor() {
    this.current.name = (this.e.trainingTemplateName.value.trim() || "Training").slice(0,80);
    this.current.music = normalizeMusic({style:this.e.trainingMusicStyle.value,bpm:this.e.trainingBpm.value,intensity:this.e.trainingIntensity.value,volume:Number(this.e.trainingVolume.value)/100});
    this.current.options = normalizeOptions({countdownEnabled:this.e.trainingCountdownEnabled.checked,countdownSeconds:this.e.trainingCountdownSeconds.value,speechEnabled:this.e.trainingSpeechEnabled.checked,speechVolume:Number(this.e.trainingSpeechVolume.value)/100,signalsEnabled:this.e.trainingSignalsEnabled.checked,signalVolume:Number(this.e.trainingSignalVolume.value)/100,ducking:Number(this.e.trainingDucking.value)/100});
    const cards = [...this.e.trainingPhases.querySelectorAll(".training-phase")];
    if (cards.length) this.current.phases = cards.map((card,index) => this.phaseFromCard(card,index));
    this.current = normalizeTemplate(this.current);
    this.e.trainingPlayerTemplateName.textContent = this.current.name;
    return this.current;
  }
  phaseFromCard(card,index) {
    const get = name => card.querySelector(`[data-field="${name}"]`);
    const type = get("type").value;
    const common = {id:card.dataset.phaseId || uid(),name:get("name").value,type,music:{style:get("musicStyle").value,bpm:get("bpm").value || null,intensity:get("intensity").value}};
    if (type === "interval") return {...common,workSeconds:get("workSeconds").value,pauseSeconds:get("pauseSeconds").value,repetitions:get("repetitions").value,blocks:get("blocks").value,longPauseSeconds:get("longPauseSeconds").value,workLabel:get("workLabel").value,pauseLabel:get("pauseLabel").value,longPauseLabel:get("longPauseLabel").value};
    return {...common,durationSeconds:get("durationSeconds").value,announcement:get("announcement").value};
  }
  musicOverrideFields(phase) {
    const style = phase.music?.style || "", intensity = phase.music?.intensity || "", bpm = phase.music?.bpm || "";
    return `<label>Musikstil<select data-field="musicStyle"><option value="">Vorlagenwert</option><option value="electronic" ${style==="electronic"?"selected":""}>Electronic</option><option value="workout" ${style==="workout"?"selected":""}>Workout</option><option value="house" ${style==="house"?"selected":""}>House</option><option value="techno" ${style==="techno"?"selected":""}>Techno</option><option value="ambient" ${style==="ambient"?"selected":""}>Ambient</option></select></label><label>BPM<input data-field="bpm" type="number" min="70" max="160" value="${bpm}" placeholder="Vorlage"></label><label>Intensität<select data-field="intensity"><option value="">Vorlagenwert</option><option value="low" ${intensity==="low"?"selected":""}>Niedrig</option><option value="medium" ${intensity==="medium"?"selected":""}>Mittel</option><option value="high" ${intensity==="high"?"selected":""}>Hoch</option></select></label>`;
  }
  renderPhases() {
    this.e.trainingPhases.innerHTML = this.current.phases.map((phase,index) => {
      const common = `<div class="training-phase-head"><strong>Phase ${index+1}</strong><div><button type="button" data-action="up" aria-label="Phase nach oben" ${index===0?"disabled":""}>↑</button><button type="button" data-action="down" aria-label="Phase nach unten" ${index===this.current.phases.length-1?"disabled":""}>↓</button><button type="button" data-action="delete" class="danger" aria-label="Phase löschen" ${this.current.phases.length===1?"disabled":""}>🗑</button></div></div><div class="training-phase-common"><label>Name<input data-field="name" type="text" maxlength="80" value="${esc(phase.name)}"></label><label>Art<select data-field="type"><option value="continuous" ${phase.type==="continuous"?"selected":""}>Fortlaufende Phase</option><option value="interval" ${phase.type==="interval"?"selected":""}>Intervallblock</option></select></label>${this.musicOverrideFields(phase)}</div>`;
      const details = phase.type === "interval"
        ? `<div class="training-phase-details interval"><label>Action-Bezeichnung<input data-field="workLabel" type="text" maxlength="80" value="${esc(phase.workLabel)}"></label><label>Action (Sek.)<input data-field="workSeconds" type="number" min="1" max="3600" value="${phase.workSeconds}"></label><label>Pause-Bezeichnung<input data-field="pauseLabel" type="text" maxlength="80" value="${esc(phase.pauseLabel)}"></label><label>Pause (Sek.)<input data-field="pauseSeconds" type="number" min="0" max="3600" value="${phase.pauseSeconds}"></label><label>Wiederholungen<input data-field="repetitions" type="number" min="1" max="99" value="${phase.repetitions}"></label><label>Blöcke / Sätze<input data-field="blocks" type="number" min="1" max="30" value="${phase.blocks}"></label><label>Blockpause-Bezeichnung<input data-field="longPauseLabel" type="text" maxlength="80" value="${esc(phase.longPauseLabel)}"></label><label>Blockpause (Sek.)<input data-field="longPauseSeconds" type="number" min="0" max="3600" value="${phase.longPauseSeconds}"></label></div>`
        : `<div class="training-phase-details continuous"><label>Dauer (Sek.)<input data-field="durationSeconds" type="number" min="1" max="7200" value="${phase.durationSeconds}"></label><label>Ansage beim Start<input data-field="announcement" type="text" maxlength="180" value="${esc(phase.announcement)}" placeholder="z. B. Nächste Station"></label></div>`;
      return `<article class="training-phase" data-phase-id="${esc(phase.id)}">${common}${details}</article>`;
    }).join("");
  }
  onPhaseInput(event) {
    if (!event.target.closest(".training-phase")) return;
    const typeChanged = event.target.dataset.field === "type";
    this.readEditor();
    if (typeChanged) this.renderPhases();
    this.refreshIdleTimeline();
  }
  onPhaseAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button || button.disabled) return;
    this.readEditor();
    const card = button.closest(".training-phase");
    const index = [...this.e.trainingPhases.children].indexOf(card);
    if (button.dataset.action === "delete" && this.current.phases.length > 1) this.current.phases.splice(index,1);
    if (button.dataset.action === "up" && index > 0) [this.current.phases[index-1],this.current.phases[index]]=[this.current.phases[index],this.current.phases[index-1]];
    if (button.dataset.action === "down" && index < this.current.phases.length-1) [this.current.phases[index+1],this.current.phases[index]]=[this.current.phases[index],this.current.phases[index+1]];
    this.renderPhases();
    this.refreshIdleTimeline();
  }
  refreshIdleTimeline() { if (this.engine.status === "idle" || this.engine.status === "completed") this.engine.load(this.current); }
  updateOutputs() {
    this.e.trainingBpmOutput.value = this.e.trainingBpm.value;
    this.e.trainingBpmOutput.textContent = this.e.trainingBpm.value;
    this.e.trainingVolumeOutput.value = `${this.e.trainingVolume.value} %`;
    this.e.trainingVolumeOutput.textContent = `${this.e.trainingVolume.value} %`;
    this.e.trainingSpeechVolumeOutput.value = `${this.e.trainingSpeechVolume.value} %`;
    this.e.trainingSpeechVolumeOutput.textContent = `${this.e.trainingSpeechVolume.value} %`;
    this.e.trainingSignalVolumeOutput.value = `${this.e.trainingSignalVolume.value} %`;
    this.e.trainingSignalVolumeOutput.textContent = `${this.e.trainingSignalVolume.value} %`;
    this.e.trainingDuckingOutput.value = `${this.e.trainingDucking.value} %`;
    this.e.trainingDuckingOutput.textContent = `${this.e.trainingDucking.value} %`;
  }
  saveTemplate() {
    this.readEditor();
    const name = this.e.trainingTemplateName.value.trim();
    if (!name) { this.setStatus("Bitte einen Namen für die Vorlage eingeben.", true); this.e.trainingTemplateName.focus(); return; }
    const existingIndex = this.customTemplates.findIndex(t => t.id === this.currentId);
    const id = existingIndex >= 0 ? this.currentId : (this.current.builtin ? uid() : this.currentId || uid());
    const saved = {...clone(this.current), id, builtin:false, name};
    if (existingIndex >= 0) this.customTemplates[existingIndex] = saved; else this.customTemplates.push(saved);
    this.persist();
    this.currentId = id;
    this.current = normalizeTemplate(saved);
    localStorage.setItem(this.storageKey("last-template"), id);
    this.renderTemplateSelect();
    this.writeEditor();
    this.engine.load(this.current);
    this.setStatus(`Vorlage „${name}“ gespeichert.`);
  }
  deleteTemplate() {
    if (this.current.builtin || !this.currentId.startsWith("custom-")) return;
    if (!window.confirm(`Vorlage „${this.current.name}“ löschen?`)) return;
    this.customTemplates = this.customTemplates.filter(t => t.id !== this.currentId);
    this.persist();
    this.loadTemplate(BUILTIN_TEMPLATES[0].id, false);
    this.setStatus("Eigene Vorlage gelöscht.");
  }
  async play() {
    try {
      await this.runtime.unlock();
      if (this.engine.status === "idle" || this.engine.status === "completed") {
        this.readEditor();
        this.engine.load(this.current);
        this.cues.configure(this.current.options);
      }
      const segment = this.engine.current();
      await this.music.start(segment?.music || this.current.music);
      this.engine.play();
      this.lockEditor(true);
      this.requestWakeLock();
      this.setStatus(this.engine.status === "running" ? "Training läuft." : "Training bereit.");
    } catch (error) { this.setStatus(error.message || "Audio konnte nicht gestartet werden.", true); }
  }
  pause() {
    if (this.engine.status !== "running") return;
    this.engine.pause();
    this.music.pause();
    this.cues.stop();
    this.releaseWakeLock();
    this.setStatus("Training pausiert.");
  }
  stop() {
    this.engine?.stop();
    this.music?.stop();
    this.cues?.stop();
    this.releaseWakeLock();
    this.lockEditor(false);
    if (this.root && !this.root.classList.contains("hidden")) this.setStatus("Training zurückgesetzt.");
  }
  onSegmentStart(segment) {
    this.music.setConfig(segment.music);
    this.cues.configure(this.current.options);
    this.cues.announce(segment.label);
  }
  onComplete() {
    this.music.stop();
    this.cues.complete();
    this.releaseWakeLock();
    this.lockEditor(false);
    this.setStatus("Training beendet.");
  }
  renderState(state) {
    if (!this.root) return;
    const segment = state.segment;
    this.e.trainingPlayerSection.textContent = state.status === "completed" ? "Beendet" : segment?.label || "Bereit";
    let repeat = "–";
    if (segment?.repetitions) repeat = `${segment.repeat}/${segment.repetitions}${segment.blocks > 1 ? ` · Block ${segment.block}/${segment.blocks}` : ""}`;
    else if (segment) repeat = segment.phaseName;
    this.e.trainingPlayerRepeat.textContent = repeat;
    const seconds = state.remainingMs / 1000;
    this.e.trainingPlayerTime.textContent = formatTime(seconds);
    this.e.trainingPlayerTime.setAttribute("datetime", `PT${Math.max(0,Math.ceil(seconds))}S`);
    this.e.trainingPlayerPlay.disabled = state.status === "running";
    this.e.trainingPlayerPause.disabled = state.status !== "running";
    this.e.trainingPlayerStop.disabled = state.status === "idle";
    this.root.dataset.state = state.status;
  }
  lockEditor(locked) {
    this.e.trainingPlayerEditor.querySelectorAll("input,select,button").forEach(control => {
      if ([this.e.trainingPlayerPlay,this.e.trainingPlayerPause,this.e.trainingPlayerStop].includes(control)) return;
      control.disabled = Boolean(locked);
    });
    if (!locked) this.e.trainingTemplateDelete.disabled = this.current.builtin || !this.customTemplates.some(t => t.id === this.currentId);
    this.e.trainingPlayerEditor.classList.toggle("is-locked", Boolean(locked));
  }
  setStatus(message, error=false) {
    this.e.trainingPlayerStatus.textContent = message || "";
    this.e.trainingPlayerStatus.classList.toggle("error", Boolean(error));
  }
  async requestWakeLock() {
    try { if (navigator.wakeLock?.request && !this.wakeLock) this.wakeLock = await navigator.wakeLock.request("screen"); } catch {}
  }
  async releaseWakeLock() {
    try { await this.wakeLock?.release?.(); } catch {}
    this.wakeLock = null;
  }
}

window.VBTrainingPlayer = new TrainingPlayerController();
window.VBTrainingPlayerInternals = {VERSION, normalizeTemplate, buildTimeline, TrainingIntervalEngine, AudioRuntime, ProceduralMusicEngine, TrainingCueEngine};
})();
