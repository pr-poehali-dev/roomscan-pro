-- Таблица для пользовательских 3D-моделей (конвертированные GLB)
CREATE TABLE IF NOT EXISTS t_p79259893_roomscan_pro.user_models (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p79259893_roomscan_pro.users(id),
    name VARCHAR(255) NOT NULL,
    source_ext VARCHAR(16) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    triangles INTEGER,
    glb_url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_models_user_id_idx ON t_p79259893_roomscan_pro.user_models(user_id);
CREATE INDEX IF NOT EXISTS user_models_created_at_idx ON t_p79259893_roomscan_pro.user_models(created_at DESC);
