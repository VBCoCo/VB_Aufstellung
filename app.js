(() => {
  "use strict";

  const APP_VERSION = {
    number: "1.6.0",
    date: "06.08.2026",
    changes: [
      "Info- und Bearbeiten-Button technisch neu aufgebaut.",
      "app.js funktioniert jetzt ohne weitere JavaScript-Importe.",
      "Ball und Spieler lassen sich identisch antippen oder ziehen.",
      "Ball und Spieler bewegen sich gemeinsam von Schritt zu Schritt.",
      "Die Aufstellungsprüfung ist nur bei Aufschlag / Annahme aktiv."
    ]
  };

  const STORAGE_KEY = "volleyball-trainer-state-v1";
  const VIEW_COLOR = "#2563eb";
  const EDIT_COLOR = "#f59e0b";
  const INVALID_COLOR = "#dc2626";
  const CIRCLE_RADIUS = 36;
  const WARNING_DISTANCE = 18;
  const ANIMATION_DURATION = 1700;

  const BASE_SLOTS = {
    1: { x: 440, y: 625 },
    2: { x: 430, y: 455 },
    3: { x: 300, y: 455 },
    4: { x: 170, y: 455 },
    5: { x: 160, y: 625 },
    6: { x: 300, y: 625 }
  };

  const ROSTER = [
    { id: "a1", role: "AA", name: "Außen 1", baseRotation: 1 },
    { id: "z1", role: "Z", name: "Zuspieler 1", baseRotation: 2 },
    { id: "m1", role: "MB", name: "Mitte 1", baseRotation: 3 },
    { id: "a2", role: "AA", name: "Außen 2", baseRotation: 4 },
    { id: "z2", role: "Z", name: "Zuspieler 2", baseRotation: 5 },
    { id: "m2", role: "MB", name: "Mitte 2", baseRotation: 6 }
  ];

  const SITUATION_LABELS = {
    serveReceive: "Aufschlag / Annahme – Aufstellungsprüfung aktiv",
    attack: "Angriff – freie Aufstellung",
    defense: "Abwehr – freie Aufstellung",
    ownServe: "Eigener Aufschlag – freie Aufstellung"
  };

  const elements = {
    modeBanner: document.querySelector("#modeBanner"),
    modeTitle: document.querySelector("#modeTitle"),
    modeHint: document.querySelector("#modeHint"),
    toggleMode: document.querySelector("#toggleMode"),
    infoButton: document.querySelector("#infoButton"),
    rotationSelect: document.querySelector("#rotationSelect"),
    courtHeader: document.querySelector("#courtHeader"),
    rotationName: document.querySelector("#rotationName"),
    stepNumber: document.querySelector("#stepNumber"),
    stepTotal: document.querySelector("#stepTotal"),
    modeBadge: document.querySelector("#modeBadge"),
    stepNameRow: document.querySelector("#stepNameRow"),
    stepNameInput: document.querySelector("#stepNameInput"),
    prevStep: document.querySelector("#prevStep"),
    play: document.querySelector("#play"),
    nextStep: document.querySelector("#nextStep"),
    saveStep: document.querySelector("#saveStep"),
    addStep: document.querySelector("#addStep"),
    deleteStep: document.querySelector("#deleteStep"),
    editControls: document.querySelector("#editControls"),
    moveMode: document.querySelector("#moveMode"),
    situationSelect: document.querySelector("#situationSelect"),
    court: document.querySelector("#court"),
    validationLayer: document.querySelector("#validationLayer"),
    movementLayer: document.querySelector("#movementLayer"),
    ballPathLayer: document.querySelector("#ballPathLayer"),
    playerLayer: document.querySelector("#playerLayer"),
    ball: document.querySelector("#ball"),
    tapNotice: document.querySelector("#tapNotice"),
    status: document.querySelector("#status"),
    versionDialog: document.querySelector("#versionDialog"),
    closeVersionDialog: document.querySelector("#closeVersionDialog"),
    closeVersionDialogBottom: document.querySelector("#closeVersionDialogBottom"),
    versionNumber: document.querySelector("#versionNumber"),
    versionDate: document.querySelector("#versionDate"),
    versionChanges: document.querySelector("#versionChanges"),
    currentSituationInfo: document.querySelector("#currentSituationInfo")
  };

  const required = [
    "toggleMode", "infoButton", "court", "playerLayer", "ball",
    "rotationSelect", "stepNameInput", "situationSelect"
  ];

  for (const key of required) {
    if (!elements[key]) {
      console.error(`Volleyball Trainer: Element #${key} fehlt.`);
      return;
    }
  }

  function rotatedPosition(position, steps) {
    let result = position;
    for (let index = 0; index < steps; index += 1) {
      result = result === 1 ? 6 : result - 1;
    }
    return result;
  }

  function rotationName(index) {
    return index === 0 ? "Grundaufstellung" : `Rotation +${index}`;
  }

  function makeInitialStep(rotationIndex) {
    const positions = {};
    for (const player of ROSTER) {
      const slot = rotatedPosition(player.baseRotation, rotationIndex);
      positions[player.id] = { ...BASE_SLOTS[slot] };
    }

    return {
      name: "Grundposition",
      positions,
      situation: "serveReceive",
      ball: { position: { x: 300, y: 315 } }
    };
  }

  function makeInitialState() {
    return {
      rotations: Array.from({ length: 6 }, (_, index) => ({
        steps: [makeInitialStep(index)]
      })),
      rotationIndex: 0,
      stepIndex: 0
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeState(candidate) {
    const normalized = candidate?.rotations ? candidate : makeInitialState();

    normalized.rotationIndex = Number.isInteger(normalized.rotationIndex)
      ? Math.max(0, Math.min(5, normalized.rotationIndex))
      : 0;
    normalized.stepIndex = Number.isInteger(normalized.stepIndex)
      ? normalized.stepIndex
      : 0;

    while (normalized.rotations.length < 6) {
      normalized.rotations.push({ steps: [makeInitialStep(normalized.rotations.length)] });
    }

    normalized.rotations.forEach((rotation, rotationIndex) => {
      if (!Array.isArray(rotation.steps) || rotation.steps.length === 0) {
        rotation.steps = [makeInitialStep(rotationIndex)];
      }

      rotation.steps.forEach(step => {
        step.name = step.name || "Grundposition";

        const situationMap = {
          opponentAttack: "defense",
          freeBall: "defense",
          ownAttack: "attack",
          custom: "attack"
        };
        step.situation = situationMap[step.situation] || step.situation || "serveReceive";
        if (!SITUATION_LABELS[step.situation]) step.situation = "serveReceive";

        const legacyBall = step.ball || {};
        const ballPosition =
          legacyBall.position ||
          legacyBall.contact ||
          legacyBall.start ||
          { x: 300, y: 315 };
        step.ball = { position: { ...ballPosition } };

        if (!step.positions) {
          step.positions = makeInitialStep(rotationIndex).positions;
        }
      });
    });

    normalized.stepIndex = Math.max(
      0,
      Math.min(
        normalized.rotations[normalized.rotationIndex].steps.length - 1,
        normalized.stepIndex
      )
    );

    return normalized;
  }

  let state = normalizeState(loadState());
  let editMode = false;
  let selectedObject = null;
  let draggingObject = null;
  let playing = false;
  let activeAnimations = [];
  let playbackTimer = null;

  function currentRotation() {
    return state.rotations[state.rotationIndex];
  }

  function currentStep() {
    return currentRotation().steps[state.stepIndex];
  }

  function playerRotation(player) {
    return rotatedPosition(player.baseRotation, state.rotationIndex);
  }

  function playerAtRotation(rotationNumber) {
    return ROSTER.find(player => playerRotation(player) === rotationNumber);
  }

  function createPlayers() {
    elements.playerLayer.innerHTML = "";

    for (const player of ROSTER) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.classList.add("player");
      group.dataset.id = player.id;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "36");
      circle.setAttribute("stroke", "#111827");
      circle.setAttribute("stroke-width", "2");

      const role = document.createElementNS("http://www.w3.org/2000/svg", "text");
      role.setAttribute("text-anchor", "middle");
      role.setAttribute("y", "7");
      role.setAttribute("font-size", "18");
      role.setAttribute("font-weight", "700");
      role.setAttribute("fill", "#ffffff");
      role.textContent = player.role;

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.dataset.positionLabel = "true";
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("y", "60");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-weight", "600");
      label.setAttribute("fill", "#111827");

      group.append(circle, role, label);
      elements.playerLayer.appendChild(group);
    }
  }

  function drawLine(layer, x1, y1, x2, y2, className) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", className);
    layer.appendChild(line);
  }

  function validateFormation() {
    elements.validationLayer.innerHTML = "";
    const invalidIds = new Set();

    if (currentStep().situation !== "serveReceive") return invalidIds;

    const positionByRotation = number => {
      const player = playerAtRotation(number);
      return currentStep().positions[player.id];
    };

    const horizontal = [
      { left: 4, right: 3 },
      { left: 3, right: 2 },
      { left: 5, right: 6 },
      { left: 6, right: 1 }
    ];

    const vertical = [
      { front: 4, back: 5 },
      { front: 3, back: 6 },
      { front: 2, back: 1 }
    ];

    for (const relation of horizontal) {
      const left = positionByRotation(relation.left);
      const right = positionByRotation(relation.right);
      const testedEdge = left.x - CIRCLE_RADIUS;
      const boundary = right.x + CIRCLE_RADIUS;
      const remaining = boundary - testedEdge;
      const state = remaining <= 0 ? "invalid" : remaining <= WARNING_DISTANCE ? "warning" : "clear";

      if (state === "invalid" || (editMode && state === "warning")) {
        drawLine(
          elements.validationLayer,
          boundary, 382, boundary, 724,
          state === "invalid" ? "validation-invalid" : "validation-warning"
        );
      }

      if (state === "invalid") {
        invalidIds.add(playerAtRotation(relation.left).id);
        invalidIds.add(playerAtRotation(relation.right).id);
      }
    }

    for (const relation of vertical) {
      const front = positionByRotation(relation.front);
      const back = positionByRotation(relation.back);
      const testedEdge = front.y - CIRCLE_RADIUS;
      const boundary = back.y + CIRCLE_RADIUS;
      const remaining = boundary - testedEdge;
      const state = remaining <= 0 ? "invalid" : remaining <= WARNING_DISTANCE ? "warning" : "clear";

      if (state === "invalid" || (editMode && state === "warning")) {
        drawLine(
          elements.validationLayer,
          66, boundary, 534, boundary,
          state === "invalid" ? "validation-invalid" : "validation-warning"
        );
      }

      if (state === "invalid") {
        invalidIds.add(playerAtRotation(relation.front).id);
        invalidIds.add(playerAtRotation(relation.back).id);
      }
    }

    return invalidIds;
  }

  function renderPlayers() {
    const invalidIds = validateFormation();

    for (const player of ROSTER) {
      const position = currentStep().positions[player.id];
      const group = elements.playerLayer.querySelector(`[data-id="${player.id}"]`);

      group.setAttribute("transform", `translate(${position.x} ${position.y})`);
      group.classList.toggle("editable", editMode);
      group.classList.toggle(
        "selected",
        selectedObject?.type === "player" && selectedObject.id === player.id
      );

      const fill = invalidIds.has(player.id)
        ? INVALID_COLOR
        : editMode
          ? EDIT_COLOR
          : VIEW_COLOR;

      group.querySelector("circle").setAttribute("fill", fill);
      group.querySelector("[data-position-label]").textContent =
        `Position ${playerRotation(player)}`;
    }
  }

  function renderBall() {
    elements.ballPathLayer.innerHTML = "";
    const position = currentStep().ball.position;

    elements.ball.setAttribute("transform", `translate(${position.x} ${position.y})`);
    elements.ball.setAttribute("visibility", "visible");
    elements.ball.classList.toggle("editable", editMode);
    elements.ball.classList.toggle("selected", selectedObject?.type === "ball");

    if (editMode) {
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      marker.setAttribute("cx", position.x);
      marker.setAttribute("cy", position.y);
      marker.setAttribute("r", "8");
      marker.setAttribute("class", "ball-point");
      elements.ballPathLayer.appendChild(marker);
    }

    renderStepPaths();
  }

  function renderStepPaths() {
    elements.movementLayer.innerHTML = "";
    elements.ballPathLayer
      .querySelectorAll(".step-ball-path")
      .forEach(node => node.remove());

    if (state.stepIndex <= 0) return;

    const previousStep = currentRotation().steps[state.stepIndex - 1];
    const activeStep = currentStep();

    for (const player of ROSTER) {
      const from = previousStep.positions[player.id];
      const to = activeStep.positions[player.id];

      if (from.x !== to.x || from.y !== to.y) {
        drawLine(
          elements.movementLayer,
          from.x, from.y, to.x, to.y,
          "step-path"
        );
      }
    }

    const fromBall = previousStep.ball.position;
    const toBall = activeStep.ball.position;

    if (fromBall.x !== toBall.x || fromBall.y !== toBall.y) {
      drawLine(
        elements.ballPathLayer,
        fromBall.x, fromBall.y, toBall.x, toBall.y,
        "step-ball-path"
      );
    }
  }

  async function switchStepAnimated(targetIndex) {
    const boundedTarget = Math.max(
      0,
      Math.min(currentRotation().steps.length - 1, targetIndex)
    );

    if (boundedTarget === state.stepIndex) return;

    stopPlayback();

    const fromIndex = state.stepIndex;
    const fromStep = currentRotation().steps[fromIndex];
    const toStep = currentRotation().steps[boundedTarget];

    playing = true;
    elements.play.textContent = "⏸ Stoppen";

    await animateTransition(fromStep, toStep);

    if (!playing) return;

    state.stepIndex = boundedTarget;
    playing = false;
    activeAnimations = [];
    elements.play.textContent = "▶ Abspielen";
    renderAll();
    elements.status.textContent =
      `Schritt ${fromIndex + 1} → Schritt ${boundedTarget + 1} animiert.`;
  }

  function updateUi() {
    elements.rotationSelect.value = String(state.rotationIndex);
    elements.rotationName.textContent = rotationName(state.rotationIndex);
    elements.stepNumber.textContent = String(state.stepIndex + 1);
    elements.stepTotal.textContent = String(currentRotation().steps.length);
    elements.stepNameInput.value = currentStep().name;
    elements.situationSelect.value = currentStep().situation;
  }

  function renderAll() {
    updateUi();
    renderPlayers();
    renderBall();
  }

  function setMode(value) {
    stopPlayback();
    editMode = Boolean(value);
    selectedObject = null;
    draggingObject = null;
    elements.tapNotice.classList.add("hidden");

    elements.modeBanner.classList.toggle("edit-mode", editMode);
    elements.modeBanner.classList.toggle("view-mode", !editMode);
    elements.courtHeader.classList.toggle("edit-mode", editMode);
    elements.courtHeader.classList.toggle("view-mode", !editMode);
    elements.court.classList.toggle("edit-mode", editMode);

    elements.modeTitle.textContent = editMode ? "Trainermodus" : "Ansichtsmodus";
    elements.modeHint.textContent = editMode
      ? "Spieler und Ball können direkt angetippt oder gezogen werden."
      : "Schritte ansehen und Animation abspielen.";
    elements.toggleMode.textContent = editMode ? "Bearbeitung beenden" : "Bearbeiten";
    elements.modeBadge.textContent = editMode ? "Bearbeitung" : "Ansicht";

    for (const item of [
      elements.stepNameRow,
      elements.editControls,
      elements.saveStep,
      elements.addStep,
      elements.deleteStep
    ]) {
      item.classList.toggle("hidden", !editMode);
    }

    renderAll();
  }

  function eventPoint(event) {
    const point = elements.court.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(elements.court.getScreenCTM().inverse());
  }

  function clampPlayer(point) {
    return {
      x: Math.max(105, Math.min(495, point.x)),
      y: Math.max(420, Math.min(680, point.y))
    };
  }

  function clampBall(point) {
    return {
      x: Math.max(85, Math.min(515, point.x)),
      y: Math.max(55, Math.min(705, point.y))
    };
  }

  function persist(message) {
    saveState();
    elements.status.textContent = message;
  }

  function openVersionDialog() {
    elements.versionNumber.textContent = APP_VERSION.number;
    elements.versionDate.textContent = `Stand: ${APP_VERSION.date}`;
    elements.versionChanges.innerHTML = "";

    for (const change of APP_VERSION.changes) {
      const item = document.createElement("li");
      item.textContent = change;
      elements.versionChanges.appendChild(item);
    }

    elements.currentSituationInfo.textContent =
      `${SITUATION_LABELS[currentStep().situation]} · ` +
      `${rotationName(state.rotationIndex)} · Schritt ${state.stepIndex + 1}`;

    if (typeof elements.versionDialog.showModal === "function") {
      elements.versionDialog.showModal();
    } else {
      elements.versionDialog.setAttribute("open", "");
    }
  }

  function closeVersionDialog() {
    if (typeof elements.versionDialog.close === "function") {
      elements.versionDialog.close();
    } else {
      elements.versionDialog.removeAttribute("open");
    }
  }

  function stopPlayback() {
    playing = false;
    clearTimeout(playbackTimer);
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations = [];
    elements.movementLayer.innerHTML = "";
    elements.ballPathLayer.innerHTML = "";
    elements.play.textContent = "▶ Abspielen";
  }

  async function animateTransition(fromStep, toStep) {
    elements.movementLayer.innerHTML = "";
    elements.ballPathLayer.innerHTML = "";

    for (const player of ROSTER) {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];

      if (from.x !== to.x || from.y !== to.y) {
        drawLine(elements.movementLayer, from.x, from.y, to.x, to.y, "movement-path");
      }
    }

    const fromBall = fromStep.ball.position;
    const toBall = toStep.ball.position;

    if (fromBall.x !== toBall.x || fromBall.y !== toBall.y) {
      drawLine(
        elements.ballPathLayer,
        fromBall.x, fromBall.y, toBall.x, toBall.y,
        "ball-path"
      );
    }

    elements.ball.setAttribute("visibility", "visible");
    elements.ball.setAttribute("transform", `translate(${fromBall.x} ${fromBall.y})`);

    const playerAnimations = ROSTER.map(player => {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];
      const element = elements.playerLayer.querySelector(`[data-id="${player.id}"]`);

      return element.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px)` },
          { transform: `translate(${to.x}px, ${to.y}px)` }
        ],
        {
          duration: ANIMATION_DURATION,
          easing: "ease-in-out",
          fill: "forwards"
        }
      );
    });

    const ballAnimation = elements.ball.animate(
      [
        { transform: `translate(${fromBall.x}px, ${fromBall.y}px)` },
        { transform: `translate(${toBall.x}px, ${toBall.y}px)` }
      ],
      {
        duration: ANIMATION_DURATION,
        easing: "ease-in-out",
        fill: "forwards"
      }
    );

    activeAnimations = [...playerAnimations, ballAnimation];
    await Promise.all(activeAnimations.map(animation => animation.finished.catch(() => {})));
  }

  elements.court.addEventListener("pointerdown", event => {
    if (!editMode || playing) return;
    event.preventDefault();

    const playerElement = event.target.closest("[data-id]");
    const ballElement = event.target.closest("#ball");
    const moveMode = elements.moveMode.value;

    if (moveMode === "tap") {
      if (playerElement) {
        selectedObject = { type: "player", id: playerElement.dataset.id };
        elements.tapNotice.classList.remove("hidden");
        renderAll();
        return;
      }

      if (ballElement) {
        selectedObject = { type: "ball" };
        elements.tapNotice.classList.remove("hidden");
        renderAll();
        return;
      }

      if (selectedObject) {
        const target = eventPoint(event);

        if (selectedObject.type === "player") {
          currentStep().positions[selectedObject.id] = clampPlayer(target);
        } else {
          currentStep().ball.position = clampBall(target);
        }

        selectedObject = null;
        elements.tapNotice.classList.add("hidden");
        renderAll();
      }
      return;
    }

    if (playerElement) {
      draggingObject = { type: "player", id: playerElement.dataset.id };
      elements.court.setPointerCapture(event.pointerId);
      return;
    }

    if (ballElement) {
      draggingObject = { type: "ball" };
      elements.court.setPointerCapture(event.pointerId);
    }
  }, { passive: false });

  elements.court.addEventListener("pointermove", event => {
    if (!draggingObject || !editMode || playing) return;
    event.preventDefault();

    const target = eventPoint(event);

    if (draggingObject.type === "player") {
      currentStep().positions[draggingObject.id] = clampPlayer(target);
    } else {
      currentStep().ball.position = clampBall(target);
    }

    renderAll();
  }, { passive: false });

  elements.court.addEventListener("pointerup", () => { draggingObject = null; });
  elements.court.addEventListener("pointercancel", () => { draggingObject = null; });

  elements.toggleMode.addEventListener("click", () => setMode(!editMode));
  elements.infoButton.addEventListener("click", openVersionDialog);
  elements.closeVersionDialog.addEventListener("click", closeVersionDialog);
  elements.closeVersionDialogBottom.addEventListener("click", closeVersionDialog);

  elements.versionDialog.addEventListener("click", event => {
    if (event.target === elements.versionDialog) closeVersionDialog();
  });

  elements.rotationSelect.addEventListener("change", event => {
    stopPlayback();
    state.rotationIndex = Number(event.target.value);
    state.stepIndex = 0;
    renderAll();
  });

  elements.prevStep.addEventListener("click", async () => {
    await switchStepAnimated(state.stepIndex - 1);
  });

  elements.nextStep.addEventListener("click", async () => {
    await switchStepAnimated(state.stepIndex + 1);
  });

  elements.saveStep.addEventListener("click", () => {
    currentStep().name =
      elements.stepNameInput.value.trim() || `Schritt ${state.stepIndex + 1}`;
    currentStep().situation = elements.situationSelect.value;
    persist("Schritt wurde gespeichert.");
    renderAll();
  });

  elements.situationSelect.addEventListener("change", event => {
    currentStep().situation = event.target.value;
    renderPlayers();
  });

  elements.addStep.addEventListener("click", () => {
    currentStep().name =
      elements.stepNameInput.value.trim() || `Schritt ${state.stepIndex + 1}`;
    currentStep().situation = elements.situationSelect.value;

    const source = currentStep();
    currentRotation().steps.splice(state.stepIndex + 1, 0, {
      name: `Schritt ${state.stepIndex + 2}`,
      positions: structuredClone(source.positions),
      situation: source.situation,
      ball: structuredClone(source.ball)
    });

    state.stepIndex += 1;
    persist("Neuer Schritt wurde angelegt.");
    renderAll();
  });

  elements.deleteStep.addEventListener("click", () => {
    if (currentRotation().steps.length === 1) {
      elements.status.textContent = "Der einzige Schritt kann nicht gelöscht werden.";
      return;
    }

    currentRotation().steps.splice(state.stepIndex, 1);
    state.stepIndex = Math.max(0, state.stepIndex - 1);
    persist("Schritt wurde gelöscht.");
    renderAll();
  });

  elements.play.addEventListener("click", async () => {
    if (playing) {
      stopPlayback();
      elements.status.textContent = "Animation angehalten.";
      renderAll();
      return;
    }

    if (currentRotation().steps.length < 2) {
      elements.status.textContent = "Lege zunächst einen zweiten Schritt an.";
      return;
    }

    setMode(false);
    playing = true;
    elements.play.textContent = "⏸ Stoppen";

    let index =
      state.stepIndex >= currentRotation().steps.length - 1
        ? 0
        : state.stepIndex;

    while (playing && index < currentRotation().steps.length - 1) {
      state.stepIndex = index;
      updateUi();

      await animateTransition(
        currentRotation().steps[index],
        currentRotation().steps[index + 1]
      );

      if (!playing) break;

      state.stepIndex = index + 1;
      renderAll();
      index += 1;

      await new Promise(resolve => {
        playbackTimer = setTimeout(resolve, 350);
      });
    }

    stopPlayback();
    renderAll();
    elements.status.textContent = "Animation beendet.";
  });

  createPlayers();
  setMode(false);
  elements.status.textContent = `Version ${APP_VERSION.number} geladen.`;
})();

