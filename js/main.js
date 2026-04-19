// main.js - Phaser bootstrap
(function () {
  const CFG = window.CONFIG;

  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0a0e1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CFG.DESIGN_WIDTH,
      height: CFG.DESIGN_HEIGHT,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    scene: [
      window.BootScene,
      window.PreloadScene,
      window.MainMenuScene,
      window.GameScene,
      window.HUDScene,
      window.GameOverScene,
      window.SettingsScene,
    ],
    fps: { target: 60, forceSetTimeOut: false },
    input: { activePointers: 3 },
  };

  new Phaser.Game(config);
})();
