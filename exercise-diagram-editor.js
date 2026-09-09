(() => {
  "use strict";
  const API = () => window.VBTrainingApi;
  const SVG = "http://www.w3.org/2000/svg";
  const roles = [
    ["", "Keine feste Rolle"],
    ["setter", "Zuspiel"],
    ["middle", "Mittelblock"],
    ["outside", "Außenangriff"],
    ["opposite", "Diagonal"],
    ["libero", "Libero"],
    ["coach", "Trainer / Ballgeber"],
  ];
  const labels = {
    person: "Person",
    ball: "Ball",
    cone: "Hütchen",
    line: "Linie",
    zone: "Zone",
    text: "Text",
  };
  const colors = {
    a: "#1264d7",
    b: "#dc3030",
    neutral: "#59697b",
    coach: "#f2a900",
  };
  const uid = () =>
    crypto.randomUUID?.() ||
    `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clone = (value) => structuredClone(value);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const point = (svg, event) => {
    const p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const fresh = () => ({
    schemaVersion: 1,
    court: { type: "full" },
    steps: [
      { id: uid(), objects: [], paths: [] },
    ],
  });
  let session = null;

  function normalizeDoc(value) {
    const doc = value && typeof value === "object" ? clone(value) : fresh();
    doc.schemaVersion = 1;
    doc.court = doc.court && typeof doc.court === "object" ? doc.court : { type: "full" };
    if (!Array.isArray(doc.steps) || !doc.steps.length) doc.steps = fresh().steps;
    doc.steps = doc.steps.map((step) => ({
      id: step?.id || uid(),
      objects: Array.isArray(step?.objects) ? step.objects : [],
      paths: Array.isArray(step?.paths) ? step.paths : [],
    }));
    return doc;
  }
  function currentStep() {
    return session.doc.steps[session.stepIndex];
  }
  function history() {
    const id = currentStep().id;
    if (!session.histories.has(id)) session.histories.set(id, { undo: [], redo: [] });
    return session.histories.get(id);
  }

  function selected() {
    return (
      currentStep()?.objects.find((x) => x.id === session.selectedId) ||
      null
    );
  }
  function snapshot() {
    const h = history();
    h.undo.push(clone(currentStep()));
    if (h.undo.length > 60) h.undo.shift();
    h.redo = [];
    session.dirty = true;
  }
  function setStatus(message, { sticky = false, error = false } = {}) {
    if (!session) return;
    clearTimeout(session.statusTimer);
    const status = session.root.querySelector("[data-status]");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("error", error);
    if (message && !sticky && !error)
      session.statusTimer = setTimeout(() => {
        if (session && status.isConnected) status.textContent = "";
      }, 2600);
  }
  function restore(stack, target) {
    if (!stack.length) return;
    target.push(clone(currentStep()));
    session.doc.steps[session.stepIndex] = stack.pop();
    session.selectedId = "";
    render();
  }

  async function load(exerciseId) {
    const rows = await API().request(
      `/rest/v1/vt_exercise_diagrams?exercise_id=eq.${encodeURIComponent(exerciseId)}&select=id,exercise_id,schema_version,revision,document`,
    );
    return rows?.[0] || null;
  }

  async function save() {
    const button = session.root.querySelector("[data-save]");
    setStatus("Speichere Grafik …", { sticky: true });
    button.disabled = true;
    const body = {
      exercise_id: session.exercise.id,
      schema_version: 1,
      document: session.doc,
      updated_by: session.userId,
    };
    try {
      if (session.row) {
        const nextRevision = session.row.revision + 1;
        const rows = await API().request(
          `/rest/v1/vt_exercise_diagrams?id=eq.${session.row.id}&revision=eq.${session.row.revision}`,
          {
            method: "PATCH",
            body: {
              ...body,
              revision: nextRevision,
              updated_at: new Date().toISOString(),
            },
            headers: { Prefer: "return=representation" },
          },
        );
        if (!rows?.length)
          throw new Error(
            "Die Grafik wurde inzwischen anderweitig geändert. Bitte schließen und erneut öffnen.",
          );
        session.row = rows[0];
      } else {
        const rows = await API().request("/rest/v1/vt_exercise_diagrams", {
          method: "POST",
          body,
          headers: { Prefer: "return=representation" },
        });
        session.row = rows?.[0];
      }
      session.dirty = false;
      session.histories.clear();
      setStatus("Grafik gespeichert.");
      render();
    } catch (error) {
      setStatus(`Speichern fehlgeschlagen: ${error.message}`, { error: true });
    } finally {
      button.disabled = false;
    }
  }

  function close() {
    if (session?.dirty && !confirm("Ungespeicherte Änderungen verwerfen?"))
      return;
    stopPlayback();
    const onClose = session?.onClose;
    clearTimeout(session?.statusTimer);
    session?.root.remove();
    document.body.classList.remove("exercise-diagram-open");
    session = null;
    onClose?.();
  }

  function add(type) {
    if (session.readonly) return;
    if (type === "line") {
      session.tool = "line";
      session.selectedId = "";
      render();
      setStatus("Linie: Auf dem Feld vom Start- zum Endpunkt ziehen.");
      return;
    }
    snapshot();
    const objects = currentStep().objects;
    const base = { id: uid(), type, x: 350, y: 450, rotation: 0 };
    if (type === "person")
      Object.assign(base, {
        team: "a",
        number: String(objects.filter((x) => x.type === "person").length + 1),
        role: "",
        label: "",
      });
    if (type === "ball") Object.assign(base, { x: 390, y: 450 });
    if (type === "cone") Object.assign(base, { x: 310, y: 450 });
    if (type === "zone")
      Object.assign(base, { x: 275, y: 390, width: 150, height: 120 });
    if (type === "text")
      Object.assign(base, { x: 350, y: 450, text: "Hinweis" });
    objects.push(base);
    session.selectedId = base.id;
    session.propertiesExpanded = false;
    session.tool = "move";
    render();
  }

  function removeSelected() {
    const o = selected();
    if (!o || session.readonly) return;
    snapshot();
    currentStep().objects = currentStep().objects.filter(
      (x) => x.id !== o.id,
    );
    currentStep().paths = currentStep().paths.filter(
      (x) => x.objectId !== o.id,
    );
    session.selectedId = "";
    render();
  }

  function project(p) {
    if (session.view !== "25d") return { ...p, scale: 1 };
    const depth = Math.max(0, Math.min(1, (p.y || 0) / 900)), scale = .62 + depth * .38;
    return { ...p, x: 350 + ((p.x || 0) - 350) * scale, y: 82 + (p.y || 0) * .82, scale };
  }
  function objectMarkup(source) {
    const raw = session.frameObjects?.get(source.id) || source,
      projected = project(raw),
      o = { ...raw, x: projected.x, y: projected.y, x2: raw.x2, y2: raw.y2 },
      scale = projected.scale;
    const selectedClass = o.id === session.selectedId ? " selected" : "";
    if (o.type === "person") {
      const fill = colors[o.team] || colors.neutral,
        caption = o.label || o.number || "";
      return `<g class="diagram-object${selectedClass}" data-id="${o.id}" transform="translate(${o.x} ${o.y}) scale(${scale})"><circle r="27" fill="${fill}"/><text class="diagram-person-number" text-anchor="middle" dy="6">${esc(o.number || "")}</text>${caption && caption !== o.number ? `<text class="diagram-person-label" text-anchor="middle" y="43">${esc(caption)}</text>` : ""}</g>`;
    }
    if (o.type === "ball")
      return `<g class="diagram-object${selectedClass}" data-id="${o.id}" transform="translate(${o.x} ${o.y - (raw.lift || 0)}) scale(${scale})"><circle r="19" fill="#ffd400" stroke="#0f4bcf" stroke-width="4"/><path d="M-14-5 Q0-18 15-6M-12 8 Q2 0 11-13" fill="none" stroke="#0f4bcf" stroke-width="2"/></g>`;
    if (o.type === "cone")
      return `<g transform="translate(${o.x} ${o.y}) scale(${scale})"><path class="diagram-object${selectedClass}" data-id="${o.id}" d="M-15 17L0-20L15 17Z" fill="#ff9f1c" stroke="#6d3d00" stroke-width="3"/></g>`;
    if (o.type === "line" && session.view === "25d") {
      const a = project(raw), b = project({ x: raw.x2, y: raw.y2 });
      return `<line class="diagram-object${selectedClass}" data-id="${o.id}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
    }
    if (o.type === "line")
      return `<g><line class="diagram-object${selectedClass}" data-id="${o.id}" x1="${o.x}" y1="${o.y}" x2="${o.x2}" y2="${o.y2}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>${selectedClass ? `<circle class="diagram-resize-handle" data-id="${o.id}" data-handle="line-start" cx="${o.x}" cy="${o.y}" r="15"/><circle class="diagram-resize-handle" data-id="${o.id}" data-handle="line-end" cx="${o.x2}" cy="${o.y2}" r="15"/>` : ""}</g>`;
    if (o.type === "zone" && session.view === "25d") {
      const a = project(raw), b = project({ x: raw.x + raw.width, y: raw.y }), c = project({ x: raw.x + raw.width, y: raw.y + raw.height }), d = project({ x: raw.x, y: raw.y + raw.height });
      return `<polygon class="diagram-object${selectedClass}" data-id="${o.id}" points="${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}" fill="#58d3ff44" stroke="#58d3ff" stroke-width="4"/>`;
    }
    if (o.type === "zone")
      return `<g><rect class="diagram-object${selectedClass}" data-id="${o.id}" x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#58d3ff44" stroke="#58d3ff" stroke-width="4" rx="8"/>${selectedClass ? `<circle class="diagram-resize-handle" data-id="${o.id}" data-handle="zone-resize" cx="${o.x + o.width}" cy="${o.y + o.height}" r="15"/>` : ""}</g>`;
    return `<text class="diagram-object diagram-free-text${selectedClass}" data-id="${o.id}" x="${o.x}" y="${o.y}" text-anchor="middle" transform="rotate(0 ${o.x} ${o.y})">${esc(o.text || "Text")}</text>`;
  }

  function shortenPoints(rawPoints, distance) {
    const points = rawPoints.map((p) => ({ ...p }));
    let remaining = distance;
    for (let i = points.length - 2; i >= 0; i--) {
      const a = points[i], b = points[i + 1], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
      if (!length) continue;
      if (length >= remaining) return [...points.slice(0, i + 1), { x: b.x - dx / length * remaining, y: b.y - dy / length * remaining }];
      remaining -= length;
    }
    return points;
  }
  function pathD(rawPoints, kind = "player") {
    let points = (rawPoints || []).map(project);
    if (!points?.length) return "";
    points = shortenPoints(points, kind === "ball" ? 24 : 38);
    if (points.length < 3)
      return `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`;
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length - 2; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
      };
      d += ` Q${points[i].x},${points[i].y} ${mid.x},${mid.y}`;
    }
    const control = points.at(-2), last = points.at(-1);
    return `${d} Q${control.x},${control.y} ${last.x},${last.y}`;
  }

  function renderCourt() {
    const svg = session.root.querySelector("[data-court]"),
      half = session.doc.court.type === "half";
    svg.setAttribute("viewBox", half ? "0 0 700 470" : "0 0 700 900");
    const step = currentStep(),
      paths = step.paths
        .map(
          (p) =>
            `<path d="${pathD(p.points, p.kind)}" class="diagram-path ${p.kind === "ball" ? "ball" : ""}" marker-end="url(#diagramArrow)"/>`,
        )
        .join("");
    const projectedCourt = () => {
      const topLeft = project({ x: 95, y: 50 }), topRight = project({ x: 605, y: 50 }), bottomY = half ? 450 : 850,
        bottomLeft = project({ x: 95, y: bottomY }), bottomRight = project({ x: 605, y: bottomY }),
        line = (y, width = 2) => { const a = project({ x: 95, y }), b = project({ x: 605, y }); return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-width="${width}" opacity="${width > 4 ? 1 : .7}"/>`; };
      svg.setAttribute("viewBox", half ? "0 0 700 500" : "0 0 700 900");
      return `<polygon points="${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}" fill="url(#diagramCourtGradient)" stroke="#fff" stroke-width="4"/>${line(450, 6)}${line(316.667)}${half ? "" : line(583.333)}`;
    };
    const fullCourt = session.view === "25d"
      ? projectedCourt()
      : `<rect x="95" y="50" width="510" height="${half ? 400 : 800}" rx="8" fill="url(#diagramCourtGradient)" stroke="#fff" stroke-width="4"/><line x1="95" y1="450" x2="605" y2="450" stroke="#fff" stroke-width="6"/><line x1="95" y1="316.667" x2="605" y2="316.667" stroke="#fff" stroke-width="2" opacity=".7"/>${half ? "" : `<line x1="95" y1="583.333" x2="605" y2="583.333" stroke="#fff" stroke-width="2" opacity=".7"/><line x1="350" y1="50" x2="350" y2="850" stroke="#fff" stroke-width="1.5" opacity=".28"/>`}`;
    svg.innerHTML = `<defs><linearGradient id="diagramCourtGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff8a5c"/><stop offset="100%" stop-color="#ef6a42"/></linearGradient><marker id="diagramArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#fff"/></marker><marker id="diagramBallArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ffd400"/></marker></defs>${fullCourt}<g data-path-layer>${paths}</g><g data-object-layer>${step.objects.map(objectMarkup).join("")}</g>`;
    svg
      .querySelectorAll(".diagram-path.ball")
      .forEach((p) => p.setAttribute("marker-end", "url(#diagramBallArrow)"));
  }

  function renderProperties() {
    const panel = session.root.querySelector("[data-properties]"),
      o = selected();
    if (!o) {
      panel.classList.remove("open", "expanded");
      panel.innerHTML = "";
      return;
    }
    panel.classList.add("open");
    panel.classList.toggle("expanded", session.propertiesExpanded);
    const hint = o.type === "line" ? "Endpunkte ziehen" : o.type === "zone" ? "Ecke ziehen" : "Eigenschaften";
    let fields = `<div class="diagram-properties-head"><span><strong>${labels[o.type]}</strong><small>${hint}</small></span><div><button type="button" data-properties-toggle aria-label="Eigenschaften ${session.propertiesExpanded ? "zuklappen" : "aufklappen"}" aria-expanded="${session.propertiesExpanded}">${session.propertiesExpanded ? "⌄" : "⌃"}</button><button type="button" data-properties-close aria-label="Auswahl schließen">×</button></div></div><div class="diagram-properties-grid">`;
    if (o.type === "person")
      fields += `<label class="diagram-prop-team">Team / Person<select data-prop="team"><option value="a">Team A</option><option value="b">Team B</option><option value="neutral">Neutral</option><option value="coach">Trainer / Ballgeber</option></select></label><label class="diagram-prop-number">Nummer<input data-prop="number" maxlength="3" value="${esc(o.number || "")}"></label><label class="diagram-prop-role">Rolle<select data-prop="role">${roles.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label><label class="diagram-prop-label">Kurzbezeichnung<input data-prop="label" maxlength="14" value="${esc(o.label || "")}"></label>`;
    if (o.type === "text")
      fields += `<label class="diagram-prop-wide">Text<input data-prop="text" maxlength="40" value="${esc(o.text || "")}"></label>`;
    if (o.type === "line")
      fields += '<p class="diagram-prop-wide">Die beiden markierten Endpunkte auf dem Feld ziehen.</p>';
    if (o.type === "zone")
      fields += '<p class="diagram-prop-wide">Die markierte Ecke ziehen, um die Zone zu vergrößern oder zu verkleinern.</p>';
    fields += session.readonly
      ? "</div>"
      : '<button type="button" class="danger diagram-prop-wide" data-delete>Objekt löschen</button></div>';
    panel.innerHTML = fields;
    panel
      .querySelector('[data-prop="team"]')
      ?.setAttribute("value", o.team || "a");
    panel.querySelector('[data-prop="team"]') &&
      (panel.querySelector('[data-prop="team"]').value = o.team || "a");
    panel.querySelector('[data-prop="role"]') &&
      (panel.querySelector('[data-prop="role"]').value = o.role || "");
    panel.querySelectorAll("[data-prop]").forEach(
      (input) =>
        (input.onchange = () => {
          if (session.readonly) return;
          snapshot();
          o[input.dataset.prop] = input.value;
          render();
        }),
    );
    panel
      .querySelector("[data-delete]")
      ?.addEventListener("click", removeSelected);
    panel.querySelector("[data-properties-toggle]")?.addEventListener("click", () => {
      session.propertiesExpanded = !session.propertiesExpanded;
      renderProperties();
    });
    panel.querySelector("[data-properties-close]")?.addEventListener("click", () => {
      session.selectedId = "";
      session.propertiesExpanded = false;
      render();
    });
  }

  function stopPlayback({ reset = false } = {}) {
    if (!session) return;
    session.playing = false;
    if (session.animationFrame) cancelAnimationFrame(session.animationFrame);
    session.animationFrame = 0;
    session.frameObjects = null;
    if (reset) session.stepIndex = 0;
  }
  function setStep(index) {
    stopPlayback();
    session.stepIndex = Math.max(0, Math.min(session.doc.steps.length - 1, index));
    session.selectedId = "";
    session.propertiesExpanded = false;
    render();
  }
  function insertStep() {
    if (session.readonly) return;
    stopPlayback();
    const source = currentStep(), next = {
      id: uid(),
      objects: clone(source.objects),
      paths: [],
    };
    session.doc.steps.splice(session.stepIndex + 1, 0, next);
    session.stepIndex += 1;
    session.histories.set(next.id, { undo: [], redo: [] });
    session.dirty = true;
    render();
    setStatus(`Schritt ${session.stepIndex + 1} angelegt.`);
  }
  function deleteStep() {
    if (session.readonly || session.doc.steps.length < 2) return;
    stopPlayback();
    const removedIndex = session.stepIndex, removed = session.doc.steps.splice(removedIndex, 1)[0];
    session.histories.delete(removed.id);
    session.stepIndex = Math.min(session.stepIndex, session.doc.steps.length - 1);
    if (removedIndex < session.doc.steps.length) session.doc.steps[removedIndex].paths = [];
    session.selectedId = "";
    session.dirty = true;
    render();
    setStatus("Schritt gelöscht.");
  }
  function moveStep(delta) {
    if (session.readonly) return;
    const previous = session.stepIndex, next = previous + delta;
    if (next < 0 || next >= session.doc.steps.length) return;
    stopPlayback();
    const [step] = session.doc.steps.splice(session.stepIndex, 1);
    session.doc.steps.splice(next, 0, step);
    session.stepIndex = next;
    session.doc.steps[Math.min(previous, next)].paths = [];
    session.doc.steps[Math.max(previous, next)].paths = [];
    session.dirty = true;
    render();
  }
  function pointAlong(points, progress) {
    if (!points?.length) return { x: 0, y: 0 };
    if (points.length === 1) return points[0];
    const lengths = [], total = points.slice(1).reduce((sum, p, i) => {
      const length = Math.hypot(p.x - points[i].x, p.y - points[i].y);
      lengths.push(length); return sum + length;
    }, 0);
    let target = total * progress;
    for (let i = 0; i < lengths.length; i++) {
      if (target <= lengths[i] || i === lengths.length - 1) {
        const t = lengths[i] ? target / lengths[i] : 1, a = points[i], b = points[i + 1];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      target -= lengths[i];
    }
    return points.at(-1);
  }
  function animateTo(index) {
    return new Promise((resolve) => {
      const from = currentStep(), to = session.doc.steps[index];
      if (!to || to === from) return resolve();
      const fromById = new Map(from.objects.map((o) => [o.id, o])), pathsById = new Map(to.paths.map((p) => [p.objectId, p]));
      session.stepIndex = index;
      const started = performance.now(), duration = 1500;
      const tick = (now) => {
        if (!session?.playing) return resolve();
        const raw = Math.min(1, (now - started) / duration), t = raw < .5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
        session.frameObjects = new Map(to.objects.map((target) => {
          const source = fromById.get(target.id) || target, path = pathsById.get(target.id), position = path?.points?.length > 1
            ? pointAlong(path.points, t)
            : { x: source.x + (target.x - source.x) * t, y: source.y + (target.y - source.y) * t };
          return [target.id, { ...target, ...position, lift: target.type === "ball" && session.view === "25d" ? Math.sin(Math.PI * t) * 105 : 0 }];
        }));
        renderCourt();
        if (raw < 1) session.animationFrame = requestAnimationFrame(tick);
        else { session.frameObjects = null; session.animationFrame = 0; render(); resolve(); }
      };
      session.animationFrame = requestAnimationFrame(tick);
    });
  }
  async function playAll() {
    if (session.playing) { stopPlayback(); render(); return; }
    if (session.doc.steps.length < 2) return setStatus("Lege zuerst einen zweiten Schritt an.");
    session.playing = true;
    session.selectedId = "";
    if (session.stepIndex >= session.doc.steps.length - 1) session.stepIndex = 0;
    render();
    do {
      while (session?.playing && session.stepIndex < session.doc.steps.length - 1) {
        await animateTo(session.stepIndex + 1);
        if (session?.playing) await new Promise((r) => setTimeout(r, 600));
      }
      if (!session?.playing || !session.loop) break;
      await new Promise((r) => setTimeout(r, 900));
      if (session?.playing) { session.stepIndex = 0; render(); }
    } while (session?.playing && session.loop);
    if (session) { session.playing = false; session.frameObjects = null; render(); }
  }

  function renderSteps() {
    const strip = session.root.querySelector("[data-step-strip]");
    if (!strip) return;
    strip.innerHTML = session.doc.steps.map((step, index) => `<button type="button" data-step="${index}" class="${index === session.stepIndex ? "active" : ""}" aria-label="Schritt ${index + 1}" aria-current="${index === session.stepIndex ? "step" : "false"}">${index + 1}</button>`).join("");
    strip.querySelectorAll("[data-step]").forEach((button) => button.onclick = () => setStep(Number(button.dataset.step)));
    requestAnimationFrame(() => strip.querySelector(".active")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
    const prev = session.root.querySelector("[data-step-prev]"), next = session.root.querySelector("[data-step-next]");
    prev.disabled = session.stepIndex === 0; next.disabled = session.stepIndex === session.doc.steps.length - 1;
    session.root.querySelector("[data-step-delete]").disabled = session.readonly || session.doc.steps.length < 2;
    session.root.querySelector("[data-step-left]").disabled = session.readonly || session.stepIndex === 0;
    session.root.querySelector("[data-step-right]").disabled = session.readonly || session.stepIndex === session.doc.steps.length - 1;
    session.root.querySelector("[data-play]").textContent = session.playing ? "■" : "▶";
    session.root.querySelector("[data-loop]").classList.toggle("active", session.loop);
    session.root.querySelector("[data-view-2d]").classList.toggle("active", session.view === "2d");
    session.root.querySelector("[data-view-25d]").classList.toggle("active", session.view === "25d");
  }

  function render() {
    if (!session) return;
    session.root.classList.toggle("view-25d", session.view === "25d");
    renderCourt();
    renderProperties();
    renderSteps();
    const undo = session.root.querySelector("[data-undo]"),
      redo = session.root.querySelector("[data-redo]"), h = history();
    if (undo) undo.disabled = session.readonly || !h.undo.length;
    if (redo) redo.disabled = session.readonly || !h.redo.length;
    session.root
      .querySelector("[data-save]")
      ?.classList.toggle("hidden", session.readonly);
    session.root
      .querySelector('[data-mode="move"]')
      ?.classList.toggle("active", session.tool === "move");
    session.root
      .querySelector('[data-mode="path"]')
      ?.classList.toggle("active", session.tool === "path");
    session.root
      .querySelector('[data-add="line"]')
      ?.classList.toggle("active", session.tool === "line");
    session.root.querySelector("[data-field]").value = session.doc.court.type;
    const summary = session.root.querySelector("[data-tools-summary]");
    if (summary)
      summary.textContent = `${session.doc.court.type === "half" ? "Halbfeld" : "Ganzfeld"} · ${session.tool === "path" ? "Weg zeichnen" : session.tool === "line" ? "Linie zeichnen" : "Verschieben"}`;
  }

  function wirePointer() {
    const svg = session.root.querySelector("[data-court]");
    svg.addEventListener("pointerdown", (event) => {
      if (session.view === "25d" || session.playing) return;
      const target = event.target.closest("[data-id]");
      if (!target) {
        if (session.readonly || session.tool !== "line") return;
        const start = point(svg, event),
          before = clone(session.doc),
          line = {
            id: uid(),
            type: "line",
            x: start.x,
            y: start.y,
            x2: start.x,
            y2: start.y,
            rotation: 0,
          };
        currentStep().objects.push(line);
        session.selectedId = line.id;
        session.drag = {
          kind: "draw-line",
          id: line.id,
          start,
          origin: clone(line),
          before,
          moved: false,
        };
        svg.setPointerCapture(event.pointerId);
        renderCourt();
        return;
      }
      const o = currentStep().objects.find(
        (x) => x.id === target.dataset.id,
      );
      if (!o) return;
      if (session.selectedId !== o.id)
        session.propertiesExpanded = matchMedia("(orientation: landscape) and (min-width: 600px)").matches;
      session.selectedId = o.id;
      if (session.readonly) {
        render();
        return;
      }
      const start = point(svg, event);
      session.drag = {
        kind: target.dataset.handle ? "handle" : "move",
        handle: target.dataset.handle || "",
        id: o.id,
        start,
        origin: clone(o),
        points: [{ x: o.x, y: o.y }],
        before: clone(session.doc),
        moved: false,
      };
      svg.setPointerCapture(event.pointerId);
      render();
    });
    svg.addEventListener("pointermove", (event) => {
      const d = session.drag;
      if (!d) return;
      const o = currentStep().objects.find((x) => x.id === d.id),
        p = point(svg, event),
        dx = p.x - d.start.x,
        dy = p.y - d.start.y;
      if (d.kind === "draw-line") {
        o.x2 = Math.max(20, Math.min(680, p.x));
        o.y2 = Math.max(20, Math.min(session.doc.court.type === "half" ? 450 : 880, p.y));
        d.moved = Math.hypot(o.x2 - o.x, o.y2 - o.y) > 12;
        renderCourt();
        return;
      }
      if (d.kind === "handle") {
        const x = Math.max(20, Math.min(680, p.x)),
          y = Math.max(20, Math.min(session.doc.court.type === "half" ? 450 : 880, p.y));
        if (d.handle === "line-start") {
          o.x = x;
          o.y = y;
        } else if (d.handle === "line-end") {
          o.x2 = x;
          o.y2 = y;
        } else if (d.handle === "zone-resize") {
          o.width = Math.max(35, x - o.x);
          o.height = Math.max(35, y - o.y);
        }
        d.moved = Math.hypot(dx, dy) > 3;
        renderCourt();
        return;
      }
      o.x = Math.max(20, Math.min(680, d.origin.x + dx));
      const maxY = session.doc.court.type === "half" ? 445 : 880;
      o.y = Math.max(20, Math.min(maxY, d.origin.y + dy));
      if (o.type === "line") {
        o.x2 = d.origin.x2 + dx;
        o.y2 = d.origin.y2 + dy;
      }
      d.moved = Math.hypot(dx, dy) > 3;
      if (session.tool === "path" && d.moved && ["person", "ball"].includes(o.type)) {
        const last = d.points.at(-1);
        if (Math.hypot(o.x - last.x, o.y - last.y) > 9)
          d.points.push({ x: o.x, y: o.y });
      }
      renderCourt();
    });
    ["pointerup", "pointercancel"].forEach((name) =>
      svg.addEventListener(name, () => {
        const d = session.drag;
        if (!d) return;
        session.drag = null;
        if (!d.moved) {
          if (d.kind === "draw-line") {
            session.doc = d.before;
            session.selectedId = "";
            setStatus("Linie nicht angelegt – bitte auf dem Feld ziehen.");
          }
          return render();
        }
        const h = history();
        h.undo.push(d.before.steps[session.stepIndex]);
        h.redo = [];
        session.dirty = true;
        const o = currentStep().objects.find((x) => x.id === d.id);
        if (d.kind === "draw-line") {
          session.tool = "move";
          setStatus("Linie angelegt. Endpunkte können verschoben werden.");
        }
        if (session.tool === "path" && ["person", "ball"].includes(o.type) && d.points.length > 1) {
          d.points.push({ x: o.x, y: o.y });
          currentStep().paths = currentStep().paths.filter((path) => path.objectId !== o.id);
          currentStep().paths.push({
            id: uid(),
            objectId: o.id,
            kind: o.type === "ball" ? "ball" : "player",
            points: d.points,
          });
        }
        render();
      }),
    );
  }

  async function open({ exercise, readonly = false, userId, onClose = null }) {
    if (!exercise?.id) return;
    const row = await load(exercise.id),
      root = document.createElement("div");
    root.className = "exercise-diagram-shell";
    root.innerHTML = `<section class="exercise-diagram-editor"><header><button type="button" data-close>←</button><div><small>Grafischer Aufbau · V1.2b</small><h2>${esc(exercise.name)}</h2></div><button type="button" class="primary" data-save>Speichern</button></header><nav class="diagram-step-bar" aria-label="Übungsschritte"><button type="button" data-step-prev aria-label="Vorheriger Schritt">‹</button><div data-step-strip></div><button type="button" data-step-next aria-label="Nächster Schritt">›</button><button type="button" data-step-add aria-label="Neuen Schritt anlegen">＋</button><button type="button" data-play aria-label="Abspielen">▶</button><button type="button" data-loop aria-label="Wiederholen">↻</button><details class="diagram-step-menu"><summary aria-label="Schritt verwalten">⋯</summary><div><button type="button" data-step-left>Nach links</button><button type="button" data-step-right>Nach rechts</button><button type="button" class="danger" data-step-delete>Löschen</button></div></details></nav><section class="diagram-preview-bar"><span>Ansicht</span><button type="button" data-view-2d class="active">2D</button><button type="button" data-view-25d>2,5D</button><button type="button" data-reset-play aria-label="Zum ersten Schritt">|‹</button></section><section class="diagram-tool-panel collapsed" data-collapsible="tools"><button type="button" class="diagram-panel-toggle" data-panel-toggle="tools" aria-expanded="false"><span>Aufbau</span><small data-tools-summary>Ganzfeld · Verschieben</small><i>⌃</i></button><div class="diagram-toolbar"><select data-field aria-label="Felddarstellung"><option value="full">Ganzfeld</option><option value="half">Halbfeld</option></select><button type="button" data-mode="move" class="active">Nur verschieben</button><button type="button" data-mode="path">Mit Weg / Flugbahn</button><button type="button" data-undo aria-label="Rückgängig">↶</button><button type="button" data-redo aria-label="Wiederholen">↷</button></div></section><main><div class="diagram-court-wrap"><svg data-court role="img" aria-label="Grafischer Übungsaufbau" preserveAspectRatio="xMidYMid meet"></svg></div><aside data-properties></aside></main><section class="diagram-add-panel collapsed" data-collapsible="add"><button type="button" class="diagram-panel-toggle" data-panel-toggle="add" aria-expanded="false"><span>Hinzufügen</span><small>Personen &amp; Objekte</small><i>⌃</i></button><div>${[
      ["person", "＋ Person"],
      ["ball", "＋ Ball"],
      ["cone", "＋ Hütchen"],
      ["line", "＋ Linie"],
      ["zone", "＋ Zone"],
      ["text", "＋ Text"],
    ]
      .map(([v, l]) => `<button type="button" data-add="${v}">${l}</button>`)
      .join(
        "",
      )}</div></section><footer aria-live="polite"><span data-status></span></footer></section>`;
    document.body.appendChild(root);
    document.body.classList.add("exercise-diagram-open");
    session = {
      root,
      exercise,
      readonly,
      userId,
      row,
      doc: normalizeDoc(
        row?.document && row.document.schemaVersion === 1
          ? clone(row.document)
          : fresh()),
      stepIndex: 0,
      selectedId: "",
      tool: "move",
      histories: new Map(),
      dirty: false,
      drag: null,
      propertiesExpanded: false,
      statusTimer: null,
      onClose,
      view: "2d",
      loop: false,
      playing: false,
      animationFrame: 0,
      frameObjects: null,
    };
    root.querySelector("[data-close]").onclick = close;
    root.querySelector("[data-save]").onclick = save;
    root.querySelector("[data-undo]").onclick = () => { const h = history(); restore(h.undo, h.redo); };
    root.querySelector("[data-redo]").onclick = () => { const h = history(); restore(h.redo, h.undo); };
    root.querySelector("[data-step-prev]").onclick = () => setStep(session.stepIndex - 1);
    root.querySelector("[data-step-next]").onclick = () => setStep(session.stepIndex + 1);
    root.querySelector("[data-step-add]").onclick = insertStep;
    root.querySelector("[data-step-delete]").onclick = deleteStep;
    root.querySelector("[data-step-left]").onclick = () => moveStep(-1);
    root.querySelector("[data-step-right]").onclick = () => moveStep(1);
    root.querySelector("[data-play]").onclick = playAll;
    root.querySelector("[data-loop]").onclick = () => { session.loop = !session.loop; render(); };
    root.querySelector("[data-reset-play]").onclick = () => { stopPlayback({ reset: true }); render(); };
    root.querySelector("[data-view-2d]").onclick = () => { session.view = "2d"; render(); };
    root.querySelector("[data-view-25d]").onclick = () => { stopPlayback(); session.view = "25d"; session.selectedId = ""; render(); };
    root.querySelector("[data-field]").onchange = (event) => {
      if (readonly) {
        event.target.value = session.doc.court.type;
        return;
      }
      snapshot();
      session.doc.court.type = event.target.value;
      render();
    };
    root.querySelectorAll("[data-mode]").forEach(
      (b) =>
        (b.onclick = () => {
          session.tool = b.dataset.mode;
          render();
        }),
    );
    root.querySelectorAll("[data-add]").forEach((b) => {
      b.disabled = readonly;
      b.onclick = () => add(b.dataset.add);
    });
    root.querySelector("[data-step-add]").disabled = readonly;
    root.querySelectorAll("[data-panel-toggle]").forEach((button) => {
      button.onclick = () => {
        const panel = root.querySelector(`[data-collapsible="${button.dataset.panelToggle}"]`),
          opening = panel.classList.contains("collapsed");
        root.querySelectorAll("[data-collapsible]").forEach((other) => {
          if (other !== panel) {
            other.classList.add("collapsed");
            other.querySelector("[data-panel-toggle]")?.setAttribute("aria-expanded", "false");
          }
        });
        panel.classList.toggle("collapsed", !opening);
        button.setAttribute("aria-expanded", String(opening));
      };
    });
    wirePointer();
    render();
    setStatus(readonly ? "Nur ansehen" : "Grafik bereit.");
  }

  window.VBExerciseDiagramEditor = { open };
})();
