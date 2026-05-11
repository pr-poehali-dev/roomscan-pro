/**
 * Конвертация 3D-моделей в форматы GLB и USDZ прямо в браузере.
 * - GLB — стандарт для веба и Android Scene Viewer.
 * - USDZ — формат Apple AR Quick Look для iOS Safari.
 * Используются загрузчики из three.js + GLTFExporter / USDZExporter.
 * Поддержка: FBX, OBJ, DAE (Collada), STL, PLY, 3DS, glTF, GLB.
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

export type ConvertStage = "idle" | "loading" | "converting" | "exporting" | "usdz" | "done";

export interface ConvertProgress {
  stage: ConvertStage;
  percent: number;
}

export interface ConvertResult {
  blob: Blob;
  triangles: number;
  /** USDZ-вариант той же модели (для iOS AR Quick Look). Может быть null, если экспорт не удался. */
  usdzBlob: Blob | null;
}

type OnProgress = (p: ConvertProgress) => void;

/** Считает суммарное количество треугольников в сцене. */
function countTriangles(object: THREE.Object3D): number {
  let total = 0;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      const geom = mesh.geometry;
      if (geom.index) total += geom.index.count / 3;
      else if (geom.attributes.position) total += geom.attributes.position.count / 3;
    }
  });
  return Math.round(total);
}

/** Оборачивает BufferGeometry в Mesh с дефолтным материалом. */
function geometryToMesh(geom: THREE.BufferGeometry, name: string): THREE.Object3D {
  if (!geom.attributes.normal) geom.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: geom.hasAttribute("color") ? 0xffffff : 0xcccccc,
    vertexColors: geom.hasAttribute("color"),
    roughness: 0.8,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geom, material);
  mesh.name = name;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsArrayBuffer(file);
  });
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file);
  });
}

/** Загрузка модели по формату → возвращает THREE.Object3D. */
async function loadModel(file: File, ext: string, onProgress: OnProgress): Promise<THREE.Object3D> {
  onProgress({ stage: "loading", percent: 10 });

  switch (ext) {
    case "fbx": {
      const buf = await readAsArrayBuffer(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new FBXLoader();
      return loader.parse(buf, "");
    }
    case "obj": {
      const text = await readAsText(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new OBJLoader();
      return loader.parse(text);
    }
    case "dae": {
      const text = await readAsText(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new ColladaLoader();
      const result = loader.parse(text, "");
      return result.scene;
    }
    case "stl": {
      const buf = await readAsArrayBuffer(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new STLLoader();
      const geom = loader.parse(buf);
      return geometryToMesh(geom, file.name);
    }
    case "ply": {
      const buf = await readAsArrayBuffer(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new PLYLoader();
      const geom = loader.parse(buf);
      return geometryToMesh(geom, file.name);
    }
    case "3ds": {
      const buf = await readAsArrayBuffer(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new TDSLoader();
      return loader.parse(buf, "");
    }
    case "gltf":
    case "glb": {
      const buf = await readAsArrayBuffer(file);
      onProgress({ stage: "converting", percent: 40 });
      const loader = new GLTFLoader();
      return new Promise((resolve, reject) => {
        loader.parse(
          buf,
          "",
          (gltf) => resolve(gltf.scene),
          (err) => reject(err),
        );
      });
    }
    default:
      throw new Error(`Формат .${ext} не поддерживается конвертером`);
  }
}

/**
 * USDZExporter требует MeshStandardMaterial / MeshPhysicalMaterial.
 * Некоторые лоадеры дают MeshBasicMaterial / MeshLambertMaterial — конвертируем.
 */
function ensureUSDZCompatible(object: THREE.Object3D): THREE.Object3D {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const fixed = materials.map((m) => {
      if (!m) return new THREE.MeshStandardMaterial({ color: 0xcccccc });
      if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
        return m;
      }
      // Конвертация в Standard
      const std = new THREE.MeshStandardMaterial({
        color: (m as THREE.MeshBasicMaterial).color || new THREE.Color(0xcccccc),
        map: (m as THREE.MeshBasicMaterial).map || null,
        transparent: m.transparent,
        opacity: m.opacity,
        side: m.side,
        roughness: 0.8,
        metalness: 0.1,
      });
      std.name = m.name;
      return std;
    });
    mesh.material = Array.isArray(mesh.material) ? fixed : fixed[0];
  });
  return object;
}

/** Экспорт сцены в USDZ. Возвращает null, если экспорт упал — не блокируем основной флоу. */
async function exportUSDZ(object: THREE.Object3D): Promise<Blob | null> {
  try {
    const clone = object.clone(true);
    ensureUSDZCompatible(clone);
    const exporter = new USDZExporter();
    const result = await exporter.parse(clone);
    const arr = result as unknown as Uint8Array;
    return new Blob([arr], { type: "model/vnd.usdz+zip" });
  } catch (err) {
    console.warn("USDZ export failed:", err);
    return null;
  }
}

/** Главная функция: file → GLB Blob + USDZ Blob. */
export async function convertToGLB(
  file: File,
  ext: string,
  onProgress: OnProgress = () => {},
): Promise<ConvertResult> {
  const object = await loadModel(file, ext, onProgress);

  onProgress({ stage: "converting", percent: 60 });

  // Центрируем и приводим к разумному масштабу
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 100) {
    // если модель в "сантиметрах" (FBX из 3ds Max часто) — сожмём в метры
    object.scale.setScalar(1 / 100);
    object.updateMatrixWorld(true);
  }

  const triangles = countTriangles(object);

  onProgress({ stage: "exporting", percent: 75 });

  // GLB
  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else reject(new Error("GLTFExporter вернул JSON вместо GLB"));
      },
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
      { binary: true, embedImages: true, maxTextureSize: 2048 },
    );
  });

  onProgress({ stage: "usdz", percent: 90 });

  // USDZ (опционально, не блокируем результат)
  const usdzBlob = await exportUSDZ(object);

  onProgress({ stage: "done", percent: 100 });

  return {
    blob: new Blob([glbBuffer], { type: "model/gltf-binary" }),
    triangles,
    usdzBlob,
  };
}
