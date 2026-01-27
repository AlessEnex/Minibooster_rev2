// 3D STL Viewer using Three.js
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls, mesh;
let container;
let measureMode = false;
let measurePoints = [];
let measureMarkers = [];
let measureLine = null;
let raycaster, mouse;

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
  controls.enableZoom = false; // Disabilito lo zoom di OrbitControls
  controls.screenSpacePanning = false;
  controls.minDistance = 50;
  controls.maxDistance = 3000;
  
  // Custom smooth zoom with wheel
  let currentZoom = camera.position.length();
  let targetZoom = currentZoom;
  
  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY;
    const zoomSpeed = 0.05;
    
    // Update target zoom distance (inverted)
    if (delta < 0) {
      targetZoom *= (1 + zoomSpeed);
    } else {
      targetZoom *= (1 - zoomSpeed);
    }
    
    // Clamp zoom
    targetZoom = Math.max(50, Math.min(3000, targetZoom));
    
  }, { passive: false });
  
  // Add smooth zoom interpolation to animation loop
  function updateZoom() {
    if (Math.abs(currentZoom - targetZoom) > 0.1) {
      currentZoom += (targetZoom - currentZoom) * 0.1;
      
      const direction = camera.position.clone().normalize();
      camera.position.copy(direction.multiplyScalar(currentZoom));
    }
  }
  
  // Store original animate function
  const originalAnimate = animate;
  animate = function() {
    updateZoom();
    originalAnimate();
  };
  
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
  
  // Initialize raycaster for measurements
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
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

export function loadSTLFromPath(path) {
  return new Promise((resolve, reject) => {
    const loader = new STLLoader();
    
    loader.load(
      path,
      (geometry) => {
        try {
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
      },
      undefined, // progress callback
      (error) => {
        reject(error);
      }
    );
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
  
  clearMeasurements();
  
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  mesh = null;
}

// Measurement functions
export function toggleMeasureMode(enabled) {
  measureMode = enabled;
  if (!enabled) {
    clearMeasurements();
  }
  return measureMode;
}

export function clearMeasurements() {
  measurePoints = [];
  
  // Remove markers
  measureMarkers.forEach(marker => {
    scene.remove(marker);
    if (marker.geometry) marker.geometry.dispose();
    if (marker.material) marker.material.dispose();
  });
  measureMarkers = [];
  
  // Remove line
  if (measureLine) {
    scene.remove(measureLine);
    if (measureLine.geometry) measureLine.geometry.dispose();
    if (measureLine.material) measureLine.material.dispose();
    measureLine = null;
  }
}

export function handleMeasureClick(event) {
  if (!measureMode || !mesh) return null;
  
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(mesh);
  
  if (intersects.length > 0) {
    const point = intersects[0].point;
    measurePoints.push(point);
    
    // Add marker sphere
    const markerGeometry = new THREE.SphereGeometry(2, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    scene.add(marker);
    measureMarkers.push(marker);
    
    // If we have 2 points, draw line and calculate distance
    if (measurePoints.length === 2) {
      const p1 = measurePoints[0];
      const p2 = measurePoints[1];
      
      // Draw line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      measureLine = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(measureLine);
      
      // Calculate distance
      const distance = p1.distanceTo(p2);
      
      // Reset for next measurement
      measurePoints = [];
      
      return distance;
    }
    
    return 'first_point';
  }
  
  return null;
}
