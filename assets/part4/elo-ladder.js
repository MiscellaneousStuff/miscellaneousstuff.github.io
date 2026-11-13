// Figure for Superhuman League of Legends AI (Part 4 - "The payoff"): Elo of the
// 5v5 lineage against training progress, with the scripted bots as a reference.
//
// Every number is the one in the win-based ladder's fit (fit.json, summary.json,
// bot_summary.json); the chart only re-presents them. Renders only
// <div class="viz" data-viz="elo-ladder"> and ignores every other .viz node, so
// it can sit next to other per-post scripts. Plain SVG, no dependencies.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    blue: '#2a78d6', orange: '#eb6834', gray: '#a8a69e',
    strong: 'rgba(0, 0, 0, 0.85)', faint: 'rgba(0, 0, 0, 0.4)', rule: 'rgba(0, 0, 0, 0.1)'
  };
  var DATA = {"source":"botladder fit.json (Bradley-Terry on wins, v000000 = 0, 300 bootstrap refits), summary.json, bot_summary.json","bot":"bot-bt-intermediate","steps_per_rollout":2600000.0,"players":{"v000000":{"elo":0.0,"ci_lo":0.0,"ci_hi":0.0,"d_ref":-2965.5,"d_lo":-3119.0,"d_hi":-2874.8},"v000600":{"elo":40.0,"ci_lo":-1.1,"ci_hi":81.1,"d_ref":-2925.5,"d_lo":-3071.9,"d_hi":-2827.7},"v001350":{"elo":989.4,"ci_lo":946.1,"ci_hi":1039.7,"d_ref":-1976.1,"d_lo":-2124.1,"d_hi":-1874.0},"v002400":{"elo":1251.0,"ci_lo":1203.2,"ci_hi":1318.2,"d_ref":-1714.5,"d_lo":-1852.1,"d_hi":-1627.2},"v009600":{"elo":1840.2,"ci_lo":1752.7,"ci_hi":1971.8,"d_ref":-1125.3,"d_lo":-1199.4,"d_hi":-1061.0},"v016800":{"elo":2296.6,"ci_lo":2205.4,"ci_hi":2433.3,"d_ref":-668.9,"d_lo":-713.6,"d_hi":-622.4},"v020400":{"elo":2363.4,"ci_lo":2265.2,"ci_hi":2497.4,"d_ref":-602.1,"d_lo":-646.7,"d_hi":-567.0},"v027600":{"elo":2500.0,"ci_lo":2407.1,"ci_hi":2646.8,"d_ref":-465.5,"d_lo":-502.7,"d_hi":-432.4},"v032400":{"elo":2624.7,"ci_lo":2534.7,"ci_hi":2764.1,"d_ref":-340.8,"d_lo":-375.3,"d_hi":-307.6},"v038400":{"elo":2609.3,"ci_lo":2514.3,"ci_hi":2753.0,"d_ref":-356.2,"d_lo":-387.1,"d_hi":-330.3},"v043200":{"elo":2533.3,"ci_lo":2431.9,"ci_hi":2683.3,"d_ref":-432.2,"d_lo":-468.1,"d_hi":-405.6},"v046575":{"elo":2965.5,"ci_lo":2874.8,"ci_hi":3119.0,"d_ref":0.0,"d_lo":0.0,"d_hi":0.0},"v049200":{"elo":2673.8,"ci_lo":2579.9,"ci_hi":2832.4,"d_ref":-291.8,"d_lo":-318.0,"d_hi":-266.9},"v049225":{"elo":2942.7,"ci_lo":2854.0,"ci_hi":3097.1,"d_ref":-22.8,"d_lo":-43.8,"d_hi":-3.6},"bot-bt-intermediate":{"elo":725.2,"ci_lo":684.2,"ci_hi":762.9,"d_ref":-2240.3,"d_lo":-2390.9,"d_hi":-2137.6},"inert":{"elo":-273.1,"ci_lo":-365.5,"ci_hi":-199.7,"d_ref":-3238.6,"d_lo":-3429.1,"d_hi":-3139.0},"random":{"elo":10.8,"ci_lo":-61.7,"ci_hi":89.2,"d_ref":-2954.7,"d_lo":-3113.1,"d_hi":-2836.5}},"ent":{"inert":[20,172,192],"random":[87,105,192],"v000000":[196,700,896],"v000600":[145,623,768],"v001350":[561,463,1024],"v002400":[662,554,1216],"v009600":[596,492,1088],"v016800":[659,365,1024],"v020400":[523,501,1024],"v027600":[627,717,1344],"v032400":[944,592,1536],"v038400":[777,1271,2048],"v043200":[315,965,1280],"v046575":[1975,585,2560],"v049200":[432,1360,1792],"v049225":[1529,583,2112]},"vsb":{"inert":[0,64,64],"random":[0,64,64],"v000600":[0,128,128],"v001350":[103,25,128],"v002400":[128,0,128],"v009600":[64,0,64],"v046575":[64,0,64]},"era":{"inert":"floor: HOLD every decision","random":"floor: uniform legal action","v000000":"random init","v000600":"v1.0-1.5 (no items, 37-way head)","v001350":"v1.0-1.5 (no items, 37-way head)","v002400":"v1.0-1.5 (no items, 37-way head)","v009600":"v1.0-1.5 (no items, 37-way head)","v016800":"v1.6 items + Recall","v020400":"v1.7 Recall channel obs","v027600":"v1.8 cancel lockout","v032400":"v1.8 cancel lockout","v038400":"v1.8/1.9 boundary (last pre-hold segment)","v043200":"v1.10 hold + gold-spent","v046575":"v1.10 hold + gold-spent","v049200":"v1.10 hold + gold-spent","v049225":"v1.10 hold + gold-spent"},"len":{"v000000":22.5,"v049225":43.5,"v016800":29.7,"v002400":22.5,"v009600":25.6,"v027600":32.6,"v020400":32.8,"v032400":34.1,"v038400":33.5,"v043200":34.1,"v046575":42.6,"v049200":47.7,"inert":34.4,"v000600":24.0,"v001350":22.1,"random":36.9,"bot-bt-intermediate":25.5},"eras":[{"from":0,"to":15600,"label":"v1.0–1.5 · no items","short":"no items"},{"from":15600,"to":38400,"label":"v1.6–1.8 · items + Recall","short":"items + Recall"},{"from":38400,"to":41800,"label":"v1.9 · Recall hold","short":"v1.9"},{"from":41800,"to":50000,"label":"v1.10 · gold spent","short":"v1.10"}]};

  // Hours from checkpoint file save times (not a trainer log). wall: since the first
  // checkpoint was saved (8 Nov 11:57 UTC), stoppages included. active: the same with
  // stoppages removed (an interval >2.5x slower than its neighbours counts as a stoppage),
  // so it reads as hours of actual training. Checkpoints missing here are left out of
  // the hours view.
  var HOURS = {
    v000000: { wall: 0, active: 0 },
    v000600: { wall: 7.0, active: 1.5 },
    v001350: { wall: 10.6, active: 4.2 },
    v002400: { wall: 13.0, active: 6.7 },
    v009600: { wall: 47.1, active: 23.1 },
    v016800: { wall: 63.5, active: 27.8 },
    v032400: { wall: 76.2, active: 38.6 },
    v046575: { wall: 85.8, active: 48.1 },
    v049225: { wall: 88.9, active: 49.8 }
  };
  var HMAX = 50;

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
  // white outline so labels stay readable over lines and bands
  function halo(t) {
    t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', '#fff');
    t.setAttribute('stroke-width', '3.5'); t.setAttribute('stroke-linejoin', 'round');
    return t;
  }
  function fixed(t) { t.setAttribute('data-fixed', ''); return halo(t); }
  var BOLD = 'font-weight:600;fill:' + C.strong, SMALL = 'font-size:10.5px';
  function linear(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
  function width(node) { return Math.max(node.clientWidth || 700, 280); }
  function swatch(color, hollow, square) {
    return '<span class="viz-dot-swatch' + (hollow ? ' hollow' : '') + '" style="--c:' + color + (square ? ';border-radius:2px' : '') + '"></span>';
  }
  function legend(parent, items) {
    var lg = h('div', 'viz-legend', parent);
    lg.style.marginBottom = '0';
    items.forEach(function (it) {
      h('span', 'viz-legend-item', lg).innerHTML = (it.line ? '<span class="viz-swatch' + (it.dashed ? ' dashed' : '') + '" style="--c:' + it.color + '"></span>'
        : it.band ? '<span style="display:inline-block;width:16px;height:10px;margin-right:7px;background:rgba(0,0,0,0.035);border:1px solid ' + C.rule + '"></span>'
        : swatch(it.color, it.hollow, it.square)) + it.label;
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
        var fw = fig.clientWidth;
        tip.style.whiteSpace = fw < 420 ? 'normal' : '';
        tip.style.maxWidth = fw + 'px';
        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var left = x + 16 + tw > fw ? Math.max(x - tw - 16, 0) : x + 16;
        tip.style.left = left + 'px';
        tip.style.top = (y - th - 12 < 0 ? y + 18 : y - th - 12) + 'px';
      },
      hide: function () { tip.style.display = 'none'; }
    };
  }
  function dataTable(parent, head, rows, right) {
    var d = h('details', 'viz-data', parent);
    h('summary', null, d, 'Show data');
    var t = h('table', null, d);
    var tr = h('tr', null, h('thead', null, t));
    head.forEach(function (c, i) { var th = h('th', null, tr, c); if (right[i]) th.style.textAlign = 'right'; });
    var tb = h('tbody', null, t);
    rows.forEach(function (r) {
      var row = h('tr', null, tb);
      r.forEach(function (c, i) { var td = h('td', null, row, c); if (right[i]) td.style.textAlign = 'right'; });
    });
  }
  function onHit(node, show, hide) {
    node.addEventListener('pointermove', show);
    node.addEventListener('pointerleave', hide);
  }
  var MINUS = '−';
  function f0(x) { return x == null ? '–' : Math.round(x).toLocaleString('en-US').replace('-', MINUS); }
  function f1(x) { return x == null ? '–' : (+x).toFixed(1).replace('-', MINUS); }
  function sgn(x) { return (x >= 0 ? '+' : MINUS) + Math.abs(Math.round(x)).toLocaleString('en-US'); }
  function kfmt(v) { return v === 0 ? '0' : (v >= 1000 ? (v / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'k' : String(v)); }
  function bsteps(r) { var b = r * DATA.steps_per_rollout / 1e9; return b < 10 ? b.toFixed(1) : Math.round(b).toString(); }
  function rollout(n) { return parseInt(n.slice(1), 10); }

  // label placement: try candidates, keep the first that hits nothing
  function overlaps(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
  function textBox(x, y, w, anchor, fs) {
    var x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { x0: x0, x1: x0 + w, y0: y - fs * 0.8, y1: y + fs * 0.25 };
  }
  function segBoxes(xa, ya, xb, yb) {
    var out = [], n = Math.max(2, Math.ceil(Math.hypot(xb - xa, yb - ya) / 6));
    for (var i = 0; i <= n; i++) { var t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t; out.push({ x0: x - 1.5, x1: x + 1.5, y0: y - 1.5, y1: y + 1.5 }); }
    return out;
  }

  // ------------------------------------------------------------ data model

  var BOT = DATA.bot, FP = DATA.players;
  function kind(n) { return n === 'inert' || n === 'random' ? 'floor' : n === BOT ? 'bot' : 'ckpt'; }
  function nice(n) { return n === BOT ? 'Scripted bots' : n; }
  // combined record: simulator games + server games against the bots
  function record(n) {
    if (n === BOT) {
      var w = 0, l = 0, g = 0;
      for (var k in DATA.vsb) { w += DATA.vsb[k][1]; l += DATA.vsb[k][0]; g += DATA.vsb[k][2]; }
      return { w: w, l: l, g: g, srv: g };
    }
    var e = DATA.ent[n], v = DATA.vsb[n];
    return { w: e[0] + (v ? v[0] : 0), l: e[1] + (v ? v[1] : 0), g: e[2] + (v ? v[2] : 0), srv: v ? v[2] : 0 };
  }
  var NAMES = Object.keys(FP);
  var CK = NAMES.filter(function (n) { return kind(n) === 'ckpt'; }).sort(function (a, b) { return rollout(a) - rollout(b); });
  var BYELO = NAMES.slice().sort(function (a, b) { return FP[b].elo - FP[a].elo; });
  var BEST = BYELO[0];
  function era(n) { return n === BOT ? 'server behaviour trees, intermediate difficulty' : (DATA.era[n] || ''); }

  function eloTip(n) {
    var p = FP[n], r = record(n), k = kind(n), R = ' style="text-align:right"';
    var s = '<b>' + nice(n) + '</b> <span style="color:' + C.faint + '">' + (k === 'ckpt' ? era(n) : k === 'bot' ? 'real C# server' : 'floor policy') + '</span><table>';
    s += '<tr><td>Elo</td><td' + R + '><b>' + f0(p.elo) + '</b></td></tr>';
    if (n !== 'v000000') s += '<tr><td>95% interval</td><td' + R + '>' + f0(p.ci_lo) + ' to ' + f0(p.ci_hi) + '</td></tr>';
    if (n !== BEST) s += '<tr><td>vs ' + BEST + '</td><td' + R + '>' + sgn(p.d_ref) + ' (' + sgn(p.d_lo) + ' to ' + sgn(p.d_hi) + ')</td></tr>';
    s += '<tr><td>Record</td><td' + R + '>' + f0(r.w) + '–' + f0(r.l) + ' in ' + f0(r.g) + ' games</td></tr>';
    if (r.srv && k !== 'bot') s += '<tr><td>of which vs bots</td><td' + R + '>' + DATA.vsb[n][0] + '–' + DATA.vsb[n][1] + ' (server)</td></tr>';
    if (DATA.len[n] != null) s += '<tr><td>Median game</td><td' + R + '>' + f1(DATA.len[n]) + ' min</td></tr>';
    if (k === 'ckpt') s += '<tr><td>Trained</td><td' + R + '>' + f0(rollout(n)) + ' rollouts · ' + bsteps(rollout(n)) + ' B agent-steps</td></tr>';
    if (HOURS[n] && n !== 'v000000') s += '<tr><td>Time</td><td' + R + '>' + f1(HOURS[n].active) + ' h training · ' + f1(HOURS[n].wall) + ' h on the clock</td></tr>';
    return s + '</table>';
  }

  // x scale for training progress: square root (default) or linear
  var XMAX = 50000;
  function xScale(mode, x0, x1) {
    if (mode === 'hours') return function (v) { return x0 + v / HMAX * (x1 - x0); };
    if (mode === 'linear') return function (v) { return x0 + v / XMAX * (x1 - x0); };
    return function (v) { return x0 + Math.sqrt(v / XMAX) * (x1 - x0); };
  }
  function xTicks(mode, narrow) {
    if (mode === 'hours') return narrow ? [0, 10, 20, 30, 40, 50] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    if (mode === 'linear') return [0, 10000, 20000, 30000, 40000, 50000];
    return narrow ? [0, 2500, 10000, 25000, 50000] : [0, 1000, 2500, 5000, 10000, 20000, 30000, 40000, 50000];
  }

  // ------------------------------------------------------------ figure

  var FIGS = {};

  // Elo along the training lineage, scripted bots as a reference line.
  FIGS['elo-ladder'] = function (fig) {
    var tip = tooltip(fig);
    var top = h('div', null, fig);
    top.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 18px;margin-bottom:12px';
    legend(top, [
      { label: 'checkpoint, 95% interval', color: C.blue },
      { label: 'scripted bots (real server)', color: C.orange, line: true, dashed: true },
      { label: 'floor policy', color: C.gray, hollow: true, square: true },
      { label: 'env-contract era', band: true }
    ]);
    var ctl = h('div', 'viz-controls', top);
    ctl.style.marginBottom = '0';
    ctl.setAttribute('role', 'group'); ctl.setAttribute('aria-label', 'x-axis scale');
    var mode = 'sqrt';
    var bS = h('button', null, ctl, '√ rollouts'), bL = h('button', null, ctl, 'Linear'), bH = h('button', null, ctl, 'Training hours');
    bS.type = bL.type = bH.type = 'button';
    var host = h('div', null, fig);
    var axisLab = h('div', 'viz-axis-label', fig);
    function setMode(m) {
      mode = m;
      bS.setAttribute('aria-pressed', m === 'sqrt'); bL.setAttribute('aria-pressed', m === 'linear'); bH.setAttribute('aria-pressed', m === 'hours');
      axisLab.textContent = m === 'hours'
        ? 'Hours of training, stoppages taken out; the whole run took 88.9 hours on the clock. Only checkpoints with a recorded save time are shown, and the era bands are hidden because they are defined in rollouts. Floor policies sit in their own column.'
        : 'Training progress: rollouts (upper row) and billions of agent-steps (lower row). Floor policies are not part of the lineage and sit in their own column.';
      draw();
    }
    bS.onclick = function () { setMode('sqrt'); }; bL.onclick = function () { setMode('linear'); }; bH.onclick = function () { setMode('hours'); };

    function draw() {
      host.innerHTML = '';
      tip.hide();
      var W = width(fig), narrow = W < 600;
      var H = narrow ? 400 : 460;
      var m = { t: 46, b: 40, l: narrow ? 38 : 40 };
      var fw = narrow ? 66 : 82;                // floors column
      var rm = narrow ? 66 : 152;               // right margin for end labels
      var px0 = m.l + fw + (narrow ? 12 : 18), px1 = W - rm;
      var x = xScale(mode, px0, px1), hrs = mode === 'hours';
      function pos(n) { return hrs ? HOURS[n].active : rollout(n); }
      var y = linear(-400, 3300, H - m.b, m.t);
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'viz-panel', role: 'img', 'aria-label': 'Elo of each checkpoint against training rollouts, with the scripted bots as a reference line' }, host);
      var obst = [];

      // era bands
      var eraBoxes = [];
      (hrs ? [] : DATA.eras).forEach(function (e, i) {
        var a = x(e.from), b = x(Math.min(e.to, XMAX));
        el('rect', { x: a, y: m.t, width: Math.max(0, b - a), height: H - m.b - m.t, class: i % 2 ? 'viz-band q' : 'viz-band' }, svg);
        if (i) el('line', { x1: a, x2: a, y1: m.t, y2: H - m.b, stroke: C.rule, 'stroke-dasharray': '2 3' }, svg);
        var lab = narrow ? e.short : e.label, tw = lab.length * 5.5, cx = (a + b) / 2;
        var lx = Math.max(px0 + tw / 2, Math.min(W - tw / 2 - 2, cx));
        var row = 0;
        while (eraBoxes.some(function (q) { return q.row === row && lx - tw / 2 < q.x1 + 8 && lx + tw / 2 > q.x0 - 8; })) row++;
        eraBoxes.push({ row: row, x0: lx - tw / 2, x1: lx + tw / 2 });
        var ly = m.t - 7 - row * 13;
        txt(svg, lx, ly, lab, 'viz-band-label', 'middle');
        if (Math.abs(lx - cx) > 4 || row) el('line', { x1: cx, x2: cx, y1: ly + 3, y2: m.t, stroke: C.rule, 'stroke-dasharray': '2 3' }, svg);
      });
      // y grid
      for (var v = 0; v <= 3000; v += 500) {
        el('line', { x1: m.l, x2: px1, y1: y(v), y2: y(v), class: v === 0 ? 'viz-zero' : 'viz-grid' }, svg);
        txt(svg, m.l - 6, y(v) + 3.5, v === 0 ? '0' : f0(v), 'viz-tick', 'end');
      }
      el('line', { x1: m.l, x2: px1, y1: y(-400), y2: y(-400), class: 'viz-axis' }, svg);
      txt(svg, 10, m.t - 6, 'Elo', 'viz-tick', 'start');
      // floor column separator + label
      var fx = m.l + fw - (narrow ? 14 : 18);
      el('line', { x1: m.l + fw + 4, x2: m.l + fw + 4, y1: m.t, y2: H - m.b, class: 'viz-grid' }, svg);
      txt(svg, m.l + fw / 2, H - m.b + 15, 'floors', 'viz-tick', 'middle');
      // x ticks, two rows
      xTicks(mode, narrow).forEach(function (t) {
        var xx = x(t);
        el('line', { x1: xx, x2: xx, y1: H - m.b, y2: H - m.b + 4, class: 'viz-axis' }, svg);
        txt(svg, xx, H - m.b + 15, hrs ? t + ' h' : kfmt(t), 'viz-tick', 'middle');
        if (!hrs) txt(svg, xx, H - m.b + 28, t ? bsteps(t) + ' B' : '', 'viz-tick', 'middle', 'font-size:10px;opacity:0.85');
      });

      // bots: interval band + dashed line across the lineage area and the floor column
      var pb = FP[BOT];
      el('rect', { x: m.l, y: y(pb.ci_hi), width: px1 - m.l, height: y(pb.ci_lo) - y(pb.ci_hi), fill: C.orange, opacity: 0.13 }, svg);
      el('line', { x1: m.l, x2: px1, y1: y(pb.elo), y2: y(pb.elo), stroke: C.orange, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
      var bl1 = narrow ? 'bots' : 'Scripted bots', bl2 = narrow ? f0(pb.elo) : f0(pb.elo) + ' · real server';
      halo(txt(svg, px1 + 8, y(pb.elo) - 2, bl1, 'viz-label', 'start', BOLD));
      txt(svg, px1 + 8, y(pb.elo) + 12, bl2, 'viz-ref-label');
      var botHit = el('rect', { x: px0, y: y(pb.elo) - 8, width: W - px0, height: 16, fill: 'transparent' }, svg);
      onHit(botHit, function (e) { tip.show(eloTip(BOT), e); }, tip.hide);

      // floors
      ['random', 'inert'].forEach(function (n) {
        var p = FP[n], cy = y(p.elo);
        el('line', { x1: fx, x2: fx, y1: y(p.ci_lo), y2: y(p.ci_hi), stroke: C.gray, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6 }, svg);
        var mk = el('rect', { x: fx - 5, y: cy - 5, width: 10, height: 10, rx: 2, fill: '#fff', stroke: C.gray, 'stroke-width': 2.2 }, svg);
        halo(txt(svg, fx - 9, cy + 4, n, 'viz-note', 'end', narrow ? SMALL : null));
        var hit = el('circle', { cx: fx, cy: cy, r: 13, fill: 'transparent' }, svg);
        onHit(hit, function (e) { mk.setAttribute('stroke', C.strong); tip.show(eloTip(n), e); }, function () { mk.setAttribute('stroke', C.gray); tip.hide(); });
      });

      // lineage
      var pts = CK.filter(function (n) { return !hrs || HOURS[n]; }).map(function (n) { return { n: n, x: x(pos(n)), y: y(FP[n].elo), lo: y(FP[n].ci_lo), hi: y(FP[n].ci_hi) }; });
      function pt(n) { return pts.filter(function (p) { return p.n === n; })[0]; }
      el('path', { d: pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(''), fill: 'none', stroke: C.blue, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0.6 }, svg);
      pts.forEach(function (p, i) {
        if (i) obst = obst.concat(segBoxes(pts[i - 1].x, pts[i - 1].y, p.x, p.y));
        obst.push({ x0: p.x - 6, x1: p.x + 6, y0: p.hi - 2, y1: p.lo + 2 });
      });
      obst.push({ x0: m.l, x1: px1, y0: y(pb.elo) - 3, y1: y(pb.elo) + 3 });
      // the crossing with the bots
      var a = pt('v000600'), b = pt('v001350');
      if (a && b) {
        var t = (y(pb.elo) - a.y) / (b.y - a.y), cxp = a.x + (b.x - a.x) * t;
        el('circle', { cx: cxp, cy: y(pb.elo), r: 7, fill: 'none', stroke: C.orange, 'stroke-width': 1.5 }, svg);
        var tx = cxp + 14, ty = y(pb.elo) + 30;
        var l1 = narrow ? 'passes the bots' : 'The lineage passes the bots between',
          l2 = hrs ? (narrow ? 'after ' : '') + f1(HOURS.v000600.active) + ' and ' + f1(HOURS.v001350.active) + ' hours of training'
            : narrow ? 'at rollout 600–1,350' : 'rollout 600 and 1,350 (' + bsteps(600) + '–' + bsteps(1350) + ' B agent-steps)';
        if (hrs && narrow) l2 = f1(HOURS.v000600.active) + '–' + f1(HOURS.v001350.active) + ' h of training';
        el('path', { d: 'M' + (cxp + 5) + ',' + (y(pb.elo) + 5) + ' L' + (tx - 3) + ',' + (ty - 10), fill: 'none', stroke: C.faint, 'stroke-width': 1 }, svg);
        halo(txt(svg, tx, ty, l1, 'viz-label', 'start', 'font-size:11px'));
        halo(txt(svg, tx, ty + 14, l2, 'viz-ref-label'));
        obst.push(textBox(tx, ty, l1.length * 5.9, 'start', 11), textBox(tx, ty + 14, l2.length * 5.6, 'start', 11));
      }
      pts.forEach(function (p) {
        var w = { stroke: C.blue, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.42 };
        el('line', Object.assign({ x1: p.x, x2: p.x, y1: p.lo, y2: p.hi }, w), svg);
        el('line', Object.assign({ x1: p.x - 3, x2: p.x + 3, y1: p.lo, y2: p.lo }, w, { 'stroke-width': 1.5 }), svg);
        el('line', Object.assign({ x1: p.x - 3, x2: p.x + 3, y1: p.hi, y2: p.hi }, w, { 'stroke-width': 1.5 }), svg);
      });
      var dots = {};
      pts.forEach(function (p) { dots[p.n] = el('circle', { cx: p.x, cy: p.y, r: 5, fill: C.blue, stroke: '#fff', 'stroke-width': 2 }, svg); });

      // fixed labels at the right end
      var r1 = pt('v049225'), r2 = pt('v049200'), best = pt(BEST);
      if (r1) {
        // on phones v049200 sits only ~23px lower, so v049225's pair of lines moves up
        var o1 = narrow ? -12 : 0;
        fixed(txt(svg, r1.x + 9, r1.y + 4 + o1, 'v049225', 'viz-label', 'start', BOLD));
        fixed(txt(svg, r1.x + 9, r1.y + 18 + o1, f0(FP.v049225.elo) + (narrow ? '' : ' · ' + sgn(FP.v049225.d_ref) + ' vs ' + BEST), 'viz-ref-label'));
      }
      if (r2) {
        var d = FP.v049200;
        fixed(txt(svg, r2.x + 9, r2.y + 4, 'v049200', 'viz-label', 'start', BOLD));
        fixed(txt(svg, r2.x + 9, r2.y + 18, f0(d.elo) + (narrow ? '' : ' · ' + sgn(d.d_ref) + ' vs ' + BEST), 'viz-ref-label'));
        if (!narrow) {
          fixed(txt(svg, r2.x + 9, r2.y + 32, 'the dip: 25 rollouts', 'viz-ref-label'));
          fixed(txt(svg, r2.x + 9, r2.y + 45, 'before v049225', 'viz-ref-label'));
        }
      }
      if (best) {
        var by = best.hi - 8;
        halo(txt(svg, best.x, by, BEST + ' · ' + f0(FP[BEST].elo), 'viz-label', narrow ? 'end' : 'middle', BOLD));
        obst.push(textBox(best.x, by, 100, narrow ? 'end' : 'middle', 12));
      }
      // the fixed labels are obstacles for the auto-placed ones
      [].forEach.call(svg.querySelectorAll('text[data-fixed]'), function (t) { var bb = t.getBBox(); obst.push({ x0: bb.x - 2, x1: bb.x + bb.width + 2, y0: bb.y, y1: bb.y + bb.height }); });
      // auto-placed name labels for the rest
      var skip = { v049225: 1, v049200: 1 }; skip[BEST] = 1;
      var placed = [];
      pts.forEach(function (p) {
        if (skip[p.n]) return;
        var lab = narrow ? p.n.replace(/^v0*/, '') || '0' : p.n;
        var cands = [
          [p.x, p.lo + 13, 'middle'], [p.x + 9, p.y + 4, 'start'], [p.x - 9, p.y + 4, 'end'],
          [p.x, p.hi - 6, 'middle'],
          [p.x + 8, p.lo + 11, 'start'], [p.x - 8, p.lo + 11, 'end'],
          [p.x + 8, p.hi - 4, 'start'], [p.x - 8, p.hi - 4, 'end'],
          // further out, for the 704px text column where the crowded points have less room
          [p.x + 9, p.lo + 21, 'start'], [p.x - 9, p.lo + 21, 'end'], [p.x, p.lo + 25, 'middle'],
          [p.x, p.hi - 17, 'middle'], [p.x - 9, p.hi - 13, 'end'], [p.x + 9, p.hi - 13, 'start'], [p.x, p.lo + 37, 'middle']
        ];
        for (var i = 0; i < cands.length; i++) {
          var c = cands[i], t = halo(txt(svg, c[0], c[1], lab, 'viz-note', c[2], 'font-size:11px')), bb = t.getBBox();
          var bx = { x0: bb.x - 2, x1: bb.x + bb.width + 2, y0: bb.y + 1, y1: bb.y + bb.height - 1 };
          var bad = bx.x0 < m.l + fw + 6 || bx.x1 > W - 2 || bx.y0 < m.t + 2 || bx.y1 > H - m.b - 2 ||
            obst.some(function (o) { return overlaps(bx, o); }) || placed.some(function (o) { return overlaps(bx, o); });
          if (bad) { svg.removeChild(t); continue; }
          placed.push(bx);
          break;
        }
      });
      // hit targets above everything
      pts.forEach(function (p) {
        var hit = el('circle', { cx: p.x, cy: p.y, r: 13, fill: 'transparent', 'data-name': p.n }, svg);
        onHit(hit, function (e) { dots[p.n].setAttribute('r', 6.5); dots[p.n].setAttribute('stroke', C.strong); tip.show(eloTip(p.n), e); },
          function () { dots[p.n].setAttribute('r', 5); dots[p.n].setAttribute('stroke', '#fff'); tip.hide(); });
      });
    }
    setMode('sqrt');
    dataTable(fig, ['Entrant', 'Rollouts', 'Agent-steps', 'Training', 'Wall clock', 'Elo', '95% interval', 'Games', 'Won–lost', 'Median game'],
      BYELO.map(function (n) {
        var p = FP[n], r = record(n), k = kind(n);
        return [nice(n), k === 'ckpt' ? f0(rollout(n)) : '–', k === 'ckpt' ? bsteps(rollout(n)) + ' B' : '–',
          HOURS[n] ? f1(HOURS[n].active) + ' h' : '–', HOURS[n] ? f1(HOURS[n].wall) + ' h' : '–', f0(p.elo),
          n === 'v000000' ? 'anchor' : f0(p.ci_lo) + ' to ' + f0(p.ci_hi), f0(r.g), f0(r.w) + '–' + f0(r.l), DATA.len[n] != null ? f1(DATA.len[n]) + ' min' : '–'];
      }), [0, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    return draw;
  };

  // ------------------------------------------------------------------ boot
  // Only this file's figures; nodes already rendered (script loaded twice) are skipped.

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
