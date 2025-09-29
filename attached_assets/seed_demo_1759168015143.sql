-- Path: db/seed_demo.sql
-- Minimal demo data for local dev
INSERT INTO stripe_events (id, type) VALUES ('evt_demo_1','test.event') ON CONFLICT DO NOTHING;
