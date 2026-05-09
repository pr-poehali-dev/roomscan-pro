import * as THREE from "three";

/**
 * Создаёт небо-градиент через большой sphere с custom shader (BackSide).
 * Возвращает mesh, готовый для добавления в scene.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function createSky(): THREE.Mesh {
  const skyGeom = new THREE.SphereGeometry(50, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor:    { value: new THREE.Color(0x87ceeb) },
      bottomColor: { value: new THREE.Color(0xf0f4f8) },
    },
    vertexShader: `varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }`,
  });
  return new THREE.Mesh(skyGeom, skyMat);
}

/**
 * Создаёт высококачественный WebGLRenderer:
 * VSM-тени, ACES Filmic tone mapping, sRGB output.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function createRenderer(width: number, height: number, showShadows: boolean): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = showShadows;
  renderer.shadowMap.type = THREE.VSMShadowMap; // более мягкие тени, чем PCF
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  return renderer;
}

/**
 * IBL — Image Based Lighting через PMREM из процедурного неба.
 * Это даёт реалистичные отражения на металле, стекле, глянцевых поверхностях.
 * Применяет environment map напрямую к scene.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function applyIBL(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  // Простая equirect-текстура неба
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 512; envCanvas.height = 256;
  const ec = envCanvas.getContext("2d")!;
  const grad = ec.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#a8c8e8");   // верх — голубое небо
  grad.addColorStop(0.45, "#e0e8f0"); // горизонт — светлое
  grad.addColorStop(0.55, "#d8d4cc"); // переход
  grad.addColorStop(1, "#8a7860");    // низ — тёплая земля
  ec.fillStyle = grad;
  ec.fillRect(0, 0, 512, 256);
  const envTex = new THREE.CanvasTexture(envCanvas);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  const envMap = pmremGen.fromEquirectangular(envTex).texture;
  scene.environment = envMap;
  envTex.dispose();
  pmremGen.dispose();
}

/**
 * Лёгкий объёмный туман для атмосферной глубины (далёкие объекты бледнеют).
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function applyFog(scene: THREE.Scene): void {
  scene.fog = new THREE.Fog(0xeef2f6, 25, 80);
}
