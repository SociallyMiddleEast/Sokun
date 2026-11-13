// Sokun — cinematic 3D walk-in: Bikfaya street → Sokun building → inside.
// Everything is generated in code (no models/videos), so it runs on GitHub Pages as-is.
import * as THREE from './vendor/three.module.min.js';

/* ---------------- utils ---------------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(1987);
const R = (a, b) => a + (b - a) * rand();
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) { let s = 0, a = .5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s; }
function shade(hex, amt) {
  const c = new THREE.Color(hex); const k = 1 + amt;
  return `rgb(${Math.min(255, c.r * 255 * k) | 0},${Math.min(255, c.g * 255 * k) | 0},${Math.min(255, c.b * 255 * k) | 0})`;
}
function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, repeat = false) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function archPath(g, x, y, w, h) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); }
function spacedText(g, text, x, y, spacing) {
  // draws centred text with manual letter spacing
  const widths = [...text].map(ch => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = x - total / 2; g.textAlign = 'left';
  [...text].forEach((ch, i) => { g.fillText(ch, cx, y); cx += widths[i] + spacing; });
}
// Box whose UVs are scaled to world size so tiled textures keep a constant scale
function uvBox(w, h, d, tile = 4) {
  const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
  return geo;
}

/* ---------------- procedural textures ---------------- */
function stoneCanvas(base, vary, mortar, rows = 8, size = 512) {
  const c = canvas(size), g = c.getContext('2d');
  g.fillStyle = mortar; g.fillRect(0, 0, size, size);
  const rh = size / rows;
  for (let r = 0; r < rows; r++) {
    let x = -R(0, rh * 1.5);
    while (x < size) { const w = R(rh * 1.2, rh * 2.6); g.fillStyle = shade(base, R(-vary, vary)); g.fillRect(x + 2, r * rh + 2, w - 4, rh - 4); x += w; }
  }
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${rand() < .5 ? '0,0,0' : '255,255,255'},${R(0, .07)})`; g.fillRect(R(0, size), R(0, size), 2, 2); }
  return c;
}
function glowTexture() {
  const c = canvas(128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c);
}
function archGlowTexture() {
  const c = canvas(128, 256), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 230, 4, 64, 170, 190);
  gr.addColorStop(0, '#fff3d6'); gr.addColorStop(.35, '#f2b46a'); gr.addColorStop(1, '#6b3518');
  archPath(g, 4, 4, 120, 248); g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(60,35,20,.55)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(64, 10); g.lineTo(64, 252); g.moveTo(4, 150); g.lineTo(124, 150); g.stroke();
  return tex(c);
}
// Traditional Lebanese house facade: triple arch upstairs, arched door, shuttered windows
function facadeTextures(shutter, litLevel) {
  const S = 512; const c = stoneCanvas('#e4cfa4', .06, '#cbb38a', 11, S); const g = c.getContext('2d');
  const e = canvas(S), ge = e.getContext('2d'); ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  const glass = '#2b2f31', warm = '#ffcd85';
  const win = (fn, lit) => { g.fillStyle = lit ? warm : glass; fn(g); g.fill(); if (lit) { ge.fillStyle = warm; fn(ge); ge.fill(); } };
  g.fillStyle = '#d4ba8c'; g.fillRect(0, S * .5 - 4, S, 12); // string course
  // triple arch
  const tw = 60, th = 168, gap = 16, total = tw * 3 + gap * 2, x0 = (S - total) / 2, y0 = 52;
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * (tw + gap);
    g.fillStyle = '#f2e5c9'; archPath(g, x - 7, y0 - 7, tw + 14, th + 10); g.fill();
    win(ctx => archPath(ctx, x, y0, tw, th), rand() < litLevel);
    g.strokeStyle = '#f2e5c9'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + tw / 2, y0 + 6); g.lineTo(x + tw / 2, y0 + th); g.moveTo(x, y0 + th * .55); g.lineTo(x + tw, y0 + th * .55); g.stroke();
  }
  g.fillStyle = '#c6ad80'; g.fillRect(x0 - 22, y0 + th + 2, total + 44, 9);
  g.strokeStyle = '#3e3a33'; g.lineWidth = 2; for (let x = x0 - 18; x < x0 + total + 22; x += 9) { g.beginPath(); g.moveTo(x, y0 + th - 30); g.lineTo(x, y0 + th + 2); g.stroke(); }
  g.fillRect(x0 - 22, y0 + th - 32, total + 44, 3);
  // side windows (upper + lower) with shutters
  const sideWin = (x, y, w, h) => {
    g.fillStyle = '#f2e5c9'; g.fillRect(x - 6, y - 6, w + 12, h + 12);
    win(ctx => { ctx.beginPath(); ctx.rect(x, y, w, h); }, rand() < litLevel);
    g.fillStyle = shutter; g.fillRect(x - 6 - w * .45, y, w * .45, h); g.fillRect(x + w + 6, y, w * .45, h);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (let k = y + 8; k < y + h; k += 9) { g.beginPath(); g.moveTo(x - 6 - w * .45, k); g.lineTo(x - 6, k); g.moveTo(x + w + 6, k); g.lineTo(x + w + 6 + w * .45, k); g.stroke(); }
  };
  sideWin(40, 92, 42, 104); sideWin(S - 82, 92, 42, 104);
  sideWin(64, 330, 50, 96); sideWin(S - 114, 330, 50, 96);
  // arched wooden door
  g.fillStyle = '#f2e5c9'; archPath(g, S / 2 - 50, 340, 100, 172); g.fill();
  g.fillStyle = '#6a4529'; archPath(g, S / 2 - 42, 348, 84, 164); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(S / 2, 350); g.lineTo(S / 2, 512); g.stroke();
  return { map: tex(c), emissive: tex(e) };
}
function sideTextures(shutter, litLevel) {
  const S = 512; const c = stoneCanvas('#e1cba0', .06, '#c8b087', 11, S); const g = c.getContext('2d');
  const e = canvas(S), ge = e.getContext('2d'); ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  [[S / 2 - 26, 100], [S / 2 - 26, 340]].forEach(([x, y]) => {
    const lit = rand() < litLevel; g.fillStyle = '#f2e5c9'; g.fillRect(x - 6, y - 6, 64, 110);
    g.fillStyle = lit ? '#ffcd85' : '#2b2f31'; g.fillRect(x, y, 52, 98); if (lit) { ge.fillStyle = '#ffcd85'; ge.fillRect(x, y, 52, 98); }
    g.fillStyle = shutter; g.fillRect(x - 30, y, 24, 98); g.fillRect(x + 58, y, 24, 98);
  });
  g.fillStyle = '#d4ba8c'; g.fillRect(0, S * .5 - 4, S, 12);
  return { map: tex(c), emissive: tex(e) };
}
function roadSignTexture() {
  const c = canvas(512, 256), g = c.getContext('2d');
  g.fillStyle = '#1f4f8f'; g.beginPath(); g.roundRect(6, 6, 500, 244, 22); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.roundRect(20, 20, 472, 216, 14); g.stroke();
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '700 92px Amiri, serif'; g.fillText('بكفيا', 256, 122);
  g.font = '600 50px Manrope, sans-serif'; spacedText(g, 'BIKFAYA', 256, 200, 10);
  return tex(c);
}
function sokunSignTexture() {
  const c = canvas(1024, 320), g = c.getContext('2d');
  g.fillStyle = '#ffd9a0'; g.shadowColor = 'rgba(255,190,110,.9)'; g.shadowBlur = 18;
  g.textAlign = 'center';
  g.font = '400 150px Amiri, serif'; g.fillText('سكون', 270, 200);
  g.fillRect(470, 70, 3, 180);
  g.font = '600 104px Manrope, sans-serif'; spacedText(g, 'SOKUN', 745, 175, 26);
  g.font = '500 30px Manrope, sans-serif'; spacedText(g, 'WELLNESS CENTER', 745, 240, 12);
  return tex(c);
}
function featureTextTexture() {
  const c = canvas(1024, 512), g = c.getContext('2d');
  g.textAlign = 'center'; g.fillStyle = '#ffe2b0'; g.shadowColor = 'rgba(255,170,80,1)'; g.shadowBlur = 40;
  g.font = '400 300px Amiri, serif'; g.fillText('سكون', 512, 330);
  g.shadowBlur = 10; g.font = '500 44px Manrope, sans-serif'; spacedText(g, 'STILLNESS', 512, 440, 22);
  return tex(c);
}
function paverTexture() {
  const c = canvas(512), g = c.getContext('2d');
  g.fillStyle = '#a99779'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? -64 : 0; x < 512; x += 128) { g.fillStyle = shade('#cfbd9d', R(-.07, .07)); g.fillRect(x + 3, y + 3, 122, 58); }
  return tex(c, true);
}
function woodTexture() {
  const c = canvas(512), g = c.getContext('2d');
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = shade('#9a6c45', R(-.12, .1)); g.fillRect(x, 0, 32, 512);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(60,35,15,${R(.05, .18)})`; g.beginPath(); const xx = x + R(3, 29); g.moveTo(xx, 0); g.bezierCurveTo(xx + R(-4, 4), 170, xx + R(-4, 4), 340, xx, 512); g.stroke(); }
    g.fillStyle = 'rgba(40,20,8,.5)'; g.fillRect(x, 0, 1.5, 512);
    g.fillRect(x, R(0, 512), 32, 1.5);
  }
  return tex(c, true);
}

