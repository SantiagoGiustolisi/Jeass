-- ============================================================
--  JEASS · Base de datos MySQL
--  Ejecutar en phpMyAdmin o cliente MySQL de Hostinger
-- ============================================================

CREATE DATABASE IF NOT EXISTS jeass_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jeass_db;

-- ------------------------------------------------------------
--  MARCAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  brand_key     VARCHAR(80)  NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  cls           VARCHAR(80)  DEFAULT '',
  img           LONGTEXT     DEFAULT '',
  sub           VARCHAR(300) DEFAULT '',
  display_order INT          DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  CATEGORÍAS (Buzo, Pantalón, Remera, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  brand_id      INT          NOT NULL,
  name          VARCHAR(120) NOT NULL,
  icon          VARCHAR(10)  DEFAULT '',
  cover_img     LONGTEXT     DEFAULT '',
  display_order INT          DEFAULT 0,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  PRODUCTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  category_id    INT           NOT NULL,
  name           VARCHAR(300)  NOT NULL,
  price          DECIMAL(12,2) NOT NULL DEFAULT 0,
  sizes          JSON,
  qty_by_size    JSON,
  qty            INT           DEFAULT 0,
  in_stock       TINYINT(1)    DEFAULT 1,
  img            LONGTEXT      DEFAULT '',
  gradient_start VARCHAR(30)   DEFAULT '#151520',
  gradient_end   VARCHAR(30)   DEFAULT '#080810',
  display_order  INT           DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
--  DROPS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drops (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(300) NOT NULL,
  sub           VARCHAR(500) DEFAULT '',
  drop_date     DATETIME,
  status        ENUM('soon','live') DEFAULT 'soon',
  display_order INT          DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
