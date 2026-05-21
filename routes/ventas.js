const express = require('express');
const router = express.Router();
const db = require('../db');

function generarTicket() {
  const now = new Date();
  const fecha = now.toISOString().slice(0,10).replace(/-/g,'');
  const hora = now.getTime().toString().slice(-6);
  return `T-${fecha}-${hora}`;
}

// GET todas las ventas (historial)
router.get('/', async (req, res) => {
  try {
    const { desde, hasta, estado, limite = 50, pagina = 1 } = req.query;
    let query = 'SELECT * FROM ventas WHERE 1=1';
    const params = [];
    if (desde) { query += ' AND DATE(creado_en) >= ?'; params.push(desde); }
    if (hasta) { query += ' AND DATE(creado_en) <= ?'; params.push(hasta); }
    if (estado) { query += ' AND estado = ?'; params.push(estado); }
    query += ' ORDER BY creado_en DESC';
    query += ` LIMIT ${parseInt(limite)} OFFSET ${(parseInt(pagina) - 1) * parseInt(limite)}`;
    const [rows] = await db.query(query, params);
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET venta por ID con sus items
router.get('/:id', async (req, res) => {
  try {
    const [ventas] = await db.query('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!ventas.length) return res.status(404).json({ ok: false, error: 'Venta no encontrada' });
    const [items] = await db.query('SELECT * FROM venta_items WHERE venta_id = ?', [req.params.id]);
    res.json({ ok: true, data: { ...ventas[0], items } });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST crear nueva venta
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { cliente_nombre, items, descuento_pct = 0, observaciones } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ ok: false, error: 'La venta debe tener al menos un producto' });
    }
    if (items.length > 20) {
      return res.status(400).json({ ok: false, error: 'Máximo 20 productos por ticket' });
    }

    let subtotal = 0;
    const itemsValidados = [];

    for (const item of items) {
      const [prod] = await conn.query('SELECT * FROM productos WHERE id = ? AND activo = 1', [item.producto_id]);
      if (!prod.length) throw new Error(`Producto ID ${item.producto_id} no encontrado`);

      const p = prod[0];
      let cantidad = 0;
      let cantidad_kg = null;
      let itemSubtotal = 0;

      if (p.tipo_stock === 'kilo') {
        // item.cantidad_kg es el peso en kg (float)
        const kg = parseFloat(item.cantidad_kg);
        if (isNaN(kg) || kg <= 0) throw new Error(`Peso inválido para "${p.nombre}"`);
        if (parseFloat(p.stock_kg) < kg) {
          throw new Error(`Stock insuficiente para "${p.nombre}". Stock disponible: ${p.stock_kg} kg`);
        }
        cantidad = 1; // se cuenta como 1 ítem en el ticket
        cantidad_kg = kg;
        itemSubtotal = parseFloat(p.precio) * kg; // precio es por kg
      } else {
        // unidades — máximo 12 por producto
        cantidad = parseInt(item.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) throw new Error(`Cantidad inválida para "${p.nombre}"`);
        if (cantidad > 12) throw new Error(`Máximo 12 unidades por producto ("${p.nombre}")`);
        if (p.stock < cantidad) throw new Error(`Stock insuficiente para "${p.nombre}". Stock disponible: ${p.stock}`);
        itemSubtotal = parseFloat(p.precio) * cantidad;
      }

      subtotal += itemSubtotal;

      itemsValidados.push({
        producto_id: p.id,
        producto_nombre: p.nombre,
        tipo_stock: p.tipo_stock,
        cantidad,
        cantidad_kg,
        precio_unitario: p.precio,
        costo_unitario: p.precio_costo || 0,
        costo_total: (p.precio_costo || 0) * (cantidad_kg !== null ? cantidad_kg : cantidad),
        subtotal: itemSubtotal
      });
    }

    const pct = Math.min(Math.max(parseFloat(descuento_pct) || 0, 0), 100);
    const descuento_monto = subtotal * (pct / 100);
    const total = subtotal - descuento_monto;
    const numero_ticket = generarTicket();

    const [ventaResult] = await conn.query(
      'INSERT INTO ventas (numero_ticket, cliente_nombre, subtotal, descuento, descuento_pct, total, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [numero_ticket, cliente_nombre || 'Consumidor Final', subtotal, descuento_monto, pct, total, observaciones || null]
    );
    const venta_id = ventaResult.insertId;

    for (const item of itemsValidados) {
      await conn.query(
        `INSERT INTO venta_items
          (venta_id, producto_id, producto_nombre, cantidad, costo_unitario, costo_total, cantidad_kg, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [venta_id, item.producto_id, item.producto_nombre, item.cantidad, item.costo_unitario, item.costo_total, item.cantidad_kg, item.precio_unitario, item.subtotal]
      );

      // Descontar stock según tipo
      if (item.tipo_stock === 'kilo') {
        await conn.query('UPDATE productos SET stock_kg = stock_kg - ? WHERE id = ?', [item.cantidad_kg, item.producto_id]);
      } else {
        await conn.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.producto_id]);
      }
    }

    await conn.commit();
    res.status(201).json({ ok: true, id: venta_id, numero_ticket, subtotal, descuento_monto, descuento_pct: pct, total, message: 'Venta registrada correctamente' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ ok: false, error: err.message });
  } finally {
    conn.release();
  }
});

// PUT anular venta
router.put('/:id/anular', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [ventas] = await conn.query('SELECT * FROM ventas WHERE id = ?', [req.params.id]);
    if (!ventas.length) return res.status(404).json({ ok: false, error: 'Venta no encontrada' });
    if (ventas[0].estado === 'anulada') return res.status(400).json({ ok: false, error: 'La venta ya está anulada' });

    const [items] = await conn.query('SELECT vi.*, p.tipo_stock FROM venta_items vi JOIN productos p ON vi.producto_id = p.id WHERE vi.venta_id = ?', [req.params.id]);
    for (const item of items) {
      if (item.tipo_stock === 'kilo' && item.cantidad_kg) {
        await conn.query('UPDATE productos SET stock_kg = stock_kg + ? WHERE id = ?', [item.cantidad_kg, item.producto_id]);
      } else {
        await conn.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [item.cantidad, item.producto_id]);
      }
    }

    await conn.query('UPDATE ventas SET estado = ? WHERE id = ?', ['anulada', req.params.id]);
    await conn.commit();
    res.json({ ok: true, message: 'Venta anulada y stock restaurado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
