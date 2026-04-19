// FX.js - haptics + visual flourishes helpers
window.FX = (() => {
  function vibrate(pattern) {
    if (!window.Storage.getSetting('haptics')) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  function flash(scene, color = 0xffffff, duration = 200, alpha = 0.35) {
    const cam = scene.cameras.main;
    cam.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false, null, null);
    // override default alpha isn't possible; we use a rect overlay instead
    const rect = scene.add.rectangle(
      cam.centerX, cam.centerY,
      cam.width, cam.height,
      color, alpha
    ).setScrollFactor(0).setDepth(9999);
    scene.tweens.add({
      targets: rect,
      alpha: 0,
      duration,
      onComplete: () => rect.destroy(),
    });
  }

  function shake(scene, duration = 180, intensity = 0.012) {
    scene.cameras.main.shake(duration, intensity);
  }

  function shockwave(scene, x, y, color = 0xffffff) {
    const ring = scene.add.circle(x, y, 6, color, 0);
    ring.setStrokeStyle(3, color, 1);
    ring.setDepth(50);
    scene.tweens.add({
      targets: ring,
      scale: 8,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  function floatText(scene, x, y, text, color = '#e2e8f0', size = 20) {
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
    }).setOrigin(0.5).setDepth(60);
    scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      scale: 1.2,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  return { vibrate, flash, shake, shockwave, floatText };
})();
