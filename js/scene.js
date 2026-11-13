// Sokun — cinematic 3D walk-in, modelled on Bikfaya Main Street (Antelias–Bikfaya Rd):
// drive up the main street → the white BLOM Bank building → rise to the first floor → through the glass into Sokun.
// Everything is generated in code (no models/videos), so it runs on GitHub Pages as-is.
import * as THREE from './vendor/three.module.min.js';

/* ---------------- utils ---------------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(2026);
const R = (a, b) => a + (b - a) * rand();
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
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
function spacedText(g, text, x, y, spacing, align = 'center') {
  const chars = [...text]; const widths = chars.map(ch => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x; g.textAlign = 'left';
  chars.forEach((ch, i) => { g.fillText(ch, cx, y); cx += widths[i] + spacing; });
}
// Box whose UVs are in world units (tx metres per texture repeat horizontally, ty vertically)
function uvBox(w, h, d, tx = 4, ty = tx) {
  const geo = new THREE.BoxGeometry(w, h, d); const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tx, uv.getY(k) * dims[f][1] / ty); }
  return geo;
}

/* ---------------- procedural textures ---------------- */
function noiseCanvas(base, size, speck = 6000, alpha = .08) {
  const c = canvas(size), g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < speck; i++) { g.fillStyle = `rgba(${rand() < .5 ? '0,0,0' : '255,255,255'},${R(0, alpha)})`; const s = R(1, 3); g.fillRect(R(0, size), R(0, size), s, s); }
  return c;
}
function asphaltTexture() {
  const c = noiseCanvas('#707174', 512, 16000, .1), g = c.getContext('2d');
  for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(${rand() < .5 ? '30,30,32' : '95,95,98'},${R(.15, .35)})`; g.fillRect(R(0, 512), R(0, 512), R(40, 180), R(30, 140)); } // patches
  g.strokeStyle = 'rgba(25,25,25,.5)'; g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) { g.beginPath(); let x = R(0, 512), y = R(0, 512); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += R(-30, 30); y += R(-30, 30); g.lineTo(x, y); } g.stroke(); }
  const t = tex(c, true); return t;
}
function pavingTexture() {
  const c = canvas(256), g = c.getContext('2d'); g.fillStyle = '#9a958a'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) { g.fillStyle = shade('#c3bcae', R(-.07, .06)); g.fillRect(x + 1.5, y + 1.5, 29, 29); }
  return tex(c, true);
}
function glowTexture() {
  const c = canvas(128), g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c);
}
// window: aluminium frame, glass with sky reflection, optional roller shutter
function drawWindow(g, x, y, w, h, shutter = 0) {
  g.fillStyle = '#e9e8e3'; g.fillRect(x - 5, y - 5, w + 10, h + 10);
  const gr = g.createLinearGradient(x, y, x + w * .3, y + h);
  gr.addColorStop(0, '#a8c0d6'); gr.addColorStop(.55, '#5b7287'); gr.addColorStop(1, '#2f3b46');
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x + w * .2, y); g.lineTo(x + w * .45, y); g.lineTo(x + w * .15, y + h); g.lineTo(x, y + h); g.lineTo(x, y + h * .6); g.closePath(); g.fill();
  g.fillStyle = '#e9e8e3'; g.fillRect(x + w / 2 - 2, y, 4, h);
  if (shutter > 0) { const sh = h * shutter; g.fillStyle = '#c9c2b4'; g.fillRect(x, y, w, sh); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; for (let k = y + 3; k < y + sh; k += 4) { g.beginPath(); g.moveTo(x, k); g.lineTo(x + w, k); g.stroke(); } }
  g.fillStyle = '#dcd8cf'; g.fillRect(x - 6, y - 16, w + 12, 11); // roller box
}
// one floor of an apartment facade: 8 m wide × 3.2 m tall (64 px / m)
function floorTile(base, kind) {
  const c = canvas(512, 205), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 205);
  if (kind === 'stone') {
    for (let r = 0; r < 7; r++) { let x = -R(0, 40); while (x < 512) { const w = R(50, 110); g.fillStyle = shade(base, R(-.07, .07)); g.fillRect(x + 1, r * 29 + 1, w - 2, 27); x += w; } }
  } else {
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${R(0, .04)})`; g.fillRect(R(0, 512), R(0, 205), 2, 2); }
    g.fillStyle = 'rgba(70,60,40,.08)'; for (let i = 0; i < 4; i++) g.fillRect(R(0, 512), 150, R(2, 5), R(30, 55)); // rain stains
  }
  g.fillStyle = shade(base, -.14); g.fillRect(0, 191, 512, 14); // slab edge
  const sh = () => (rand() < .45 ? R(.15, .8) : 0);
  if (kind === 'wide') { drawWindow(g, 40, 50, 150, 100, sh()); drawWindow(g, 290, 30, 180, 150, sh()); }
  else if (kind === 'three') { [40, 210, 380].forEach(x => drawWindow(g, x, 55, 92, 100, sh())); }
  else { drawWindow(g, 60, 55, 110, 100, sh()); drawWindow(g, 300, 28, 130, 152, sh()); }
  return tex(c, true);
}
function shopTexture(name, ar, color, kind) {
  const c = canvas(512, 220), g = c.getContext('2d');
  g.fillStyle = '#d9d4c8'; g.fillRect(0, 0, 512, 220);
  g.fillStyle = color; g.fillRect(0, 8, 512, 48); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 8, 512, 48);
  g.fillStyle = '#fff'; g.font = '700 30px Manrope, Arial, sans-serif'; g.textBaseline = 'middle';
  spacedText(g, name, 24, 33, 3, 'left'); g.font = '700 30px Amiri, serif'; g.textAlign = 'right'; g.fillText(ar, 492, 33);
  if (kind === 'shutter') {
    g.fillStyle = '#a7a8a6'; g.fillRect(20, 66, 472, 154);
    for (let y = 68; y < 220; y += 6) { g.fillStyle = y % 12 ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.18)'; g.fillRect(20, y, 472, 2); }
  } else {
    const gr = g.createLinearGradient(0, 66, 0, 220); gr.addColorStop(0, '#6d7f8d'); gr.addColorStop(1, '#262d33');
    g.fillStyle = gr; g.fillRect(20, 66, 472, 154);
    for (let i = 0; i < 18; i++) { g.fillStyle = `hsla(${R(0, 360)},40%,${R(40, 70)}%,.55)`; g.fillRect(R(30, 470), R(110, 200), R(8, 30), R(6, 22)); } // goods
    g.fillStyle = '#cfcfcb'; [20, 176, 332, 488].forEach(x => g.fillRect(x, 66, 4, 154));
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(60, 66, 40, 154);
  }
  return tex(c);
}
function signCanvasText(w, h, bg, draw) { const c = canvas(w, h), g = c.getContext('2d'); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.textBaseline = 'middle'; draw(g, w, h); return tex(c); }
function woodTexture(base = '#c89b6c') {
  const c = canvas(512), g = c.getContext('2d');
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = shade(base, R(-.1, .08)); g.fillRect(x, 0, 32, 512);
    for (let k = 0; k < 12; k++) { g.strokeStyle = `rgba(90,55,25,${R(.05, .14)})`; g.beginPath(); const xx = x + R(3, 29); g.moveTo(xx, 0); g.bezierCurveTo(xx + R(-4, 4), 170, xx + R(-4, 4), 340, xx, 512); g.stroke(); }
    g.fillStyle = 'rgba(60,35,15,.35)'; g.fillRect(x, 0, 1.5, 512); g.fillRect(x, R(0, 512), 32, 1.5);
  }
  return tex(c, true);
}

