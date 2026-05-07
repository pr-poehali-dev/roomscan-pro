-- CRM, партнёры и AI-логи для админ-кабинета RoomScan AI

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(64),
  company VARCHAR(255),
  source VARCHAR(64) DEFAULT 'site',
  status VARCHAR(32) DEFAULT 'new',
  tags TEXT,
  notes TEXT,
  budget_min INT DEFAULT 0,
  budget_max INT DEFAULT 0,
  assigned_to VARCHAR(255),
  next_action_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS deals (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id) ON UPDATE CASCADE,
  title VARCHAR(255) NOT NULL,
  stage VARCHAR(32) DEFAULT 'qualification',
  amount NUMERIC(14,2) DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'RUB',
  probability INT DEFAULT 50,
  expected_close DATE NULL,
  closed_at TIMESTAMP NULL,
  closed_won BOOLEAN NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON deals(lead_id);

CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT,
  deal_id BIGINT,
  partner_id BIGINT,
  kind VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  result TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_at);

CREATE TABLE IF NOT EXISTS partners (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  city VARCHAR(128),
  website VARCHAR(512),
  email VARCHAR(255),
  phone VARCHAR(64),
  contact_person VARCHAR(255),
  description TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'discovered',
  source VARCHAR(64) DEFAULT 'manual',
  ai_score INT DEFAULT 0,
  ai_summary TEXT,
  tags TEXT,
  last_contact_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_city ON partners(city);

CREATE TABLE IF NOT EXISTS ai_logs (
  id BIGSERIAL PRIMARY KEY,
  agent VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  input_text TEXT,
  output_text TEXT,
  related_lead_id BIGINT NULL,
  related_partner_id BIGINT NULL,
  tokens_used INT DEFAULT 0,
  status VARCHAR(32) DEFAULT 'success',
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent ON ai_logs(agent);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at DESC);
