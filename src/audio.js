// Music and sound effects (files in assets/audio, all CC0 — see assets/audio/CREDITS.txt).
// Uses the game-wide Phaser sound manager, so sounds survive scene restarts.

window.EraAudio = {
  sfx: ['drop', 'merge', 'rocket', 'serve', 'timeout', 'wrong', 'click', 'newcard', 'storm', 'tick', 'reward', 'gameover'],
  music: null,
  sound: null,

  preload(scene) {
    for (const k of this.sfx) {
      if (!scene.cache.audio.exists('sfx_' + k)) scene.load.audio('sfx_' + k, 'assets/audio/' + k + '.mp3');
    }
    if (!scene.cache.audio.exists('music')) scene.load.audio('music', 'assets/audio/music.mp3');
  },

  init(scene) {
    this.sound = scene.sound;
    this.cache = scene.cache.audio;
    this.muted = EraStorage.getMuted();
    this.sound.mute = this.muted;
  },

  play(key, cfg) {
    if (!this.sound || !this.cache.exists('sfx_' + key)) return;
    const A = window.ERA_POP_CONFIG.audio;
    const vol = (A.sfxVolume[key] !== undefined ? A.sfxVolume[key] : A.sfxVolume.default);
    this.sound.play('sfx_' + key, Object.assign({ volume: vol }, cfg));
  },

  // Starts (or resumes) the background loop; waits for the browser's first tap if audio is still locked.
  startMusic() {
    if (!this.sound || !this.cache.exists('music')) return;
    if (!this.music) this.music = this.sound.add('music', { loop: true, volume: window.ERA_POP_CONFIG.audio.musicVolume });
    const go = () => {
      if (this.music.isPaused) this.music.resume();
      else if (!this.music.isPlaying) this.music.play();
    };
    if (this.sound.locked) this.sound.once('unlocked', go);
    else go();
  },

  pauseMusic() {
    if (this.music && this.music.isPlaying) this.music.pause();
  },

  isMuted() {
    return !!this.muted;
  },

  toggleMute() {
    if (!this.sound) return;
    // Phaser's mute getter reads the audio gain, which only updates on the next audio frame: keep our own flag.
    this.muted = !this.muted;
    this.sound.mute = this.muted;
    EraStorage.setMuted(this.muted);
  },
};
