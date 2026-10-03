// Vicky VOffice: Portfolio Virtual 3D & Portofolio Interaktif M. Vicky Mosafan
// Arsitektur PBR Photorealistis: Model Blender + Meshy AI + RoomEnvironment Three.js
// Mematuhi standar /antislop, /antislop-ui, /antislop-code, /antislop-human, /antislop-layoutmobile

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CV_DATA } from './cv-data.js';

// ---------------------------------------------------------------- State Global
const state = {
  theme: 'night',
  cameraMode: 'follow',
  missionStep: 0,
  currentRoom: 'RECEPTION LOBBY',
  activeDialogue: null,
  activeModal: null,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

  // Player & Movement (Elevated onto architectural plinth at Y = 0.35m)
  player: {
    mesh: null,
    position: new THREE.Vector3(0, 0.35, 7.5),
    velocity: new THREE.Vector3(),
    speed: 5.6,
    isMoving: false,
    walkCycle: 0,
    parts: {}
  },

  // Input states
  keys: {
    forward: false,
    backward: false,
    left: false,
    right: false
  },

  // Joystick (Mobile)
  joystick: {
    active: false,
    originX: 0,
    originY: 0,
    moveX: 0,
    moveY: 0
  },

  interactables: [],
  nearestInteractable: null
};

// ---------------------------------------------------------------- DOM Elements
const dom = {
  container: document.getElementById('scene'),
  labels: document.getElementById('labels'),
  loading: document.getElementById('loading'),
  roomName: document.getElementById('roomName'),
  missionTitle: document.getElementById('missionTitle'),
  missionCopy: document.getElementById('missionCopy'),
  missionProgressBar: document.getElementById('missionProgressBar'),
  interactionPrompt: document.getElementById('interactionPrompt'),
  interactionLabel: document.getElementById('interactionLabel'),
  dialogueBox: document.getElementById('dialogueBox'),
  dialogueSpeaker: document.getElementById('dialogueSpeaker'),
  dialogueText: document.getElementById('dialogueText'),
  projectModal: document.getElementById('projectModal'),
  projectModalBody: document.getElementById('projectModalBody'),
  docModal: document.getElementById('docModal'),
  docModalBody: document.getElementById('docModalBody'),
  joystickZone: document.getElementById('joystickZone'),
  joystickKnob: document.getElementById('joystickKnob'),
  btnMobileAction: document.getElementById('btnMobileAction'),
  themeToggle: document.getElementById('btnThemeToggle'),
  camModeToggle: document.getElementById('btnCamToggle'),
  btnOpenDoc: document.getElementById('btnOpenDoc'),
  zonePills: document.querySelectorAll('.nav-pill')
};

// ---------------------------------------------------------------- Inisialisasi Tiga Dimensi
let scene, camera, renderer, cssRenderer, controls;
const clock = new THREE.Clock();
const lights = {};
let vickyAvatarParts = {};
let ariaAvatarParts = {};
let floatingPosters = [];
const gltfLoader = new GLTFLoader();

function initVOffice() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.FogExp2(0x06080c, 0.016);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 300);
  camera.position.set(1.5, 3.2, 11.5);

  // Kualitas dibatasi sadar-kinerja: pixelRatio maksimal 1.75 agar fill-rate tidak menjatuhkan fps.
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCoarse ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  dom.container.appendChild(renderer.domElement);

  // Setup IBL Photorealistis via RoomEnvironment & PMREMGenerator
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTexture;
  if ('environmentIntensity' in scene) {
    scene.environmentIntensity = 1.15;
  }
  pmremGenerator.dispose();
  roomEnv.dispose();

  cssRenderer = new CSS2DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'fixed';
  cssRenderer.domElement.style.inset = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  dom.labels.appendChild(cssRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 2.0;
  controls.maxDistance = 28.0;
  controls.target.set(0, 1.2, 7.5);

  setupStudioLighting();
  buildSkyDome();
  buildExteriorSkyline();
  loadConsolidatedArchitecture();
  buildInteractiveProjectPosters();
  buildStylizedAvatars();
  registerInteractables();
  setupInputHandlers();

  // Batas waktu pengaman: hilangkan layar muat jika jaringan lambat
  setTimeout(hideLoadingOverlay, 2500);

  animate();
}

function hideLoadingOverlay() {
  if (dom.loading && !dom.loading.classList.contains('gone')) {
    dom.loading.classList.add('gone');
    setMission(0);
    showDialogue('Aria (Host)', 'Selamat datang di Vicky VOffice. Gunakan tombol W, A, S, D atau joystick untuk menjelajahi paviliun arsitektural dan temui M. Vicky Mosafan di Developer Lab.');
  }
}

// ---------------------------------------------------------------- Langit Bergradasi & Tata Cahaya PBR
let skyMat = null;

function buildSkyDome() {
  const geo = new THREE.SphereGeometry(220, 32, 16);
  skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x0d1b30) },
      midColor: { value: new THREE.Color(0x0a1220) },
      botColor: { value: new THREE.Color(0x05070b) }
    },
    vertexShader: 'varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'varying vec3 vPos; uniform vec3 topColor; uniform vec3 midColor; uniform vec3 botColor;',
      'void main(){',
      '  float h = normalize(vPos).y;',
      '  vec3 c = h > 0.0 ? mix(midColor, topColor, pow(h, 0.65)) : mix(midColor, botColor, pow(-h, 0.5));',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'
    ].join('\n')
  });
  const dome = new THREE.Mesh(geo, skyMat);
  dome.name = 'SkyDome';
  scene.add(dome);
}

function setupStudioLighting() {
  // Bounce langit/tanah menggantikan ambient datar: memberi volume pada ruang.
  lights.hemi = new THREE.HemisphereLight(0x9fb6d6, 0x191b1f, 0.45);
  scene.add(lights.hemi);

  lights.ambient = new THREE.AmbientLight(0x243247, 0.22);
  scene.add(lights.ambient);

  // Key tunggal: matahari hangat menembus kaca, satu-satunya peredam bayangan utama.
  lights.moon = new THREE.DirectionalLight(0xffe7c9, 3.0);
  lights.moon.position.set(20, 26, 18);
  lights.moon.castShadow = true;
  lights.moon.shadow.mapSize.set(2048, 2048);
  lights.moon.shadow.camera.near = 1;
  lights.moon.shadow.camera.far = 95;
  lights.moon.shadow.camera.left = -26;
  lights.moon.shadow.camera.right = 26;
  lights.moon.shadow.camera.top = 26;
  lights.moon.shadow.camera.bottom = -26;
  lights.moon.shadow.bias = -0.0004;
  lights.moon.shadow.normalBias = 0.02;
  scene.add(lights.moon, lights.moon.target);

  // Rim dingin dari sisi berlawanan: memisahkan massa bangunan dari latar.
  lights.rim = new THREE.DirectionalLight(0x8fb6ff, 0.7);
  lights.rim.position.set(-22, 12, -20);
  scene.add(lights.rim);

  // Spotlights Interior Aksen (PBR Soft Decay & Penumbra)
  // Intensitas dijaga rendah: IBL sudah terang, spotlight hanya penguat aksen.
  // 1. Lobby Reception Desk Spotlight
  lights.lobbySpot = new THREE.SpotLight(0xfff3e0, 2.1, 12, Math.PI / 3.8, 0.55, 1.9);
  lights.lobbySpot.position.set(0, 4.8, 4.5);
  lights.lobbySpot.target.position.set(0, 0.8, 4.5);
  scene.add(lights.lobbySpot, lights.lobbySpot.target);

  // 2. Developer Suite Workstation Spotlight
  lights.devSpot = new THREE.SpotLight(0xfffaed, 2.6, 11, Math.PI / 4, 0.6, 1.9);
  lights.devSpot.position.set(-7.5, 4.8, -5.5);
  lights.devSpot.target.position.set(-7.5, 0.74, -5.5);
  scene.add(lights.devSpot, lights.devSpot.target);

  // 3. Project Showcase Gallery Spotlight
  lights.gallerySpot = new THREE.SpotLight(0xecfeff, 2.2, 12, Math.PI / 3.2, 0.55, 1.9);
  lights.gallerySpot.position.set(7.5, 4.8, -6.5);
  lights.gallerySpot.target.position.set(7.5, 1.0, -6.5);
  scene.add(lights.gallerySpot, lights.gallerySpot.target);

  // 4. Lounge & Cafe Spotlight
  lights.loungeSpot = new THREE.SpotLight(0xffeedd, 2.2, 12, Math.PI / 3.5, 0.55, 1.9);
  lights.loungeSpot.position.set(6.5, 4.8, 5.5);
  lights.loungeSpot.target.position.set(6.5, 0.5, 5.5);
  scene.add(lights.loungeSpot, lights.loungeSpot.target);
}

