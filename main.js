const wallCanvas = document.getElementById('wall-canvas');
const wallCtx = wallCanvas.getContext('2d');
const grainCanvas = document.getElementById('grain-canvas');
const grainCtx = grainCanvas.getContext('2d');
const specimenCanvas = document.getElementById('specimen-canvas');
const specimenCtx = specimenCanvas.getContext('2d');
const focusCanvas = document.getElementById('focus-canvas');
const focusCtx = focusCanvas.getContext('2d');

const statusPill = document.getElementById('status-pill');
const hudDeck = document.getElementById('hud-deck');
const chromeToggle = document.getElementById('chrome-toggle');
const guideToggle = document.getElementById('guide-toggle');
const guide = document.getElementById('guide');
const guideClose = document.getElementById('guide-close');
const enterButton = document.getElementById('enter-button');
const skipButton = document.getElementById('skip-button');
const onboarding = document.getElementById('onboarding');
const onboardingCopy = document.querySelector('.onboarding-copy');
const onboardingVisual = document.querySelector('.onboarding-visual');
const controls = document.getElementById('controls');

const onboardingStep = document.getElementById('onboarding-step');
const onboardingHeading = document.getElementById('onboarding-heading');
const onboardingText = document.getElementById('onboarding-text');
const onboardingNote = document.getElementById('onboarding-note');
const specimenList = document.querySelector('.specimen-list');
const onboardingActions = document.querySelector('.onboarding-actions');
const entryTitle = document.getElementById('entry-title');
const entryCategory = document.getElementById('entry-category');
const entrySource = document.getElementById('entry-source');
const calloutTitle = document.getElementById('callout-title');
const calloutCategory = document.getElementById('callout-category');
const calloutStructure = document.getElementById('callout-structure');
const specimenCallouts = Array.from(document.querySelectorAll('.callout'));

const inspectorTitle = document.getElementById('inspector-title');
const inspectorSummary = document.getElementById('inspector-summary');
const inspectorCategory = document.getElementById('inspector-category');
const inspectorSource = document.getElementById('inspector-source');
const inspectorPublished = document.getElementById('inspector-published');
const inspectorLink = document.getElementById('inspector-link');
const wallTip = document.getElementById('wall-tip');
const wallTipClose = document.getElementById('wall-tip-close');

const focus = document.getElementById('focus');
const focusTitle = document.getElementById('focus-title');
const focusCategory = document.getElementById('focus-category');
const focusSource = document.getElementById('focus-source');
const focusPublished = document.getElementById('focus-published');
const focusCopy = document.getElementById('focus-copy');
const focusLink = document.getElementById('focus-link');
const focusClose = document.getElementById('focus-close');
const focusDetailTitle = document.getElementById('focus-detail-title');
const focusDetailBody = document.getElementById('focus-detail-body');
const focusStage = document.querySelector('.focus-stage');
const focusMarkers = Array.from(document.querySelectorAll('.focus-marker'));
const focusProbes = Array.from(document.querySelectorAll('.focus-probe'));

const motionRange = document.getElementById('motion-range');
const connectionRange = document.getElementById('connection-range');
const contrastRange = document.getElementById('contrast-range');
const categorySelect = document.getElementById('category-select');
const categoryColor = document.getElementById('category-color');

const ENDPOINT = '/api/scene';
const PALETTE_STORAGE_KEY = 'searching_palette_overrides_v3';
const ACCENT_POOL = ['#7ee7ff', '#ff6bd6', '#f4ec71', '#80ff9f', '#ffa26b', '#8e7dff'];

const ONBOARDING_STEPS = [
  {
    heading: 'Welcome to Searching.',
    text: 'This wall turns live Google Trends searches into a moving field of clusters. We will look at one live signal first, then open the full wall.',
    note: 'Choose the walkthrough to learn the visual system, or skip straight into the wall.',
  },
  {
    heading: 'One search becomes one cluster.',
    text: 'The bright center is the search itself. Everything around it grows from that same live signal.',
    note: 'This example comes from the live feed. It is not a fake tutorial object.',
  },
  {
    heading: 'Traffic changes scale and orbit.',
    text: 'More attention makes the cluster feel larger and adds more rings around it. That gives you a quick sense of how active the search is.',
    note: 'More rings means more search activity right now.',
  },
  {
    heading: 'Category shapes color and texture.',
    text: 'Category changes the color and the surface feel. The specific search adds enough variation to keep each cluster distinct.',
    note: 'After this step, the full wall opens and the guide explains the project in more depth.',
  },
];

const CATEGORY_STYLES = {
  'Autos and Vehicles': { base: '#64d4ff', form: 'vector' },
  'Beauty and Fashion': { base: '#ff4d7d', form: 'ribbon' },
  'Business and Finance': { base: '#f4b942', form: 'ledger' },
  Climate: { base: '#4dd4e8', form: 'atmosphere' },
  Entertainment: { base: '#d945ff', form: 'flare' },
  'Food and Drink': { base: '#ff8c42', form: 'petal' },
  Games: { base: '#6a9aff', form: 'arcade' },
  Health: { base: '#42d9a8', form: 'pulse' },
  'Hobbies and Leisure': { base: '#c78dff', form: 'weave' },
  'Jobs and Education': { base: '#5eb8ff', form: 'grid' },
  'Law and Government': { base: '#ff5555', form: 'shard' },
  'Pets and Animals': { base: '#ffb347', form: 'orbit' },
  Politics: { base: '#ff4769', form: 'spoke' },
  Science: { base: '#64b5ff', form: 'spectrum' },
  Shopping: { base: '#ff7f5c', form: 'prism' },
  Sports: { base: '#bfff00', form: 'arc' },
  Technology: { base: '#00e5ff', form: 'circuit' },
  'Travel and Transportation': { base: '#00d084', form: 'trail' },
  Other: { base: '#b0b8d4', form: 'halo' },
};

