(() => {
  "use strict";

  const controller = window.VBTrainingPlayer;
  const internals = window.VBTrainingPlayerInternals;
  if (!controller || !internals?.LibraryMusicEngine) return;

  const events = [];
  const startedAt = performance.now();
  const stamp = () => Math.round(performance.now() - startedAt) / 1000;
  const snapshot = (engine, extra = {}) => ({
    t: stamp(),
    track: engine?.currentTrackId || "",
    currentTime: Number(engine?.audio?.currentTime || 0).toFixed(3),
    playbackRate: engine?.audio?.playbackRate,
    defaultPlaybackRate: engine?.audio?.defaultPlaybackRate,
    paused: engine?.audio?.paused,
    ended: engine?.audio?.ended,
    src: engine?.audio?.currentSrc || engine?.audio?.src || "",
    phaseIndex: controller?._musicPhaseIndex,
    ...extra
  });
  const record = (engine, type, extra = {}) => {
    const row = snapshot(engine, {type, ...extra});
    events.push(row);
    console.info("[VB-AUDIO-DIAG]", row);
  };

  const proto = internals.LibraryMusicEngine.prototype;
  if (!proto.__audioDiagnosticsPatched) {
    ["setConfig", "selectTrack", "start", "pause", "stop", "onEnded"].forEach((name) => {
      const original = proto[name];
      if (typeof original !== "function") return;
      proto[name] = function (...args) {
        record(this, `${name}:before`, {args: name === "setConfig" ? args : undefined});
        const result = original.apply(this, args);
        if (result && typeof result.then === "function") {
          return result.then((value) => {
            record(this, `${name}:after`);
            return value;
          }, (error) => {
            record(this, `${name}:error`, {error: String(error)});
            throw error;
          });
        }
        record(this, `${name}:after`);
        return result;
      };
    });

    const originalCtorStart = proto.start;
    proto.start = async function (...args) {
      if (!this.__diagAudioBound && this.audio) {
        this.__diagAudioBound = true;
        ["play", "playing", "pause", "ratechange", "seeking", "seeked", "ended", "loadedmetadata", "durationchange", "waiting", "stalled", "suspend", "emptied", "canplay"].forEach((type) => {
          this.audio.addEventListener(type, () => record(this, `audio:${type}`));
        });
      }
      return originalCtorStart.apply(this, args);
    };

    proto.__audioDiagnosticsPatched = true;
  }

  const originalSegmentStart = controller.onSegmentStart;
  controller.onSegmentStart = function (segment) {
    record(this.music?.library || this.music, "segment:start", {
      segmentLabel: segment?.label,
      segmentType: segment?.type,
      segmentPhaseIndex: segment?.phaseIndex,
      segmentBpm: segment?.music?.bpm
    });
    return originalSegmentStart.call(this, segment);
  };

  window.VBTrainingAudioDiagnostics = {
    events,
    dump() { console.table(events); return events.slice(); },
    clear() { events.length = 0; }
  };

  console.info("[VB-AUDIO-DIAG] active; use VBTrainingAudioDiagnostics.dump() to inspect the trace.");
})();
