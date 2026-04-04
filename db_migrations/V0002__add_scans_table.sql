CREATE TABLE t_p79259893_roomscan_pro.scans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p79259893_roomscan_pro.users(id),
  project_id INTEGER REFERENCES t_p79259893_roomscan_pro.projects(id),
  method TEXT NOT NULL CHECK (method IN ('webxr', 'photogrammetry')),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'done', 'error')),
  frames_count INTEGER NOT NULL DEFAULT 0,
  result_area NUMERIC(10,2),
  result_width NUMERIC(10,2),
  result_length NUMERIC(10,2),
  result_height NUMERIC(10,2),
  result_glb_url TEXT,
  result_floor_plan_url TEXT,
  point_cloud_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
