-- Добавляем сохранение результатов детекции проёмов
ALTER TABLE t_p79259893_roomscan_pro.scans
  ADD COLUMN IF NOT EXISTS doors_count INTEGER,
  ADD COLUMN IF NOT EXISTS windows_count INTEGER,
  ADD COLUMN IF NOT EXISTS openings_data JSONB;