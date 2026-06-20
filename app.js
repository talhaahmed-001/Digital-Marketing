/* =========================================================
   BOREALIS — app.js
   Particle spheres, loader, scroll reveals, Three.js scenes
   ========================================================= */

/* ---------- 1. LOADER SEQUENCE ---------- */
(function loaderSequence(){
  const pctEl = document.getElementById('loaderPct');
  const statusEl = document.getElementById('loaderStatus');
  const fillEl = document.getElementById('loaderFill');
  const loader = document.getElementById('loader');

  const messages = [
    "Booting up cooling system",
    "Calibrating thermal sensors",
    "Balancing coolant loops",
    "Sequencing pump arrays"
  ];

  let pct = 0;
  let msgIndex = 0;
  statusEl.textContent = messages[0];

  const msgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % messages.length;
    statusEl.textContent = messages[msgIndex];
  }, 480);

  const pctInterval = setInterval(() => {
    pct += Math.random() * 9 + 4;
    if (pct >= 100) {
      pct = 100;
      pctEl.textContent = '100%';
      fillEl.style.width = '100%';
      clearInterval(pctInterval);
      clearInterval(msgInterval);
      statusEl.textContent = "Systems online";
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }, 400);
      return;
    }
    pctEl.textContent = Math.floor(pct) + '%';
    fillEl.style.width = pct + '%';
  }, 140);
})();

/* ---------- 2. GLOBAL FIXED BACKGROUND SPHERE ---------- */
/* A SINGLE sphere, pinned to the center of the viewport, that never
   resets or jumps between sections. As the person scrolls, we detect
   which section is centered in the viewport and smoothly cross-fade
   the sphere's color toward that section's palette — exactly like
   the reference, where the sphere itself stays visually still and
   only its color shifts with scroll position. */

const SPHERE_COLORS = {
  default: { c1:{r:160,g:220,b:235}, c2:{r:120,g:235,b:190}, ring:{r:150,g:200,b:210} },
  orange:  { c1:{r:255,g:150,b:70 }, c2:{r:255,g:100,b:40 }, ring:{r:255,g:140,b:80 } },
  red:     { c1:{r:235,g:90, b:60 }, c2:{r:255,g:150,b:60 }, ring:{r:235,g:120,b:70 } },
  green:   { c1:{r:80, g:230,b:150}, c2:{r:60, g:200,b:130}, ring:{r:90, g:220,b:160} },
  purple:  { c1:{r:175,g:110,b:235}, c2:{r:140,g:90, b:220}, ring:{r:165,g:120,b:230} },
  blue:    { c1:{r:90, g:200,b:235}, c2:{r:70, g:160,b:230}, ring:{r:95, g:200,b:232} }
};

class BackgroundSphere {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.time = 0;

    // current displayed color (lerped) and the color we're easing toward
    this.current = this.cloneColor(SPHERE_COLORS.default);
    this.target = SPHERE_COLORS.default;

