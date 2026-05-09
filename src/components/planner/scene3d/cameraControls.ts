import * as THREE from "three";

export interface CamState {
  yaw: number;
  pitch: number;
  distance: number;
  target: THREE.Vector3;
}

/**
 * Дефолтное состояние орбитальной камеры.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function defaultCamState(): CamState {
  return {
    yaw: -Math.PI / 4,
    pitch: -Math.PI / 6,
    distance: 12,
    target: new THREE.Vector3(0, 0, 0),
  };
}

/**
 * Подключает orbital-camera управление к DOM-элементу:
 *  - ЛКМ drag — поворот (yaw/pitch)
 *  - ПКМ drag — пан (target по right/up)
 *  - Колесо   — зум (distance в [2, 40])
 *
 * Возвращает функции updateCamera (форсировать пересчёт позиции)
 * и cleanup (снять все слушатели), которые компонент должен вызвать в useEffect.
 *
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */
export function attachOrbitControls(
  dom: HTMLElement,
  camera: THREE.PerspectiveCamera,
  camStateRef: { current: CamState },
): { updateCamera: () => void; cleanup: () => void } {
  const updateCamera = () => {
    const cs = camStateRef.current;
    const x = cs.target.x + cs.distance * Math.cos(cs.pitch) * Math.cos(cs.yaw);
    const y = cs.target.y + cs.distance * Math.sin(cs.pitch) * -1 + 1.5;
    const z = cs.target.z + cs.distance * Math.cos(cs.pitch) * Math.sin(cs.yaw);
    camera.position.set(x, Math.max(y, 0.5), z);
    camera.lookAt(cs.target);
  };

  let isDragging = false;
  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (e: PointerEvent) => {
    isDragging = e.button === 0;
    isPanning = e.button === 2;
    lastX = e.clientX;
    lastY = e.clientY;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const cs = camStateRef.current;
    if (isDragging) {
      cs.yaw   -= dx * 0.005;
      cs.pitch += dy * 0.005;
      cs.pitch = Math.max(-Math.PI / 2.2, Math.min(-0.05, cs.pitch));
      updateCamera();
    } else if (isPanning) {
      const right = new THREE.Vector3();
      camera.getWorldDirection(right);
      right.cross(camera.up).normalize();
      const up = camera.up.clone();
      cs.target.addScaledVector(right, -dx * 0.01);
      cs.target.addScaledVector(up, dy * 0.01);
      updateCamera();
    }
  };
  const onPointerUp = () => { isDragging = false; isPanning = false; };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const cs = camStateRef.current;
    cs.distance *= e.deltaY > 0 ? 1.1 : 0.92;
    cs.distance = Math.max(2, Math.min(40, cs.distance));
    updateCamera();
  };
  const onContextMenu = (e: Event) => e.preventDefault();

  dom.addEventListener("pointerdown", onPointerDown);
  dom.addEventListener("pointermove", onPointerMove);
  dom.addEventListener("pointerup",   onPointerUp);
  dom.addEventListener("wheel",       onWheel,       { passive: false });
  dom.addEventListener("contextmenu", onContextMenu);

  const cleanup = () => {
    dom.removeEventListener("pointerdown", onPointerDown);
    dom.removeEventListener("pointermove", onPointerMove);
    dom.removeEventListener("pointerup",   onPointerUp);
    dom.removeEventListener("wheel",       onWheel);
    dom.removeEventListener("contextmenu", onContextMenu);
  };

  return { updateCamera, cleanup };
}
