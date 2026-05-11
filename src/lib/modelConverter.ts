/**
 * Конвертация 3D-моделей в формат GLB прямо в браузере.
 * Используются загрузчики из three.js + GLTFExporter.
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

export type ConvertStage = "idle" | "loading" | "converting" | "exporting" | "done";

export interface ConvertProgress {
  stage: ConvertStage;
  percent: number;
}

export interface ConvertResult {
  blob: Blob;
  triangles: number;
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
      const obj = loader.parse(buf, "");
      return obj;
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

/** Главная функция: file → GLB Blob. */
export async function convertToGLB(
  file: File,
  ext: string,
  onProgress: OnProgress = () => {},
): Promise<ConvertResult> {
  const object = await loadModel(file, ext, onProgress);

  onProgress({ stage: "converting", percent: 70 });

  // Центрируем и приводим к разумному масштабу, чтобы модель не оказывалась за камерой.
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    // если модель в "сантиметрах" (FBX из 3ds Max часто) — сожмём в метры
    if (maxDim > 100) {
      const scale = 1 / 100;
      object.scale.setScalar(scale);
      object.updateMatrixWorld(true);
    }
  }

  const triangles = countTriangles(object);

  onProgress({ stage: "exporting", percent: 85 });

  const exporter = new GLTFExporter();
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          // JSON-режим (gltf) — упакуем в строку и потом в blob, но для glb нужен binary
          reject(new Error("GLTFExporter вернул JSON вместо GLB"));
        }
      },
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
      {
        binary: true,
        embedImages: true,
        maxTextureSize: 2048,
      },
    );
  });

  onProgress({ stage: "done", percent: 100 });

  return {
    blob: new Blob([arrayBuffer], { type: "model/gltf-binary" }),
    triangles,
  };
}
