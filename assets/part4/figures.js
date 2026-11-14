// Figures for Superhuman League of Legends AI (Part 4 - Brokenwings: 5v5).
//
// Every number here is one reported in the post; the charts only re-present
// them. Each <div class="viz" data-viz="..."> in the post is rendered by the
// matching entry in FIGS (the replay viewers and the Elo ladder have their own
// scripts). Plain SVG, no dependencies.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    blue: '#2a78d6', orange: '#eb6834', gray: '#a8a69e',
    blue250: '#86b6ef', blue150: '#b7d3f6', neutral: '#dcdad4', purple: '#8a3ffc',
    strong: 'rgba(0, 0, 0, 0.85)', faint: 'rgba(0, 0, 0, 0.4)'
  };

  // --------------------------------------------------------------- helpers

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, parent, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, cls, anchor, style) {
    var t = el('text', { x: x, y: y, class: cls, 'text-anchor': anchor || 'start', style: style }, parent);
    t.textContent = s;
    return t;
  }
  function halo(t) {
    t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#fff');
    t.setAttribute('stroke-width', '3.5'); t.setAttribute('stroke-linejoin', 'round');
    return t;
  }
  function linear(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function logScale(d0, d1, r0, r1) {
    var a = Math.log10(d0), b = Math.log10(d1);
    return function (v) { return r0 + (Math.log10(v) - a) / (b - a) * (r1 - r0); };
  }
  function width(node) { return Math.max(node.clientWidth || 700, 260); }
  function swatch(color, hollow) {
    return '<span class="viz-dot-swatch' + (hollow ? ' hollow' : '') + '" style="--c:' + color + '"></span>';
  }
  function legend(parent, items) {
    var lg = h('div', 'viz-legend', parent);
    items.forEach(function (it) {
      h('span', 'viz-legend-item', lg).innerHTML = (it.line ? '<span class="viz-swatch' + (it.dashed ? ' dashed' : '') + '" style="--c:' + it.color + '"></span>' : swatch(it.color, it.hollow)) + it.label;
    });
    return lg;
  }
  function tooltip(fig) {
    var tip = h('div', 'viz-tip', fig);
    return {
      show: function (html, evt) {
        var r = fig.getBoundingClientRect(), x = evt.clientX - r.left, y = evt.clientY - r.top;
        tip.innerHTML = html;
        tip.style.display = 'block';
        var fw = fig.clientWidth, tw = tip.offsetWidth;
        var left = x + 14 + tw > fw ? Math.max(x - tw - 14, 0) : x + 14;
        tip.style.left = left + 'px';
        tip.style.top = Math.max(y - tip.offsetHeight - 10, 0) + 'px';
      },
      hide: function () { tip.style.display = 'none'; }
    };
  }
  function dataTable(parent, head, rows) {
    var d = h('details', 'viz-data', parent);
    h('summary', null, d, 'Show data');
    var t = h('table', null, d);
    var tr = h('tr', null, h('thead', null, t));
    head.forEach(function (c) { h('th', null, tr, c); });
    var tb = h('tbody', null, t);
    rows.forEach(function (r) { var row = h('tr', null, tb); r.forEach(function (c) { h('td', null, row, c); }); });
  }
  function hover(node, show, hide) { node.addEventListener('pointermove', show); node.addEventListener('pointerleave', hide); }

  // ------------------------------------------------------------ dot rows
  // A row-per-item chart on one shared axis (as in Part 3): dots, intervals
  // and optional connectors.
  //   cfg.axis {min, max, log, ticks, fmt}; cfg.rows [{label, header?, marks, connect, note}]; cfg.refs [{v, label}]
  function dotRows(fig, cfg) {
    var tip = tooltip(fig);
    if (cfg.legend) legend(fig, cfg.legend);
    var host = h('div', null, fig);
    function draw() {
      host.innerHTML = '';
      var W = width(fig), narrow = W < 560;
      var labelW = narrow ? 10 : (cfg.labelW || 200);
      var right = narrow ? (cfg.noteWNarrow || cfg.noteW || 16) : (cfg.noteW || 16);
      var rowH = narrow ? 42 : (cfg.rowH || 30), headH = 26, top = 22, bottom = 24;
      var H = top + bottom;
      cfg.rows.forEach(function (r) { H += r.header ? headH : rowH; });
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': cfg.aria }, host);
      var x0 = labelW, x1 = W - right;
      var x = cfg.axis.log ? logScale(cfg.axis.min, cfg.axis.max, x0, x1) : linear(cfg.axis.min, cfg.axis.max, x0, x1);
      cfg.axis.ticks.forEach(function (v) {
        el('line', { x1: x(v), x2: x(v), y1: top - 6, y2: H - bottom, class: 'viz-grid' }, svg);
        txt(svg, x(v), H - bottom + 15, cfg.axis.fmt(v), 'viz-tick', 'middle');
      });
      (cfg.refs || []).forEach(function (r) {
        el('line', { x1: x(r.v), x2: x(r.v), y1: top - 10, y2: H - bottom, class: 'viz-ref' }, svg);
        if (r.label) txt(svg, x(r.v) + (r.end ? -4 : 4), top - 4, r.label, 'viz-ref-label', r.end ? 'end' : 'start');
      });
      var y = top;
      cfg.rows.forEach(function (r) {
        if (r.header) { txt(svg, 0, y + 17, r.header, 'viz-row-header'); y += headH; return; }
        var cy = narrow ? y + 28 : y + rowH / 2;
        if (narrow) txt(svg, 0, y + 13, r.label, 'viz-label');
        else txt(svg, labelW - 12, cy + 4, r.label, 'viz-label', 'end');
        if (r.connect && r.marks.length > 1) {
          var vs = r.marks.map(function (m) { return m.v; });
          el('line', { x1: x(Math.min.apply(null, vs)), x2: x(Math.max.apply(null, vs)), y1: cy, y2: cy, class: 'viz-connector' }, svg);
        }
        r.marks.forEach(function (m) {
          if (m.lo != null) {
            el('line', { x1: x(m.lo), x2: x(m.hi), y1: cy, y2: cy, stroke: m.color, class: 'viz-interval' }, svg);
            [m.lo, m.hi].forEach(function (e) { el('line', { x1: x(e), x2: x(e), y1: cy - 4, y2: cy + 4, stroke: m.color, class: 'viz-cap' }, svg); });
          }
          if (m.v == null) return;
          var dot = el('circle', { cx: x(m.v), cy: cy, r: 5, fill: m.hollow ? '#fff' : m.color, stroke: m.hollow ? m.color : '#fff', 'stroke-width': 2 }, svg);
          var hit = el('circle', { cx: x(m.v), cy: cy, r: 12, fill: 'transparent' }, svg);
          hover(hit, function (e) { dot.setAttribute('r', 6.5); tip.show('<b>' + r.label + '</b><br>' + m.tip, e); },
            function () { dot.setAttribute('r', 5); tip.hide(); });
        });
        var note = narrow && r.noteNarrow ? r.noteNarrow : r.note;
        if (note) txt(svg, x1 + 10, cy + 4, note, 'viz-note');
        y += rowH;
      });
    }
    draw();
    if (cfg.table) dataTable(fig, cfg.table.head, cfg.table.rows);
    return draw;
  }

  // ------------------------------------------------------- stacked bars
  // One or more 100% bars made of labelled segments.
  //   cfg.bars [{title, sub, parts: [{k, v, color, dark, tip}]}]
  function stackBars(fig, cfg) {
    var tip = tooltip(fig);
    if (cfg.legend) legend(fig, cfg.legend);
    var host = h('div', 'viz-stack', fig);
    host.style.gap = '18px';
    function draw() {
      host.innerHTML = '';
      var W = width(fig);
      cfg.bars.forEach(function (b) {
        var cell = h('div', null, host);
        if (b.title) h('div', 'viz-cell-title', cell, b.title).insertAdjacentHTML('beforeend', b.sub ? ' <span>' + b.sub + '</span>' : '');
        var bh = 30, H = bh + (b.callout ? 38 : 2);
        var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': b.title }, cell);
        var total = b.parts.reduce(function (s, p) { return s + p.v; }, 0);
        var x = linear(0, total, 0, W), at = 0;
        b.parts.forEach(function (p, i) {
          var x0 = x(at) + (i ? 1 : 0), x1 = Math.max(x0 + 2, x(at + p.v) - (i < b.parts.length - 1 ? 1 : 0)), w = x1 - x0;
          var r = el('rect', { x: x0, y: 1, width: w, height: bh, rx: 3, fill: p.color, class: 'viz-seg' }, svg);
          var lab = p.label != null ? p.label : p.k + ' ' + p.v + '%';
          if (w > lab.length * 6.6 + 12) txt(svg, x0 + 8, 1 + bh / 2 + 4, lab, p.dark ? 'viz-seg-label on-dark' : 'viz-seg-label');
          else if (w > String(p.v).length * 7 + 14) txt(svg, x0 + w / 2, 1 + bh / 2 + 4, p.v + '%', p.dark ? 'viz-seg-label on-dark' : 'viz-seg-label', 'middle');
          if (p === b.callout) {
            var ctext = W < 560 && b.calloutShort ? b.calloutShort : b.calloutText;
            var cx = Math.min(x0 + w / 2, W - 3), right = cx > W * 0.6;
            el('path', { d: 'M' + cx + ',' + (bh + 3) + ' L' + cx + ',' + (bh + 16), stroke: C.strong, 'stroke-width': 1, fill: 'none' }, svg);
            halo(txt(svg, right ? cx + 4 : cx - 4, bh + 30, ctext, 'viz-label', right ? 'end' : 'start', 'font-weight:600;fill:' + C.strong));
          }
          hover(r, function (e) { tip.show('<b>' + p.k + '</b><br>' + (p.tip || p.v + '%'), e); }, tip.hide);
          at += p.v;
        });
      });
    }
    draw();
    if (cfg.table) dataTable(fig, cfg.table.head, cfg.table.rows);
    return draw;
  }

  var FIGS = {};

  // ------------------------------------------------------------ Phase 1

  // Game-years of experience per day, log scale, every way we ran the game.
  FIGS['throughput-5v5'] = function (fig) {
    var rows = [
      ['Real time', 'one game at 30 Hz', 0.003, '75 agent-steps/s', C.gray],
      ['C# server, 1 game', 'step mode', 0.07, '1.8k agent-steps/s', C.orange],
      ['C# server, 64 games', 'step mode', 1.7, '47k agent-steps/s', C.orange],
      ['Numba, 4,096 games', '64 threads', 29, '783k agent-steps/s', C.blue250],
      ['Rust, 2,048 games', '60 threads', 51, '1.4M agent-steps/s', C.blue]
    ];
    function fmt(v) { return v < 0.01 ? v.toFixed(3) : v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : String(Math.round(v)); }
    return dotRows(fig, {
      aria: 'Game-years simulated per day for each way of running the game, log scale',
      labelW: 150, noteW: 50,
      axis: { min: 0.001, max: 400, log: true, ticks: [0.001, 0.01, 0.1, 1, 10, 100], fmt: function (v) { return v >= 1 ? String(v) : String(v); } },
      refs: [{ v: 180, label: 'OpenAI Five, 2018', end: true }],
      rows: rows.map(function (r) {
        return { label: r[0], marks: [{ v: r[2], color: r[4], tip: swatch(r[4]) + r[1] + '<br><b>' + fmt(r[2]) + '</b> game-years a day · ' + r[3] }], note: fmt(r[2]) };
      }),
      table: { head: ['Setup', 'Ticks/s', 'Decisions/s', 'Agent-steps/s', 'Game-years per day'], rows: [
        ['Real time, 30 Hz, one game', '30', '7.5', '75', '0.003'],
        ['C# server, step mode, one game', '735', '184', '1.8k', '0.07'],
        ['C# server, step mode, 64 games', '18.8k', '4.7k', '47k', '1.7'],
        ['Numba simulator (64 threads), 4,096 games', '313k', '78k', '783k', '29'],
        ['Rust engine (60 threads), 2,048 games', '560k', '140k', '1.4M', '51']] }
    });
  };

  // Where the Numba engine's time went.
  FIGS['numba-profile'] = function (fig) {
    var rc = { k: 'Numba reference counting', v: 58.7, color: C.orange, dark: true, label: 'Reference counting 58.7%' };
    return stackBars(fig, {
      bars: [
        { title: 'The environment step', sub: 'share of time', parts: [
          { k: 'Engine', v: 94.8, color: C.blue, dark: true, label: 'Engine 94.8%' },
          { k: 'Building observations', v: 4.8, color: C.blue250 },
          { k: 'Decoding actions', v: 0.4, color: C.blue150 },
          { k: 'Python glue', v: 0.15, color: C.neutral }] },
        { title: 'Inside the engine', sub: 'share of engine time', callout: rc, calloutText: 'counting references to arrays that are never freed', calloutShort: 'arrays that are never freed', parts: [
          rc,
          { k: 'Vision (turret bubbles the largest part)', v: 12.6, color: C.blue, dark: true, label: 'Vision 12.6%' },
          { k: 'Collision and movement', v: 7.8, color: C.blue250 },
          { k: 'Pathfinding', v: 3.3, color: C.blue150 },
          { k: 'Spell scripts and buffs', v: 3.1, color: C.blue150 },
          { k: 'Minion AI', v: 2.6, color: C.blue150 },
          { k: 'Everything else', v: 11.9, color: C.neutral, label: 'Other 11.9%' }] }
      ],
      table: { head: ['Level', 'Component', 'Share'], rows: [
        ['Environment', 'Engine', '94.8%'], ['', 'Building observations', '4.8%'], ['', 'Decoding actions', '0.4%'], ['', 'Python glue', '0.15%'],
        ['Inside the engine', 'Numba reference counting', '58.7%'], ['', 'Vision (turret bubbles the largest part)', '12.6%'], ['', 'Collision and movement', '7.8%'],
        ['', 'Pathfinding', '3.3%'], ['', 'Spell scripts and buffs', '3.1%'], ['', 'Minion AI', '2.6%']] }
    });
  };

  // ------------------------------------------------------------ Phase 2

  // What the return was made of when 98% of games hit the cap.
  FIGS['reward-audit'] = function (fig) {
    var win = { k: 'Winning', v: 0.5, color: C.orange, tip: '0.5% of the return' };
    return stackBars(fig, {
      bars: [{ title: 'Share of the return', sub: '12-minute cap, 98% of games capped', callout: win, calloutText: 'winning: 0.5%', parts: [
        { k: 'Economy (gold, XP, last hits)', v: 43, color: C.blue, dark: true, label: 'Economy 43%' },
        { k: 'Structures', v: 32, color: C.blue250, label: 'Structures 32%' },
        { k: 'Fights', v: 12, color: C.blue150, label: 'Fights 12%' },
        { k: 'Health and mana shaping', v: 12, color: C.neutral, label: 'HP/mana 12%' },
        win] }],
      table: { head: ['Share of the return', ''], rows: [['Economy (gold, XP, last hits)', '43%'], ['Structures', '32%'], ['Fights', '12%'], ['Health and mana shaping', '12%'], ['Winning', '0.5%']] }
    });
  };

  // Per-hero farming, early vs late checkpoint, one small panel per measure.
  FIGS['farm-shift'] = function (fig) {
    var M = [
      { k: 'Lane minion last hits', a: 26, b: 49, f: String },
      { k: 'Jungle monster kills', a: 0.4, b: 10, f: String },
      { k: 'Deaths', a: 1.6, b: 1.3, f: String },
      { k: 'Net worth at game end', a: 6000, b: 12000, f: function (v) { return v / 1000 + 'k'; } }
    ];
    legend(fig, [{ label: 'rollout 2,400', color: C.gray }, { label: 'rollout 49,200', color: C.blue }]);
    var grid = h('div', 'p4-mini', fig);
    M.forEach(function (m) {
      var cell = h('div', 'p4-mini-cell', grid), max = Math.max(m.a, m.b);
      h('div', 'viz-cell-title', cell, m.k).insertAdjacentHTML('beforeend', ' <span>per hero, per 10 min</span>');
      [[m.a, C.gray], [m.b, C.blue]].forEach(function (p) {
        var row = h('div', 'p4-mini-row', cell), tr = h('div', 'p4-mini-track', row), bar = h('div', 'p4-mini-bar', tr);
        bar.style.width = Math.max(1.5, p[0] / max * 100) + '%'; bar.style.background = p[1];
        h('span', 'p4-mini-val', row, m.f(p[0]));
      });
      var ratio = m.b / m.a;
      h('div', 'p4-mini-delta', cell, ratio >= 1 ? '×' + (ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1).replace(/\.0$/, '')) : '−' + Math.round((1 - ratio) * 100) + '%');
    });
    dataTable(fig, ['Per hero, per 10 minutes', 'Rollout 2,400', 'Rollout 49,200'], M.map(function (m) { return [m.k, m.f(m.a), m.f(m.b)]; }));
    return function () {};
  };

  // ------------------------------------------------------------ Phase 3

  // What a win N minutes away is worth now, for four discount horizons.
  // Decisions run at 7.5 Hz; the horizon in seconds is 1 / (1 - gamma) / 7.5.
  FIGS.horizon = function (fig) {
    var HZ = 7.5, WIN = 10;
    var S = [
      { s: 26.7, label: '27 s', who: 'ours, first full games (γ 0.995)', color: C.gray, g: 0.995 },
      { s: 66.7, label: '67 s', who: 'ours, from rollout 7,350 (γ 0.998)', color: C.blue, g: 0.998 },
      { s: 180, label: '180 s', who: 'OpenAI Five, early', color: C.orange },
      { s: 360, label: '360 s', who: 'OpenAI Five, late', color: C.purple }
    ];
    S.forEach(function (o) { if (!o.g) o.g = 1 - 1 / (o.s * HZ); });
    function val(o, min) { return Math.pow(o.g, min * 60 * HZ); }
    var tip = tooltip(fig);
    legend(fig, S.map(function (o) { return { label: o.label + ' · ' + o.who, color: o.color, line: true }; }));
    var ctl = h('div', 'p4-slider', fig);
    var lab = h('label', null, ctl, 'Win this far away: ');
    var out = h('b', null, lab, '');
    var inp = h('input', null, ctl); inp.type = 'range'; inp.min = 0; inp.max = 10; inp.step = 0.25; inp.value = 5;
    inp.setAttribute('aria-label', 'Minutes until the win');
    var read = h('div', 'p4-readout', fig);
    var host = h('div', null, fig);
    h('div', 'viz-axis-label', fig, 'Minutes until the win (game time). The y-axis is what a win worth ' + WIN + ' is worth to the agent now.');
    var cur = 5;
    function draw() {
      host.innerHTML = '';
      var W = width(fig), narrow = W < 560, H = narrow ? 220 : 250, m = { l: 34, r: 12, t: 12, b: 24 };
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': 'Discounted value of a win against how far away it is, for four horizons' }, host);
      var x = linear(0, 10, m.l, W - m.r), y = linear(0, WIN, H - m.b, m.t);
      [0, 2.5, 5, 7.5, 10].forEach(function (v) {
        el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v ? 'viz-grid' : 'viz-axis' }, svg);
        txt(svg, m.l - 6, y(v) + 3.5, String(v), 'viz-tick', 'end');
      });
      for (var t = 0; t <= 10; t += narrow ? 2 : 1) txt(svg, x(t), H - m.b + 15, t + (t ? ' min' : ''), 'viz-tick', 'middle');
      S.forEach(function (o) {
        var d = '';
        for (var i = 0; i <= 200; i++) { var mn = i / 20; d += (i ? 'L' : 'M') + x(mn).toFixed(1) + ',' + y(WIN * val(o, mn)).toFixed(1); }
        el('path', { d: d, class: 'viz-line', stroke: o.color }, svg);
      });
      el('line', { x1: x(cur), x2: x(cur), y1: m.t, y2: H - m.b, class: 'viz-cross' }, svg);
      S.forEach(function (o) {
        var v = WIN * val(o, cur);
        el('circle', { cx: x(cur), cy: y(v), r: 4.5, fill: o.color, stroke: '#fff', 'stroke-width': 2 }, svg);
      });
      var hit = el('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent', style: 'cursor:ew-resize' }, svg);
      function at(e) { var r = svg.getBoundingClientRect(); return Math.max(0, Math.min(10, Math.round(((e.clientX - r.left) * (W / r.width) - m.l) / (W - m.l - m.r) * 40) / 4)); }
      hit.addEventListener('pointerdown', function (e) { set(at(e)); });
      hit.addEventListener('pointermove', function (e) { if (e.buttons) set(at(e)); });
    }
    function set(v) {
      cur = v; inp.value = v;
      out.textContent = v === 0 ? 'now' : (v % 1 ? Math.floor(v) + ' min ' + (v % 1) * 60 + ' s' : v + ' min');
      read.innerHTML = S.map(function (o) {
        var p = val(o, v), w = WIN * p;
        return '<span style="--c:' + o.color + '"><i></i>' + o.label + '<b>' + (w >= 0.995 ? w.toFixed(1) : w >= 0.01 ? w.toFixed(2) : '<0.01') + '</b><small>' + (p >= 0.0995 ? Math.round(p * 100) + '%' : p >= 0.001 ? (p * 100).toFixed(1) + '%' : p >= 0.0001 ? (p * 100).toFixed(2) + '%' : 'under 0.01%') + ' of its value</small></span>';
      }).join('');
      draw();
    }
    inp.addEventListener('input', function () { set(+inp.value); });
    set(5);
    dataTable(fig, ['Horizon', 'γ at 7.5 Hz', 'Win (10) at 1 min', '2 min', '5 min', '10 min'], S.map(function (o) {
      return [o.label + ' (' + o.who + ')', o.g.toFixed(5).replace(/0+$/, ''), (WIN * val(o, 1)).toFixed(2), (WIN * val(o, 2)).toFixed(2), (WIN * val(o, 5)).toFixed(2), (WIN * val(o, 10)).toFixed(3)];
    }));
    return draw;
  };

  // The payoff: every pairing against the game's scripted bots.
  FIGS['vs-bots'] = function (fig) {
    var R = [
      ['Does nothing', 0, 64, 26, C.gray, true],
      ['Random actions', 0, 64, 26, C.gray, true],
      ['Rollout 600', 0, 128, 29, C.blue],
      ['Rollout 1,350', 103, 25, 33, C.blue],
      ['Rollout 2,400', 128, 0, 23, C.blue],
      ['Rollout 46,575', 64, 0, 18, C.blue]
    ];
    return dotRows(fig, {
      aria: 'Win rate against the scripted bots on the real server, by entrant',
      labelW: 140, noteW: 150, noteWNarrow: 56,
      legend: [{ label: 'checkpoint', color: C.blue }, { label: 'floor policy', color: C.gray, hollow: true }],
      axis: { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: function (v) { return Math.round(v * 100) + '%'; } },
      refs: [{ v: 0.5, label: '' }],
      rows: R.map(function (r) {
        var g = r[1] + r[2], p = r[1] / g;
        return { label: r[0], note: r[1] + '–' + r[2] + ' · median ' + r[3] + ' min', noteNarrow: r[1] + '–' + r[2],
          marks: [{ v: p, color: r[4], hollow: r[5], tip: swatch(r[4], r[5]) + 'won <b>' + r[1] + '</b>, lost ' + r[2] + ' (' + Math.round(p * 100) + '%) · median game ' + r[3] + ' min' }] };
      }),
      table: { head: ['Against the bots', 'Result', 'Median game'], rows: R.map(function (r) { return [r[0], r[1] + '–' + r[2], r[3] + ' min']; }) }
    });
  };

  // ------------------------------------------------------------ appendix

  // The move grid and the spell-aiming bins, drawn to scale.
  FIGS['action-space'] = function (fig) {
    var host = h('div', null, fig);
    function draw() {
      host.innerHTML = '';
      var W = width(fig), narrow = W < 560, PH = 280;
      var cw = narrow ? W : (W - 28) / 2, H = narrow ? 2 * PH + 16 : PH;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': 'Move offsets and spell aiming bins' }, host);
      // move grid: 9 x 9 offsets, -400..400 in steps of 100
      var g1 = el('g', {}, svg), cx = cw / 2, st = Math.min(23, (cw - 40) / 9), cy = 36 + 4.5 * st;
      txt(g1, cx, 14, 'Move: 9 × 9 offsets', 'viz-label', 'middle', 'font-weight:600');
      el('rect', { x: cx - 4.5 * st, y: cy - 4.5 * st, width: 9 * st, height: 9 * st, fill: 'none', stroke: 'rgba(0,0,0,0.12)', rx: 3 }, g1);
      for (var i = -4; i <= 4; i++) for (var j = -4; j <= 4; j++) {
        if (!i && !j) continue;
        el('circle', { cx: cx + i * st, cy: cy + j * st, r: 3, fill: C.blue, opacity: 0.5 }, g1);
      }
      el('circle', { cx: cx, cy: cy, r: 8, fill: C.blue, stroke: '#fff', 'stroke-width': 2 }, g1);
      txt(g1, cx, cy + 4.5 * st + 18, 'hero in the centre; ±400 units, 100 apart; (0, 0) = stop', 'viz-tick', 'middle');
      // aiming fan, sized so ±35° fits the panel
      var ox = narrow ? 0 : cw + 28, oy = narrow ? PH + 16 : 0, g2 = el('g', { transform: 'translate(' + ox + ',' + oy + ')' }, svg);
      txt(g2, cw / 2, 14, 'Aim: angle off the line to the target', 'viz-label', 'middle', 'font-weight:600');
      var hx = 30, hy = 130, L = Math.min(cw - 90, 160), tx = hx + L;
      [35, 20, 12, 6, 0, -6, -12, -20, -35].forEach(function (d) {
        var a = d * Math.PI / 180, x2 = hx + Math.cos(a) * L * 0.96, y2 = hy - Math.sin(a) * L * 0.96;
        el('line', { x1: hx, y1: hy, x2: x2, y2: y2, stroke: d ? C.blue250 : C.blue, 'stroke-width': d ? 1.4 : 2, 'stroke-dasharray': d ? null : '5 3' }, g2);
        if (d > 0) txt(g2, x2 + 5, y2 + 3, '±' + d + '°', 'viz-tick', 'start');
      });
      el('circle', { cx: hx, cy: hy, r: 8, fill: C.blue, stroke: '#fff', 'stroke-width': 2 }, g2);
      txt(g2, hx, hy + 24, 'caster', 'viz-note', 'middle');
      el('circle', { cx: tx, cy: hy, r: 8, fill: C.orange, stroke: '#fff', 'stroke-width': 2 }, g2);
      txt(g2, tx + 13, hy + 4, 'target', 'viz-note', 'start');
      txt(g2, tx + 13, hy + 18, 'Q, W, R: 9 bins', 'viz-tick', 'start');
      // E: eight compass directions relative to the target line
      var ex = hx + 6, ey = 252, er = 13;
      for (var k = 0; k < 8; k++) {
        var b = k * Math.PI / 4;
        el('line', { x1: ex, y1: ey, x2: ex + Math.cos(b) * er, y2: ey - Math.sin(b) * er, stroke: C.purple, 'stroke-width': 1.5 }, g2);
      }
      txt(g2, ex + er + 8, ey + 4, 'E (usually a dash): 8 directions relative to the target', 'viz-note', 'start');
    }
    draw();
    return draw;
  };

  // ------------------------------------------------------------------ boot
  // Only this file's figures; nodes already rendered are skipped.
  function boot() {
    var redraws = [];
    document.querySelectorAll('.viz[data-viz]').forEach(function (n) {
      var f = FIGS[n.getAttribute('data-viz')];
      if (f && !n.classList.contains('ready')) { n.classList.add('ready'); redraws.push(f(n)); }
    });
    if (!redraws.length) return;
    var lastW = window.innerWidth, timer;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(function () { redraws.forEach(function (d) { d(); }); }, 150);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
