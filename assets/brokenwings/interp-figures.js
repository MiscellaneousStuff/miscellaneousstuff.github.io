// Figures for the "What the policies actually compute" section of
// Superhuman League of Legends AI (Part 2 - Brokenwings).
//
// Every <div class="viz" data-viz="..."> in the post is rendered here from
// interp.json (the response-curve sweeps and target-head readout from
// brokenwings tools/interp). Plain SVG, no dependencies.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var COLORS = { league5: '#2a78d6', league6: '#eb6834', single: '#9a9890' };
  var CKPTS = ['league5', 'league6'];

  // --------------------------------------------------------------- helpers

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
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

  function scale(d0, d1, r0, r1) {
    return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
  }

  function ticks(lo, hi, n) {
    var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / n)));
    var err = (hi - lo) / n / step;
    if (err >= 5) step *= 10; else if (err >= 2.5) step *= 5; else if (err >= 1.5) step *= 2;
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }

  function extent(arrays, key, pad) {
    var lo = Infinity, hi = -Infinity;
    arrays.forEach(function (a) { a.forEach(function (p) { lo = Math.min(lo, p[key]); hi = Math.max(hi, p[key]); }); });
    var span = hi - lo || 1;
    return [lo - span * pad, hi + span * pad];
  }

  var fmt = {
    p: function (v) { return v.toFixed(2); },
    move: function (v) { return (v > 0 ? '+' : '') + Math.round(v) + ' u'; },
    value: function (v) { return (v > 0 ? '+' : '') + v.toFixed(2); },
    w: function (v) { return (v > 0 ? '+' : '') + v.toFixed(2); }
  };

  // one shared tooltip per figure
  function tooltip(fig) {
    var tip = h('div', 'viz-tip', fig);
    return {
      show: function (html, x, y) {
        tip.innerHTML = html;
        tip.style.display = 'block';
        var fw = fig.clientWidth, tw = tip.offsetWidth;
        var left = Math.min(Math.max(x + 14, 0), fw - tw);
        if (x + 14 + tw > fw) left = Math.max(x - tw - 14, 0);
        tip.style.left = left + 'px';
        tip.style.top = Math.max(y - tip.offsetHeight - 10, 0) + 'px';
      },
      hide: function () { tip.style.display = 'none'; }
    };
  }

  function swatch(color, dashed) {
    return '<span class="viz-swatch' + (dashed ? ' dashed' : '') + '" style="--c:' + color + '"></span>';
  }

  function legend(parent, items) {
    var lg = h('div', 'viz-legend', parent);
    items.forEach(function (it) {
      var s = h('span', 'viz-legend-item', lg);
      s.innerHTML = swatch(it.color, it.dashed) + it.label;
    });
    return lg;
  }

  function dataTable(parent, caption, head, rows) {
    var d = h('details', 'viz-data', parent);
    h('summary', null, d, 'Show data');
    var t = h('table', null, d);
    if (caption) h('caption', null, t, caption);
    var tr = h('tr', null, h('thead', null, t));
    head.forEach(function (c) { h('th', null, tr, c); });
    var tb = h('tbody', null, t);
    rows.forEach(function (r) {
      var row = h('tr', null, tb);
      r.forEach(function (c) { h('td', null, row, c); });
    });
  }

  // A small line-chart panel. Returns {setIndex(i)} so a row of panels can
  // share one crosshair.
  function panel(svgParent, o) {
    var W = o.width, H = o.height, m = o.margin;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': o.aria || '' }, svgParent);
    var x = scale(o.x[0], o.x[1], m.l, W - m.r);
    var y = scale(o.y[0], o.y[1], H - m.b, m.t);

    (o.bands || []).forEach(function (b) {
      el('rect', { x: x(b.x0), y: m.t, width: x(b.x1) - x(b.x0), height: H - m.t - m.b, class: 'viz-band ' + (b.cls || '') }, svg);
      var t = el('text', { x: x(b.x1) - 4, y: m.t + 11, class: 'viz-band-label', 'text-anchor': 'end' }, svg);
      t.textContent = b.label;
    });

    o.yTicks.forEach(function (v) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 && o.zero ? 'viz-zero' : 'viz-grid' }, svg);
      if (o.showY) {
        var t = el('text', { x: m.l - 6, y: y(v) + 3.5, class: 'viz-tick', 'text-anchor': 'end' }, svg);
        t.textContent = o.yFmt(v);
      }
    });
    o.xTicks.forEach(function (v) {
      var t = el('text', { x: x(v), y: H - m.b + 14, class: 'viz-tick', 'text-anchor': 'middle' }, svg);
      t.textContent = o.xFmt(v);
    });
    el('line', { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, class: 'viz-axis' }, svg);

    var cross = el('line', { x1: 0, x2: 0, y1: m.t, y2: H - m.b, class: 'viz-cross', visibility: 'hidden' }, svg);

    var dots = [];
    o.series.forEach(function (s) {
      var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + x(p.x).toFixed(1) + ',' + y(p[o.key]).toFixed(1); }).join('');
      el('path', { d: d, class: 'viz-line', stroke: s.color, 'stroke-dasharray': s.dashed ? '4 3' : 'none' }, svg);
      var g = el('g', {}, svg);
      dots.push(s.points.map(function (p) {
        return el('circle', { cx: x(p.x), cy: y(p[o.key]), r: s.dashed ? 2.5 : 3, fill: s.dashed ? 'var(--viz-surface)' : s.color, stroke: s.dashed ? s.color : 'var(--viz-surface)', 'stroke-width': s.dashed ? 1.5 : 1.5, class: 'viz-dot' }, g);
      }));
    });

    var hit = el('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent' }, svg);
    var n = o.series[0].points.length;
    function nearest(evt) {
      var r = svg.getBoundingClientRect();
      var px = (evt.clientX - r.left) * (W / r.width);
      var best = 0, bd = Infinity;
      o.series[0].points.forEach(function (p, i) { var dd = Math.abs(x(p.x) - px); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    hit.addEventListener('pointermove', function (evt) { o.onHover(nearest(evt), evt); });
    hit.addEventListener('pointerleave', function () { o.onLeave(); });

    return {
      setIndex: function (i) {
        if (i == null) { cross.setAttribute('visibility', 'hidden'); }
        else {
          var px = x(o.series[0].points[i].x);
          cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
        }
        dots.forEach(function (ds, si) {
          ds.forEach(function (c, j) { c.setAttribute('r', j === i ? 4.5 : (o.series[si].dashed ? 2.5 : 3)); });
        });
      },
      n: n
    };
  }

  function widthOf(node, fallback) { return Math.max(node.clientWidth || fallback, 200); }

  // ------------------------------------------------- figure: grouped vs single

  function groupedVsSingle(fig, D) {
    var state = { ck: 'league5' };
    var controls = h('div', 'viz-controls', fig);
    var lgWrap = h('div', null, fig);
    var body = h('div', 'viz-pair', fig);
    var tip = tooltip(fig);

    var feats = [
      { key: 'opp_hp', title: 'Opponent HP', x: [0, 1], xt: [0, 0.5, 1], xf: function (v) { return Math.round(v * 100) + '%'; }, xl: function (v) { return Math.round(v * 100) + '% HP'; } },
      { key: 'distance', title: 'Distance to opponent', x: [0, 2250], xt: [0, 600, 1150, 2250], xf: function (v) { return v; }, xl: function (v) { return Math.round(v) + ' u'; },
        bands: [{ x0: 0, x1: 600, label: 'AA', cls: 'aa' }, { x0: 600, x1: 1150, label: 'Q', cls: 'q' }] }
    ];

    CKPTS.forEach(function (ck) {
      var b = h('button', null, controls, D.checkpoints[ck]);
      b.type = 'button';
      b.addEventListener('click', function () { state.ck = ck; draw(); });
    });

    function draw() {
      controls.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-pressed', CKPTS[i] === state.ck); });
      lgWrap.innerHTML = '';
      legend(lgWrap, [
        { label: 'Grouped sweep (every column that encodes it)', color: COLORS[state.ck] },
        { label: 'Single column', color: COLORS.single, dashed: true }
      ]);
      body.innerHTML = '';
      var narrow = widthOf(fig, 700) < 520;
      var W = narrow ? widthOf(fig, 700) : (widthOf(fig, 700) - 24) / 2;
      feats.forEach(function (f, fi) {
        var cell = h('div', 'viz-cell', body);
        h('div', 'viz-cell-title', cell, f.title);
        var g = D.group[state.ck][f.key], s = D.single[state.ck][f.key];
        var p = panel(cell, {
          width: W, height: 190, margin: { l: 34, r: 8, t: 8, b: 22 },
          x: f.x, y: [0, 0.75], key: 'attack',
          xTicks: f.xt, xFmt: f.xf, yTicks: [0, 0.25, 0.5, 0.75], yFmt: fmt.p, showY: true,
          bands: f.bands,
          aria: f.title + ': P(attack) for grouped vs single-column sweeps',
          series: [
            { points: s, color: COLORS.single, dashed: true },
            { points: g, color: COLORS[state.ck] }
          ],
          onHover: function (i, evt) {
            p.setIndex(i);
            var r = fig.getBoundingClientRect();
            tip.show('<b>' + f.title + '</b><br>' +
              swatch(COLORS[state.ck]) + 'grouped, ' + f.xl(g[i].x) + ': P(attack) <b>' + fmt.p(g[i].attack) + '</b><br>' +
              swatch(COLORS.single, true) + 'single, ' + f.xl(s[i].x) + ': P(attack) <b>' + fmt.p(s[i].attack) + '</b>',
              evt.clientX - r.left, evt.clientY - r.top);
          },
          onLeave: function () { p.setIndex(null); tip.hide(); }
        });
        h('div', 'viz-axis-label', cell, fi === 0 ? 'opponent HP (y: P(attack opponent))' : 'distance, game units');
      });
    }

    draw();
    var rows = [];
    CKPTS.forEach(function (ck) {
      feats.forEach(function (f) {
        D.group[ck][f.key].forEach(function (p, i) {
          var s = D.single[ck][f.key][i];
          rows.push([D.checkpoints[ck], f.title, 'grouped', f.xl(p.x), fmt.p(p.attack)]);
          rows.push([D.checkpoints[ck], f.title, 'single column', f.xl(s.x), fmt.p(s.attack)]);
        });
      });
    });
    dataTable(fig, null, ['Checkpoint', 'Feature', 'Sweep', 'x', 'P(attack)'], rows);
    return draw;
  }

  // ------------------------------------------------------ figure: response grid

  function responseGrid(fig, D) {
    var rowsDef = [
      { title: 'Own HP', note: 'grouped', get: function (ck) { return D.group[ck].own_hp; }, x: [0, 1], xt: [0, 0.5, 1], xf: function (v) { return Math.round(v * 100) + '%'; }, xl: function (v) { return 'own HP ' + Math.round(v * 100) + '%'; } },
      { title: 'Opponent HP', note: 'grouped', get: function (ck) { return D.group[ck].opp_hp; }, x: [0, 1], xt: [0, 0.5, 1], xf: function (v) { return Math.round(v * 100) + '%'; }, xl: function (v) { return 'opponent HP ' + Math.round(v * 100) + '%'; } },
      { title: 'Distance to opponent', note: 'grouped, game units', get: function (ck) { return D.group[ck].distance; }, x: [0, 2250], xt: [0, 1150, 2250], xf: function (v) { return v; }, xl: function (v) { return Math.round(v) + ' u away'; },
        bands: [{ x0: 0, x1: 600, label: 'AA', cls: 'aa' }, { x0: 600, x1: 1150, label: 'Q', cls: 'q' }] },
      { title: 'Q cooldown remaining', note: 'seconds', get: function (ck) { return D.single[ck].q_cd; }, x: [0, 10], xt: [0, 5, 10], xf: function (v) { return v + 's'; }, xl: function (v) { return 'Q cooldown ' + v.toFixed(1) + 's'; } },
      { title: 'Elapsed time', note: 'race feature, episode fraction', get: function (ck) { return D.single[ck].elapsed; }, x: [0, 1], xt: [0, 0.5, 1], xf: function (v) { return v; }, xl: function (v) { return 'elapsed ' + v.toFixed(2); } }
    ];
    var colsDef = [
      { key: 'attack', title: 'P(attack opponent)', f: fmt.p },
      { key: 'move', title: 'Move toward opponent', sub: 'u / decision', f: fmt.move, zero: true },
      { key: 'value', title: 'Value estimate', f: fmt.value, zero: true }
    ];
    var all = {};
    colsDef.forEach(function (c) {
      var arrs = [];
      rowsDef.forEach(function (r) { CKPTS.forEach(function (ck) { arrs.push(r.get(ck)); }); });
      all[c.key] = extent(arrs, c.key, 0.08);
      if (c.key === 'attack') all[c.key] = [0, Math.max(0.75, all[c.key][1])];
    });

    legend(fig, CKPTS.map(function (ck) { return { label: D.checkpoints[ck], color: COLORS[ck] }; }));
    var grid = h('div', 'viz-matrix', fig);
    var tip = tooltip(fig);

    function draw() {
      grid.innerHTML = '';
      var fw = widthOf(grid, 700);
      var W = (fw - 2 * 12) / 3;
      var narrow = W < 150;
      var head = h('div', 'viz-grid-row viz-grid-head', grid);
      colsDef.forEach(function (c) {
        var d = h('div', 'viz-col-title', head, c.title);
        if (c.sub) h('span', null, d, ' (' + c.sub + ')');
      });
      rowsDef.forEach(function (r) {
        h('div', 'viz-row-title', grid).innerHTML = '<b>' + r.title + '</b> <span>' + r.note + '</span>';
        var row = h('div', 'viz-grid-row', grid);
        var panels = [];
        var series = CKPTS.map(function (ck) { return { ck: ck, points: r.get(ck), color: COLORS[ck] }; });
        function hover(i, evt) {
          panels.forEach(function (p) { p.setIndex(i); });
          var rr = fig.getBoundingClientRect();
          var html = '<b>' + r.xl(series[0].points[i].x) + '</b><table>';
          html += '<tr><td></td>' + colsDef.map(function (c) { return '<td>' + c.title.replace('Move toward opponent', 'move').replace('Value estimate', 'value').replace('P(attack opponent)', 'P(attack)') + '</td>'; }).join('') + '</tr>';
          series.forEach(function (s) {
            html += '<tr><td>' + swatch(s.color) + D.checkpoints[s.ck].split(' ')[0] + '</td>' +
              colsDef.map(function (c) { return '<td><b>' + c.f(s.points[i][c.key]) + '</b></td>'; }).join('') + '</tr>';
          });
          tip.show(html + '</table>', evt.clientX - rr.left, evt.clientY - rr.top);
        }
        function leave() { panels.forEach(function (p) { p.setIndex(null); }); tip.hide(); }
        colsDef.forEach(function (c) {
          var cell = h('div', 'viz-cell', row);
          var yt = c.key === 'attack' ? [0, 0.25, 0.5, 0.75] : ticks(all[c.key][0], all[c.key][1], c.key === 'move' ? 3 : 4);
          panels.push(panel(cell, {
            width: W, height: narrow ? 92 : 112, margin: { l: narrow ? 26 : 34, r: 6, t: 6, b: 20 },
            x: r.x, y: all[c.key], key: c.key, zero: c.zero,
            xTicks: narrow ? [r.xt[0], r.xt[r.xt.length - 1]] : r.xt, xFmt: r.xf,
            yTicks: yt, yFmt: c.key === 'move' ? function (v) { return Math.round(v); } : function (v) { return c.key === 'attack' ? (v ? v.toFixed(2).replace(/^0/, '') : '0') : v.toFixed(0); },
            showY: true, bands: r.bands,
            aria: r.title + ' versus ' + c.title,
            series: series, onHover: hover, onLeave: leave
          }));
        });
      });
    }

    draw();
    var rows = [];
    rowsDef.forEach(function (r) {
      CKPTS.forEach(function (ck) {
        r.get(ck).forEach(function (p) {
          rows.push([r.title, D.checkpoints[ck], r.xl(p.x), fmt.p(p.attack), fmt.move(p.move), fmt.value(p.value)]);
        });
      });
    });
    dataTable(fig, null, ['Swept', 'Checkpoint', 'x', 'P(attack)', 'Move', 'Value'], rows);
    return draw;
  }

  // ---------------------------------------------------- figure: target head

  function targetHead(fig, D) {
    var fields = [
      ['hp/AD', 'HP ÷ my AD (autos to kill)'],
      ['dhp1', 'HP change, last decision'],
      ['dhp3', 'HP change, last 3 decisions'],
      ['in_aa_range', 'In my attack range'],
      ['hp_frac', 'HP fraction'],
      ['dx', 'Offset x'],
      ['dy', 'Offset y'],
      ['max_hp', 'Max HP'],
      ['dist', 'Distance']
    ];
    var rules = [
      ['lowest_hp_frac', 'Lowest HP fraction'],
      ['lowest_hp_ad', 'Fewest autos to kill'],
      ['recently_damaged', 'Most recently damaged'],
      ['nearest', 'Nearest']
    ];
    legend(fig, CKPTS.map(function (ck) { return { label: D.checkpoints[ck], color: COLORS[ck] }; }));
    var wrap = h('div', 'viz-stack viz-target', fig);
    var tip = tooltip(fig);

    function draw() {
      wrap.innerHTML = '';
      var fw = widthOf(fig, 700);
      var narrow = fw < 560;
      var W1 = fw, W2 = fw;

      // weights: diverging grouped bars
      var c1 = h('div', 'viz-cell', wrap);
      h('div', 'viz-cell-title', c1, 'Linear readout of the creep-slot logit');
      var labelW = narrow ? 150 : 190, rowH = 26, top = 6;
      var H1 = top + fields.length * rowH + 22;
      var svg = el('svg', { viewBox: '0 0 ' + W1 + ' ' + H1, width: W1, height: H1, class: 'viz-panel', role: 'img', 'aria-label': 'Target-head readout weights per slot field' }, c1);
      var x = scale(-5, 5, labelW, W1 - 8);
      [-4, -2, 0, 2, 4].forEach(function (v) {
        el('line', { x1: x(v), x2: x(v), y1: top, y2: H1 - 22, class: v === 0 ? 'viz-zero' : 'viz-grid' }, svg);
        var t = el('text', { x: x(v), y: H1 - 8, class: 'viz-tick', 'text-anchor': 'middle' }, svg);
        t.textContent = v > 0 ? '+' + v : v;
      });
      fields.forEach(function (f, i) {
        var y0 = top + i * rowH;
        var t = el('text', { x: labelW - 10, y: y0 + rowH / 2 + 4, class: 'viz-label', 'text-anchor': 'end' }, svg);
        t.textContent = f[1];
        CKPTS.forEach(function (ck, j) {
          var v = D.target[ck].weights[f[0]];
          var bh = 8, by = y0 + 4 + j * (bh + 2);
          var x0 = x(0), x1 = x(v), r = Math.min(3, Math.abs(x1 - x0));
          var d;
          if (v >= 0) d = 'M' + x0 + ',' + by + 'H' + (x1 - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'V' + (by + bh - r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r + 'H' + x0 + 'Z';
          else d = 'M' + x0 + ',' + by + 'H' + (x1 + r) + 'a' + r + ',' + r + ' 0 0 0 ' + (-r) + ',' + r + 'V' + (by + bh - r) + 'a' + r + ',' + r + ' 0 0 0 ' + r + ',' + r + 'H' + x0 + 'Z';
          var bar = el('path', { d: d, fill: COLORS[ck], class: 'viz-bar' }, svg);
          var hit = el('rect', { x: labelW, y: by - 1, width: W1 - labelW, height: bh + 2, fill: 'transparent' }, svg);
          hit.addEventListener('pointermove', function (evt) {
            bar.classList.add('on');
            var rr = fig.getBoundingClientRect();
            tip.show('<b>' + f[1] + '</b><br>' + swatch(COLORS[ck]) + D.checkpoints[ck] + ': weight <b>' + fmt.w(v) + '</b>', evt.clientX - rr.left, evt.clientY - rr.top);
          });
          hit.addEventListener('pointerleave', function () { bar.classList.remove('on'); tip.hide(); });
        });
      });
      h('div', 'viz-axis-label', c1, '← lowers the logit · raises it →');

      // rule agreement: dot plot
      var c2 = h('div', 'viz-cell', wrap);
      h('div', 'viz-cell-title', c2, 'How often the pick matches a simple rule');
      var lw = narrow ? 150 : 190, H2 = top + rules.length * 34 + 22;
      var s2 = el('svg', { viewBox: '0 0 ' + W2 + ' ' + H2, width: W2, height: H2, class: 'viz-panel', role: 'img', 'aria-label': 'Agreement between the target head and simple targeting rules' }, c2);
      var x2 = scale(0, 1, lw, W2 - 8);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        el('line', { x1: x2(v), x2: x2(v), y1: top, y2: H2 - 22, class: 'viz-grid' }, s2);
        var t = el('text', { x: x2(v), y: H2 - 8, class: 'viz-tick', 'text-anchor': 'middle' }, s2);
        t.textContent = Math.round(v * 100) + '%';
      });
      rules.forEach(function (r, i) {
        var yy = top + i * 34 + 17;
        var t = el('text', { x: lw - 10, y: yy + 4, class: 'viz-label', 'text-anchor': 'end' }, s2);
        t.textContent = r[1];
        CKPTS.forEach(function (ck, j) {
          var v = D.target[ck].rules[r[0]], cy = yy + (j ? 5 : -5);
          el('line', { x1: x2(0), x2: x2(v), y1: cy, y2: cy, class: 'viz-connector' }, s2);
          var c = el('circle', { cx: x2(v), cy: cy, r: 5, fill: COLORS[ck], stroke: 'var(--viz-surface)', 'stroke-width': 2, class: 'viz-dot' }, s2);
          var hit = el('circle', { cx: x2(v), cy: cy, r: 8, fill: 'transparent' }, s2);
          hit.addEventListener('pointermove', function (evt) {
            c.setAttribute('r', 6.5);
            var rr = fig.getBoundingClientRect();
            tip.show('<b>' + r[1] + '</b><br>' + swatch(COLORS[ck]) + D.checkpoints[ck] + ': <b>' + Math.round(v * 100) + '%</b> of creep attacks', evt.clientX - rr.left, evt.clientY - rr.top);
          });
          hit.addEventListener('pointerleave', function () { c.setAttribute('r', 5); tip.hide(); });
        });
      });
      h('div', 'viz-axis-label', c2, 'share of creep attacks where the rule picks the same creep');
    }

    draw();
    var rows = fields.map(function (f) { return [f[1], fmt.w(D.target.league5.weights[f[0]]), fmt.w(D.target.league6.weights[f[0]])]; });
    rules.forEach(function (r) { rows.push(['Matches rule: ' + r[1].toLowerCase(), Math.round(D.target.league5.rules[r[0]] * 100) + '%', Math.round(D.target.league6.rules[r[0]] * 100) + '%']); });
    rows.push(['R² of the linear fit', D.target.league5.r2.toFixed(3), D.target.league6.r2.toFixed(3)]);
    rows.push(['Creep attacks analysed', D.target.league5.n_creep_attacks.toLocaleString(), D.target.league6.n_creep_attacks.toLocaleString()]);
    dataTable(fig, null, ['', D.checkpoints.league5, D.checkpoints.league6], rows);
    return draw;
  }

  // ------------------------------------------------------------------ boot

  var FIGS = { 'grouped-vs-single': groupedVsSingle, 'response-grid': responseGrid, 'target-head': targetHead };
  var nodes = document.querySelectorAll('.viz[data-viz]');
  if (!nodes.length) return;
  var src = nodes[0].getAttribute('data-src');
  fetch(src).then(function (r) { return r.json(); }).then(function (D) {
    var redraws = [];
    nodes.forEach(function (n) {
      var f = FIGS[n.getAttribute('data-viz')];
      if (f) { n.classList.add('ready'); redraws.push(f(n, D)); }
    });
    var lastW = window.innerWidth, timer;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(function () { redraws.forEach(function (d) { d(); }); }, 150);
    });
  });
})();
