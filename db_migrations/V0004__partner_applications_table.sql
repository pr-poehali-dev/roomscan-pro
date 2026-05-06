-- Таблица заявок от партнёров (производителей мебели и магазинов)
CREATE TABLE IF NOT EXISTS t_p79259893_roomscan_pro.partner_applications (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    partnership_type TEXT NOT NULL,  -- catalog | api | branded | enterprise
    catalog_size INTEGER,            -- сколько SKU планируют добавить
    description TEXT,
    status TEXT NOT NULL DEFAULT 'new',  -- new | review | approved | rejected
    source_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON t_p79259893_roomscan_pro.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created ON t_p79259893_roomscan_pro.partner_applications(created_at DESC);