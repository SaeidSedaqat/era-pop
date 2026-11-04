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
    const s = EraStorage.getAudio();
    this.musicOn = s.music;
    this.sfxOn = s.sfx;
  },

  play(key, cfg) {
    if (!this.sfxOn || !this.sound || !this.cache.exists('sfx_' + key)) return;
    const A = window.ERA_POP_CONFIG.audio;
    const vol = (A.sfxVolume[key] !== undefined ? A.sfxVolume[key] : A.sfxVolume.default);
    this.sound.play('sfx_' + key, Object.assign({ volume: vol }, cfg));
  },

  // Starts (or resumes) the background loop; waits for the browser's first tap if audio is still locked.
  startMusic() {
    if (!this.musicOn || !this.sound || !this.cache.exists('music')) return;
    if (!this.music) this.music = this.sound.add('music', { loop: true, volume: window.ERA_POP_CONFIG.audio.musicVolume });
    const go = () => {
      if (!this.musicOn) return;
      if (this.music.isPaused) this.music.resume();
      else if (!this.music.isPlaying) this.music.play();
    };
    if (this.sound.locked) this.sound.once('unlocked', go);
    else go();
  },

  pauseMusic() {
    if (this.music && this.music.isPlaying) this.music.pause();
  },

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.startMusic();
    else this.pauseMusic();
    this.save();
  },

  toggleSfx() {
    this.sfxOn = !this.sfxOn;
    this.save();
  },

  save() {
    EraStorage.setAudio({ music: this.musicOn, sfx: this.sfxOn });
  },
};
