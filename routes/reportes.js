const express = require('express');
const router = express.Router();
const db = require('../db');

// GET resumen del día actual
router.get('/hoy', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) as total_ventas,
        COALESCE(SUM(total), 0) as total_monto,
        COALESCE(SUM(total) / NULLIF(COUNT(*), 0), 0) as ticket_promedio
      FROM ventas
      WHERE DATE(creado_en) = CURDATE() AND estado = 'completada'
    `);

    const [items] = await db.query(`
      SELECT COALESCE(SUM(vi.cantidad), 0) as total_items
      FROM venta_items vi
      JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) = CURDATE() AND v.estado = 'completada'
    `);

    // Costo total y ganancia del día
    const [costos] = await db.query(`
      SELECT
        COALESCE(SUM(vi.costo_total), 0) as total_costo,
        COALESCE(SUM(vi.subtotal), 0) as total_venta_bruta
      FROM venta_items vi
      JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) = CURDATE() AND v.estado = 'completada'
    `);

    const [topProductos] = await db.query(`
      SELECT vi.producto_nombre, SUM(vi.cantidad) as cantidad, SUM(vi.subtotal) as total
      FROM venta_items vi
      JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) = CURDATE() AND v.estado = 'completada'
      GROUP BY vi.producto_id, vi.producto_nombre
      ORDER BY total DESC
      LIMIT 5
    `);

    const total_monto = parseFloat(rows[0].total_monto);
    const total_costo = parseFloat(costos[0].total_costo);
    const ganancia = total_monto - total_costo;

    res.json({
      ok: true,
      data: {
        ...rows[0],
        total_items: items[0].total_items,
        total_costo,
        ganancia,
        top_productos: topProductos
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST cierre del día
router.post('/cierre-dia', async (req, res) => {
  try {
    const fecha = req.body.fecha || new Date().toISOString().slice(0,10);

    const [rows] = await db.query(`
      SELECT COUNT(*) as total_ventas, COALESCE(SUM(total), 0) as total_monto
      FROM ventas WHERE DATE(creado_en) = ? AND estado = 'completada'
    `, [fecha]);

    const [items] = await db.query(`
      SELECT COALESCE(SUM(vi.cantidad), 0) as total_items
      FROM venta_items vi JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) = ? AND v.estado = 'completada'
    `, [fecha]);

    const [costos] = await db.query(`
      SELECT COALESCE(SUM(vi.costo_total), 0) as total_costo
      FROM venta_items vi JOIN ventas v ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) = ? AND v.estado = 'completada'
    `, [fecha]);

    await db.query(`
      INSERT INTO cierres_dia (fecha, total_ventas, total_items, total_monto, total_costo)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_ventas = VALUES(total_ventas),
        total_items  = VALUES(total_items),
        total_monto  = VALUES(total_monto),
        total_costo  = VALUES(total_costo),
        cerrado_en   = CURRENT_TIMESTAMP
    `, [fecha, rows[0].total_ventas, items[0].total_items, rows[0].total_monto, costos[0].total_costo]);

    res.json({ ok: true, message: `Cierre del ${fecha} registrado`, data: { fecha, ...rows[0], total_items: items[0].total_items, total_costo: costos[0].total_costo } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET comparativa semanal (últimos 7 días)
router.get('/semanal', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE(v.creado_en) as fecha,
        COUNT(DISTINCT v.id) as total_ventas,
        COALESCE(SUM(v.total), 0) as total_monto,
        COALESCE(SUM(vi.costo_total), 0) as total_costo
      FROM ventas v
      LEFT JOIN venta_items vi ON vi.venta_id = v.id
      WHERE DATE(v.creado_en) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND v.estado = 'completada'
      GROUP BY DATE(v.creado_en)
      ORDER BY fecha ASC
    `);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET comparativa mensual (últimos 12 meses)
router.get('/mensual', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(v.creado_en, '%Y-%m') as mes,
        DATE_FORMAT(v.creado_en, '%b %Y') as mes_label,
        COUNT(DISTINCT v.id) as total_ventas,
        COALESCE(SUM(v.total), 0) as total_monto,
        COALESCE(SUM(vi.costo_total), 0) as total_costo
      FROM ventas v
      LEFT JOIN venta_items vi ON vi.venta_id = v.id
      WHERE v.creado_en >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND v.estado = 'completada'
      GROUP BY DATE_FORMAT(v.creado_en, '%Y-%m')
      ORDER BY mes ASC
    `);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET historial de cierres
router.get('/cierres', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cierres_dia ORDER BY fecha DESC LIMIT 30');
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