// ---------------------------------------------------------------- Runtime Water Texture
function createPoolWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a2338';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rx = Math.random() * 40 + 20;
    const ry = Math.random() * 30 + 15;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = 4;
  return tex;
}

function createExhibitScreenTexture(p) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 512, 680);

  // Accent Header Strip
  ctx.fillStyle = p.color || '#38bdf8';
  ctx.fillRect(0, 0, 512, 8);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.fillRect(24, 24, 464, 48);
  ctx.strokeStyle = p.color || '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, 464, 48);

  ctx.fillStyle = p.color || '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(p.category.toUpperCase(), 40, 54);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(p.title, 24, 110);

  // Client & Role
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px monospace';
  ctx.fillText(`${p.role} | ${p.client}`, 24, 138);

  // Highlight Box
  ctx.fillStyle = '#111722';
  ctx.fillRect(24, 160, 464, 110);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(24, 160, 464, 110);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '13px sans-serif';
  const words = p.highlight.split(' ');
  let line = '';
  let ly = 190;
  words.forEach(w => {
    if (ctx.measureText(line + w).width > 420) {
      ctx.fillText(line, 40, ly);
      line = w + ' ';
      ly += 22;
    } else {
      line += w + ' ';
    }
  });
  if (line) ctx.fillText(line, 40, ly);

  // Tech Stack Badges
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('STACK IMPLEMENTASI:', 24, 305);

  let by = 330;
  p.techStack.forEach(st => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(24, by - 16, 464, 24);
    ctx.fillStyle = '#bfff19';
    ctx.font = '12px monospace';
    ctx.fillText('◈ ' + st, 36, by);
    by += 30;
  });

  // Call to Action
  ctx.fillStyle = 'rgba(191, 255, 25, 0.15)';
  ctx.fillRect(24, 590, 464, 60);
  ctx.strokeStyle = '#bfff19';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 590, 464, 60);

  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('[TEKAN E] BUKA STUDI KASUS LENGKAP', 55, 626);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------- Dynamic Canvas Textures
function createCodeEditorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, 1024, 512);

  // Left Sidebar
  ctx.fillStyle = '#090d14';
  ctx.fillRect(0, 0, 240, 512);

  ctx.fillStyle = '#484f58';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('EXPLORER: VOFFICE-CORE', 16, 28);

  const files = [
    { name: '▾ src', color: '#8b949e', x: 16 },
    { name: '  ▾ agents', color: '#8b949e', x: 24 },
    { name: '    ◈ SystemArchitect.ts', color: '#58a6ff', x: 32, active: true },
    { name: '    ◈ DevAugmenter.ts', color: '#c9d1d9', x: 32 },
    { name: '    ◈ DataPipeline.ts', color: '#c9d1d9', x: 32 },
    { name: '  ▾ models', color: '#8b949e', x: 24 },
    { name: '    ◈ schema.prisma', color: '#38bdf8', x: 32 },
    { name: '    ◈ portfolio.types.ts', color: '#c9d1d9', x: 32 },
    { name: '  ▾ runtime', color: '#8b949e', x: 24 },
    { name: '    ◈ context7.service.ts', color: '#bfff19', x: 32 },
    { name: '    ◈ three-viewport.ts', color: '#c9d1d9', x: 32 },
    { name: '  ◈ package.json', color: '#e3b341', x: 16 },
    { name: '  ◈ README.md', color: '#8b949e', x: 16 }
  ];

  let fy = 54;
  files.forEach(f => {
    if (f.active) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.fillRect(0, fy - 14, 240, 22);
    }
    ctx.fillStyle = f.color;
    ctx.font = '13px monospace';
    ctx.fillText(f.name, f.x, fy);
    fy += 23;
  });

  // Editor Tab Bar
  ctx.fillStyle = '#161b22';
  ctx.fillRect(240, 0, 784, 38);

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(240, 0, 220, 38);
  ctx.fillStyle = '#58a6ff';
  ctx.fillRect(240, 0, 220, 2);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('TS', 254, 24);

  ctx.fillStyle = '#f0f6fc';
  ctx.font = '13px monospace';
  ctx.fillText('SystemArchitect.ts', 280, 24);

  ctx.fillStyle = '#8b949e';
  ctx.font = '13px monospace';
  ctx.fillText('x', 438, 24);

  // Breadcrumbs
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(240, 38, 784, 24);
  ctx.fillStyle = '#6e7681';
  ctx.font = '11px monospace';
  ctx.fillText('src > agents > SystemArchitect.ts > class SystemArchitect', 256, 54);

  const codeLines = [
    { num: ' 1', tokens: [{ t: 'import', c: '#ff7b72' }, { t: ' { MultiAgent, DistributedPBR } ', c: '#f0f6fc' }, { t: 'from', c: '#ff7b72' }, { t: " '@vicky/core';", c: '#a5d6ff' }] },
    { num: ' 2', tokens: [{ t: 'import', c: '#ff7b72' }, { t: ' { Context7Engine } ', c: '#f0f6fc' }, { t: 'from', c: '#ff7b72' }, { t: " '@context7/sdk';", c: '#a5d6ff' }] },
    { num: ' 3', tokens: [] },
    { num: ' 4', tokens: [{ t: 'export class ', c: '#ff7b72' }, { t: 'SystemArchitect ', c: '#ffa657' }, { t: 'implements ', c: '#ff7b72' }, { t: 'IPortfolioLead {', c: '#79c0ff' }] },
    { num: ' 5', tokens: [{ t: '  public readonly ', c: '#ff7b72' }, { t: 'engineer ', c: '#79c0ff' }, { t: '= ', c: '#ff7b72' }, { t: '"M. Vicky Mosafan";', c: '#a5d6ff' }] },
    { num: ' 6', tokens: [{ t: '  public readonly ', c: '#ff7b72' }, { t: 'academicGpa ', c: '#79c0ff' }, { t: '= ', c: '#ff7b72' }, { t: '3.94; ', c: '#79c0ff' }, { t: '// UMJ S1 Sistem Informasi', c: '#8b949e' }] },
    { num: ' 7', tokens: [{ t: '  public readonly ', c: '#ff7b72' }, { t: 'focusArea ', c: '#79c0ff' }, { t: '= ', c: '#ff7b72' }, { t: '"AI-Augmented Full-Stack Engineering";', c: '#a5d6ff' }] },
    { num: ' 8', tokens: [] },
    { num: ' 9', tokens: [{ t: '  async ', c: '#ff7b72' }, { t: 'bootstrapCluster', c: '#d2a8ff' }, { t: '(spec: ', c: '#f0f6fc' }, { t: 'ClusterConfig', c: '#ffa657' }, { t: '): ', c: '#f0f6fc' }, { t: 'Promise<ReadyState>', c: '#79c0ff' }, { t: ' {', c: '#f0f6fc' }] },
    { num: '10', tokens: [{ t: '    const ', c: '#ff7b72' }, { t: 'orchestrator ', c: '#79c0ff' }, { t: '= new ', c: '#ff7b72' }, { t: 'MultiAgent', c: '#ffa657' }, { t: '({', c: '#f0f6fc' }] },
    { num: '11', tokens: [{ t: '      stack: ', c: '#79c0ff' }, { t: "['Three.js', 'PostgreSQL', 'Blender', 'Fastify'],", c: '#a5d6ff' }] },
    { num: '12', tokens: [{ t: '      performance: ', c: '#79c0ff' }, { t: "'60 FPS High-Fidelity',", c: '#a5d6ff' }] },
    { num: '13', tokens: [{ t: '      targetLatencyMs: ', c: '#79c0ff' }, { t: '16.4', c: '#79c0ff' }] },
    { num: '14', tokens: [{ t: '    });', c: '#f0f6fc' }] },
    { num: '15', tokens: [{ t: '    return ', c: '#ff7b72' }, { t: 'await ', c: '#ff7b72' }, { t: 'orchestrator.', c: '#f0f6fc' }, { t: 'deployEcosystem', c: '#d2a8ff' }, { t: '();', c: '#f0f6fc' }] },
    { num: '16', tokens: [{ t: '  }', c: '#f0f6fc' }] },
    { num: '17', tokens: [{ t: '}', c: '#f0f6fc' }] }
  ];

  let cy = 84;
  codeLines.forEach(line => {
    ctx.fillStyle = '#484f58';
    ctx.font = '12px monospace';
    ctx.fillText(line.num, 248, cy);

    let cx = 284;
    line.tokens.forEach(tok => {
      ctx.fillStyle = tok.c;
      ctx.font = '13px monospace';
      ctx.fillText(tok.t, cx, cy);
      cx += ctx.measureText(tok.t).width;
    });
    cy += 21;
  });

  // Bottom Terminal
  ctx.fillStyle = '#04070a';
  ctx.fillRect(240, 442, 784, 70);
  ctx.fillStyle = '#21262d';
  ctx.fillRect(240, 442, 784, 1);

  ctx.fillStyle = '#3fb950';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('TERMINAL (voffice-runtime)', 256, 462);

  ctx.fillStyle = '#f0f6fc';
  ctx.font = '12px monospace';
  ctx.fillText('voffice-runtime: build passed (148ms) | 0 errors | 100% type safety | GPA: 3.94', 256, 486);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(815, 474, 8, 14);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createMetricsDashboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080d16';
  ctx.fillRect(0, 0, 1024, 512);

  // Header Bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 52);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 52, 1024, 1);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('SYSTEM METRICS & SERVICE TOPOLOGY', 24, 33);

  // Status Badge
  ctx.fillStyle = 'rgba(191, 255, 25, 0.15)';
  ctx.fillRect(520, 14, 140, 26);
  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('STATUS: ONLINE', 530, 31);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('NODE: AP-SOUTHEAST-3 | LATENCY: 14.2ms', 680, 31);

  // 3 Metric Cards
  const cards = [
    { title: 'PRODUKTIVITAS KODE', val: '124k+ LOC', sub: 'TypeScript & Python Core', color: '#38bdf8' },
    { title: 'INDEX PRESTASI KUMULATIF', val: 'IPK 3.94 / 4.00', sub: 'Universitas Muhammadiyah Jember', color: '#bfff19' },
    { title: 'KEHANDALAN SISTEM', val: '99.98% UPTIME', sub: 'Digital Posyandu & Mandiri API', color: '#38bdf8' }
  ];

  cards.forEach((c, idx) => {
    const cx = 24 + idx * 328;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx, 68, 314, 92);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(cx, 68, 314, 92);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(c.title, cx + 16, 90);

    ctx.fillStyle = c.color;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(c.val, cx + 16, 122);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(c.sub, cx + 16, 144);
  });

  // Left Graph
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, 178, 480, 308);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeRect(24, 178, 480, 308);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Throughput Layanan & Respons API (ms)', 42, 206);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let y = 230; y <= 440; y += 42) {
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(486, y);
    ctx.stroke();
  }

  const points = [
    [42, 380], [90, 340], [140, 370], [190, 300], 
    [240, 320], [290, 260], [340, 290], [390, 240], 
    [440, 270], [486, 230]
  ];

  const grad = ctx.createLinearGradient(0, 230, 0, 440);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  ctx.beginPath();
  ctx.moveTo(points[0][0], 440);
  points.forEach(pt => ctx.lineTo(pt[0], pt[1]));
  ctx.lineTo(486, 440);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((pt, i) => i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1]));
  ctx.stroke();

  ctx.strokeStyle = '#bfff19';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  points.forEach((pt, i) => {
    const y2 = pt[1] + 35 + Math.sin(i * 1.2) * 15;
    i === 0 ? ctx.moveTo(pt[0], y2) : ctx.lineTo(pt[0], y2);
  });
  ctx.stroke();

  // Right Side: Microservices Cluster Diagram
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(520, 178, 480, 308);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.strokeRect(520, 178, 480, 308);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Topologi Microservices & AI Agent Bus', 538, 206);

  const nodes = [
    { title: 'API Gateway', sub: 'Reverse Proxy / SSL', x: 540, y: 236, w: 180, h: 50, color: '#38bdf8' },
    { title: 'Context7 MCP', sub: 'Docs & Embeddings', x: 790, y: 236, w: 190, h: 50, color: '#bfff19' },
    { title: 'Core Node Server', sub: 'Fastify / Cluster', x: 540, y: 326, w: 180, h: 50, color: '#38bdf8' },
    { title: 'Agent Swarm', sub: 'Autonomous Reasoning', x: 790, y: 326, w: 190, h: 50, color: '#bfff19' },
    { title: 'PostgreSQL DB', sub: 'Prisma ORM Multi-Tenant', x: 540, y: 416, w: 200, h: 50, color: '#38bdf8' },
    { title: 'Three.js 3D WebGL', sub: 'PBR 60fps Pipeline', x: 780, y: 416, w: 200, h: 50, color: '#bfff19' }
  ];

  nodes.forEach(n => {
    ctx.fillStyle = '#162032';
    ctx.fillRect(n.x, n.y, n.w, n.h);
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(n.x, n.y, n.w, n.h);

    ctx.fillStyle = n.color;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(n.title, n.x + 12, n.y + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText(n.sub, n.x + 12, n.y + 38);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createBlueprintTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#060e1c';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 984, 472);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('BLUEPRINT REF: ARCH-2026-VICKY-VOFFICE | FULL STACK & AI SYSTEM', 40, 56);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('LEAD ENGINEER: M. VICKY MOSAFAN (IPK 3.94) | UNIVERSITAS MUHAMMADIYAH JEMBER', 40, 78);

  const blocks = [
    { title: 'LAYER 1: CLIENT PRESENTATION', items: ['Three.js WebGL 2.0 PBR Renderer', 'PMREM RoomEnvironment Studio IBL', 'Dynamic CSS2D Interaction Badges', 'Responsive 60 FPS Mobile Touch & Web'], x: 40, y: 110, w: 290, h: 220 },
    { title: 'LAYER 2: AGENT ENGINE & API', items: ['Context7 Semantic Knowledge Retriever', 'Multi-Agent Autonomous Supervisor', 'Fastify Streaming Event Bus', 'JWT Security & Role-Based ACL'], x: 366, y: 110, w: 290, h: 220 },
    { title: 'LAYER 3: DATA PERSISTENCE', items: ['PostgreSQL Relational Storage', 'Prisma Type-Safe ORM Migration', 'Digital Posyandu Realtime Telemetry', 'Mandiri NewsAPL High-Volume Caching'], x: 692, y: 110, w: 290, h: 220 }
  ];

  blocks.forEach(b => {
    ctx.fillStyle = 'rgba(14, 28, 48, 0.75)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = '#bfff19';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(b.title, b.x + 14, b.y + 28);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    let iy = b.y + 60;
    b.items.forEach(it => {
      ctx.fillText('> ' + it, b.x + 14, iy);
      iy += 36;
    });
  });

  ctx.fillStyle = 'rgba(191, 255, 25, 0.12)';
  ctx.fillRect(40, 360, 944, 110);
  ctx.strokeStyle = '#bfff19';
  ctx.strokeRect(40, 360, 944, 110);

  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('VERIFIED ARCHITECTURAL SPECIFICATION & CAPABILITIES', 60, 390);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px monospace';
  ctx.fillText('STATUS: PRODUCTION READY | ACCREDITATION: S1 SISTEM INFORMASI (IPK 3.94) | HIMAFORSI DEPT HEAD', 60, 416);
  ctx.fillText('CONTACT: vickymosafan@gmail.com | WHATSAPP: +62 822-3490-6710 | GITHUB: github.com/vickymosafan', 60, 442);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createLaptopTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090d14';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 24);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(14, 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eab308';
  ctx.beginPath(); ctx.arc(28, 12, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath(); ctx.arc(42, 12, 4, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('zsh: vicky@macbook-pro ~/voffice-portfolio', 60, 16);

  ctx.fillStyle = '#bfff19';
  ctx.font = '12px monospace';
  ctx.fillText('vicky@macbook:~$ node ./bin/serve-node.mjs', 16, 50);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText('[VOffice Studio] Listening on http://127.0.0.1:8788/kerja', 16, 76);
  ctx.fillText('[PBR Pipeline] RoomEnvironment PMREM initialized', 16, 98);
  ctx.fillText('[Blender GLB] 28 consolidated meshes loaded', 16, 120);
  ctx.fillText('[Context7 MCP] Dynamic docs retrieval active', 16, 142);
  ctx.fillText('[Auth & DB] PostgreSQL connected | Prisma synced', 16, 164);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText('> 60 FPS Stable | Memory: 142MB | Ready for visitor', 16, 200);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function createVisitorHUDTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#080d16';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 1000, 488);

  ctx.strokeStyle = 'rgba(191, 255, 25, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, 988, 476);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, 984, 60);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('M. VICKY MOSAFAN | LEAD FULL-STACK & AI ENGINEER', 40, 56);

  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('IPK 3.94 / 4.00 (S1 SISTEM INFORMASI)', 680, 56);

  // 3 Columns:
  // Col 1: Tech Stack Matrix
  ctx.fillStyle = '#111827';
  ctx.fillRect(36, 100, 290, 290);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.strokeRect(36, 100, 290, 290);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('CORE COMPETENCIES', 50, 126);

  const skills = [
    'TypeScript 5.8 / Node.js 22',
    'Three.js 3D WebGL / PBR',
    'PostgreSQL / Prisma ORM',
    'Context7 MCP Multi-Agent',
    'Fastify / REST & WebSocket',
    'Blender 3D Asset Pipeline',
    'Docker & CI/CD Deployment'
  ];
  let sy = 160;
  skills.forEach(s => {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText('> ' + s, 50, sy);
    sy += 32;
  });

  // Col 2: Key Architecture Achievements
  ctx.fillStyle = '#111827';
  ctx.fillRect(366, 100, 290, 290);
  ctx.strokeStyle = 'rgba(191, 255, 25, 0.3)';
  ctx.strokeRect(366, 100, 290, 290);

  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('KEY DEPLOYMENTS', 380, 126);

  const projs = [
    'Digital Posyandu Realtime',
    'PT Antosa Architect Studio',
    'Bank Mandiri NewsAPL Engine',
    'HIMAFORSI Dept. MediaTech',
    'Relawan TIK Jember Lead'
  ];
  let py = 160;
  projs.forEach(p => {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText('* ' + p, 380, py);
    py += 36;
  });

  // Col 3: Live Telemetry
  ctx.fillStyle = '#111827';
  ctx.fillRect(696, 100, 290, 290);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
  ctx.strokeRect(696, 100, 290, 290);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ENGINE TELEMETRY', 710, 126);

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('STATUS: OPTIMAL', 710, 160);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText('FRAME RATE: 60 FPS (Stable)', 710, 196);
  ctx.fillText('MEMORY USAGE: 142MB', 710, 226);
  ctx.fillText('RENDER PIPELINE: PBR RoomEnv', 710, 256);
  ctx.fillText('STUDIO: Executive DevLab', 710, 286);
  ctx.fillText('INTERACTION: [E] Active', 710, 316);

  // Bottom Interactive Call to Action Bar
  ctx.fillStyle = 'rgba(191, 255, 25, 0.12)';
  ctx.fillRect(36, 410, 950, 68);
  ctx.strokeStyle = '#bfff19';
  ctx.strokeRect(36, 410, 950, 68);

  ctx.fillStyle = '#bfff19';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('[TEKAN E] Sapa M. Vicky Mosafan & Diskusikan Solusi Arsitektur Sistem', 110, 450);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------- Skyline Kota Malam
function buildExteriorSkyline() {
  const skylineGroup = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.8, metalness: 0.2 });
  const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe899 });
  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const buildings = [
    { x: -34, z: -26, w: 9, d: 9, h: 32 },
    { x: -20, z: -30, w: 8, d: 8, h: 42 },
    { x: -6, z: -34, w: 11, d: 11, h: 50 },
    { x: 8, z: -32, w: 9, d: 9, h: 44 },
    { x: 22, z: -28, w: 10, d: 10, h: 46 },
    { x: 36, z: -26, w: 8, d: 8, h: 32 },
    { x: -38, z: 2, w: 10, d: 10, h: 28 },
    { x: 38, z: 2, w: 10, d: 10, h: 30 },
    { x: -34, z: 20, w: 8, d: 8, h: 24 },
    { x: 34, z: 20, w: 8, d: 8, h: 26 }
  ];

  buildings.forEach((b, i) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), towerMat);
    tower.position.set(b.x, b.h / 2, b.z);
    skylineGroup.add(tower);

    for (let j = 0; j < 8; j++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.3), (i + j) % 3 === 0 ? cyanGlowMat : windowGlowMat);
      win.position.set(b.x - b.w / 2 + 1.2 + (j % 3) * 2.5, 6 + Math.floor(j / 3) * 7, b.z + b.d / 2 + 0.05);
      skylineGroup.add(win);
    }
  });

  scene.add(skylineGroup);
}

