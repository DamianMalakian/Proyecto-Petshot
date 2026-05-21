const express = require('express');
const router = express.Router();
const db = require('../db');

// GET todos los productos (con filtros opcionales)
router.get('/', async (req, res) => {
  try {
    const { buscar, categoria, activo } = req.query;
    let query = `
      SELECT p.*, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (buscar) {
      query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
      params.push(`%${buscar}%`, `%${buscar}%`);
    }
    if (categoria) {
      query += ' AND p.categoria_id = ?';
      params.push(categoria);
    }
    if (activo !== undefined) {
      query += ' AND p.activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    } else {
      query += ' AND p.activo = 1';
    }

    query += ' ORDER BY p.nombre ASC';
    const [rows] = await db.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET producto por ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST crear producto
router.post('/', async (req, res) => {
  try {
    const { nombre, descripcion, categoria_id, precio, precio_costo, tipo_stock, stock, stock_kg, stock_minimo, stock_minimo_kg } = req.body;
    if (!nombre || precio === undefined) {
      return res.status(400).json({ ok: false, error: 'Nombre y precio final son obligatorios' });
    }
    const [result] = await db.query(
      `INSERT INTO productos
        (nombre, descripcion, categoria_id, precio, precio_costo, tipo_stock, stock, stock_kg, stock_minimo, stock_minimo_kg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion || null,
        categoria_id || null,
        precio,
        precio_costo || 0,
        tipo_stock || 'unidad',
        tipo_stock === 'kilo' ? 0 : (stock || 0),
        tipo_stock === 'kilo' ? (stock_kg || 0) : 0,
        tipo_stock === 'kilo' ? 0 : (stock_minimo || 5),
        tipo_stock === 'kilo' ? (stock_minimo_kg || 0) : 0
      ]
    );
    res.status(201).json({ ok: true, id: result.insertId, message: 'Producto creado correctamente' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { nombre, descripcion, categoria_id, precio, precio_costo, tipo_stock, stock, stock_kg, stock_minimo, stock_minimo_kg, activo } = req.body;
    const [result] = await db.query(
      `UPDATE productos SET
        nombre         = COALESCE(?, nombre),
        descripcion    = COALESCE(?, descripcion),
        categoria_id   = COALESCE(?, categoria_id),
        precio         = COALESCE(?, precio),
        precio_costo   = COALESCE(?, precio_costo),
        tipo_stock     = COALESCE(?, tipo_stock),
        stock          = COALESCE(?, stock),
        stock_kg       = COALESCE(?, stock_kg),
        stock_minimo   = COALESCE(?, stock_minimo),
        stock_minimo_kg= COALESCE(?, stock_minimo_kg),
        activo         = COALESCE(?, activo)
      WHERE id = ?`,
      [nombre, descripcion, categoria_id, precio, precio_costo, tipo_stock, stock, stock_kg, stock_minimo, stock_minimo_kg, activo, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    res.json({ ok: true, message: 'Producto actualizado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query('UPDATE productos SET activo = 0 WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    res.json({ ok: true, message: 'Producto desactivado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── CATEGORÍAS ──

// GET todas las categorías
router.get('/meta/categorias', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre');
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST nueva categoría
router.post('/meta/categorias', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'Nombre requerido' });
    const [result] = await db.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT editar categoría
router.put('/meta/categorias/:id', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, error: 'Nombre requerido' });
    const [result] = await db.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
    res.json({ ok: true, message: 'Categoría actualizada' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE categoría (solo si no tiene productos activos)
router.delete('/meta/categorias/:id', async (req, res) => {
  try {
    const [prods] = await db.query('SELECT COUNT(*) as c FROM productos WHERE categoria_id = ? AND activo = 1', [req.params.id]);
    if (prods[0].c > 0) {
      return res.status(400).json({ ok: false, error: `No se puede eliminar: tiene ${prods[0].c} producto(s) activo(s) asignado(s)` });
    }
    const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Categoría no encontrada' });
    res.json({ ok: true, message: 'Categoría eliminada' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET productos con stock bajo
router.get('/alertas/stock-bajo', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre as categoria_nombre FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.activo = 1 AND (
        (p.tipo_stock = 'unidad' AND p.stock <= p.stock_minimo) OR
        (p.tipo_stock = 'kilo'   AND p.stock_kg <= p.stock_minimo_kg)
      )
      ORDER BY p.nombre ASC
    `);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
