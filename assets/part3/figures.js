// Figures for Superhuman League of Legends AI (Part 3 - Patch 26.19: 1v1).
//
// Every number here is the one reported in the post's text and tables; the
// charts only re-present them. Each <div class="viz" data-viz="..."> in the
// post is rendered by the matching entry in FIGS. Plain SVG, no dependencies.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    blue: '#2a78d6', orange: '#eb6834', gray: '#a8a69e',
    blue250: '#86b6ef', blue150: '#b7d3f6', neutral: '#dcdad4'
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
  function txt(parent, x, y, s, cls, anchor) {
    var t = el('text', { x: x, y: y, class: cls, 'text-anchor': anchor || 'start' }, parent);
    t.textContent = s;
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
      h('span', 'viz-legend-item', lg).innerHTML = (it.line ? '<span class="viz-swatch" style="--c:' + it.color + '"></span>' : swatch(it.color, it.hollow)) + it.label;
    });
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
  function pct(v) { return (Math.round(v * 10) / 10) + '%'; }
  function si(v) { return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 2).replace(/\.?0+$/, '') + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(v); }

  // ------------------------------------------------------------ dot rows
  // A row-per-item chart on one shared axis: dots, intervals (lo..hi) and
  // optional dumbbell connectors. Covers dot plots, before/after
  // comparisons and confidence intervals.
  //   cfg.axis   {min, max, log, ticks, fmt}
  //   cfg.rows   [{label, header?, marks: [{v, lo, hi, color, hollow, tip}], connect, note}]
  //   cfg.refs   [{v, label}]
  function dotRows(fig, cfg) {
    var tip = tooltip(fig);
    if (cfg.legend) legend(fig, cfg.legend);
    var host = h('div', null, fig);
    function draw() {
      host.innerHTML = '';
      var W = width(fig), narrow = W < 560;
      // on phones each label sits above its row instead of beside it
      var labelW = narrow ? 10 : (cfg.labelW || 200);
      var right = cfg.noteW || 16;
      var rowH = narrow ? 42 : (cfg.rowH || 30), headH = 26, top = 18, bottom = 24;
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
        txt(svg, x(r.v) + 4, top - 2, r.label, 'viz-ref-label');
      });
      var y = top;
      cfg.rows.forEach(function (r) {
        if (r.header) {
          txt(svg, 0, y + 17, r.header, 'viz-row-header');
          y += headH;
          return;
        }
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
          var dot = el('circle', { cx: x(m.v), cy: cy, r: 5, fill: m.hollow ? '#fff' : m.color, stroke: m.hollow ? m.color : '#fff', 'stroke-width': 2, class: 'viz-dot' }, svg);
          var hit = el('circle', { cx: x(m.v), cy: cy, r: 12, fill: 'transparent' }, svg);
          hit.addEventListener('pointermove', function (e) { dot.setAttribute('r', 6.5); tip.show('<b>' + r.label + '</b><br>' + m.tip, e); });
          hit.addEventListener('pointerleave', function () { dot.setAttribute('r', 5); tip.hide(); });
        });
        if (r.note) txt(svg, x1 + 10, cy + 4, r.note, 'viz-note');
        y += rowH;
      });
    }
    draw();
    if (cfg.table) dataTable(fig, cfg.table.head, cfg.table.rows);
    return draw;
  }

  // ------------------------------------------------------- line panels
  // Small multiples sharing one x axis; one series per panel.
  function linePanels(fig, cfg) {
    var tip = tooltip(fig);
    var host = h('div', 'viz-panels', fig);
    function draw() {
      host.innerHTML = '';
      var W = width(fig), cols = Math.min(cfg.panels.length, W < 560 ? 2 : cfg.panels.length);
      var pw = (W - (cols - 1) * 18) / cols, ph = cfg.height || 150;
      host.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
      var cross = [];
      cfg.panels.forEach(function (p) {
        var cell = h('div', 'viz-cell', host);
        h('div', 'viz-cell-title', cell, p.title).insertAdjacentHTML('beforeend', p.sub ? ' <span>' + p.sub + '</span>' : '');
        var m = { l: 36, r: 10, t: 10, b: 22 };
        var svg = el('svg', { viewBox: '0 0 ' + pw + ' ' + ph, width: pw, height: ph, class: 'viz-panel', role: 'img', 'aria-label': p.title }, cell);
        var x = cfg.xlog ? logScale(cfg.x[0], cfg.x[1], m.l, pw - m.r) : linear(cfg.x[0], cfg.x[1], m.l, pw - m.r);
        var y = linear(p.y[0], p.y[1], ph - m.b, m.t);
        p.yTicks.forEach(function (v) {
          el('line', { x1: m.l, x2: pw - m.r, y1: y(v), y2: y(v), class: 'viz-grid' }, svg);
          txt(svg, m.l - 6, y(v) + 3.5, p.fmt(v), 'viz-tick', 'end');
        });
        cfg.xTicks.forEach(function (v) { txt(svg, x(v), ph - m.b + 15, cfg.xFmt(v), 'viz-tick', 'middle'); });
        el('line', { x1: m.l, x2: pw - m.r, y1: ph - m.b, y2: ph - m.b, class: 'viz-axis' }, svg);
        var c = el('line', { y1: m.t, y2: ph - m.b, class: 'viz-cross', visibility: 'hidden' }, svg);
        var color = p.color || C.blue;
        el('path', { d: p.points.map(function (q, i) { return (i ? 'L' : 'M') + x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1); }).join(''), class: 'viz-line', stroke: color }, svg);
        var dots = p.points.map(function (q) { return el('circle', { cx: x(q[0]), cy: y(q[1]), r: 3.5, fill: color, stroke: '#fff', 'stroke-width': 1.5 }, svg); });
        cross.push({ line: c, dots: dots, x: x, p: p });
        var hit = el('rect', { x: m.l, y: 0, width: pw - m.l - m.r, height: ph, fill: 'transparent' }, svg);
        hit.addEventListener('pointermove', function (e) {
          var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * (pw / r.width), best = 0, bd = Infinity;
          p.points.forEach(function (q, i) { var d = Math.abs(x(q[0]) - px); if (d < bd) { bd = d; best = i; } });
          cross.forEach(function (k) {
            var px2 = k.x(k.p.points[best][0]);
            k.line.setAttribute('x1', px2); k.line.setAttribute('x2', px2); k.line.setAttribute('visibility', 'visible');
            k.dots.forEach(function (d, j) { d.setAttribute('r', j === best ? 5 : 3.5); });
          });
          tip.show('<b>' + cfg.xLabel(p.points[best][0]) + '</b><table>' + cfg.panels.map(function (k) {
            return '<tr><td>' + k.title + '</td><td><b>' + k.tipFmt(k.points[best][1]) + '</b></td></tr>';
          }).join('') + '</table>', e);
        });
        hit.addEventListener('pointerleave', function () {
          cross.forEach(function (k) { k.line.setAttribute('visibility', 'hidden'); k.dots.forEach(function (d) { d.setAttribute('r', 3.5); }); });
          tip.hide();
        });
        if (p.note) h('div', 'viz-axis-label', cell, p.note);
      });
    }
    draw();
    if (cfg.table) dataTable(fig, cfg.table.head, cfg.table.rows);
    return draw;
  }

  // ------------------------------------------------------------ figures

  var FIGS = {};

  // Keyframes rebuilt from the previous keyframe plus the packets between.
  FIGS.reconstruction = function (fig) {
    var rows = [
      { label: 'Turrets', v: 99.8 },
      { label: 'Minions', v: 97.4 },
      { label: 'Heroes (replicated)', v: 91.9, adj: 99 },
      { label: 'Buffs', v: 92.8 }
    ];
    return dotRows(fig, {
      aria: 'Share of keyframe objects rebuilt bit-exactly, by object class',
      axis: { min: 85, max: 100, ticks: [85, 90, 95, 100], fmt: function (v) { return v + '%'; } },
      legend: [{ label: 'as recorded', color: C.blue }, { label: 'allowing for transmission lag', color: C.blue, hollow: true }],
      rows: rows.map(function (r) {
        var marks = [{ v: r.v, color: C.blue, tip: swatch(C.blue) + 'bit-exact <b>' + pct(r.v) + '</b>' }];
        if (r.adj) marks.push({ v: r.adj, color: C.blue, hollow: true, tip: swatch(C.blue, true) + 'allowing for lag <b>99%+</b>' });
        return { label: r.label, marks: marks, connect: !!r.adj };
      }),
      table: { head: ['Object class', 'Bit-exact'], rows: [['Turrets', '99.8%'], ['Minions', '97.4%'], ['Heroes, replicated block', '91.9% as recorded; 99%+ allowing for transmission lag'], ['Buffs', '92.8%']] }
    });
  };

  // Minion rules: hand-written spec vs fitted, and deterministic vs sampled.
  FIGS['minion-fit'] = function (fig) {
    function range(lo, hi, color, what) {
      return { v: (lo + hi) / 2, lo: lo, hi: hi, color: color, tip: swatch(color) + what + ' <b>' + lo + '–' + hi + '%</b>' };
    }
    function pt(v, color, what) { return { v: v, color: color, tip: swatch(color) + what + ' <b>' + v + '%</b>' }; }
    return dotRows(fig, {
      aria: 'Minion rule accuracy before and after fitting to replays',
      axis: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], fmt: function (v) { return v + '%'; } },
      legend: [{ label: 'hand-written / deterministic', color: C.gray }, { label: 'fitted to replays', color: C.blue }],
      rows: [
        { header: 'Exact per-decision match on held-out replays' },
        { label: 'Target choice', connect: true, marks: [range(58, 61, C.gray, 'hand-written spec'), range(77, 80, C.blue, 'fitted')] },
        { label: 'Caster first hit', connect: true, marks: [range(16, 20, C.gray, 'hand-written spec'), range(61, 67, C.blue, 'fitted')] },
        { label: 'Retarget timing', marks: [range(24, 36, C.blue, 'fitted (still weak)')] },
        { header: 'Real outcome inside the simulator’s range' },
        { label: 'HP', connect: true, marks: [pt(50, C.gray, 'deterministic rule'), pt(67, C.blue, 'sampled distribution')] },
        { label: 'Death time', connect: true, marks: [pt(63, C.gray, 'deterministic rule'), pt(77, C.blue, 'sampled distribution')] },
        { label: 'Killer', connect: true, marks: [pt(74, C.gray, 'deterministic rule'), pt(88, C.blue, 'sampled distribution')] }
      ],
      table: {
        head: ['Measure', 'Before', 'After'],
        rows: [['Target choice (exact)', '58–61%', '77–80%'], ['Caster first hit (exact)', '16–20%', '61–67%'], ['Retarget timing (exact)', '—', '24–36%'],
          ['HP inside sim range', '50%', '67%'], ['Death time inside sim range', '63%', '77%'], ['Killer inside sim range', '74%', '88%']]
      }
    });
  };

  // Census of the 865 core spells in the client's data files.
  FIGS['spell-census'] = function (fig) {
    var parts = [
      { k: 'Formula fully in client data', v: 82, color: C.blue },
      { k: 'Partial', v: 9, color: C.blue250 },
      { k: 'Pure script', v: 9, color: C.neutral }
    ];
    var tip = tooltip(fig);
    legend(fig, parts.map(function (p) { return { label: p.k, color: p.color }; }));
    var host = h('div', null, fig);
    h('div', 'viz-axis-label viz-left', fig, '865 core spells across 173 champions · also 82% weighted by ranked pick rate · 61 champions have all five core spells fully in data');
    function draw() {
      host.innerHTML = '';
      var W = width(fig), H = 30, top = 1, bh = 28;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': 'Share of 865 core spells whose formula is in the client data' }, host);
      var x = linear(0, 100, 0, W), at = 0;
      parts.forEach(function (p, i) {
        var x0 = x(at) + (i ? 1 : 0), x1 = x(at + p.v) - (i < parts.length - 1 ? 1 : 0);
        var r = el('rect', { x: x0, y: top, width: x1 - x0, height: bh, rx: 3, fill: p.color, class: 'viz-seg' }, svg);
        txt(svg, x0 + (i === 0 ? 10 : (x1 - x0) / 2), top + bh / 2 + 4, p.v + '%', i === 0 ? 'viz-seg-label on-dark' : 'viz-seg-label', i === 0 ? 'start' : 'middle');
        r.addEventListener('pointermove', function (e) { tip.show('<b>' + p.k + '</b><br>' + p.v + '% of 865 core spells', e); });
        r.addEventListener('pointerleave', tip.hide);
        at += p.v;
      });
    }
    draw();
    dataTable(fig, ['Category', 'Share of 865 core spells'], parts.map(function (p) { return [p.k, p.v + '%']; }));
    return draw;
  };

  // Training throughput, log scale.
  FIGS.throughput = function (fig) {
    var rows = [
      ['Python engine, original trainer', 10e3],
      ['Python engine, hot-path fixes', 66e3],
      ['numba, GPU-lockstep, 2 PPO epochs', 292e3],
      ['numba, 1 epoch, minibatch 16k', 557e3],
      ['+ GPU rollout, threaded collector, CUDA-graphed actor (A10, with lane)', 437e3],
      ['+ parallel collector, compiled learner/actor, fp16 recurrence (A10)', 662e3],
      ['GH200, old recipe', 1.27e6],
      ['GH200, turret run', 1.65e6, 1.95e6]
    ];
    var short = ['Python, original', 'Python, hot-path fixes', 'numba, 2 epochs', 'numba, 1 epoch, mb 16k', 'A10 + GPU rollout (lane)', 'A10 + parallel, fp16', 'GH200, old recipe', 'GH200, turret run'];
    var cfg = {
      aria: 'Training throughput in samples per second, log scale',
      labelW: 210, noteW: 76,
      axis: { min: 5e3, max: 3e6, log: true, ticks: [1e4, 1e5, 1e6], fmt: function (v) { return si(v) + '/s'; } },
      refs: [{ v: 662e3, label: 'A10 box ceiling' }],
      rows: rows.map(function (r, i) {
        var hw = i >= 6 ? C.orange : C.blue;
        var m = r[2] ? { v: r[1], lo: r[1], hi: r[2], color: hw, tip: swatch(hw) + '<b>' + si(r[1]) + '–' + si(r[2]) + '</b> samples/s' }
                     : { v: r[1], color: hw, tip: swatch(hw) + '<b>' + si(r[1]) + '</b> samples/s' };
        return { label: short[i], marks: [m], note: r[2] ? '1.65–1.95M' : si(r[1]) };
      }),
      legend: [{ label: 'A10 / development box', color: C.blue }, { label: 'one GH200', color: C.orange }],
      table: { head: ['Setup', 'Samples/s'], rows: rows.map(function (r) { return [r[0], r[2] ? si(r[1]) + '–' + si(r[2]) : si(r[1])]; }) }
    };
    return dotRows(fig, cfg);
  };

  // League: Elo gained per four-hour block.
  FIGS['league-elo'] = function (fig) {
    var gains = [100, 40, 40, 28], cum = [[0, 0]], s = 0;
    gains.forEach(function (g, i) { s += g; cum.push([(i + 1) * 4, s]); });
    return linePanels(fig, {
      x: [0, 16], xTicks: [0, 4, 8, 12, 16], xFmt: function (v) { return v + 'h'; }, xLabel: function (v) { return 'after ' + v + ' h'; },
      height: 170,
      panels: [{ title: 'Cumulative Elo gain of the main agent', y: [0, 240], yTicks: [0, 100, 200], fmt: function (v) { return v ? '+' + v : '0'; },
        points: cum, tipFmt: function (v) { return '+' + v + ' Elo'; } }],
      table: { head: ['Block', 'Elo gained', 'Cumulative'], rows: gains.map(function (g, i) { return [(i * 4) + '–' + ((i + 1) * 4) + ' h', '+' + g, '+' + cum[i + 1][1]]; }) }
    });
  };

  // Gradient noise scale vs batch sizes.
  FIGS['noise-scale'] = function (fig) {
    return dotRows(fig, {
      aria: 'Policy-gradient noise scale compared with the training minibatch, log scale',
      labelW: 220, noteW: 64,
      axis: { min: 5e3, max: 5e6, log: true, ticks: [1e4, 1e5, 1e6], fmt: function (v) { return si(v); } },
      rows: [
        { label: 'PPO minibatch used', marks: [{ v: 16e3, color: C.gray, tip: swatch(C.gray) + '<b>16k</b> samples' }], note: '16k' },
        { label: 'Brokenwings LSTM noise scale', marks: [{ v: 17e3, color: C.gray, hollow: true, tip: swatch(C.gray, true) + '<b>~17k</b> samples (Part 2)' }], note: '~17k' },
        { label: 'Lane, after 30 min of training', marks: [{ v: 1.5e6, color: C.blue, hollow: true, tip: swatch(C.blue, true) + '<b>1.5M</b> samples' }], note: '1.5M' },
        { label: 'Lane checkpoints (six)', marks: [{ v: 2.25e6, lo: 1.1e6, hi: 3.4e6, color: C.blue, tip: swatch(C.blue) + '<b>1.1–3.4M</b> samples' }], note: '1.1–3.4M' }
      ],
      table: { head: ['Quantity', 'Samples'], rows: [['PPO minibatch', '16k'], ['Brokenwings LSTM noise scale (Part 2)', '~17k'], ['Lane noise scale after 30 min', '1.5M'], ['Lane checkpoints noise scale', '1.1–3.4M']] }
    });
  };

  // Behavioural cloning: offline metrics improve, duelling gets worse.
  FIGS['bc-scaling'] = function (fig) {
    var g = [900, 2000, 4000, 8000, 15881];
    var val = [5.352, 4.999, 4.811, 4.705, 4.675], f1 = [.248, .274, .284, .290, .292], aim = [9.66, 7.89, 7.19, 6.75, 6.6], wins = [12, 9, 7, 6, 7];
    function zip(a) { return g.map(function (x, i) { return [x, a[i]]; }); }
    return linePanels(fig, {
      x: [800, 18000], xlog: true, xTicks: [1000, 4000, 15881], xFmt: function (v) { return v === 15881 ? '15.9k' : si(v); },
      xLabel: function (v) { return v.toLocaleString() + ' training games'; },
      height: 150,
      panels: [
        { title: 'Validation loss', sub: 'lower is better', y: [4.5, 5.5], yTicks: [4.6, 5.0, 5.4], fmt: function (v) { return v.toFixed(1); }, points: zip(val), tipFmt: function (v) { return v.toFixed(3); } },
        { title: 'Action-type F1', sub: 'higher', y: [.22, .31], yTicks: [.24, .27, .30], fmt: function (v) { return v.toFixed(2).replace(/^0/, ''); }, points: zip(f1), tipFmt: function (v) { return v.toFixed(3).replace(/^0/, ''); } },
        { title: 'Aim error, median', sub: 'lower', y: [5, 11], yTicks: [6, 8, 10], fmt: function (v) { return v + '°'; }, points: zip(aim), tipFmt: function (v) { return v + '°'; } },
        { title: 'Wins vs DuelBot', sub: 'of 20, fastsim', y: [0, 14], yTicks: [0, 5, 10], fmt: function (v) { return v; }, points: zip(wins), color: C.orange, tipFmt: function (v) { return v + ' / 20'; } }
      ],
      table: { head: ['Training games', 'Best val loss', 'Action-type acc / F1', 'Aim median', 'Fastsim vs DuelBot, 20 eps'],
        rows: [['900', '5.352', '.570 / .248', '9.66°', '12 W / 8 D'], ['2,000', '4.999', '.597 / .274', '7.89°', '9 / 11'], ['4,000', '4.811', '.608 / .284', '7.19°', '7 / 13'], ['8,000', '4.705', '.616 / .290', '6.75°', '6 / 14'], ['15,881', '4.675', '.614 / .292', '6.6°', '7 / 13']] }
    });
  };

  // The can-cast / action-state fixes on 3,999 paired seeds.
  FIGS['cancast-arms'] = function (fig) {
    var arms = [
      ['Full model', 'as deployed', .348, .334, .363, .411],
      ['Full model', 'can-cast fix', .339, null, null, .282],
      ['Full model', '+ action-state bit', .438, .423, .454, .237],
      ['900-game model', 'as deployed', .788, .775, .800, .238],
      ['900-game model', 'both fixes', .704, null, null, .228]
    ];
    var host = h('div', 'viz-pair-cols', fig);
    legend(host, [{ label: 'full model (15,881 games)', color: C.blue }, { label: '900-game model', color: C.orange }]);
    var a = h('div', 'viz-cell', host), b = h('div', 'viz-cell', host);
    h('div', 'viz-cell-title', a, 'Win rate vs DuelBot').insertAdjacentHTML('beforeend', ' <span>Wilson 95% where reported</span>');
    h('div', 'viz-cell-title', b, 'P(none)').insertAdjacentHTML('beforeend', ' <span>share of idle decisions</span>');
    function rows(key) {
      var out = [];
      arms.forEach(function (r, i) {
        if (i === 0 || arms[i - 1][0] !== r[0]) out.push({ header: r[0] });
        var col = r[0] === 'Full model' ? C.blue : C.orange;
        var m = key === 'win'
          ? { v: r[2], lo: r[3], hi: r[4], color: col, tip: swatch(col) + 'win rate <b>' + r[2].toFixed(3).replace(/^0/, '') + '</b>' + (r[3] != null ? ' [' + r[3].toFixed(3).replace(/^0/, '') + ', ' + r[4].toFixed(3).replace(/^0/, '') + ']' : '') }
          : { v: r[5], color: col, tip: swatch(col) + 'P(none) <b>' + r[5].toFixed(3).replace(/^0/, '') + '</b>' };
        if (m.lo == null) { delete m.lo; delete m.hi; }
        out.push({ label: r[1], marks: [m] });
      });
      return out;
    }
    var d1 = dotRows(a, { aria: 'Win rate by model and observation builder', labelW: 150, axis: { min: 0, max: 1, ticks: [0, .25, .5, .75, 1], fmt: function (v) { return Math.round(v * 100) + '%'; } }, refs: [{ v: .5, label: '' }], rows: rows('win') });
    var d2 = dotRows(b, { aria: 'Idle rate by model and observation builder', labelW: 150, axis: { min: 0, max: .5, ticks: [0, .25, .5], fmt: function (v) { return Math.round(v * 100) + '%'; } }, rows: rows('none') });
    dataTable(fig, ['Model', 'Builder', 'Win rate (Wilson 95%)', 'P(none)'], arms.map(function (r) {
      return [r[0], r[1], r[2].toFixed(3).replace(/^0/, '') + (r[3] != null ? ' [' + r[3].toFixed(3).replace(/^0/, '') + ', ' + r[4].toFixed(3).replace(/^0/, '') + ']' : ''), r[5].toFixed(3).replace(/^0/, '')];
    }));
    return function () { d1(); d2(); };
  };

  // ------------------------------------------------------------------ boot

  var redraws = [];
  document.querySelectorAll('.viz[data-viz]').forEach(function (n) {
    var f = FIGS[n.getAttribute('data-viz')];
    if (f) { n.classList.add('ready'); redraws.push(f(n)); }
  });
  var lastW = window.innerWidth, timer;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(timer);
    timer = setTimeout(function () { redraws.forEach(function (d) { d(); }); }, 150);
  });
})();