// ---------------------------------------------------------------- Model Arsitektur Terkonsolidasi
function loadConsolidatedArchitecture() {
  const loadStatusText = document.getElementById('loadingStatus');
  const loadProgressBar = document.getElementById('loadingBar');

  // Tekstur arsitektur (terrazzo, kayu, beton, kuningan) kini dibawa langsung oleh GLB.
  // Runtime hanya menyintesis material yang benar-benar dinamis: permukaan air beriak.
  const waterTex = createPoolWaterTexture();

  gltfLoader.load(
    '/kerja/assets/models/architecture_voffice_v2.glb',
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          const rawName = child.name;
          const n = rawName.toLowerCase();
          const matName = (child.material && child.material.name) ? child.material.name.toLowerCase() : '';

          // Kolam reflektif: satu-satunya material arsitektur yang disintesis runtime,
          // karena permukaannya perlu dianimasikan (riak air) tiap frame.
          if (rawName === 'Pool_Water_Surface') {
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0x0a2338,
              transmission: 0.85,
              transparent: true,
              opacity: 0.9,
              roughness: 0.05,
              metalness: 0.0,
              ior: 1.333,
              map: waterTex,
              envMapIntensity: 1.4
            });
            state.waterMat = child.material;
            child.receiveShadow = true;
            return;
          }

          // 5. Workstation Screen Displays (rig tiga monitor: C = pusat, L/R = sayap)
          if (rawName === 'DevLab_Display_Panel_C') {
            child.material = new THREE.MeshBasicMaterial({
              map: createCodeEditorTexture(),
              side: THREE.DoubleSide
            });
            child.castShadow = false;
            return;
          }
          if (rawName === 'DevLab_Display_Panel_L') {
            child.material = new THREE.MeshBasicMaterial({
              map: createMetricsDashboardTexture(),
              side: THREE.DoubleSide
            });
            child.castShadow = false;
            return;
          }
          if (rawName === 'DevLab_Display_Panel_R') {
            child.material = new THREE.MeshBasicMaterial({
              map: createVisitorHUDTexture(),
              side: THREE.DoubleSide
            });
            child.castShadow = false;
            return;
          }
          if (rawName === 'DevLab_Laptop_Display') {
            child.material = new THREE.MeshBasicMaterial({
              map: createLaptopTexture(),
              side: THREE.DoubleSide
            });
            child.castShadow = false;
            return;
          }
          if (rawName === 'DevLab_Blueprint_Glow') {
            child.material = new THREE.MeshBasicMaterial({
              map: createBlueprintTexture(),
              side: THREE.DoubleSide
            });
            child.castShadow = false;
            return;
          }

          // 6. Interactive 3D Kiosk Screen Panels
          if (rawName === 'Exhibit_Screen_0') {
            child.material = new THREE.MeshBasicMaterial({
              map: createExhibitScreenTexture(CV_DATA.projects[0]),
              side: THREE.DoubleSide
            });
            return;
          }
          if (rawName === 'Exhibit_Screen_1') {
            child.material = new THREE.MeshBasicMaterial({
              map: createExhibitScreenTexture(CV_DATA.projects[1]),
              side: THREE.DoubleSide
            });
            return;
          }
          if (rawName === 'Exhibit_Screen_2') {
            child.material = new THREE.MeshBasicMaterial({
              map: createExhibitScreenTexture(CV_DATA.projects[2]),
              side: THREE.DoubleSide
            });
            return;
          }

          const isGlass = n.includes('glass') || matName.includes('glass');
          const isCeiling = n.includes('ceiling');
          const isLED = matName.includes('led') || n.includes('led') || n.includes('display');

          if (!isGlass && !isCeiling && !isLED) {
            child.castShadow = true;
          }
          child.receiveShadow = true;

          // Kaca Arsitektural Fisik PBR
          if (isGlass) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0xd8eeff,
              metalness: 0.04,
              roughness: 0.03,
              transmission: 0.94,
              transparent: true,
              opacity: 0.32,
              ior: 1.52,
              reflectivity: 0.8
            });
            child.castShadow = false;
          } else if (isLED) {
            if (child.material) {
              child.material.toneMapped = false;
            }
          } else if (child.material && 'envMapIntensity' in child.material) {
            child.material.envMapIntensity = 1.05;
          }
        }
      });

      scene.add(model);
      hideLoadingOverlay();
    },
    (xhr) => {
      if (xhr.total > 0) {
        const pct = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
        if (loadProgressBar) loadProgressBar.style.width = `${pct}%`;
        if (loadStatusText) loadStatusText.textContent = `Memuat arsitektur 3D (${pct}%)...`;
      }
    },
    (err) => {
      console.error('Gagal memuat architecture_voffice_complete.glb:', err);
      hideLoadingOverlay();
    }
  );
}

