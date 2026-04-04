-- PulseShield MySQL schema
-- Run: mysql -u root -p < schema.sql (after creating database)

CREATE DATABASE IF NOT EXISTS pulse_shield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pulse_shield;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL DEFAULT '',
  platform VARCHAR(128) NOT NULL DEFAULT '',
  working_hours VARCHAR(64) NOT NULL DEFAULT '',
  avg_daily_earnings DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS earnings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  actual_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  predicted_income DECIMAL(12, 2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_date (user_id, date),
  CONSTRAINT fk_earnings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_earnings_user_date (user_id, date)
);

CREATE TABLE IF NOT EXISTS claims (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  loss_amount DECIMAL(12, 2) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  risk_score VARCHAR(16) NOT NULL DEFAULT 'low',
  predicted_income DECIMAL(12, 2) NULL,
  actual_income DECIMAL(12, 2) NULL,
  claim_date DATE NOT NULL,
  payout_reference VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_claims_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_claims_user (user_id),
  INDEX idx_claims_created (created_at)
);
