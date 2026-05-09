import * as THREE from "three";

/**
 * Трёхточечное освещение сцены (key + fill + rim) + ambient + hemisphere.
 * Имитирует солнце через окно + отражённый свет + контровой + небо/земля.
 * Все источники добавляются прямо в scene.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function setupLighting(scene: THREE.Scene, showShadows: boolean): void {
  // Ambient — мягкий заполняющий свет
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  // Key light — основной источник (имитирует солнце через окно)
  const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
  sun.position.set(7, 12, 5);
  sun.castShadow = showShadows;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 6; // VSM blur
  scene.add(sun);

  // Fill light — мягкий с противоположной стороны (имитирует отражённый свет)
  const fill = new THREE.DirectionalLight(0xc8d8e8, 0.6);
  fill.position.set(-6, 5, -4);
  scene.add(fill);

  // Rim light — задний контровой свет (выделяет силуэты)
  const rim = new THREE.DirectionalLight(0xfff0d0, 0.4);
  rim.position.set(-3, 4, 8);
  scene.add(rim);

  // Hemisphere — небо/земля для естественного цветового градиента
  const hemi = new THREE.HemisphereLight(0xb8d4e8, 0xc8a878, 0.5);
  scene.add(hemi);
}