// ---------------------------------------------------------------- 3D Holographic Beacons over Kiosks
function buildInteractiveProjectPosters() {
  const projects = CV_DATA.projects;

  // Koordinat 3D Kiosk dari Blender di Project Showcase (Three.js coordinates)
  const kioskDefs = [
    { x: 4.2, y: 0.35, z: -6.5, p: projects[0] },  // Healthcare Kiosk (Digital Posyandu)
    { x: 7.5, y: 0.35, z: -7.8, p: projects[1] },  // Banking Kiosk (Bank Mandiri NewsAPL)
    { x: 10.8, y: 0.35, z: -6.5, p: projects[2] }  // Museum Kiosk (PT Antosa Architect)
  ];

  kioskDefs.forEach((item, index) => {
    const group = new THREE.Group();
    group.position.set(item.x, item.y, item.z);

    // 1. Pulsing Floor Halo Ring
    const floorRingGeo = new THREE.RingGeometry(0.85, 0.95, 32);
    const floorRingMat = new THREE.MeshBasicMaterial({
      color: item.p.color || 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.02;

    // 2. Subtle Floating Holographic Beacon Pin (Hovering over kiosk at Y = 2.45m)
    const pinGroup = new THREE.Group();
    pinGroup.position.y = 2.45;

    const diamondGeo = new THREE.OctahedronGeometry(0.16, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: item.p.color || 0x38bdf8,
      wireframe: true
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);

    const haloGeo = new THREE.TorusGeometry(0.24, 0.015, 8, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: item.p.color || 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;

    pinGroup.add(diamond, halo);
    group.add(floorRing, pinGroup);
    scene.add(group);

    floatingPosters.push({ group: pinGroup, baseY: 2.45, offset: index * 1.5, floorRing });
  });
}

// ---------------------------------------------------------------- Generator Karakter 3D Humanoid Stylized
function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

const shadowTexture = createContactShadowTexture();

function createStylizedHumanoid(cfg) {
  const root = new THREE.Group();

  const mat = (c, r, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const skinMat = mat(cfg.skinColor, 0.58);
  const topMat = mat(cfg.topColor, 0.82);
  const pantsMat = mat(cfg.pantsColor, 0.86);
  const hairMat = mat(cfg.hairColor, 0.42);
  const shoesMat = mat(cfg.shoesColor || 0x14171d, 0.55);
  const accentMat = mat(cfg.accentColor || 0x38bdf8, 0.32, 0.3);
  const darkMat = mat(0x0f1218, 0.45);

  // Kepala: tengkorak + rahang + tutup rambut (bukan bola penuh, agar wajah terlihat)
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.585;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.118, 26, 20), skinMat);
  skull.scale.set(0.96, 1.10, 1.0);
  skull.castShadow = true;

  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.098, 20, 14), skinMat);
  jaw.position.set(0, -0.055, 0.012);
  jaw.scale.set(1.0, 0.86, 1.02);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.126, 26, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hairCap.position.set(0, 0.008, -0.006);
  hairCap.rotation.x = -0.14;
  hairCap.scale.set(1.0, 1.06, 1.02);

  const hairBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.118, 20, 14, 0, Math.PI, Math.PI * 0.16, Math.PI * 0.72), hairMat);
  hairBack.rotation.y = Math.PI;
  hairBack.position.set(0, -0.010, -0.010);

  const eyeGeo = new THREE.SphereGeometry(0.0155, 10, 8);
  const eyeL = new THREE.Mesh(eyeGeo, darkMat); eyeL.position.set(-0.036, 0.010, 0.104);
  const eyeR = new THREE.Mesh(eyeGeo, darkMat); eyeR.position.set(0.036, 0.010, 0.104);
  const browGeo = new THREE.BoxGeometry(0.034, 0.007, 0.010);
  const browL = new THREE.Mesh(browGeo, hairMat); browL.position.set(-0.036, 0.044, 0.103);
  const browR = new THREE.Mesh(browGeo, hairMat); browR.position.set(0.036, 0.044, 0.103);
  const earGeo = new THREE.SphereGeometry(0.021, 10, 8);
  const earL = new THREE.Mesh(earGeo, skinMat); earL.position.set(-0.112, 0.0, 0.006); earL.scale.set(0.55, 1, 0.8);
  const earR = new THREE.Mesh(earGeo, skinMat); earR.position.set(0.112, 0.0, 0.006); earR.scale.set(0.55, 1, 0.8);
  headGroup.add(skull, jaw, hairCap, hairBack, eyeL, eyeR, browL, browR, earL, earR);

  // Aksesoris Karakter
  if (cfg.hasHeadphones) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.016, 8, 28, Math.PI), hairMat);
    band.rotation.z = Math.PI;
    band.position.y = 0.022;
    const cupGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.032, 16);
    const cupL = new THREE.Mesh(cupGeo, darkMat);
    cupL.rotation.z = Math.PI / 2;
    cupL.position.set(-0.126, 0.0, 0.004);
    const cupR = new THREE.Mesh(cupGeo, darkMat);
    cupR.rotation.z = Math.PI / 2;
    cupR.position.set(0.126, 0.0, 0.004);
    headGroup.add(band, cupL, cupR);
  }

  if (cfg.hasEarpiece) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), accentMat);
    ear.position.set(0.112, -0.012, 0.016);
    headGroup.add(ear);
  }

  // Leher
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.058, 0.10, 16), skinMat);
  neck.position.y = 1.455;

  // Torso: bahu lebih lebar dari pinggang (siluet manusiawi, bukan kotak)
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.152, 0.20, 6, 20), topMat);
  chest.position.y = 1.165;
  chest.scale.set(1.30, 1.0, 0.70);
  chest.castShadow = true;

  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(0.140, 0.06, 6, 20), pantsMat);
  waist.position.y = 0.905;
  waist.scale.set(1.12, 1.0, 0.76);

  // ID Lanyard Badge Vicky
  let lanyardCord = null;
  let lanyardBadge = null;
  if (cfg.hasLanyard) {
    lanyardCord = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.006, 8, 20, Math.PI * 1.1), darkMat);
    lanyardCord.position.set(0, 1.325, 0.02);
    lanyardCord.rotation.x = 0.35;
    lanyardBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.11), new THREE.MeshBasicMaterial({ color: 0xbfff19 }));
    lanyardBadge.position.set(0, 1.205, 0.108);
    root.add(lanyardCord, lanyardBadge);
  }

  // Lengan: kapsul (lengan atas + bawah) dengan pivot bahu
  function buildArm(sign) {
    const g = new THREE.Group();
    g.position.set(0.215 * sign, 1.352, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.19, 5, 14), topMat);
    upper.position.y = -0.145;
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.17, 5, 14), skinMat);
    fore.position.y = -0.395;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), skinMat);
    hand.position.y = -0.505;
    hand.scale.set(1.0, 1.12, 0.72);
    g.add(upper, fore, hand);
    return g;
  }
  const armLGroup = buildArm(-1);
  const armRGroup = buildArm(1);

  // Kaki: paha + betis + sepatu, tapak tepat di y = 0 (tidak melayang)
  function buildLeg(sign) {
    const g = new THREE.Group();
    g.position.set(0.098 * sign, 0.865, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.26, 5, 14), pantsMat);
    thigh.position.y = -0.196;
    thigh.castShadow = true;
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.050, 0.30, 5, 14), pantsMat);
    shin.position.y = -0.585;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.072, 0.21), shoesMat);
    shoe.position.set(0, -0.829, 0.035);
    g.add(thigh, shin, shoe);
    return g;
  }
  const legLGroup = buildLeg(-1);
  const legRGroup = buildLeg(1);

  // Modifikasi Pose Duduk di Kursi Kerja Eksekutif
  if (cfg.isSitting) {
    waist.position.y = 0.44;
    chest.position.y = 0.72;
    neck.position.y = 1.00;
    headGroup.position.y = 1.115;
    headGroup.rotation.x = 0.06;
    if (lanyardCord) { lanyardCord.position.y = 0.88; lanyardBadge.position.y = 0.775; }

    legLGroup.position.set(-0.098, 0.44, 0.0);
    legRGroup.position.set(0.098, 0.44, 0.0);
    legLGroup.rotation.x = -Math.PI / 2.2;
    legRGroup.rotation.x = -Math.PI / 2.2;

    armLGroup.position.set(-0.19, 0.90, 0.05);
    armRGroup.position.set(0.19, 0.90, 0.05);
    armLGroup.rotation.x = -Math.PI / 2.7;
    armLGroup.rotation.y = 0.22;
    armRGroup.rotation.x = -Math.PI / 2.7;
    armRGroup.rotation.y = -0.22;
  }

  // Kontak Bayangan Halus di Bawah Kaki
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.72 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;

  root.add(headGroup, neck, chest, waist, armLGroup, armRGroup, legLGroup, legRGroup, shadowPlane);

  return {
    root,
    head: headGroup,
    chest,
    armL: armLGroup,
    armR: armRGroup,
    legL: legLGroup,
    legR: legRGroup
  };
}

