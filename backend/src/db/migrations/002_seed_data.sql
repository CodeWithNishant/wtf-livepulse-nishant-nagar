DO $$ 
DECLARE 
    g_id UUID;
    v_gym_id UUID;
BEGIN
    -- IDEMPOTENCY GUARD: Exit instantly if data is already seeded
    IF EXISTS (SELECT 1 FROM gyms) THEN
        RETURN;
    END IF;

    -- 1. Insert 10 Gyms
    INSERT INTO gyms (name, city, capacity, opens_at, closes_at) VALUES 
    ('WTF Gyms — Lajpat Nagar', 'New Delhi', 220, '05:30', '22:30'),
    ('WTF Gyms — Connaught Place', 'New Delhi', 180, '06:00', '22:00'),
    ('WTF Gyms — Bandra West', 'Mumbai', 300, '05:00', '23:00'),
    ('WTF Gyms — Powai', 'Mumbai', 250, '05:30', '22:30'),
    ('WTF Gyms — Indiranagar', 'Bengaluru', 200, '05:30', '22:00'),
    ('WTF Gyms — Koramangala', 'Bengaluru', 180, '06:00', '22:00'),
    ('WTF Gyms — Banjara Hills', 'Hyderabad', 160, '06:00', '22:00'),
    ('WTF Gyms — Sector 18 Noida', 'Noida', 140, '06:00', '21:30'),
    ('WTF Gyms — Salt Lake', 'Kolkata', 120, '06:00', '21:00'),
    ('WTF Gyms — Velachery', 'Chennai', 110, '06:00', '21:00');

    -- 2. Insert 5000 Members (500 per gym average for speed)
    FOR g_id IN SELECT id FROM gyms LOOP
        INSERT INTO members (gym_id, name, plan_type, joined_at, last_checkin_at)
        SELECT g_id, 'Member ' || s, 
               CASE WHEN s % 3 = 0 THEN 'annual' ELSE 'monthly' END,
               NOW() - (random() * 90 * interval '1 day'),
               NOW() - (random() * 90 * interval '1 day')
        FROM generate_series(1, 500) s;
    END LOOP;

    -- 3. Insert 270k+ Checkins
    INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
    SELECT id, gym_id, 
           last_checkin_at - (random() * 5 * interval '1 hour'),
           last_checkin_at
    FROM members
    WHERE last_checkin_at IS NOT NULL;

    -- 4. Anomaly Setup A: Velachery Zero Checkins
    SELECT id INTO v_gym_id FROM gyms WHERE name ILIKE '%Velachery%';
    UPDATE checkins SET checked_out = NOW() - INTERVAL '3 hours' WHERE gym_id = v_gym_id AND checked_out IS NULL;

    -- 5. Anomaly Setup B: Bandra Capacity Breach
    SELECT id INTO v_gym_id FROM gyms WHERE name ILIKE '%Bandra%';
    INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
    SELECT id, gym_id, NOW(), NULL FROM members WHERE gym_id = v_gym_id LIMIT 285;
END $$;