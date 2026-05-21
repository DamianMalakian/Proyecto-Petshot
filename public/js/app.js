// ── API Helper ──
const API = {
  async get(url) {
    const r = await fetch('/api' + url);
    return r.json();
  },
  async post(url, body) {
    const r = await fetch('/api' + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  },
  async put(url, body) {
    const r = await fetch('/api' + url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  },
  async delete(url) {
    const r = await fetch('/api' + url, { method: 'DELETE' });
    return r.json();
  }
};

// ── Toast ──
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();

  const icons = { success: '✓', error: '✕', info: '●' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Formatters ──
const fmt = {
  currency: (n) => '$' + parseFloat(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
  date: (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  datetime: (d) => new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  number: (n) => parseInt(n || 0).toLocaleString('es-AR'),
};

// ── Modal helpers ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Cerrar modal al click fuera
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ── Set active nav ──
(function() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      a.classList.add('active');
    }
  });
  // Dashboard especial
  if (path === '/' || path === '/index.html') {
    document.querySelector('.nav a[href="/"]')?.classList.add('active');
  }
})();

// ── Date display ──
(function() {
  const el = document.getElementById('fecha-hoy');
  if (el) {
    el.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
})();
