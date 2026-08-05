function drawLine(layer, from, to, className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", to.x);
  line.setAttribute("y2", to.y);
  line.setAttribute("class", className);
  layer.appendChild(line);
}

export class AnimationController {
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

  async playTransition(fromStep, toStep, durations = { ball: 1050, players: 1700 }) {
    this.playing = true;
    this.movementLayer.innerHTML = "";
    this.ballPathLayer.innerHTML = "";

    for (const player of this.roster) {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];
      if (from.x !== to.x || from.y !== to.y) {
        drawLine(this.movementLayer, from, to, "movement-path");
      }
    }

    const ballData = fromStep.ball;
    drawLine(this.ballPathLayer, ballData.start, ballData.contact, "ball-path");
    this.ball.setAttribute("visibility", "visible");
    this.ball.setAttribute("transform", `translate(${ballData.start.x} ${ballData.start.y})`);

    const phaseOne = this.ball.animate(
      [
        { transform: `translate(${ballData.start.x}px, ${ballData.start.y}px)` },
        { transform: `translate(${ballData.contact.x}px, ${ballData.contact.y}px)` }
      ],
      { duration: durations.ball, easing: "ease-in-out", fill: "forwards" }
    );

    this.active = [phaseOne];
    await phaseOne.finished.catch(() => {});
    if (!this.playing) return false;

    this.ballPathLayer.innerHTML = "";
    drawLine(this.ballPathLayer, ballData.contact, ballData.end, "ball-path");

    const playerAnimations = this.roster.map(player => {
      const from = fromStep.positions[player.id];
      const to = toStep.positions[player.id];
      const element = this.playerLayer.querySelector(`[data-id="${player.id}"]`);

      return element.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px)` },
          { transform: `translate(${to.x}px, ${to.y}px)` }
        ],
        { duration: durations.players, easing: "ease-in-out", fill: "forwards" }
      );
    });

    const phaseTwo = this.ball.animate(
      [
        { transform: `translate(${ballData.contact.x}px, ${ballData.contact.y}px)` },
        { transform: `translate(${ballData.end.x}px, ${ballData.end.y}px)` }
      ],
      { duration: durations.players, easing: "ease-in-out", fill: "forwards" }
    );

    this.active = [...playerAnimations, phaseTwo];
    await Promise.all(this.active.map(animation => animation.finished.catch(() => {})));
    return this.playing;
  }
}
