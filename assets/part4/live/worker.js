// fastsim 5v5 in the browser (issue #30): the Web Worker that owns the engine. It loads fastsim.wasm.gz (the Rust engine +
// the policy, fastsim_rs/src/web.rs + web_policy.rs), world.bin.gz (the ready-to-step world, web/dump_snapshot.py) and
// policy.bin.gz (the actor weights, web/export_policy.py), then plays one game: per decision the policy reads the
// observation and samples actions (web_pol_act), the engine steps 4 ticks (web_step). Nothing is precomputed.
//
// Frame record (web_frame_ptr, f32): header [T ms, done, ep_end, ep_win, ep_kind, step_count, 10, n_struct, n_minions,
// n_monsters, n_missiles, T - tbase], then per hero (20): x y hp mhp mp mmp level alive kills deaths assists gold cs
// respawn_s face_x face_y jungle_cs exp net_worth recalling; per structure (6: 24 turrets then 8 buildings): x y hp mhp
// alive team; per lane minion (5): x y hp mhp team; per monster (4): x y hp mhp; per missile (3): x y team.
"use strict";
const FH = 12, HF = 20, SF = 6;
const DECISION_S = 4 / 30;                    // one decision = 4 engine ticks of 1/30 s game time
let X = null, meta = null;
let running = false, speed = 1, seed = 1, nDec = 0, over = false;
let anchorWall = 0, anchorDec = 0, timer = 0;
let prev = null, events = [], newEvents = [];
let perf = { eng: 0, pol: 0, n: 0, wall0: 0, dec0: 0 };
let fetched = 0;                              // bytes received (compressed as served)

async function bytes(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  let b = new Uint8Array(await r.arrayBuffer());
  fetched += b.length;
  if (b[0] === 0x1f && b[1] === 0x8b) {             // gzip (a server that sends Content-Encoding: gzip has already inflated it)
    const s = new Blob([b]).stream().pipeThrough(new DecompressionStream("gzip"));
    b = new Uint8Array(await new Response(s).arrayBuffer());
  }
  return b;
}
function put(b) { const p = X.web_alloc(b.length); new Uint8Array(X.memory.buffer, p, b.length).set(b); return p; }
function frame() { return new Float32Array(X.memory.buffer, X.web_frame_ptr(), X.web_frame_len()); }

async function init(base) {
  const t0 = performance.now();
  const post = (msg) => self.postMessage({ type: "progress", msg });
  post("downloading engine, world and policy ...");
  const [wasm, world, pol] = await Promise.all([bytes(base + "fastsim.wasm.gz"), bytes(base + "world.bin.gz"), bytes(base + "policy.bin.gz")]);
  const t1 = performance.now();
  post("starting the engine ...");
  const { instance } = await WebAssembly.instantiate(wasm, {});
  X = instance.exports;
  let r = X.web_init(put(world), world.length);
  if (r !== 0n) throw new Error("web_init failed: " + r);
  meta = JSON.parse(new TextDecoder().decode(new Uint8Array(X.memory.buffer, X.web_meta_ptr(), X.web_meta_len())).slice());
  r = X.web_pol_load(put(pol), pol.length);
  if (r !== 0n) throw new Error("web_pol_load failed: " + r);
  const t2 = performance.now();
  self.postMessage({ type: "ready", meta: { champions: meta.champions, turrets: meta.turrets, buildings: meta.buildings, nav: meta.nav, cap: meta.cap, env: meta.env },
    load: { download_ms: Math.round(t1 - t0), init_ms: Math.round(t2 - t1), bytes: wasm.length + world.length + pol.length, fetched } });
}

function newGame(s) {
  seed = s; X.web_new_game(BigInt(s)); X.web_pol_reset(BigInt(s));
  nDec = 0; over = false; prev = null; events = []; newEvents = [];
  perf = { eng: 0, pol: 0, n: 0, wall0: performance.now(), dec0: 0 };
  anchorWall = performance.now(); anchorDec = 0;
  // the first decision is the reset step (the env starts the game; actions are ignored), as SREnv.step on a pending env
  oneDecision();
  send();
}

