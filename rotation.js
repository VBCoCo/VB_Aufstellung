export const BASE_SLOTS = {
  1: { x: 440, y: 625 },
  2: { x: 430, y: 455 },
  3: { x: 300, y: 455 },
  4: { x: 170, y: 455 },
  5: { x: 160, y: 625 },
  6: { x: 300, y: 625 }
};

export const ROSTER = [
  { id: "a1", role: "AA", name: "Außen 1", baseRotation: 1 },
  { id: "z1", role: "Z", name: "Zuspieler 1", baseRotation: 2 },
  { id: "m1", role: "MB", name: "Mitte 1", baseRotation: 3 },
  { id: "a2", role: "AA", name: "Außen 2", baseRotation: 4 },
  { id: "z2", role: "Z", name: "Zuspieler 2", baseRotation: 5 },
  { id: "m2", role: "MB", name: "Mitte 2", baseRotation: 6 }
];

export const DEFAULT_BALL = {
  start: { x: 445, y: 105 },
  contact: { x: 170, y: 620 },
  end: { x: 300, y: 315 }
};

export function rotatedPosition(position, steps) {
  let result = position;
  for (let index = 0; index < steps; index += 1) {
    result = result === 1 ? 6 : result - 1;
  }
  return result;
}

export function rotationName(index) {
  return index === 0 ? "Grundaufstellung" : `Rotation +${index}`;
}

export function makeInitialStep(rotationIndex) {
  const positions = {};
  for (const player of ROSTER) {
    const slot = rotatedPosition(player.baseRotation, rotationIndex);
    positions[player.id] = { ...BASE_SLOTS[slot] };
  }

  return {
    name: "Grundposition",
    positions,
    situation: "serveReceive",
    ball: structuredClone(DEFAULT_BALL)
  };
}

export function makeInitialState() {
  return {
    rotations: Array.from({ length: 6 }, (_, rotationIndex) => ({
      steps: [makeInitialStep(rotationIndex)]
    })),
    rotationIndex: 0,
    stepIndex: 0
  };
}
