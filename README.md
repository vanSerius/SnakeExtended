# Snake 2026

Eine moderne Snake-Neuinterpretation, gebaut mit [Phaser 3](https://phaser.io/). Single-Page-Web-App, mobile-first, direkt aus diesem Repo via GitHub Pages publishbar.

## Features

- **3 Modi** — Classic (Wände töten), Endless (Wrap-Around + eskalierende Obstacles), Daily Challenge (tagesgleicher Seed)
- **Combo-System** — Äpfel in Folge essen → x2 / x3 / x4 Multiplier mit Zeitring
- **3 Power-ups** — Ghost (durch sich selbst), Slow-Mo (Zeitlupe), Magnet (Äpfel anziehen)
- **Boss-Food** — jeder 10. Apfel ist ein bewegliches Gold-Orb mit +500-Bonus
- **Liquid-Neon-Glass-Optik** — Bloom-Glow, Partikel-Trails, Camera-Shake, Shockwaves
- **Mobile-Controls** — Swipes in alle 4 Richtungen, Haptik-Feedback (Vibration)
- **Web-Audio-SFX** — komplett synthetisiert, keine Asset-Downloads
- **Persistenz** — Highscores + Settings via localStorage

## Lokal starten

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy auf GitHub Pages

1. Repo-Settings → Pages
2. Source: `main` Branch, Root-Folder
3. Öffnen unter `https://<user>.github.io/SnakeExtended/`

Alle Pfade sind relativ (`./js/...`), daher funktioniert der Subpfad-Deploy ohne Anpassungen.

## Struktur

```
index.html          # Entry mit Phaser-CDN und <script>-Tags
js/
  config.js         # Tunables, Farben, Grid-Maße
  main.js           # Phaser.Game-Init
  scenes/           # Boot, Preload, MainMenu, Game, HUD, GameOver, Settings
  systems/          # Snake, Food, PowerUps, Obstacles, Combo, Daily, Input, Audio, FX, Storage
```

## Steuerung

- **Touch**: Swipe in Richtung zum Abbiegen
- **Desktop**: Pfeiltasten oder WASD, Leertaste / ESC für Pause