/* ---------------- sky with clouds ---------------- */
function skyMaterial(sunDir) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color('#3b78c7') }, uHorizon: { value: new THREE.Color('#d6e4ee') }, uSun: { value: sunDir.clone() }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vDir; void main(){ vec4 wp = modelMatrix*vec4(position,1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uTop,uHorizon,uSun; uniform float uTime; varying vec3 vDir;
      float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
      float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
      void main(){ vec3 d=normalize(vDir); float h=max(d.y,0.0);
        vec3 col=mix(uHorizon,uTop,pow(smoothstep(0.0,0.65,h),0.75));
        vec2 uv=d.xz/(d.y+0.15)*1.1+vec2(uTime*0.004,0.0);
        float c=smoothstep(0.52,0.85,fb(uv*1.3)); c*=smoothstep(0.02,0.25,d.y);
        col=mix(col,vec3(1.0),c*0.8);
        float s=max(dot(d,normalize(uSun)),0.0);
        col+=vec3(1.0,0.96,0.88)*pow(s,500.0)*3.0+vec3(1.0,0.92,0.8)*pow(s,12.0)*0.12;
        col=mix(col,uHorizon,smoothstep(0.0,-0.04,d.y));
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
  scene.fog = new THREE.Fog('#cbd9e3', 90, 620);
  const camera = new THREE.PerspectiveCamera(mobile ? 66 : 55, window.innerWidth / window.innerHeight, .1, 1600);

  // late-morning sun from the south-west, lighting the BLOM building's facade like in Street View
  const sunDir = new THREE.Vector3(-.42, .86, .3).normalize();
  const skyMat = skyMaterial(sunDir);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat); scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMaterial(sunDir)));
  scene.environment = pmrem.fromScene(envScene, .03).texture; scene.environmentIntensity = .55;

  scene.add(new THREE.HemisphereLight('#d7e8f7', '#8c826e', 1.15));
  const sun = new THREE.DirectionalLight('#fff3df', 3.6);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 });
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .3;
  scene.add(sun, sun.target);

  const glowTex = glowTexture();
  const dummy = new THREE.Object3D();
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const inst = { box: [], tank: [], tree: [], trunk: [], roof: [] };
  function addInst(list, parent, x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0) {
    _p.set(x, y, z); _s.set(sx, sy, sz); _q.setFromEuler(_e.set(rx, ry, rz)); _m.compose(_p, _q, _s);
    list.push([parent ? parent.matrix.clone().multiply(_m) : _m.clone(), new THREE.Color(color)]);
  }
  const add = (geo, mat, x, y, z, { cast = true, receive = true, parent = scene } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = receive; parent.add(m); return m;
  };

  /* ---------- street layout ---------- */
  // Main street runs along -z. Road |x| < 5.5 (two lanes + parking), sidewalks to |x| = 7.8.
  const ROAD = 5.5, WALK = 8.8, Z_START = 140, Z_END = -260;
  const LEN = Z_START - Z_END, ZMID = (Z_START + Z_END) / 2;
  {
    const asph = asphaltTexture(); asph.repeat.set(2, LEN / 10);
    add(new THREE.PlaneGeometry(ROAD * 2, LEN).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: asph, roughness: .93 }), 0, .02, ZMID, { cast: false });
    // faded lane markings
    const lineM = new THREE.MeshStandardMaterial({ color: '#d9d6cc', roughness: .9, transparent: true, opacity: .75 });
    for (let z = Z_START; z > Z_END; z -= 9) add(new THREE.PlaneGeometry(.14, 3.5).rotateX(-Math.PI / 2), lineM, 0, .03, z, { cast: false });
    [-ROAD + .35, ROAD - .35].forEach(x => add(new THREE.PlaneGeometry(.12, LEN).rotateX(-Math.PI / 2), lineM, x, .03, ZMID, { cast: false }));
    // sidewalks + curbs
    const pave = pavingTexture(); pave.repeat.set(1.2, LEN / 2.2);
    const paveM = new THREE.MeshStandardMaterial({ map: pave, roughness: .95 });
    const curbM = new THREE.MeshStandardMaterial({ color: '#b9b4a8', roughness: .9 });
    [-1, 1].forEach(s => {
      add(new THREE.BoxGeometry(WALK - ROAD, .16, LEN), paveM, s * (ROAD + WALK) / 2, .08, ZMID, { cast: false });
      add(new THREE.BoxGeometry(.25, .2, LEN), curbM, s * (ROAD + .12), .1, ZMID, { cast: false });
    });
  }

  /* ---------- terrain: flat in town, Mount Lebanon hills around ---------- */
  const heightAt = (x, z) => {
    const ax = Math.abs(x);
    let h = smooth(34, 120, ax) * (fbm(x * .01 + 4, z * .01) * 70 + 8);
    h += smooth(-215, -320, z) * (fbm(x * .008 + 9, z * .008) * 60 + 30);
    h += smooth(170, 260, z) * 25;
    return h;
  };
  {
    const seg = mobile ? 90 : 140;
    const geo = new THREE.PlaneGeometry(900, 900, seg, seg); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -60);
    const pos = geo.attributes.position; const cols = []; const c = new THREE.Color();
    const g1 = new THREE.Color('#6e7c4a'), g2 = new THREE.Color('#9c9264'), g3 = new THREE.Color('#4c5f36'), town = new THREE.Color('#9a9384');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z); pos.setY(i, h - .05);
      const n = fbm(x * .04, z * .04);
      c.copy(g1).lerp(g2, smooth(.45, .75, n)).lerp(g3, smooth(.5, .25, n) * .8);
      if (Math.abs(x) < 34 && z > -215 && z < 170) c.lerp(town, .8);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    terrain.receiveShadow = true; scene.add(terrain);
    // distant ranges
    [[-560, '#9fb0c4', 150, 80, 11], [-470, '#8a9caa', 110, 60, 23]].forEach(([z, col, base, amp, seed]) => {
      const sh = new THREE.Shape(); sh.moveTo(-900, -40);
      for (let x = -900; x <= 900; x += 12) sh.lineTo(x, base + fbm(x * .005 + seed, seed) * amp * 2 - amp * .6);
      sh.lineTo(900, -40); sh.closePath();
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col })); m.position.z = z; scene.add(m);
    });
  }

  /* ---------- apartment buildings + shops ---------- */
  const palettes = [['#e8e2d4', 'plain'], ['#dccbaa', 'stone'], ['#f0ece4', 'plain'], ['#d8c29b', 'plain'], ['#cfc8ba', 'plain'], ['#e2d3b6', 'stone']];
  const layouts = ['two', 'wide', 'three'];
  const facadeMats = []; palettes.forEach(([col, kind]) => layouts.forEach(l => {
    const map = floorTile(col, kind === 'stone' ? 'stone' : l); if (kind === 'stone') { /* stone tiles get windows too */ const c2 = map.image.getContext('2d'); const sh = () => (rand() < .4 ? R(.2, .7) : 0); if (l === 'three') [40, 210, 380].forEach(x => drawWindow(c2, x, 55, 92, 100, sh())); else { drawWindow(c2, 60, 55, 110, 100, sh()); drawWindow(c2, 300, 28, 130, 152, sh()); } map.needsUpdate = true; }
    facadeMats.push({ col, mat: new THREE.MeshStandardMaterial({ map, roughness: .92 }) });
  }));
  const shops = [
    ['PHARMACY', 'صيدلية', '#2f8a4a', 'glass'], ['BAKERY', 'فرن', '#b5522e', 'glass'], ['MINI MARKET', 'ميني ماركت', '#1f4f9a', 'glass'],
    ['OPTIC', 'نظارات', '#2b2b2b', 'glass'], ['SWEETS', 'حلويات', '#a8326b', 'glass'], ['BOUTIQUE', 'بوتيك', '#5a4a7a', 'shutter'],
    ['ELECTRONICS', 'إلكترونيات', '#c43c2c', 'shutter'], ['CAFÉ', 'قهوة', '#3d5a40', 'glass'], ['HARDWARE', 'خردوات', '#d08a1e', 'shutter'], ['FLOWERS', 'زهور', '#7a9a3a', 'glass'],
  ].map(([n, a, c, k]) => new THREE.MeshStandardMaterial({ map: shopTexture(n, a, c, k), roughness: .7 }));
  const roofM = new THREE.MeshStandardMaterial({ color: '#a8a39a', roughness: 1 });

  function building(side, zc, w, floors, opts = {}) {
    const g = new THREE.Group();
    const groundH = 4.2, fh = 3.2, d = R(12, 16), H = groundH + floors * fh;
    const fm = opts.facade || pick(facadeMats);
    const plainM = new THREE.MeshStandardMaterial({ color: fm.col, roughness: .95 });
    const body = new THREE.Mesh(uvBox(w, floors * fh, d, 8, 3.2), [fm.mat, fm.mat, roofM, roofM, fm.mat, fm.mat]);
    body.position.set(0, groundH + floors * fh / 2, -d / 2); body.castShadow = body.receiveShadow = true; g.add(body);
    const shop = new THREE.Mesh(new THREE.BoxGeometry(w, groundH, d), [plainM, plainM, plainM, plainM, opts.shop || pick(shops), plainM]);
    shop.position.set(0, groundH / 2, -d / 2 - .35); shop.receiveShadow = true; g.add(shop);
    g.position.set(side * (WALK + (opts.setback ?? R(.2, 3))), 0, zc);
    g.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.updateMatrix(); scene.add(g);
    // slab over the shops + balconies with concrete parapets
    addInst(inst.box, g, 0, groundH - .05, .45, w + .2, .3, 1.1, shade(fm.col, -.05));
    const balc = rand() < .78;
    for (let f = 1; f < floors; f++) {
      const y = groundH + f * fh;
      if (balc) {
        const segs = rand() < .5 ? [[0, w - 1.2]] : [[-w / 4, w / 2 - 1], [w / 4, w / 2 - 1]];
        segs.forEach(([cx, sw]) => {
          addInst(inst.box, g, cx, y + .08, .7, sw, .18, 1.4, shade(fm.col, -.04));
          addInst(inst.box, g, cx, y + .62, 1.36, sw, .95, .1, rand() < .3 ? '#3a3b3c' : fm.col);
          addInst(inst.box, g, cx - sw / 2, y + .62, .7, .1, .95, 1.4, fm.col); addInst(inst.box, g, cx + sw / 2, y + .62, .7, .1, .95, 1.4, fm.col);
        });
      }
      if (rand() < .55) addInst(inst.box, g, R(-w / 2 + 1, w / 2 - 1), y + R(.4, 2.2), .25, .85, .55, .32, '#e6e6e2'); // AC unit
    }
    // roof: parapet, water tanks, solar heaters — the Lebanese skyline
    addInst(inst.box, g, 0, H + .3, -d / 2, w + .1, .6, d + .1, shade(fm.col, -.06));
    const nt = 1 + Math.floor(rand() * 4);
    for (let i = 0; i < nt; i++) addInst(inst.tank, g, R(-w / 2 + 1, w / 2 - 1), H + 1.2, R(-d + 1.5, -1.5), 1, 1, 1, pick(['#1d1d1f', '#e9e9e4', '#2a4e85', '#1d1d1f']));
    if (rand() < .6) addInst(inst.box, g, R(-w / 3, w / 3), H + 1.3, -d / 2, 2, .08, 1.3, '#1f2c3d', -.6);
    return { H, d };
  }

  // populate both sides; leave the BLOM / Sokun lot on the right free
  const SOKUN = { x0: 9.2, x1: 25, z0: -48, z1: -32 };
  [-1, 1].forEach(side => {
    let z = Z_START - 4;
    while (z > -205) {
      const w = R(10, 17);
      const zc = z - w / 2;
      if (side > 0 && zc + w / 2 > SOKUN.z0 - 1 && zc - w / 2 < SOKUN.z1 + 15) { z = SOKUN.z0 - 1.5; continue; }
      building(side, zc, w, Math.floor(R(2, 5.6)));
      z -= w + (rand() < .45 ? R(2, 6) : .4);
    }
  });
  // the neighbour on the right after Sokun: blue-signed shop (like in Street View)
  building(1, -24, 15, 3, { setback: .6, shop: new THREE.MeshStandardMaterial({ map: shopTexture('MINI MARKET', 'ميني ماركت', '#1d3f96', 'glass'), roughness: .7 }) });

  /* ---------- utility poles with tangled wires ---------- */
  {
    const poleM = new THREE.MeshStandardMaterial({ color: '#8b8579', roughness: .9 });
    const poleGeo = new THREE.CylinderGeometry(.13, .19, 9, 8); poleGeo.translate(0, 4.5, 0);
    const armGeo = new THREE.BoxGeometry(1.8, .12, .12);
    const poles = [];
    for (let z = Z_START - 6; z > -200; z -= R(22, 28)) {
      const x = ROAD + .6;
      const p = add(poleGeo, poleM, x, 0, z); add(armGeo, poleM, x, 8.5, z); poles.push(new THREE.Vector3(x, 8.6, z));
      const lamp = add(new THREE.BoxGeometry(1.2, .1, .1), poleM, x - .6, 7.6, z); lamp.castShadow = false;
      add(new THREE.BoxGeometry(.45, .12, .25), new THREE.MeshStandardMaterial({ color: '#f1efe7' }), x - 1.2, 7.55, z, { cast: false });
      if (rand() < .4) add(new THREE.BoxGeometry(.5, .8, .4), new THREE.MeshStandardMaterial({ color: '#7d7a72' }), x + .25, 6.5, z); // transformer / box
    }
    const pts = [];
    const wire = (a, b, sag) => { const n = 16; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; [t0, t1].forEach(t => { pts.push(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * sag, a.z + (b.z - a.z) * t); }); } };
    for (let i = 0; i < poles.length - 1; i++) {
      for (let k = 0; k < 4; k++) { const off = new THREE.Vector3(R(-.8, .8), -k * .35, 0); wire(poles[i].clone().add(off), poles[i + 1].clone().add(off), R(.5, 1.1)); }
      if (rand() < .7) { const a = poles[i].clone().add(new THREE.Vector3(-.4, -1, 0)); wire(a, new THREE.Vector3(-WALK - .3, R(6, 9), a.z + R(-6, 6)), R(.4, .9)); }
      if (rand() < .5) { const a = poles[i].clone().add(new THREE.Vector3(.3, -1.2, 0)); wire(a, new THREE.Vector3(WALK + .3, R(5.5, 8), a.z + R(-5, 5)), .3); }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#1e1e1e', transparent: true, opacity: .85 })));
  }

  /* ---------- street trees (left sidewalk) ---------- */
  for (let z = Z_START - 10; z > -200; z -= R(11, 17)) {
    if (rand() < .2) continue;
    const x = -ROAD - 1.1;
    addInst(inst.trunk, null, x, 0, z, 1, R(3, 4.2), 1, '#5a4a3a');
    for (let k = 0; k < 3; k++) addInst(inst.tree, null, x + R(-1, 1), R(4.3, 5.6), z + R(-1, 1), R(1.6, 2.4), R(1.3, 1.9), R(1.6, 2.4), new THREE.Color().setHSL(R(.22, .29), R(.3, .45), R(.22, .32)));
  }
  /* ---------- hills: pines + stone houses with red roofs ---------- */
  {
    let placed = 0, tries = 0; const target = mobile ? 380 : 700;
    while (placed < target && tries++ < 9000) {
      const x = R(-330, 330), z = R(-420, 300), h = heightAt(x, z);
      if (Math.abs(x) < 36 && z > -220) continue;
      if (h < 1.5 && Math.abs(x) < 50) continue;
      if (rand() < .3) { // house
        const w = R(6, 10), hh = R(5, 9), dd = R(6, 9), ry = R(0, 3);
        addInst(inst.box, null, x, h + hh / 2 - 1, z, w, hh + 2, dd, pick(['#ece6da', '#e2d2b2', '#f3f0ea', '#d9c7a3']), 0, ry);
        if (rand() < .6) addInst(inst.roof, null, x, h + hh + .9, z, w * .78, 2.2, dd * .78, pick(['#b4553a', '#a94a30', '#be6545']), 0, ry + Math.PI / 4);
      } else { // umbrella pine
        const th = R(5, 9), r = R(2.6, 4.4);
        addInst(inst.trunk, null, x, h - .3, z, 1, th, 1, '#5a4434');
        addInst(inst.tree, null, x, h + th, z, r, r * .42, r * R(.85, 1.1), new THREE.Color().setHSL(R(.24, .3), R(.25, .38), R(.2, .28)));
      }
      placed++;
    }
  }

  /* ---------- parked + moving cars ---------- */
  const carParts = { body: new THREE.BoxGeometry(1.8, .75, 4.3), cabin: new THREE.BoxGeometry(1.6, .62, 2.3), wheel: new THREE.CylinderGeometry(.34, .34, .25, 14).rotateZ(Math.PI / 2) };
  const glassM = new THREE.MeshStandardMaterial({ color: '#1b232b', roughness: .1, metalness: .6 });
  const tyreM = new THREE.MeshStandardMaterial({ color: '#151515', roughness: .8 });
  function car(color) {
    const g = new THREE.Group(); const bm = new THREE.MeshStandardMaterial({ color, roughness: .35, metalness: .45 });
    add(carParts.body, bm, 0, .7, 0, { parent: g }); const cab = add(carParts.cabin, glassM, 0, 1.36, -.2, { parent: g });
    add(new THREE.BoxGeometry(1.62, .08, 2.1), bm, 0, 1.69, -.2, { parent: g }); cab.castShadow = true;
    [[-.85, 1.35], [.85, 1.35], [-.85, -1.35], [.85, -1.35]].forEach(([x, z]) => add(carParts.wheel, tyreM, x, .34, z, { parent: g }));
    scene.add(g); return g;
  }
  const carColors = ['#e8e8e6', '#1f2a3a', '#b02a2a', '#9aa0a6', '#ffffff', '#2c2c2c', '#c9c2b0', '#3d5a80'];
  for (let z = Z_START - 15; z > -190; z -= R(6, 14)) {
    if (rand() < .35) continue;
    const side = rand() < .62 ? 1 : -1;
    if (side > 0 && z < -14 && z > -52) continue; // keep the BLOM frontage clear
    const c = car(pick(carColors)); c.position.set(side * (ROAD - 1.25), 0, z); c.rotation.y = side > 0 ? Math.PI : 0;
  }
  const redCar = car('#b3262b'); redCar.position.set(ROAD - 1.25, 0, -12); redCar.rotation.y = Math.PI;
  const movers = [car('#e9e9e9'), car('#2a3f63')];
  movers[0].userData = { lane: -1.8, z0: -170, speed: 11 }; movers[1].userData = { lane: -1.8, z0: -260, speed: 9 };

  /* ================= THE BLOM BANK BUILDING — SOKUN ON THE 1ST FLOOR ================= */
  const { x0: BX0, x1: BX1, z0: BZ0, z1: BZ1 } = SOKUN; const BZC = (BZ0 + BZ1) / 2, BW = BZ1 - BZ0;
  const F1 = 4.6, F1T = 7.75, F2 = 8.65, F4 = 14.6, TOP = 17.6;
  const fadeGlass = [];
  {
    const white = new THREE.MeshStandardMaterial({ color: '#f3f2ee', roughness: .85 });
    const whiteTile = floorTile('#f3f2ee', 'wide'); const whiteWinM = new THREE.MeshStandardMaterial({ map: whiteTile, roughness: .85 });
    const forecourt = pavingTexture(); forecourt.repeat.set(3, 8);
    add(new THREE.BoxGeometry(BX0 - WALK + .4, .16, BW + 8), new THREE.MeshStandardMaterial({ map: forecourt, roughness: .95 }), (WALK + BX0) / 2, .08, BZC, { cast: false });

    // ground floor: BLOM Bank glass front + ATM wall
    add(new THREE.BoxGeometry(BX1 - BX0 - .5, F1, BW), white, (BX0 + .5 + BX1) / 2, F1 / 2, BZC);
    const bankGlass = new THREE.MeshStandardMaterial({ color: '#33424d', roughness: .08, metalness: .4, envMapIntensity: 1.2 });
    const bg = add(new THREE.PlaneGeometry(11.2, 3.2), bankGlass, BX0 + .48, 1.85, BZ0 + .9 + 5.6, { cast: false }); bg.rotation.y = -Math.PI / 2;
    for (let z = BZ0 + .9; z <= BZ0 + .9 + 11.2 + .01; z += 1.6) add(new THREE.BoxGeometry(.1, 3.2, .08), new THREE.MeshStandardMaterial({ color: '#cfd2d4', metalness: .6, roughness: .3 }), BX0 + .44, 1.85, z, { cast: false });
    add(new THREE.BoxGeometry(.6, F1, .6), white, BX0 + .3, F1 / 2, BZ0 + .3); add(new THREE.BoxGeometry(.6, F1, .6), white, BX0 + .3, F1 / 2, BZ1 - .3);
    // ATM
    add(new THREE.BoxGeometry(.35, 1.9, .95), new THREE.MeshStandardMaterial({ color: '#c9ccd1', metalness: .5, roughness: .4 }), BX0 + .35, 1.15, BZ1 - 2.2);
    add(new THREE.PlaneGeometry(.55, .4).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#4a8fd6' }), BX0 + .17, 1.55, BZ1 - 2.2, { cast: false });
    // blue BLOM BANK fascia (plain lettering)
    const blomTex = signCanvasText(1024, 96, '#1b3f95', (g, w, h) => {
      g.fillStyle = '#fff'; g.font = '800 54px Manrope, Arial, sans-serif'; spacedText(g, 'BLOM BANK', 40, h / 2 + 2, 6, 'left');
      g.font = '700 50px Amiri, serif'; g.textAlign = 'right'; g.fillText('بنك لبنان والمهجر', w - 40, h / 2 + 4);
    });
    add(new THREE.BoxGeometry(.3, .85, 12.2), [white, new THREE.MeshStandardMaterial({ map: blomTex, roughness: .5 }), white, white, white, white], BX0 + .3, 3.95, BZ0 + 6.9);

    // floor bands
    [[F1, .45], [(F1T + F2) / 2, F2 - F1T], [11.6, .4], [F4, .45]].forEach(([y, h]) => add(new THREE.BoxGeometry(.55, h, BW + .4), white, BX0 - .2, y, BZC));

    // FIRST FLOOR = SOKUN: full-height glass, see-through into the studio
    const s1Glass = new THREE.MeshStandardMaterial({ color: '#d4e4ea', roughness: .05, metalness: .1, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.5 });
    const fg = add(new THREE.PlaneGeometry(BW - .6, F1T - F1 - .2), s1Glass, BX0 + .1, (F1 + F1T) / 2, BZC, { cast: false, receive: false }); fg.rotation.y = -Math.PI / 2; fadeGlass.push(fg);
    const mull = new THREE.MeshStandardMaterial({ color: '#2c2f33', metalness: .6, roughness: .35 });
    for (let z = BZ0 + 1.25; z < BZ1 - .2; z += 1.5) add(new THREE.BoxGeometry(.08, F1T - F1, .07), mull, BX0 + .1, (F1 + F1T) / 2, z, { cast: false });
    add(new THREE.BoxGeometry(.08, .07, BW - .4), mull, BX0 + .1, 5.35, BZC, { cast: false });
    // frosted vinyl with the class list
    const vinyl = signCanvasText(2048, 64, null, (g, w, h) => {
      g.fillStyle = 'rgba(255,255,255,.88)'; g.font = '600 30px Manrope, Arial, sans-serif';
      spacedText(g, 'REFORMER  ·  PILATES  ·  BOXING  ·  CROSS FIT  ·  AERIAL YOGA  ·  ZUMBA  ·  DABKE  ·  KIDS GYMNASTICS  ·  PT  ·  DIET CLINIC', w / 2, h / 2 + 2, 4);
    });
    const vm = add(new THREE.PlaneGeometry(BW - 1, .5), new THREE.MeshBasicMaterial({ map: vinyl, transparent: true, depthWrite: false }), BX0 + .06, 5.05, BZC, { cast: false, receive: false }); vm.rotation.y = -Math.PI / 2; fadeGlass.push(vm);
    // SOKUN light-box on the band above the first floor
    const sokunBand = signCanvasText(2048, 128, '#26302a', (g, w, h) => {
      g.fillStyle = '#f3e7cf'; g.font = '400 92px Amiri, serif'; g.textAlign = 'center'; g.fillText('سكون', 190, h / 2 + 8);
      g.font = '700 74px Manrope, Arial, sans-serif'; spacedText(g, 'SOKUN', 360, h / 2 + 4, 22, 'left');
      g.fillStyle = '#e8b878'; g.fillRect(820, 34, 3, 60);
      g.font = '500 40px Manrope, Arial, sans-serif'; g.fillStyle = '#f3e7cf'; spacedText(g, 'FITNESS · DANCE · WELLNESS · DIET CLINIC', 870, h / 2 + 3, 9, 'left');
    });
    const sb = add(new THREE.PlaneGeometry(BW - .4, .8), new THREE.MeshBasicMaterial({ map: sokunBand, toneMapped: false, color: '#e9e9e9' }), BX0 - .49, (F1T + F2) / 2, BZC, { cast: false }); sb.rotation.y = -Math.PI / 2;
    // projecting blade sign, visible while driving up the street
    const blade = signCanvasText(256, 768, '#26302a', (g, w, h) => {
      g.fillStyle = '#f3e7cf'; g.font = '400 92px Amiri, serif'; g.textAlign = 'center'; g.fillText('سكون', w / 2, 100);
      g.fillStyle = '#e8b878'; g.fillRect(w / 2 - 30, 168, 60, 3);
      g.fillStyle = '#f3e7cf'; g.font = '700 96px Manrope, Arial, sans-serif'; ['S', 'O', 'K', 'U', 'N'].forEach((ch, i) => g.fillText(ch, w / 2, 260 + i * 104));
    });
    const bladeM = new THREE.MeshBasicMaterial({ map: blade, toneMapped: false, color: '#e9e9e9' });
    add(new THREE.BoxGeometry(1.2, 4, .2), [white, white, white, white, bladeM, bladeM], BX0 - .9, 10.3, BZ1 - .6);

    // upper floors: reflective glass curtain (left) + white rendered part (right)
    add(uvBox(BX1 - BX0 - .1, F4 - F2, BW, 8, 3.2), [white, whiteWinM, white, white, whiteWinM, whiteWinM], (BX0 + .1 + BX1) / 2, (F2 + F4) / 2, BZC);
    const curtain = new THREE.MeshStandardMaterial({ color: '#6f93ad', roughness: .04, metalness: .85, envMapIntensity: 1.4 });
    const cw = add(new THREE.PlaneGeometry(8, F4 - F2 - .5), curtain, BX0 + .02, (F2 + F4) / 2, BZ0 + 4.4, { cast: false }); cw.rotation.y = -Math.PI / 2;
    for (let z = BZ0 + .4; z <= BZ0 + 8.41; z += 1.6) add(new THREE.BoxGeometry(.06, F4 - F2 - .5, .06), mull, BX0, (F2 + F4) / 2, z, { cast: false });
    // set-back top floor + roof
    add(uvBox(BX1 - BX0 - 3, TOP - F4, BW - 1, 8, 3.2), [white, whiteWinM, white, white, whiteWinM, whiteWinM], (BX0 + 3 + BX1) / 2, (F4 + TOP) / 2, BZC);
    add(new THREE.BoxGeometry(BX1 - BX0 + .2, .5, BW + .2), white, (BX0 + BX1) / 2, F4 + .25, BZC);
    [[16, -44, '#1d1d1f'], [18, -44, '#e9e9e4'], [20, -36, '#1d1d1f']].forEach(([x, z, c]) => addInst(inst.tank, null, x, TOP + .6, z, 1, 1, 1, c));

    // green pharmacy cross on a pole in front
    const crossTex = signCanvasText(256, 256, null, (g) => { g.fillStyle = '#21b04b'; g.fillRect(88, 20, 80, 216); g.fillRect(20, 88, 216, 80); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(96, 28, 64, 8); });
    add(new THREE.CylinderGeometry(.06, .06, 4.4, 8), new THREE.MeshStandardMaterial({ color: '#777' }), WALK - .4, 2.2, BZ1 + 2.2);
    const cm = new THREE.MeshBasicMaterial({ map: crossTex, transparent: true, side: THREE.DoubleSide, toneMapped: false });
    add(new THREE.PlaneGeometry(1.1, 1.1), cm, WALK - .4, 4.8, BZ1 + 2.2, { cast: false });

    /* ----- inside Sokun (first floor) ----- */
    const IX0 = BX0 + .25, IX1 = BX1 - .3, IZ0 = BZ0 + .3, IZ1 = BZ1 - .3, IZC = BZC, FL = F1 + .05;
    const oak = woodTexture('#d2a777'); oak.repeat.set(4, 5);
    add(new THREE.BoxGeometry(IX1 - IX0, .06, IZ1 - IZ0), new THREE.MeshStandardMaterial({ map: oak, roughness: .45 }), (IX0 + IX1) / 2, F1 + .03, IZC, { cast: false });
    const wallM = new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: .95 });
    add(new THREE.BoxGeometry(IX1 - IX0, .15, IZ1 - IZ0), wallM, (IX0 + IX1) / 2, F1T - .02, IZC, { cast: false }); // ceiling
    add(new THREE.BoxGeometry(IX1 - IX0, F1T - F1, .25), wallM, (IX0 + IX1) / 2, (F1 + F1T) / 2, IZ0 - .12);
    add(new THREE.BoxGeometry(IX1 - IX0, F1T - F1, .25), new THREE.MeshStandardMaterial({ color: '#d9d2c5', roughness: .9 }), (IX0 + IX1) / 2, (F1 + F1T) / 2, IZ1 + .12);
    add(new THREE.BoxGeometry(.25, F1T - F1, IZ1 - IZ0), new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: .9 }), IX1 + .12, (F1 + F1T) / 2, IZC);
    add(new THREE.PlaneGeometry(7.5, F1T - F1 - .15).rotateY(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a332b', roughness: .8 }), IX1 - .01, (F1 + F1T) / 2, IZC, { cast: false }); // dark logo panel
    // LED lines in the ceiling
    const led = new THREE.MeshBasicMaterial({ color: '#fff4e2', toneMapped: false });
    [-44, -40, -36].forEach(z => add(new THREE.BoxGeometry(IX1 - IX0 - 2, .03, .12), led, (IX0 + IX1) / 2, F1T - .1, z, { cast: false }));
    // logo wall behind the reception
    const logo = signCanvasText(1024, 400, null, (g, w, h) => {
      g.textAlign = 'center'; g.fillStyle = '#f6e6c6'; g.shadowColor = 'rgba(255,190,110,.9)'; g.shadowBlur = 26;
      g.font = '400 190px Amiri, serif'; g.fillText('سكون', w / 2, 140);
      g.shadowBlur = 10; g.font = '700 92px Manrope, Arial, sans-serif'; spacedText(g, 'SOKUN', w / 2, 290, 30);
      g.font = '500 30px Manrope, Arial, sans-serif'; g.fillStyle = '#e8b878'; spacedText(g, 'FITNESS · DANCE · WELLNESS', w / 2, 360, 10);
    });
    const lg = add(new THREE.PlaneGeometry(5.6, 2.2), new THREE.MeshBasicMaterial({ map: logo, transparent: true, toneMapped: false }), IX1 - .02, 6.35, IZC, { cast: false }); lg.rotation.y = -Math.PI / 2;
    const lgGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffb766', blending: THREE.AdditiveBlending, transparent: true, opacity: .25, depthWrite: false })); lgGlow.scale.set(9, 4, 1); lgGlow.position.set(IX1 - .4, 6.35, IZC); scene.add(lgGlow);
    // reception desk
    const deskWood = woodTexture('#9c6a3f'); deskWood.repeat.set(2, 1);
    add(new THREE.BoxGeometry(.9, 1.05, 3.8), new THREE.MeshStandardMaterial({ map: deskWood, roughness: .6 }), IX1 - 2.2, FL + .52, IZC);
    add(new THREE.BoxGeometry(1.05, .06, 4), new THREE.MeshStandardMaterial({ color: '#f5f3ee', roughness: .3 }), IX1 - 2.2, FL + 1.08, IZC);
    // mirror wall + ballet barre (left)
    const mirrorM = new THREE.MeshStandardMaterial({ color: '#c9d2d6', metalness: 1, roughness: .03, envMapIntensity: .9 });
    add(new THREE.PlaneGeometry(IX1 - IX0 - 4.5, 2.7), mirrorM, (IX0 + IX1) / 2 - 1.5, FL + 1.45, IZ0 + .02, { cast: false });
    const barreM = new THREE.MeshStandardMaterial({ color: '#b7834f', roughness: .5 });
    add(new THREE.CylinderGeometry(.035, .035, IX1 - IX0 - 5, 10).rotateZ(Math.PI / 2), barreM, (IX0 + IX1) / 2 - 1.5, FL + 1.05, IZ0 + .3, { cast: false });
    // mats in two rows (Pilates / yoga), rollers and rings
    const matCols = ['#8fa287', '#c07a5a', '#3b3f3c', '#d9c7a5', '#7c8fa3'];
    for (let i = 0; i < 8; i++) {
      add(new THREE.BoxGeometry(.62, .015, 1.8), new THREE.MeshStandardMaterial({ color: matCols[i % 5], roughness: .9 }), IX0 + 2.3 + i * 1.05, FL + .01, IZ0 + 3.1, { cast: false });
      if (i % 3 === 0) add(new THREE.CylinderGeometry(.075, .075, .6, 14).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2b2b2b' }), IX0 + 2.3 + i * 1.05, FL + .09, IZ0 + 2.05);
      if (i % 3 === 1) add(new THREE.TorusGeometry(.18, .02, 8, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#e0a35c' }), IX0 + 2.3 + i * 1.05, FL + .03, IZ0 + 3.6);
    }
    // boxing corner: heavy bags (right)
    [IX0 + 3, IX0 + 5.3, IX0 + 7.6].forEach((x, i) => {
      add(new THREE.CylinderGeometry(.3, .3, 1.25, 18), new THREE.MeshStandardMaterial({ color: i === 1 ? '#8f2424' : '#1d1d1d', roughness: .5 }), x, FL + 1.35, IZ1 - 1.4);
      add(new THREE.CylinderGeometry(.012, .012, F1T - FL - 2, 4), new THREE.MeshStandardMaterial({ color: '#444', metalness: .8 }), x, (FL + 1.95 + F1T) / 2, IZ1 - 1.4, { cast: false });
    });
    add(new THREE.BoxGeometry(5.5, .03, 2.4), new THREE.MeshStandardMaterial({ color: '#2f2f2f', roughness: 1 }), IX0 + 5.3, FL + .01, IZ1 - 1.4, { cast: false }); // rubber floor
    // diet clinic: glass room in the back-right corner
    const dcX0 = IX1 - 4.6, dcZ0 = IZ1 - 3.8;
    const dcGlass = new THREE.MeshStandardMaterial({ color: '#e1ecef', transparent: true, opacity: .25, roughness: .05, depthWrite: false, side: THREE.DoubleSide });
    const dg1 = add(new THREE.PlaneGeometry(IX1 - dcX0, F1T - FL), dcGlass, (dcX0 + IX1) / 2, (FL + F1T) / 2, dcZ0, { cast: false, receive: false });
    const dg2 = add(new THREE.PlaneGeometry(IZ1 - dcZ0, F1T - FL), dcGlass, dcX0, (FL + F1T) / 2, (dcZ0 + IZ1) / 2, { cast: false, receive: false }); dg2.rotation.y = Math.PI / 2;
    const dcSign = signCanvasText(1024, 128, null, (g, w, h) => { g.fillStyle = '#2b3528'; g.font = '600 52px Manrope, Arial, sans-serif'; spacedText(g, 'DIET CLINIC', 40, h / 2, 10, 'left'); g.font = '700 58px Amiri, serif'; g.textAlign = 'right'; g.fillText('عيادة التغذية', w - 40, h / 2 + 4); });
    add(new THREE.PlaneGeometry(4, .5), new THREE.MeshBasicMaterial({ map: dcSign, transparent: true }), (dcX0 + IX1) / 2, F1T - .45, dcZ0 - .02, { cast: false, receive: false }).rotation.y = Math.PI;
    add(new THREE.BoxGeometry(1.6, .75, .8), new THREE.MeshStandardMaterial({ color: '#f2efe8' }), dcX0 + 2.4, FL + .38, IZ1 - 1.2);
    add(new THREE.BoxGeometry(.5, .9, .5), new THREE.MeshStandardMaterial({ color: '#4a5a46' }), dcX0 + 2.4, FL + .45, IZ1 - .4);
    // dumbbell rack
    add(new THREE.BoxGeometry(.6, .9, 2.6), new THREE.MeshStandardMaterial({ color: '#2b2b2b', metalness: .5, roughness: .4 }), IX1 - .6, FL + .45, IZ0 + 1.8);
    for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(.09, .09, .45, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#555', metalness: .6 }), IX1 - .6, FL + .98, IZ0 + .8 + k * .4);
    // plants by the windows
    const leaf = new THREE.MeshStandardMaterial({ color: '#4f6a3c', roughness: 1, flatShading: true });
    [[IX0 + .8, IZ0 + .8], [IX0 + .8, IZ1 - .8]].forEach(([x, z]) => {
      add(new THREE.CylinderGeometry(.4, .3, .8, 14), new THREE.MeshStandardMaterial({ color: '#e7e1d6' }), x, FL + .4, z);
      for (let k = 0; k < 5; k++) add(new THREE.IcosahedronGeometry(.45, 0), leaf, x + R(-.3, .3), FL + 1.1 + R(0, .9), z + R(-.3, .3)).scale.set(1, R(1.2, 1.7), 1);
    });
    // speakers
    [[IX0 + 1, IZ0 + .2], [IX1 - 1, IZ0 + .2]].forEach(([x, z]) => add(new THREE.BoxGeometry(.4, .6, .3), new THREE.MeshStandardMaterial({ color: '#111' }), x, F1T - .7, z));
    [[IX0 + 3, 7.3, IZC - 4], [IX0 + 3, 7.3, IZC + 4], [IX0 + 9, 7.3, IZC - 4], [IX0 + 9, 7.3, IZC + 4], [IX1 - 3, 7.2, IZC]].forEach(([x, y, z]) => { const l = new THREE.PointLight('#fff4e4', 22, 0, 1.6); l.position.set(x, y, z); scene.add(l); });
  }

  /* ---------- build instanced meshes ---------- */
  function flush(list, geo, mat, cast = true) {
    if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([M, c], i) => { m.setMatrixAt(i, M); m.setColorAt(i, c); }); m.castShadow = cast; m.receiveShadow = true; scene.add(m);
  }
  flush(inst.box, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .92 }));
  const tankGeo = new THREE.CylinderGeometry(.55, .55, 1.2, 14); flush(inst.tank, tankGeo, new THREE.MeshStandardMaterial({ roughness: .6 }));
  const trunkGeo = new THREE.CylinderGeometry(.14, .24, 1, 6); trunkGeo.translate(0, .5, 0); flush(inst.trunk, trunkGeo, new THREE.MeshStandardMaterial({ roughness: 1 }));
  flush(inst.tree, new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: .95, flatShading: true }));
  const roofGeo = new THREE.ConeGeometry(1, 1, 4); flush(inst.roof, roofGeo, new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true }));

  /* ================= CAMERA PATH ================= */
  // drive up the right lane → slow, swing toward BLOM Bank → rise to the 1st floor → glide through the glass → inside
  const camCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.9, 1.55, 95), new THREE.Vector3(1.9, 1.55, 58), new THREE.Vector3(1.6, 1.6, 22),
    new THREE.Vector3(-.6, 1.9, -6), new THREE.Vector3(-3.4, 2.8, -27), new THREE.Vector3(-3.2, 4.3, -37.5),
    new THREE.Vector3(1.5, 5.7, -40), new THREE.Vector3(6.4, 6.2, -40), new THREE.Vector3(10.6, 6.25, -40), new THREE.Vector3(14.5, 6.25, -40), new THREE.Vector3(18.6, 6.25, -40),
  ], false, 'centripetal', .5);
  const FACADE = new THREE.Vector3(BX0, 6.6, BZC), LOGO = new THREE.Vector3(BX1 - .3, 6.25, BZC);
  const look = new THREE.Vector3(), tmp = new THREE.Vector3(), focus = new THREE.Vector3();

  function placeCamera(p, time = 0) {
    p = Math.min(1, Math.max(0, p || 0));
    camCurve.getPointAt(p, camera.position);
    camCurve.getPointAt(Math.min(p + .03, 1), look); look.y = Math.max(look.y, camera.position.y) + .15;
    if (p < .5) look.z -= 4; // look down the street
    look.lerp(FACADE, smooth(.3, .5, p));
    look.lerp(LOGO, smooth(.66, .84, p));
    camera.position.y += Math.sin(time * 1.1) * .025;
    camera.lookAt(look);
    const fade = 1 - smooth(6.2, 8.9, camera.position.x);
    fadeGlass.forEach(g => { g.material.opacity = (g.material.map ? 1 : .2) * fade; g.visible = fade > .01; });
  }
  function animateAmbient(time) {
    skyMat.uniforms.uTime.value = time;
    movers.forEach(c => { const u = c.userData; c.position.set(u.lane, 0, -190 + ((u.z0 + 500 + time * u.speed) % 320)); });
    sky.position.copy(camera.position);
    camera.getWorldDirection(tmp); focus.copy(camera.position).addScaledVector(tmp, 30);
    sun.position.copy(focus).addScaledVector(sunDir, 140); sun.target.position.copy(focus);
  }
  const render = () => renderer.render(scene, camera);
  return {
    renderer, scene, camera,
    update(t, time) { placeCamera(t, time); animateAmbient(time); render(); },
    idle(time) {
      placeCamera(1, 0);
      camera.position.set(15.2 + Math.sin(time * .12) * .5, 6.3 + Math.sin(time * .17) * .08, -40.8);
      camera.lookAt(LOGO.x, 6.0, LOGO.z - 3.4 + Math.sin(time * .09) * .5);
      animateAmbient(time); render();
    },
    compile() { placeCamera(0); animateAmbient(0); renderer.compile(scene, camera); },
    resize() { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); },
  };
}