/* ---------------- sky ---------------- */
function skyMaterial(sunDir) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color('#3d5687') }, uMid: { value: new THREE.Color('#e7a989') },
      uHorizon: { value: new THREE.Color('#ffd9a6') }, uGround: { value: new THREE.Color('#c9a98a') },
      uSun: { value: sunDir.clone() },
    },
    vertexShader: `varying vec3 vDir; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uTop,uMid,uHorizon,uGround,uSun; varying vec3 vDir;
      void main(){ vec3 d=normalize(vDir); float h=d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0,0.16,h));
        col = mix(col, uTop, smoothstep(0.12,0.7,h));
        col = mix(uGround, col, smoothstep(-0.05,0.0,h));
        float s=max(dot(d,normalize(uSun)),0.0);
        col += vec3(1.0,0.72,0.42)*pow(s,6.0)*0.5 + vec3(1.0,0.92,0.75)*pow(s,600.0)*3.0;
        gl_FragColor=vec4(col,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/* ================================================================ */
export function createScene(canvasEl, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const FOG = new THREE.Color('#e3bf9c');
  scene.fog = new THREE.Fog(FOG, 70, 430);
  const camera = new THREE.PerspectiveCamera(mobile ? 62 : 52, window.innerWidth / window.innerHeight, .1, 1400);

  const sunDir = new THREE.Vector3(.75, .26, .42).normalize();

  // sky + environment lighting
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMaterial(sunDir));
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMaterial(sunDir)));
  scene.environment = pmrem.fromScene(envScene, .04).texture; scene.environmentIntensity = .35;

  const hemi = new THREE.HemisphereLight('#ffe3c2', '#4d5a3b', 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffc48a', 3.2);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 1, far: 320 });
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .4;
  scene.add(sun, sun.target);

  const glowTex = glowTexture();
  const glow = (color, size, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity, fog: true }));
    s.scale.setScalar(size); return s;
  };

  /* ---------- road ---------- */
  const ROAD = [[18, 172], [7, 140], [-9, 106], [-5, 72], [8, 38], [6, 6], [0, -24], [0, -56]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const road = new THREE.CatmullRomCurve3(ROAD, false, 'centripetal');
  const roadSamples = road.getSpacedPoints(300);
  const distToRoad = (x, z) => { let m = Infinity; for (const p of roadSamples) { const dx = p.x - x, dz = p.z - z, d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  const BZ = { x0: -36, x1: 36, z0: -116, z1: -44 }; // building zone
  const distToBZ = (x, z) => { const dx = Math.max(BZ.x0 - x, 0, x - BZ.x1), dz = Math.max(BZ.z0 - z, 0, z - BZ.z1); return Math.hypot(dx, dz); };
  const heightAt = (x, z, d = distToRoad(x, z)) => {
    const flat = Math.min(smooth(20, 62, d), smooth(2, 40, distToBZ(x, z)));
    return (fbm(x * .012 + 3, z * .012) * 26 - 7 + Math.min(Math.max(0, d - 30) * .16, 46)) * flat;
  };

  /* ---------- terrain ---------- */
  {
    const seg = mobile ? 90 : 130;
    const geo = new THREE.PlaneGeometry(760, 760, seg, seg); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -40);
    const pos = geo.attributes.pos || geo.attributes.position; const cols = [];
    const grass = new THREE.Color('#6d7a42'), dry = new THREE.Color('#9b9058'), dark = new THREE.Color('#465a31'), earth = new THREE.Color('#9c8462');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), d = distToRoad(x, z), h = heightAt(x, z, d);
      pos.setY(i, h);
      const n = fbm(x * .05, z * .05);
      c.copy(grass).lerp(dry, smooth(.45, .75, n)).lerp(dark, smooth(.5, .2, n) * .8);
      c.lerp(earth, smooth(14, 8, d) * .7);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    terrain.receiveShadow = true; scene.add(terrain);
  }

  /* ---------- distant mountain ridges ---------- */
  [[-330, '#9d93ad', 120, 70, 11], [-270, '#7d8492', 80, 60, 23], [-215, '#5f6c5a', 55, 40, 37]].forEach(([z, col, base, amp, seed]) => {
    const sh = new THREE.Shape(); sh.moveTo(-700, -40);
    for (let x = -700; x <= 700; x += 10) sh.lineTo(x, base + fbm(x * .006 + seed, seed) * amp * 2 - amp * .6 + Math.sin(x * .004 + seed) * amp * .3);
    sh.lineTo(700, -40); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col }));
    m.position.z = z; scene.add(m);
  });

  /* ---------- road surface, curbs, dashes, stone walls ---------- */
  function ribbon(a, b, y, mat, n = 260) {
    const pos = [], idx = [], nor = [], uv = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, p = road.getPointAt(u), t = road.getTangentAt(u), nx = -t.z, nz = t.x;
      pos.push(p.x + nx * a, y, p.z + nz * a, p.x + nx * b, y, p.z + nz * b); nor.push(0, 1, 0, 0, 1, 0); uv.push(0, u * 60, 1, u * 60);
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.material.side = THREE.DoubleSide; scene.add(m); return m;
  }
  ribbon(-3.8, 3.8, .06, new THREE.MeshStandardMaterial({ color: '#45423f', roughness: .92 }));
  const curbMat = new THREE.MeshStandardMaterial({ color: '#cbb995', roughness: 1 });
  ribbon(-5.4, -3.8, .16, curbMat); ribbon(3.8, 5.4, .16, curbMat);

  const L = road.getLength();
  const dummy = new THREE.Object3D();
  {
    const dashCount = Math.floor(L / 5);
    const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(.16, 2), new THREE.MeshStandardMaterial({ color: '#e9dcc0', roughness: .8 }), dashCount);
    for (let i = 0; i < dashCount; i++) {
      const u = i / dashCount, p = road.getPointAt(u), t = road.getTangentAt(u);
      dummy.position.set(p.x, .075, p.z); dummy.rotation.set(-Math.PI / 2, 0, -Math.atan2(t.x, t.z) + Math.PI); dummy.updateMatrix(); dashes.setMatrixAt(i, dummy.matrix);
    }
    dashes.receiveShadow = true; scene.add(dashes);

    // dry-stone walls (typical of Mount Lebanon terraces)
    const stoneTex = tex(stoneCanvas('#cdb791', .12, '#7d6b52', 6), true);
    const wallGeo = new THREE.BoxGeometry(2.3, 1, .7);
    const n = Math.floor(L / 2.3) * 2;
    const walls = new THREE.InstancedMesh(wallGeo, new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 1 }), n);
    let k = 0; const col = new THREE.Color();
    for (let i = 0; i < n / 2; i++) {
      const u = i / (n / 2); if (u > .975) continue;
      const p = road.getPointAt(u), t = road.getTangentAt(u), nx = -t.z, nz = t.x;
      for (const side of [-1, 1]) {
        if (rand() < .07) continue;
        const h = R(.85, 1.2);
        dummy.position.set(p.x + nx * 6.3 * side, h / 2, p.z + nz * 6.3 * side);
        dummy.rotation.set(0, Math.atan2(t.x, t.z), 0); dummy.scale.set(1, h, 1); dummy.updateMatrix();
        walls.setMatrixAt(k, dummy.matrix); walls.setColorAt(k, col.setHSL(.09, .2, R(.75, .95))); k++;
      }
    }
    walls.count = k; walls.castShadow = walls.receiveShadow = true; scene.add(walls);
  }

  /* ---------- street lamps ---------- */
  {
    const poleMat = new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: .6, metalness: .5 });
    const poleGeo = new THREE.CylinderGeometry(.07, .11, 5.2, 8); poleGeo.translate(0, 2.6, 0);
    const armGeo = new THREE.BoxGeometry(1.3, .07, .07);
    const headMat = new THREE.MeshBasicMaterial({ color: '#ffe0a8' });
    const headGeo = new THREE.BoxGeometry(.5, .14, .26);
    for (let i = 0; i < 15; i++) {
      const u = .025 + i * .062; if (u > .93) break;
      const side = i % 2 ? 1 : -1, p = road.getPointAt(u), t = road.getTangentAt(u), nx = -t.z, nz = t.x;
      const g = new THREE.Group(); g.position.set(p.x + nx * 5.4 * side, 0, p.z + nz * 5.4 * side);
      g.rotation.y = Math.atan2(-nx * side, -nz * side) - Math.PI / 2;
      const pole = new THREE.Mesh(poleGeo, poleMat); pole.castShadow = true;
      const arm = new THREE.Mesh(armGeo, poleMat); arm.position.set(.6, 5.15, 0);
      const head = new THREE.Mesh(headGeo, headMat); head.position.set(1.15, 5.05, 0);
      const gl = glow('#ffbf6e', 3.2, .8); gl.position.set(1.15, 4.95, 0);
      g.add(pole, arm, head, gl); scene.add(g);
    }
  }

  /* ---------- Bikfaya road sign ---------- */
  {
    const u = .045, p = road.getPointAt(u), t = road.getTangentAt(u), nx = -t.z, nz = t.x;
    const g = new THREE.Group(); g.position.set(p.x + nx * 4.9, 0, p.z + nz * 4.9);
    g.rotation.y = Math.atan2(-t.x, -t.z) + .35;
    const post = new THREE.MeshStandardMaterial({ color: '#8a8f94', metalness: .6, roughness: .4 });
    [-1.1, 1.1].forEach(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 8), post); m.position.set(x, 1.6, 0); m.castShadow = true; g.add(m); });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: roadSignTexture(), roughness: .5, side: THREE.DoubleSide }));
    plate.position.set(0, 2.6, .07); plate.castShadow = true; g.add(plate); scene.add(g);
  }

  /* ---------- traditional houses ---------- */
  const houses = [];
  {
    const variants = [
      { face: facadeTextures('#4f6b47', .55), side: sideTextures('#4f6b47', .4), roof: '#b0533a' },
      { face: facadeTextures('#47627f', .35), side: sideTextures('#47627f', .3), roof: '#a5492f' },
      { face: facadeTextures('#5d7350', .7), side: sideTextures('#5d7350', .5), roof: '#b85f42' },
    ];
    const mk = (v) => {
      const sideM = new THREE.MeshStandardMaterial({ map: v.side.map, emissiveMap: v.side.emissive, emissive: '#ffb765', emissiveIntensity: 1.4, roughness: .95 });
      const faceM = new THREE.MeshStandardMaterial({ map: v.face.map, emissiveMap: v.face.emissive, emissive: '#ffb765', emissiveIntensity: 1.4, roughness: .95 });
      const plain = new THREE.MeshStandardMaterial({ color: '#d9c39a', roughness: 1 });
      return [sideM, sideM, plain, plain, faceM, sideM];
    };
    const mats = variants.map(mk);
    const roofMats = variants.map(v => new THREE.MeshStandardMaterial({ color: v.roof, roughness: .85, flatShading: true }));
    const roofGeo = new THREE.ConeGeometry(1, 1, 4); roofGeo.rotateY(Math.PI / 4);
    const spots = [.03, .085, .14, .19, .25, .31, .36, .42, .48, .53, .6, .66, .72, .78];
    spots.forEach((u, i) => {
      const side = (i % 2 ? 1 : -1) * (rand() < .2 ? -1 : 1);
      const p = road.getPointAt(u), t = road.getTangentAt(u), nx = -t.z, nz = t.x, off = R(13.5, 19);
      const x = p.x + nx * off * side, z = p.z + nz * off * side;
      if (distToRoad(x, z) < 12) return;
      const w = R(8.5, 11), h = R(6.5, 8), d = R(8, 10), vi = i % 3;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(p.x - x, p.z - z) + R(-.15, .15);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats[vi]); body.position.y = h / 2;
      const rh = R(2.2, 3); const roof = new THREE.Mesh(roofGeo, roofMats[vi]);
      roof.scale.set(w * 1.12 / Math.SQRT2, rh, d * 1.12 / Math.SQRT2); roof.position.y = h + rh / 2;
      body.castShadow = body.receiveShadow = roof.castShadow = true;
      g.add(body, roof); scene.add(g); houses.push({ x, z, r: Math.max(w, d) * .75 + 3 });
    });
  }

  /* ---------- trees: umbrella pines (Bikfaya's signature), conifers, cypress ---------- */
  {
    const treeOK = (x, z) => distToRoad(x, z) > 9.5 && distToBZ(x, z) > 1 && houses.every(h => Math.hypot(h.x - x, h.z - z) > h.r);
    const pts = [];
    const target = mobile ? 300 : 520;
    let tries = 0;
    while (pts.length < target && tries++ < 6000) {
      let x, z;
      if (rand() < .55) { const u = rand(), p = road.getPointAt(u), t = road.getTangentAt(u), s = rand() < .5 ? -1 : 1, off = R(10, 46); x = p.x - t.z * off * s; z = p.z + t.x * off * s; }
      else { x = R(-200, 200); z = R(-280, 230); }
      if (!treeOK(x, z)) continue;
      pts.push([x, z]);
    }
    // frame the building with pines behind and cypresses in front
    for (let i = 0; i < 60; i++) { const x = R(-60, 60), z = R(-150, -118); pts.push([x, z]); }

    const trunkGeo = new THREE.CylinderGeometry(.16, .3, 1, 6); trunkGeo.translate(0, .5, 0);
    const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
    const coneGeo = new THREE.ConeGeometry(1, 1, 7); coneGeo.translate(0, .5, 0);
    const trunkM = new THREE.MeshStandardMaterial({ color: '#5a4434', roughness: 1 });
    const leafM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .95, flatShading: true });
    const n = pts.length;
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkM, n);
    const canopies = new THREE.InstancedMesh(canopyGeo, leafM, n * 2);
    const cones = new THREE.InstancedMesh(coneGeo, leafM, n * 3);
    let ti = 0, ci = 0, ki = 0; const col = new THREE.Color();
    pts.forEach(([x, z]) => {
      const y = heightAt(x, z) - .3;
      if (rand() < .62) { // umbrella / stone pine
        const th = R(5.5, 9), r = R(2.8, 4.6);
        dummy.position.set(x, y, z); dummy.rotation.set(R(-.06, .06), 0, R(-.06, .06)); dummy.scale.set(1, th, 1); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
        for (let j = 0; j < 2; j++) {
          dummy.position.set(x + R(-1, 1) * (j ? 1.2 : 0), y + th + (j ? -.4 : 0), z + R(-1, 1) * (j ? 1.2 : 0));
          dummy.rotation.set(0, R(0, 6), 0); const rr = j ? r * .7 : r; dummy.scale.set(rr, rr * .4, rr * R(.85, 1.1)); dummy.updateMatrix();
          canopies.setMatrixAt(ci, dummy.matrix); canopies.setColorAt(ci++, col.setHSL(R(.24, .3), R(.25, .38), R(.22, .3)));
        }
      } else { // conifer
        const H = R(6, 11), r = H * R(.28, .36);
        dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, H * .25, 1); dummy.updateMatrix(); trunks.setMatrixAt(ti++, dummy.matrix);
        for (let j = 0; j < 3; j++) {
          dummy.position.set(x, y + H * (.18 + j * .22), z); dummy.rotation.set(0, R(0, 6), 0);
          const s = 1 - j * .26; dummy.scale.set(r * s, H * .45, r * s); dummy.updateMatrix();
          cones.setMatrixAt(ki, dummy.matrix); cones.setColorAt(ki++, col.setHSL(R(.27, .33), R(.25, .35), R(.17, .24)));
        }
      }
    });
    trunks.count = ti; canopies.count = ci; cones.count = ki;
    [trunks, canopies, cones].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

    // cypresses flanking the Sokun plaza
    const cyp = new THREE.MeshStandardMaterial({ color: '#2f4430', roughness: 1, flatShading: true });
    const cypGeo = new THREE.ConeGeometry(.95, 9, 8); cypGeo.translate(0, 4.8, 0);
    [[-19, -70], [-23, -66], [19, -70], [23, -66], [-31, -80], [31, -80]].forEach(([x, z]) => {
      const m = new THREE.Mesh(cypGeo, cyp); m.position.set(x, 0, z); m.scale.setScalar(R(.85, 1.15)); m.castShadow = true; scene.add(m);
    });
  }

  /* ================= SOKUN BUILDING ================= */
  const FRONT = -74, BACK = -104, HALF = 14, H = 10, T = .8, DOOR_W = 6.4, DOOR_H = 5.2;
  const doors = [];
  {
    const stone = tex(stoneCanvas('#ebe0cb', .05, '#d4c6ac', 7), true);
    const stoneM = new THREE.MeshStandardMaterial({ map: stone, roughness: .9 });
    const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m; };

    // plaza + steps
    const pav = paverTexture(); pav.repeat.set(10, 6);
    add(new THREE.PlaneGeometry(52, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: pav, roughness: .95 }), 0, .04, -60, false);
    add(uvBox(12, .16, 2.2), stoneM, 0, .08, -71.2);
    add(uvBox(10, .3, 1.4), stoneM, 0, .15, -73);

    // front wall with entrance opening
    const sideW = HALF - DOOR_W / 2;
    add(uvBox(sideW, H, T), stoneM, -(DOOR_W / 2 + sideW / 2), H / 2, FRONT);
    add(uvBox(sideW, H, T), stoneM, (DOOR_W / 2 + sideW / 2), H / 2, FRONT);
    add(uvBox(DOOR_W, H - DOOR_H, T), stoneM, 0, DOOR_H + (H - DOOR_H) / 2, FRONT);
    // side + back walls
    add(uvBox(T, H, FRONT - BACK), stoneM, -HALF, H / 2, (FRONT + BACK) / 2);
    add(uvBox(T, H, FRONT - BACK), stoneM, HALF, H / 2, (FRONT + BACK) / 2);
    add(uvBox(HALF * 2, H, T), stoneM, 0, H / 2, BACK);
    // roof slab with front overhang + entrance canopy
    const slabM = new THREE.MeshStandardMaterial({ color: '#d9cdb6', roughness: .8 });
    add(new THREE.BoxGeometry(HALF * 2 + 3, .7, FRONT - BACK + 3.5), slabM, 0, H + .3, (FRONT + BACK) / 2 + 1.2);
    add(new THREE.BoxGeometry(10, .28, 3.6), slabM, 0, DOOR_H + .55, FRONT + 1.9);

    // arched glowing windows on the facade (echoing the village's triple arches)
    const archTex = archGlowTexture();
    const archM = new THREE.MeshBasicMaterial({ map: archTex, transparent: true, color: '#e6c49a' });
    [-11.3, -8.4, -5.5, 5.5, 8.4, 11.3].forEach(x => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), archM); m.position.set(x, 2.5, FRONT + T / 2 + .02); scene.add(m);
    });
    // upper floor: warm band behind cedar louvers
    const band = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 - 2, 2.6), new THREE.MeshBasicMaterial({ color: '#d79a5c' }));
    band.position.set(0, 8.1, FRONT + T / 2 + .02); scene.add(band);
    const louverM = new THREE.MeshStandardMaterial({ color: '#7a4e31', roughness: .7 });
    const louvers = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, 3, .35), louverM, 64);
    for (let i = 0; i < 64; i++) { dummy.position.set(-12.9 + i * .41, 8.1, FRONT + T / 2 + .25); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); louvers.setMatrixAt(i, dummy.matrix); }
    louvers.castShadow = true; scene.add(louvers);

    // sign
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 2.37), new THREE.MeshBasicMaterial({ map: sokunSignTexture(), transparent: true, toneMapped: false, color: '#ffffff' }));
    sign.position.set(0, 6.25, FRONT + 3.75); scene.add(sign);
    // canopy down-lights & facade up-lights
    [-3, 0, 3].forEach(x => { const g = glow('#ffcf8f', 1.6, .9); g.position.set(x, DOOR_H + .3, FRONT + 2.4); scene.add(g); });
    [-12.6, -6.9, 6.9, 12.6].forEach(x => { const g = glow('#ffb35f', 4, .55); g.position.set(x, .6, FRONT + 1); scene.add(g); });

    // planters with olive trees
    const planterM = new THREE.MeshStandardMaterial({ color: '#b9a888', roughness: 1 });
    const oliveM = new THREE.MeshStandardMaterial({ color: '#7d8a62', roughness: 1, flatShading: true });
    [-6.2, 6.2].forEach(x => {
      add(new THREE.BoxGeometry(2, 1, 2), planterM, x, .5, FRONT + 2.6);
      add(new THREE.CylinderGeometry(.1, .16, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#5d4a3a' }), x, 2, FRONT + 2.6);
      for (let k = 0; k < 4; k++) { const m = add(new THREE.IcosahedronGeometry(1, 1), oliveM, x + R(-.6, .6), 3.3 + R(-.3, .5), FRONT + 2.6 + R(-.6, .6)); m.scale.set(R(.9, 1.3), R(.6, .9), R(.9, 1.3)); }
    });

    // glass sliding doors
    const glassM = new THREE.MeshStandardMaterial({ color: '#cfe1de', transparent: true, opacity: .26, roughness: .05, metalness: .2, envMapIntensity: 2 });
    const frameM = new THREE.MeshStandardMaterial({ color: '#3a2e24', metalness: .6, roughness: .4 });
    [-1, 1].forEach(s => {
      const g = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W / 2 - .1, DOOR_H - .1, .06), glassM);
      const fT = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W / 2, .1, .12), frameM); fT.position.y = DOOR_H / 2 - .05;
      const fB = fT.clone(); fB.position.y = -DOOR_H / 2 + .05;
      const fS = new THREE.Mesh(new THREE.BoxGeometry(.1, DOOR_H, .12), frameM); fS.position.x = -s * (DOOR_W / 4 - .05);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.4, .1), frameM); handle.position.set(-s * (DOOR_W / 4 - .4), 0, .1);
      g.add(glass, fT, fB, fS, handle); g.position.set(s * DOOR_W / 4, DOOR_H / 2 + .3, FRONT + T / 2 + .1); g.userData.base = g.position.x;
      scene.add(g); doors.push(g);
    });

    /* ----- interior ----- */
    const wood = woodTexture(); wood.repeat.set(5, 6);
    add(new THREE.BoxGeometry(HALF * 2 - T, .3, FRONT - BACK - T).translate(0, 0, 0), new THREE.MeshStandardMaterial({ map: wood, roughness: .55 }), 0, .15, (FRONT + BACK) / 2, false);
    // lowered ceiling with light coves
    add(new THREE.BoxGeometry(HALF * 2 - T, .3, FRONT - BACK - T), new THREE.MeshStandardMaterial({ color: '#efe6d6', roughness: 1 }), 0, 6.2, (FRONT + BACK) / 2, false);
    const cove = new THREE.MeshBasicMaterial({ color: '#ffd59a' });
    [-5, 5].forEach(x => add(new THREE.BoxGeometry(.35, .06, 27), cove, x, 6.02, (FRONT + BACK) / 2, false));
    // central stone path + water channels + floating candles
    add(new THREE.BoxGeometry(3.6, .06, 25), new THREE.MeshStandardMaterial({ color: '#d8ccb6', roughness: .7 }), 0, .33, -89, false);
    const waterM = new THREE.MeshStandardMaterial({ color: '#1b2a2b', metalness: .85, roughness: .08, envMapIntensity: 1.6 });
    const ledge = new THREE.MeshStandardMaterial({ color: '#cbbd9f', roughness: .8 });
    const flames = [];
    [-1, 1].forEach(s => {
      add(new THREE.BoxGeometry(1.7, .05, 24), waterM, s * 2.85, .34, -89, false);
      add(new THREE.BoxGeometry(.2, .22, 24), ledge, s * 3.8, .41, -89, false);
      for (let z = -78; z > -101; z -= 1.9) {
        const cx = s * 2.85 + R(-.35, .35);
        add(new THREE.CylinderGeometry(.09, .09, .16, 10), new THREE.MeshStandardMaterial({ color: '#f6efe1', emissive: '#ffcf8a', emissiveIntensity: .6 }), cx, .44, z, false);
        const f = glow('#ffb24d', .55, 1); f.position.set(cx, .62, z); f.userData.phase = R(0, 10); scene.add(f); flames.push(f);
        const rf = glow('#ff9d3a', .9, .35); rf.position.set(cx, .36, z); scene.add(rf);
      }
    });
    // back feature wall: cedar slats + glowing سكون
    const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, 5.8, .22), new THREE.MeshStandardMaterial({ color: '#8a5a37', roughness: .6 }), 46);
    for (let i = 0; i < 46; i++) { dummy.position.set(-10.5 + i * .466, 3.2, BACK + T / 2 + .14); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); slats.setMatrixAt(i, dummy.matrix); }
    scene.add(slats);
    const feature = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.8), new THREE.MeshBasicMaterial({ map: featureTextTexture(), transparent: true, toneMapped: false }));
    feature.position.set(0, 3.1, BACK + T / 2 + .3); scene.add(feature);
    const fg = glow('#ffb15c', 11, .35); fg.position.set(0, 3.1, BACK + 1.2); scene.add(fg);
    // niches on side walls
    [-1, 1].forEach(s => {
      for (let z = -79; z > -101; z -= 5.4) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3), archM); m.position.set(s * (HALF - T / 2 - .02), 2.3, z); m.rotation.y = -s * Math.PI / 2; scene.add(m);
      }
      // low cedar benches + cushions
      add(new THREE.BoxGeometry(1.3, .5, 9), new THREE.MeshStandardMaterial({ color: '#7d4f30', roughness: .7 }), s * 9.6, .55, -88);
      add(new THREE.BoxGeometry(1.1, .22, 8.6), new THREE.MeshStandardMaterial({ color: '#efe5d3', roughness: 1 }), s * 9.6, .91, -88);
    });
    // pots with plants
    const potM = new THREE.MeshStandardMaterial({ color: '#b07a55', roughness: .9 });
    const leaf = new THREE.MeshStandardMaterial({ color: '#4f6a3c', roughness: 1, flatShading: true });
    [[-11.8, -77], [11.8, -77], [-11.8, -101], [11.8, -101], [-5.6, -101.6], [5.6, -101.6]].forEach(([x, z]) => {
      add(new THREE.CylinderGeometry(.55, .4, 1.1, 14), potM, x, .85, z);
      for (let k = 0; k < 5; k++) { const m = add(new THREE.IcosahedronGeometry(.6, 0), leaf, x + R(-.4, .4), 1.9 + R(0, 1.2), z + R(-.4, .4)); m.scale.set(1, R(1.2, 1.8), 1); }
    });
    // pendant lights
    [-80, -86, -92, -98].forEach(z => {
      add(new THREE.CylinderGeometry(.01, .01, 1.4, 4), frameM, 0, 5.35, z, false);
      add(new THREE.SphereGeometry(.26, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffe2ae' }), 0, 4.6, z, false);
      const g = glow('#ffc070', 2.4, .7); g.position.set(0, 4.6, z); scene.add(g);
    });
    // interior light
    [[0, 4.2, -79], [0, 4.2, -91], [0, 3.6, -101]].forEach(([x, y, z]) => { const l = new THREE.PointLight('#ffb870', 38, 0, 1.8); l.position.set(x, y, z); scene.add(l); });

    // floating dust in the warm air
    const dustN = 380, dp = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) { dp[i * 3] = R(-12, 12); dp[i * 3 + 1] = R(.5, 5.8); dp[i * 3 + 2] = R(-102, -76); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    var dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: .07, map: glowTex, color: '#ffd9a0', transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);
    scene.userData.flames = flames; scene.userData.dust = dust;
  }

  /* ================= CAMERA PATH ================= */
  const camPts = road.getSpacedPoints(10).slice(0, 9).map(p => new THREE.Vector3(p.x, 2.7, p.z));
  camPts[0].set(camPts[0].x + 8, 11, camPts[0].z + 18); camPts[1].y = 5;
  camPts.push(new THREE.Vector3(0, 2.6, -46), new THREE.Vector3(0, 2.25, -60), new THREE.Vector3(0, 2.0, -70.5), new THREE.Vector3(0, 1.85, -78), new THREE.Vector3(0, 1.8, -86), new THREE.Vector3(0, 1.75, -91));
  const camCurve = new THREE.CatmullRomCurve3(camPts, false, 'centripetal', .4);
  const FEATURE = new THREE.Vector3(0, 2.7, BACK);
  const look = new THREE.Vector3(), tmp = new THREE.Vector3(), focus = new THREE.Vector3();
  let camP = 0;

  function placeCamera(p, time = 0) {
    camP = p;
    camCurve.getPointAt(p, camera.position);
    camCurve.getPointAt(Math.min(p + .028, 1), look);
    if (p > .97) look.add(tmp.set(0, 0, -6));
    look.y += .2;
    look.lerp(FEATURE, smooth(.86, 1, p));
    // a gentle hand-held drift
    camera.position.x += Math.sin(time * .7) * .05; camera.position.y += Math.sin(time * 1.3) * .03;
    camera.lookAt(look);
    // doors slide open as we approach
    const open = smooth(-50, -64, camera.position.z) ;
    doors.forEach((d, i) => { d.position.x = d.userData.base + (i ? 1 : -1) * open * (DOOR_W / 2 - .2); });
  }

  function animateAmbient(time) {
    const { flames, dust } = scene.userData;
    flames.forEach(f => { const k = .85 + Math.sin(time * 9 + f.userData.phase) * .08 + Math.sin(time * 23 + f.userData.phase * 3) * .05; f.scale.setScalar(.55 * k); });
    dust.rotation.y = Math.sin(time * .05) * .02; dust.position.y = Math.sin(time * .3) * .15;
    // keep sky and sun-shadow around camera
    sky.position.copy(camera.position);
    camera.getWorldDirection(tmp); focus.copy(camera.position).addScaledVector(tmp, 35);
    sun.position.copy(focus).addScaledVector(sunDir, 150); sun.target.position.copy(focus);
  }

  function render() { renderer.render(scene, camera); }
  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  }

  return {
    renderer, scene, camera,
    /** t: 0..1 progress along the walk */
    update(t, time) { placeCamera(t, time); animateAmbient(time); render(); },
    /** idle inside, used as live hero background */
    idle(time) {
      placeCamera(.955, 0);
      camera.position.x += 1.6 + Math.sin(time * .12) * .5; camera.position.y += .4 + Math.sin(time * .17) * .12;
      camera.lookAt(FEATURE.x - 3.2 + Math.sin(time * .09) * .6, FEATURE.y - .3, FEATURE.z);
      animateAmbient(time); render();
    },
    compile() { placeCamera(0); animateAmbient(0); renderer.compile(scene, camera); },
    resize,
  };
}
