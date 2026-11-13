// Replay figures for Superhuman League of Legends AI (Part 4 - Brokenwings 5v5).
//
//   <div class="viz" data-viz="turn-viewer" data-src="/assets/part4/turn/">  "The turn": two stalemates
//   <div class="viz" data-viz="turn-pair"   data-src="/assets/part4/turn/">  "Before and after": same seed,
//                                                                           old engine vs fixed engine
//
// The nav grid (nav.json) and each recorded game (gNN.js, ~2.5 MB each, they set
// window.GAMES[id]) are only fetched once a figure is near the viewport / a game
// is picked. Plain canvas + DOM, no dependencies.
(function () {
  var TEAM = ['ORDER', 'CHAOS'];
  var C = {
    team: ['#2a78d6', '#eb6834'], wall: '#e7e5df', walk: '#fbfaf7', grass: '#dde9d8',
    monster: '#a8a69e', dead: '#bdbbb4', recall: '#8a3ffc', ink: 'rgba(0,0,0,0.82)',
    ink3: 'rgba(0,0,0,0.45)', outline: 'rgba(0,0,0,0.6)', hpbg: '#dad8d2', hp: '#2e9e44', halo: '#fff'
  };
  var RANGE = 775;
  window.GAMES = window.GAMES || {};

  // ------------------------------------------------------------- helpers
  function h(tag, cls, parent, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    var hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60, ss = s % 60;
    return (hh ? hh + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0');
  }
  function champ(n) { return n.replace(/([a-z])([A-Z])/g, '$1 $2'); }
  function tc(t) { return C.team[t]; }
  function segmented(parent, label, items, onPick) {
    var g = h('div', 'viz-controls', parent); g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
    items.forEach(function (txt, i) { var b = h('button', '', g, txt); b.type = 'button'; b.onclick = function () { onPick(i); }; });
    return function (sel) { [].forEach.call(g.children, function (b, i) { b.setAttribute('aria-pressed', String(i === sel)); }); };
  }
  function addLegend(root) {
    h('div', 'tv-legend', root).innerHTML =
      '<span><i class="tv-lg-hero"></i>hero (number: level, or respawn seconds when dead)</span>' +
      '<span><i class="tv-lg-min"></i>lane minion (×N: a pile)</span>' +
      '<span><i class="tv-lg-mon"></i>jungle monster</span>' +
      '<span><i class="tv-lg-tur"></i>turret and range</span>' +
      '<span><i class="tv-lg-inh"></i>inhibitor / nexus</span>' +
      '<span><i class="tv-lg-rc"></i>recalling</span>' +
      '<span><i class="tv-lg-x"></i>destroyed</span>';
  }

  // ------------------------------------------------------------- shared loading
  var navPromise = null, navCanvas = null, NAV = null;
  function loadNav(base) {
    if (!navPromise) navPromise = fetch(base + 'nav.json')
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (m) { NAV = m.nav; buildNav(); return NAV; })
      .catch(function (e) { navPromise = null; throw e; });
    return navPromise;
  }
  function buildNav() {
    navCanvas = document.createElement('canvas'); navCanvas.width = NAV.nx; navCanvas.height = NAV.ny;
    var g = navCanvas.getContext('2d'), im = g.createImageData(NAV.nx, NAV.ny);
    var hex = function (s) { var v = parseInt(s.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
    var cols = [hex(C.wall), hex(C.walk), hex(C.grass)];
    for (var y = 0; y < NAV.ny; y++) for (var x = 0; x < NAV.nx; x++) {
      var c = cols[NAV.cells.charCodeAt(y * NAV.nx + x) - 48] || cols[0], o = ((NAV.ny - 1 - y) * NAV.nx + x) * 4;
      im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  }
  var gamePromise = {};
  function loadGame(base, id) {
    if (window.GAMES[id]) return Promise.resolve(window.GAMES[id]);
    if (!gamePromise[id]) gamePromise[id] = new Promise(function (ok, bad) {
      var s = document.createElement('script'); s.src = base + id + '.js'; s.async = true;
      s.onload = function () { if (window.GAMES[id]) ok(window.GAMES[id]); else { delete gamePromise[id]; bad(); } };
      s.onerror = function () { s.remove(); delete gamePromise[id]; bad(); };
      document.head.appendChild(s);
    });
    return gamePromise[id];
  }
  function whenNear(root, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { rootMargin: '600px 0px' });
    io.observe(root);
  }

  // ------------------------------------------------------------- one replay
  // opts.full: scoreboard + event list beside the map. Otherwise compact: map,
  // timeline and a summary line (used for the side-by-side pair).
  function Replay(host, opts) {
    var self = this, G = null, fi = 0, playing = false, acc = 0, lastTs = 0, lastCur = -2;
    self.speed = opts.speed || 4;

    var root = h('div', 'tv-replay' + (opts.full ? ' tv-full' : ' tv-compact'), host);
    root.tabIndex = -1;
    var headSum = null;
    if (opts.title) {
      var head = h('div', 'tv-panel-head', root);
      h('span', 'tv-panel-title', head, opts.title);
      headSum = h('span', 'tv-panel-sum', head);
    }
    var grid = h('div', opts.full ? 'tv-grid' : 'tv-solo', root);
    var mapbox = h('div', 'tv-mapbox', grid);
    var map = h('canvas', '', mapbox); map.setAttribute('aria-label', 'Top-down map of the recorded game');
    var overlay = h('div', 'tv-overlay on', mapbox, 'Loading…');
    var mx = map.getContext('2d');

    var teamEls = null, structs, log = null;
    if (opts.full) {
      var side = h('div', 'tv-side', grid);
      teamEls = [0, 1].map(function (t) {
        var box = h('div', 'tv-team', side); box.style.setProperty('--c', tc(t));
        var th = h('div', 'tv-team-head', box);
        h('span', '', th, TEAM[t]);
        var sum = h('span', 'tv-team-sum', th), rows = [];
        for (var i = 0; i < 5; i++) {
          var r = h('div', 'tv-row', box), name = h('span', 'tv-name', r), lvl = h('span', 'tv-lvl', r);
          var hp = h('span', 'tv-hp', r), hpf = h('i', '', hp), kda = h('span', 'tv-kda', r);
          rows.push({ r: r, name: name, lvl: lvl, hp: hp, hpf: hpf, kda: kda });
        }
        return { sum: sum, rows: rows };
      });
      structs = h('div', 'tv-structs', side);
      h('div', 'tv-side-title', side, 'Events');
      log = h('div', 'tv-events', side);
    }

    var ctr = h('div', 'tv-controls', root);
    var play = h('button', 'tv-play', ctr); play.type = 'button';
    var clock = h('span', 'tv-clock', ctr, '–');
    var track = h('div', 'tv-track', ctr);
    track.tabIndex = 0; track.setAttribute('role', 'slider'); track.setAttribute('aria-label', 'Game time');
    var rail = h('div', 'tv-rail', track), fill = h('div', 'tv-fill', rail);
    var ticks = h('div', 'tv-ticks', track), thumb = h('div', 'tv-thumb', track);
    if (opts.speeds) {
      var syncSpeed = segmented(ctr, 'Playback speed', opts.speeds.map(function (v) { return v + '×'; }),
        function (i) { self.speed = opts.speeds[i]; syncSpeed(i); });
      syncSpeed(opts.speeds.indexOf(self.speed));
    }
    if (!opts.full) structs = h('div', 'tv-structs tv-structs-line', root);

    function syncPlay() {
      play.innerHTML = playing ? '<span aria-hidden="true">&#10074;&#10074;</span>' : '<span aria-hidden="true">&#9654;</span>';
      play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    syncPlay();

    // ---- map
    var U = 1, K = 1, font = getComputedStyle(host).fontFamily;
    function sizeMap() {
      var w = mapbox.clientWidth; if (!w) return;
      var d = Math.min(2, window.devicePixelRatio || 1), px = Math.round(w * d);
      if (map.width !== px) { map.width = px; map.height = px; }
      U = px / w;
      K = Math.max(0.62, Math.min(1, w / 560));   // marker scale: smaller on small maps
    }
    function X(x) { return (x - NAV.minx) / (NAV.cell * NAV.nx) * map.width; }
    function Y(y) { return map.width - (y - NAV.miny) / (NAV.cell * NAV.ny) * map.width; }
    function label(txt, x, y, sz) {
      mx.font = '700 ' + (sz * U) + 'px ' + font;
      mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillStyle = '#fff';
      mx.fillText(txt, x, y + 0.5 * U);
    }
    function crossed(x, y, r) {
      mx.strokeStyle = C.dead; mx.lineWidth = 1.5 * U;
      mx.strokeRect(x - r, y - r, 2 * r, 2 * r);
      mx.beginPath(); mx.moveTo(x - r, y - r); mx.lineTo(x + r, y + r); mx.moveTo(x + r, y - r); mx.lineTo(x - r, y + r); mx.stroke();
    }
    function hpbar(x, y, w, pct) {
      var hh = 3 * U;
      mx.fillStyle = C.outline; mx.fillRect(x - w / 2 - U * 0.75, y - hh / 2 - U * 0.75, w + 1.5 * U, hh + 1.5 * U);
      mx.fillStyle = C.hpbg; mx.fillRect(x - w / 2, y - hh / 2, w, hh);
      mx.fillStyle = C.hp; mx.fillRect(x - w / 2, y - hh / 2, w * Math.max(0, pct) / 100, hh);
    }
    function drawMap() {
      var f = G.frames[fi], W = map.width, u = U * K, NT = G.tur.length, i, x, y;
      mx.imageSmoothingEnabled = false; mx.drawImage(navCanvas, 0, 0, W, W);
      var rr = RANGE / (NAV.cell * NAV.nx) * W;
      G.tur.forEach(function (t, i) {
        if (t.shrine || f.s[i] < 0) return;
        mx.beginPath(); mx.arc(X(t.x), Y(t.y), rr, 0, 7);
        mx.globalAlpha = 0.06; mx.fillStyle = tc(t.tm); mx.fill();
        mx.globalAlpha = 0.35; mx.strokeStyle = tc(t.tm); mx.lineWidth = U; mx.stroke(); mx.globalAlpha = 1;
      });
      G.bld.forEach(function (b, i) {
        var hp = f.s[NT + i], x = X(b.x), y = Y(b.y), r = (b.nx ? 12 : 9) * u;
        if (hp < 0) { crossed(x, y, r * 0.75); return; }
        mx.save(); mx.translate(x, y); mx.rotate(Math.PI / 4); var q = r * 0.75;
        mx.fillStyle = tc(b.tm); mx.fillRect(-q, -q, 2 * q, 2 * q);
        mx.strokeStyle = C.outline; mx.lineWidth = 1.5 * U; mx.strokeRect(-q, -q, 2 * q, 2 * q); mx.restore();
        hpbar(x, y - r - 4 * u, (b.nx ? 26 : 20) * u, hp);
      });
      G.tur.forEach(function (t, i) {
        if (t.shrine) return;
        var hp = f.s[i], x = X(t.x), y = Y(t.y), r = 6 * u;
        if (hp < 0) { crossed(x, y, r); return; }
        mx.fillStyle = tc(t.tm); mx.fillRect(x - r, y - r, 2 * r, 2 * r);
        mx.strokeStyle = C.outline; mx.lineWidth = 1.5 * U; mx.strokeRect(x - r, y - r, 2 * r, 2 * r);
        hpbar(x, y - r - 4 * u, 18 * u, hp);
      });
      mx.fillStyle = C.monster; mx.strokeStyle = C.outline; mx.lineWidth = 0.8 * U;
      for (i = 0; i < f.j.length; i += 2) { mx.beginPath(); mx.arc(X(f.j[i] * 10), Y(f.j[i + 1] * 10), 4 * u, 0, 7); mx.fill(); mx.stroke(); }
      var ms = 2.8 * u;
      for (i = 0; i < f.m.length; i += 3) {
        x = X(f.m[i] * 10); y = Y(f.m[i + 1] * 10);
        mx.fillStyle = tc(f.m[i + 2]); mx.fillRect(x - ms, y - ms, 2 * ms, 2 * ms); mx.strokeRect(x - ms, y - ms, 2 * ms, 2 * ms);
      }
      // minions that share a spot draw as one square, so label piles with their size
      var piles = {};
      for (i = 0; i < f.m.length; i += 3) {
        var key = Math.round(f.m[i] / 40) + ',' + Math.round(f.m[i + 1] / 40) + ',' + f.m[i + 2];
        var pl = piles[key] || (piles[key] = { n: 0, x: f.m[i], y: f.m[i + 1], t: f.m[i + 2] }); pl.n++;
      }
      Object.keys(piles).forEach(function (k) {
        var pl = piles[k]; if (pl.n < 5) return;
        var x = X(pl.x * 10) + 6 * u, y = Y(pl.y * 10) + 8 * u, txt = '×' + pl.n;
        mx.font = '700 ' + (10 * K * U) + 'px ' + font;
        var w = mx.measureText(txt).width + 6 * U, hh = 13 * K * U;
        mx.fillStyle = tc(pl.t); mx.fillRect(x, y - hh / 2, w, hh);
        mx.textAlign = 'left'; mx.textBaseline = 'middle'; mx.fillStyle = '#fff'; mx.fillText(txt, x + 3 * U, y + 0.5 * U);
      });
      for (i = 0; i < f.p.length; i += 3) {
        mx.fillStyle = tc(f.p[i + 2]); mx.beginPath(); mx.arc(X(f.p[i] * 10), Y(f.p[i + 1] * 10), 2 * u, 0, 7); mx.fill();
      }
      // heroes: dead ones underneath, positions eased towards the next frame while playing
      var nf = (playing && acc > 0 && fi + 1 < G.frames.length) ? G.frames[fi + 1] : null;
      var order = f.h.map(function (_, i) { return i; }).sort(function (a, b) { return (f.h[b][4] >= 0) - (f.h[a][4] >= 0); });
      order.forEach(function (i) {
        var hr = f.h[i], dead = hr[4] >= 0, team = i < 5 ? 0 : 1, hx = hr[0], hy = hr[1];
        if (nf && !dead && nf.h[i][4] < 0 && Math.hypot(nf.h[i][0] - hx, nf.h[i][1] - hy) < 120) {
          hx += (nf.h[i][0] - hx) * acc; hy += (nf.h[i][1] - hy) * acc;
        }
        var x = X(hx * 10), y = Y(hy * 10), r = 8.5 * u;
        y = Math.max(y, r + 15 * u); x = Math.max(28 * u, Math.min(map.width - 28 * u, x));   // keep fountain heroes' names inside the map
        if (!dead && hr[12]) {
          mx.beginPath(); mx.arc(x, y, r + 4 * u, 0, 7); mx.setLineDash([3 * U, 2 * U]);
          mx.strokeStyle = C.recall; mx.lineWidth = 2 * U; mx.stroke(); mx.setLineDash([]);
        }
        mx.beginPath(); mx.arc(x, y, r, 0, 7); mx.fillStyle = dead ? C.dead : tc(team); mx.fill();
        mx.lineWidth = 1.5 * U; mx.strokeStyle = C.halo; mx.stroke();
        label(String(dead ? hr[4] : hr[3]), x, y, 9 * K);
        var nm = champ(G.champs[i]);
        mx.font = '600 ' + (10 * K * U) + 'px ' + font;
        mx.lineWidth = 3 * U; mx.strokeStyle = C.halo; mx.lineJoin = 'round';
        mx.strokeText(nm, x, y - r - 9 * u); mx.fillStyle = dead ? C.ink3 : C.ink; mx.fillText(nm, x, y - r - 9 * u);
        if (!dead) hpbar(x, y - r - 3.5 * u, 20 * u, hr[2]);
      });
    }

    // ---- side panel / summary line
    function evText(e) {
      if (e.k === 'recall') return champ(e.v) + ' starts Recall';
      if (e.k === 'kill') return (e.by ? champ(e.by) : 'a turret, minion or monster') + ' kills ' + champ(e.v);
      if (e.k === 'turret') return 'turret down: ' + e.n;
      return TEAM[e.vt] + ' ' + (e.k === 'nexus' ? 'nexus' : 'inhibitor') + (e.up ? ' respawns' : ' destroyed');
    }
    function buildSide() {
      if (teamEls) teamEls.forEach(function (te, t) {
        te.rows.forEach(function (row, k) { row.name.textContent = champ(G.champs[t * 5 + k]); });
      });
      if (log) {
        log.innerHTML = '';
        if (!G.events.length) h('div', 'tv-ev future', log, 'No events in this stretch.');
        G.events.forEach(function (e) {
          var d = h('div', 'tv-ev' + (e.k === 'recall' ? ' rc' : ''), log);
          d.style.setProperty('--c', tc(e.k === 'recall' ? e.vt : 1 - e.vt));
          h('span', 'tv-ev-t', d, fmt(e.t));
          h('span', '', d, evText(e));
          d.title = 'Jump to ' + fmt(e.t);
          d.onclick = function () { setFrame(Math.max(0, e.f - 8)); };
        });
      }
      ticks.innerHTML = '';
      var n = G.frames.length - 1;
      G.events.forEach(function (e) {
        if (e.k === 'recall') return;
        var tk = h('span', 'tv-tick' + (e.k === 'kill' ? '' : ' big'), ticks);
        tk.style.left = (e.f / n * 100) + '%';
        tk.style.setProperty('--c', tc(1 - e.vt));
      });
    }
    function drawSide() {
      var f = G.frames[fi], NT = G.tur.length, kills = [0, 0];
      [0, 1].forEach(function (t) {
        f.h.slice((1 - t) * 5, (1 - t) * 5 + 5).forEach(function (hr) { kills[t] += hr[6]; });
        if (!teamEls) return;
        var te = teamEls[t], cs = 0;
        te.rows.forEach(function (row, k) {
          var hr = f.h[t * 5 + k], dead = hr[4] >= 0;
          row.r.classList.toggle('dead', dead);
          row.lvl.textContent = hr[3];
          row.hpf.style.width = (dead ? 0 : hr[2]) + '%';
          row.hp.title = dead ? 'dead, respawns in ' + hr[4] + ' s' : 'health ' + hr[2] + '%';
          row.kda.textContent = hr[5] + '/' + hr[6] + '/' + hr[7];
          cs += hr[9];
        });
        te.sum.textContent = kills[t] + ' kills · ' + cs.toLocaleString() + ' CS';
      });
      var tu = [0, 0], inh = [0, 0];
      G.tur.forEach(function (t, i) { if (!t.shrine && f.s[i] >= 0) tu[t.tm]++; });
      G.bld.forEach(function (b, i) { if (!b.nx && f.s[NT + i] >= 0) inh[b.tm]++; });
      var pair = function (a) { return '<b class="o">' + a[0] + '</b>–<b class="c">' + a[1] + '</b>'; };
      structs.innerHTML = (opts.full ? '' : 'Kills ' + pair(kills) + ' · ') +
        (opts.full ? 'Turrets ' : 'turrets ') + pair(tu) + (opts.full ? ' of 11' : '') + ' · inhibitors ' + pair(inh) + (opts.full ? ' of 3' : '') + ' · minions <b>' + (f.m.length / 3) + '</b>';
      if (!log) return;
      var cur = -1, evs = log.children;
      G.events.forEach(function (e, i) { if (e.f <= fi) cur = i; });
      for (var i = 0; i < Math.min(evs.length, G.events.length); i++) {
        evs[i].classList.toggle('future', G.events[i].f > fi);
        evs[i].classList.toggle('cur', i === cur);
      }
      if (cur !== lastCur) {
        lastCur = cur;
        var el = evs[Math.max(0, cur)];
        if (el) log.scrollTop = Math.max(0, el.offsetTop - log.offsetTop - log.clientHeight / 2);
      }
    }

    // ---- playback
    function render() {
      if (!G || !NAV) return;
      drawMap(); drawSide();
      var n = G.frames.length - 1, p = fi / n * 100;
      fill.style.width = p + '%'; thumb.style.left = p + '%';
      clock.textContent = fmt(G.frames[fi].t);
      track.setAttribute('aria-valuemin', 0); track.setAttribute('aria-valuemax', n);
      track.setAttribute('aria-valuenow', fi); track.setAttribute('aria-valuetext', fmt(G.frames[fi].t));
    }
    function setFrame(i) { if (!G) return; fi = Math.max(0, Math.min(G.frames.length - 1, i)); acc = 0; render(); }
    function setPlaying(p) {
      if (p && !G) return;
      playing = p; syncPlay();
      if (p) { lastTs = performance.now(); if (fi >= G.frames.length - 1) fi = 0; requestAnimationFrame(tick); }
      else render();
    }
    function tick(ts) {
      if (!playing) return;
      var dt = Math.min(0.25, (ts - lastTs) / 1000); lastTs = ts;
      acc += dt * self.speed / (G.step * G.decision_s);
      var adv = Math.floor(acc);
      if (adv > 0) {
        acc -= adv; fi = Math.min(G.frames.length - 1, fi + adv);
        if (fi >= G.frames.length - 1) { acc = 0; render(); setPlaying(false); return; }
      }
      render();
      requestAnimationFrame(tick);
    }
    play.onclick = function () { setPlaying(!playing); };
    function frameAt(ev) {
      var r = track.getBoundingClientRect();
      return Math.round(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * (G.frames.length - 1));
    }
    track.addEventListener('pointerdown', function (ev) {
      if (!G) return; track.setPointerCapture(ev.pointerId); track.dataset.drag = '1'; setFrame(frameAt(ev));
    });
    track.addEventListener('pointermove', function (ev) { if (track.dataset.drag) setFrame(frameAt(ev)); });
    track.addEventListener('pointerup', function () { delete track.dataset.drag; });
    track.addEventListener('pointercancel', function () { delete track.dataset.drag; });
    // keys only while focus is inside the replay, so the page still scrolls normally
    root.addEventListener('keydown', function (e) {
      if (!G) return;
      var step = e.shiftKey ? 30 : 3;
      if (e.key === 'ArrowRight') setFrame(fi + step);
      else if (e.key === 'ArrowLeft') setFrame(fi - step);
      else if (e.key === 'Home') setFrame(0);
      else if (e.key === 'End') setFrame(G.frames.length - 1);
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') setPlaying(!playing);
      else return;
      e.preventDefault();
    });
    mapbox.addEventListener('click', function () { if (G) { root.focus({ preventScroll: true }); setPlaying(!playing); } });
    new ResizeObserver(function () { sizeMap(); render(); }).observe(mapbox);

    function status(msg) {
      overlay.textContent = msg || ''; overlay.classList.toggle('on', !!msg);
      root.classList.toggle('tv-pending', !!msg);
    }

    // ---- public
    var want = null;
    self.show = function (base, id, summary) {
      setPlaying(false); want = id;
      if (headSum) headSum.textContent = summary || '';
      status('Loading…');
      Promise.all([loadNav(base), loadGame(base, id)]).then(function (r) {
        if (want !== id) return;
        G = r[1]; fi = 0; acc = 0; lastCur = -2;
        status(''); sizeMap(); buildSide(); render();
      }, function () { if (want === id) status('Could not load this game. Pick it again to retry.'); });
    };
  }

  // ------------------------------------------------------------- figure: "The turn"
  function mountTurn(root, base) {
    var GAMES = [
      { id: 'g01', label: 'Standoff',
        blurb: 'Game 1, normal roster. Both bases mostly intact; the ten heroes spend their time in the jungle.' },
      { id: 'g02', label: 'Locked nexus',
        blurb: 'Game 2, swapped roster. ORDER has destroyed every CHAOS turret and sits in the CHAOS base, killing inhibitors as they respawn and never touching the nexus.' }
    ];
    var gi = 0, started = false, bar = h('div', 'tv-bar', root);
    var sync = segmented(bar, 'Game', GAMES.map(function (g) { return g.label; }), function (i) { pick(i); });
    var blurb = h('span', 'tv-blurb', bar);
    var rp = new Replay(root, { full: true, speeds: [1, 4, 16], speed: 4 });
    addLegend(root);
    function pick(i) {
      gi = i; sync(i); blurb.textContent = GAMES[i].blurb;
      if (started) rp.show(base, GAMES[i].id);
    }
    pick(0);
    whenNear(root, function () { started = true; pick(gi); });
  }

  // ------------------------------------------------------------- figure: before / after
  function mountPair(root, base) {
    var SEEDS = [
      { label: 'Seed 1001', before: 'g01', after: 'g03', afterSum: 'CHAOS wins at 44:13',
        blurb: 'Normal roster. Before the fixes, still going at two hours with every ORDER minion in one pile. After, CHAOS takes the ORDER nexus at 44:13.' },
      { label: 'Seed 1002', before: 'g02', after: 'g04', afterSum: 'CHAOS wins at 56:12',
        blurb: 'Swapped roster. Before, ORDER sits in the CHAOS base with the nexus locked. After, the CHAOS nexus opens at 37:54 and locks again when its inhibitor respawns at 38:30; CHAOS takes the ORDER nexus at 56:12.' }
    ];
    var SPEEDS = [4, 16, 64];
    var si = 0, started = false, bar = h('div', 'tv-bar', root);
    var sync = segmented(bar, 'Seed', SEEDS.map(function (s) { return s.label; }), function (i) { pick(i); });
    var blurb = h('span', 'tv-blurb', bar);
    var pairEl = h('div', 'tv-pair', root);
    var A = new Replay(pairEl, { title: 'Before: 12 Nov engine', speed: 16 });
    var B = new Replay(pairEl, { title: 'After: fixed engine', speed: 16 });
    var foot = h('div', 'tv-pair-foot', root);
    h('span', '', foot, 'Playback speed, both replays');
    var syncSp = segmented(foot, 'Playback speed for both replays', SPEEDS.map(function (v) { return v + '×'; }),
      function (i) { A.speed = B.speed = SPEEDS[i]; syncSp(i); });
    syncSp(1);
    addLegend(root);
    function pick(i) {
      si = i; sync(i); blurb.textContent = SEEDS[i].blurb;
      if (!started) return;
      A.show(base, SEEDS[i].before, 'from 2:00:00, still running');
      B.show(base, SEEDS[i].after, 'whole game, ' + SEEDS[i].afterSum);
    }
    pick(0);
    whenNear(root, function () { started = true; pick(si); });
  }

  [].forEach.call(document.querySelectorAll('.viz[data-viz="turn-viewer"], .viz[data-viz="turn-pair"]'), function (root) {
    var base = (root.getAttribute('data-src') || '/assets/part4/turn/').replace(/\/?$/, '/');
    root.classList.add('tv', 'ready');
    (root.getAttribute('data-viz') === 'turn-pair' ? mountPair : mountTurn)(root, base);
  });
})();
