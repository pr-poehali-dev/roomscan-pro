import { useCallback } from "react";
import { saveLastScan } from "@/lib/scanStore";
import type { Point3D } from "../PointCloud3D";
import type { ScanResult, Phase } from "./types";

interface DemoDeps {
  setError: (s: string) => void;
  setPhase: (p: Phase) => void;
  setPoints3D: (pts: Point3D[]) => void;
  setResult: (r: ScanResult | null) => void;
  onComplete: (result: ScanResult) => void;
}

/**
 * Демо-режим: готовый скан без камеры.
 * Используется, когда пользователь не может предоставить доступ к камере
 * (iframe-предпросмотр, десктоп без камеры, презентации).
 *
 * Логика 1:1 повторяет runDemoScan из исходного PhotogrammetryScanner.tsx.
 */
export function useDemoScan({ setError, setPhase, setPoints3D, setResult, onComplete }: DemoDeps) {
  return useCallback(async () => {
    setError("");
    setPhase("processing");

    // Имитация обработки 1.5 сек
    await new Promise((r) => setTimeout(r, 1500));

    const demoResult: ScanResult = {
      area: 18.5,
      width: 4.2,
      length: 4.4,
      height: 2.7,
      frames_used: 60,
      accuracy_estimate: "±2.4 см",
      point_cloud_points: 2400,
      features_total: 18420,
      matches_total: 6850,
      inliers_pct: 87,
      vanishing_points: 3,
      wall_planes: 4,
      frames_input: 60,
      frames_blurred: 0,
      frames_duplicates: 0,
      outliers_removed: 142,
      confidence: 0.92,
      confidence_label: "Высокая",
      doors: 1,
      windows: 1,
      openings: [
        { type: "door", wall_idx: 0, width: 0.9, height: 2.05, sill: 0, center: [-1.5, 1.025, -2.2] },
        { type: "window", wall_idx: 2, width: 1.4, height: 1.4, sill: 0.85, center: [0.5, 1.55, 2.2] },
      ],
    };

    // Генерируем точечное облако: стены, пол, потолок
    const pts: Point3D[] = [];
    const W = demoResult.width;
    const L = demoResult.length;
    const H = demoResult.height;
    for (let i = 0; i < 2400; i++) {
      const r = Math.random();
      let x = 0, y = 0, z = 0;
      if (r < 0.25) {
        // пол
        x = (Math.random() - 0.5) * W;
        y = Math.random() * 0.05;
        z = (Math.random() - 0.5) * L;
      } else if (r < 0.4) {
        // потолок
        x = (Math.random() - 0.5) * W;
        y = H - Math.random() * 0.05;
        z = (Math.random() - 0.5) * L;
      } else if (r < 0.7) {
        // стены X
        x = Math.random() < 0.5 ? -W / 2 : W / 2;
        y = Math.random() * H;
        z = (Math.random() - 0.5) * L;
      } else {
        // стены Z
        x = (Math.random() - 0.5) * W;
        y = Math.random() * H;
        z = Math.random() < 0.5 ? -L / 2 : L / 2;
      }
      pts.push({ x, y, z, intensity: y / H });
    }
    setPoints3D(pts);

    setResult(demoResult);
    setPhase("done");
    onComplete(demoResult);
    saveLastScan({
      width: demoResult.width,
      length: demoResult.length,
      height: demoResult.height,
      area: demoResult.area,
      doors: demoResult.doors,
      windows: demoResult.windows,
      openings: demoResult.openings,
    });
  }, [onComplete, setError, setPhase, setPoints3D, setResult]);
}