function detect(f) {
  const nS = f[7], T = f[0] / 1000;
  const H = i => FH + i * HF, S = k => FH + 10 * HF + k * SF;
  if (prev) {
    for (let i = 0; i < 10; i++) {
      if (prev[H(i) + 7] && !f[H(i) + 7]) {
        let killer = -1;
        for (let j = 0; j < 10; j++) if (f[H(j) + 8] > prev[H(j) + 8] && (j < 5) !== (i < 5)) { killer = j; break; }
        newEvents.push({ t: T, k: "kill", v: i, by: killer });
      }
    }
    for (let k = 0; k < nS; k++) {
      const a0 = prev[S(k) + 4], a1 = f[S(k) + 4];
      if (a0 !== a1) newEvents.push({ t: T, k: k < 24 ? "turret" : (meta.buildings[k - 24].nexus ? "nexus" : "inhib"), s: k, up: !!a1, team: f[S(k) + 5] });
    }
  }
  prev = f.slice(0, FH + 10 * HF + nS * SF);
}

function oneDecision() {
  const a = performance.now();
  if (nDec > 0) X.web_pol_act();
  const b = performance.now();
  X.web_step();
  const c = performance.now();
  perf.pol += b - a; perf.eng += c - b; perf.n++;
  nDec++;
  const f = frame();
  detect(f);
  if (f[1]) { over = true; running = false; }
}

function send() {
  const f = frame().slice();
  const now = performance.now(), dt = (now - perf.wall0) / 1000;
  const msg = { type: "frame", frame: f, nDec, over, running, seed, events: newEvents,
    perf: { dps: dt > 0 ? (nDec - perf.dec0) / dt : 0, eng_ms: perf.n ? perf.eng / perf.n : 0, pol_ms: perf.n ? perf.pol / perf.n : 0 } };
  newEvents = [];
  self.postMessage(msg, [f.buffer]);
  if (now - perf.wall0 > 3000) { perf = { eng: 0, pol: 0, n: 0, wall0: now, dec0: nDec }; }   // rolling 3 s window
}

function tick() {
  timer = 0;
  if (!running || over) { send(); return; }
  const t0 = performance.now();
  if (speed === 0) {                            // max: as many decisions as fit in ~30 ms, then yield
    while (!over && performance.now() - t0 < 30) oneDecision();
  } else {
    const want = Math.floor((t0 - anchorWall) / 1000 / DECISION_S * speed) - anchorDec;
    const n = Math.min(want, 64);
    for (let i = 0; i < n && !over; i++) { oneDecision(); anchorDec++; }
    if (want > 64) { anchorWall = t0; anchorDec = 0; }   // the device cannot keep up at this speed: do not pile up a backlog
  }
  send();
  if (running && !over) timer = setTimeout(tick, speed === 0 ? 0 : 15);
}

function setRunning(on) {
  running = on && !over;
  anchorWall = performance.now(); anchorDec = 0;
  perf = { eng: 0, pol: 0, n: 0, wall0: performance.now(), dec0: nDec };
  if (timer) { clearTimeout(timer); timer = 0; }
  tick();
}

self.onmessage = async (ev) => {
  const m = ev.data;
  try {
    if (m.cmd === "init") { await init(m.base || "./"); newGame(m.seed ?? 1); }
    else if (m.cmd === "new") { newGame(m.seed); setRunning(m.play); }
    else if (m.cmd === "play") setRunning(true);
    else if (m.cmd === "pause") setRunning(false);
    else if (m.cmd === "speed") { speed = m.speed; setRunning(running); }
  } catch (e) {
    self.postMessage({ type: "error", msg: String(e && e.message || e) });
  }
};