const PLACEHOLDER_CLUSTER = {
  id: 'placeholder',
  title: 'Live search',
  category: 'Other',
  subCategory: 'General',
  link: '',
  published: '',
  pictureSource: 'Google Trends RSS',
  news: [],
  trafficValue: 1200,
  dna: {
    x: 0.5, y: 0.5, baseScale: 0.86, driftSpeed: 0.03, phase: 1.2, spin: 0.001,
    ringCount: 4, shards: 6, density: 0.42, texture: 'mist', prominence: 0.32,
  },
};

function fallbackTrend(title, category, subCategory, trafficValue, x, y) {
  return {
    id: `fallback-${title.toLowerCase().replace(/\s+/g, '-')}`,
    title, category, subCategory, link: '', published: '',
    pictureSource: 'Offline cache',
    news: [{ title: 'Using a local specimen while the live feed reconnects.', source: 'SEARCHING' }],
    trafficValue,
    dna: {
      x, y, baseScale: 0.82, driftSpeed: 0.028, phase: (hashString(title) % 360) * (Math.PI / 180),
      spin: 0.0012, ringCount: 4 + (hashString(title) % 4), shards: 6 + (hashString(title) % 5),
      density: 0.45, texture: 'mist', prominence: 0.42,
    },
  };
}

function createFallbackScene() {
  return {
    app: 'SEARCHING', title: 'Offline specimen set', source: 'local', geo: 'US',
    fetchedAt: new Date().toISOString(), count: 5,
    trends: [
      fallbackTrend('Champions League final', 'Sports', 'Soccer', 180000, 0.22, 0.64),
      fallbackTrend('Flood watch', 'Climate', 'Severe Weather', 120000, 0.5, 0.48),
      fallbackTrend('OpenAI model', 'Technology', 'AI', 90000, 0.72, 0.36),
      fallbackTrend('Market futures', 'Business and Finance', 'Markets', 110000, 0.65, 0.7),
      fallbackTrend('Summer movie trailer', 'Entertainment', 'Film & TV', 80000, 0.36, 0.3),
    ],
  };
}

const state = {
  viewport: { width: window.innerWidth, height: window.innerHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) },
  wall: { width: window.innerWidth, height: window.innerHeight },
  specimen: { width: 0, height: 0 },
  focus: { width: 0, height: 0 },
  scene: null, clusters: [], hoverId: null, lockId: null, focusId: null,
  focusAttribute: 'overview', chromeHidden: false, selectedCategory: 'Other',
  onboardingStep: 0, onboardingReveal: 0,
  paletteOverrides: readPaletteOverrides(),
  controls: {
    motion: Number(motionRange.value) || 0.8,
    connections: Number(connectionRange.value) || 1,
    contrast: Number(contrastRange.value) || 1,
  },
};

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function mix(a, b, t) { return a + (b - a) * t; }

function hashString(text = '') {
  let value = 0;
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 33 + text.charCodeAt(i)) % 2147483647;
  }
  return value;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(Math.round(mix(r, 255, amount)), Math.round(mix(g, 255, amount)), Math.round(mix(b, 255, amount)));
}

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(Math.round(mix(r, 0, amount)), Math.round(mix(g, 0, amount)), Math.round(mix(b, 0, amount)));
}

