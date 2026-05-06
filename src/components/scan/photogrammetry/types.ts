export interface ScanResult {
  area: number;
  width: number;
  length: number;
  height: number;
  frames_used: number;
  accuracy_estimate: string;
  point_cloud_points: number;
  features_total?: number;
  matches_total?: number;
  inliers_pct?: number;
  vanishing_points?: number;
  wall_planes?: number;
  frames_input?: number;
  frames_blurred?: number;
  frames_duplicates?: number;
  outliers_removed?: number;
  confidence?: number;
  confidence_label?: string;
  doors?: number;
  windows?: number;
  openings?: Array<{
    type: "door" | "window";
    wall_idx: number;
    width: number;
    height: number;
    sill: number;
    center: [number, number, number];
  }>;
}

export type Phase = "idle" | "recording" | "uploading" | "processing" | "done" | "error";
