import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Point {
  x: number;
  y: number;
  z: number;
  confidence?: number;
}

interface Props {
  points: Point[];
  width?: number;
  height?: number;
}

export default function PointCloudViewer({ points, width = 600, height = 340 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!mountRef.current || points.length === 0) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Сетка пола
    const grid = new THREE.GridHelper(10, 20, 0x1a2a1a, 0x1a2a1a);
    scene.add(grid);

    // Точечное облако
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    // Нормализуем координаты к центру
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
    const cz = points.reduce((s, p) => s + p.z, 0) / points.length;

    const primaryColor = new THREE.Color(0x16a34a);
    const secondaryColor = new THREE.Color(0x4ade80);

    points.forEach((p, i) => {
      positions[i * 3] = p.x - cx;
      positions[i * 3 + 1] = p.y - cy;
      positions[i * 3 + 2] = p.z - cz;

      const c = p.confidence ?? 0.8;
      const color = primaryColor.clone().lerp(secondaryColor, c);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    // Оси для ориентации
    scene.add(new THREE.AxesHelper(0.5));

    // Орбитальное вращение мышью / пальцем
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotX = 0;
    let rotY = 0;

    const onMouseDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      rotY += (e.clientX - prevX) * 0.01;
      rotX += (e.clientY - prevY) * 0.005;
      prevX = e.clientX; prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };

    const onTouchStart = (e: TouchEvent) => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      rotY += (e.touches[0].clientX - prevX) * 0.01;
      rotX += (e.touches[0].clientY - prevY) * 0.005;
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", onMouseUp);

    // Анимация
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isDragging) rotY += 0.003;
      pointCloud.rotation.y = rotY;
      pointCloud.rotation.x = Math.max(-0.5, Math.min(0.5, rotX));
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onMouseUp);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [points, width, height]);

  if (points.length === 0) return null;

  return (
    <div
      ref={mountRef}
      className="rounded-lg overflow-hidden w-full cursor-grab active:cursor-grabbing"
      style={{ height }}
      title="Перетащите для вращения"
    />
  );
}
