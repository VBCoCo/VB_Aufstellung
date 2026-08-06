import {
  ROSTER,
  rotatedPosition,
  rotationName,
  makeInitialState
} from "./rotation.js";
import { validateAndRender } from "./validation.js";
import { loadState, saveState } from "./storage.js";

const APP_VERSION = {
  number: "1.5.0",
  date: "06.08.2026",
  changes: [
    "Die Auswahl zwischen Spieler verschieben und Ball verschieben wurde entfernt.",
    "Der Ball lässt sich jetzt genauso wie ein Spieler antippen oder ziehen.",
    "Antippen und Ziehen gelten gemeinsam für Spieler und Ball.",
    "Der ausgewählte Ball wird mit einem deutlichen orangefarbenen Ring markiert.",
    "Die Aufstellungsprüfung bleibt nur bei Aufschlag / Annahme aktiv."
  ]
};

const SITUATION_LABELS = {
  serveReceive: "Aufschlag / Annahme – Aufstellungsprüfung aktiv",
  attack: "Angriff – freie Aufstellung",
  defense: "Abwehr – freie Aufstellung",
  ownServe: "Eigener Aufschlag – freie Aufstellung"
};

class AnimationController {
  constructor({ playerLayer, movementLayer, ballPathLayer, ball, roster }) {
    this.playerLayer = playerLayer;
    this.movementLayer = movementLayer;
    this.ballPathLayer = ballPathLayer;
    this.ball = ball;
    this.roster = roster;
    this.active = [];
    this.timer = null;
    this.playing = false;
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timer);
    this.active.forEach(animation => animation.cancel());
    this.active = [];
    this.movementLayer.innerHTML = "";
    this.ballPathLayer.innerHTML = "";
    this.ball.setAttribute("visibility", "hidden");
  }

  drawLine(layer, from, to, className) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.setAttribute("class", className);
    layer.appendChild(line);
  }

  async playTransition(fromStep, toStep, duration = 1700) {
    this.playing = true;
    this.movementLayer.innerHTML = "";
    this.ballPathLayer.innerHTML = "";

    for (const player of this.roster) {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];

      if (from.x !== to.x || from.y !== to.y) {
        this.drawLine(this.movementLayer, from, to, "movement-path");
      }
    }

    const fromBall = fromStep.ball.position;
    const toBall = toStep.ball.position;

    if (fromBall.x !== toBall.x || fromBall.y !== toBall.y) {
      this.drawLine(this.ballPathLayer, fromBall, toBall, "ball-path");
    }

    this.ball.setAttribute("visibility", "visible");
    this.ball.setAttribute("transform", `translate(${fromBall.x} ${fromBall.y})`);

    const playerAnimations = this.roster.map(player => {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];
      const element = this.playerLayer.querySelector(`[data-id="${player.id}"]`);

      return element.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px)` },
          { transform: `translate(${to.x}px, ${to.y}px)` }
        ],
        { duration, easing: "ease-in-out", fill: "forwards" }
      );
    });

    const ballAnimation = this.ball.animate(
      [
        { transform: `translate(${fromBall.x}px, ${fromBall.y}px)` },
        { transform: `translate(${toBall.x}px, ${toBall.y}px)` }
      ],
      { duration, easing: "ease-in-out", fill: "forwards" }
    );

    this.active = [...playerAnimations, ballAnimation];
    await Promise.all(this.active.map(animation => animation.finished.catch(() => {})));
    return this.playing;
  }
}

const elements = {
  modeBanner: document.querySelector("#modeBanner"),
  modeTitle: document.querySelector("#modeTitle"),
  modeHint: document.querySelector("#modeHint"),
  toggleMode: document.querySelector("#toggleMode"),
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
  infoButton: document.querySelector("#infoButton"),
  versionDialog: document.querySelector("#versionDialog"),
  closeVersionDialog: document.querySelector("#closeVersionDialog"),
  closeVersionDialogBottom: document.querySelector("#closeVersionDialogBottom"),
  versionNumber: document.querySelector("#versionNumber"),
  versionDate: document.querySelector("#versionDate"),
  versionChanges: document.querySelector("#versionChanges"),
  currentSituationInfo: document.querySelector("#currentSituationInfo")
};

let state = loadState() ?? makeInitialState();

const VALID_SITUATIONS = new Set(["serveReceive", "attack", "defense", "ownServe"]);

function normalizeSituation(value) {
  if (VALID_SITUATIONS.has(value)) return value;
  if (value === "opponentAttack" || value === "freeBall") return "defense";
  if (value === "ownAttack") return "attack";
  return "serveReceive";
}

for (const rotation of state.rotations) {
  for (const step of rotation.steps) {
    step.situation = normalizeSituation(step.situation);
  }
}

let editMode = false;
let selectedObject = null;
let draggingObject = null;

const animator = new AnimationController({
  playerLayer: elements.playerLayer,
  movementLayer: elements.movementLayer,
  ballPathLayer: elements.ballPathLayer,
  ball: elements.ball,
  roster: ROSTER
});

function normalizeBallData() {
  for (const rotation of state.rotations) {
    for (const step of rotation.steps) {
      const legacy = step.ball ?? {};
      const position =
        legacy.position ??
        legacy.contact ??
        legacy.start ??
        { x: 300, y: 315 };

      step.ball = {
        position: { ...position }
      };
    }
  }
}

function normalizeSituations() {
  const mapping = {
    opponentAttack: "defense",
    freeBall: "defense",
    ownAttack: "attack",
    custom: "attack"
  };

  for (const rotation of state.rotations) {
    for (const step of rotation.steps) {
      step.situation = mapping[step.situation] ?? step.situation ?? "serveReceive";
    }
  }
}

normalizeBallData();
normalizeSituations();

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


function situationLabel(value) {
  return SITUATION_LABELS[value] ?? value;
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
    `${situationLabel(currentStep().situation)} · ${rotationName(state.rotationIndex)} · Schritt ${state.stepIndex + 1}`;

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

function renderValidation() {
  elements.validationLayer.innerHTML = "";

  if (currentStep().situation !== "serveReceive") {
    return new Set();
  }

  const positionsByRotation = rotationNumber => {
    const player = playerAtRotation(rotationNumber);
    return currentStep().positions[player.id];
  };

  const playerIdByRotation = rotationNumber => playerAtRotation(rotationNumber).id;

  return validateAndRender({
    layer: elements.validationLayer,
    positionsByRotation,
    playerIdByRotation,
    showWarnings: editMode
  });
}

function renderPlayers() {
  const invalidIds = renderValidation();

  for (const player of ROSTER) {
    const position = currentStep().positions[player.id];
    const group = elements.playerLayer.querySelector(`[data-id="${player.id}"]`);

    group.setAttribute("transform", `translate(${position.x} ${position.y})`);
    group.classList.toggle("editable", editMode);
    group.classList.toggle("selected", selectedObject?.type === "player" && selectedObject.id === player.id);

    const fill = invalidIds.has(player.id)
      ? "#dc2626"
      : editMode
        ? "#f59e0b"
        : "#2563eb";

    group.querySelector("circle").setAttribute("fill", fill);
    group.querySelector("[data-position-label]").textContent = `Position ${playerRotation(player)}`;
  }
}

function drawLine(layer, from, to, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", to.x);
  line.setAttribute("y2", to.y);
  line.setAttribute("class", className);
  layer.appendChild(line);
}

function renderBallEditor() {
  elements.ballPathLayer.innerHTML = "";

  const position = currentStep().ball.position;
  elements.ball.setAttribute("transform", `translate(${position.x} ${position.y})`);
  elements.ball.setAttribute("visibility", editMode ? "visible" : "hidden");
  elements.ball.classList.toggle("editable", editMode);
  elements.ball.classList.toggle(
    "selected",
    selectedObject?.type === "ball"
  );

  if (!editMode) return;

  const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  marker.setAttribute("cx", position.x);
  marker.setAttribute("cy", position.y);
  marker.setAttribute("r", "8");
  marker.setAttribute("class", "ball-point");
  elements.ballPathLayer.appendChild(marker);
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
  renderBallEditor();
}

function setMode(value) {
  editMode = value;
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
    ? "Schritte, Spieler und Ball direkt oberhalb des Feldes bearbeiten."
    : "Schritte ansehen und Animation abspielen.";
  elements.toggleMode.textContent = editMode ? "Bearbeitung beenden" : "Bearbeiten";
  elements.modeBadge.textContent = editMode ? "Bearbeitung" : "Ansicht";

  for (const element of [
    elements.stepNameRow,
    elements.editControls,
    elements.saveStep,
    elements.addStep,
    elements.deleteStep
  ]) {
    element.classList.toggle("hidden", !editMode);
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

function persist(message = "Gespeichert.") {
  saveState(state);
  elements.status.textContent = message;
}

function saveCurrentStep() {
  currentStep().name = elements.stepNameInput.value.trim() || `Schritt ${state.stepIndex + 1}`;
  currentStep().situation = elements.situationSelect.value;
  persist("Schritt und Ballflug wurden gespeichert.");
  renderAll();
}

elements.court.addEventListener("pointerdown", event => {
  if (!editMode || animator.playing) return;
  event.preventDefault();

  const playerElement = event.target.closest("[data-id]");
  const ballElement = event.target.closest("#ball");
  const moveMode = elements.moveMode.value;

  if (moveMode === "tap") {
    if (playerElement) {
      selectedObject = { type: "player", id: playerElement.dataset.id };
      elements.tapNotice.classList.remove("hidden");
      renderPlayers();
      renderBallEditor();
      return;
    }

    if (ballElement) {
      selectedObject = { type: "ball" };
      elements.tapNotice.classList.remove("hidden");
      renderPlayers();
      renderBallEditor();
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
      renderPlayers();
      renderBallEditor();
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
  if (!draggingObject || !editMode || animator.playing) return;
  event.preventDefault();

  const target = eventPoint(event);

  if (draggingObject.type === "player") {
    currentStep().positions[draggingObject.id] = clampPlayer(target);
  } else {
    currentStep().ball.position = clampBall(target);
  }

  renderPlayers();
  renderBallEditor();
}, { passive: false });

elements.court.addEventListener("pointerup", () => { draggingObject = null; });
elements.court.addEventListener("pointercancel", () => { draggingObject = null; });

elements.toggleMode.addEventListener("click", () => {
  animator.stop();
  setMode(!editMode);
});

});

elements.situationSelect.addEventListener("change", event => {
  currentStep().situation = event.target.value;
  renderAll();
  elements.status.textContent = currentStep().situation === "serveReceive"
    ? "Aufstellungsprüfung ist aktiv."
    : "Freie Aufstellung: In dieser Spielsituation wird die Stellung nicht geprüft.";
});

elements.rotationSelect.addEventListener("change", event => {
  animator.stop();
  state.rotationIndex = Number(event.target.value);
  state.stepIndex = 0;
  renderAll();
});

elements.prevStep.addEventListener("click", () => {
  animator.stop();
  state.stepIndex = Math.max(0, state.stepIndex - 1);
  renderAll();
});

elements.nextStep.addEventListener("click", () => {
  animator.stop();
  state.stepIndex = Math.min(currentRotation().steps.length - 1, state.stepIndex + 1);
  renderAll();
});

elements.saveStep.addEventListener("click", saveCurrentStep);

elements.addStep.addEventListener("click", () => {
  saveCurrentStep();
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
  if (animator.playing) {
    animator.stop();
    elements.play.textContent = "▶ Abspielen";
    elements.status.textContent = "Animation angehalten.";
    renderPlayers();
    return;
  }

  if (currentRotation().steps.length < 2) {
    elements.status.textContent = "Lege zunächst einen zweiten Schritt an.";
    return;
  }

  setMode(false);
  animator.playing = true;
  elements.play.textContent = "⏸ Stoppen";

  let index = state.stepIndex >= currentRotation().steps.length - 1 ? 0 : state.stepIndex;

  while (animator.playing && index < currentRotation().steps.length - 1) {
    state.stepIndex = index;
    updateUi();

    const finished = await animator.playTransition(
      currentRotation().steps[index],
      currentRotation().steps[index + 1]
    );

    if (!finished) break;

    state.stepIndex = index + 1;
    renderPlayers();
    updateUi();
    index += 1;

    await new Promise(resolve => {
      animator.timer = setTimeout(resolve, 350);
    });
  }

  animator.stop();
  elements.play.textContent = "▶ Abspielen";
  renderAll();
  elements.status.textContent = "Animation beendet.";
});


elements.infoButton.addEventListener("click", openVersionDialog);
elements.closeVersionDialog.addEventListener("click", closeVersionDialog);
elements.closeVersionDialogBottom.addEventListener("click", closeVersionDialog);

elements.versionDialog.addEventListener("click", event => {
  if (event.target === elements.versionDialog) {
    closeVersionDialog();
  }
});

createPlayers();
setMode(false);
