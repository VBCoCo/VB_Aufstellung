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
      { id: uid(), name: "Aufbau", description: "", objects: [], paths: [] },
    ],
  });
  let session = null;

  function selected() {
    return (
      session?.doc.steps[0].objects.find((x) => x.id === session.selectedId) ||
      null
    );
  }
  function snapshot() {
    session.undo.push(clone(session.doc));
    if (session.undo.length > 60) session.undo.shift();
    session.redo = [];
    session.dirty = true;
  }
  function restore(stack, target) {
    if (!stack.length) return;
    target.push(clone(session.doc));
    session.doc = stack.pop();
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
    const status = session.root.querySelector("[data-status]"),
      button = session.root.querySelector("[data-save]");
    status.textContent = "Speichere Grafik …";
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
      session.undo = [];
      session.redo = [];
      status.textContent = "Grafik gespeichert.";
      render();
    } catch (error) {
      status.textContent = `Speichern fehlgeschlagen: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }

  function close() {
    if (session?.dirty && !confirm("Ungespeicherte Änderungen verwerfen?"))
      return;
    session?.root.remove();
    document.body.classList.remove("exercise-diagram-open");
    session = null;
  }

  function add(type) {
    if (session.readonly) return;
    if (type === "line") {
      session.tool = "line";
      session.selectedId = "";
      render();
      session.root.querySelector("[data-status]").textContent =
        "Linie: Auf dem Feld vom Start- zum Endpunkt ziehen.";
      return;
    }
    snapshot();
    const objects = session.doc.steps[0].objects;
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
    session.tool = "move";
    render();
  }

  function removeSelected() {
    const o = selected();
    if (!o || session.readonly) return;
    snapshot();
    session.doc.steps[0].objects = session.doc.steps[0].objects.filter(
      (x) => x.id !== o.id,
    );
    session.doc.steps[0].paths = session.doc.steps[0].paths.filter(
      (x) => x.objectId !== o.id,
    );
    session.selectedId = "";
    render();
  }

  function objectMarkup(o) {
    const selectedClass = o.id === session.selectedId ? " selected" : "";
    if (o.type === "person") {
      const fill = colors[o.team] || colors.neutral,
        caption = o.label || o.number || "";
      return `<g class="diagram-object${selectedClass}" data-id="${o.id}" transform="translate(${o.x} ${o.y})"><circle r="27" fill="${fill}"/><text class="diagram-person-number" text-anchor="middle" dy="6">${esc(o.number || "")}</text>${caption && caption !== o.number ? `<text class="diagram-person-label" text-anchor="middle" y="43">${esc(caption)}</text>` : ""}</g>`;
    }
    if (o.type === "ball")
      return `<g class="diagram-object${selectedClass}" data-id="${o.id}" transform="translate(${o.x} ${o.y})"><circle r="19" fill="#ffd400" stroke="#0f4bcf" stroke-width="4"/><path d="M-14-5 Q0-18 15-6M-12 8 Q2 0 11-13" fill="none" stroke="#0f4bcf" stroke-width="2"/></g>`;
    if (o.type === "cone")
      return `<path class="diagram-object${selectedClass}" data-id="${o.id}" d="M${o.x - 15} ${o.y + 17}L${o.x} ${o.y - 20}L${o.x + 15} ${o.y + 17}Z" fill="#ff9f1c" stroke="#6d3d00" stroke-width="3"/>`;
    if (o.type === "line")
      return `<g><line class="diagram-object${selectedClass}" data-id="${o.id}" x1="${o.x}" y1="${o.y}" x2="${o.x2}" y2="${o.y2}" stroke="#fff" stroke-width="7" stroke-linecap="round"/>${selectedClass ? `<circle class="diagram-resize-handle" data-id="${o.id}" data-handle="line-start" cx="${o.x}" cy="${o.y}" r="15"/><circle class="diagram-resize-handle" data-id="${o.id}" data-handle="line-end" cx="${o.x2}" cy="${o.y2}" r="15"/>` : ""}</g>`;
    if (o.type === "zone")
      return `<g><rect class="diagram-object${selectedClass}" data-id="${o.id}" x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#58d3ff44" stroke="#58d3ff" stroke-width="4" rx="8"/>${selectedClass ? `<circle class="diagram-resize-handle" data-id="${o.id}" data-handle="zone-resize" cx="${o.x + o.width}" cy="${o.y + o.height}" r="15"/>` : ""}</g>`;
    return `<text class="diagram-object diagram-free-text${selectedClass}" data-id="${o.id}" x="${o.x}" y="${o.y}" text-anchor="middle">${esc(o.text || "Text")}</text>`;
  }

  function pathD(points) {
    if (!points?.length) return "";
    if (points.length < 3)
      return `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`;
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const mid = {
        x: (points[i].x + points[i + 1].x) / 2,
        y: (points[i].y + points[i + 1].y) / 2,
      };
      d += ` Q${points[i].x},${points[i].y} ${mid.x},${mid.y}`;
    }
    const last = points.at(-1);
    return `${d} L${last.x},${last.y}`;
  }

  function renderCourt() {
    const svg = session.root.querySelector("[data-court]"),
      half = session.doc.court.type === "half";
    svg.setAttribute("viewBox", half ? "0 0 700 470" : "0 0 700 900");
    const step = session.doc.steps[0],
      paths = step.paths
        .map(
          (p) =>
            `<path d="${pathD(p.points)}" class="diagram-path ${p.kind === "ball" ? "ball" : ""}" marker-end="url(#diagramArrow)"/>`,
        )
        .join("");
    svg.innerHTML = `<defs><linearGradient id="diagramCourtGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff8a5c"/><stop offset="100%" stop-color="#ef6a42"/></linearGradient><marker id="diagramArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#fff"/></marker><marker id="diagramBallArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ffd400"/></marker></defs><rect x="95" y="50" width="510" height="${half ? 400 : 800}" rx="8" fill="url(#diagramCourtGradient)" stroke="#fff" stroke-width="4"/><line x1="95" y1="450" x2="605" y2="450" stroke="#fff" stroke-width="6"/><line x1="95" y1="316.667" x2="605" y2="316.667" stroke="#fff" stroke-width="2" opacity=".7"/>${half ? "" : `<line x1="95" y1="583.333" x2="605" y2="583.333" stroke="#fff" stroke-width="2" opacity=".7"/><line x1="350" y1="50" x2="350" y2="850" stroke="#fff" stroke-width="1.5" opacity=".28"/>`}<g data-path-layer>${paths}</g><g data-object-layer>${step.objects.map(objectMarkup).join("")}</g>`;
    svg
      .querySelectorAll(".diagram-path.ball")
      .forEach((p) => p.setAttribute("marker-end", "url(#diagramBallArrow)"));
  }

  function renderProperties() {
    const panel = session.root.querySelector("[data-properties]"),
      o = selected();
    if (!o) {
      panel.classList.remove("open");
      panel.innerHTML = "";
      return;
    }
    panel.classList.add("open");
    let fields = `<div class="diagram-properties-head"><strong>${labels[o.type]}</strong><button type="button" data-properties-close aria-label="Eigenschaften schließen">⌄</button></div><div class="diagram-properties-grid">`;
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
    panel.querySelector("[data-properties-close]")?.addEventListener("click", () => {
      session.selectedId = "";
      render();
    });
  }

  function render() {
    if (!session) return;
    renderCourt();
    renderProperties();
    const undo = session.root.querySelector("[data-undo]"),
      redo = session.root.querySelector("[data-redo]");
    if (undo) undo.disabled = session.readonly || !session.undo.length;
    if (redo) redo.disabled = session.readonly || !session.redo.length;
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
  }

  function wirePointer() {
    const svg = session.root.querySelector("[data-court]");
    svg.addEventListener("pointerdown", (event) => {
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
        session.doc.steps[0].objects.push(line);
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
      const o = session.doc.steps[0].objects.find(
        (x) => x.id === target.dataset.id,
      );
      if (!o) return;
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
      const o = session.doc.steps[0].objects.find((x) => x.id === d.id),
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
            session.root.querySelector("[data-status]").textContent =
              "Linie nicht angelegt – bitte auf dem Feld ziehen.";
          }
          return render();
        }
        session.undo.push(d.before);
        session.redo = [];
        session.dirty = true;
        const o = session.doc.steps[0].objects.find((x) => x.id === d.id);
        if (d.kind === "draw-line") {
          session.tool = "move";
          session.root.querySelector("[data-status]").textContent =
            "Linie angelegt. Die markierten Endpunkte können verschoben werden.";
        }
        if (session.tool === "path" && ["person", "ball"].includes(o.type) && d.points.length > 1) {
          d.points.push({ x: o.x, y: o.y });
          session.doc.steps[0].paths.push({
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

  async function open({ exercise, readonly = false, userId }) {
    if (!exercise?.id) return;
    const row = await load(exercise.id),
      root = document.createElement("div");
    root.className = "exercise-diagram-shell";
    root.innerHTML = `<section class="exercise-diagram-editor"><header><button type="button" data-close>←</button><div><small>Grafischer Aufbau · V1.2a.1</small><h2>${esc(exercise.name)}</h2></div><button type="button" class="primary" data-save>Speichern</button></header><div class="diagram-toolbar"><select data-field aria-label="Felddarstellung"><option value="full">Ganzfeld</option><option value="half">Halbfeld</option></select><button type="button" data-mode="move" class="active">Verschieben</button><button type="button" data-mode="path">Weg zeichnen</button><button type="button" data-undo aria-label="Rückgängig">↶</button><button type="button" data-redo aria-label="Wiederholen">↷</button></div><main><div class="diagram-court-wrap"><svg data-court role="img" aria-label="Grafischer Übungsaufbau" preserveAspectRatio="xMidYMid meet"></svg></div><aside data-properties></aside></main><div class="diagram-add-panel"><strong>Hinzufügen</strong><div>${[
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
      )}</div></div><footer><span data-status>${readonly ? "Nur ansehen" : "Noch nicht geändert"}</span></footer></section>`;
    document.body.appendChild(root);
    document.body.classList.add("exercise-diagram-open");
    session = {
      root,
      exercise,
      readonly,
      userId,
      row,
      doc:
        row?.document && row.document.schemaVersion === 1
          ? clone(row.document)
          : fresh(),
      selectedId: "",
      tool: "move",
      undo: [],
      redo: [],
      dirty: false,
      drag: null,
    };
    root.querySelector("[data-close]").onclick = close;
    root.querySelector("[data-save]").onclick = save;
    root.querySelector("[data-undo]").onclick = () =>
      restore(session.undo, session.redo);
    root.querySelector("[data-redo]").onclick = () =>
      restore(session.redo, session.undo);
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
    wirePointer();
    render();
  }

  window.VBExerciseDiagramEditor = { open };
})();
