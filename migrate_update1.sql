-- ============================================================
-- MIGRACIÓN Update 1 – Ejecutar en MySQL Workbench
-- Si ya tenés datos, este script los preserva.
-- ============================================================

USE petstore;

-- 1. Nuevos campos en productos
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_costo   DECIMAL(10,2) NOT NULL DEFAULT 0        AFTER precio,
  ADD COLUMN IF NOT EXISTS tipo_stock     ENUM('unidad','kilo') NOT NULL DEFAULT 'unidad' AFTER precio_costo,
  ADD COLUMN IF NOT EXISTS stock_kg       DECIMAL(10,3) NOT NULL DEFAULT 0        AFTER stock,
  ADD COLUMN IF NOT EXISTS stock_minimo_kg DECIMAL(10,3) NOT NULL DEFAULT 0       AFTER stock_minimo;

-- 2. Nuevos campos en ventas
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS descuento_pct DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER descuento;

-- 3. Nuevos campos en venta_items
ALTER TABLE venta_items
  MODIFY COLUMN cantidad DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cantidad_kg   DECIMAL(10,3) DEFAULT NULL AFTER cantidad,
  ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER precio_unitario,
  ADD COLUMN IF NOT EXISTS costo_total    DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER costo_unitario;

-- 4. Nuevo campo en cierres_dia
ALTER TABLE cierres_dia
  ADD COLUMN IF NOT EXISTS total_costo DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_monto;

SELECT 'Migración Update 1 completada correctamente ✅' as resultado;
