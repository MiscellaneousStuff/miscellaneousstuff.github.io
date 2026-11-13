// Stalemate replay figure for "The turn" in Superhuman League of Legends AI
// (Part 4 - Brokenwings 5v5).
//
// Renders <div class="viz" data-viz="turn-viewer" data-src="/assets/part4/turn/">.
// The nav grid (nav.json) and each recorded game (g01.js, g02.js, ~2.5 MB each,
// they set window.GAMES[id]) are only fetched once the figure is near the
// viewport / a game is picked. Plain canvas + DOM, no dependencies.
(function () {
  var root = document.querySelector('.viz[data-viz="turn-viewer"]');
  if (!root) return;
  var BASE = (root.getAttribute('data-src') || '/assets/part4/turn/').replace(/\/?$/, '/');

  var GAMES = [
    { id: 'g01', label: 'Standoff',
      blurb: 'Game 1, normal roster. Both bases mostly intact; the ten heroes spend their time in the jungle.' },
    { id: 'g02', label: 'Locked nexus',
      blurb: 'Game 2, swapped roster. ORDER has destroyed every CHAOS turret and sits in the CHAOS base, killing inhibitors as they respawn and never touching the nexus.' }
  ];
  var TEAM = ['ORDER', 'CHAOS'];
  var C = {
    team: ['#2a78d6', '#eb6834'], wall: '#e7e5df', walk: '#fbfaf7', grass: '#dde9d8',
    monster: '#a8a69e', dead: '#bdbbb4', recall: '#8a3ffc', ink: 'rgba(0,0,0,0.82)',
    ink3: 'rgba(0,0,0,0.45)', outline: 'rgba(0,0,0,0.6)', hpbg: '#dad8d2', hp: '#2e9e44', halo: '#fff'
  };
  var SPEEDS = [1, 4, 16];
  var RANGE = 775;

  window.GAMES = window.GAMES || {};
  var NAV = null, navC = null, G = null, gi = 0, fi = 0;
  var playing = false, speed = 4, acc = 0, lastTs = 0;

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

  // ------------------------------------------------------------- DOM
  root.classList.add('tv', 'ready');
  root.tabIndex = -1;
  var bar = h('div', 'tv-bar', root);
  var pick = h('div', 'viz-controls', bar); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Game');
  var blurb = h('span', 'tv-blurb', bar);
  GAMES.forEach(function (g, i) {
    var b = h('button', '', pick, g.label); b.type = 'button';
    b.onclick = function () { if (i !== gi || !G) loadGame(i); };
  });

  var grid = h('div', 'tv-grid', root);
  var mapbox = h('div', 'tv-mapbox', grid);
  var map = h('canvas', '', mapbox); map.setAttribute('aria-label', 'Top-down map of the recorded game');
  var overlay = h('div', 'tv-overlay on', mapbox, 'Loading…');
  var mx = map.getContext('2d');

  var side = h('div', 'tv-side', grid);
  var teamEls = [0, 1].map(function (t) {
    var box = h('div', 'tv-team', side); box.style.setProperty('--c', tc(t));
    var head = h('div', 'tv-team-head', box);
    h('span', '', head, TEAM[t]);
    var sum = h('span', 'tv-team-sum', head);
    var rows = [];
    for (var i = 0; i < 5; i++) {
      var r = h('div', 'tv-row', box);
      var name = h('span', 'tv-name', r);
      var lvl = h('span', 'tv-lvl', r);
      var hp = h('span', 'tv-hp', r); var hpf = h('i', '', hp);
      var kda = h('span', 'tv-kda', r);
      rows.push({ r: r, name: name, lvl: lvl, hp: hp, hpf: hpf, kda: kda });
    }
    return { sum: sum, rows: rows };
  });
  var structs = h('div', 'tv-structs', side);
  h('div', 'tv-side-title', side, 'Events');
  var log = h('div', 'tv-events', side);

  var ctr = h('div', 'tv-controls', root);
  var play = h('button', 'tv-play', ctr); play.type = 'button';
  var clock = h('span', 'tv-clock', ctr, '–');
  var track = h('div', 'tv-track', ctr);
  track.tabIndex = 0; track.setAttribute('role', 'slider'); track.setAttribute('aria-label', 'Game time');
  var rail = h('div', 'tv-rail', track), fill = h('div', 'tv-fill', rail);
  var ticks = h('div', 'tv-ticks', track), thumb = h('div', 'tv-thumb', track);
  var sp = h('div', 'viz-controls tv-speed', ctr); sp.setAttribute('role', 'group'); sp.setAttribute('aria-label', 'Playback speed');
  SPEEDS.forEach(function (v) {
    var b = h('button', '', sp, v + '×'); b.type = 'button';
    b.onclick = function () { speed = v; syncButtons(); };
  });

  var legend = h('div', 'tv-legend', root);
  legend.innerHTML =
    '<span><i class="tv-lg-hero"></i>hero (number: level, or respawn seconds when dead)</span>' +
    '<span><i class="tv-lg-min"></i>lane minion</span>' +
    '<span><i class="tv-lg-mon"></i>jungle monster</span>' +
    '<span><i class="tv-lg-tur"></i>turret and range</span>' +
    '<span><i class="tv-lg-inh"></i>inhibitor / nexus</span>' +
    '<span><i class="tv-lg-rc"></i>recalling</span>' +
    '<span><i class="tv-lg-x"></i>destroyed</span>';

  function syncButtons() {
    [].forEach.call(pick.children, function (b, i) { b.setAttribute('aria-pressed', String(i === gi)); });
    [].forEach.call(sp.children, function (b, i) { b.setAttribute('aria-pressed', String(SPEEDS[i] === speed)); });
    play.innerHTML = playing ? '<span aria-hidden="true">&#10074;&#10074;</span>' : '<span aria-hidden="true">&#9654;</span>';
    play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }
  syncButtons();
  blurb.textContent = GAMES[0].blurb;

  // ------------------------------------------------------------- map
  var WX0, WY0, WW, WH, U = 1, K = 1;
  function buildNav() {
    navC = document.createElement('canvas'); navC.width = NAV.nx; navC.height = NAV.ny;
    var g = navC.getContext('2d'), im = g.createImageData(NAV.nx, NAV.ny);
    var hex = function (s) { var v = parseInt(s.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
    var cols = [hex(C.wall), hex(C.walk), hex(C.grass)];
    for (var y = 0; y < NAV.ny; y++) for (var x = 0; x < NAV.nx; x++) {
      var c = cols[NAV.cells.charCodeAt(y * NAV.nx + x) - 48] || cols[0], o = ((NAV.ny - 1 - y) * NAV.nx + x) * 4;
      im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    WX0 = NAV.minx; WY0 = NAV.miny; WW = NAV.cell * NAV.nx; WH = NAV.cell * NAV.ny;
  }
  function sizeMap() {
    var w = mapbox.clientWidth; if (!w) return;
    var d = Math.min(2, window.devicePixelRatio || 1), px = Math.round(w * d);
    if (map.width !== px) { map.width = px; map.height = px; }
    U = px / w;
    K = Math.max(0.62, Math.min(1, w / 560));   // marker scale: smaller on small maps
  }
  function X(x) { return (x - WX0) / WW * map.width; }
  function Y(y) { return map.width - (y - WY0) / WH * map.width; }
  function label(txt, x, y, sz, col) {
    mx.font = '700 ' + (sz * U) + 'px ' + getComputedStyle(root).fontFamily;
    mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.fillStyle = col || '#fff';
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
    var f = G.frames[fi], W = map.width, u = U * K, NT = G.tur.length, i;
    mx.imageSmoothingEnabled = false; mx.drawImage(navC, 0, 0, W, W);
    var rr = RANGE / WW * W;
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
      var x = X(f.m[i] * 10), y = Y(f.m[i + 1] * 10);
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
      var x = X(pl.x * 10) + 6 * u, y = Y(pl.y * 10) + 8 * u, txt = '\u00d7' + pl.n;
      mx.font = '700 ' + (10 * K * U) + 'px ' + getComputedStyle(root).fontFamily;
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
      mx.font = '600 ' + (10 * K * U) + 'px ' + getComputedStyle(root).fontFamily;
      mx.lineWidth = 3 * U; mx.strokeStyle = C.halo; mx.lineJoin = 'round';
      mx.strokeText(nm, x, y - r - 9 * u); mx.fillStyle = dead ? C.ink3 : C.ink; mx.fillText(nm, x, y - r - 9 * u);
      if (!dead) hpbar(x, y - r - 3.5 * u, 20 * u, hr[2]);
    });
  }

  // ------------------------------------------------------------- side panel
  function buildSide() {
    teamEls.forEach(function (te, t) {
      te.rows.forEach(function (row, k) { row.name.textContent = champ(G.champs[t * 5 + k]); });
    });
    log.innerHTML = '';
    if (!G.events.length) h('div', 'tv-ev future', log, 'No events in this stretch.');
    G.events.forEach(function (e) {
      var d = h('div', 'tv-ev' + (e.k === 'recall' ? ' rc' : ''), log);
      var who = e.k === 'recall' ? e.vt : 1 - e.vt;
      d.style.setProperty('--c', tc(who));
      h('span', 'tv-ev-t', d, fmt(e.t));
      h('span', '', d, evText(e));
      d.title = 'Jump to ' + fmt(e.t);
      d.onclick = function () { setFrame(Math.max(0, e.f - 8)); };
    });
    ticks.innerHTML = '';
    var n = G.frames.length - 1;
    G.events.forEach(function (e) {
      if (e.k === 'recall') return;
      var tk = h('span', 'tv-tick' + (e.k === 'kill' ? '' : ' big'), ticks);
      tk.style.left = (e.f / n * 100) + '%';
      tk.style.setProperty('--c', tc(1 - e.vt));
    });
  }
  function evText(e) {
    if (e.k === 'recall') return champ(e.v) + ' starts Recall';
    if (e.k === 'kill') return (e.by ? champ(e.by) : 'a turret, minion or monster') + ' kills ' + champ(e.v);
    if (e.k === 'turret') return 'turret down: ' + e.n;
    return TEAM[e.vt] + ' ' + (e.k === 'nexus' ? 'nexus' : 'inhibitor') + (e.up ? ' respawns' : ' destroyed');
  }
  var lastCur = -2;
  function drawSide() {
    var f = G.frames[fi], NT = G.tur.length;
    [0, 1].forEach(function (t) {
      var te = teamEls[t], kills = 0, cs = 0;
      te.rows.forEach(function (row, k) {
        var hr = f.h[t * 5 + k], dead = hr[4] >= 0;
        row.r.classList.toggle('dead', dead);
        row.lvl.textContent = hr[3];
        row.hpf.style.width = (dead ? 0 : hr[2]) + '%';
        row.hp.title = dead ? 'dead, respawns in ' + hr[4] + ' s' : 'health ' + hr[2] + '%';
        row.kda.textContent = hr[5] + '/' + hr[6] + '/' + hr[7];
        cs += hr[9];
      });
      f.h.slice((1 - t) * 5, (1 - t) * 5 + 5).forEach(function (hr) { kills += hr[6]; });
      te.sum.textContent = kills + ' kills · ' + cs.toLocaleString() + ' CS';
    });
    var tu = [0, 0], inh = [0, 0];
    G.tur.forEach(function (t, i) { if (!t.shrine && f.s[i] >= 0) tu[t.tm]++; });
    G.bld.forEach(function (b, i) { if (!b.nx && f.s[NT + i] >= 0) inh[b.tm]++; });
    structs.innerHTML = 'Turrets <b class="o">' + tu[0] + '</b>–<b class="c">' + tu[1] + '</b> of 11 · inhibitors <b class="o">' +
      inh[0] + '</b>–<b class="c">' + inh[1] + '</b> of 3 · minions <b>' + (f.m.length / 3) + '</b>';
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

  // ------------------------------------------------------------- playback
  function render() {
    if (!G) return;
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
    playing = p; syncButtons();
    if (p) { lastTs = performance.now(); if (fi >= G.frames.length - 1) fi = 0; requestAnimationFrame(tick); }
    else render();
  }
  function tick(ts) {
    if (!playing) return;
    var dt = Math.min(0.25, (ts - lastTs) / 1000); lastTs = ts;
    acc += dt * speed / (G.step * G.decision_s);
    var adv = Math.floor(acc);
    if (adv > 0) { acc -= adv; fi = Math.min(G.frames.length - 1, fi + adv); if (fi >= G.frames.length - 1) { acc = 0; render(); setPlaying(false); return; } }
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

  // keys only while focus is inside the figure, so the page still scrolls normally
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

  // ------------------------------------------------------------- loading
  function status(msg) { overlay.textContent = msg || ''; overlay.classList.toggle('on', !!msg); root.classList.toggle('tv-pending', !!msg); }
  function loadScript(src, ok, bad) {
    var s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = ok; s.onerror = function () { s.remove(); bad(); };
    document.head.appendChild(s);
  }
  function loadGame(i) {
    setPlaying(false); gi = i; syncButtons(); blurb.textContent = GAMES[i].blurb;
    if (!NAV) return;   // start() picks up gi once the map is in
    var id = GAMES[i].id;
    if (window.GAMES[id]) { showGame(); return; }
    status('Loading game ' + (i + 1) + ' (about 2.5 MB)…');
    loadScript(BASE + id + '.js', function () {
      if (gi !== i) return;
      if (window.GAMES[id]) showGame(); else status('Game ' + (i + 1) + ' loaded but held no data.');
    }, function () { if (gi === i) status('Could not load game ' + (i + 1) + '. Pick it again to retry.'); });
  }
  function showGame() {
    G = window.GAMES[GAMES[gi].id]; fi = 0; acc = 0; lastCur = -2;
    status(''); sizeMap(); buildSide(); render();
  }
  function start() {
    status('Loading map…');
    fetch(BASE + 'nav.json').then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (m) { NAV = m.nav; buildNav(); loadGame(gi); })
      .catch(function () { status('Could not load the map.'); });
  }

  new ResizeObserver(function () { sizeMap(); render(); }).observe(mapbox);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: '600px 0px' });
    io.observe(root);
  } else start();
})();