function alpha(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${amount})`;
}

function seededValue(seed, index, offset = 0) {
  const value = Math.sin(seed * 0.013 + index * 12.9898 + offset * 78.233) * 43758.5453123;
  return value - Math.floor(value);
}

function displayTitle(text = '') { return String(text || '').toUpperCase(); }

function searchBandLabel(value) {
  if (value >= 100000) return '100K+';
  if (value >= 10000) return '10K+';
  return '1K+';
}

function blendHex(a, b, amount) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(Math.round(mix(from.r, to.r, amount)), Math.round(mix(from.g, to.g, amount)), Math.round(mix(from.b, to.b, amount)));
}

function compactSource(source = '') {
  const normalized = String(source || 'Google Trends RSS').trim();
  if (normalized.length <= 28) return normalized;
  return `${normalized.slice(0, 25)}...`;
}

function formatPublishedDate(value = '') {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function replayOnboardingReveal() {
  if (!onboardingCopy) return;
  onboardingCopy.classList.remove('is-revealing');
  void onboardingCopy.offsetWidth;
  onboardingCopy.classList.add('is-revealing');
}

function primaryStory(cluster) {
  const story = cluster?.news?.[0] || {};
  return {
    url: story.url || cluster.link || '',
    source: story.source || cluster.pictureSource || 'Google Trends RSS',
    title: story.title || '',
  };
}

function categoryDisplay(cluster) {
  return cluster.subCategory && cluster.subCategory !== 'General'
    ? `${cluster.category} / ${cluster.subCategory}`
    : cluster.category;
}

function readPaletteOverrides() {
  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_error) { return {}; }
}

function writePaletteOverrides() {
  try { window.localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(state.paletteOverrides)); } catch (_error) {}
}

function defaultStyleFor(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
}

function paletteBase(category) {
  return state.paletteOverrides[category] || defaultStyleFor(category).base;
}

function paletteFor(cluster) {
  const base = paletteBase(cluster.category);
  const contrast = state.controls.contrast;
  const subHash = hashString(cluster.subCategory || cluster.title || '') % 100;
  const accent = ACCENT_POOL[hashString(cluster.title || cluster.category) % ACCENT_POOL.length];
  const lift = mix(0.16, 0.28, subHash / 100);
  const sink = mix(0.18, 0.34, (100 - subHash) / 100);
  return [
    lighten(base, clamp(lift * contrast, 0.08, 0.38)),
    blendHex(base, accent, 0.28),
    darken(base, clamp(sink / contrast, 0.12, 0.4)),
  ];
}

function fitCanvasToElement(canvas, ctx, rect) {
  const dpr = state.viewport.dpr;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function positionInspector(cluster) {
  if (!cluster) return;
  const point = currentPoint(cluster, performance.now(), 'wall');
  const inspectorWidth = Math.min(320, state.viewport.width - 40);
  const offsetX = point.x < state.viewport.width * 0.56 ? point.radius * 1.24 : -(inspectorWidth + point.radius * 1.04);
  const x = clamp(point.x + offsetX, 20, state.viewport.width - inspectorWidth - 20);
  const y = clamp(point.y, 110, state.viewport.height - 120);
  document.documentElement.style.setProperty('--inspector-x', `${x}px`);
  document.documentElement.style.setProperty('--inspector-y', `${y}px`);
}

function resize() {
  state.viewport.width = window.innerWidth;
  state.viewport.height = window.innerHeight;
  state.viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);

  const wallRect = { width: window.innerWidth, height: window.innerHeight };
  fitCanvasToElement(wallCanvas, wallCtx, wallRect);
  fitCanvasToElement(grainCanvas, grainCtx, wallRect);
  state.wall.width = wallRect.width;
  state.wall.height = wallRect.height;

  const specimenRect = onboardingVisual.getBoundingClientRect();
  fitCanvasToElement(specimenCanvas, specimenCtx, specimenRect);
  state.specimen.width = specimenRect.width;
  state.specimen.height = specimenRect.height;

  const focusRect = focusStage.getBoundingClientRect();
  fitCanvasToElement(focusCanvas, focusCtx, focusRect);
  state.focus.width = focusRect.width;
  state.focus.height = focusRect.height;

  drawGrain();
  layoutSpecimenCallouts();
  layoutFocusMarkers();
}

// ------------------------------------------------------------------
// GLOBAL TACTILE NOISE / HALFTONE
// ------------------------------------------------------------------
function drawGrain() {
  grainCtx.clearRect(0, 0, state.wall.width, state.wall.height);
  grainCtx.fillStyle = 'rgba(255, 255, 255, 0.04)'; // Extremely subtle
  
  // Draws a screen-wide dot grid to give that tactile printed feel globally
  for (let x = 0; x < state.wall.width; x += 3) {
    for (let y = 0; y < state.wall.height; y += 3) {
      if (Math.random() > 0.15) { // Adding a tiny bit of organic noise to the grid
        grainCtx.beginPath();
        grainCtx.arc(x, y, 0.7, 0, Math.PI * 2);
        grainCtx.fill();
      }
    }
  }
}

function buildClusters(trends) {
  let mapped = (trends || []).map((trend, index) => {
    const trafficValue = Number(trend.trafficValue || 500);
    const orderWeight = 1 - index / Math.max((trends || []).length - 1, 1);
    const trafficWeight = clamp(Math.log10(Math.max(trafficValue, 500)) / 6, 0.15, 1);
    const prominence = clamp(mix(orderWeight, trafficWeight, 0.55), 0.18, 1);
    const form = defaultStyleFor(trend.category).form;
    
    // REDUCED: Base radius scaled down significantly so they aren't huge
    const radius = mix(12, 36, prominence) * (trend.dna?.baseScale || 1); 
    const variance = hashString(`${trend.title}-${trend.subCategory || ''}`);
    
    return {
      ...trend,
      prominence, radius,
      ringCount: trend.dna?.ringCount || Math.max(3, Math.round(trafficWeight * 7)),
      shards: trend.dna?.shards || 6,
      density: trend.dna?.density || 0.42,
      glowScale: mix(1.05, 1.5, (variance % 100) / 100),
      filamentCount: 3 + (variance % 5),
      sparkCount: 8 + (variance % 12),
      shellTilt: ((variance % 28) - 14) * (Math.PI / 180),
      connectionReach: mix(0.9, 1.4, ((variance >> 3) % 100) / 100),
      textSeed: variance, form,
      x: clamp(trend.dna?.x ?? 0.5, 0.1, 0.9),
      y: clamp(trend.dna?.y ?? 0.5, 0.18, 0.82),
      driftSpeed: trend.dna?.driftSpeed || 0.02,
      phase: trend.dna?.phase || 0,
      spin: trend.dna?.spin || 0.001,
    };
  });

  // PHYSICS RELAXATION: Push overlapping clusters apart before drawing them
  for (let step = 0; step < 15; step++) {
    for (let i = 0; i < mapped.length; i++) {
      for (let j = i + 1; j < mapped.length; j++) {
        const c1 = mapped[i];
        const c2 = mapped[j];
        const dx = (c1.x - c2.x) * state.wall.width;
        const dy = (c1.y - c2.y) * state.wall.height;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (c1.radius + c2.radius) * 2.2; // Keep them well separated

        if (dist < minDist && dist > 0.1) {
          const push = ((minDist - dist) / dist) * 0.08;
          c1.x += (dx * push) / state.wall.width;
          c1.y += (dy * push) / state.wall.height;
          c2.x -= (dx * push) / state.wall.width;
          c2.y -= (dy * push) / state.wall.height;
        }
      }
    }
  }
  
  // Keep them safely inside the screen bounds after pushing
  mapped.forEach(c => {
     c.x = clamp(c.x, 0.15, 0.85);
     c.y = clamp(c.y, 0.15, 0.85);
  });

  return mapped;
}

function getSpecimen() {
  return state.clusters[0] || PLACEHOLDER_CLUSTER;
}

function currentPoint(cluster, now, stage = 'wall') {
  if (stage === 'specimen') {
    return {
      x: state.specimen.width * 0.45,
      y: state.specimen.height * 0.5,
      radius: Math.min(state.specimen.width, state.specimen.height) * 0.12,
    };
  }

  if (stage === 'focus') {
    const focusRadius = Math.max(48, Math.min(Math.min(state.focus.width, state.focus.height) * 0.12, cluster.radius * 1.8));
    return {
      x: state.focus.width * 0.43,
      y: state.focus.height * 0.52,
      radius: focusRadius,
    };
  }

  // REDUCED MOVEMENT: Slower, tighter, less random drift
  const t = now * 0.00012 * state.controls.motion;
  const amp = 4 + cluster.prominence * 6;
  return {
    x: cluster.x * state.wall.width + Math.cos(t * 8 + cluster.phase) * amp,
    y: cluster.y * state.wall.height + Math.sin(t * 6 + cluster.phase) * amp * 0.8,
    radius: cluster.radius,
  };
}

function drawBackground(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  const radial = ctx.createRadialGradient(width * 0.63, height * 0.34, 0, width * 0.63, height * 0.34, width * 0.74);
  radial.addColorStop(0, 'rgba(10, 15, 25, 0.8)'); 
  radial.addColorStop(1, 'rgba(5, 7, 13, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);
}

// ------------------------------------------------------------------
// DRAWING ENGINE
// ------------------------------------------------------------------
function drawConnections(ctx, now) {
  const points = state.clusters.map((cluster) => ({ cluster, point: currentPoint(cluster, now, 'wall') }));
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = 0.8;
  
  state.clusters.forEach((cluster, index) => {
    const source = points[index];
    const neighborCount = Math.max(1, Math.round(1 + state.controls.connections * 2 * cluster.connectionReach));
    const neighbors = points
      .filter((item) => item.cluster.id !== cluster.id)
      .map((item) => {
        const dx = source.point.x - item.point.x;
        const dy = source.point.y - item.point.y;
        return { ...item, distance: Math.sqrt(dx * dx + dy * dy) };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, neighborCount);

    neighbors.forEach((neighbor) => {
      const gradient = ctx.createLinearGradient(source.point.x, source.point.y, neighbor.point.x, neighbor.point.y);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(source.point.x, source.point.y);
      ctx.lineTo(neighbor.point.x, neighbor.point.y);
      ctx.stroke();
    });
  });
  ctx.restore();
}

function isFocusedLayer(layer) {
  return state.focusAttribute === 'overview' || state.focusAttribute === layer;
}

function layerAlpha(layer, amount, stage) {
  if (stage !== 'focus') return amount;
  return isFocusedLayer(layer) ? amount : amount * 0.18;
}

function drawAtmosphere(ctx, point, radius, palette, cluster, alphaScale, stage) {
  ctx.save();
  ctx.translate(point.x, point.y);
  
  const glowIntensity = mix(0.3, 0.8, cluster.prominence);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 3.5);
  glow.addColorStop(0, alpha(palette[0], layerAlpha('glow', glowIntensity * alphaScale, stage)));
  glow.addColorStop(0.3, alpha(palette[1], layerAlpha('glow', (glowIntensity * 0.3) * alphaScale, stage)));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRings(ctx, point, radius, palette, cluster, motionScale, stage) {
  const count = Math.max(3, cluster.ringCount);
  const now = performance.now() * 0.001;
  const stageMotion = stage === 'wall' ? motionScale : stage === 'focus' ? 0.24 : 0.08;
  const activeBoost = stage === 'wall' && (cluster.id === state.hoverId || cluster.id === state.lockId) ? 1.16 : 1;
  ctx.save();
  ctx.translate(point.x, point.y);
  for (let i = 0; i < count; i += 1) {
    const orbit = radius * (1.0 + i * 0.5);
    const drift = stage !== 'specimen'
      ? Math.sin(now * (0.3 + i * 0.06) + cluster.phase) * radius * 0.06 * stageMotion
      : 0;
    const offsetX = Math.cos(cluster.phase + i * 0.7) * radius * 0.06 + drift;
    const offsetY = Math.sin(cluster.phase * 1.3 + i * 0.6) * radius * 0.05;
    const lineAlpha = layerAlpha('rings', i === count - 1 ? 0.2 : 0.4, stage) * (activeBoost === 1 ? 1 : 1.12);
    
    ctx.strokeStyle = alpha(palette[i % 3], lineAlpha);
    ctx.lineWidth = 0.5 * activeBoost; 
    ctx.beginPath();
    ctx.ellipse(offsetX, offsetY, orbit, orbit * mix(0.7, 1.1, ((i + 1) % 3) / 3), cluster.phase * 0.2 + i * 0.22, 0, Math.PI * 1.4);
    ctx.stroke();
  }
  ctx.restore();
}

// RESTORED: Energy Filaments
function drawFilaments(ctx, point, radius, palette, cluster, stage) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.strokeStyle = alpha(palette[0], layerAlpha('connections', 0.4, stage));
  ctx.lineWidth = 0.6;
  const time = performance.now() * 0.0005 * (stage === 'wall' ? state.controls.motion : 0.5);
  
  for (let i = 0; i < cluster.filamentCount; i += 1) {
    const angle = (Math.PI * 2 * i) / cluster.filamentCount + cluster.phase + (time * 0.5);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.2, Math.sin(angle) * radius * 0.2);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.5) * radius * 1.2,
      Math.sin(angle - 0.5) * radius * 1.2,
      Math.cos(angle + 0.2) * radius * 2.5,
      Math.sin(angle + 0.2) * radius * 2.5
    );
    ctx.stroke();
  }
  ctx.restore();
}

// RESTORED: Particle Bloom Clouds
function drawBloomClouds(ctx, point, radius, palette, cluster, stage) {
  ctx.save();
  ctx.translate(point.x, point.y);
  const time = performance.now() * 0.0002 * (stage === 'wall' ? state.controls.motion : 0.5);
  
  for (let i = 0; i < cluster.sparkCount; i += 1) {
    const seed = cluster.textSeed + i * 17;
    const angle = Math.PI * 2 * seededValue(seed, i, 0.7) + cluster.phase + time;
    const distance = radius * mix(0.5, 2.5, seededValue(seed, i, 1.1));
    
    ctx.fillStyle = alpha(palette[i % 3], layerAlpha('texture', 0.6, stage));
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, mix(0.5, 2.0, seededValue(seed, i, 2.2)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawForm(ctx, point, radius, palette, cluster, stage) {
  ctx.save();
  ctx.translate(point.x, point.y);
  const liveSpin = stage === 'wall' ? state.controls.motion : stage === 'focus' ? 0.32 : 0;
  ctx.rotate(cluster.phase * 0.4 + performance.now() * cluster.spin * liveSpin);
  
  const shardCount = cluster.shards;
  const formType = cluster.form; 
  
  for (let i = 0; i < shardCount; i += 1) {
    const angle = (Math.PI * 2 * i) / shardCount + cluster.shellTilt;
    const dist = radius * mix(0.1, 0.8, seededValue(cluster.textSeed, i, 1.1));
    const size = radius * mix(0.5, 1.2, seededValue(cluster.textSeed, i, 1.5));
    
    ctx.save();
    ctx.translate(Math.cos(angle) * dist, Math.sin(angle) * dist);
    ctx.rotate(seededValue(cluster.textSeed, i, 2.0) * Math.PI * 2);
    ctx.beginPath();
    
    if (formType === 'vector' || formType === 'shard' || formType === 'circuit' || formType === 'grid') {
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.8, -size * 0.3);
        ctx.lineTo(size * 0.6, size * 0.8);
        ctx.lineTo(-size * 0.6, size * 0.8);
        ctx.lineTo(-size * 0.8, -size * 0.3);
    } else if (formType === 'petal' || formType === 'halo' || formType === 'atmosphere' || formType === 'orbit') {
        ctx.ellipse(0, 0, size * 0.7, size, 0, 0, Math.PI * 2);
    } else {
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.6, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.6, 0);
    }
    ctx.closePath();
    
    ctx.fillStyle = alpha(palette[i % 3], layerAlpha('shape', 0.18, stage));
    ctx.fill();
    ctx.strokeStyle = alpha('#ffffff', layerAlpha('shape', 0.1, stage));
    ctx.lineWidth = 0.5;
    ctx.stroke();
    
    ctx.restore();
  }

  const coreScale = mix(0.3, 0.7, cluster.prominence);
  const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * coreScale);
  innerGlow.addColorStop(0, alpha('#ffffff', layerAlpha('shape', 0.9, stage)));
  innerGlow.addColorStop(0.5, alpha(palette[0], layerAlpha('shape', 0.5, stage)));
  innerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = innerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * coreScale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawAmbientType(ctx, point, radius, cluster, stage) {
  if (stage !== 'wall') return;
  const labelText = cluster.title.toUpperCase();
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  // FIXED TYPOGRAPHY: Back to legible Space Grotesk
  ctx.font = '500 11px "Space Grotesk", sans-serif'; 
  ctx.letterSpacing = '1px';
  ctx.fillText(labelText, radius * 1.5, -radius * 1.2);
  ctx.restore();
}

function drawCluster(ctx, cluster, point, stage = 'wall') {
  const palette = paletteFor(cluster);
  const motionScale = stage === 'wall' ? state.controls.motion : 0;
  const isActive = cluster.id === state.hoverId || cluster.id === state.lockId || cluster.id === state.focusId;
  const activeScale = stage === 'wall' && isActive ? 1.08 : 1;
  const radius = point.radius * activeScale;
  const glowRadius = radius * cluster.glowScale * (isActive ? 1.22 : 1);
  const glowScale = stage === 'focus' ? 1.15 : isActive ? 1.24 : 1;

  ctx.save();
  ctx.globalCompositeOperation = 'screen'; 

  drawAtmosphere(ctx, point, glowRadius, palette, cluster, glowScale, stage);
  drawRings(ctx, point, radius, palette, cluster, motionScale, stage);
  drawFilaments(ctx, point, radius, palette, cluster, stage);
  drawBloomClouds(ctx, point, radius, palette, cluster, stage);
  drawForm(ctx, point, radius, palette, cluster, stage);
  drawAmbientType(ctx, point, radius, cluster, stage);

  ctx.fillStyle = alpha('#ffffff', layerAlpha('glow', 0.95 * (isActive ? 1.1 : 1), stage));
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(1.5, radius * 0.08), 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function titleAnchor(point) { return { x: point.x - point.radius * 1.18, y: point.y - point.radius * 0.76 }; }
function categoryAnchor(point) { return { x: point.x + point.radius * 0.84, y: point.y - point.radius * 0.72 }; }
function structureAnchor(point) { return { x: point.x + point.radius * 0.12, y: point.y + point.radius * 1.02 }; }

function setCalloutPosition(element, anchor, label, orientation, stage = 'specimen') {
  const stageWidth = stage === 'focus' ? state.focus.width : state.specimen.width;
  const stageHeight = stage === 'focus' ? state.focus.height : state.specimen.height;
  const padding = stage === 'focus' ? 42 : 34;
  const gap = stage === 'focus' ? 18 : 22;
  const labelWidth = stage === 'focus' ? 184 : Math.min(340, Math.max(260, stageWidth * 0.24));
  const labelHeight = stage === 'focus' ? 52 : 124;
  const featureX = anchor.x;
  const featureY = anchor.y;
  let x = featureX;
  let y = clamp(featureY, padding + 20, stageHeight - padding - labelHeight);
  let lineLength = anchor.length || 120;

  if (orientation === 'to-left') {
    const railX = padding + labelWidth + gap + 16;
    lineLength = Math.max(anchor.length || 120, featureX - railX);
  } else if (orientation === 'to-right') {
    const railX = stageWidth - padding - labelWidth - gap - 16;
    lineLength = Math.max(anchor.length || 120, railX - featureX);
  }

  element.classList.remove('to-left', 'to-right', 'to-up', 'to-down');
  element.classList.add(orientation);
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.setProperty('--line-length', `${lineLength}px`);
  element.style.setProperty('--callout-width', `${labelWidth}px`);
}

function specimenFeatureAnchors(point, cluster) {
  return {
    core: { x: point.x - point.radius * 0.54, y: point.y - point.radius * 0.16, side: 'to-left', length: 164 },
    rings: { x: point.x + point.radius * 0.9, y: point.y - point.radius * 0.52, side: 'to-right', length: 154 },
    texture: { x: point.x + point.radius * 0.24, y: point.y + point.radius * 0.62, side: 'to-right', length: 166 },
  };
}

function layoutSpecimenCallouts() {
  if (!onboardingVisual || !specimenCallouts.length) return;
  const specimen = getSpecimen();
  const point = currentPoint(specimen, performance.now(), 'specimen');
  const anchors = specimenFeatureAnchors(point, specimen);
  setCalloutPosition(specimenCallouts[0], anchors.core, null, anchors.core.side);
  setCalloutPosition(specimenCallouts[1], anchors.rings, null, anchors.rings.side);
  setCalloutPosition(specimenCallouts[2], anchors.texture, null, anchors.texture.side);
}

function drawSpecimen() {
  specimenCtx.clearRect(0, 0, state.specimen.width, state.specimen.height);
  drawBackground(specimenCtx, state.specimen.width, state.specimen.height);
  const specimen = getSpecimen();
  const point = currentPoint(specimen, performance.now(), 'specimen');
  drawCluster(specimenCtx, specimen, point, 'specimen');
  layoutSpecimenCallouts();
}

function focusMarkerAnchors(point) {
  const spread = 1.25; 
  return {
    glow:    { x: point.x - point.radius * (0.8 * spread), y: point.y - point.radius * (0.9 * spread), side: 'to-left', length: 180 },
    shape:   { x: point.x - point.radius * (1.1 * spread), y: point.y - point.radius * (0.1 * spread), side: 'to-left', length: 160 },
    texture: { x: point.x - point.radius * (0.7 * spread), y: point.y + point.radius * (0.8 * spread), side: 'to-left', length: 190 },
    motion:      { x: point.x + point.radius * (0.2 * spread), y: point.y - point.radius * (1.0 * spread), side: 'to-right', length: 160 },
    rings:       { x: point.x + point.radius * (0.9 * spread), y: point.y - point.radius * (0.5 * spread), side: 'to-right', length: 180 },
    color:       { x: point.x + point.radius * (1.0 * spread), y: point.y + point.radius * (0.2 * spread), side: 'to-right', length: 170 },
    connections: { x: point.x + point.radius * (0.6 * spread), y: point.y + point.radius * (0.9 * spread), side: 'to-right', length: 190 },
  };
}

function layoutFocusMarkers() {
  if (focus.hidden) return;
  const cluster = state.clusters.find((item) => item.id === state.focusId) || getSpecimen();
  const point = currentPoint(cluster, performance.now(), 'focus');
  const anchors = focusMarkerAnchors(point);
  focusMarkers.forEach((marker) => {
    const anchor = anchors[marker.dataset.attribute];
    if (!anchor) return;
    marker.classList.remove('to-left', 'to-right', 'to-down');
    marker.classList.add(anchor.side);
    setCalloutPosition(marker, anchor, null, anchor.side, 'focus');
    marker.classList.toggle('is-visible', true);
  });
}

function drawFocus() {
  focusCtx.clearRect(0, 0, state.focus.width, state.focus.height);
  drawBackground(focusCtx, state.focus.width, state.focus.height);
  const cluster = state.clusters.find((item) => item.id === state.focusId);
  if (!cluster) return;
  const point = currentPoint(cluster, performance.now(), 'focus');
  drawCluster(focusCtx, cluster, point, 'focus');
  layoutFocusMarkers();
}

function focusDetailFor(cluster, attribute) {
  const source = compactSource(cluster.news[0]?.source || cluster.pictureSource || 'Google Trends RSS');
  const trafficValue = Number(cluster.trafficValue || 0);
  const ringCount = Math.max(3, cluster.ringCount || 3);
  const band = searchBandLabel(trafficValue);
  const details = {
    overview: {
      title: 'Overview',
      body: `This cluster is one live search signal in ${categoryDisplay(cluster)}. The center is the search itself. The surrounding rings, particles, and surfaces show how the wall interprets relative traffic, category, and texture. Use the attribute buttons to isolate one layer at a time.`,
    },
    glow: {
      title: 'Glow',
      body: `Glow shows intensity. Brighter clusters are higher activity signals in the current feed.`,
    },
    rings: {
      title: 'Rings',
      body: `The ring count shows relative search traffic. ${ringCount} rings place this cluster in the ${band} band.`,
    },
    shape: {
      title: 'Shape',
      body: `Shape is driven by category and the search topic. Similar categories share a style, while each search still looks unique.`,
    },
    color: {
      title: 'Color',
      body: `${cluster.category} sets the base palette. ${cluster.subCategory !== 'General' ? `${cluster.subCategory} refines the inner tonal range.` : 'The search title refines the details.'}`,
    },
    texture: {
      title: 'Texture',
      body: `Texture comes from particle density, layered dust, and category style. It helps the cluster feel atmospheric instead of flat. Different categories break that surface differently, so some signals feel airy while others feel denser and more compact.`,
    },
    connections: {
      title: 'Links',
      body: `Links help the wall read as a field. They show proximity and shared attention, not cause and effect.`,
    },
    motion: {
      title: 'Motion',
      body: `Motion is subtle drift and rotation. It keeps the display alive without turning the view into noise.`,
    },
    source: {
      title: 'Source',
      body: `${source} is the data source for this search. It adds context without changing the underlying title.`,
    },
  };
  return details[attribute] || details.overview;
}

function updateFocusDetail() {
  if (!state.focusId) return;
  const cluster = state.clusters.find((item) => item.id === state.focusId);
  if (!cluster) return;
  const detail = focusDetailFor(cluster, state.focusAttribute || 'overview');
  focusDetailTitle.textContent = detail.title;
  focusDetailBody.textContent = detail.body;
  focusMarkers.forEach((marker) => {
    marker.classList.toggle('is-active', marker.dataset.attribute === state.focusAttribute);
  });
  focusProbes.forEach((probe) => {
    probe.classList.toggle('is-active', probe.dataset.attribute === state.focusAttribute);
  });
}

function setInspector(cluster) {
  if (!cluster) {
    document.body.classList.remove('probe-active');
    inspectorTitle.textContent = 'EXPLORE THE FIELD';
    inspectorSummary.textContent = 'Hover or click a cluster.';
    inspectorCategory.textContent = '-';
    inspectorSource.textContent = '-';
    if (inspectorPublished) inspectorPublished.textContent = '-';
    inspectorLink.hidden = true;
    inspectorLink.removeAttribute('href');
    return;
  }

  document.body.classList.add('probe-active');
  positionInspector(cluster);
  const story = primaryStory(cluster);
  inspectorTitle.textContent = displayTitle(cluster.title);
  inspectorSummary.textContent = story.title || `${compactSource(story.source)} is following this search right now.`;
  inspectorCategory.textContent = categoryDisplay(cluster);
  inspectorSource.textContent = compactSource(story.source);
  if (inspectorPublished) inspectorPublished.textContent = formatPublishedDate(cluster.published);
  if (story.url) {
    inspectorLink.hidden = false;
    inspectorLink.href = story.url;
    inspectorLink.textContent = `Open ${compactSource(story.source)}`;
  } else {
    inspectorLink.hidden = true;
    inspectorLink.removeAttribute('href');
  }
}

function updateOnboardingCopy() {
  const specimen = getSpecimen();
  const step = ONBOARDING_STEPS[state.onboardingStep] || ONBOARDING_STEPS[0];
  const trafficValue = Number(specimen.trafficValue || 0);
  const ringCount = Math.max(3, specimen.ringCount || 3);
  const trafficBand = searchBandLabel(trafficValue);
  onboarding.dataset.step = String(state.onboardingStep);
  entryTitle.textContent = displayTitle(specimen.title);
  entryCategory.textContent = categoryDisplay(specimen);
  entrySource.textContent = compactSource(specimen.news[0]?.source || specimen.pictureSource || 'Google Trends RSS');
  calloutTitle.textContent = `${displayTitle(specimen.title)} is the active search in this specimen.`;
  calloutCategory.textContent = `${ringCount} rings place it in the ${trafficBand} traffic band.`;
  calloutStructure.textContent = `${categoryDisplay(specimen)} shapes the color, texture, and surface detail.`;
  onboardingStep.textContent = `${String(state.onboardingStep + 1).padStart(2, '0')} / ${String(ONBOARDING_STEPS.length).padStart(2, '0')}`;
  onboardingHeading.textContent = step.heading;
  onboardingText.textContent = step.text;
  onboardingNote.textContent = step.note;
  if (state.onboardingStep === 0) enterButton.textContent = 'Start Walkthrough';
  else enterButton.textContent = state.onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Enter Wall' : 'Next';
  specimenCallouts[0].hidden = state.onboardingStep < 1;
  specimenCallouts[1].hidden = state.onboardingStep < 2;
  specimenCallouts[2].hidden = state.onboardingStep < 3;
  replayOnboardingReveal();
}

function updateCategoryControls() {
  const categories = Array.from(new Set(state.clusters.map((cluster) => cluster.category))).sort();
  const list = categories.length ? categories : Object.keys(CATEGORY_STYLES);
  categorySelect.innerHTML = list.map((category) => `<option value="${category}">${category}</option>`).join('');
  if (!list.includes(state.selectedCategory)) state.selectedCategory = list[0] || 'Other';
  categorySelect.value = state.selectedCategory;
  categoryColor.value = paletteBase(state.selectedCategory);
}

function updateStatus() {
  if (!state.scene || !state.clusters.length) {
    statusPill.textContent = 'LOADING';
    hudDeck.textContent = 'Fetching the latest Google Trends RSS signals.';
    return;
  }

  const lead = getSpecimen();
  statusPill.textContent = state.scene.source === 'local' ? 'OFFLINE' : state.scene.stale ? 'STALE' : 'LIVE';
  hudDeck.textContent = `${displayTitle(lead.title)} is active now. Hover to inspect, click to lock, click again to focus, and press H to hide the interface.`;
}

function hitTest(x, y) {
  const now = performance.now();
  let best = null;
  let bestDistance = Infinity;
  state.clusters.forEach((cluster) => {
    const point = currentPoint(cluster, now, 'wall');
    const dx = x - point.x;
    const dy = y - point.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < point.radius * 1.14 && distance < bestDistance) {
      bestDistance = distance;
      best = cluster.id;
    }
  });
  return best;
}

function openFocus(cluster) {
  if (!cluster) return;
  const story = primaryStory(cluster);
  state.focusId = cluster.id;
  state.focusAttribute = 'overview';
  focus.hidden = false;
  
  const inspector = document.getElementById('inspector');
  if (inspector) inspector.style.display = 'none';

  focusTitle.textContent = displayTitle(cluster.title);
  focusCategory.textContent = categoryDisplay(cluster);
  focusSource.textContent = compactSource(story.source);
  focusPublished.textContent = cluster.published || '-';
  focusCopy.textContent = story.title || `${displayTitle(cluster.title)} is being read through ${categoryDisplay(cluster)}. Use the attribute buttons to isolate one layer at a time and see what is shaping the object you are looking at.`;
  
  if (story.url) {
    focusLink.hidden = false;
    focusLink.href = story.url;
    focusLink.textContent = `Open ${compactSource(story.source)}`;
  } else {
    focusLink.hidden = true;
    focusLink.removeAttribute('href');
  }
  updateFocusDetail();
  resize();
  drawFocus();
}

function closeFocus() {
  state.focusId = null;
  state.focusAttribute = 'overview';
  focus.hidden = true;
  
  const inspector = document.getElementById('inspector');
  if (inspector) inspector.style.display = '';
}

function drawWall(now) {
  drawBackground(wallCtx, state.wall.width, state.wall.height);
  if (!state.clusters.length) return;
  drawConnections(wallCtx, now);

  const activeId = state.hoverId || state.lockId || null;
  const activeClusters = [];

  state.clusters.forEach((cluster) => {
    if (cluster.id === activeId) {
      activeClusters.push(cluster);
      return;
    }
    const point = currentPoint(cluster, now, 'wall');
    drawCluster(wallCtx, cluster, point, 'wall');
  });

  activeClusters.forEach((cluster) => {
    const point = currentPoint(cluster, now, 'wall');
    drawCluster(wallCtx, cluster, point, 'wall');
  });

  const activeCluster = state.clusters.find((cluster) => cluster.id === (state.lockId || state.hoverId));
  if (activeCluster) positionInspector(activeCluster);
}

function animate(now) {
  drawWall(now);
  drawSpecimen();
  if (state.focusId) drawFocus();
  requestAnimationFrame(animate);
}

async function loadScene() {
  try {
    const response = await fetch(ENDPOINT, { cache: 'no-store' });
    const payload = await response.json();
    const scene = payload?.trends?.length ? payload : createFallbackScene();
    state.scene = scene;
    state.clusters = buildClusters(scene.trends || []);
    updateOnboardingCopy();
    updateCategoryControls();
    updateStatus();
    drawSpecimen();
    if (state.focusId) {
      const existing = state.clusters.find((cluster) => cluster.id === state.focusId);
      if (existing) openFocus(existing);
      else closeFocus();
    }
    const active = state.clusters.find((cluster) => cluster.id === (state.lockId || state.hoverId)) || null;
    setInspector(active);
  } catch (_error) {
    const fallback = createFallbackScene();
    state.scene = fallback;
    state.clusters = buildClusters(fallback.trends);
    updateStatus();
    updateOnboardingCopy();
    updateCategoryControls();
    drawSpecimen();
  }
}

wallCanvas.addEventListener('mousemove', (event) => {
  if (!document.body.classList.contains('is-ready') || state.focusId) return;
  const id = hitTest(event.clientX, event.clientY);
  state.hoverId = id;
  const cluster = state.clusters.find((item) => item.id === (state.lockId || id)) || null;
  setInspector(cluster);
});

wallCanvas.addEventListener('mouseleave', () => {
  if (state.lockId) return;
  state.hoverId = null;
  setInspector(null);
});

wallCanvas.addEventListener('click', (event) => {
  if (!document.body.classList.contains('is-ready') || state.focusId) return;
  if (wallTip) wallTip.hidden = true;
  const id = hitTest(event.clientX, event.clientY);
  const cluster = state.clusters.find((item) => item.id === id) || null;
  if (!cluster) {
    state.lockId = null;
    setInspector(null);
    return;
  }
  if (state.lockId === cluster.id) {
    openFocus(cluster);
    return;
  }
  state.lockId = cluster.id;
  setInspector(cluster);
});

wallCanvas.addEventListener('dblclick', (event) => {
  if (!document.body.classList.contains('is-ready')) return;
  if (wallTip) wallTip.hidden = true;
  const id = hitTest(event.clientX, event.clientY) || state.lockId;
  const cluster = state.clusters.find((item) => item.id === id) || null;
  openFocus(cluster);
});

function finishOnboarding() {
  document.body.classList.remove('is-onboarding');
  document.body.classList.add('is-ready');
  guide.hidden = false;
  controls.open = true;
  if (wallTip) wallTip.hidden = false;
}

enterButton.addEventListener('click', () => {
  if (state.onboardingStep < ONBOARDING_STEPS.length - 1) {
    state.onboardingStep += 1;
    updateOnboardingCopy();
    drawSpecimen();
    return;
  }
  finishOnboarding();
});

skipButton.addEventListener('click', finishOnboarding);

guideToggle.addEventListener('click', () => {
  guide.hidden = false;
});

guideClose.addEventListener('click', () => {
  guide.hidden = true;
});

if (wallTipClose) {
  wallTipClose.addEventListener('click', () => {
    wallTip.hidden = true;
  });
}

guide.addEventListener('click', (event) => {
  if (event.target === guide) guide.hidden = true;
});

focusClose.addEventListener('click', closeFocus);
focus.addEventListener('click', (event) => {
  if (event.target === focus) closeFocus();
});

focusMarkers.forEach((marker) => {
  const activate = () => {
    state.focusAttribute = marker.dataset.attribute || 'overview';
    updateFocusDetail();
    if (state.focusId) drawFocus();
  };
  marker.addEventListener('mouseenter', activate);
  marker.addEventListener('focus', activate);
  marker.addEventListener('click', activate);
});

focusProbes.forEach((probe) => {
  const activate = () => {
    state.focusAttribute = probe.dataset.attribute || 'overview';
    updateFocusDetail();
    if (state.focusId) drawFocus();
  };
  probe.addEventListener('mouseenter', activate);
  probe.addEventListener('focus', activate);
  probe.addEventListener('click', activate);
});

chromeToggle.addEventListener('click', () => {
  state.chromeHidden = !state.chromeHidden;
  document.body.classList.toggle('is-gallery', state.chromeHidden);
  chromeToggle.textContent = state.chromeHidden ? 'Show Data' : 'Hide Data';
});

motionRange.addEventListener('input', () => {
  state.controls.motion = Number(motionRange.value) || 0.8;
});

connectionRange.addEventListener('input', () => {
  state.controls.connections = Number(connectionRange.value) || 1;
});

contrastRange.addEventListener('input', () => {
  state.controls.contrast = Number(contrastRange.value) || 1;
});

categorySelect.addEventListener('change', () => {
  state.selectedCategory = categorySelect.value;
  categoryColor.value = paletteBase(state.selectedCategory);
});

categoryColor.addEventListener('input', () => {
  state.paletteOverrides[state.selectedCategory] = categoryColor.value;
  writePaletteOverrides();
  drawSpecimen();
  if (state.focusId) drawFocus();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!focus.hidden) closeFocus();
    else if (!guide.hidden) guide.hidden = true;
    else {
      state.lockId = null;
      state.hoverId = null;
      setInspector(null);
    }
  }

  if (event.key.toLowerCase() === 'h') {
    state.chromeHidden = !state.chromeHidden;
    document.body.classList.toggle('is-gallery', state.chromeHidden);
    chromeToggle.textContent = state.chromeHidden ? 'Show Data' : 'Hide Data';
    controls.open = !state.chromeHidden && controls.open;
  }
});

window.addEventListener('resize', () => {
  resize();
  drawSpecimen();
  if (state.focusId) drawFocus();
});

const resizeObserver = new ResizeObserver(() => {
  resize();
});

resizeObserver.observe(onboardingVisual);
resizeObserver.observe(focusStage);

async function init() {
  resize();
  updateOnboardingCopy();
  updateStatus();
  await loadScene();
  requestAnimationFrame(animate);
  window.setInterval(loadScene, 300000);
}

init();