function buildStylizedAvatars() {
  // 1. Player (Tamu Pengunjung) - Resting naturally at Y = 0.35m
  const playerAvatar = createStylizedHumanoid({
    skinColor: 0xdfab76,
    hairColor: 0x1f242d,
    topColor: 0x2563eb,
    pantsColor: 0x111622,
    shoesColor: 0xffffff,
    accentColor: 0x38bdf8
  });
  playerAvatar.root.position.copy(state.player.position);
  state.player.mesh = playerAvatar.root;
  state.player.parts = playerAvatar;
  scene.add(playerAvatar.root);

  // 2. Aria (Virtual Host Concierge di Lobby) - Behind the reception desk at Z = 3.7m
  const ariaAvatar = createStylizedHumanoid({
    skinColor: 0xf5cfb0,
    hairColor: 0x0f172a,
    topColor: 0x1e293b,
    pantsColor: 0x0f172a,
    shoesColor: 0x0a0e17,
    accentColor: 0xd4af37,
    hasEarpiece: true
  });
  ariaAvatar.root.position.set(0, 0.35, 3.7);
  ariaAvatar.root.rotation.y = 0;
  ariaAvatarParts = ariaAvatar;
  scene.add(ariaAvatar.root);

  // 3. M. Vicky Mosafan (Developer di Developer Lab) - In Herman Miller chair at Z = -6.35m
  const vickyAvatar = createStylizedHumanoid({
    skinColor: 0xdfab76,
    hairColor: 0x181e28,
    topColor: 0x141b25,
    pantsColor: 0x0c0f16,
    shoesColor: 0x222a38,
    accentColor: 0xbfff19,
    hasHeadphones: true,
    hasLanyard: true,
    isSitting: true
  });
  vickyAvatar.root.position.set(-7.5, 0.35, -6.35);
  vickyAvatar.root.rotation.y = 0;
  vickyAvatarParts = vickyAvatar;
  scene.add(vickyAvatar.root);
}

// ---------------------------------------------------------------- Titik Interaksi Proximity
function registerInteractables() {
  state.interactables = [
    {
      id: 'aria-host',
      name: 'Aria (Virtual Concierge)',
      pos: new THREE.Vector3(0, 0.35, 5.5),
      dist: 2.5,
      promptText: 'Sapa Aria (Host)',
      action: () => {
        showDialogue('Aria (Host)', 'Selamat datang di Vicky VOffice! Vicky sedang berada di Developer Suite di sebelah kiri. Silakan masuk ke sana untuk melihat demo arsitektur sistem dan live metrics!');
        advanceMission(1);
      }
    },
    {
      id: 'vicky-dev',
      name: 'M. Vicky Mosafan',
      pos: new THREE.Vector3(-7.5, 0.35, -4.2),
      dist: 2.8,
      promptText: 'Sapa M. Vicky Mosafan',
      action: () => {
        showDialogue('M. Vicky Mosafan', 'Halo! Selamat datang di Developer Suite saya. Saya mahasiswa S1 Sistem Informasi Universitas Muhammadiyah Jember dengan IPK 3.94, fokus pada Full-Stack & AI Augmented Engineering. Di meja ini Anda dapat melihat arsitektur sistem dan live metrics dari aplikasi yang saya rancang.');
        advanceMission(2);
      }
    },
    {
      id: 'proj-posyandu',
      name: 'Digital Posyandu',
      pos: new THREE.Vector3(4.2, 0.35, -5.5),
      dist: 2.5,
      promptText: 'Buka Detail Proyek Digital Posyandu',
      action: () => {
        openProjectDetail(0);
        advanceMission(3);
      }
    },
    {
      id: 'proj-mandiri',
      name: 'NewsAPL Bank Mandiri',
      pos: new THREE.Vector3(7.5, 0.35, -6.8),
      dist: 2.5,
      promptText: 'Buka Detail Proyek NewsAPL Mandiri',
      action: () => {
        openProjectDetail(1);
        advanceMission(3);
      }
    },
    {
      id: 'proj-antosa',
      name: 'PT Antosa Architect',
      pos: new THREE.Vector3(10.8, 0.35, -5.5),
      dist: 2.5,
      promptText: 'Buka Detail Proyek PT Antosa Architect',
      action: () => {
        openProjectDetail(2);
        advanceMission(3);
      }
    },
    {
      id: 'proj-neural',
      name: 'Neural AI Core',
      pos: new THREE.Vector3(7.5, 0.35, -3.2),
      dist: 2.5,
      promptText: 'Inspeksi Neural Hologram Core',
      action: () => {
        showDialogue('Neural AI Core', 'Komponen Autonomous Agent Swarm & Context7 Engine: Menyediakan semantic search, automasi alur kerja, dan komputasi cerdas pada seluruh portofolio sistem Vicky.');
        advanceMission(3);
      }
    },
    {
      id: 'lounge-cafe',
      name: 'Lounge & Cafe Eksekutif',
      pos: new THREE.Vector3(5.5, 0.35, 5.0),
      dist: 3.0,
      promptText: 'Nikmati Lounge & Espresso Bar',
      action: () => {
        showDialogue('Executive Lounge', 'M. Vicky Mosafan menjabat sebagai Kepala Departemen MediaTech HIMAFORSI UMJ (2022-2024), aktif sebagai Relawan TIK Jember, serta memiliki 15+ sertifikasi kompetensi rekayasa perangkat lunak.');
        advanceMission(4);
      }
    },
    {
      id: 'exterior-supercar',
      name: 'Arrival Carport & Supercar',
      pos: new THREE.Vector3(7.5, 0.05, 12.5),
      dist: 3.5,
      promptText: 'Periksa Supercar Arrival Driveway',
      action: () => {
        showDialogue('Arrival Carport', 'Paving driveway and supercar arrival zone. Paviliun arsitektural modern dengan plinth pondasi beton, curtain walls kaca minimalis, dan kolam reflektif perimeter.');
      }
    }
  ];
}

// ---------------------------------------------------------------- Sistem Misi Gamified (Holixora Style)
const MISSIONS = [
  { title: 'Kunjungi Lobby & Sapa Aria', copy: 'Berjalan ke meja resepsionis dan dekati Aria.', progress: 15 },
  { title: 'Masuk ke Developer Lab', copy: 'Lewati koridor kiri dan temui M. Vicky Mosafan di mejanya.', progress: 40 },
  { title: 'Eksplorasi Galeri Proyek', copy: 'Kunjungi ruang pameran di sayap kanan dan periksa studi kasus.', progress: 70 },
  { title: 'Kunjungi Lounge & Cafe', copy: 'Periksa piagam kepemimpinan organisasi dan sertifikasi.', progress: 90 },
  { title: 'Eksplorasi Selesai', copy: 'Anda telah menjelajahi seluruh studio. Unduh CV atau kirim pesan.', progress: 100 }
];

