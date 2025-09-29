-- Path: db/seeds/demo_data.sql
-- Demo data for development and testing

-- Demo Stripe events for webhook testing
INSERT INTO stripe_events (id, type, data) VALUES 
('evt_demo_payment_intent_succeeded', 'payment_intent.succeeded', '{"id":"pi_demo","amount":2000,"currency":"eur"}'),
('evt_demo_checkout_session_completed', 'checkout.session.completed', '{"id":"cs_demo","payment_intent":"pi_demo","mode":"payment"}')
ON CONFLICT (id) DO NOTHING;

-- Demo escrow transaction
INSERT INTO escrow_transactions (id, buyer_id, seller_id, amount_cents, fee_cents, stripe_payment_intent, status) VALUES
('esc_demo_001', 'user_buyer_1', 'user_seller_1', 5000, 250, 'pi_demo_escrow_001', 'HELD')
ON CONFLICT (id) DO NOTHING;

-- Demo escrow status history
INSERT INTO escrow_status_history (escrow_id, from_status, to_status, reason, changed_by) VALUES
('esc_demo_001', 'PENDING', 'HELD', 'Payment received from buyer', 'system')
ON CONFLICT DO NOTHING;

-- Demo GDPR request
INSERT INTO gdpr_requests (id, user_id, request_type, status) VALUES
('gdpr_demo_001', 'user_demo_1', 'export', 'completed')
ON CONFLICT (id) DO NOTHING;