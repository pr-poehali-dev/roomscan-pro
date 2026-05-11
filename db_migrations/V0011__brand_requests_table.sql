CREATE TABLE IF NOT EXISTS t_p79259893_roomscan_pro.brand_requests (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(64),
    website TEXT,
    category VARCHAR(64),
    models_count INTEGER,
    message TEXT,
    status VARCHAR(32) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS brand_requests_status_idx ON t_p79259893_roomscan_pro.brand_requests(status);
CREATE INDEX IF NOT EXISTS brand_requests_created_at_idx ON t_p79259893_roomscan_pro.brand_requests(created_at DESC);
