# Sokun Wellness Center — website

Static website for **Sokun (سكون) Wellness Center**: fitness, dance and a diet clinic on Bikfaya Main Street (Antelias–Bikfaya Rd), 1st floor above BLOM Bank.

The intro is a real-time 3D scene (three.js) modelled on the real street. It drives up the main street past shops, apartment blocks with balconies and rooftop water tanks, utility poles and wires, and parked cars. It crosses to face the white BLOM Bank building, rises past the bank fascia to the first floor and glides through the glass into the Sokun studio (mirrors, barre, mats, boxing bags, diet-clinic room). Then the website opens, with the studio still moving behind the hero section.

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
- `classes`: titles, Arabic names, descriptions, tags
- `introVideo`: if you film the real walk-in (street → building → stairs → studio) on a phone or drone, drop it in `assets/intro.mp4` and set `introVideo: 'assets/intro.mp4'`. It then plays instead of the 3D scene. Landscape, 15–25 s, under 15 MB, no sound needed
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
