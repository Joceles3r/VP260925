-- VISUAL Platform Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE profile_type AS ENUM ('investor', 'invested_reader', 'creator', 'admin');
CREATE TYPE project_status AS ENUM ('pending', 'active', 'completed', 'rejected');
CREATE TYPE transaction_type AS ENUM ('investment', 'withdrawal', 'commission', 'redistribution', 'deposit');
CREATE TYPE notification_type AS ENUM ('investment_milestone', 'funding_goal_reached', 'project_status_change', 'roi_update', 'new_investment', 'live_show_started', 'battle_result', 'performance_alert');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE report_status AS ENUM ('pending', 'confirmed', 'rejected', 'abusive');
CREATE TYPE report_type AS ENUM ('plagiat', 'contenu_offensant', 'desinformation', 'infraction_legale', 'contenu_illicite', 'violation_droits', 'propos_haineux');
CREATE TYPE content_type AS ENUM ('article', 'video', 'social_post', 'comment', 'project');

-- Create tables following the Drizzle schema structure

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    profile_type profile_type DEFAULT 'investor',
    kyc_verified BOOLEAN DEFAULT false,
    kyc_documents JSONB,
    balance_eur DECIMAL(10,2) DEFAULT 10000.00,
    simulation_mode BOOLEAN DEFAULT true,
    caution_eur DECIMAL(10,2) DEFAULT 0.00,
    total_invested DECIMAL(10,2) DEFAULT 0.00,
    total_gains DECIMAL(10,2) DEFAULT 0.00,
    rank_global INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    creator_id VARCHAR NOT NULL REFERENCES users(id),
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    status project_status DEFAULT 'pending',
    video_url VARCHAR,
    thumbnail_url VARCHAR,
    ml_score DECIMAL(3,1),
    roi_estimated DECIMAL(5,2) DEFAULT 0.00,
    roi_actual DECIMAL(5,2),
    investor_count INTEGER DEFAULT 0,
    votes_count INTEGER DEFAULT 0,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    project_id VARCHAR NOT NULL REFERENCES projects(id),
    amount DECIMAL(10,2) NOT NULL,
    visu_points INTEGER NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    roi DECIMAL(5,2) DEFAULT 0.00,
    votes_given INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0.00,
    project_id VARCHAR REFERENCES projects(id),
    investment_id VARCHAR REFERENCES investments(id),
    stripe_payment_intent_id VARCHAR,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    project_id VARCHAR REFERENCES projects(id),
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority notification_priority DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_project ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Insert demo data
INSERT INTO users (id, email, first_name, last_name, profile_type, balance_eur, simulation_mode) 
VALUES 
    ('demo-user-1', 'demo@visual.com', 'Demo', 'User', 'investor', 10000.00, true),
    ('creator-1', 'marie@visual.com', 'Marie', 'Dubois', 'creator', 5000.00, true),
    ('creator-2', 'thomas@visual.com', 'Thomas', 'Martin', 'creator', 5000.00, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, title, description, category, creator_id, target_amount, current_amount, status, ml_score, investor_count, votes_count)
VALUES 
    ('proj-1', 'Documentaire sur l''IA', 'Un documentaire innovant explorant l''impact de l''intelligence artificielle sur notre société.', 'documentaire', 'creator-1', 5000.00, 1250.00, 'active', 7.5, 25, 150),
    ('proj-2', 'Court-métrage Animation', 'Une histoire touchante en animation 3D sur l''amitié et le courage.', 'animation', 'creator-2', 8000.00, 3200.00, 'active', 8.2, 42, 280)
ON CONFLICT (id) DO NOTHING;

-- Update sequences if needed
SELECT setval(pg_get_serial_sequence('sessions', 'sid'), 1, false);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;