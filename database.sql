-- ============================================
-- Base de datos: Tienda de Mascotas
-- ============================================

CREATE DATABASE IF NOT EXISTS petstore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petstore;

-- Tabla de categorías de productos
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria_id INT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  activo TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_ticket VARCHAR(20) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(200) DEFAULT 'Consumidor Final',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado ENUM('pendiente','completada','anulada') DEFAULT 'completada',
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items por venta
CREATE TABLE IF NOT EXISTS venta_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(200) NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- Tabla de cierres de caja diarios
CREATE TABLE IF NOT EXISTS cierres_dia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  total_ventas INT NOT NULL DEFAULT 0,
  total_items INT NOT NULL DEFAULT 0,
  total_monto DECIMAL(10,2) NOT NULL DEFAULT 0,
  cerrado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Datos de ejemplo
-- ============================================

INSERT INTO categorias (nombre) VALUES
  ('Alimentos'),
  ('Accesorios'),
  ('Higiene y Cuidado'),
  ('Medicamentos'),
  ('Juguetes');

INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock, stock_minimo) VALUES
  ('Royal Canin Adulto 1kg', 'Alimento balanceado para perros adultos', 1, 2500.00, 30, 5),
  ('Purina Pro Plan Gato 500g', 'Alimento premium para gatos', 1, 1800.00, 20, 5),
  ('Collar ajustable talle M', 'Collar nylon resistente', 2, 850.00, 15, 3),
  ('Shampoo para perros 500ml', 'Shampoo neutro con aloe vera', 3, 1200.00, 12, 3),
  ('Pelota de goma', 'Juguete resistente para perros', 5, 650.00, 25, 5),
  ('Antiparasitario Frontline', 'Pipeta antipulgas y garrapatas', 4, 3200.00, 8, 2),
  ('Comedero acero inox mediano', 'Comedero antideslizante 500ml', 2, 1100.00, 10, 3),
  ('Cama para mascotas talle M', 'Cama acolchada lavable', 2, 4500.00, 6, 2),
  ('Rascador para gatos', 'Torre rascadora con plataformas', 5, 5800.00, 4, 2),
  ('Champú seco en aerosol', 'Limpieza sin agua 200ml', 3, 980.00, 18, 5);
