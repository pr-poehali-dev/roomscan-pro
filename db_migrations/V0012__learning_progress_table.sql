CREATE TABLE IF NOT EXISTS t_p79259893_roomscan_pro.learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p79259893_roomscan_pro.users(id),
    completed_lessons TEXT[] DEFAULT ARRAY[]::TEXT[],
    earned_badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_course_id VARCHAR(64),
    last_lesson_id VARCHAR(64),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS learning_progress_user_id_idx ON t_p79259893_roomscan_pro.learning_progress(user_id);
