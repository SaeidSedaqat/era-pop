// Boot: full-window canvas rendered at device resolution (capped), re-laid out on every resize/rotation.

(function () {
  // Wait (briefly) for the fonts so canvas text never renders in a fallback font.
  const fontsReady = document.fonts
    ? Promise.race([
      Promise.all([document.fonts.load("900 20px Orbitron"), document.fonts.load("700 20px 'Exo 2'")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).catch(() => {})
    : Promise.resolve();
  fontsReady.then(start);

  function start() {
    const C = window.ERA_POP_CONFIG;
    const DPR = Math.min(window.devicePixelRatio || 1, C.display.maxPixelRatio);
    window.ERA_DPR = DPR;

    const size = () => ({
      w: Math.max(1, Math.round(window.innerWidth * DPR)),
      h: Math.max(1, Math.round(window.innerHeight * DPR)),
    });
    const s = size();

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: '#241b3d',
      scale: {
        mode: Phaser.Scale.NONE,
        width: s.w,
        height: s.h,
        zoom: 1 / DPR,
      },
      physics: {
        default: 'matter',
        matter: { gravity: { x: 0, y: C.physics.gravityY }, enableSleeping: false, debug: false },
      },
      input: { activePointers: 2 },
      scene: [BgScene, GameScene, UIScene],
    });

    let pending = null;
    const onResize = () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        const n = size();
        if (n.w !== game.scale.width || n.h !== game.scale.height) game.scale.resize(n.w, n.h);
      }, 60);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.ERA_GAME = game;
  }
})();
