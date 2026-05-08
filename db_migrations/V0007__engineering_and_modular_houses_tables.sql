-- Таблицы для сохранения проектов модулей «Инженерные узлы» и «Модульные дома»

CREATE TABLE IF NOT EXISTS eng_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    template_id VARCHAR(64) NOT NULL,
    layout JSONB NOT NULL,
    total_price BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eng_projects_user ON eng_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_eng_projects_created ON eng_projects(created_at DESC);

CREATE TABLE IF NOT EXISTS house_projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    base_project_id VARCHAR(64),
    layout JSONB NOT NULL,
    total_area NUMERIC(10, 2) DEFAULT 0,
    grand_total BIGINT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_house_projects_user ON house_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_house_projects_created ON house_projects(created_at DESC);

-- Заявки на расчёт (квоты) от клиентов
CREATE TABLE IF NOT EXISTS quote_requests (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(32) NOT NULL,
    project_title VARCHAR(255),
    client_name VARCHAR(120),
    client_phone VARCHAR(40),
    client_email VARCHAR(120),
    comment TEXT,
    snapshot JSONB,
    total_price BIGINT DEFAULT 0,
    sent_to_telegram BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_created ON quote_requests(created_at DESC);
