// Boot.js - first scene, minimal
window.BootScene = class extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  create() {
    this.scene.start('Preload');
  }
};
