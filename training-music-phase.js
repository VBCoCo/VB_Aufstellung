(() => {
  "use strict";

  const internals = window.VBTrainingPlayerInternals;
  const controller = window.VBTrainingPlayer;
  if (!internals || !controller) return;

  const LibraryMusicEngine = internals.LibraryMusicEngine;
  if (LibraryMusicEngine && !LibraryMusicEngine.prototype.__phaseLifecyclePatched) {
    const originalSetConfig = LibraryMusicEngine.prototype.setConfig;
    const originalOnEnded = LibraryMusicEngine.prototype.onEnded;

    LibraryMusicEngine.prototype.setConfig = function setConfigWithoutInterruptingCurrentTrack(config) {
      if (!this.active || !this.currentTrackId) return originalSetConfig.call(this, config);

      const previousSelection = this.config.libraryTrackId;
      const previousBpm = this.config.bpm;
      const previousTolerance = this.config.tempoTolerance;

      this.config = {...this.config, ...config, source:"library"};
      this.runtime.setVolume(this.config.volume);

      const nextTrackRulesChanged = previousSelection !== this.config.libraryTrackId ||
        previousBpm !== this.config.bpm ||
        previousTolerance !== this.config.tempoTolerance;

      if (nextTrackRulesChanged) this._refreshQueueAfterCurrentTrack = true;
    };

    LibraryMusicEngine.prototype.onEnded = async function onEndedWithPendingPhaseConfig() {
      if (!this.active) return;
      if (!this._refreshQueueAfterCurrentTrack) return originalOnEnded.call(this);

      this._refreshQueueAfterCurrentTrack = false;
      this.trackQueue = [];
      this.trackIndex = 0;
      this.currentTrackId = "";
      try {
        await this.selectTrack(0);
        await this.audio.play();
      } catch (error) {
        console.warn("Kein passender Titel fuer die neue Trainingsphase.", error);
      }
    };

    LibraryMusicEngine.prototype.__phaseLifecyclePatched = true;
  }

  controller._musicPhaseIndex = null;
  controller.onSegmentStart = function onSegmentStartWithPhaseScopedMusic(segment) {
    const nextPhaseIndex = segment?.phaseIndex ?? null;
    if (this._musicPhaseIndex !== nextPhaseIndex) {
      this._musicPhaseIndex = nextPhaseIndex;
      this.music.setConfig(segment?.music || this.current.music);
    }

    this.cues.configure(this.current.options);
    this.cues.setTempo((segment?.music || this.current.music).bpm);
    if (!segment?.silentStart) this.cues.announce(segment?.label, segment);
  };

  // Diagnostic only: observe the library Audio element without changing playback.
  // Inspect with window.VBTrainingAudioDiagnostics.snapshot() from Safari Web Inspector.
  const installDiagnostics = () => {
    const music = controller.music;
    const audio = music?.audio;
    if (!audio || audio.__vbDiagnosticsInstalled) return;
    audio.__vbDiagnosticsInstalled = true;

    const entries = [];
    const startedAt = performance.now();
    const record = (event, extra = {}) => {
      const item = {
        wallSeconds: Number(((performance.now() - startedAt) / 1000).toFixed(3)),
        event,
        currentTime: Number((audio.currentTime || 0).toFixed(3)),
        playbackRate: audio.playbackRate,
        defaultPlaybackRate: audio.defaultPlaybackRate,
        paused: audio.paused,
        ended: audio.ended,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.currentSrc || audio.src || "",
        trackId: music.currentTrackId || "",
        phaseIndex: controller._musicPhaseIndex,
        ...extra
      };
      entries.push(item);
      if (entries.length > 1000) entries.shift();
      console.log("[VB audio diag]", item);
    };

    ["play", "playing", "pause", "ratechange", "seeking", "seeked", "waiting", "stalled", "suspend", "emptied", "loadedmetadata", "canplay", "ended", "error"].forEach(event => {
      audio.addEventListener(event, () => record(event));
    });

    let previous = null;
    const timer = window.setInterval(() => {
      if (!music.active && audio.paused) return;
      const current = {
        currentTime: Number((audio.currentTime || 0).toFixed(3)),
        playbackRate: audio.playbackRate,
        paused: audio.paused,
        src: audio.currentSrc || audio.src || "",
        trackId: music.currentTrackId || "",
        phaseIndex: controller._musicPhaseIndex
      };
      if (!previous || current.playbackRate !== previous.playbackRate || current.paused !== previous.paused || current.src !== previous.src || current.trackId !== previous.trackId || current.phaseIndex !== previous.phaseIndex) {
        record("state-change", {previous});
      }
      previous = current;
    }, 250);

    window.VBTrainingAudioDiagnostics = {
      snapshot: () => entries.slice(),
      clear: () => { entries.length = 0; record("cleared"); },
      stop: () => window.clearInterval(timer)
    };
    record("diagnostics-installed");
  };

  installDiagnostics();
})();
