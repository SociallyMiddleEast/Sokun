# Sokun Wellness Center — website

Static website for **Sokun (سكون) Wellness Center, Bikfaya**. The cinematic intro is a real-time 3D scene (three.js): it starts on a Bikfaya street lined with stone houses and umbrella pines, goes up to the Sokun building, through the sliding doors and inside. Then the website opens, with the candle-lit interior still moving behind the hero section.

No build step and no external 3D files: it's plain HTML, CSS and JS, ready for GitHub Pages.

## Publish on GitHub Pages
1. Create a repository (for example `sokun-website`) and upload **everything in this folder** to the repo root.
2. Go to **Settings → Pages → Build and deployment**, set *Source: Deploy from a branch*, *Branch: `main` / root*, and save.
3. After about a minute the site is live at `https://<your-username>.github.io/sokun-website/`.
4. For a custom domain (for example `sokunwellness.com`), add it under Settings → Pages and point the domain's DNS to GitHub.

## Edit the content
Everything business-specific is in **`js/config.js`**:
- `instagram`, `whatsapp`, `phone`, `email`: anything you leave empty is hidden. Once `whatsapp` is set, every **Book** button opens WhatsApp with a pre-filled message.
- `address`, `mapQuery` (or exact `"lat,lng"` for the map pin), `hours`
- `treatments`: titles, Arabic names, descriptions, durations
- `gallery`: put photos in `assets/photos/` and set `image: 'assets/photos/xyz.jpg'`
- `playIntro: false` turns the intro off

Text such as the philosophy and ritual sections lives in `index.html`.

## Files
```
index.html            page structure
css/style.css         design
js/config.js          ← business details (edit me)
js/main.js            intro timing, captions, site behaviour
js/scene.js           the 3D street → building → interior scene
js/vendor/            three.js r170 (bundled locally, MIT)
assets/favicon.svg
```

## Notes
- Visitors can skip the intro (button, Esc or Enter), and the footer has a **Replay the walk in** button.
- Visitors whose system is set to reduce motion skip the walk and land straight inside.
- If a device can't run WebGL, the site loads directly without the intro.
- On phones the scene automatically uses fewer trees and lighter shadows.
- To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000. ES modules don't load from `file://`.
