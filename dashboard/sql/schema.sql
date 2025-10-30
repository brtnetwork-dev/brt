-- XMRig Mining Contribution Dashboard Database Schema
-- PostgreSQL schema for worker snapshots and points ledger

-- Workers snapshot table
-- Stores periodic snapshots of worker mining statistics
CREATE TABLE IF NOT EXISTS workers_snapshot (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  worker VARCHAR(255) NOT NULL,
  hashrate_1m DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hashrate_10m DECIMAL(12, 2) NOT NULL DEFAULT 0,
  accepted BIGINT NOT NULL DEFAULT 0,
  rejected BIGINT NOT NULL DEFAULT 0,
  total_hashes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient worker queries
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_worker ON workers_snapshot(worker);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_ts ON workers_snapshot(ts DESC);

-- Composite index for worker history queries
CREATE INDEX IF NOT EXISTS idx_workers_snapshot_worker_ts ON workers_snapshot(worker, ts DESC);

-- Points ledger table
-- Records point accumulation events for each worker
CREATE TABLE IF NOT EXISTS points_ledger (
  id SERIAL PRIMARY KEY,
  ts TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  worker VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient worker queries
CREATE INDEX IF NOT EXISTS idx_points_ledger_worker ON points_ledger(worker);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_points_ledger_ts ON points_ledger(ts DESC);

-- Composite index for worker points history
CREATE INDEX IF NOT EXISTS idx_points_ledger_worker_ts ON points_ledger(worker, ts DESC);
