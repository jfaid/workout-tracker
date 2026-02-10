-- Workout Tracker Database Setup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- ============================================
-- TABLE: workouts
-- Stores completed workout data from Garmin CSV exports
-- ============================================
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    duration_seconds INTEGER,
    distance_km DECIMAL(10, 2),
    avg_pace_per_km TEXT,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    avg_power INTEGER,
    max_power INTEGER,
    avg_cadence INTEGER,
    elevation_gain INTEGER,
    calories INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_activity_type ON workouts(activity_type);
CREATE INDEX IF NOT EXISTS idx_workouts_distance ON workouts(distance_km);

-- ============================================
-- TABLE: workout_plans
-- Stores trainer-assigned workout plans
-- ============================================
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    workout_type TEXT,
    target_distance_km DECIMAL(10, 2),
    target_pace TEXT,
    target_hr_zone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_plans_scheduled_date ON workout_plans(scheduled_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Since we're using "security by obscurity" (no auth),
-- we disable RLS to allow all operations.
-- If you add auth later, enable RLS and add policies.
-- ============================================
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (no auth)
CREATE POLICY "Allow all workouts" ON workouts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all workout_plans" ON workout_plans
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- OPTIONAL: Sample data for testing
-- Uncomment and run if you want test data
-- ============================================

/*
INSERT INTO workouts (activity_type, date, duration_seconds, distance_km, avg_pace_per_km, avg_heart_rate, avg_power)
VALUES 
    ('Running', '2025-01-15 07:30:00', 3600, 10.2, '5:32', 155, 245),
    ('Running', '2025-01-17 06:45:00', 2700, 8.1, '5:45', 148, 232),
    ('Running', '2025-01-19 08:00:00', 4500, 15.0, '5:30', 158, 250),
    ('Running', '2025-01-21 07:00:00', 3540, 10.0, '5:54', 152, 238),
    ('Running', '2025-01-24 07:15:00', 3480, 10.5, '5:28', 160, 255);

INSERT INTO workout_plans (title, description, scheduled_date, workout_type, target_distance_km, target_pace, notes)
VALUES 
    ('Easy Recovery Run', 'Low heart rate, conversational pace', '2025-02-05', 'Recovery', 6.0, '6:30/km', 'Keep HR below 140'),
    ('Tempo Run', '10 min warmup, 20 min tempo, 10 min cooldown', '2025-02-07', 'Tempo', 8.0, '5:00/km', 'Tempo section should feel comfortably hard'),
    ('Long Run', 'Build aerobic base, stay relaxed', '2025-02-09', 'Long Run', 18.0, '5:45/km', 'Bring nutrition');
*/