    this.resize();
    this.buildParticles();
    window.addEventListener('resize', () => { this.resize(); this.buildParticles(); });
  }

  cloneColor(p){
    return {
      c1:{...p.c1}, c2:{...p.c2}, ring:{...p.ring}
    };
  }

  setTarget(key){
    this.target = SPHERE_COLORS[key] || SPHERE_COLORS.default;
  }

  resize(){
    this.w = this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.h = this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.radius = Math.min(this.w, this.h) * 0.34;
  }

  buildParticles(){
    this.particles = [];
    const count = window.innerWidth < 700 ? 3600 : 7500;
    for (let i = 0; i < count; i++){
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const shellBias = Math.pow(Math.random(), 0.35);
      const jitter = 0.55 + shellBias * 0.55;
      const r = this.radius * jitter;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      this.particles.push({
        baseX: x, baseY: y, baseZ: z,
        size: Math.random() * 1.1 + 0.25,
        alpha: Math.random() * 0.65 + 0.2,
        mix: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.006,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  lerpColors(){
    const speed = 0.045; // cross-fade speed: smooth, not instant, not sluggish
    ['c1','c2','ring'].forEach(key => {
      ['r','g','b'].forEach(ch => {
        this.current[key][ch] += (this.target[key][ch] - this.current[key][ch]) * speed;
      });
    });
  }

  draw(){
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    this.time += 0.0012; // slow ambient drift only — the sphere reads as "still"
    this.lerpColors();

    const rotY = this.time;
    const rotX = Math.sin(this.time * 0.3) * 0.08;

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    const { c1, c2, ring } = this.current;

    ctx.strokeStyle = `rgba(${ring.r},${ring.g},${ring.b},0.16)`;
    ctx.lineWidth = 1 * window.devicePixelRatio;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${ring.r},${ring.g},${ring.b},0.09)`;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius * 1.92, 0, Math.PI * 2);
    ctx.stroke();

    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.radius * 1.15);
    grad.addColorStop(0,   `rgba(${c1.r},${c1.g},${c1.b},0.22)`);
    grad.addColorStop(0.5, `rgba(${c2.r},${c2.g},${c2.b},0.10)`);
    grad.addColorStop(1,   `rgba(${c2.r},${c2.g},${c2.b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < this.particles.length; i++){
      const p = this.particles[i];
      let x = p.baseX * cosY - p.baseZ * sinY;
      let z = p.baseX * sinY + p.baseZ * cosY;
      let y = p.baseY * cosX - z * sinX;
      z = p.baseY * sinX + z * cosX;

      const scale = 700 / (700 + z);
      const sx = this.cx + x * scale;
      const sy = this.cy + y * scale;

      const twinkle = Math.sin(this.time * 60 * p.twinkleSpeed + p.twinklePhase) * 0.3 + 0.7;
      const depthAlpha = (z + this.radius) / (this.radius * 2);
      const alpha = p.alpha * twinkle * (0.35 + depthAlpha * 0.65);

      const cr = c1.r + (c2.r - c1.r) * p.mix;
      const cg = c1.g + (c2.g - c1.g) * p.mix;
      const cb = c1.b + (c2.b - c1.b) * p.mix;

      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * scale * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const bgCanvas = document.getElementById('bgSphere');
const bgSphere = bgCanvas ? new BackgroundSphere(bgCanvas) : null;

/* Detect which section is centered in the viewport and tell the
   sphere what color to ease toward. Sections marked data-bg="none"
   hide the global canvas entirely so it doesn't show through behind
   any future section that renders its own background. */
const bgSections = Array.from(document.querySelectorAll('section[data-bg]'));

function updateBgColorFromScroll(){
  if (!bgSphere) return;
  const viewportCenter = window.innerHeight / 2;
  let closest = null;
  let closestDist = Infinity;

  bgSections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const secCenter = rect.top + rect.height / 2;
    const dist = Math.abs(secCenter - viewportCenter);
    if (dist < closestDist){
      closestDist = dist;
      closest = sec;
    }
  });

  if (!closest) return;
  const key = closest.dataset.bg;
  if (key === 'none'){
    bgCanvas.style.opacity = '0';
  } else {
    bgCanvas.style.opacity = '1';
    bgSphere.setTarget(key);
  }
}

window.addEventListener('scroll', updateBgColorFromScroll, { passive: true });
updateBgColorFromScroll();

function animateBgSphere(){
  if (bgSphere) bgSphere.draw();
  requestAnimationFrame(animateBgSphere);
}
requestAnimationFrame(animateBgSphere);

/* ---------- 3. SCROLL REVEAL ---------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('in');
    }
  });
}, { threshold: 0.2 });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------- 4. BAR FILL ANIMATION (Mismatch section) ---------- */
const barFills = document.querySelectorAll('.bar-fill');
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      barFills.forEach(bar => {
        const target = bar.dataset.target;
        requestAnimationFrame(() => { bar.style.width = target + '%'; });
      });
      barObserver.disconnect();
    }
  });
}, { threshold: 0.3 });
const mismatchPanel = document.querySelector('.compare-panel');
if (mismatchPanel) barObserver.observe(mismatchPanel);

/* ---------- 5. SMOOTH NAV SCROLL (offset for fixed nav) ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e){
    const targetId = this.getAttribute('href');
    if (targetId.length < 2) return;
    const target = document.querySelector(targetId);
    if (target){
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
