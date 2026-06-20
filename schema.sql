-- EcoStep Database Schema
-- Requires PostgreSQL 16 and TimescaleDB extension

-- Create TimescaleDB extension if not exists
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users Table
-- Data Protection Note: This table stores PII (email, location). 
-- Ensure column-level encryption or application-level pseudonymization for sensitive fields before production deployment.
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    country_code VARCHAR(2) NOT NULL, -- e.g., 'US', 'GB'
    regional_grid_zone VARCHAR(50) NOT NULL, -- e.g., 'US_EAST', 'US_WEST', 'US_TEXAS'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs Table
-- Stores raw JSONB payloads from incoming integrations (smart plugs, financial APIs, mobility GPS logs)
CREATE TABLE activity_logs (
    log_id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL, -- e.g., 'smart_plug', 'gps', 'financial'
    payload JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (log_id, recorded_at)
);

-- Convert activity_logs into a TimescaleDB hypertable
SELECT create_hypertable('activity_logs', by_range('recorded_at'));

-- Carbon Ledger Table
-- Tracks final processed carbon footprint entries
CREATE TABLE carbon_ledger (
    ledger_id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_log_id UUID, -- Optional link to raw log
    category VARCHAR(50) NOT NULL, -- e.g., 'TRANSPORT', 'UTILITIES', 'DIET'
    sub_category VARCHAR(50) NOT NULL, -- e.g., 'gasoline_car', 'electricity_kwh'
    raw_quantity NUMERIC NOT NULL,
    unit VARCHAR(20) NOT NULL,
    computed_co2e_kg NUMERIC(12,4) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ledger_id, recorded_at)
);

-- Convert carbon_ledger into a TimescaleDB hypertable
SELECT create_hypertable('carbon_ledger', by_range('recorded_at'));

-- Enable compression on the carbon_ledger hypertable
ALTER TABLE carbon_ledger SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'user_id, category'
);

-- Add compression policy for data older than 14 days
SELECT add_compression_policy('carbon_ledger', INTERVAL '14 days');

-- Indexes for efficient time-series queries
-- Index on activity_logs
CREATE INDEX idx_activity_logs_user_time ON activity_logs (user_id, recorded_at DESC);

-- Index on carbon_ledger for filtering by user, category, and timestamp descending
CREATE INDEX idx_carbon_ledger_user_cat_time ON carbon_ledger (user_id, category, recorded_at DESC);
