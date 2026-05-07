import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Интерактивная 3D-демо: вращающаяся wireframe-комната с мебелью
 * и облаком "сканирующих" точек. Без зависимостей.
 */
export default function HeroDemo3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Сцена + камера + рендерер
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0f0c, 8, 20);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(6, 4, 6);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Цвета
    const accent = new THREE.Color(0x22c55e);
    const accentDim = new THREE.Color(0x16a34a);
    const white = new THREE.Color(0xffffff);

    // Комната wireframe (4×3×2.6 м)
    const ROOM_W = 4;
    const ROOM_D = 3;
    const ROOM_H = 2.6;
    const roomGroup = new THREE.Group();

    const roomGeo = new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D);
    const roomEdges = new THREE.EdgesGeometry(roomGeo);
    const roomMat = new THREE.LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.55,
    });
    const roomWire = new THREE.LineSegments(roomEdges, roomMat);
    roomWire.position.y = ROOM_H / 2;
    roomGroup.add(roomWire);

    // Сетка пола
    const grid = new THREE.GridHelper(6, 12, 0x22c55e, 0x1a3a26);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    roomGroup.add(grid);

    // Кровать (большой бокс)
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x1a3a26, transparent: true, opacity: 0.6 }),
    );
    bed.position.set(-0.8, 0.25, -0.6);
    const bedEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bed.geometry),
      new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }),
    );
    bed.add(bedEdges);
    roomGroup.add(bed);

    // Тумба
    const nightstand = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0x1a3a26, transparent: true, opacity: 0.6 }),
    );
    nightstand.position.set(0.5, 0.25, -1);
    nightstand.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(nightstand.geometry),
        new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }),
      ),
    );
    roomGroup.add(nightstand);

    // Стол
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x1a3a26, transparent: true, opacity: 0.6 }),
    );
    table.position.set(1, 0.75, 0.8);
    table.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(table.geometry),
        new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.9 }),
      ),
    );
    roomGroup.add(table);

    // Ножки стола
    for (const [x, z] of [
      [0.5, 0.55],
      [1.5, 0.55],
      [0.5, 1.05],
      [1.5, 1.05],
    ]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.75, 0.05),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7 }),
      );
      leg.position.set(x, 0.375, z);
      roomGroup.add(leg);
    }

    // Окно (рамка на дальней стене)
    const windowFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.5, 1.2)),
      new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 1 }),
    );
    windowFrame.position.set(0, 1.5, -ROOM_D / 2 + 0.01);
    roomGroup.add(windowFrame);

    // Облако точек (имитация LiDAR)
    const POINT_COUNT = 800;
    const positions = new Float32Array(POINT_COUNT * 3);
    const colors = new Float32Array(POINT_COUNT * 3);

    for (let i = 0; i < POINT_COUNT; i++) {
      // Точки на стенах/полу/потолке
      const r = Math.random();
      let x = 0, y = 0, z = 0;

      if (r < 0.25) {
        // пол
        x = (Math.random() - 0.5) * ROOM_W;
        y = Math.random() * 0.05;
        z = (Math.random() - 0.5) * ROOM_D;
      } else if (r < 0.4) {
        // потолок
        x = (Math.random() - 0.5) * ROOM_W;
        y = ROOM_H - Math.random() * 0.05;
        z = (Math.random() - 0.5) * ROOM_D;
      } else if (r < 0.7) {
        // стены X
        x = Math.random() < 0.5 ? -ROOM_W / 2 : ROOM_W / 2;
        y = Math.random() * ROOM_H;
        z = (Math.random() - 0.5) * ROOM_D;
      } else {
        // стены Z
        x = (Math.random() - 0.5) * ROOM_W;
        y = Math.random() * ROOM_H;
        z = Math.random() < 0.5 ? -ROOM_D / 2 : ROOM_D / 2;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const t = y / ROOM_H;
      const c = accentDim.clone().lerp(white, t * 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointsMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const pointCloud = new THREE.Points(pointsGeo, pointsMat);
    roomGroup.add(pointCloud);

    scene.add(roomGroup);

    // Сканирующая плоскость (горизонтальная зелёная линия движется снизу вверх)
    const scanLineGeo = new THREE.PlaneGeometry(ROOM_W * 1.2, ROOM_D * 1.2);
    const scanLineMat = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const scanLine = new THREE.Mesh(scanLineGeo, scanLineMat);
    scanLine.rotation.x = -Math.PI / 2;
    scanLine.position.y = 0;
    roomGroup.add(scanLine);

    // Анимация
    let frameId = 0;
    let scanY = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Вращение комнаты
      roomGroup.rotation.y = t * 0.18;

      // Сканирующая плоскость снизу вверх
      scanY = (scanY + 0.012) % (ROOM_H + 0.5);
      scanLine.position.y = scanY;
      scanLineMat.opacity = 0.25 * Math.sin((scanY / ROOM_H) * Math.PI);

      // Лёгкое мерцание точек
      pointsMat.opacity = 0.7 + Math.sin(t * 2) * 0.15;

      renderer.render(scene, camera);
    };
    animate();

    // Адаптивность
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      pointsGeo.dispose();
      pointsMat.dispose();
      roomGeo.dispose();
      roomEdges.dispose();
      roomMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="absolute inset-0" />

      {/* HUD-overlay: углы и подписи */}
      <div className="pointer-events-none absolute inset-0">
        {/* Угловые скобки */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary/80" />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary/80" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary/80" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary/80" />

        {/* HUD-метки */}
        <div className="absolute top-4 left-12 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary/90">
            LIVE SCAN
          </span>
        </div>

        <div className="absolute top-4 right-12 text-[10px] font-mono text-primary/70 tracking-widest">
          4.0 × 3.0 × 2.6 М
        </div>

        <div className="absolute bottom-4 left-12 text-[10px] font-mono text-white/50 tracking-widest">
          POINTS: 800
        </div>

        <div className="absolute bottom-4 right-12 text-[10px] font-mono text-white/50 tracking-widest">
          12.0 М²
        </div>
      </div>
    </div>
  );
}
