// Background scene: the lab picture behind everything, portrait or landscape to match the screen,
// scaled to cover it. Runs first so it renders under the Game and UI scenes.

class BgScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Bg' });
  }

  preload() {
    this.load.image('bg_portrait', 'assets/ui/bg-portrait.jpg');
    this.load.image('bg_landscape', 'assets/ui/bg-landscape.jpg');
  }

  create() {
    this.img = this.add.image(0, 0, 'bg_portrait').setOrigin(0.5);
    this.dim = this.add.rectangle(0, 0, 10, 10, 0x0b0818, 0.25).setOrigin(0, 0);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
    this.layout();
  }

  layout() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setSize(W, H);
    const key = H > W ? 'bg_portrait' : 'bg_landscape';
    if (!this.textures.exists(key)) return;
    this.img.setTexture(key);
    const s = Math.max(W / this.img.width, H / this.img.height);
    this.img.setScale(s).setPosition(W / 2, H / 2);
    this.dim.setSize(W, H);
  }
}
