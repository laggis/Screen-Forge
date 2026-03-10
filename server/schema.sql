-- ScreenForge Database Schema
-- Setup: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS screenforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE screenforge;

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar        VARCHAR(500) NULL,
  role          ENUM('user','pro','admin') DEFAULT 'user',
  is_verified   BOOLEAN      DEFAULT FALSE,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login    DATETIME     NULL,
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS projects (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  name        VARCHAR(100) NOT NULL DEFAULT 'My Loading Screen',
  description TEXT         NULL,
  thumbnail   VARCHAR(500) NULL,
  is_public   BOOLEAN      DEFAULT FALSE,
  template_id VARCHAR(36)  NULL,
  views       INT          DEFAULT 0,
  stars       INT          DEFAULT 0,
  created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_public  (is_public),
  INDEX idx_updated (updated_at)
);

CREATE TABLE IF NOT EXISTS project_data (
  id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  project_id VARCHAR(36) NOT NULL UNIQUE,
  components LONGTEXT    NOT NULL DEFAULT '[]',
  settings   LONGTEXT    NOT NULL DEFAULT '{}',
  version    INT         DEFAULT 1,
  saved_at   DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_assets (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  project_id    VARCHAR(36)  NOT NULL,
  user_id       VARCHAR(36)  NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type     ENUM('image','audio','font','other') DEFAULT 'other',
  mime_type     VARCHAR(100) NOT NULL,
  file_size     INT          NOT NULL,
  url           VARCHAR(500) NOT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
);

CREATE TABLE IF NOT EXISTS gallery_stars (
  user_id    VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  starred_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, project_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exports (
  id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  project_id  VARCHAR(36) NOT NULL,
  user_id     VARCHAR(36) NOT NULL,
  exported_at DATETIME    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- System admin account
INSERT IGNORE INTO users (id, username, email, password_hash, role, is_verified)
VALUES ('00000000-0000-0000-0000-000000000001', 'ScreenForge', 'system@screenforge.app', '', 'admin', TRUE);

COMMIT;
