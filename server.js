const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/productos', require('./routes/productos'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/reportes', require('./routes/reportes'));

// Ruta raíz → dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`\n🐾 Pet Store - Sistema de Facturación`);
  console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`\nRutas disponibles:`);
  console.log(`  GET  /            → Dashboard`);
  console.log(`  GET  /productos   → Gestión de productos`);
  console.log(`  GET  /ticket      → Nueva venta`);
  console.log(`  GET  /historial   → Historial de ventas`);
  console.log(`  GET  /reportes    → Reportes y cierres`);
});
