import * as THREE from "three";
import type { ARFurniture } from "./ARFurnitureView";

// ─── Хелпер: создаёт mesh мебели в виде bbox с лейблом ─────────────────────
export function createFurnitureMesh(item: ARFurniture): THREE.Mesh {
  const geo = new THREE.BoxGeometry(item.width, item.height, item.depth);
  const mat = new THREE.MeshStandardMaterial({
    color: item.color ?? 0x16a34a,
    transparent: true,
    opacity: 0.55,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  // Поднимаем на половину высоты, чтобы низ касался пола
  mesh.position.y = item.height / 2;

  // Каркас (edges) — зелёный контур поверх полупрозрачного бокса
  const edges = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x16a34a });
  const wire = new THREE.LineSegments(edges, edgeMat);
  mesh.add(wire);

  return mesh;
}
