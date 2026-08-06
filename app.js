import {
  ROSTER,
  rotatedPosition,
  rotationName,
  makeInitialState
} from "./rotation.js";
import { validateAndRender } from "./validation.js";
import { AnimationController } from "./animation.js";
import { loadState, saveState } from "./storage.js";

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
  editTargetRow: document.querySelector("#editTargetRow"),
  editTarget: document.querySelector("#editTarget"),
  prevStep: document.querySelector("#prevStep"),
  play: document.querySelector("#play"),
  nextStep: document.querySelector("#nextStep"),
  saveStep: document.querySelector("#saveStep"),
  addStep: document.querySelector("#addStep"),
  deleteStep: document.querySelector("#deleteStep"),
  editControls: document.querySelector("#editControls"),
  playerControls: document.querySelector("#playerControls"),
  moveMode: document.querySelector("#moveMode"),
  ballControls: document.querySelector("#ballControls"),
  ballPointMode: document.querySelector("#ballPointMode"),
  situationSelect: document.querySelector("#situationSelect"),
  court: document.querySelector("#court"),
  validationLayer: document.querySelector("#validationLayer"),
  movementLayer: document.querySelector("#movementLayer"),
  ballPathLayer: document.querySelector("#ballPathLayer"),
  playerLayer: document.querySelector("#playerLayer"),
  ball: document.querySelector("#ball"),
  tapNotice: document.querySelector("#tapNotice"),
  status: document.querySelector("#status")
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
let selectedPlayerId = null;
let draggingPlayerId = null;

const animator = new AnimationController({
  playerLayer: elements.playerLayer,
  movementLayer: elements.movementLayer,
  ballPathLayer: elements.ballPathLayer,
  ball: elements.ball,
  roster: ROSTER
});

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

function renderValidation() {
  if (currentStep().situation !== "serveReceive") {
    elements.validationLayer.innerHTML = "";
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
    group.classList.toggle("selected", selectedPlayerId === player.id);

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

  if (!editMode) {
    elements.ball.setAttribute("visibility", "hidden");
    return;
  }

  const ballData = currentStep().ball;
  drawLine(elements.ballPathLayer, ballData.start, ballData.contact, "ball-path");
  drawLine(elements.ballPathLayer, ballData.contact, ballData.end, "ball-path");

  for (const point of [ballData.start, ballData.contact, ballData.end]) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    marker.setAttribute("cx", point.x);
    marker.setAttribute("cy", point.y);
    marker.setAttribute("r", "8");
    marker.setAttribute("class", "ball-point");
    elements.ballPathLayer.appendChild(marker);
  }

  elements.ball.setAttribute("transform", `translate(${ballData.start.x} ${ballData.start.y})`);
  elements.ball.setAttribute("visibility", "visible");
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
  selectedPlayerId = null;
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
    elements.editTargetRow,
    elements.editControls,
    elements.saveStep,
    elements.addStep,
    elements.deleteStep
  ]) {
    element.classList.toggle("hidden", !editMode);
  }

  updateEditTargetUi();
  renderAll();
}

function updateEditTargetUi() {
  const ballMode = elements.editTarget.value === "ball";
  elements.playerControls.classList.toggle("hidden", ballMode);
  elements.ballControls.classList.toggle("hidden", !ballMode);
  selectedPlayerId = null;
  elements.tapNotice.classList.add("hidden");
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

  if (elements.editTarget.value === "ball") {
    const key = elements.ballPointMode.value;
    currentStep().ball[key] = clampBall(eventPoint(event));
    renderBallEditor();
    elements.status.textContent = "Ballpunkt wurde gesetzt.";
    return;
  }

  const playerElement = event.target.closest("[data-id]");
  const moveMode = elements.moveMode.value;

  if (moveMode === "tap") {
    if (playerElement) {
      selectedPlayerId = playerElement.dataset.id;
      elements.tapNotice.classList.remove("hidden");
      renderPlayers();
      return;
    }

    if (selectedPlayerId) {
      currentStep().positions[selectedPlayerId] = clampPlayer(eventPoint(event));
      selectedPlayerId = null;
      elements.tapNotice.classList.add("hidden");
      renderPlayers();
    }
    return;
  }

  if (!playerElement) return;
  draggingPlayerId = playerElement.dataset.id;
  elements.court.setPointerCapture(event.pointerId);
}, { passive: false });

elements.court.addEventListener("pointermove", event => {
  if (!draggingPlayerId || !editMode || animator.playing) return;
  event.preventDefault();
  currentStep().positions[draggingPlayerId] = clampPlayer(eventPoint(event));
  renderPlayers();
}, { passive: false });

elements.court.addEventListener("pointerup", () => { draggingPlayerId = null; });
elements.court.addEventListener("pointercancel", () => { draggingPlayerId = null; });

elements.toggleMode.addEventListener("click", () => {
  animator.stop();
  setMode(!editMode);
});

elements.editTarget.addEventListener("change", () => {
  updateEditTargetUi();
  renderAll();
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

createPlayers();
setMode(false);
