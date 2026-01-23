// 3D STL Viewer using Three.js
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, mesh;
let container;

export function initViewer3D(containerElement) {
  container = containerElement;
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  
  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    10000
  );
  camera.position.set(0, 0, 300);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 5000;
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(1, 1, 1);
  scene.add(directionalLight1);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);
  
  // Grid
  const gridHelper = new THREE.GridHelper(500, 50, 0x888888, 0xcccccc);
  scene.add(gridHelper);
  
  // Axes helper
  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
  
  // Start animation loop
  animate();
}

function onWindowResize() {
  if (!container || !camera || !renderer) return;
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

export function loadSTLFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const loader = new STLLoader();
      
      try {
        const geometry = loader.parse(event.target.result);
        
        // Remove previous mesh if exists
        if (mesh) {
          scene.remove(mesh);
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) mesh.material.dispose();
        }
        
        // Center geometry
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
        
        // Create material
        const material = new THREE.MeshPhongMaterial({
          color: 0x00a8e8,
          specular: 0x111111,
          shininess: 200,
          side: THREE.DoubleSide,
        });
        
        // Create mesh
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Auto-fit camera
        fitCameraToObject(mesh);
        
        resolve(mesh);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export function resetCamera() {
  if (!camera || !controls) return;
  
  if (mesh) {
    fitCameraToObject(mesh);
  } else {
    camera.position.set(0, 0, 300);
    controls.target.set(0, 0, 0);
  }
  controls.update();
}

export function setWireframe(enabled) {
  if (mesh && mesh.material) {
    mesh.material.wireframe = enabled;
  }
}

function fitCameraToObject(object) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  
  cameraZ *= 1.5; // Add some padding
  
  camera.position.set(center.x, center.y, center.z + cameraZ);
  controls.target.set(center.x, center.y, center.z);
  controls.update();
}

export function updateTheme(isDark) {
  if (!scene) return;
  scene.background = new THREE.Color(isDark ? 0x1e1e1e : 0xf5f5f5);
}

export function disposeViewer() {
  if (renderer) {
    renderer.dispose();
    if (container && renderer.domElement) {
      container.removeChild(renderer.domElement);
    }
  }
  
  if (mesh) {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  }
  
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  mesh = null;
}