function setMission(step) {
  state.missionStep = Math.min(step, MISSIONS.length - 1);
  const m = MISSIONS[state.missionStep];
  if (dom.missionTitle) dom.missionTitle.textContent = m.title;
  if (dom.missionCopy) dom.missionCopy.textContent = m.copy;
  if (dom.missionProgressBar) dom.missionProgressBar.style.width = `${m.progress}%`;
}

function advanceMission(toStep) {
  if (toStep > state.missionStep) {
    setMission(toStep);
  }
}

// ---------------------------------------------------------------- Kontrol Input & Joystick
function setupInputHandlers() {
  window.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        state.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        state.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        state.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        state.keys.right = true;
        break;
      case 'KeyE':
        triggerInteraction();
        break;
      case 'Escape':
        closeAllModals();
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        state.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        state.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        state.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        state.keys.right = false;
        break;
    }
  });

  if (dom.btnMobileAction) {
    dom.btnMobileAction.addEventListener('click', triggerInteraction);
  }

  // Mobile Virtual Joystick Handlers
  if (dom.joystickZone) {
    const handleTouchStart = (e) => {
      const rect = dom.joystickZone.getBoundingClientRect();
      state.joystick.active = true;
      state.joystick.originX = rect.left + rect.width / 2;
      state.joystick.originY = rect.top + rect.height / 2;
      handleTouchMove(e);
    };

    const handleTouchMove = (e) => {
      if (!state.joystick.active) return;
      const touch = e.touches[0];
      const dx = touch.clientX - state.joystick.originX;
      const dy = touch.clientY - state.joystick.originY;
      const dist = Math.min(Math.hypot(dx, dy), 45);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * dist;
      const knobY = Math.sin(angle) * dist;

      if (dom.joystickKnob) {
        dom.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
      }

      state.joystick.moveX = knobX / 45;
      state.joystick.moveY = knobY / 45;
    };

    const handleTouchEnd = () => {
      state.joystick.active = false;
      state.joystick.moveX = 0;
      state.joystick.moveY = 0;
      if (dom.joystickKnob) {
        dom.joystickKnob.style.transform = 'translate(-50%, -50%)';
      }
    };

    dom.joystickZone.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }

  dom.zonePills.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRoom = btn.getAttribute('data-room');
      teleportToRoom(targetRoom);
    });
  });

  if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);
  if (dom.camModeToggle) dom.camModeToggle.addEventListener('click', toggleCameraMode);
  if (dom.btnOpenDoc) dom.btnOpenDoc.addEventListener('click', openCompleteDoc);

  if (dom.interactionPrompt) {
    dom.interactionPrompt.addEventListener('click', triggerInteraction);
  }

  window.addEventListener('resize', onWindowResize);
}

// ---------------------------------------------------------------- Pergerakan & Kamera
function updatePlayer(delta) {
  const p = state.player;
  let moveX = 0;
  let moveZ = 0;

  if (state.keys.forward) moveZ -= 1;
  if (state.keys.backward) moveZ += 1;
  if (state.keys.left) moveX -= 1;
  if (state.keys.right) moveX += 1;

  if (state.joystick.active) {
    moveX = state.joystick.moveX;
    moveZ = state.joystick.moveY;
  }

  const len = Math.hypot(moveX, moveZ);
  if (len > 0.05) {
    p.isMoving = true;
    const normX = moveX / Math.max(1, len);
    const normZ = moveZ / Math.max(1, len);

    const camAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
    const worldMoveX = normX * Math.cos(camAngle) + normZ * Math.sin(camAngle);
    const worldMoveZ = -normX * Math.sin(camAngle) + normZ * Math.cos(camAngle);

    const newX = THREE.MathUtils.clamp(p.position.x + worldMoveX * p.speed * delta, -13.0, 13.0);
    const newZ = THREE.MathUtils.clamp(p.position.z + worldMoveZ * p.speed * delta, -9.2, 14.2);

    p.position.x = newX;
    p.position.z = newZ;

    const targetAngle = Math.atan2(worldMoveX, worldMoveZ);
    p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, targetAngle, 0.18);

    p.walkCycle += delta * 12;
    if (p.parts.legL && p.parts.legR) {
      p.parts.legL.rotation.x = Math.sin(p.walkCycle) * 0.45;
      p.parts.legR.rotation.x = -Math.sin(p.walkCycle) * 0.45;
      p.parts.armL.rotation.x = -Math.sin(p.walkCycle) * 0.35;
      p.parts.armR.rotation.x = Math.sin(p.walkCycle) * 0.35;
    }
  } else {
    p.isMoving = false;
    if (p.parts.legL && p.parts.legR) {
      p.parts.legL.rotation.x = THREE.MathUtils.lerp(p.parts.legL.rotation.x, 0, 0.2);
      p.parts.legR.rotation.x = THREE.MathUtils.lerp(p.parts.legR.rotation.x, 0, 0.2);
      p.parts.armL.rotation.x = THREE.MathUtils.lerp(p.parts.armL.rotation.x, 0, 0.2);
      p.parts.armR.rotation.x = THREE.MathUtils.lerp(p.parts.armR.rotation.x, 0, 0.2);
    }
  }

  p.mesh.position.copy(p.position);

  // Cinematic Over-the-Shoulder Camera (Unobstructed View)
  if (state.cameraMode === 'follow') {
    const camOffset = new THREE.Vector3(1.2, 2.3, 3.2);
    const targetCamPos = p.position.clone().add(camOffset);
    if (p.position.z < 9.2 && targetCamPos.z > 9.35) {
      targetCamPos.z = 9.35;
    }
    camera.position.lerp(targetCamPos, 0.1);
    controls.target.lerp(new THREE.Vector3(p.position.x - 0.35, 1.3, p.position.z), 0.12);
  }

  checkCurrentRoom();
  checkProximityInteractables();
}

function checkCurrentRoom() {
  const x = state.player.position.x;
  const z = state.player.position.z;
  let room = 'RECEPTION LOBBY';

  if (z > 9.8) {
    room = 'EXTERIOR TERRACE';
  } else if (x < -0.5 && z < 2.0) {
    room = 'DEVELOPER SUITE';
  } else if (x > 0.5 && z < 2.0) {
    room = 'PROJECT SHOWCASE';
  } else if (x > 0.5 && z >= 2.0) {
    room = 'LOUNGE & CAFE';
  } else if (x < -0.5 && z >= 2.0) {
    room = 'WEST CORRIDOR';
  } else {
    room = 'RECEPTION LOBBY';
  }

  if (state.currentRoom !== room) {
    state.currentRoom = room;
    if (dom.roomName) dom.roomName.textContent = `LOKASI: ${room}`;
  }
}

function checkProximityInteractables() {
  const pPos = state.player.position;
  let nearest = null;
  let minDist = Infinity;

  for (const item of state.interactables) {
    const d = pPos.distanceTo(item.pos);
    if (d < item.dist && d < minDist) {
      minDist = d;
      nearest = item;
    }
  }

  if (nearest !== state.nearestInteractable) {
    state.nearestInteractable = nearest;
    if (nearest) {
      showInteractionPrompt(nearest.promptText);
    } else {
      hideInteractionPrompt();
    }
  }
}

function triggerInteraction() {
  if (state.nearestInteractable && typeof state.nearestInteractable.action === 'function') {
    state.nearestInteractable.action();
  }
}

function showInteractionPrompt(text) {
  if (!dom.interactionPrompt || !dom.interactionLabel) return;
  dom.interactionLabel.textContent = text;
  dom.interactionPrompt.classList.add('visible');
}

function hideInteractionPrompt() {
  if (!dom.interactionPrompt) return;
  dom.interactionPrompt.classList.remove('visible');
}

function showDialogue(speaker, message) {
  if (!dom.dialogueBox || !dom.dialogueSpeaker || !dom.dialogueText) return;
  dom.dialogueSpeaker.textContent = speaker;
  dom.dialogueText.textContent = message;
  dom.dialogueBox.classList.add('visible');

  clearTimeout(state.activeDialogue);
  state.activeDialogue = setTimeout(() => {
    dom.dialogueBox.classList.remove('visible');
  }, 7500);
}

