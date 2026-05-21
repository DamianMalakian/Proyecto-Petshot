# 🐾 PetStore – Sistema de Facturación

App de facturación interna para tienda de mascotas. Web app full-stack con Node.js + Express + MySQL.

---

## 📋 Requisitos

- Node.js 18+
- MySQL Server (ya instalado)
- MySQL Workbench (ya instalado)

---

## 🚀 Instalación paso a paso

### 1. Crear la base de datos

Abrí MySQL Workbench, conectate a tu servidor local y ejecutá el archivo `database.sql`.

Podés hacerlo desde el menú: **File → Open SQL Script → database.sql** → Ejecutar (⚡)

### 2. Configurar la conexión

Copiá el archivo de ejemplo y editalo con tus datos:

```bash
cp .env.example .env
```

Editá `.env` con tu contraseña de MySQL:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=petstore
PORT=3000
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Iniciar el servidor

```bash
npm start
```

O con auto-recarga para desarrollo:

```bash
npm run dev
```

### 5. Abrir la app

Abrí el navegador en: **http://localhost:3000**

---

## 📁 Estructura del proyecto

```
pet-store/
├── server.js              ← Servidor Express
├── db.js                  ← Conexión a MySQL
├── database.sql           ← Script SQL (crear y poblar BD)
├── .env.example           ← Plantilla de configuración
├── package.json
├── routes/
│   ├── productos.js       ← API de productos
│   ├── ventas.js          ← API de ventas
│   └── reportes.js        ← API de reportes
└── public/
    ├── index.html          ← Dashboard
    ├── ticket.html         ← Nueva venta
    ├── productos.html      ← ABM de productos
    ├── historial.html      ← Historial de ventas
    ├── reportes.html       ← Reportes y cierres
    ├── css/style.css
    └── js/app.js
```

---

## 🧭 Módulos de la app

| Pantalla | URL | Función |
|---|---|---|
| Dashboard | `/` | Resumen del día, alertas de stock, acciones rápidas |
| Nueva Venta | `/ticket.html` | Catálogo clickeable, carrito, ticket imprimible |
| Productos | `/productos.html` | ABM completo, categorías, control de stock |
| Historial | `/historial.html` | Ventas filtradas por fecha, anulación |
| Reportes | `/reportes.html` | Gráficos semanal/mensual, cierre del día |

---

## 💡 Uso básico

### Nueva venta
1. Ir a **Nueva Venta**
2. Hacer click en los productos para agregarlos al carrito
3. Opcionalmente ingresar el nombre del cliente y un descuento
4. Confirmar → se genera el ticket y se descuenta el stock

### Cierre del día
1. Desde el **Dashboard** o **Reportes**, hacer click en "Cierre del Día"
2. Revisar el resumen y confirmar
3. El cierre queda guardado para comparativas semanales/mensuales

### Stock bajo
- El dashboard muestra automáticamente los productos con stock menor o igual al mínimo configurado
- El mínimo se define por producto en el ABM

---

## 🔧 API Reference (para referencia)

```
GET  /api/productos              → listar productos
POST /api/productos              → crear producto
PUT  /api/productos/:id          → editar producto
DEL  /api/productos/:id          → desactivar producto

GET  /api/ventas                 → historial
POST /api/ventas                 → nueva venta
GET  /api/ventas/:id             → detalle con items
PUT  /api/ventas/:id/anular      → anular venta

GET  /api/reportes/hoy           → resumen del día
GET  /api/reportes/semanal       → últimos 7 días
GET  /api/reportes/mensual       → últimos 12 meses
POST /api/reportes/cierre-dia    → registrar cierre
GET  /api/reportes/cierres       → historial de cierres
```
