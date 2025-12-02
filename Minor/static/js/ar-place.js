import * as THREE from "https://unpkg.com/three@0.160/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160/examples/jsm/loaders/GLTFLoader.js";
import { ARButton } from "https://unpkg.com/three@0.160/examples/jsm/webxr/ARButton.js";

const canvas = document.getElementById("ib-canvas");
const startBtn = document.getElementById("ib-start");
const modelSelect = document.getElementById("ib-model");

// --- Renderer / DPR-aware sizing
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.xr.enabled = true;
function resizeRendererToDisplaySize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  }
}
window.addEventListener('resize', resizeRendererToDisplaySize);

// --- Scene / Camera / Light
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1));

// --- Loading models
const loader = new GLTFLoader();
let currentModel = null;   // GLTF scene to clone when placing
let placed = null;         // last placed object (selected)
async function loadModel(path) {
  return new Promise((resolve, reject) => {
    loader.load(path, (g) => resolve(g.scene), undefined, reject);
  });
}
async function ensureModelLoaded() {
  if (!currentModel) currentModel = await loadModel(modelSelect.value);
}
modelSelect.addEventListener('change', async () => {
  currentModel = await loadModel(modelSelect.value);
});

// --- Reticle
let reticle;
(function makeReticle() {
  const geo = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  reticle = new THREE.Mesh(geo, mat);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
})();

// --- WebXR hit test sources
let viewerHitTestSource = null;            // center-of-view (for reticle / tap-to-place)
let localSpace = null;
let transientHitTestSource = null;         // touch-based (for dragging under finger)

// --- Controller: tap to place
const controller = renderer.xr.getController(0);
controller.addEventListener('select', () => {
  if (!reticle?.visible || !currentModel) return;
  placed = currentModel.clone(true);
  placed.userData.placed = true;
  placed.position.setFromMatrixPosition(reticle.matrix);
  placed.quaternion.setFromRotationMatrix(reticle.matrix);
  scene.add(placed);
});
scene.add(controller);

// --- Gestures: drag to move (transient input), pinch to scale, twist to rotate
let dragging = false;
let rotating = false;
let scaling = false;
let baseAngle = 0;
let baseDist = 0;
let baseScale = 1;

function getTouches(e) { return e.touches ? Array.from(e.touches) : []; }
function angle(p1, p2) { return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX); }
function distance(p1, p2) { const dx = p2.clientX - p1.clientX, dy = p2.clientY - p1.clientY; return Math.hypot(dx, dy); }

canvas.addEventListener('touchstart', (e) => {
  if (!placed) return;
  const t = getTouches(e);
  if (t.length === 1) {
    dragging = true; // we will move with transient hit-tests
  } else if (t.length === 2) {
    rotating = true; scaling = true;
    baseAngle = angle(t[0], t[1]);
    baseDist  = distance(t[0], t[1]);
    baseScale = placed.scale.x || 1;
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!placed) return;
  const t = getTouches(e);
  // Two-finger rotate + scale
  if (t.length === 2 && rotating && scaling) {
    const ang = angle(t[0], t[1]);
    const dist = distance(t[0], t[1]);
    const deltaAng = ang - baseAngle;
    placed.rotation.y += deltaAng;
    baseAngle = ang;

    const s = THREE.MathUtils.clamp((dist / baseDist) * baseScale, 0.2, 5);
    placed.scale.setScalar(s);
  }
  // One-finger drag is handled each XR frame via transient hit-test (see render loop)
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => {
  dragging = rotating = scaling = false;
}, { passive: true });

// --- Support checks
async function checkWebXRSupport() {
  if (!('xr' in navigator)) throw new Error('WebXR not available in this browser.');
  const ok = await navigator.xr.isSessionSupported('immersive-ar');
  if (!ok) throw new Error('This device does not support immersive AR (needs ARCore / WebXR).');
}

// --- Start AR
startBtn.addEventListener('click', async () => {
  try {
    await checkWebXRSupport();
    await ensureModelLoaded();

    // Show ARButton (optional) and start session
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));
    const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'] });
    renderer.xr.setSession(session);

    // Reference spaces
    localSpace = await session.requestReferenceSpace('local');

    // Viewer-space hit-test for reticle / tap-to-place
    const viewerSpace = await session.requestReferenceSpace('viewer');
    viewerHitTestSource = await session.requestHitTestSource({ space: viewerSpace });

    // Transient input hit-test for finger-drag placement (generic touchscreen)
    if ('requestHitTestSourceForTransientInput' in session) {
      transientHitTestSource = await session.requestHitTestSourceForTransientInput({ profile: 'generic-touchscreen' });
    }

    session.addEventListener('end', () => {
      viewerHitTestSource = null;
      transientHitTestSource = null;
      localSpace = null;
      dragging = rotating = scaling = false;
    });
  } catch (e) {
    alert(
      e.message +
      '\n\nTips:\n• Use Chrome on Android\n• Open via HTTPS (ngrok)\n' +
      '• Install/Update "Google Play Services for AR" (ARCore)\n• Update Chrome to latest'
    );
    console.error('WebXR start failed:', e);
  }
});

// --- Main render loop
renderer.setAnimationLoop((t, frame) => {
  resizeRendererToDisplaySize();

  if (frame && localSpace) {
    // 1) Update reticle from viewer hit-test (center of view)
    if (viewerHitTestSource) {
      const viewerResults = frame.getHitTestResults(viewerHitTestSource);
      if (viewerResults.length > 0) {
        const pose = viewerResults[0].getPose(localSpace);
        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        }
      } else {
        reticle.visible = false;
      }
    }

    // 2) If dragging, move placed object under the finger using transient hit-test
    if (dragging && transientHitTestSource) {
      const transientResults = frame.getHitTestResultsForTransientInput(transientHitTestSource);
      // transientResults is an array of { inputSource, results[] }
      for (const tr of transientResults) {
        const results = tr.results;
        if (results && results.length > 0) {
          const pose = results[0].getPose(localSpace);
          if (pose && placed) {
            placed.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            break; // move once per frame
          }
        }
      }
    }
  }

  renderer.render(scene, camera);
});

// --- Disable button if XR missing on load
(async () => {
  try { await checkWebXRSupport(); }
  catch (e) {
    startBtn.disabled = true;
    startBtn.textContent = 'AR not supported on this device';
    console.warn(e.message);
  }
})();