export function teleportToRoom(roomKey) {
  const coords = {
    exterior: { pos: new THREE.Vector3(0, 0.35, 13.5), cam: new THREE.Vector3(2.5, 3.2, 17.5) },
    lobby: { pos: new THREE.Vector3(0, 0.35, 6.8), cam: new THREE.Vector3(0.9, 2.2, 9.2) },
    devlab: { pos: new THREE.Vector3(-7.5, 0.35, -2.8), cam: new THREE.Vector3(-5.8, 2.4, 0.2) },
    showcase: { pos: new THREE.Vector3(7.5, 0.35, -2.0), cam: new THREE.Vector3(5.8, 2.4, 1.2) },
    lounge: { pos: new THREE.Vector3(5.5, 0.35, 4.5), cam: new THREE.Vector3(4.2, 2.2, 7.5) }
  };

  const target = coords[roomKey.toLowerCase()];
  if (target) {
    state.player.position.copy(target.pos);
    state.player.mesh.position.copy(target.pos);
    controls.target.set(target.pos.x - 0.3, 1.25, target.pos.z);
    camera.position.copy(target.cam);
  }
}
window.teleportToRoom = teleportToRoom;

// ---------------------------------------------------------------- Modals
export function openProjectDetail(idx) {
  const p = CV_DATA.projects[idx];
  if (!p || !dom.projectModal || !dom.projectModalBody) return;

  dom.projectModalBody.innerHTML = `
    <div style="border-left: 4px solid ${p.color || '#38bdf8'}; padding-left: 14px; margin-bottom: 16px;">
      <span style="color: ${p.color || '#38bdf8'}; font-weight: 700; font-size: 11px; text-transform: uppercase;">${p.category}</span>
      <h2 style="font-size: 20px; margin: 4px 0 8px;">${p.title}</h2>
      <p style="color: var(--muted); font-size: 13px;">${p.role} • ${p.period} • ${p.client}</p>
    </div>

    <div style="margin-bottom: 18px;">
      <h3 style="font-size: 14px; margin-bottom: 6px;">Ringkasan Arsitektur</h3>
      <p style="color: var(--ink); line-height: 1.6;">${p.highlight}</p>
      <ul style="padding-left: 20px; margin-top: 8px; color: var(--ink);">
        ${p.details.map(d => `<li style="margin-bottom: 6px;">${d}</li>`).join('')}
      </ul>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; margin-bottom: 8px;">Tech Stack</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${p.techStack.map(t => `<span style="background: rgba(255,255,255,0.08); border: 1px solid var(--line); padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${t}</span>`).join('')}
      </div>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <a href="https://github.com/vickymosafan" target="_blank" rel="noopener noreferrer" style="background: var(--lime); color: #090b0f; font-weight: 800; padding: 8px 18px; border-radius: 99px;">Buka GitHub</a>
      <button type="button" class="btn-close" style="padding: 8px 16px; border-radius: 99px; background: transparent; border: 1px solid var(--line); color: var(--ink);">Tutup</button>
    </div>
  `;

  dom.projectModalBody.querySelectorAll('.btn-close').forEach(b => b.addEventListener('click', closeAllModals));
  dom.projectModal.removeAttribute('hidden');
  dom.projectModal.classList.add('open');
  state.activeModal = dom.projectModal;
}

export function openCompleteDoc() {
  if (!dom.docModal || !dom.docModalBody) return;
  const p = CV_DATA.profile;

  dom.docModalBody.innerHTML = `
    <div style="margin-bottom: 18px;">
      <h1 style="font-size: 24px; font-weight: 800;">${p.fullName}</h1>
      <p style="color: var(--lime); font-weight: 600; font-size: 14px;">${p.title}</p>
      <p style="color: var(--muted); font-size: 12px; margin-top: 4px;">${p.location} • ${p.email} • ${p.phone}</p>
    </div>

    <hr style="border: 0; border-top: 1px solid var(--line); margin: 16px 0;">

    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 15px; margin-bottom: 6px;">Pendidikan</h3>
      <p><strong>${p.education.degree}</strong> - ${p.education.university} (IPK: ${p.education.gpa})</p>
      <p style="color: var(--muted); font-size: 12px;">${p.education.highSchool} • ${p.education.highSchoolActivity}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 15px; margin-bottom: 8px;">Pengalaman & Proyek Utama</h3>
      ${CV_DATA.projects.map(item => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>${item.title}</span>
            <span style="color: var(--muted); font-size: 12px;">${item.period}</span>
          </div>
          <p style="font-size: 12.5px; color: var(--muted);">${item.role} • ${item.client}</p>
        </div>
      `).join('')}
    </div>

    <div style="display: flex; justify-content: flex-end;">
      <button type="button" class="btn-close" style="padding: 8px 18px; border-radius: 99px; background: var(--lime); color: #090b0f; font-weight: 800; border: 0;">Tutup</button>
    </div>
  `;

  dom.docModalBody.querySelectorAll('.btn-close').forEach(b => b.addEventListener('click', closeAllModals));
  dom.docModal.removeAttribute('hidden');
  dom.docModal.classList.add('open');
  state.activeModal = dom.docModal;
}

export function closeAllModals() {
  if (dom.projectModal) {
    dom.projectModal.classList.remove('open');
    dom.projectModal.setAttribute('hidden', '');
  }
  if (dom.docModal) {
    dom.docModal.classList.remove('open');
    dom.docModal.setAttribute('hidden', '');
  }
  state.activeModal = null;
}

export function toggleCameraMode() {
  state.cameraMode = state.cameraMode === 'follow' ? 'orbit' : 'follow';
  if (dom.camModeToggle) {
    dom.camModeToggle.textContent = state.cameraMode === 'follow' ? '🎥 Kamera: Follow' : '🌐 Kamera: Bebas';
  }
}

export function toggleTheme() {
  state.theme = state.theme === 'night' ? 'day' : 'night';
  const day = state.theme === 'day';
  const bg = day ? 0xcfe0f2 : 0x06080c;
  scene.background.setHex(bg);
  scene.fog.color.setHex(bg);
  if (skyMat) {
    skyMat.uniforms.topColor.value.setHex(day ? 0x8fb4dd : 0x0d1b30);
    skyMat.uniforms.midColor.value.setHex(day ? 0xd3e2f2 : 0x0a1220);
    skyMat.uniforms.botColor.value.setHex(day ? 0xb9c6d4 : 0x05070b);
  }
  lights.hemi.color.setHex(day ? 0xffffff : 0x9fb6d6);
  lights.hemi.groundColor.setHex(day ? 0x8a8578 : 0x191b1f);
  lights.hemi.intensity = day ? 0.9 : 0.45;
  lights.ambient.color.setHex(day ? 0xffffff : 0x243247);
  lights.ambient.intensity = day ? 0.35 : 0.22;
  lights.rim.intensity = day ? 0.25 : 0.7;
  lights.moon.color.setHex(day ? 0xfff2df : 0xffe7c9);
  lights.moon.intensity = day ? 3.4 : 3.0;
  renderer.toneMappingExposure = day ? 1.05 : 1.0;
  if (dom.themeToggle) dom.themeToggle.textContent = day ? '☀️ Siang' : '🌙 Malam';
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------------------------------------------------------------- Render Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  updatePlayer(delta);
  controls.update();

  // Riak air: menggeser UV peta air perlahan. Satu-satunya material ter-animasi.
  if (state.waterMat && state.waterMat.map) {
    state.waterMat.map.offset.x = elapsed * 0.012;
    state.waterMat.map.offset.y = elapsed * 0.02;
  }

  // Animasi Melayang & Berputar Halus Holographic Beacons
  floatingPosters.forEach((p) => {
    p.group.position.y = p.baseY + Math.sin(elapsed * 2 + p.offset) * 0.05;
    p.group.rotation.y = elapsed * 0.8;
    if (p.floorRing && p.floorRing.material) {
      p.floorRing.material.opacity = 0.55 + Math.sin(elapsed * 3 + p.offset) * 0.25;
    }
  });

  // Animasi Melambai Aria saat pemain mendekat
  if (ariaAvatarParts.armR && state.nearestInteractable?.id === 'aria-host') {
    ariaAvatarParts.armR.rotation.z = Math.sin(elapsed * 5) * 0.4 + 0.3;
  }

  // Animasi Mengetik Vicky di Developer Lab
  if (vickyAvatarParts.armL && vickyAvatarParts.armR) {
    vickyAvatarParts.armL.rotation.x = -Math.PI / 3.2 + Math.sin(elapsed * 12) * 0.06;
    vickyAvatarParts.armR.rotation.x = -Math.PI / 3.2 + Math.cos(elapsed * 12) * 0.06;
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVOffice);
} else {
  initVOffice();
}
