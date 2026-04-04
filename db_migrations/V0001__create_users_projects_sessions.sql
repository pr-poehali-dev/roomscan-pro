CREATE TABLE t_p79259893_roomscan_pro.users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'designer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p79259893_roomscan_pro.projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p79259893_roomscan_pro.users(id),
  name TEXT NOT NULL,
  rooms INTEGER NOT NULL DEFAULT 0,
  area TEXT NOT NULL DEFAULT '0 м2',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p79259893_roomscan_pro.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p79259893_roomscan_pro.users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
