const CIRCLE_RADIUS = 36;
const WARNING_DISTANCE = 18;
const OWN_COURT_TOP = 382;
const OWN_COURT_BOTTOM = 724;
const COURT_LEFT = 66;
const COURT_RIGHT = 534;

function classifyLeftOf(requiredLeft, requiredRight) {
  const testedEdge = requiredLeft.x - CIRCLE_RADIUS;
  const referenceBoundary = requiredRight.x + CIRCLE_RADIUS;
  const remaining = referenceBoundary - testedEdge;

  if (remaining <= 0) {
    return { state: "invalid", boundary: referenceBoundary, testedEdge };
  }
  if (remaining <= WARNING_DISTANCE) {
    return { state: "warning", boundary: referenceBoundary, testedEdge };
  }
  return { state: "clear", boundary: referenceBoundary, testedEdge };
}

function classifyInFrontOf(requiredFront, requiredBack) {
  const testedEdge = requiredFront.y - CIRCLE_RADIUS;
  const referenceBoundary = requiredBack.y + CIRCLE_RADIUS;
  const remaining = referenceBoundary - testedEdge;

  if (remaining <= 0) {
    return { state: "invalid", boundary: referenceBoundary, testedEdge };
  }
  if (remaining <= WARNING_DISTANCE) {
    return { state: "warning", boundary: referenceBoundary, testedEdge };
  }
  return { state: "clear", boundary: referenceBoundary, testedEdge };
}

function drawSvgLine(layer, x1, y1, x2, y2, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("class", className);
  layer.appendChild(line);
}

export function validateAndRender({
  layer,
  positionsByRotation,
  playerIdByRotation,
  showWarnings = true
}) {
  layer.innerHTML = "";
  const invalidPlayerIds = new Set();

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
    const left = positionsByRotation(relation.left);
    const right = positionsByRotation(relation.right);
    const result = classifyLeftOf(left, right);

    if (result.state === "invalid" || (showWarnings && result.state === "warning")) {
      const className = result.state === "invalid" ? "validation-invalid" : "validation-warning";
      drawSvgLine(layer, result.boundary, OWN_COURT_TOP, result.boundary, OWN_COURT_BOTTOM, className);
    }

    if (result.state === "invalid") {
      invalidPlayerIds.add(playerIdByRotation(relation.left));
      invalidPlayerIds.add(playerIdByRotation(relation.right));
    }
  }

  for (const relation of vertical) {
    const front = positionsByRotation(relation.front);
    const back = positionsByRotation(relation.back);
    const result = classifyInFrontOf(front, back);

    if (result.state === "invalid" || (showWarnings && result.state === "warning")) {
      const className = result.state === "invalid" ? "validation-invalid" : "validation-warning";
      drawSvgLine(layer, COURT_LEFT, result.boundary, COURT_RIGHT, result.boundary, className);
    }

    if (result.state === "invalid") {
      invalidPlayerIds.add(playerIdByRotation(relation.front));
      invalidPlayerIds.add(playerIdByRotation(relation.back));
    }
  }

  return invalidPlayerIds;
}
