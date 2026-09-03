-- ============================================================
-- Migration: Advanced Security Controls (Assignment 6)
-- Run this file once against existing database
-- ============================================================
USE student_management;

-- ─── Add lockout + password expiry columns to staff ──────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS login_attempts      INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS totp_secret         VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled        BOOLEAN DEFAULT FALSE;

-- ─── Add lockout + password expiry columns to students ───────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS login_attempts      INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS totp_secret         VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled        BOOLEAN DEFAULT FALSE;

-- ─── Refresh token sessions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  user_type    ENUM('student','staff') NOT NULL,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  device_hint  VARCHAR(255) NULL,
  expires_at   TIMESTAMP NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id, user_type),
  INDEX idx_expires (expires_at)
);
