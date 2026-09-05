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
      // Deliberately do not pause, seek, replace the current track or alter playbackRate.
      // Phase changes only define the rules for the next title.
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
})();
