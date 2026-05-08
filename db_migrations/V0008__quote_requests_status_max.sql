-- Статусы заявок и удобные индексы для админки

ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'new';
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS sent_to_max BOOLEAN DEFAULT FALSE;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_kind ON quote_requests(kind);
