(() => {
  "use strict";

  const ACCESS_KEY = "volleyball-trainer-access-v3";
  const AUTH_KEY = "volleyball-trainer-auth-v3";
  const SETTINGS_KEY = "vb-power-dance-lab-settings-v1";
  const AB_KEY = "vb-power-dance-lab-ab-v1";
  const CLIP_SELECTIONS_KEY = "vb-power-dance-lab-melodic-clips-v1";
  const FAMILY_VARIANTS_KEY = "vb-power-dance-lab-family-variants-v1";
  const AI_RUNTIME_URL = "vendor/magenta/magentamusic-1.23.1.js";
  const AI_MODEL_URL = "assets/models/chord-pitches-improv";
  const STRUCTURAL = new Set(["intensity", "bassVariability", "melodyMode", "melodyDensity", "melodyVariability", "melodyClipMode", "loopFamily", "loopForm", "loopRegister", "timbreChange", "arrangementContrast", "fillFrequency", "choirIntensity"]);
  const DEFAULTS = Object.freeze({
    bpm: 150, intensity: "high", bassPressure: 3, bassVariability: 3,
    chordPresence: 2, melodyMode: "classic", melodyPresence: 3, melodyDensity: 2, melodyVariability: 3,
    melodyClipMode: "accent", motifPresence: 2, loopFamily: "fupi-edm", loopForm: "call-response", loopRegister: "normal", timbreChange: 3,
    choirIntensity: 2, arrangementContrast: 3, brightness: 4,
    space: 2, fillFrequency: 2, seed: 31650,
  });
  const CHORDS = [[36, [60, 64, 67]], [43, [55, 59, 62]], [45, [57, 60, 64]], [41, [53, 57, 60]]];
  const CHORD_NAMES = ["C", "G", "Am", "F"];
  const LOOP_FAMILIES = Object.freeze([
    Object.freeze({
      id:"fupi-edm", name:"Fupi · Melodic EDM", bpm:140, key:"D-Dur", volumeDb:-6,
      source:"https://opengameart.org/content/melodic-edm-loops", license:"CC0 1.0",
      chords:[[38,[62,66,69]],[45,[57,61,64]],[47,[59,62,66]],[43,[55,59,62]]],
      variants:[
        {id:"main",name:"Motiv A",url:"assets/audio/packs/power-dance-loop-families/fupi/main.ogg",bars:4},
        {id:"loopy",name:"Antwort B",url:"assets/audio/packs/power-dance-loop-families/fupi/loopy.ogg",bars:4},
        {id:"skippy",name:"A–A–B–A′ rhythmisch",url:"assets/audio/packs/power-dance-loop-families/fupi/skippy.ogg",bars:8},
        {id:"bright-main",name:"Motiv A · helle Oktave",url:"assets/audio/packs/power-dance-loop-families/fupi/bright-main.ogg",bars:4},
        {id:"bright-loopy",name:"Antwort B · helle Oktave",url:"assets/audio/packs/power-dance-loop-families/fupi/bright-loopy.ogg",bars:4},
        {id:"bright-skippy",name:"A–A–B–A′ · helle Oktave",url:"assets/audio/packs/power-dance-loop-families/fupi/bright-skippy.ogg",bars:8},
      ],
    }),
    Object.freeze({
      id:"orbit-pluck", name:"Orbit 2 · Pluck", bpm:140, key:"A-Moll", volumeDb:6,
      source:"https://freesound.org/people/deadrobotmusic/sounds/850693/", license:"CC0 1.0 · Freesound 850693",
      chords:[[45,[57,60,64]],[41,[53,57,60]],[36,[60,64,67]],[43,[55,59,62]]],
      variants:[
        {id:"motif-a",name:"Motiv A",url:"assets/audio/packs/power-dance-loop-families/orbit/motif-a.ogg",bars:4},
        {id:"answer-b",name:"Antwort B",url:"assets/audio/packs/power-dance-loop-families/orbit/answer-b.ogg",bars:4},
      ],
    }),
    Object.freeze({
      id:"shibuya", name:"Shibuya · Instrument-Layer", bpm:104, key:"C-Dur", volumeDb:8,
      source:"https://freesound.org/people/deadrobotmusic/packs/31200/", license:"CC0 1.0 · Freesound 703688–703690",
      chords:CHORDS,
      variants:[
        {id:"synth",name:"Synth",url:"assets/audio/packs/power-dance-loop-families/shibuya/synth.ogg",bars:4,volumeDb:11},
        {id:"plucks",name:"Plucks",url:"assets/audio/packs/power-dance-loop-families/shibuya/plucks.ogg",bars:4,volumeDb:12},
        {id:"piano",name:"Piano",url:"assets/audio/packs/power-dance-loop-families/shibuya/piano.ogg",bars:4,volumeDb:8},
      ],
    }),
  ]);
  // One eight-bar hook form: A – A – B – A'. Rhythm comes first and stays
  // recognizable; pitch movements are subsequently voiced into each chord.
  const HOOK_FORM = [
    [[0, 0], [4, 2], [10, 2]], [[2, -2], [8, -2]],
    [[0, 0], [4, 2], [10, 2]], [[2, -2], [8, -2]],
    [[0, 2], [4, 3], [10, -2]], [[2, -2], [8, 2]],
    [[0, 0], [4, 2], [10, 2]], [[2, -2], [8, -2], [12, -2]],
  ];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const isAdmin = () => { try { return Boolean(JSON.parse(localStorage.getItem(ACCESS_KEY) || "null")?.platform_admin); } catch { return false; } };
  const session = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; } };
  const api = () => { if (!window.VBTrainingApi) throw new Error("API noch nicht bereit"); return window.VBTrainingApi; };
  const midi = value => Tone.Frequency(value, "midi").toNote();
  const safeSlug = value => String(value || "sample-pack").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 54) || "sample-pack";
  const safeFile = value => String(value || "sample.mp3").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100);
  const publicSampleUrl = prefix => `${window.APP_CONFIG.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/vt-music-samples/${prefix.replace(/^\/+|\/+$/g, "")}/`;

  let dialog = null;
  let catalog = [];
  let presets = [];
  let desired = loadSettings();
  let active = {...desired};
  let pending = false;
  let engine = null;
  let previewAudio = null;
  let selectedClipIds = loadClipSelections();
  let disabledFamilyVariants = loadDisabledFamilyVariants();
  let blockCounter = 0;
  let playing = false;
  let aiModel = null;
  let aiModelPromise = null;
  let aiNextBlock = null;
  let aiGenerationPromise = null;
  let aiGenerationToken = 0;

  function loadSettings() {
    try { return {...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")}; }
    catch { return {...DEFAULTS}; }
  }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(desired)); }
  function loadClipSelections() {
    try { return new Set(JSON.parse(localStorage.getItem(CLIP_SELECTIONS_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveClipSelections() { localStorage.setItem(CLIP_SELECTIONS_KEY, JSON.stringify([...selectedClipIds])); }
  function loadDisabledFamilyVariants() {
    try { return new Set(JSON.parse(localStorage.getItem(FAMILY_VARIANTS_KEY) || "[]")); }
    catch { return new Set(); }
  }
  function saveDisabledFamilyVariants() { localStorage.setItem(FAMILY_VARIANTS_KEY, JSON.stringify([...disabledFamilyVariants])); }
  function loopFamily(id = desired.loopFamily) { return LOOP_FAMILIES.find(item => item.id === id) || LOOP_FAMILIES[0]; }
  function enabledFamilyVariants(family) { return family.variants.filter(item => !disabledFamilyVariants.has(`${family.id}:${item.id}`)); }
  function seeded(seed) { let state = seed >>> 0; return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296); }
  function values() {
    if (!dialog) return {...desired};
    const out = {...desired};
    dialog.querySelectorAll("[data-pd-setting]").forEach(input => {
      out[input.dataset.pdSetting] = input.type === "range" || input.type === "number" ? Number(input.value) : input.value;
    });
    return out;
  }
  function status(message, error = false) {
    const el = dialog?.querySelector("[data-pd-status]");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", error);
  }
  function pendingStatus() {
    const el = dialog?.querySelector("[data-pd-pending]");
    if (!el) return;
    const mode = active.melodyMode === "loops" ? loopFamily(active.loopFamily).name : active.melodyMode === "ai" ? "KI-Melodie" : "Klassische Melodie";
    const loopDetail = active.melodyMode === "loops" && engine?.activeLoopLabel ? ` · ${engine.activeLoopLabel}` : "";
    el.textContent = pending && playing ? "Änderungen vorgemerkt · Übernahme im nächsten 8-Takt-Block" : playing ? `Block ${Math.max(1, blockCounter)} · ${mode}${loopDetail} · ${active.bpm} BPM` : "Bereit · Änderungen werden beim Start übernommen";
    el.classList.toggle("pending", pending && playing);
  }
  function aiStatus(message, error = false) {
    const el = dialog?.querySelector("[data-pd-ai-status]");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", error);
  }
  function loadAiRuntime() {
    if (window.mm?.MusicRNN) return Promise.resolve(window.mm);
    const existing = document.querySelector('script[data-pd-ai-runtime]');
    if (existing) return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.mm), {once:true});
      existing.addEventListener("error", () => reject(new Error("KI-Laufzeit konnte nicht geladen werden.")), {once:true});
    });
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = AI_RUNTIME_URL; script.defer = true; script.dataset.pdAiRuntime = "1";
      script.onload = () => window.mm?.MusicRNN ? resolve(window.mm) : reject(new Error("MusicRNN ist nicht verfügbar."));
      script.onerror = () => reject(new Error("KI-Laufzeit konnte nicht geladen werden."));
      document.head.appendChild(script);
    });
  }
  async function ensureAiModel() {
    if (aiModel?.isInitialized?.()) return aiModel;
    if (aiModelPromise) return aiModelPromise;
    aiModelPromise = (async () => {
      aiStatus("Lokales KI-Modell wird geladen …");
      const mm = await loadAiRuntime();
      const model = new mm.MusicRNN(AI_MODEL_URL);
      const started = performance.now();
      await model.initialize();
      aiModel = model;
      aiStatus(`KI bereit · einmalig ${(performance.now() - started).toFixed(0)} ms Ladezeit`);
      return model;
    })().catch(error => {
      aiModelPromise = null; aiStatus(`KI nicht verfügbar · klassischer Fallback: ${error.message}`, true); throw error;
    });
    return aiModelPromise;
  }
  function aiPrimer() {
    return {
      notes:[
        {pitch:67,quantizedStartStep:0,quantizedEndStep:4},
        {pitch:71,quantizedStartStep:6,quantizedEndStep:8},
        {pitch:72,quantizedStartStep:9,quantizedEndStep:12},
        {pitch:71,quantizedStartStep:13,quantizedEndStep:15},
        {pitch:67,quantizedStartStep:18,quantizedEndStep:21},
        {pitch:62,quantizedStartStep:24,quantizedEndStep:28},
        {pitch:67,quantizedStartStep:29,quantizedEndStep:31},
      ],
      quantizationInfo:{stepsPerQuarter:4}, tempos:[{time:0,qpm:150}], totalQuantizedSteps:32,
    };
  }
  function nearestScalePitch(target, allowedPitchClasses) {
    const candidates = [];
    for (let note = 64; note <= 79; note++) if (allowedPitchClasses.includes(note % 12)) candidates.push(note);
    return candidates.reduce((best, note) => Math.abs(note - target) < Math.abs(best - target) ? note : best, candidates[0]);
  }
  function cleanAiEvents(rawNotes, blockIndex, cfg) {
    const majorPitchClasses = [0,2,4,5,7,9,11], primer = aiPrimer().notes;
    const combined = primer.concat((rawNotes || []).map(note => ({
      pitch:Number(note.pitch), quantizedStartStep:Number(note.quantizedStartStep) + 32, quantizedEndStep:Number(note.quantizedEndStep) + 32,
    })));
    const output = []; let previous = 67;
    combined.sort((a,b) => a.quantizedStartStep - b.quantizedStartStep).forEach(item => {
      const start = Math.max(0, Math.min(127, Number(item.quantizedStartStep)));
      const bar = Math.floor(start / 16), step = start % 16;
      let note = nearestScalePitch(Number(item.pitch), majorPitchClasses);
      const chord = CHORDS[(bar + blockIndex) % CHORDS.length][1];
      if (step === 0 || step === 8) note = nearestChordPitch(chord, note);
      if (Math.abs(note - previous) > 7) {
        const nearby = majorPitchClasses.flatMap(pc => [pc + 60, pc + 72]).filter(value => value >= 64 && value <= 79 && Math.abs(value - previous) <= 7);
        if (nearby.length) note = nearby.reduce((best, value) => Math.abs(value - note) < Math.abs(best - note) ? value : best, nearby[0]);
      }
      const durationSteps = Math.max(2, Math.min(7, Number(item.quantizedEndStep) - Number(item.quantizedStartStep)));
      if (output.length && start < output[output.length - 1].end) return;
      output.push({bar, step, note, duration:durationSteps / 4, end:start + durationSteps}); previous = note;
    });
    const densityLimit = [0, 10, 16, 22, 28, 36][cfg.melodyDensity] || 16;
    if (output.length > densityLimit) {
      const protectedEvents = output.filter((event, index) => index < 7 || event.step === 0);
      const optional = output.filter(event => !protectedEvents.includes(event));
      while (protectedEvents.length < densityLimit && optional.length) protectedEvents.push(optional.shift());
      return protectedEvents.sort((a,b) => a.bar - b.bar || a.step - b.step);
    }
    return output;
  }
  async function generateAiBlock(blockIndex, cfg, token = aiGenerationToken) {
    const model = await ensureAiModel();
    const chords = Array.from({length:8}, (_, bar) => CHORD_NAMES[(bar + blockIndex) % CHORD_NAMES.length]);
    const temperature = [0,.48,.56,.64,.72,.80][cfg.melodyVariability] || .64;
    const started = performance.now();
    const result = await model.continueSequence(aiPrimer(), 96, temperature, chords);
    if (token !== aiGenerationToken) return null;
    const events = cleanAiEvents(result.notes, blockIndex, cfg);
    if (events.length < 7) throw new Error("KI-Phrase war zu leer");
    aiStatus(`KI-Phrase vorbereitet · ${events.length} Noten · ${(performance.now() - started).toFixed(0)} ms`);
    return events;
  }
  function queueNextAiBlock(blockIndex, cfg) {
    if (cfg.melodyMode !== "ai" || aiGenerationPromise) return;
    const token = aiGenerationToken;
    aiGenerationPromise = generateAiBlock(blockIndex, cfg, token)
      .then(events => { if (events && token === aiGenerationToken) aiNextBlock = events; })
      .catch(error => aiStatus(`KI-Fallback aktiv: ${error.message}`, true))
      .finally(() => { aiGenerationPromise = null; });
  }

  function control(name, label, left, right, value = DEFAULTS[name]) {
    return `<label class="pd-control"><span><strong>${esc(label)}</strong><output data-pd-output="${esc(name)}">${value}</output></span><input data-pd-setting="${esc(name)}" type="range" min="1" max="5" step="1" value="${value}"><small>${esc(left)} <i>↔</i> ${esc(right)}</small></label>`;
  }
  function createDialog() {
    if (dialog) return dialog;
    const familyOptions = LOOP_FAMILIES.map(item => `<option value="${esc(item.id)}">${esc(item.name)} · ${esc(item.key)} · ${item.bpm} BPM</option>`).join("");
    dialog = document.createElement("dialog");
    dialog.id = "powerDanceLabDialog";
    dialog.className = "power-dance-lab-dialog";
    dialog.innerHTML = `<div class="pd-shell">
      <header class="pd-head"><div><span class="eyebrow">Nur für Superadmins</span><h2>Power Dance Lab</h2><p>Live-Testgenerator · Änderungen am Arrangement greifen musikalisch sauber am nächsten 8-Takt-Block.</p></div><button data-pd-close type="button" aria-label="Schließen">✕</button></header>
      <section class="pd-transport">
        <button class="primary" data-pd-play type="button">▶ Abspielen</button><button data-pd-stop type="button" disabled>■ Stoppen</button><button data-pd-new type="button">↻ Neue Variante</button>
        <label>BPM <input data-pd-setting="bpm" type="number" min="128" max="165" value="${desired.bpm}"></label>
        <label>Intensität <select data-pd-setting="intensity"><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option></select></label>
      </section>
      <p class="pd-pending" data-pd-pending></p>
      <section class="pd-mode-row">
        <label><strong>Melodie-Engine</strong><select data-pd-setting="melodyMode"><option value="classic">Klassisch · Variante A</option><option value="loops">Loop-Melodiefamilien</option><option value="ai">KI · ImprovRNN (lokal)</option></select></label>
        <label><strong>Melody-Loop</strong><select data-pd-setting="melodyClipMode"><option value="accent">Als Motiv/Akzent ergänzen</option><option value="replace">Melodie vollständig ersetzen</option></select></label>
        <label data-pd-family-control><strong>Melodiefamilie</strong><select data-pd-setting="loopFamily">${familyOptions}</select></label>
        <label data-pd-family-control><strong>Phrasenform</strong><select data-pd-setting="loopForm"><option value="motif">Nur Hauptmotiv</option><option value="call-response">Motiv und Antwort</option><option value="aaba">A–A–B–A′</option></select></label>
        <label data-pd-family-control><strong>Tonlage</strong><select data-pd-setting="loopRegister"><option value="low">Eine Oktave tiefer</option><option value="normal">Originaltonlage</option><option value="high">Eine Oktave höher</option></select></label>
        <p data-pd-ai-status>KI-Modell wird erst bei Auswahl lokal geladen. Loop-Familien laufen lokal mit unabhängiger Tempo- und Tonhöhensteuerung.</p>
      </section>
      <main class="pd-grid">
        ${control("bassPressure", "Bassdruck", "leicht", "druckvoll", desired.bassPressure)}
        ${control("bassVariability", "Bassvariabilität", "statisch", "melodisch", desired.bassVariability)}
        ${control("chordPresence", "Akkordpräsenz", "zurückhaltend", "deutlich", desired.chordPresence)}
        ${control("melodyPresence", "Melodiepräsenz", "zurückhaltend", "deutlich", desired.melodyPresence)}
        ${control("melodyDensity", "Melodiedichte", "viel Pause", "viele Einsätze", desired.melodyDensity)}
        ${control("melodyVariability", "Melodievariation", "nahe am Motiv", "stärker variiert", desired.melodyVariability)}
        ${control("motifPresence", "Loop-/Motivakzente", "sehr sparsam", "deutlich", desired.motifPresence)}
        ${control("timbreChange", "Klangfarbenwechsel", "einheitlich", "häufiger Wechsel", desired.timbreChange)}
        ${control("choirIntensity", "Chorintensität", "selten", "deutlich", desired.choirIntensity)}
        ${control("arrangementContrast", "Arrangement-Kontrast", "gleichmäßig", "Builds & Drops", desired.arrangementContrast)}
        ${control("fillFrequency", "Fill-Häufigkeit", "selten", "häufig", desired.fillFrequency)}
      </main>
      <details class="pd-more"><summary>Weitere Klangregler</summary><div class="pd-grid">
        ${control("brightness", "Klanghelligkeit", "warm", "hell", desired.brightness)}
        ${control("space", "Räumlichkeit", "direkt", "breit", desired.space)}
      </div></details>
      <section class="pd-compare"><h3>A/B-Vergleich und Presets</h3><div class="pd-button-row"><button data-pd-ab-save="A" type="button">A merken</button><button data-pd-ab-load="A" type="button">A laden</button><button data-pd-ab-save="B" type="button">B merken</button><button data-pd-ab-load="B" type="button">B laden</button><button data-pd-reset type="button">Ausgangswerte</button></div><div class="pd-preset-row"><input data-pd-preset-name maxlength="100" placeholder="Preset-Name"><button data-pd-preset-save class="primary" type="button">Preset speichern</button><select data-pd-preset-list><option value="">Gespeicherte Presets</option></select><button data-pd-preset-load type="button">Laden</button></div></section>
      <details class="pd-packs"><summary>Samplepakete verwalten</summary><p class="hint">Neue tonale Pakete können ohne Änderung der Generatorlogik ergänzt werden. Dateien nach Tonhöhe benennen, zum Beispiel C3.mp3, Fs3.mp3 oder G4.wav.</p><div data-pd-pack-list class="pd-pack-list"></div><form data-pd-upload class="pd-upload"><label>Name<input name="name" maxlength="120" required></label><label>Rolle<select name="role"><option value="lead">Lead</option><option value="harmony">Akkorde / Pluck</option><option value="bass">Bass</option><option value="choir">Chor</option></select></label><label>Lizenz<input name="license" maxlength="120" value="CC0 1.0" required></label><label>Lizenzquelle<input name="source" type="url" maxlength="500" placeholder="https://…" required></label><label class="wide">Samples<input name="files" type="file" accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav" multiple required></label><button class="primary" type="submit">Samplepaket hochladen</button></form></details>
      <p data-pd-status class="pd-status" aria-live="polite"></p>
    </div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('[data-pd-setting="intensity"]').value = desired.intensity;
    dialog.querySelector('[data-pd-setting="melodyMode"]').value = desired.melodyMode;
    dialog.querySelector('[data-pd-setting="melodyClipMode"]').value = desired.melodyClipMode;
    dialog.querySelector('[data-pd-setting="loopFamily"]').value = loopFamily(desired.loopFamily).id;
    dialog.querySelector('[data-pd-setting="loopForm"]').value = desired.loopForm;
    dialog.querySelector('[data-pd-setting="loopRegister"]').value = desired.loopRegister;
    wireDialog();
    updateModeHelp();
    return dialog;
  }

  function updateModeHelp() {
    if (!dialog) return;
    const mode = dialog.querySelector('[data-pd-setting="melodyMode"]')?.value || desired.melodyMode;
    const family = loopFamily(dialog.querySelector('[data-pd-setting="loopFamily"]')?.value);
    dialog.querySelectorAll("[data-pd-family-control]").forEach(item => item.classList.toggle("hidden", mode !== "loops"));
    if (mode === "loops") aiStatus(`${family.name} · ${family.key} · ${family.bpm} BPM Quelle · Bass und Akkorde folgen automatisch.`);
    else if (mode === "ai") aiStatus(aiModel?.isInitialized?.() ? "Lokales KI-Modell ist bereit." : "KI-Modell wird beim Start lokal geladen.");
    else aiStatus("Klassische A–A–B–A′-Melodie mit musikalischen Regeln.");
  }

  function applyToControls(settings) {
    desired = {...DEFAULTS, ...settings};
    dialog?.querySelectorAll("[data-pd-setting]").forEach(input => {
      if (desired[input.dataset.pdSetting] !== undefined) input.value = desired[input.dataset.pdSetting];
    });
    dialog?.querySelectorAll("[data-pd-output]").forEach(out => out.textContent = desired[out.dataset.pdOutput]);
    saveSettings();
    if (playing) { pending = true; applyImmediate(); }
    updateModeHelp();
    pendingStatus();
  }

  function wireDialog() {
    dialog.querySelector("[data-pd-close]").onclick = () => { stopPreview(); stop(); dialog.close(); };
    dialog.addEventListener("cancel", event => { event.preventDefault(); stopPreview(); stop(); dialog.close(); });
    dialog.querySelector("[data-pd-play]").onclick = play;
    dialog.querySelector("[data-pd-stop]").onclick = stop;
    dialog.querySelector("[data-pd-new]").onclick = () => { desired.seed = Math.floor(10000 + Math.random() * 89999); saveSettings(); status(`Neue reproduzierbare Variante: ${desired.seed}`); if (playing) pending = true; pendingStatus(); };
    dialog.querySelectorAll("[data-pd-setting]").forEach(input => input.addEventListener("input", () => {
      const name = input.dataset.pdSetting;
      desired = values();
      dialog.querySelector(`[data-pd-output="${name}"]`)?.replaceChildren(String(input.value));
      saveSettings();
      if (playing && STRUCTURAL.has(name)) pending = true;
      if (playing) applyImmediate();
      if (name === "melodyMode" || name === "loopFamily") updateModeHelp();
      pendingStatus();
    }));
    dialog.querySelectorAll("[data-pd-ab-save]").forEach(button => button.onclick = () => {
      const slots = JSON.parse(localStorage.getItem(AB_KEY) || "{}"); slots[button.dataset.pdAbSave] = values(); localStorage.setItem(AB_KEY, JSON.stringify(slots)); status(`Variante ${button.dataset.pdAbSave} gespeichert.`);
    });
    dialog.querySelectorAll("[data-pd-ab-load]").forEach(button => button.onclick = () => {
      const item = JSON.parse(localStorage.getItem(AB_KEY) || "{}")[button.dataset.pdAbLoad]; if (!item) return status(`Variante ${button.dataset.pdAbLoad} ist noch leer.`, true); applyToControls(item); status(`Variante ${button.dataset.pdAbLoad} geladen.`);
    });
    dialog.querySelector("[data-pd-reset]").onclick = () => applyToControls(DEFAULTS);
    dialog.querySelector("[data-pd-preset-save]").onclick = savePreset;
    dialog.querySelector("[data-pd-preset-load]").onclick = loadSelectedPreset;
    dialog.querySelector("[data-pd-upload]").onsubmit = uploadPack;
    dialog.querySelector("[data-pd-pack-list]").onclick = handlePackAction;
  }

  async function loadData() {
    const [packs, saved] = await Promise.all([
      api().request("/rest/v1/vt_music_sample_packs?select=*&order=instrument_role.asc,name.asc"),
      api().request("/rest/v1/vt_power_dance_presets?select=*&order=updated_at.desc"),
    ]);
    catalog = packs || [];
    presets = saved || [];
    renderPacks();
    renderPresets();
  }
  function renderPacks() {
    const root = dialog?.querySelector("[data-pd-pack-list]"); if (!root) return;
    const labels = {drums:"Drums",effects:"Effekte",bass:"Bass",harmony:"Akkorde / Harmony",lead:"Melodie / Lead",choir:"Chor"};
    const order = ["drums","effects","bass","harmony","lead","choir"];
    const renderPack = pack => {
      const clip = pack.manifest?.type === "clip";
      const tonal = Boolean(pack.manifest?.urls);
      const melodicClip = clip && (pack.instrument_role === "harmony" || pack.instrument_role === "lead");
      const selected = selectedClipIds.has(pack.id);
      const group = pack.manifest?.group ? ` · ${esc(pack.manifest.group)}` : "";
      const source = pack.license_source ? `<a href="${esc(pack.license_source)}" target="_blank" rel="noopener">Quelle</a>` : "";
      const metadata = [pack.manifest?.key, pack.manifest?.bpm ? `${pack.manifest.bpm} BPM` : ""].filter(Boolean).join(" · ");
      return `<article><span><strong>${esc(pack.name)}</strong><small>${esc(pack.instrument_role)}${group} · ${esc(pack.license_name)}${metadata ? ` · ${esc(metadata)}` : ""} · ${source || (pack.bundled ? "lokal" : "nachgeladen")}</small></span><div class="pd-pack-actions">${clip || tonal ? `<button type="button" data-pd-pack-preview="${esc(pack.id)}">▶ Anhören</button>` : ""}${melodicClip ? `<button type="button" data-pd-pack-track="${esc(pack.id)}" class="${selected ? "selected" : ""}"${pack.lab_enabled ? "" : " disabled"}>${selected ? "Im Track" : "Nur Katalog"}</button>` : ""}<button type="button" data-pd-pack-toggle="${esc(pack.id)}" data-enabled="${pack.lab_enabled}">${pack.lab_enabled ? "Im Lab aktiv" : "Deaktiviert"}</button>${clip ? `<button class="danger" type="button" data-pd-pack-delete="${esc(pack.id)}">Löschen</button>` : ""}</div></article>`;
    };
    const renderFamily = family => {
      const selected = desired.loopFamily === family.id;
      const variants = family.variants.map(variant => {
        const key = `${family.id}:${variant.id}`, enabled = !disabledFamilyVariants.has(key);
        return `<span class="pd-family-variant"><button type="button" data-pd-family-preview="${esc(key)}">▶ ${esc(variant.name)}</button><button type="button" data-pd-family-variant="${esc(key)}" class="${enabled ? "selected" : ""}">${enabled ? "Aktiv" : "Aus"}</button></span>`;
      }).join("");
      return `<article class="pd-family-card"><span><strong>${esc(family.name)}</strong><small>${esc(family.key)} · ${family.bpm} BPM · ${esc(family.license)} · <a href="${esc(family.source)}" target="_blank" rel="noopener">Quelle</a></small><span class="pd-family-variants">${variants}</span></span><div class="pd-pack-actions"><button type="button" data-pd-family-select="${esc(family.id)}" class="${selected ? "selected" : ""}">${selected ? "Ausgewählt" : "Familie wählen"}</button></div></article>`;
    };
    const familyCategory = `<details class="pd-pack-category pd-family-category" open><summary><span>Melodiefamilien</span><small>${LOOP_FAMILIES.length} Familien · ${LOOP_FAMILIES.reduce((sum, family) => sum + enabledFamilyVariants(family).length, 0)} aktive Varianten</small></summary><div>${LOOP_FAMILIES.map(renderFamily).join("")}</div></details>`;
    const sampleCategories = order.map(role => {
      const packs = catalog.filter(pack => pack.instrument_role === role);
      if (!packs.length) return "";
      return `<details class="pd-pack-category"${role === "harmony" || role === "lead" ? " open" : ""}><summary><span>${esc(labels[role] || role)}</span><small>${packs.length} Samples</small></summary><div>${packs.map(renderPack).join("")}</div></details>`;
    }).join("");
    root.innerHTML = familyCategory + (sampleCategories || '<p class="hint">Keine weiteren Samplepakete verfügbar.</p>');
  }
  function renderPresets() {
    const select = dialog?.querySelector("[data-pd-preset-list]"); if (!select) return;
    select.innerHTML = '<option value="">Gespeicherte Presets</option>' + presets.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("");
  }
  async function savePreset() {
    const name = dialog.querySelector("[data-pd-preset-name]").value.trim();
    if (!name) return status("Bitte einen Preset-Namen eingeben.", true);
    const userId = session()?.user?.id; if (!userId) return status("Benutzer konnte nicht ermittelt werden.", true);
    try {
      const existing = presets.find(item => item.name.toLocaleLowerCase("de") === name.toLocaleLowerCase("de"));
      if (existing) await api().request(`/rest/v1/vt_power_dance_presets?id=eq.${encodeURIComponent(existing.id)}`, {method:"PATCH", body:{name, settings:values(), updated_at:new Date().toISOString()}});
      else await api().request("/rest/v1/vt_power_dance_presets", {method:"POST", headers:{Prefer:"return=representation"}, body:{owner_id:userId, name, settings:values()}});
      dialog.querySelector("[data-pd-preset-name]").value = ""; await loadData(); status(`Preset „${name}“ gespeichert.`);
    } catch (error) { status(`Preset konnte nicht gespeichert werden: ${error.message}`, true); }
  }
  function loadSelectedPreset() {
    const id = dialog.querySelector("[data-pd-preset-list]").value;
    const item = presets.find(row => row.id === id); if (!item) return status("Bitte ein Preset auswählen.", true);
    applyToControls(item.settings); status(`Preset „${item.name}“ geladen.`);
  }
  function clipUrl(pack) {
    if (pack?.manifest?.url) return pack.manifest.url;
    const first = pack?.manifest?.urls && Object.values(pack.manifest.urls)[0];
    return first ? `${pack.manifest.baseUrl || ""}${first}` : "";
  }
  function stopPreview() {
    if (!previewAudio) return;
    previewAudio.pause(); previewAudio.currentTime = 0; previewAudio = null;
  }
  async function previewPack(id) {
    const pack = catalog.find(item => item.id === id), url = clipUrl(pack);
    if (!url) return status("Für dieses Sample ist keine Hörprobe vorhanden.", true);
    stopPreview(); previewAudio = new Audio(); previewAudio.crossOrigin = "anonymous"; previewAudio.preload = "auto"; previewAudio.src = url; previewAudio.volume = 0.78;
    previewAudio.onended = () => { previewAudio = null; status(`Hörprobe „${pack.name}“ beendet.`); };
    previewAudio.onerror = () => { stopPreview(); status(`Hörprobe „${pack.name}“ konnte nicht geladen werden.`, true); };
    try { await previewAudio.play(); status(`Hörprobe: ${pack.name}`); }
    catch (error) { stopPreview(); status(`Hörprobe konnte nicht gestartet werden: ${error.message}`, true); }
  }
  async function previewFamilyVariant(key) {
    const [familyId, variantId] = String(key).split(":"), family = loopFamily(familyId), variant = family.variants.find(item => item.id === variantId);
    if (!variant) return status("Diese Loop-Variante ist nicht verfügbar.", true);
    stopPreview(); previewAudio = new Audio(); previewAudio.crossOrigin = "anonymous"; previewAudio.preload = "auto"; previewAudio.src = variant.url; previewAudio.volume = family.id === "fupi-edm" ? .42 : .88;
    previewAudio.onended = () => { previewAudio = null; status(`Hörprobe „${family.name} · ${variant.name}“ beendet.`); };
    previewAudio.onerror = () => { stopPreview(); status(`Hörprobe „${family.name} · ${variant.name}“ konnte nicht geladen werden.`, true); };
    try { await previewAudio.play(); status(`Hörprobe: ${family.name} · ${variant.name}`); }
    catch (error) { stopPreview(); status(`Hörprobe konnte nicht gestartet werden: ${error.message}`, true); }
  }
  async function deletePack(id) {
    const pack = catalog.find(item => item.id === id); if (!pack) return;
    if (!confirm(`Sample „${pack.name}“ wirklich aus dem Katalog löschen?`)) return;
    stopPreview();
    try {
      if (pack.storage_prefix) await api().request("/storage/v1/object/vt-music-samples", {method:"DELETE", body:{prefixes:[pack.storage_prefix]}});
      await api().request(`/rest/v1/vt_music_sample_packs?id=eq.${encodeURIComponent(id)}`, {method:"DELETE"});
      await loadData(); status(`Sample „${pack.name}“ wurde gelöscht.`);
    } catch (error) { status(`Löschen fehlgeschlagen: ${error.message}`, true); }
  }
  async function handlePackAction(event) {
    const familyPreview = event.target.closest("[data-pd-family-preview]");
    if (familyPreview) return previewFamilyVariant(familyPreview.dataset.pdFamilyPreview);
    const familyVariant = event.target.closest("[data-pd-family-variant]");
    if (familyVariant) {
      const key = familyVariant.dataset.pdFamilyVariant;
      if (disabledFamilyVariants.has(key)) disabledFamilyVariants.delete(key); else disabledFamilyVariants.add(key);
      saveDisabledFamilyVariants(); renderPacks();
      if (playing) pending = true;
      pendingStatus();
      status(playing ? "Loop-Variante aktualisiert. Die Auswahl greift im nächsten 8-Takt-Block." : "Loop-Variante aktualisiert. Die Auswahl greift beim nächsten Start.");
      return;
    }
    const familySelect = event.target.closest("[data-pd-family-select]");
    if (familySelect) {
      desired.loopFamily = familySelect.dataset.pdFamilySelect;
      desired.melodyMode = "loops";
      dialog.querySelector('[data-pd-setting="loopFamily"]').value = desired.loopFamily;
      dialog.querySelector('[data-pd-setting="melodyMode"]').value = "loops";
      saveSettings(); renderPacks(); updateModeHelp();
      if (playing) pending = true;
      pendingStatus(); status(playing ? `„${loopFamily().name}“ wird im nächsten 8-Takt-Block übernommen.` : `„${loopFamily().name}“ wird beim nächsten Start als Melodiefamilie verwendet.`);
      return;
    }
    const preview = event.target.closest("[data-pd-pack-preview]");
    if (preview) return previewPack(preview.dataset.pdPackPreview);
    const remove = event.target.closest("[data-pd-pack-delete]");
    if (remove) return deletePack(remove.dataset.pdPackDelete);
    const track = event.target.closest("[data-pd-pack-track]");
    if (track) {
      const pack = catalog.find(item => item.id === track.dataset.pdPackTrack); if (!pack) return;
      const alreadySelected = selectedClipIds.has(pack.id);
      catalog.filter(item => item.instrument_role === pack.instrument_role).forEach(item => selectedClipIds.delete(item.id));
      if (!alreadySelected) selectedClipIds.add(pack.id);
      saveClipSelections(); renderPacks();
      status(alreadySelected ? `„${pack.name}“ wird nicht mehr im Track verwendet.` : `„${pack.name}“ wird beim nächsten Start anstelle der generierten ${pack.instrument_role === "harmony" ? "Akkordspur" : "Melodiespur"} getestet.`);
      return;
    }
    const button = event.target.closest("[data-pd-pack-toggle]"); if (!button) return;
    button.disabled = true;
    try {
      const enabling = button.dataset.enabled !== "true";
      await api().request(`/rest/v1/vt_music_sample_packs?id=eq.${encodeURIComponent(button.dataset.pdPackToggle)}`, {method:"PATCH", body:{lab_enabled:enabling, updated_at:new Date().toISOString()}});
      if (!enabling) { selectedClipIds.delete(button.dataset.pdPackToggle); saveClipSelections(); }
      await loadData(); status("Samplekatalog aktualisiert. Neustart der Wiedergabe übernimmt die Auswahl.");
    }
    catch (error) { status(error.message, true); button.disabled = false; }
  }
  function noteFromFile(name) {
    const base = name.replace(/\.[^.]+$/, "");
    const match = base.match(/^([A-Ga-g])([#b]|s)?(-?\d)$/); if (!match) return null;
    const accidental = match[2] === "s" ? "#" : (match[2] || "");
    return `${match[1].toUpperCase()}${accidental}${match[3]}`;
  }
  async function uploadPack(event) {
    event.preventDefault();
    const form = event.currentTarget, files = [...form.elements.files.files], notes = files.map(file => [noteFromFile(file.name), file]);
    if (!files.length || notes.some(([note]) => !note)) return status("Alle Dateien müssen nach Tonhöhe benannt sein, zum Beispiel C3.mp3 oder Fs3.wav.", true);
    if (files.some(file => file.size > 10485760)) return status("Eine Sampledatei ist größer als 10 MB.", true);
    const name = form.elements.name.value.trim(), role = form.elements.role.value, license = form.elements.license.value.trim(), source = form.elements.source.value.trim();
    const slug = `${safeSlug(name)}-${Date.now().toString(36)}`, prefix = `${slug}/${crypto.randomUUID()}`;
    const urls = {};
    form.querySelector("button[type=submit]").disabled = true;
    try {
      for (let index = 0; index < notes.length; index++) {
        const [note, file] = notes[index], filename = safeFile(file.name);
        status(`${index + 1}/${notes.length}: ${file.name} wird hochgeladen …`);
        await api().request(`/storage/v1/object/vt-music-samples/${prefix}/${filename}`, {method:"POST", body:file, headers:{"Content-Type":file.type || "audio/mpeg", "x-upsert":"false"}});
        urls[note] = filename;
      }
      await api().request("/rest/v1/vt_music_sample_packs", {method:"POST", headers:{Prefer:"return=representation"}, body:{slug,name,instrument_role:role,manifest:{baseUrl:publicSampleUrl(prefix),attack:0.008,release:role === "choir" ? 1.2 : 0.18,urls},license_name:license,license_source:source,storage_prefix:prefix,bundled:false,lab_enabled:true,production_enabled:false,created_by:session()?.user?.id}});
      form.reset(); await loadData(); status(`Samplepaket „${name}“ ist im Lab verfügbar. Wiedergabe neu starten, um es zu laden.`);
    } catch (error) {
      await api().request("/storage/v1/object/vt-music-samples", {method:"DELETE", body:{prefixes:[prefix]}}).catch(() => {});
      status(`Upload fehlgeschlagen: ${error.message}`, true);
    } finally { form.querySelector("button[type=submit]").disabled = false; }
  }

  function enabled(role) {
    return catalog
      .filter(pack => pack.lab_enabled && pack.instrument_role === role && pack.manifest?.urls)
      .sort((a, b) => Number(b.slug.includes("bright-lead")) - Number(a.slug.includes("bright-lead")) || a.name.localeCompare(b.name, "de"));
  }
  function enabledClips() {
    return catalog.filter(pack => pack.lab_enabled && pack.manifest?.type === "clip" && pack.manifest?.url);
  }
  function sampler(pack, destination, role) {
    const manifest = pack.manifest;
    const minimumRelease = role === "harmony" ? .72 : role === "lead" ? .34 : .16;
    return new Tone.Sampler({urls:manifest.urls, baseUrl:manifest.baseUrl, volume:Number(manifest.volumeDb ?? 0), attack:Math.max(Number(manifest.attack) || 0.006, role === "harmony" ? .018 : .01), release:Math.max(Number(manifest.release) || .16, minimumRelease)}).connect(destination);
  }
  async function createEngine() {
    const master = new Tone.Gain(0.82).toDestination();
    const compressor = new Tone.Compressor(-16, 2.5).connect(master);
    const drumsBus = new Tone.Gain(0.9).connect(compressor);
    const bassBus = new Tone.Gain(0.8).connect(compressor);
    const musicFilter = new Tone.Filter(9000, "lowpass").connect(compressor);
    const harmonyBus = new Tone.Gain(0.78).connect(musicFilter);
    const hookBus = new Tone.Gain(0.66).connect(musicFilter);
    const motifBus = new Tone.Gain(0.10).connect(musicFilter);
    const familyBus = new Tone.Gain(0.36).connect(musicFilter);
    const choirBus = new Tone.Gain(0.30).connect(musicFilter);
    const reverb = new Tone.Reverb({decay:2.2, wet:0.16}).connect(compressor);
    musicFilter.connect(reverb);
    const base = "assets/audio/packs/power-dance-drums/";
    const player = (file, bus = drumsBus, volume = 0) => new Tone.Player({url:base + file, volume}).connect(bus);
    const drums = {kick:player("Kick06.wav", drumsBus, -1), click:player("kick-click.wav", drumsBus, -8), snare:player("Snare14.wav", drumsBus, -5), clap:player("Clap01.wav", drumsBus, -7), hat:player("ClosedHiHat02-01.wav", drumsBus, -12), open:player("OpenHiHat02-01.wav", drumsBus, -13), cymbal:player("Cymbal01-03.wav", drumsBus, -8), tomHigh:player("HighTom02-02.wav", drumsBus, -9), tomMid:player("MidTom02-02.wav", drumsBus, -8), tomLow:player("LowTom02-02.wav", drumsBus, -7)};
    const banks = {bass:enabled("bass").map(pack => ({pack, node:sampler(pack, bassBus, "bass")})), lead:enabled("lead").map(pack => ({pack, node:sampler(pack, hookBus, "lead")})), harmony:enabled("harmony").map(pack => ({pack, node:sampler(pack, harmonyBus, "harmony")})), choir:enabled("choir").map(pack => ({pack, node:sampler(pack, choirBus, "choir")}))};
    const clipBus = {drums:drumsBus,effects:drumsBus,lead:motifBus,harmony:harmonyBus};
    const clips = enabledClips().map(pack => ({pack,node:new Tone.Player({url:pack.manifest.url,volume:Number(pack.manifest.volumeDb ?? -7),fadeIn:.035,fadeOut:.14}).connect(clipBus[pack.instrument_role] || musicFilter)}));
    // All small loop assets are prepared up front. This allows a running Lab
    // session to switch from classic/AI to any loop family at the next musical
    // block without rebuilding the complete audio engine.
    const familyPlayers = new Map(LOOP_FAMILIES.flatMap(family => family.variants.map(variant => [
      `${family.id}:${variant.id}`,
      new Tone.GrainPlayer({url:variant.url,volume:Number(variant.volumeDb ?? family.volumeDb),grainSize:.12,overlap:.045}).connect(familyBus),
    ])));
    const sub = new Tone.MonoSynth({oscillator:{type:"sine"}, envelope:{attack:0.003,decay:0.16,sustain:0.05,release:0.04}}).connect(bassBus);
    await Tone.loaded(); await reverb.generate();
    return {master, compressor, drumsBus, bassBus, musicFilter, harmonyBus, hookBus, motifBus, familyBus, choirBus, reverb, drums, banks, clips, familyPlayers, activeLoopLabel:"", sub};
  }
  function ramp(param, value, seconds = 0.08) { try { param.rampTo(value, seconds); } catch { param.value = value; } }
  function applyImmediate() {
    if (!engine) return;
    ramp(engine.bassBus.gain, [0, .54, .66, .80, .94, 1.08][desired.bassPressure]);
    // The melody remains independently controllable while harmony is capped
    // well below it; this preserves space for generated hooks and motif clips.
    ramp(engine.hookBus.gain, [0, .025, .10, .25, .43, .62][desired.melodyPresence]);
    const harmonyBase = [0, .08, .15, .25, .38, .52][desired.chordPresence];
    const melodyFocus = active.melodyMode === "loops" ? [1, 1, .94, .84, .70, .58][desired.melodyPresence] : 1;
    ramp(engine.harmonyBus.gain, harmonyBase * melodyFocus);
    const motifGain = desired.melodyClipMode === "replace"
      ? [0, .025, .10, .25, .43, .62][desired.melodyPresence]
      : [0, .025, .06, .12, .21, .34][desired.motifPresence];
    ramp(engine.motifBus.gain, motifGain);
    ramp(engine.familyBus.gain, [0, .06, .18, .40, .70, 1.05][desired.melodyPresence]);
    ramp(engine.choirBus.gain, [0, .08, .18, .30, .44, .60][desired.choirIntensity]);
    ramp(engine.musicFilter.frequency, [0, 3600, 5200, 7600, 10500, 14500][desired.brightness], .16);
    ramp(engine.reverb.wet, [0, .04, .10, .16, .24, .34][desired.space], .16);
  }
  function chooseBank(role, block, amount) {
    const list = engine.banks[role] || []; if (!list.length) return null;
    const cadence = [99, 99, 4, 2, 1, 1][amount] || 2;
    return list[Math.floor(block / cadence) % list.length].node;
  }
  function nearestChordPitch(chord, target, rootOnly = false) {
    const pitchClasses = (rootOnly ? [chord[0]] : chord).map(note => ((note % 12) + 12) % 12);
    const candidates = [];
    for (let note = 64; note <= 79; note++) if (pitchClasses.includes(note % 12)) candidates.push(note);
    return candidates.reduce((best, note) => Math.abs(note - target) < Math.abs(best - target) ? note : best, candidates[0]);
  }
  function melodyBarEnabled(bar, density) {
    if (density <= 1) return bar < 2;
    if (density === 2) return bar < 2 || bar >= 6;
    if (density === 3) return bar < 4 || bar >= 6;
    return true;
  }
  function at(time, beat, bpm) { return time + beat * 60 / bpm; }
  function blockKind(block, contrast) {
    if (contrast <= 1) return "steady";
    const cycle = block % 4;
    if (cycle === 1 && contrast >= 3) return "build";
    if (cycle === 2 && contrast >= 4) return "break";
    return "drop";
  }
  function familyVariantId(family, candidates) {
    const activeIds = new Set(enabledFamilyVariants(family).map(item => item.id));
    const available = id => activeIds.has(id) && engine.familyPlayers.has(`${family.id}:${id}`);
    return candidates.find(available) || [...activeIds].find(available) || null;
  }
  function familySequence(cfg, blockIndex, family) {
    if (!family || !engine.familyPlayers.size) return [];
    const bright = cfg.melodyVariability >= 4 && blockIndex % 2 === 1;
    let sequence = [];
    if (family.id === "fupi-edm") {
      if (cfg.loopForm === "aaba") sequence = [{id:familyVariantId(family, [bright ? "bright-skippy" : "skippy", "skippy", "bright-skippy"]),startBar:0,bars:8}];
      else if (cfg.loopForm === "call-response") sequence = [
        {id:familyVariantId(family, [bright ? "bright-main" : "main", "main", "bright-main"]),startBar:0,bars:4},
        {id:familyVariantId(family, [bright ? "bright-loopy" : "loopy", "loopy", "bright-loopy"]),startBar:4,bars:4},
      ];
      else sequence = [{id:familyVariantId(family, [bright ? "bright-main" : "main", "main", "bright-main"]),startBar:blockIndex % 2 ? 4 : 0,bars:4}];
    } else if (family.id === "orbit-pluck") {
      const swap = cfg.melodyVariability >= 4 && blockIndex % 2 === 1;
      if (cfg.loopForm === "motif") sequence = [{id:familyVariantId(family, [swap ? "answer-b" : "motif-a", "motif-a", "answer-b"]),startBar:blockIndex % 2 ? 4 : 0,bars:4}];
      else sequence = [
        {id:familyVariantId(family, [swap ? "answer-b" : "motif-a", "motif-a", "answer-b"]),startBar:0,bars:4},
        {id:familyVariantId(family, [swap ? "motif-a" : "answer-b", "answer-b", "motif-a"]),startBar:4,bars:4},
      ];
    } else {
      const orders = [["synth","plucks"],["plucks","piano"],["piano","synth"]], order = orders[Math.floor(blockIndex / Math.max(1, 6 - cfg.timbreChange)) % orders.length];
      if (cfg.loopForm === "motif") sequence = [{id:familyVariantId(family, [order[0],"plucks","synth","piano"]),startBar:blockIndex % 2 ? 4 : 0,bars:4}];
      else sequence = [
        {id:familyVariantId(family, [order[0],"plucks","synth","piano"]),startBar:0,bars:4},
        {id:familyVariantId(family, [order[1],"synth","piano","plucks"]),startBar:4,bars:4},
      ];
    }
    sequence = sequence.filter((item, index, list) => item.id && list.findIndex(other => other.id === item.id) === index);
    if (cfg.melodyDensity <= 1) return sequence.slice(0, 1).map(item => ({...item,startBar:blockIndex % 2 ? 4 : 0,bars:Math.min(4,item.bars)}));
    if (cfg.melodyDensity === 2) return sequence.slice(blockIndex % Math.max(1, sequence.length), blockIndex % Math.max(1, sequence.length) + 1).map(item => ({...item,startBar:blockIndex % 2 ? 4 : 0,bars:Math.min(4,item.bars)}));
    return sequence;
  }
  function scheduleFamilyMelody(time, cfg, blockIndex, bpm) {
    if (cfg.melodyMode !== "loops") { engine.activeLoopLabel = ""; return; }
    const family = loopFamily(cfg.loopFamily);
    const detune = cfg.loopRegister === "low" ? -1200 : cfg.loopRegister === "high" ? 1200 : 0;
    const sequence = familySequence(cfg, blockIndex, family);
    engine.activeLoopLabel = sequence.map(item => family.variants.find(variant => variant.id === item.id)?.name).filter(Boolean).join(" + ") || "keine aktive Variante";
    sequence.forEach(item => {
      const player = engine.familyPlayers.get(`${family.id}:${item.id}`); if (!player) return;
      player.playbackRate = bpm / family.bpm;
      player.detune = detune;
      player.start(at(time, item.startBar * 4, bpm), 0, item.bars * 4 * 60 / bpm);
    });
  }
  function scheduleBlock(time) {
    active = {...desired}; pending = false; blockCounter++;
    const cfg = active, bpm = cfg.bpm, scale = cfg.intensity === "low" ? .76 : cfg.intensity === "medium" ? .88 : 1, blockIndex = blockCounter - 1;
    const activeFamily = cfg.melodyMode === "loops" ? loopFamily(cfg.loopFamily) : null;
    const harmonicChords = activeFamily ? activeFamily.chords : CHORDS;
    const kind = blockKind(blockIndex, cfg.arrangementContrast), drop = kind === "drop", build = kind === "build", reduced = kind === "break";
    const rng = seeded(cfg.seed + blockCounter * 977), bass = chooseBank("bass", blockIndex, cfg.timbreChange), lead = chooseBank("lead", blockIndex, cfg.timbreChange), harmony = chooseBank("harmony", blockIndex, cfg.timbreChange), choir = chooseBank("choir", blockIndex, cfg.timbreChange);
    const loopFamilyActive = Boolean(activeFamily);
    // Older catalog loops do not consistently carry reliable key metadata.
    // Keep them out of the keyed family mode so that they cannot clash with
    // the family's melody, bass and chord progression.
    const selectedHarmonyClip = loopFamilyActive ? null : engine.clips.find(item => item.pack.instrument_role === "harmony" && selectedClipIds.has(item.pack.id));
    const selectedLeadClip = loopFamilyActive ? null : engine.clips.find(item => item.pack.instrument_role === "lead" && selectedClipIds.has(item.pack.id));
    const leadReplacement = !loopFamilyActive && Boolean(selectedLeadClip && cfg.melodyClipMode === "replace");
    const aiEvents = cfg.melodyMode === "ai" ? aiNextBlock : null;
    if (cfg.melodyMode === "ai") { aiNextBlock = null; queueNextAiBlock(blockIndex + 1, cfg); }
    const prepareClip = item => {
      if (!item) return;
      const sourceBpm = Number(item.pack.manifest.bpm);
      item.node.playbackRate = sourceBpm ? Math.max(.75, Math.min(1.35, bpm / sourceBpm)) : 1;
    };
    const startFullClip = item => {
      if (!item) return; prepareClip(item);
      item.node.start(time);
      item.node.stop(at(time, 31.8, bpm));
    };
    const startAccentClip = item => {
      if (!item || cfg.motifPresence <= 0) return; prepareClip(item);
      const maximum = 8 * 60 / bpm;
      const available = Number(item.node.buffer?.duration || maximum) / item.node.playbackRate;
      item.node.start(at(time, 16, bpm), 0, Math.min(maximum, available));
    };
    startFullClip(selectedHarmonyClip);
    if (leadReplacement) startFullClip(selectedLeadClip); else startAccentClip(selectedLeadClip);
    scheduleFamilyMelody(time, cfg, blockIndex, bpm);
    const clipGroup = group => engine.clips.filter(item => item.pack.manifest.group === group);
    const chooseClip = group => { const list = clipGroup(group); return list.length ? list[Math.floor(rng() * list.length)].node : null; };
    if (drop) (chooseClip("impact") || chooseClip("crash"))?.start(time);
    if (reduced) chooseClip("downlifter")?.start(time);
    const registerCycle = [0, -12, 0, 7, -12, 0];
    let register = cfg.bassVariability <= 1 ? 0 : registerCycle[(blockCounter - 1) % registerCycle.length];
    let previousLeadNote = 72;
    for (let bar = 0; bar < 8; bar++) {
      // A loop family always starts at the beginning of its own four-chord
      // progression. Classic/AI mode retains the existing rotating start.
      const harmonicIndex = loopFamilyActive ? bar : bar + blockIndex;
      const baseBeat = bar * 4, [root, chord] = harmonicChords[harmonicIndex % harmonicChords.length];
      for (let beat = 0; beat < 4; beat++) {
        if (!(reduced && beat % 2)) engine.drums.kick.start(at(time, baseBeat + beat, bpm));
        if (drop || build) engine.drums.click.start(at(time, baseBeat + beat, bpm));
      }
      if (!(reduced && bar < 4)) for (const beat of [1, 3]) { engine.drums.clap.start(at(time, baseBeat + beat, bpm)); engine.drums.snare.start(at(time, baseBeat + beat, bpm)); }
      const hatSteps = drop || build ? [2,4,6,8,10,12,14] : [2,6,10,14];
      for (const step of hatSteps) engine.drums.hat.start(at(time, baseBeat + step / 4, bpm));
      if (drop) for (const step of [2,6,10,14]) engine.drums.open.start(at(time, baseBeat + step / 4, bpm));

      const bassPattern = [0,3,6,8,11,14];
      bassPattern.forEach((step, index) => {
        let note = root + register;
        const fillBar = bar === 7 && cfg.fillFrequency >= 2 && ((blockCounter + cfg.seed) % Math.max(1, 6 - cfg.fillFrequency) === 0);
        if (fillBar && index >= 3) note += [0,2,5][index - 3] || 7;
        else if (cfg.bassVariability >= 4 && index === 4) note += rng() > .5 ? 5 : 7;
        bass?.triggerAttackRelease(midi(note), (index % 3 === 0 ? .46 : .31) * 60 / bpm, at(time, baseBeat + step / 4, bpm), .42 * scale);
        engine.sub.triggerAttackRelease(midi(note), .24 * 60 / bpm, at(time, baseBeat + step / 4, bpm), .24 * scale);
      });

      const chordPositions = reduced ? [0] : build ? [0, 2] : (bar % 2 ? [.5, 2.5] : [0, 1.5, 3]);
      const chordLength = reduced ? 3.3 : build ? 1.8 : 1.35;
      if (!selectedHarmonyClip) for (const position of chordPositions) for (const note of chord) harmony?.triggerAttackRelease(midi(note + 12), chordLength * 60 / bpm, at(time, baseBeat + position, bpm), .20 * scale);

      if (!leadReplacement && !loopFamilyActive && !reduced && melodyBarEnabled(bar, cfg.melodyDensity) && (!build || cfg.melodyDensity >= 4)) {
        const aiBarEvents = aiEvents?.filter(event => event.bar === bar) || [];
        if (cfg.melodyMode === "ai" && aiBarEvents.length) {
          const limited = build ? aiBarEvents.slice(0, 1) : aiBarEvents;
          limited.forEach((event, index) => {
            const resolving = bar === 7 && index === limited.length - 1;
            const note = resolving ? nearestChordPitch(chord, event.note, true) : event.note;
            const velocity = (.17 + cfg.melodyPresence * .012) * scale * (event.step === 0 ? 1 : .88);
            lead?.triggerAttackRelease(midi(note), event.duration * 60 / bpm, at(time, baseBeat + event.step / 4, bpm), velocity);
          });
        } else {
          let events = HOOK_FORM[bar].map(event => [...event]);
          // Controlled variation changes only one detail while preserving the
          // recognizable rhythm. Level 5 adds one quiet passing event.
          if (cfg.melodyVariability >= 4 && (bar === 4 || bar === 7)) events[events.length - 1][1] += bar === 4 ? 2 : -2;
          if (cfg.melodyVariability >= 5 && bar % 2 === 0) events.push([14, -1]);
          if (build) events = events.slice(0, 1);
          events.sort((a, b) => a[0] - b[0]).forEach(([step, movement], index) => {
            const desiredPitch = previousLeadNote + movement;
            const resolving = bar === 7 && index === events.length - 1;
            const note = nearestChordPitch(chord, desiredPitch, resolving);
            previousLeadNote = note;
            const duration = (step === 14 ? .32 : index === events.length - 1 ? .82 : .56) * 60 / bpm;
            const velocity = (.17 + cfg.melodyPresence * .012) * scale * (step === 0 ? 1 : .88);
            lead?.triggerAttackRelease(midi(note), duration, at(time, baseBeat + step / 4, bpm), velocity);
          });
        }
      }
      const choirEvery = Math.max(1, 6 - cfg.choirIntensity);
      if (choir && bar % choirEvery === 0 && (drop || build)) choir.triggerAttackRelease(midi(chord[0] + 12), .7 * 60 / bpm, at(time, baseBeat, bpm), .20 * scale);
      if (bar === 7) {
        if (cfg.fillFrequency >= 2) [engine.drums.tomHigh, engine.drums.tomMid, engine.drums.tomLow, engine.drums.clap].forEach((drum, i) => drum.start(at(time, baseBeat + 3 + i * .25, bpm)));
        if (cfg.arrangementContrast >= 3) engine.drums.cymbal.start(at(time, baseBeat + 3.75, bpm));
        if (build) chooseClip("riser")?.start(at(time, baseBeat, bpm));
        if (cfg.fillFrequency >= 4) chooseClip("fill")?.start(at(time, baseBeat + 2, bpm));
      }
    }
    if (cfg.melodyMode === "ai" && !aiEvents) aiStatus("KI-Phrase noch nicht fertig · dieser Block nutzt den klassischen Fallback.", true);
    requestAnimationFrame(() => { applyImmediate(); pendingStatus(); });
  }

  async function play() {
    if (playing) return;
    if (!catalog.some(pack => pack.lab_enabled)) return status("Kein Samplepaket ist für das Lab aktiviert.", true);
    desired = values(); active = {...desired}; saveSettings();
    if (desired.melodyMode === "loops" && !enabledFamilyVariants(loopFamily(desired.loopFamily)).length) return status("In dieser Melodiefamilie ist keine Variante aktiviert.", true);
    const bpmInput = dialog.querySelector('[data-pd-setting="bpm"]'); bpmInput.disabled = true;
    dialog.querySelector("[data-pd-play]").disabled = true; dialog.querySelector("[data-pd-stop]").disabled = false;
    status("Klangpakete werden geladen …");
    try {
      await Tone.start();
      aiGenerationToken++; aiNextBlock = null; aiGenerationPromise = null;
      if (desired.melodyMode === "ai") {
        status("Lokale KI bereitet die erste 8-Takt-Phrase vor …");
        try { aiNextBlock = await generateAiBlock(0, desired); }
        catch (error) { aiStatus(`KI nicht bereit · klassischer Fallback: ${error.message}`, true); }
      }
      engine = await createEngine(); applyImmediate();
      const transport = Tone.getTransport(); transport.stop(); transport.cancel(); transport.position = 0; transport.bpm.value = desired.bpm;
      blockCounter = 0; transport.scheduleRepeat(time => scheduleBlock(time), "8m", 0); transport.start("+0.12");
      playing = true;
      status(desired.melodyMode === "loops" ? `Power Dance läuft mit „${loopFamily(desired.loopFamily).name}“ bei konstant ${desired.bpm} BPM.` : `Power Dance läuft mit konstant ${desired.bpm} BPM.`);
      pendingStatus();
    } catch (error) { stop(); status(`Start fehlgeschlagen: ${error.message}`, true); }
  }
  function disposeEngine() {
    if (!engine) return;
    Object.values(engine.drums).forEach(node => { try { node.stop(); node.dispose(); } catch {} });
    Object.values(engine.banks).flat().forEach(item => { try { item.node.releaseAll(); item.node.dispose(); } catch {} });
    engine.clips.forEach(item => { try { item.node.stop(); item.node.dispose(); } catch {} });
    engine.familyPlayers.forEach(node => { try { node.stop(); node.dispose(); } catch {} });
    [engine.sub, engine.reverb, engine.musicFilter, engine.choirBus, engine.familyBus, engine.motifBus, engine.hookBus, engine.harmonyBus, engine.bassBus, engine.drumsBus, engine.compressor, engine.master].forEach(node => { try { node.dispose(); } catch {} });
    engine = null;
  }
  function stop() {
    try { const transport = Tone.getTransport(); transport.stop(); transport.cancel(); transport.position = 0; } catch {}
    aiGenerationToken++; aiNextBlock = null; aiGenerationPromise = null;
    disposeEngine(); playing = false; pending = false; blockCounter = 0;
    if (dialog) { dialog.querySelector("[data-pd-play]").disabled = false; dialog.querySelector("[data-pd-stop]").disabled = true; dialog.querySelector('[data-pd-setting="bpm"]').disabled = false; }
    pendingStatus();
  }

  async function openLab() {
    if (!isAdmin()) return;
    createDialog(); dialog.showModal(); status("Samplekatalog wird geladen …");
    try { await loadData(); status(`${catalog.filter(pack => pack.lab_enabled).length} aktive Samplepakete · bereit.`); }
    catch (error) { status(`Samplekatalog konnte nicht geladen werden: ${error.message}`, true); }
    pendingStatus();
  }
  function adminSection() {
    return `<section class="admin-section power-dance-admin" id="powerDanceAdminPanel"><div><h3>Power Dance Lab <span>Beta</span></h3><p class="hint">Interaktiver, datengetriebener Musikprototyp nur für Superadmins.</p></div><button class="primary" id="powerDanceLabOpen" type="button">Lab öffnen</button></section>`;
  }
  function installAdminEntry() {
    if (!isAdmin()) return false;
    const content = document.getElementById("platformAdminContent"); if (!content) return false;
    if (!document.getElementById("powerDanceAdminPanel")) content.insertAdjacentHTML("afterbegin", adminSection());
    const button = document.getElementById("powerDanceLabOpen"); if (button && !button.dataset.wired) { button.dataset.wired = "1"; button.onclick = openLab; }
    return true;
  }
  function boot() {
    const content = document.getElementById("platformAdminContent");
    if (content) new MutationObserver(() => installAdminEntry()).observe(content, {childList:true});
    document.getElementById("platformAdminOpen")?.addEventListener("click", () => setTimeout(installAdminEntry, 120));
    document.getElementById("platformOnlyAdminOpen")?.addEventListener("click", () => setTimeout(installAdminEntry, 120));
    document.getElementById("platformAdminRefresh")?.addEventListener("click", () => setTimeout(installAdminEntry, 180));
    installAdminEntry();
  }
  let tries = 0, timer = setInterval(() => { tries++; if (document.getElementById("platformAdminContent")) { clearInterval(timer); boot(); } else if (tries > 80) clearInterval(timer); }, 250);
  boot();
  window.VBPowerDanceLab = Object.freeze({open:openLab, stop, defaults:DEFAULTS});
})();
