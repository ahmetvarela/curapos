// pos-enhance.js
// Capa de interactividad que se suma a pos-home-3d.js (no lo reemplaza).
// Aporta: terminal POS viva, chat IA interactivo, barra de progreso,
// navegación con sección activa, contadores, tooltip del mapa de calor
// y revelado en cascada. Todo respeta prefers-reduced-motion.
'use strict';

(function () {
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isTouch = window.matchMedia &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- utilidades ---------- */
  function formatCOP(n) {
    const v = Math.round(n);
    return '$ ' + v.toLocaleString('es-CO');
  }

  function countUp(el, from, to, dur, format) {
    if (reduceMotion) { el.textContent = format(to); return; }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ============================================================
     1. BARRA DE PROGRESO DE LECTURA
     ============================================================ */
  function setupScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop || window.scrollY) / max * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ============================================================
     2. NAVEGACIÓN CON SECCIÓN ACTIVA (rail de puntos)
     ============================================================ */
  function setupSectionRail() {
    const wanted = [
      { id: 'chat-ia-negocio', label: 'Chat IA' },
      { id: 'fidelizacion-clientes', label: 'Fidelización' },
      { id: 'niveles-clientes', label: 'Niveles de cliente' },
      { id: 'web-y-citas', label: 'Página web' },
      { id: 'ritmo-venta', label: 'Ritmo de venta' },
      { id: 'proveedores-inteligentes', label: 'Proveedores' },
      { id: 'empleados-control', label: 'Empleados' },
      { id: 'agenda-citas', label: 'Agenda de citas' },
      { id: 'facturacion-electronica', label: 'Facturación' },
      { id: 'automatizacion-respaldo', label: 'Automatización y respaldo' },
      { id: 'finanzas', label: 'Finanzas' },
      { id: 'solucion-hibrida', label: 'Solución híbrida' }
    ];

    const sections = wanted
      .map(function (w) { return { el: document.getElementById(w.id), label: w.label, id: w.id }; })
      .filter(function (s) { return s.el; });

    if (sections.length < 2) return;

    const rail = document.createElement('nav');
    rail.className = 'section-rail';
    rail.setAttribute('aria-label', 'Navegación de secciones');

    sections.forEach(function (s) {
      const dot = document.createElement('a');
      dot.href = '#' + s.id;
      dot.setAttribute('data-label', s.label);
      dot.setAttribute('aria-label', s.label);
      dot.addEventListener('click', function (e) {
        e.preventDefault();
        s.el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      rail.appendChild(dot);
      s.dot = dot;
    });

    document.body.appendChild(rail);

    let ticking = false;
    function spy() {
      const mid = window.scrollY + window.innerHeight * 0.4;
      let active = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= mid) active = s;
      });
      sections.forEach(function (s) {
        s.dot.classList.toggle('is-active', s === active);
      });
      // mostrar el rail solo después del hero
      rail.classList.toggle('is-ready', window.scrollY > window.innerHeight * 0.6);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(spy);
    }, { passive: true });
    spy();
  }

  /* ============================================================
     3. TERMINAL POS VIVA (la venta cambia sola)
     ============================================================ */
  function setupLiveTerminal() {
    const terminal = document.getElementById('posTerminal');
    if (!terminal) return;

    const lines = terminal.querySelectorAll('.terminal-screen .sale-line');
    const totalEl = terminal.querySelector('.screen-total strong');
    if (lines.length < 3 || !totalEl) return;

    const prodLabel = lines[0].querySelector('span');
    const prodVal = lines[0].querySelector('strong');
    const ivaVal = lines[1].querySelector('strong');
    const cajaLabel = lines[2].querySelector('span');
    const cajaVal = lines[2].querySelector('strong');

    const sales = [
      { name: 'Corte de cabello', base: 120000, iva: 22800 },
      { name: 'Bota en cuero', base: 230000, iva: 43700 },
      { name: 'Sombrero', base: 85000, iva: 16150 },
      { name: 'Cotización express', base: 340000, iva: 64600 },
      { name: 'Combo barba + corte', base: 65000, iva: 12350 }
    ];

    if (cajaLabel) cajaLabel.textContent = 'Subtotal';
    let i = 0;
    let prev = { base: 120000, iva: 22800, total: 142800 };

    function show(s) {
      const total = s.base + s.iva;
      if (prodLabel) {
        prodLabel.textContent = s.name;
        prodLabel.style.color = 'var(--gold-light)';
        prodLabel.style.fontWeight = '700';
      }
      countUp(prodVal, prev.base, s.base, 650, formatCOP);
      countUp(ivaVal, prev.iva, s.iva, 650, formatCOP);
      countUp(cajaVal, prev.base, s.base, 650, formatCOP);
      countUp(totalEl, prev.total, total, 700, formatCOP);
      prev = { base: s.base, iva: s.iva, total: total };
    }

    show(sales[0]);
    if (reduceMotion) return;

    setInterval(function () {
      if (document.hidden) return;
      i = (i + 1) % sales.length;
      show(sales[i]);
    }, 3800);
  }

  /* ============================================================
     4. CHAT IA INTERACTIVO
     ============================================================ */
  const CHAT_DATA = [
    {
      chip: 'Ganancias del mes',
      q: 'Dime las ganancias de este mes',
      title: 'Resumen financiero · 01 a 09 de junio 2026',
      lines: [
        'Ventas netas: <strong>$ 6.681.900</strong>',
        'Utilidad bruta: <strong>$ 3.280.000</strong>',
        'Utilidad neta: <strong>$ 2.977.106</strong>',
        'Egresos pagados: $ 826.494 · devoluciones: $ 59.500',
        'Balance final de caja: <strong>$ 5.855.406</strong>'
      ]
    },
    {
      chip: 'Egresos del mes',
      q: 'Dime los egresos del mes pasado',
      title: 'Egresos · mayo 2026',
      lines: [
        'Pagos aplicados: <strong>$ 2.362.400</strong>',
        'Pagos a proveedores: $ 1.592.400',
        'Gastos operativos: $ 690.168',
        'GMF / 4x1000: $ 0',
        'Tipos: Gasto $ 670.000 · Nómina $ 100.000 · Proveedor $ 1.592.400'
      ]
    },
    {
      chip: '¿Cuánto le debo a Jafet?',
      q: '¿Cuánto le debo a Jafet?',
      title: 'Saldo del empleado Jafet · hasta 10 jun 2026',
      lines: [
        'Comisión generada: <strong>$ 3.808.500</strong>',
        'Pagado: $ 0',
        'Saldo pendiente: <strong>$ 3.808.500</strong>',
        'Estado: <strong>PENDIENTE</strong>'
      ]
    },
    {
      chip: 'Reporte de IVA',
      q: 'Dame el reporte de IVA del mes pasado',
      title: 'IVA · mayo 2026',
      lines: [
        'IVA cobrado: <strong>$ 71.900</strong>',
        'IVA descontable de egresos: $ 149.099',
        'IVA por pagar: $ 0 · saldo a favor: <strong>$ 77.199</strong>',
        'Por tarifa — 5%: $ 1.600 · 19%: $ 70.300'
      ]
    },
    {
      chip: 'Productos más rentables',
      q: 'Dime los productos más rentables',
      title: 'Productos más rentables · 2026',
      lines: [
        '1. Corte — <strong>$ 3.045.000</strong> · margen 50%',
        '2. Cotiza — $ 666.000 · margen 60%',
        '3. Bota — $ 140.000 · margen 31,82%',
        '4. Sombrero — $ 50.000 · margen 50%',
        '5. Cotizas — $ 40.000 · margen 50%'
      ]
    }
  ];

  function setupInteractiveChat() {
    const win = document.querySelector('.ai-chat-window');
    if (!win) return;

    win.setAttribute('aria-hidden', 'false');

    // Reconstruir el contenido del chat de forma interactiva
    win.innerHTML =
      '<div class="ai-window-top">' +
        '<span></span><span></span><span></span>' +
        '<strong>Cura IA</strong>' +
      '</div>' +
      '<div class="ai-quick-row"></div>' +
      '<div class="ai-conversation" id="aiConversation"></div>' +
      '<div class="ai-input-fake">' +
        '<span>Pregúntale a Cura IA sobre tu empresa…</span>' +
        '<span class="ai-send">↑</span>' +
      '</div>';

    const quickRow = win.querySelector('.ai-quick-row');
    const convo = win.querySelector('#aiConversation');

    let busy = false;
    let activeChip = null;

    // chips de sugerencias
    CHAT_DATA.forEach(function (item, idx) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ai-quick-chip';
      chip.textContent = item.chip;
      chip.addEventListener('click', function () {
        ask(item, chip);
      });
      quickRow.appendChild(chip);
      item._chip = chip;
    });

    // tarjetas-pregunta de la izquierda también disparan el chat
    const promptCards = document.querySelectorAll('#chat-ia-negocio .ai-prompt-card');
    const cardMap = ['Ganancias del mes', 'Reporte de IVA', '¿Cuánto le debo a Jafet?', 'Productos más rentables'];
    promptCards.forEach(function (card, idx) {
      card.classList.add('is-clickable');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      const target = CHAT_DATA.find(function (d) { return d.chip === cardMap[idx]; }) || CHAT_DATA[idx % CHAT_DATA.length];
      function go() {
        if (!target) return;
        target._chip ? ask(target, target._chip) : ask(target, null);
        win.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
      card.addEventListener('click', go);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });

    function addUser(text) {
      const m = document.createElement('div');
      m.className = 'ai-message user-message';
      m.textContent = text;
      convo.appendChild(m);
      scroll();
    }

    function scroll() {
      win.scrollTop = win.scrollHeight;
    }

    function ask(item, chip) {
      if (busy) return;
      busy = true;

      if (activeChip) activeChip.classList.remove('is-active');
      if (chip) { chip.classList.add('is-active'); activeChip = chip; }

      addUser(item.q);

      // indicador "escribiendo…"
      const typing = document.createElement('div');
      typing.className = 'ai-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      convo.appendChild(typing);
      scroll();

      const thinkMs = reduceMotion ? 200 : 650;
      setTimeout(function () {
        typing.remove();
        streamAnswer(item);
      }, thinkMs);
    }

    function streamAnswer(item) {
      const bot = document.createElement('div');
      bot.className = 'ai-message bot-message';
      convo.appendChild(bot);

      const titleEl = document.createElement('strong');
      titleEl.textContent = item.title;
      bot.appendChild(titleEl);
      bot.appendChild(document.createElement('br'));
      scroll();

      if (reduceMotion) {
        item.lines.forEach(function (ln) {
          const d = document.createElement('div');
          d.innerHTML = ln;
          bot.appendChild(d);
        });
        busy = false;
        scroll();
        return;
      }

      let li = 0;
      function nextLine() {
        if (li >= item.lines.length) { busy = false; return; }
        const d = document.createElement('div');
        d.style.opacity = '0';
        d.style.transform = 'translateY(6px)';
        d.style.transition = 'opacity .3s ease, transform .3s ease';
        d.innerHTML = item.lines[li];
        bot.appendChild(d);
        requestAnimationFrame(function () {
          d.style.opacity = '1';
          d.style.transform = 'translateY(0)';
        });
        scroll();
        li += 1;
        setTimeout(nextLine, 230);
      }
      nextLine();
    }

    // Conversación de bienvenida (ya resuelta) para que no arranque vacío
    addUser(CHAT_DATA[0].q);
    const welcome = document.createElement('div');
    welcome.className = 'ai-message bot-message';
    welcome.innerHTML = '<strong>' + CHAT_DATA[0].title + '</strong><br>' +
      CHAT_DATA[0].lines.map(function (l) { return '<div>' + l + '</div>'; }).join('');
    convo.appendChild(welcome);
    if (CHAT_DATA[0]._chip) { CHAT_DATA[0]._chip.classList.add('is-active'); activeChip = CHAT_DATA[0]._chip; }
  }

  /* ============================================================
     5. TOOLTIP DEL MAPA DE CALOR
     ============================================================ */
  function setupHeatmap() {
    const grid = document.querySelector('.heatmap-grid');
    if (!grid || isTouch) return;

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hours = ['9 am', '11 am', '1 pm', '3 pm'];
    const cells = grid.querySelectorAll('span');

    const tip = document.createElement('div');
    tip.className = 'heat-tooltip';
    document.body.appendChild(tip);

    cells.forEach(function (cell, idx) {
      const day = days[idx % 7];
      const hour = hours[Math.floor(idx / 7) % hours.length];
      const lvl = (cell.className.match(/level-(\d)/) || [])[1] || '1';
      const ventas = { '1': '1–2', '2': '3–5', '3': '6–9', '4': '10–14', '5': '15+' }[lvl];
      cell.addEventListener('mousemove', function (e) {
        tip.innerHTML = '<strong>' + day + ' · ' + hour + '</strong> — ' + ventas + ' ventas';
        tip.style.left = e.clientX + 'px';
        tip.style.top = e.clientY + 'px';
        tip.classList.add('is-on');
      });
      cell.addEventListener('mouseleave', function () {
        tip.classList.remove('is-on');
      });
    });
  }

  /* ============================================================
     6. CONTADORES ANIMADOS AL ENTRAR EN PANTALLA
     ============================================================ */
  function setupCounters() {
    const targets = document.querySelectorAll('[data-count]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach(function (el) {
        el.textContent = el.getAttribute('data-prefix') || '' +
          Number(el.getAttribute('data-count')).toLocaleString('es-CO');
      });
      return;
    }

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const to = Number(el.getAttribute('data-count'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        countUp(el, 0, to, 1200, function (v) {
          return prefix + Math.round(v).toLocaleString('es-CO') + suffix;
        });
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });

    targets.forEach(function (el) { obs.observe(el); });
  }

  /* ============================================================
     7. REVELADO EN CASCADA DE LISTAS Y CHIPS
     ============================================================ */
  function setupStagger() {
    if (!('IntersectionObserver' in window)) return;

    const groups = document.querySelectorAll(
      '.loyalty-list, .diagnostic-list, .supplier-list, .rhythm-features, .intelligence-grid, .hero-offer-grid, .cube-tags, .smart-tags, .hybrid-panel, .tier-grid, .forecast-suppliers'
    );

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const kids = entry.target.children;
        for (let k = 0; k < kids.length; k += 1) {
          const child = kids[k];
          child.classList.add('is-in');
          child.style.transitionDelay = reduceMotion ? '0ms' : (k * 55) + 'ms';
        }
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    groups.forEach(function (g) {
      if (reduceMotion) return;
      for (let k = 0; k < g.children.length; k += 1) {
        g.children[k].classList.add('stagger-item');
      }
      obs.observe(g);
    });
  }

  /* ---------- arranque ---------- */
  function init() {
    setupScrollProgress();
    setupSectionRail();
    setupLiveTerminal();
    setupInteractiveChat();
    setupHeatmap();
    setupCounters();
    setupStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
