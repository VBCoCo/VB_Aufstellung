(() => {
  "use strict";

  const ACCESS_KEY = "volleyball-trainer-access-v3";
  const AUTH_KEY = "volleyball-trainer-auth-v3";
  const SETTINGS_KEY = "vb-power-dance-lab-settings-v1";
  const AB_KEY = "vb-power-dance-lab-ab-v1";
  const STRUCTURAL = new Set(["intensity", "bassVariability", "melodyVariability", "timbreChange", "arrangementContrast", "fillFrequency", "choirIntensity"]);
  const DEFAULTS = Object.freeze({
    bpm: 150, intensity: "high", bassPressure: 3, bassVariability: 3,
    melodyPresence: 3, melodyVariability: 3, timbreChange: 3,
    choirIntensity: 2, arrangementContrast: 3, brightness: 4,
    space: 2, fillFrequency: 2, seed: 31650,
  });
  const CHORDS = [[36, [60, 64, 67]], [43, [55, 59, 62]], [45, [57, 60, 64]], [41, [53, 57, 60]]];
  // Hook notes are chord-tone indexes. Keeping the motifs tied to the current
  // chord prevents the previous block transposition from creating clashes.
  const HOOKS = [
    [[0, 0], [3, 1], [7, 2], [11, 1]],
    [[0, 2], [4, 1], [9, 0], [13, 1]],
    [[1, 0], [5, 2], [10, 1]],
    [[0, 1], [4, 2], [8, 1], [12, 0]],
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
  let blockCounter = 0;
  let playing = false;

  function loadSettings() {
    try { return {...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")}; }
    catch { return {...DEFAULTS}; }
  }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(desired)); }
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
    el.textContent = pending && playing ? "Änderungen vorgemerkt · Übernahme im nächsten 8-Takt-Block" : playing ? `Block ${blockCounter + 1} läuft · ${active.bpm} BPM konstant` : "Bereit · Änderungen werden beim Start übernommen";
    el.classList.toggle("pending", pending && playing);
  }

  function control(name, label, left, right, value = DEFAULTS[name]) {
    return `<label class="pd-control"><span><strong>${esc(label)}</strong><output data-pd-output="${esc(name)}">${value}</output></span><input data-pd-setting="${esc(name)}" type="range" min="1" max="5" step="1" value="${value}"><small>${esc(left)} <i>↔</i> ${esc(right)}</small></label>`;
  }
  function createDialog() {
    if (dialog) return dialog;
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
      <main class="pd-grid">
        ${control("bassPressure", "Bassdruck", "leicht", "druckvoll", desired.bassPressure)}
        ${control("bassVariability", "Bassvariabilität", "statisch", "melodisch", desired.bassVariability)}
        ${control("melodyPresence", "Melodiepräsenz", "zurückhaltend", "deutlich", desired.melodyPresence)}
        ${control("melodyVariability", "Melodievariabilität", "wenige Motive", "viele Antworten", desired.melodyVariability)}
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
    wireDialog();
    return dialog;
  }

  function applyToControls(settings) {
    desired = {...DEFAULTS, ...settings};
    dialog?.querySelectorAll("[data-pd-setting]").forEach(input => {
      if (desired[input.dataset.pdSetting] !== undefined) input.value = desired[input.dataset.pdSetting];
    });
    dialog?.querySelectorAll("[data-pd-output]").forEach(out => out.textContent = desired[out.dataset.pdOutput]);
    saveSettings();
    if (playing) { pending = true; applyImmediate(); }
    pendingStatus();
  }

  function wireDialog() {
    dialog.querySelector("[data-pd-close]").onclick = () => { stop(); dialog.close(); };
    dialog.addEventListener("cancel", event => { event.preventDefault(); stop(); dialog.close(); });
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
    dialog.querySelector("[data-pd-pack-list]").onclick = togglePack;
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
    root.innerHTML = catalog.map(pack => `<article><span><strong>${esc(pack.name)}</strong><small>${esc(pack.instrument_role)} · ${esc(pack.license_name)}${pack.bundled ? " · lokal" : " · nachgeladen"}</small></span><button type="button" data-pd-pack-toggle="${esc(pack.id)}" data-enabled="${pack.lab_enabled}">${pack.lab_enabled ? "Im Lab aktiv" : "Deaktiviert"}</button></article>`).join("") || '<p class="hint">Keine Samplepakete verfügbar.</p>';
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
  async function togglePack(event) {
    const button = event.target.closest("[data-pd-pack-toggle]"); if (!button) return;
    button.disabled = true;
    try { await api().request(`/rest/v1/vt_music_sample_packs?id=eq.${encodeURIComponent(button.dataset.pdPackToggle)}`, {method:"PATCH", body:{lab_enabled:button.dataset.enabled !== "true", updated_at:new Date().toISOString()}}); await loadData(); status("Samplekatalog aktualisiert. Neustart der Wiedergabe übernimmt die Auswahl."); }
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
  function sampler(pack, destination) {
    const manifest = pack.manifest;
    return new Tone.Sampler({urls:manifest.urls, baseUrl:manifest.baseUrl, attack:Number(manifest.attack) || 0.006, release:Number(manifest.release) || 0.16}).connect(destination);
  }
  async function createEngine() {
    const master = new Tone.Gain(0.82).toDestination();
    const compressor = new Tone.Compressor(-16, 2.5).connect(master);
    const drumsBus = new Tone.Gain(0.9).connect(compressor);
    const bassBus = new Tone.Gain(0.8).connect(compressor);
    const musicFilter = new Tone.Filter(9000, "lowpass").connect(compressor);
    const harmonyBus = new Tone.Gain(0.78).connect(musicFilter);
    const hookBus = new Tone.Gain(0.66).connect(musicFilter);
    const choirBus = new Tone.Gain(0.30).connect(musicFilter);
    const reverb = new Tone.Reverb({decay:2.2, wet:0.16}).connect(compressor);
    musicFilter.connect(reverb);
    const base = "assets/audio/packs/power-dance-drums/";
    const player = (file, bus = drumsBus, volume = 0) => new Tone.Player({url:base + file, volume}).connect(bus);
    const drums = {kick:player("Kick06.wav", drumsBus, -1), click:player("kick-click.wav", drumsBus, -8), snare:player("Snare14.wav", drumsBus, -5), clap:player("Clap01.wav", drumsBus, -7), hat:player("ClosedHiHat02-01.wav", drumsBus, -12), open:player("OpenHiHat02-01.wav", drumsBus, -13), cymbal:player("Cymbal01-03.wav", drumsBus, -8), tomHigh:player("HighTom02-02.wav", drumsBus, -9), tomMid:player("MidTom02-02.wav", drumsBus, -8), tomLow:player("LowTom02-02.wav", drumsBus, -7)};
    const banks = {bass:enabled("bass").map(pack => ({pack, node:sampler(pack, bassBus)})), lead:enabled("lead").map(pack => ({pack, node:sampler(pack, hookBus)})), harmony:enabled("harmony").map(pack => ({pack, node:sampler(pack, harmonyBus)})), choir:enabled("choir").map(pack => ({pack, node:sampler(pack, choirBus)}))};
    const sub = new Tone.MonoSynth({oscillator:{type:"sine"}, envelope:{attack:0.003,decay:0.16,sustain:0.05,release:0.04}}).connect(bassBus);
    await Tone.loaded(); await reverb.generate();
    return {master, compressor, drumsBus, bassBus, musicFilter, harmonyBus, hookBus, choirBus, reverb, drums, banks, sub};
  }
  function ramp(param, value, seconds = 0.08) { try { param.rampTo(value, seconds); } catch { param.value = value; } }
  function applyImmediate() {
    if (!engine) return;
    ramp(engine.bassBus.gain, [0, .54, .66, .80, .94, 1.08][desired.bassPressure]);
    // Stufe 1 is deliberately almost accompaniment-only. Even at level 5 the
    // hook stays below the harmony bed instead of taking over the whole mix.
    ramp(engine.hookBus.gain, [0, .025, .10, .25, .43, .62][desired.melodyPresence]);
    ramp(engine.harmonyBus.gain, [0, .86, .84, .82, .78, .74][desired.melodyPresence]);
    ramp(engine.choirBus.gain, [0, .08, .18, .30, .44, .60][desired.choirIntensity]);
    ramp(engine.musicFilter.frequency, [0, 3600, 5200, 7600, 10500, 14500][desired.brightness], .16);
    ramp(engine.reverb.wet, [0, .04, .10, .16, .24, .34][desired.space], .16);
  }
  function chooseBank(role, block, amount) {
    const list = engine.banks[role] || []; if (!list.length) return null;
    const cadence = [99, 99, 4, 2, 1, 1][amount] || 2;
    return list[Math.floor(block / cadence) % list.length].node;
  }
  function at(time, beat, bpm) { return time + beat * 60 / bpm; }
  function blockKind(block, contrast) {
    if (contrast <= 1) return "steady";
    const cycle = block % 4;
    if (cycle === 1 && contrast >= 3) return "build";
    if (cycle === 2 && contrast >= 4) return "break";
    return "drop";
  }
  function scheduleBlock(time) {
    active = {...desired}; pending = false; blockCounter++;
    const cfg = active, bpm = cfg.bpm, scale = cfg.intensity === "low" ? .76 : cfg.intensity === "medium" ? .88 : 1;
    const kind = blockKind(blockCounter - 1, cfg.arrangementContrast), drop = kind === "drop", build = kind === "build", reduced = kind === "break";
    const rng = seeded(cfg.seed + blockCounter * 977), bass = chooseBank("bass", blockCounter - 1, cfg.timbreChange), lead = chooseBank("lead", blockCounter - 1, cfg.timbreChange), harmony = chooseBank("harmony", blockCounter - 1, cfg.timbreChange), choir = chooseBank("choir", blockCounter - 1, cfg.timbreChange);
    const registerCycle = [0, -12, 0, 7, -12, 0];
    let register = cfg.bassVariability <= 1 ? 0 : registerCycle[(blockCounter - 1) % registerCycle.length];
    for (let bar = 0; bar < 8; bar++) {
      const baseBeat = bar * 4, [root, chord] = CHORDS[(bar + blockCounter - 1) % CHORDS.length];
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
      const chordLength = reduced ? 3.1 : build ? 1.35 : .72;
      for (const position of chordPositions) for (const note of chord) harmony?.triggerAttackRelease(midi(note + 12), chordLength * 60 / bpm, at(time, baseBeat + position, bpm), .24 * scale);

      const phraseSlots = cfg.melodyVariability <= 1 ? [0] : cfg.melodyVariability === 2 ? [0,4] : cfg.melodyVariability === 3 ? [0,4,6] : cfg.melodyVariability === 4 ? [0,2,4,6] : [0,1,3,4,6];
      if (!reduced && phraseSlots.includes(bar)) {
        const motifCount = Math.min(HOOKS.length, Math.max(1, cfg.melodyVariability));
        const motif = HOOKS[(bar + Math.floor((blockCounter - 1) / 2)) % motifCount];
        motif.forEach(([step, chordTone]) => {
          const note = chord[chordTone % chord.length] + 12;
          lead?.triggerAttackRelease(midi(note), .34 * 60 / bpm, at(time, baseBeat + step / 4, bpm), (.20 + cfg.melodyPresence * .015) * scale);
        });
      }
      const choirEvery = Math.max(1, 6 - cfg.choirIntensity);
      if (choir && bar % choirEvery === 0 && (drop || build)) choir.triggerAttackRelease(midi(bar % 2 ? 72 : 67), .7 * 60 / bpm, at(time, baseBeat, bpm), .20 * scale);
      if (bar === 7) {
        if (cfg.fillFrequency >= 2) [engine.drums.tomHigh, engine.drums.tomMid, engine.drums.tomLow, engine.drums.clap].forEach((drum, i) => drum.start(at(time, baseBeat + 3 + i * .25, bpm)));
        if (cfg.arrangementContrast >= 3) engine.drums.cymbal.start(at(time, baseBeat + 3.75, bpm));
      }
    }
    requestAnimationFrame(() => { applyImmediate(); pendingStatus(); });
  }

  async function play() {
    if (playing) return;
    if (!catalog.some(pack => pack.lab_enabled)) return status("Kein Samplepaket ist für das Lab aktiviert.", true);
    desired = values(); active = {...desired}; saveSettings();
    const bpmInput = dialog.querySelector('[data-pd-setting="bpm"]'); bpmInput.disabled = true;
    dialog.querySelector("[data-pd-play]").disabled = true; dialog.querySelector("[data-pd-stop]").disabled = false;
    status("Klangpakete werden geladen …");
    try {
      await Tone.start(); engine = await createEngine(); applyImmediate();
      const transport = Tone.getTransport(); transport.stop(); transport.cancel(); transport.position = 0; transport.bpm.value = desired.bpm;
      blockCounter = 0; transport.scheduleRepeat(time => scheduleBlock(time), "8m", 0); transport.start("+0.12");
      playing = true; status(`Power Dance läuft mit konstant ${desired.bpm} BPM.`); pendingStatus();
    } catch (error) { stop(); status(`Start fehlgeschlagen: ${error.message}`, true); }
  }
  function disposeEngine() {
    if (!engine) return;
    Object.values(engine.drums).forEach(node => { try { node.stop(); node.dispose(); } catch {} });
    Object.values(engine.banks).flat().forEach(item => { try { item.node.releaseAll(); item.node.dispose(); } catch {} });
    [engine.sub, engine.reverb, engine.musicFilter, engine.choirBus, engine.hookBus, engine.harmonyBus, engine.bassBus, engine.drumsBus, engine.compressor, engine.master].forEach(node => { try { node.dispose(); } catch {} });
    engine = null;
  }
  function stop() {
    try { const transport = Tone.getTransport(); transport.stop(); transport.cancel(); transport.position = 0; } catch {}
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
