import { createScene } from './scene.js';

const C = window.SOKUN || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const body = document.body;

/* ================= Content from config ================= */
function fillContent() {
  $('#year').textContent = new Date().getFullYear();

  $('#treatmentCards').innerHTML = (C.treatments || []).map((t, i) => `
    <article class="card reveal" data-ar="${t.ar || ''}">
      <span class="idx">${String(i + 1).padStart(2, '0')}</span>
      <h3>${t.title}</h3>
      <p>${t.text}</p>
      ${t.meta ? `<span class="meta">${t.meta}</span>` : ''}
    </article>`).join('');

  $('#gallery').innerHTML = (C.gallery || []).map(g => `
    <figure class="tile tone-${g.tone || 'stone'} ${g.wide ? 'wide' : ''} reveal">
      <div class="bg" ${g.image ? `style="background-image:url('${g.image}')"` : ''}></div>
      <span>${g.label}</span>
    </figure>`).join('');

  const wa = C.whatsapp ? `https://wa.me/${C.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Sokun, I would like to book a session.')}` : '';
  const ig = C.instagram ? `https://instagram.com/${C.instagram.replace('@', '')}` : '';
  const rows = [
    ['Address', C.address],
    ['Hours', (C.hours || []).map(([d, h]) => `${d} &nbsp;·&nbsp; ${h}`).join('<br>')],
    ['Phone', C.phone && `<a href="tel:${C.phone.replace(/\s/g, '')}">${C.phone}</a>`],
    ['Email', C.email && `<a href="mailto:${C.email}">${C.email}</a>`],
    ['Instagram', ig && `<a href="${ig}" target="_blank" rel="noopener">@${C.instagram.replace('@', '')}</a>`],
  ].filter(([, v]) => v);
  $('#visitInfo').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  const btns = [];
  if (wa) btns.push(`<a class="btn btn-dark" href="${wa}" target="_blank" rel="noopener">Book on WhatsApp</a>`);
  if (C.phone) btns.push(`<a class="btn btn-line" href="tel:${C.phone.replace(/\s/g, '')}">Call us</a>`);
  if (ig) btns.push(`<a class="btn btn-line" href="${ig}" target="_blank" rel="noopener">Instagram</a>`);
  $('#contactButtons').innerHTML = btns.join('');

  // "Book" buttons go straight to WhatsApp when a number is set
  if (wa) $$('.js-book').forEach(a => { a.href = wa; a.target = '_blank'; a.rel = 'noopener'; });

  $('#mapFrame').src = `https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery || 'Bikfaya, Lebanon')}&z=15&output=embed`;
}

/* ================= Site behaviour ================= */
function initSite() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * .75);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open);
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; io.observe(el); });
}

/* ================= Intro ================= */
const DURATION = 19; // seconds for the full walk-in
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // cubic in-out
// slightly faster through the street, slower at the door
const pathOf = t => ease(t);
function smoothT(a, b, v) { const x = Math.min(1, Math.max(0, (v - a) / (b - a))); return x * x * (3 - 2 * x); }

let scene = null, mode = 'intro', start = 0, raf = 0, lastIdle = 0;
const captions = $$('.caption');
const whiteout = $('#whiteout');
const progressBar = $('#introProgress');

function loop(now) {
  raf = requestAnimationFrame(loop);
  const time = now / 1000;
  if (mode === 'intro') {
    const t = Math.min(1, (now - start) / 1000 / DURATION);
    scene.update(pathOf(t), time);
    progressBar.style.width = (t * 100) + '%';
    captions.forEach(c => c.classList.toggle('on', t >= +c.dataset.at && t < +c.dataset.until));
    whiteout.style.opacity = smoothT(.9, .985, t);
    if (t >= 1) finishIntro();
  } else if (mode === 'idle') {
    // live 3D interior as the hero background (only while visible)
    if (window.scrollY < window.innerHeight * 1.05 && document.visibilityState === 'visible' && now - lastIdle > 30) {
      lastIdle = now; scene.idle(time);
    }
  }
}

function finishIntro() {
  if (mode !== 'intro') return;
  mode = 'idle'; lastIdle = 0;
  const already = parseFloat(whiteout.style.opacity || 0) > .95;
  whiteout.style.transition = 'opacity .6s ease';
  whiteout.style.opacity = 1;
  setTimeout(() => {
    body.classList.remove('intro-playing');
    captions.forEach(c => c.classList.remove('on'));
    window.scrollTo(0, 0);
    whiteout.style.transition = 'opacity 1.8s cubic-bezier(.22,.8,.2,1)';
    whiteout.style.opacity = 0;
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  }, already ? 60 : 650);
}

function playIntro() {
  if (!scene) return;
  window.scrollTo(0, 0);
  body.classList.add('intro-playing');
  whiteout.style.transition = 'none'; whiteout.style.opacity = 0;
  $$('.hero .reveal').forEach(el => el.classList.remove('in'));
  mode = 'intro'; start = performance.now();
}

async function boot() {
  fillContent();
  initSite();

  const fill = $('#loaderFill');
  const loader = $('#introLoader');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 760px)').matches || /Mobi|Android/i.test(navigator.userAgent);

  // fonts are drawn into 3D signs, so wait for them (max 2.5s)
  fill.style.width = '25%';
  await Promise.race([
    Promise.all(['400 100px Amiri', '600 100px Manrope', '500 40px Manrope'].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 2500)),
  ]).catch(() => {});
  fill.style.width = '55%';
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));

  try {
    scene = createScene($('#scene'), { mobile });
    scene.compile();
  } catch (err) {
    console.warn('3D intro unavailable, showing site directly.', err);
    loader.classList.add('done'); $('#scene').style.background = '#2b3528';
    mode = 'none'; body.classList.remove('intro-playing');
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
    $('#replayIntro').hidden = true;
    return;
  }
  fill.style.width = '100%';
  window.addEventListener('resize', () => scene.resize());

  setTimeout(() => {
    loader.classList.add('done');
    if (C.playIntro === false || reduced) {
      mode = 'intro'; start = performance.now() - DURATION * 1000; // jump to the end
    } else {
      playIntro();
    }
    raf = requestAnimationFrame(loop);
  }, 350);

  $('#skipIntro').addEventListener('click', finishIntro);
  window.addEventListener('keydown', e => { if (mode === 'intro' && (e.key === 'Escape' || e.key === 'Enter')) finishIntro(); });
  $('#replayIntro').addEventListener('click', playIntro);
}

boot();
