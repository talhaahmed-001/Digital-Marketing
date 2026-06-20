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
   (Halo / Vega, which render their own Three.js scene) hide the
   global canvas entirely so it doesn't show through. */
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

/* ---------- 5. THREE.JS PRODUCT SCENES ---------- */
/* Stylized data-hall scenes: glowing server racks + curved coolant
   pipes inside a particle-walled "room", evoking the reference
   renders without claiming to be the original proprietary 3D asset. */

function createProductScene(canvasId, options){
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  const wrap = canvas.parentElement;
  let width = wrap.clientWidth, height = wrap.clientHeight;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
  camera.position.set(options.camPos.x, options.camPos.y, options.camPos.z);
  camera.lookAt(0, 0.3, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  scene.add(new THREE.AmbientLight(0x405060, 0.7));
  const key = new THREE.PointLight(0x9fe8f5, 2.2, 60);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(options.accent, 1.8, 40);
  rim.position.set(-4, 1.5, -3);
  scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, 0.5, 30);
  fill.position.set(0, 3, 4);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  /* --- room-shaped particle field: floor plane + back wall, like
     the reference's dotted "box" the hardware sits inside --- */
  function buildWallParticles(count, w, h, plane){
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++){
      const a = (Math.random() - 0.5) * w;
      const b = (Math.random() - 0.5) * h;
      if (plane === 'floor'){
        positions[i*3] = a; positions[i*3+1] = -1.55; positions[i*3+2] = b - 1;
      } else if (plane === 'back'){
        positions[i*3] = a; positions[i*3+1] = b; positions[i*3+2] = -3.2;
      } else { // side
        positions[i*3] = -w/2 + (plane === 'right' ? w : 0); positions[i*3+1] = b; positions[i*3+2] = a - 1;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xbfe9f0, size: 0.018, transparent: true, opacity: 0.5 });
    return new THREE.Points(geo, mat);
  }
  const floorParticles = buildWallParticles(2600, options.roomW, options.roomD, 'floor');
  const backParticles = buildWallParticles(2200, options.roomW, options.roomH, 'back');
  const leftParticles = buildWallParticles(1400, options.roomD, options.roomH, 'left');
  const rightParticles = buildWallParticles(1400, options.roomD, options.roomH, 'right');
  scene.add(floorParticles, backParticles, leftParticles, rightParticles);

  /* --- server racks --- */
  const rackCount = options.rackCount;
  const rackGeo = new THREE.BoxGeometry(0.62, 2.4, 0.85);
  const rackMatDark = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, metalness: 0.75, roughness: 0.3 });
  for (let i = 0; i < rackCount; i++){
    const xPos = (i - (rackCount - 1) / 2) * 0.78;
    const rack = new THREE.Mesh(rackGeo, rackMatDark.clone());
    rack.position.set(xPos, -0.2, 0);
    group.add(rack);

    // top highlight cap
    const capGeo = new THREE.BoxGeometry(0.62, 0.05, 0.85);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x3a4a52, metalness: 0.9, roughness: 0.2, emissive: 0x1a2a30, emissiveIntensity: 0.4 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(xPos, 1.02, 0);
    group.add(cap);

    // vertical glow strip (front face)
    const stripGeo = new THREE.PlaneGeometry(0.07, 1.7);
    const stripMat = new THREE.MeshBasicMaterial({ color: options.accent, transparent: true, opacity: 0.9 });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(xPos - 0.15, -0.15, 0.43);
    group.add(strip);

    // indicator squares near top
    for (let j = 0; j < 2; j++){
      const ledGeo = new THREE.PlaneGeometry(0.07, 0.07);
      const ledMat = new THREE.MeshBasicMaterial({ color: j === 0 ? options.accent : 0x2a2e33 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(xPos + 0.1 + j * 0.13, 0.75, 0.431);
      group.add(led);
    }
  }

  /* --- arc coolant pipes spanning above the racks (matches the
     simple dual-arc look in the reference) --- */
  function buildArcPipe(color, yBase, archHeight, zPos){
    const span = rackCount * 0.78 + 0.5;
    const points = [];
    const segs = 24;
    for (let i = 0; i <= segs; i++){
      const t = i / segs;
      const x = (t - 0.5) * span;
      const y = yBase + Math.sin(t * Math.PI) * archHeight;
      points.push(new THREE.Vector3(x, y, zPos));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 48, 0.055, 10, false);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.85, metalness: 0.2, roughness: 0.35
    });
    return new THREE.Mesh(geo, mat);
  }

  const pipeCold = buildArcPipe(0x5fd8e8, 1.5, 0.55, 0.05);
  const pipeHot = buildArcPipe(0xff6a3d, 1.35, 0.62, -0.1);
  group.add(pipeCold, pipeHot);

  // faint floor grid beneath racks for ground reference
  const grid = new THREE.GridHelper(rackCount * 1.2, 14, 0x1c2026, 0x12141a);
  grid.position.y = -1.46;
  group.add(grid);

  group.position.y = options.groupY;

  function onResize(){
    width = wrap.clientWidth; height = wrap.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  let t = 0;
  let visible = true;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { visible = e.isIntersecting; });
  }, { threshold: 0.05 });
  io.observe(wrap);

  function animate(){
    requestAnimationFrame(animate);
    if (!visible) return;
    t += 0.005;
    group.rotation.y = Math.sin(t * 0.4) * 0.14 + options.baseRotY;
    backParticles.rotation.z += 0.00015;
    key.position.x = 3 + Math.sin(t) * 1.2;
    renderer.render(scene, camera);
  }
  animate();
}

createProductScene('threeHalo', {
  camPos: { x: 2.8, y: 1.3, z: 6.2 },
  accent: 0x5fd8e8,
  rackCount: 7,
  groupY: -0.25,
  baseRotY: 0.28,
  roomW: 9, roomH: 6, roomD: 7
});

createProductScene('threeVega', {
  camPos: { x: 2.4, y: 1.1, z: 5.4 },
  accent: 0xc9a14a,
  rackCount: 3,
  groupY: -0.15,
  baseRotY: -0.25,
  roomW: 7, roomH: 5, roomD: 6
});

/* ---------- 6. SMOOTH NAV SCROLL (offset for fixed nav) ---------- */
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
