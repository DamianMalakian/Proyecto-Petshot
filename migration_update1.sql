-- ============================================
-- MIGRACIÓN Update 1 - PetStore
-- Ejecutar en MySQL Workbench sobre la BD existente
-- ============================================

USE petstore;

-- 1. Agregar nuevos campos a productos
ALTER TABLE productos
  ADD COLUMN precio_costo   DECIMAL(10,2) NOT NULL DEFAULT 0   AFTER precio,
  ADD COLUMN tipo_stock     ENUM('unidad','kilo') NOT NULL DEFAULT 'unidad' AFTER precio_costo,
  ADD COLUMN stock_kg       DECIMAL(10,3) NOT NULL DEFAULT 0   AFTER tipo_stock,
  ADD COLUMN stock_minimo_kg DECIMAL(10,3) NOT NULL DEFAULT 0  AFTER stock_kg;

-- 2. Agregar campo costo_unitario en venta_items (para calcular ganancia histórica)
ALTER TABLE venta_items
  ADD COLUMN costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER precio_unitario,
  ADD COLUMN costo_total    DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER costo_unitario,
  ADD COLUMN cantidad_kg    DECIMAL(10,3) NULL DEFAULT NULL   AFTER costo_total;
  -- cantidad_kg solo se usa cuando tipo_stock = 'kilo'; cantidad sigue siendo la unidad de conteo = 1 para kg

-- 3. Agregar campos de ganancia/costo al cierre diario
ALTER TABLE cierres_dia
  ADD COLUMN total_costo    DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_monto,
  ADD COLUMN total_ganancia DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total_costo;

-- 4. La columna descuento en ventas pasa a ser porcentaje (0-100)
-- Renombramos para no perder datos viejos y agregamos la nueva
ALTER TABLE ventas
  ADD COLUMN descuento_pct  DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER descuento;

-- Nota: descuento sigue siendo el monto calculado, descuento_pct es el % ingresado

-- 5. Agregar DELETE para categorías (endpoint nuevo, no hay cambio de tabla)
-- (sin cambios adicionales en schema)

-- Verificar
SELECT 'Migración Update 1 completada ✅' as resultado;
