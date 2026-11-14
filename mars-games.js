/* ============================================================================
   RoverQuest — Mars mini-game arcade (mars-games.js)
   One hands-on mini-game per NASA machine + an Observation-vs-Interpretation
   sorter. Canvas based, touch + mouse + keyboard, no external dependencies.
   ============================================================================ */
(function () {
  "use strict";
  const RQ = (window.RQ = window.RQ || {});
  const PI2 = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.font = `${weight || 700} ${size}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = color || "#fff";
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s, x, y);
  }
  function blob(ctx, x, y, r, rand, n) {
    n = n || 9;
    ctx.beginPath();
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(r * (0.78 + rand() * 0.34));
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI2, rr2 = pts[i % n];
      const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * 0.82;
      if (!i) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /* ---------------------------------------------------------------- SOUND */
  const sfx = (RQ.sfx = {
    ctx: null,
    muted() { return typeof SET !== "undefined" && SET.mute; },
    ensure() {
      if (this.muted()) return null;
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume();
      } catch (e) { return null; }
      return this.ctx;
    },
    tone(f, dur, type, vol, delay) {
      const c = this.ensure();
      if (!c) return;
      const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    sweep(f1, f2, dur, type, vol) {
      const c = this.ensure();
      if (!c) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = type || "sawtooth";
      o.frequency.setValueAtTime(f1, t);
      o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    noise(dur, vol, freq, q, delay) {
      const c = this.ensure();
      if (!c) return;
      const len = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + (delay || 0);
      s.buffer = buf;
      f.type = "bandpass";
      f.frequency.value = freq || 800;
      f.Q.value = q || 0.8;
      g.gain.value = vol || 0.3;
      s.connect(f).connect(g).connect(c.destination);
      s.start(t);
    },
    click() { this.tone(660, 0.05, "triangle", 0.05); },
    good() { this.tone(660, 0.09, "triangle", 0.07); this.tone(990, 0.12, "triangle", 0.07, 0.07); },
    bad() { this.tone(220, 0.16, "square", 0.04); this.tone(160, 0.2, "square", 0.04, 0.08); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.18, "triangle", 0.07, i * 0.09)); },
    thud() { this.noise(0.5, 0.6, 120, 0.7); this.tone(60, 0.4, "sine", 0.2); },
  });

  /* ---------------------------------------------------------------- ENGINE */
  const MG = (RQ.mg = {
    on: false, game: null, state: "idle", fails: 0, raf: 0, W: 0, H: 0, opts: {}, ptr: null, hintLevel: 0,
    build() {
      if (this.el) return;
      const el = (this.el = document.createElement("div"));
      el.id = "rq-mg";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.innerHTML = `<div class="win">
        <div class="hd"><div class="ttl"><small id="rq-mg-mis"></small><b id="rq-mg-ttl"></b></div>
          <div class="stat" id="rq-mg-stat"></div>
          <button type="button" id="rq-mg-hint" title="Ask TARS for a hint">💡<span class="hint-l"> Hint</span></button>
          <button type="button" id="rq-mg-x" aria-label="Close mini-game">✕</button></div>
        <div class="stage" id="rq-mg-stage"><canvas id="rq-mg-cv" aria-label="Mini-game play area"></canvas><div class="toast" id="rq-mg-toast" role="status" aria-live="polite"></div><div class="card" id="rq-mg-card"></div></div>
        <div class="ctrls" id="rq-mg-ctrls"></div></div>`;
      document.body.appendChild(el);
      this.cv = el.querySelector("#rq-mg-cv");
      this.ctx = this.cv.getContext("2d");
      this.stage = el.querySelector("#rq-mg-stage");
      this.cardEl = el.querySelector("#rq-mg-card");
      this.ctrlEl = el.querySelector("#rq-mg-ctrls");
      el.querySelector("#rq-mg-x").onclick = () => this.close(true);
      el.querySelector("#rq-mg-hint").onclick = () => { if (RQ.hints) RQ.hints.giveNow(true); };
      const pos = (e) => { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      this.cv.addEventListener("pointerdown", (e) => {
        if (this.state !== "play" || !this.game) return;
        this.cv.setPointerCapture && this.cv.setPointerCapture(e.pointerId);
        this.ptr = pos(e);
        this.game.down && this.game.down(...this.ptr, e);
        e.preventDefault();
      });
      this.cv.addEventListener("pointermove", (e) => {
        if (this.state !== "play" || !this.game) return;
        this.ptr = pos(e);
        this.game.move && this.game.move(...this.ptr, e.buttons > 0 || e.pointerType === "touch", e);
      });
      const up = (e) => { if (this.state !== "play" || !this.game) return; this.game.up && this.game.up(...pos(e), e); };
      this.cv.addEventListener("pointerup", up);
      this.cv.addEventListener("pointercancel", up);
      this.ctrlEl.addEventListener("click", (e) => {
        const b = e.target.closest("[data-c]");
        if (!b || this.state !== "play" || !this.game || !this.game.ctrl) return;
        this.game.ctrl(b.dataset.c, b);
      });
      const hold = (e, v) => {
        const b = e.target.closest("[data-hold]");
        if (!b || this.state !== "play" || !this.game || !this.game.hold) return;
        e.preventDefault();
        this.game.hold(b.dataset.hold, v);
      };
      this.ctrlEl.addEventListener("pointerdown", (e) => hold(e, true));
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => this.ctrlEl.addEventListener(ev, (e) => hold(e, false)));
      addEventListener("keydown", (e) => {
        if (!this.on) return;
        if (e.key === "Escape") { e.preventDefault(); this.close(true); return; }
        if (this.state !== "play" || !this.game || !this.game.key) return;
        if (e.target.closest && e.target.closest("input[type=range]")) return;
        if (this.game.key(e.code, true, e)) e.preventDefault();
      }, true);
      addEventListener("keyup", (e) => { if (this.on && this.state === "play" && this.game && this.game.key) this.game.key(e.code, false, e); }, true);
      addEventListener("resize", () => this.on && this.resize());
    },
    resize() {
      const r = this.stage.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = Math.max(200, r.width);
      this.H = Math.max(200, r.height);
      this.cv.width = Math.round(this.W * dpr);
      this.cv.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.game && this.game.resize && this.state === "play") this.game.resize(this.api);
    },
    open(id, opts) {
      this.build();
      const g = GAMES[id];
      if (!g) return;
      this.opts = opts || {};
      this.game = g;
      this.fails = 0;
      this.hintLevel = 0;
      this.on = true;
      this.el.classList.add("on");
      this.el.setAttribute("aria-label", g.title + " mini-game");
      this.el.querySelector("#rq-mg-mis").textContent = g.mission + " · Mini-game";
      this.el.querySelector("#rq-mg-ttl").textContent = g.icon + " " + g.title;
      this.stat("");
      this.ctrls("");
      if (typeof S !== "undefined") S.mode = "talk";
      const d = document.getElementById("dlg");
      if (d) d.style.display = "none";
      if (typeof keys !== "undefined") for (const k in keys) keys[k] = 0;
      requestAnimationFrame(() => { this.resize(); this.drawIdle(); });
      this.showIntro();
      RQ.hints && RQ.hints.bump();
    },
    close(user) {
      if (!this.on) return;
      this.on = false;
      this.state = "idle";
      cancelAnimationFrame(this.raf);
      this.el.classList.remove("on");
      if (this.game && this.game.cleanup) this.game.cleanup();
      if (typeof keys !== "undefined") for (const k in keys) keys[k] = 0;
      const cb = user ? this.opts.onClose : null;
      this.game = null;
      if (cb) cb();
    },
    drawIdle() {
      const c = this.ctx, g = c.createLinearGradient(0, 0, 0, this.H), bg = (this.game && this.game.bg) || ["#1a1210", "#3a1d12"];
      g.addColorStop(0, bg[0]);
      g.addColorStop(1, bg[1]);
      c.fillStyle = g;
      c.fillRect(0, 0, this.W, this.H);
    },
    showIntro() {
      const g = this.game;
      this.state = "intro";
      this.cardEl.style.display = "flex";
      this.cardEl.innerHTML = `<div class="in"><div class="em">${g.icon}</div><h3>${esc(g.title)}</h3><p>${g.tagline}</p>
        <div class="how">${g.how.map((h) => `<div><span>${h[0]}</span><div>${h[1]}</div></div>`).join("")}</div>
        <div class="acts"><button type="button" class="rq-btn primary big" id="rq-mg-start">▶ Start mission</button><button type="button" class="rq-btn ghost" id="rq-mg-back">Back</button></div></div>`;
      this.cardEl.querySelector("#rq-mg-start").onclick = () => { sfx.ensure(); sfx.click(); this.start(); };
      this.cardEl.querySelector("#rq-mg-back").onclick = () => this.close(true);
      setTimeout(() => { const b = this.cardEl.querySelector("#rq-mg-start"); b && b.focus(); }, 50);
    },
    start() {
      this.cardEl.style.display = "none";
      this.cardEl.innerHTML = "";
      this.state = "starting";
      this.resize();
      this.state = "play";
      const self = this;
      this.api = {
        get W() { return self.W; },
        get H() { return self.H; },
        ctx: this.ctx,
        toast: (m, k) => self.toast(m, k),
        stat: (h) => self.stat(h),
        ctrls: (h) => self.ctrls(h),
        fail: (why) => self.fail(why),
        win: (r) => self.finish(true, r),
        lose: (r) => self.finish(false, r),
        get fails() { return self.fails; },
      };
      this.game.init(this.api);
      this.last = performance.now();
      const loop = (now) => {
        if (!this.on || this.state !== "play") return;
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        try {
          this.game.update && this.game.update(dt, this.api);
          this.game.draw(this.ctx, this.api);
        } catch (err) { console.error("[RQ mini-game]", err); }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },
    toast(msg, kind) {
      const t = this.el.querySelector("#rq-mg-toast");
      t.innerHTML = msg;
      t.className = "toast on " + (kind || "");
      clearTimeout(this._tt);
      this._tt = setTimeout(() => (t.className = "toast"), kind === "bad" ? 3600 : 2600);
    },
    stat(h) { this.el.querySelector("#rq-mg-stat").innerHTML = h; },
    ctrls(h) { this.ctrlEl.innerHTML = h; },
    fail(why) {
      this.fails++;
      sfx.bad();
      if (why) this.toast(why, "bad");
      RQ.hints && RQ.hints.onGameFail && RQ.hints.onGameFail(this.fails);
    },
    finish(win, r) {
      if (this.state !== "play") return;
      r = r || {};
      this.state = "end";
      cancelAnimationFrame(this.raf);
      try { this.game.draw(this.ctx, this.api); } catch (e) {}
      const g = this.game;
      this.cardEl.style.display = "flex";
      if (win) {
        sfx.win();
        const st = clamp(r.stars || 1, 1, 3);
        this.cardEl.innerHTML = `<div class="in"><div class="em">🏆</div><h3>Mission success!</h3>
          <div class="stars" aria-label="${st} of 3 stars">${[0, 1, 2].map((i) => `<span class="${i < st ? "" : "off"}">⭐</span>`).join("")}</div>
          <p>${r.line || ""}</p><div class="sci">${g.sci}</div>
          ${g.photo ? `<figure style="margin:0"><img src="${g.photo.src}" alt="${esc(g.photo.cap)}" loading="lazy"><figcaption>${/illustration/i.test(g.photo.label || "") ? "🎨" : "📷"} ${esc(g.photo.label || "Real NASA photo")}: ${esc(g.photo.cap)}</figcaption></figure>` : ""}
          <div class="acts"><button type="button" class="rq-btn primary big" id="rq-mg-cont">Collect reward ▸</button><button type="button" class="rq-btn ghost" id="rq-mg-again">↺ Play again</button></div></div>`;
        const summary = r.summary || g.title + " complete";
        this.cardEl.querySelector("#rq-mg-cont").onclick = () => {
          const cb = this.opts.onWin;
          this.opts.onClose = null;
          this.close(false);
          cb && cb(summary, st);
        };
      } else {
        const tip = g.hintFor ? g.hintFor(Math.max(0, this.hintLevel)) : "";
        this.cardEl.innerHTML = `<div class="in"><div class="em">😵</div><h3>Not quite!</h3><p>${r.line || ""}</p>
          ${tip ? `<div class="sci"><b>🤖 TARS tip:</b> ${tip}</div>` : ""}
          <div class="acts"><button type="button" class="rq-btn primary big" id="rq-mg-again">↺ Try again</button><button type="button" class="rq-btn ghost" id="rq-mg-quit">Back to mission</button></div></div>`;
        this.cardEl.querySelector("#rq-mg-quit").onclick = () => this.close(true);
      }
      this.cardEl.querySelector("#rq-mg-again").onclick = () => { sfx.click(); this.start(); };
      setTimeout(() => { const b = this.cardEl.querySelector(".rq-btn.primary"); b && b.focus(); }, 60);
    },
    currentHint() {
      if (!this.game) return "";
      if (this.state !== "play") return "Press <b>▶ Start mission</b> to begin — you can replay as many times as you like.";
      return this.game.hintFor ? this.game.hintFor(this.hintLevel) : "";
    },
  });

  /* ================================================================ GAMES */
  const GAMES = (RQ.games = {});

  /* ---------- 1. SOJOURNER · Signal-Delay Driver ---------- */
  (function () {
    const COLS = 9, ROWS = 6, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
    const ROCKS = { "3,1": "Barnacle Bill", "3,2": "", "3,3": "Wedge", "5,0": "", "5,1": "Scooby-Doo", "6,3": "", "5,4": "", "1,5": "", "2,4": "", "8,0": "" };
    const YOGI = [7, 2], LANDER = [0, 2];
    const ICON = { F: "⬆", B: "⬇", L: "⟲", R: "⟳" };
    let s;
    const blocked = (x, y) => x < 0 || y < 0 || x >= COLS || y >= ROWS || (x + "," + y) in ROCKS || (x === YOGI[0] && y === YOGI[1]) || (x === LANDER[0] && y === LANDER[1]);
    function sim(pose, q) {
      const p = { ...pose }, path = [[p.x, p.y]];
      for (const c of q) {
        if (c === "L") p.dir = (p.dir + 3) % 4;
        else if (c === "R") p.dir = (p.dir + 1) % 4;
        else {
          const k = c === "F" ? 1 : -1;
          p.x += DX[p.dir] * k;
          p.y += DY[p.dir] * k;
        }
        path.push([p.x, p.y]);
      }
      return { p, path };
    }
    function qHTML() {
      return s.queue.length ? s.queue.map((c, i) => `<i class="${s.phase === "exec" && i === s.ei ? "run" : ""}">${ICON[c]}</i>`).join("") : `<em>Your plan appears here…</em>`;
    }
    function refresh(api) {
      api.stat(`<span>☀️ Sol ${s.sol}</span><span>📋 ${s.queue.length}/16</span>`);
      const q = document.getElementById("rq-soj-q");
      if (q) q.innerHTML = qHTML();
      const go = document.querySelector('#rq-mg-ctrls [data-c="GO"]');
      if (go) go.disabled = s.phase !== "plan" || !s.queue.length;
    }
    GAMES.soj = {
      id: "soj", mission: "Sojourner", icon: "🛞", title: "Signal-Delay Driver",
      tagline: "Drive the first Mars rover to the rock nicknamed <b>Yogi</b>. The catch: your commands take about <b>10 minutes</b> to reach Mars, so you have to plan the whole drive in advance.",
      how: [["🧭", "Add moves to your plan: <b>⬆ forward</b>, <b>⬇ reverse</b>, <b>⟲ ⟳ turn</b>. Arrow keys work too."], ["📡", "Press <b>Transmit</b>. Sojourner drives your whole plan on its own and stops if it would hit a rock."], ["🔬", "Finish with the rover's <b>back</b> next to Yogi. That's where its APXS sensor is, the tool that measures which elements a rock contains."]],
      sci: "<b>Real science:</b> In 1997, engineers on Earth planned Sojourner's drives one Martian day (sol) at a time, because radio signals took about 10 minutes to reach Mars. Its APXS sensor, mounted at the <b>rear</b>, measured the chemical elements in rocks the team nicknamed Barnacle Bill, Yogi and Scooby-Doo.",
      photo: { src: "assets/hardware/sojourner/wheels-nasa.jpg", cap: "Sojourner on the Martian surface, sol 2 (NASA/JPL-Caltech)" },
      hintFor(l) {
        const h = [
          "Plan the <b>whole route</b> before you press Transmit. Every transmission uses up one sol (a Martian day).",
          "The boulders in the middle block the direct path. Try going around the <b>top</b>: turn left, drive north, then head east.",
          "Sojourner's APXS is on its <b>back</b>. End up facing <b>away</b> from Yogi, then use <b>⬇ reverse</b> to back up next to it.",
          "One route from the start: ⟲ ⬆ ⬆ ⟳ ⬆ ⬆ ⬆ ⟳ ⬆ ⬆ ⟳ ⬇ ⬇",
        ];
        return h[Math.min(l, h.length - 1)];
      },
      init(api) {
        s = { r: { x: 1, y: 2, dir: 1 }, vis: { x: 1, y: 2, a: 0 }, queue: [], phase: "plan", sol: 1, t: 0, ei: 0, et: 0, sig: 0, apxs: 0, bump: 0, from: null };
        api.ctrls(`<button data-c="L" aria-label="Turn left">⟲</button><button data-c="F" aria-label="Forward">⬆</button><button data-c="B" aria-label="Reverse">⬇</button><button data-c="R" aria-label="Turn right">⟳</button><button data-c="U" aria-label="Undo last move">⌫</button>
          <div class="q" id="rq-soj-q" aria-live="polite"></div><button class="rq-btn primary" data-c="GO">📡 Transmit</button>`);
        refresh(api);
        this.api = api;
      },
      ctrl(c) {
        const api = this.api;
        if (s.phase !== "plan") return;
        if (c === "U") { s.queue.pop(); sfx.click(); }
        else if (c === "GO") {
          if (!s.queue.length) return;
          s.phase = "signal";
          s.sig = 0;
          sfx.sweep(400, 1200, 0.6, "sine", 0.05);
        } else if (ICON[c]) {
          if (s.queue.length >= 16) { api.toast("Plan is full (16 moves). Transmit it or undo a move.", "bad"); return; }
          s.queue.push(c);
          sfx.click();
        }
        refresh(api);
      },
      key(code) {
        const m = { ArrowUp: "F", KeyW: "F", ArrowDown: "B", KeyS: "B", ArrowLeft: "L", KeyA: "L", ArrowRight: "R", KeyD: "R", Backspace: "U", Enter: "GO", Space: "GO" }[code];
        if (!m) return false;
        this.ctrl(m);
        return true;
      },
      update(dt, api) {
        s.t += dt;
        s.bump = Math.max(0, s.bump - dt * 3);
        if (s.phase === "signal") {
          s.sig += dt / 1.8;
          if (s.sig >= 1) { s.phase = "exec"; s.ei = 0; s.et = 0; s.from = { ...s.r }; refresh(api); }
        } else if (s.phase === "exec") {
          s.et += dt / 0.42;
          const c = s.queue[s.ei];
          const from = s.from, k = Math.min(1, s.et);
          if (c === "L" || c === "R") {
            const a0 = from.dir * (Math.PI / 2), a1 = a0 + (c === "L" ? -Math.PI / 2 : Math.PI / 2);
            s.vis.a = lerp(a0, a1, k);
          } else {
            const d = c === "F" ? 1 : -1, nx = from.x + DX[from.dir] * d, ny = from.y + DY[from.dir] * d;
            if (blocked(nx, ny)) {
              s.vis.x = from.x + (nx - from.x) * Math.sin(k * Math.PI) * 0.25;
              s.vis.y = from.y + (ny - from.y) * Math.sin(k * Math.PI) * 0.25;
              if (k >= 1) {
                s.bump = 1;
                const what = nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS ? "the edge of the map" : (nx + "," + ny) in ROCKS && ROCKS[nx + "," + ny] ? `the rock ${ROCKS[nx + "," + ny]}` : nx === YOGI[0] && ny === YOGI[1] ? "Yogi (front first!)" : nx === LANDER[0] && ny === LANDER[1] ? "the lander" : "a boulder";
                api.fail(`🛑 Hazard sensors stopped Sojourner before it hit ${what}. Remaining moves cancelled.`);
                return this.endSol(api, false);
              }
              return;
            }
            s.vis.x = lerp(from.x, nx, k);
            s.vis.y = lerp(from.y, ny, k);
          }
          if (k >= 1) {
            if (c === "L") s.r.dir = (s.r.dir + 3) % 4;
            else if (c === "R") s.r.dir = (s.r.dir + 1) % 4;
            else { const d = c === "F" ? 1 : -1; s.r.x += DX[s.r.dir] * d; s.r.y += DY[s.r.dir] * d; sfx.tone(300, 0.05, "square", 0.02); }
            s.vis = { x: s.r.x, y: s.r.y, a: s.r.dir * (Math.PI / 2) };
            s.ei++;
            s.et = 0;
            s.from = { ...s.r };
            refresh(api);
            if (s.ei >= s.queue.length) this.endSol(api, true);
          }
        } else if (s.phase === "apxs") {
          s.apxs += dt / 1.4;
          if (s.apxs >= 1) {
            const st = s.sol === 1 ? 3 : s.sol === 2 ? 2 : 1;
            api.win({ stars: st, line: `You reached Yogi in <b>${s.sol} sol${s.sol > 1 ? "s" : ""}</b> and pressed the rear APXS against it. ${st === 3 ? "That's flight-team planning!" : "Fewer transmissions = more stars."}`, summary: `Drove Sojourner to Yogi in ${s.sol} sol(s) and placed its rear APXS on the rock.` });
          }
        }
      },
      endSol(api, completed) {
        const rear = [s.r.x - DX[s.r.dir], s.r.y - DY[s.r.dir]], front = [s.r.x + DX[s.r.dir], s.r.y + DY[s.r.dir]];
        if (rear[0] === YOGI[0] && rear[1] === YOGI[1]) {
          s.phase = "apxs";
          s.apxs = 0;
          s.queue = [];
          api.toast("🔬 APXS deployed on Yogi! Measuring elements…", "good");
          sfx.good();
          refresh(api);
          return;
        }
        if (completed && front[0] === YOGI[0] && front[1] === YOGI[1]) api.fail("So close! The APXS is on Sojourner's <b>back</b>. Turn around and reverse up to Yogi.");
        else if (completed) api.toast(`Sol ${s.sol} complete. Sojourner is waiting for tomorrow's commands.`, "");
        s.sol++;
        s.queue = [];
        s.phase = "plan";
        s.vis = { x: s.r.x, y: s.r.y, a: s.r.dir * (Math.PI / 2) };
        refresh(api);
      },
      draw(ctx, api) {
        const W = api.W, H = api.H, top = s.phase === "signal" ? 64 : 34;
        const cs = Math.floor(Math.min((W - 24) / COLS, (H - top - 16) / ROWS)), ox = Math.floor((W - cs * COLS) / 2), oy = Math.floor(top + (H - top - cs * ROWS) / 2);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#2b1610");
        g.addColorStop(1, "#140b08");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        const gg = ctx.createRadialGradient(ox + cs * 4, oy + cs * 3, cs, ox + cs * 4, oy + cs * 3, cs * 7);
        gg.addColorStop(0, "#c1703f");
        gg.addColorStop(1, "#8e4a29");
        ctx.fillStyle = gg;
        rr(ctx, ox, oy, cs * COLS, cs * ROWS, 14);
        ctx.fill();
        const rnd = seeded(7);
        ctx.fillStyle = "rgba(60,25,10,.25)";
        for (let i = 0; i < 260; i++) { ctx.beginPath(); ctx.arc(ox + rnd() * cs * COLS, oy + rnd() * cs * ROWS, rnd() * 2.2 + 0.4, 0, PI2); ctx.fill(); }
        ctx.strokeStyle = "rgba(0,0,0,.13)";
        ctx.lineWidth = 1;
        for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cs, oy); ctx.lineTo(ox + x * cs, oy + ROWS * cs); ctx.stroke(); }
        for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cs); ctx.lineTo(ox + COLS * cs, oy + y * cs); ctx.stroke(); }
        const cx = (x) => ox + x * cs + cs / 2, cy = (y) => oy + y * cs + cs / 2;
        // lander
        ctx.save();
        ctx.translate(cx(LANDER[0]), cy(LANDER[1]));
        ctx.fillStyle = "rgba(240,240,235,.75)";
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 2.1) * cs * 0.3, Math.sin(i * 2.1) * cs * 0.3, cs * 0.16, 0, PI2); ctx.fill(); }
        ctx.fillStyle = "#c8a24a";
        ctx.beginPath(); ctx.moveTo(0, -cs * 0.36); ctx.lineTo(cs * 0.32, cs * 0.24); ctx.lineTo(-cs * 0.32, cs * 0.24); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3b4d6b";
        ctx.fillRect(-cs * 0.12, -cs * 0.08, cs * 0.24, cs * 0.18);
        ctx.restore();
        text(ctx, "PATHFINDER", cx(LANDER[0]), cy(LANDER[1]) + cs * 0.44, Math.max(8, cs * 0.12), "rgba(255,255,255,.75)");
        // rocks
        for (const k in ROCKS) {
          const [x, y] = k.split(",").map(Number), r2 = seeded(x * 31 + y * 7 + 3);
          ctx.fillStyle = "rgba(0,0,0,.25)";
          blob(ctx, cx(x) + 3, cy(y) + 5, cs * 0.34, r2); ctx.fill();
          const r3 = seeded(x * 31 + y * 7 + 3);
          ctx.fillStyle = "#6b4636";
          blob(ctx, cx(x), cy(y), cs * 0.34, r3); ctx.fill();
          ctx.fillStyle = "rgba(255,220,190,.18)";
          ctx.beginPath(); ctx.ellipse(cx(x) - cs * 0.08, cy(y) - cs * 0.1, cs * 0.12, cs * 0.07, -0.4, 0, PI2); ctx.fill();
          if (ROCKS[k]) text(ctx, ROCKS[k], cx(x), cy(y) + cs * 0.44, Math.max(8, cs * 0.12), "rgba(255,255,255,.8)", "center", 600);
        }
        // yogi
        const pulse = (Math.sin(s.t * 3) + 1) / 2;
        ctx.strokeStyle = `rgba(70,224,176,${0.35 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx(YOGI[0]), cy(YOGI[1]), cs * (0.5 + pulse * 0.06), 0, PI2); ctx.stroke();
        const ry = seeded(99);
        ctx.fillStyle = "#7a5040";
        blob(ctx, cx(YOGI[0]), cy(YOGI[1]), cs * 0.44, ry, 11); ctx.fill();
        ctx.fillStyle = "rgba(255,220,190,.2)";
        ctx.beginPath(); ctx.ellipse(cx(YOGI[0]) - cs * 0.1, cy(YOGI[1]) - cs * 0.14, cs * 0.16, cs * 0.08, -0.4, 0, PI2); ctx.fill();
        text(ctx, "YOGI 🎯", cx(YOGI[0]), cy(YOGI[1]) + cs * 0.56, Math.max(9, cs * 0.14), "#9fffe0");
        // planned path preview
        if (s.queue.length && s.phase === "plan") {
          const sm = sim(s.r, s.queue);
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "rgba(255,209,102,.85)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          sm.path.forEach((p, i) => (i ? ctx.lineTo(cx(p[0]), cy(p[1])) : ctx.moveTo(cx(p[0]), cy(p[1]))));
          ctx.stroke();
          ctx.setLineDash([]);
          this.rover(ctx, cx(sm.p.x), cy(sm.p.y), sm.p.dir * (Math.PI / 2), cs, 0.35);
        }
        // rover
        const shake = s.bump ? Math.sin(s.t * 60) * 3 * s.bump : 0;
        this.rover(ctx, cx(s.vis.x) + shake, cy(s.vis.y), s.vis.a, cs, 1);
        if (s.phase === "apxs") {
          const rx = cx(s.r.x) - DX[s.r.dir] * cs * 0.34, ry2 = cy(s.r.y) - DY[s.r.dir] * cs * 0.34;
          for (let i = 0; i < 3; i++) {
            const k = (s.apxs * 2 + i / 3) % 1;
            ctx.strokeStyle = `rgba(70,224,176,${1 - k})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(rx, ry2, 6 + k * cs * 0.5, 0, PI2); ctx.stroke();
          }
        }
        // signal banner
        if (s.phase === "signal") {
          rr(ctx, 12, 8, W - 24, 48, 12);
          ctx.fillStyle = "rgba(8,12,22,.92)";
          ctx.fill();
          const x0 = 44, x1 = W - 44, px = lerp(x0, x1, s.sig);
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = "rgba(92,200,255,.6)";
          ctx.beginPath(); ctx.moveTo(x0, 32); ctx.lineTo(x1, 32); ctx.stroke();
          ctx.setLineDash([]);
          text(ctx, "🌍", x0, 32, 20);
          text(ctx, "🔴", x1, 32, 18);
          ctx.fillStyle = "#5cc8ff";
          ctx.beginPath(); ctx.arc(px, 32, 5, 0, PI2); ctx.fill();
          text(ctx, `📡 Signal on its way to Mars… about ${Math.max(1, Math.round(10 * (1 - s.sig)))} min left (sped up)`, W / 2, 18, Math.min(13, W / 40), "#cfe9ff", "center", 600);
        } else {
          text(ctx, s.phase === "exec" ? "▶ Sojourner is driving your plan…" : s.phase === "apxs" ? "🔬 APXS measuring Yogi…" : "Plan your drive, then press 📡 Transmit", W / 2, 18, Math.min(14, W / 34), "rgba(255,255,255,.8)", "center", 600);
        }
      },
      rover(ctx, x, y, a, cs, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(a - Math.PI / 2);
        const w = cs * 0.42, h = cs * 0.56;
        ctx.fillStyle = "#1d1d22";
        for (let i = -1; i <= 1; i++) { rr(ctx, -w / 2 - cs * 0.08, i * h * 0.34 - cs * 0.06, cs * 0.1, cs * 0.12, 3); ctx.fill(); rr(ctx, w / 2 - cs * 0.02, i * h * 0.34 - cs * 0.06, cs * 0.1, cs * 0.12, 3); ctx.fill(); }
        ctx.fillStyle = "#d9d4c7";
        rr(ctx, -w / 2, -h / 2, w, h, 5); ctx.fill();
        ctx.fillStyle = "#2c3f66";
        rr(ctx, -w / 2 + 3, -h / 2 + 4, w - 6, h * 0.62, 3); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.moveTo(0, -h / 2 - cs * 0.12); ctx.lineTo(cs * 0.08, -h / 2 - 2); ctx.lineTo(-cs * 0.08, -h / 2 - 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#46e0b0";
        ctx.beginPath(); ctx.arc(0, h / 2 + 2, cs * 0.06, 0, PI2); ctx.fill();
        ctx.restore();
        if (alpha === 1) text(ctx, "APXS", x - Math.cos(a) * cs * 0.0 + -Math.sin(a - Math.PI / 2) * 0 + (-Math.cos(a)) * cs * 0.42 * 0, y + cs * 0.0 + 0, 0.1, "transparent");
      },
    };
  })();

  /* ---------- 2. VIKING 1 · Scoop & Bake ---------- */
  (function () {
    let s;
    const BAND = [{ t: 200, lo: 175, hi: 225, gas: ["H₂O", "CO₂"] }, { t: 500, lo: 470, hi: 530, gas: ["CH₃Cl"] }];
    GAMES.vik = {
      id: "vik", mission: "Viking 1 Lander", icon: "🧪", title: "Scoop & Bake",
      tagline: "Viking 1 was searching for the chemistry of life. Scoop up Martian soil with the robotic arm, bake it in the <b>GCMS oven</b>, and work out what the result really means.",
      how: [["🦾", "The sampler arm swings back and forth. <b>Tap DIG</b> (or Space) when it's over soft soil. Rocks jam the scoop."], ["🔥", "<b>Hold HEAT</b> to warm the oven. Keep it inside the green zone: first 200 °C, then 500 °C. Don't overheat!"], ["🧠", "Decide what the test can and can't prove."]],
      sci: "<b>Real science:</b> In 1976 Viking 1's arm dug trenches at Chryse Planitia, and its GCMS heated soil to search for organic (carbon-based) molecules. It found none. In 2008 the Phoenix lander found <b>perchlorate</b> salts in Martian soil, and lab tests showed that heating perchlorate can destroy organics. Viking's result is still debated, and that's how science works.",
      photo: { src: "assets/hardware/viking-1-lander/evidence_trench-PIA00389.jpg", cap: "Trench excavated by Viking 1's surface sampler (NASA/JPL)" },
      hintFor(l) {
        if (!s || s.phase === "scoop") return ["Watch the arm swing. Tap <b>DIG</b> when the scoop is over plain soil, not over the grey rocks.", "Tap a little <b>before</b> the scoop reaches the soil spot. It takes a moment to drop.", "Gaps between rocks are the safe spots. Wait for one and tap DIG right as the scoop arrives."][Math.min(l, 2)];
        if (s.phase === "bake") return ["<b>Hold</b> the HEAT button. Let go when the needle reaches the green zone, then tap to keep it there.", "Heat rises fast and cools slowly. Use short taps once you're in the green zone.", "If you overheat, the sample is ruined, so stop heating before you reach the red."][Math.min(l, 2)];
        return ["A test that <b>doesn't detect</b> something isn't always proof it's absent. Could the test itself have destroyed it?", "Phoenix found perchlorate salts in 2008. When heated, they can burn up organic molecules."][Math.min(l, 1)];
      },
      init(api) {
        const rocks = [], r = seeded((Date.now() % 9973) + 11);
        let x = 0.36;
        while (x < 0.9) { rocks.push({ x, w: 0.045 + r() * 0.035 }); x += 0.1 + r() * 0.09; }
        s = { phase: "scoop", t: 0, armT: 0, speed: 1.25, drop: 0, dropX: 0, samples: 0, rocks, trench: [], temp: 20, heat: false, band: 0, holdT: 0, gas: { "H₂O": 0, "CO₂": 0, "CH₃Cl": 0 }, over: 0, quiz: false };
        this.api = api;
        this.ctrlScoop(api);
      },
      ctrlScoop(api) {
        api.ctrls(`<button class="rq-btn primary big" data-c="DIG">⛏ DIG</button>`);
        api.stat(`<span>🧺 Samples ${s.samples}/3</span>`);
      },
      ctrlBake(api) {
        api.ctrls(`<button class="rq-btn primary big" data-hold="HEAT" style="touch-action:none">🔥 Hold to HEAT</button>`);
        api.stat(`<span>🌡 Target ${BAND[s.band].t} °C</span>`);
      },
      ctrlQuiz(api) {
        api.ctrls(`<button data-c="Q0" style="flex:1 1 260px;text-align:left">A. Mars has no organic molecules at all.</button><button data-c="Q1" style="flex:1 1 260px;text-align:left">B. Heating soil with perchlorate salts may have destroyed organics, so the test can't prove they're absent.</button><button data-c="Q2" style="flex:1 1 260px;text-align:left">C. Martian bacteria ate all the organics.</button>`);
        api.stat(`<span>🧠 Final question</span>`);
      },
      ctrl(c) {
        const api = this.api;
        if (c === "DIG" && s.phase === "scoop" && !s.drop) {
          s.drop = 0.001;
          s.dropX = this.scoopX(api);
          sfx.click();
        }
        if (c[0] === "Q" && s.phase === "quiz") {
          if (c === "Q1") {
            const st = api.fails === 0 ? 3 : api.fails <= 2 ? 2 : 1;
            api.win({ stars: st, line: "Exactly. <b>Not detecting</b> something isn't the same as proving it isn't there. Scientists are still investigating Viking's results today.", summary: "Scooped subsurface soil, ran the 200 °C and 500 °C GCMS bake, and explained why 'not detected' isn't proof of absence." });
          } else api.fail(c === "Q0" ? "Careful! One test that finds nothing isn't proof. The heating step itself may have destroyed organics." : "No living microbes were detected. That idea isn't supported by any of the evidence.");
        }
      },
      hold(id, v) { if (id === "HEAT") s.heat = v; },
      key(code, down) {
        if (code === "Space" || code === "Enter") {
          if (s.phase === "scoop" && down) this.ctrl("DIG");
          if (s.phase === "bake") s.heat = down;
          return true;
        }
        if (s.phase === "quiz" && down && ["Digit1", "Digit2", "Digit3", "KeyA", "KeyB", "KeyC"].includes(code)) { this.ctrl("Q" + ({ Digit1: 0, KeyA: 0, Digit2: 1, KeyB: 1, Digit3: 2, KeyC: 2 }[code])); return true; }
        return false;
      },
      down() { if (s.phase === "scoop") this.ctrl("DIG"); if (s.phase === "bake") s.heat = true; },
      up() { if (s.phase === "bake") s.heat = false; },
      scoopX(api) { return lerp(api.W * 0.3, api.W * 0.93, (Math.sin(s.armT) + 1) / 2); },
      update(dt, api) {
        s.t += dt;
        if (s.phase === "scoop") {
          if (!s.drop) s.armT += dt * s.speed;
          else {
            s.drop += dt / 0.9;
            if (s.drop >= 0.5 && !s.checked) {
              s.checked = true;
              const fx = s.dropX / api.W, hit = s.rocks.find((r) => Math.abs(fx - r.x) < r.w / 2 + 0.012);
              if (hit) { api.fail("💥 CLUNK! The scoop hit a rock. Wait for soft soil."); sfx.thud(); }
              else {
                s.samples++;
                s.trench.push(fx);
                sfx.good();
                api.toast(`🧺 Soil sample ${s.samples}/3 collected from below the sun-baked crust.`, "good");
                s.speed += 0.3;
                api.stat(`<span>🧺 Samples ${s.samples}/3</span>`);
              }
            }
            if (s.drop >= 1) {
              s.drop = 0;
              s.checked = false;
              if (s.samples >= 3) { s.phase = "bake"; s.temp = 20; this.ctrlBake(api); api.toast("Samples delivered to the GCMS oven. Time to bake!", "good"); }
            }
          }
        } else if (s.phase === "bake") {
          const b = BAND[s.band];
          s.temp += s.heat ? 150 * dt : -55 * dt;
          s.temp = Math.max(20, s.temp);
          if (s.temp >= b.lo && s.temp <= b.hi) {
            s.holdT += dt;
            b.gas.forEach((g) => (s.gas[g] = Math.min(1, s.gas[g] + dt / 1.6)));
            if (s.holdT >= 1.6) {
              sfx.good();
              if (s.band === 0) { api.toast("200 °C: water vapour and CO₂ released. Now take it to 500 °C!", "good"); s.band = 1; s.holdT = 0; this.ctrlBake(api); }
              else { s.phase = "quiz"; s.heat = false; api.toast("500 °C: only simple chlorine-carbon gases. No complex organics detected.", "good"); this.ctrlQuiz(api); }
            }
          } else if (s.temp > b.hi + 70) {
            api.fail("🔥 Overheated! The sample was ruined. Start again at a lower temperature.");
            s.temp = 20;
            s.heat = false;
            s.holdT = 0;
          }
        }
      },
      draw(ctx, api) {
        const W = api.W, H = api.H, gy = H * (s.phase === "scoop" ? 0.58 : 0.62);
        const sky = ctx.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, "#c9946e");
        sky.addColorStop(1, "#e7bf98");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, gy);
        const gr = ctx.createLinearGradient(0, gy, 0, H);
        gr.addColorStop(0, "#a5532e");
        gr.addColorStop(1, "#5d2b16");
        ctx.fillStyle = gr;
        ctx.fillRect(0, gy, W, H - gy);
        ctx.fillStyle = "#d9935f";
        ctx.fillRect(0, gy, W, 7);
        const rnd = seeded(5);
        ctx.fillStyle = "rgba(40,15,5,.25)";
        for (let i = 0; i < 180; i++) { ctx.beginPath(); ctx.arc(rnd() * W, gy + 10 + rnd() * (H - gy), rnd() * 2 + 0.5, 0, PI2); ctx.fill(); }
        // lander
        const lx = W * 0.12, ly = gy - 36;
        ctx.strokeStyle = "#cfd3da"; ctx.lineWidth = 4;
        [[-40, 36], [40, 36]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(lx + dx * 0.5, ly + 10); ctx.lineTo(lx + dx, ly + dy); ctx.stroke(); });
        ctx.fillStyle = "#e8e6e0"; rr(ctx, lx - 42, ly - 24, 84, 36, 6); ctx.fill();
        ctx.fillStyle = "#b8b2a6"; ctx.fillRect(lx - 30, ly - 40, 18, 16); ctx.fillRect(lx + 14, ly - 40, 18, 16);
        ctx.fillStyle = "#f2f0ea"; ctx.beginPath(); ctx.ellipse(lx + 4, ly - 56, 20, 7, -0.3, 0, PI2); ctx.fill();
        ctx.strokeStyle = "#999"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx + 4, ly - 50); ctx.lineTo(lx + 4, ly - 24); ctx.stroke();
        text(ctx, "VIKING 1", lx, ly - 6, 10, "#333");
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < s.samples ? "#b5602f" : "rgba(0,0,0,.25)"; rr(ctx, lx - 30 + i * 22, ly + 16, 16, 10, 3); ctx.fill(); }
        // rocks + trenches
        s.rocks.forEach((r, i) => { const rd = seeded(i * 13 + 4); ctx.fillStyle = "#6e6259"; blob(ctx, r.x * W, gy + 2, r.w * W * 0.55, rd, 10); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.ellipse(r.x * W - 4, gy - 4, r.w * W * 0.2, 4, 0, 0, PI2); ctx.fill(); });
        s.trench.forEach((x) => { ctx.fillStyle = "#4a2010"; rr(ctx, x * W - 14, gy, 28, 22, 6); ctx.fill(); });
        if (s.phase === "scoop") {
          text(ctx, "☀ UV-baked surface crust", W * 0.96, gy - 12, 11, "rgba(80,30,10,.8)", "right", 600);
          const sx = s.drop ? s.dropX : this.scoopX(api), dd = s.drop ? Math.sin(Math.min(1, s.drop) * Math.PI) : 0, sy = lerp(gy - 90, gy + 14, dd);
          ctx.strokeStyle = "#d6d2c8"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(lx + 30, ly - 12); ctx.lineTo(sx, gy - 100); ctx.lineTo(sx, sy - 12); ctx.stroke();
          ctx.fillStyle = "#a8a397"; rr(ctx, sx - 13, sy - 14, 26, 18, 4); ctx.fill();
          ctx.fillStyle = "#555"; ctx.fillRect(sx - 13, sy + 2, 26, 4);
          if (!s.drop) { ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, sy + 8); ctx.lineTo(sx, gy); ctx.stroke(); ctx.setLineDash([]); }
          text(ctx, "Tap DIG when the scoop is over soft soil", W / 2, 22, Math.min(15, W / 30), "#3a1a0c");
        } else {
          // GCMS oven panel
          const pw = Math.min(W - 24, 640), px = (W - pw) / 2, py = 14, ph = gy - 26;
          ctx.fillStyle = "rgba(10,14,24,.92)"; rr(ctx, px, py, pw, ph, 14); ctx.fill();
          text(ctx, "GCMS OVEN · GAS CHROMATOGRAPH MASS SPECTROMETER", px + pw / 2, py + 16, 11, "#9aa7bb");
          const gx = px + 30, gyTop = py + 36, gh = ph - 56, tmax = 650, ty = (t) => gyTop + gh - (t / tmax) * gh;
          ctx.fillStyle = "#1b2538"; rr(ctx, gx, gyTop, 24, gh, 12); ctx.fill();
          const b = BAND[Math.min(s.band, 1)];
          if (s.phase === "bake") { ctx.fillStyle = "rgba(70,224,176,.35)"; ctx.fillRect(gx - 6, ty(b.hi), 36, ty(b.lo) - ty(b.hi)); ctx.fillStyle = "rgba(255,93,93,.25)"; ctx.fillRect(gx - 6, gyTop, 36, ty(b.hi + 70) - gyTop); }
          const tc = s.temp > b.hi + 40 ? "#ff5d5d" : s.temp >= b.lo ? "#46e0b0" : "#ff9a52";
          ctx.fillStyle = tc; rr(ctx, gx + 5, ty(s.temp), 14, gyTop + gh - ty(s.temp), 7); ctx.fill();
          text(ctx, Math.round(s.temp) + " °C", gx + 70, ty(s.temp), 18, tc, "left", 800);
          if (s.phase === "bake") { text(ctx, "Target " + b.t + " °C", gx + 70, ty(b.t) - 22, 11, "#9fffe0", "left", 600); const k = s.holdT / 1.6; ctx.strokeStyle = "#46e0b0"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(gx + 150, ty(b.t) + 8, 14, -Math.PI / 2, -Math.PI / 2 + PI2 * k); ctx.stroke(); }
          // spectrum
          const bx = px + pw * 0.48, bw = pw * 0.46, by = gyTop + gh, bh = gh * 0.78;
          const bars = [["H₂O", s.gas["H₂O"], "#5cc8ff"], ["CO₂", s.gas["CO₂"], "#ffd166"], ["CH₃Cl", s.gas["CH₃Cl"] * 0.45, "#ff9a52"], ["Complex organics", 0, "#46e0b0"]];
          bars.forEach((br, i) => { const w = bw / bars.length - 10, x = bx + i * (bw / bars.length); ctx.fillStyle = "#1b2538"; ctx.fillRect(x, by - bh, w, bh); ctx.fillStyle = br[2]; ctx.fillRect(x, by - bh * br[1], w, bh * br[1]); text(ctx, br[0], x + w / 2, by + 10, Math.min(10, w / 5), "#cdd6e4", "center", 600); });
          const lastX = bx + 3 * (bw / 4), lw = bw / 4 - 10;
          ctx.save(); ctx.translate(lastX + lw / 2, by - bh / 2); ctx.rotate(-0.5); text(ctx, "NOT DETECTED", 0, 0, Math.min(12, lw / 6), "rgba(255,93,93,.9)", "center", 800); ctx.restore();
          if (s.phase === "quiz") text(ctx, "No complex organics detected. What's the best conclusion?", W / 2, gy + (H - gy) / 2, Math.min(17, W / 28), "#fff");
          else text(ctx, s.heat ? "Heating…" : "Hold HEAT (or press and hold the screen)", W / 2, gy + (H - gy) / 2, Math.min(16, W / 28), "#ffe9d6");
        }
      },
    };
  })();

  /* ---------- 3. SPIRIT · Dead-Wheel Dig ---------- */
  (function () {
    let s;
    GAMES.spi = {
      id: "spi", mission: "Spirit Rover", icon: "⚙️", title: "Dead-Wheel Dig",
      tagline: "Spirit's right-front wheel broke in 2006, so its drivers drove it <b>backwards</b> and dragged the broken wheel. That trench turned up a huge surprise. Can you find it?",
      how: [["👆", "Drag (or use ◀ ▶ and the arrow keys) to steer. Spirit keeps reversing on its own."], ["📡", "Flickering <b>Mini-TES rings</b> show something interesting under the dust. Drag the <b>broken wheel's trench</b> right through them."], ["⚠️", "Stay off the rippled soft sand: it drains your power. Find <b>3 white patches</b> before your power runs out."]],
      sci: "<b>Real science:</b> In 2007 Spirit's dragged wheel scraped up bright white soil that turned out to be about <b>90% silica</b>. On Earth, deposits like that form around <b>hot springs or steam vents</b>, places where microbes can live. It became one of Spirit's biggest discoveries. Spirit later got stuck in soft sand at a spot called 'Troy' in 2009.",
      photo: { src: "assets/hardware/spirit-rover/overview-PIA05040.jpg", cap: "Spirit stretches out on Mars (NASA/JPL-Caltech)" },
      hintFor(l) {
        return ["The trench comes from the <b>broken wheel</b> (marked ✖ on the rover), not from the middle. Line up the ✖ wheel with the flickering ring.", "Steer early. The rover slides sideways slowly, so start moving as soon as you see a ring ahead.", "Rippled patches are soft sand. Go around them to save power."][Math.min(l, 2)];
      },
      init(api) {
        s = { t: 0, wy: 0, x: api.W / 2, tx: api.W / 2, steer: 0, power: 100, found: 0, trench: [], patches: [], sand: [], next: 260, nextSand: 520, rnd: seeded((Date.now() % 7919) + 3), spark: [], over: false, hold: { L: 0, R: 0 } };
        this.api = api;
        api.ctrls(`<button data-hold="L" aria-label="Steer left" style="min-width:90px">◀</button><span class="sep"></span><button data-hold="R" aria-label="Steer right" style="min-width:90px">▶</button>`);
        this.stat(api);
      },
      stat(api) { api.stat(`<span>⚪ Silica ${s.found}/3</span><span>🔋 ${Math.max(0, Math.round(s.power))}%</span>`); },
      hold(id, v) { s.hold[id] = v ? 1 : 0; },
      key(code, down) {
        if (code === "ArrowLeft" || code === "KeyA") { s.hold.L = down ? 1 : 0; return true; }
        if (code === "ArrowRight" || code === "KeyD") { s.hold.R = down ? 1 : 0; return true; }
        return false;
      },
      down(x) { s.tx = x + 16; s.drag = true; },
      move(x, y, pressed) { if (pressed && s.drag) s.tx = x + 16; },
      up() { s.drag = false; },
      update(dt, api) {
        const W = api.W;
        s.t += dt;
        const speed = 62;
        s.wy += speed * dt;
        if (s.hold.L || s.hold.R) s.tx = s.x + (s.hold.R - s.hold.L) * 200;
        const dx = clamp(s.tx - s.x, -150 * dt, 150 * dt);
        s.x = clamp(s.x + dx, 40, W - 40);
        s.power -= dt * 1.45;
        const wheelX = s.x - 16, wheelWy = s.wy - 18;
        if (!s.trench.length || wheelWy - s.trench[s.trench.length - 1].wy > 5) s.trench.push({ x: wheelX, wy: wheelWy });
        if (s.trench.length > 400) s.trench.shift();
        while (s.next < s.wy + 900) { s.patches.push({ x: 60 + s.rnd() * (W - 120), wy: s.next, r: 30, found: false }); s.next += 300 + s.rnd() * 160; }
        while (s.nextSand < s.wy + 900) { s.sand.push({ x: 50 + s.rnd() * (W - 100), wy: s.nextSand, rx: 50 + s.rnd() * 30, ry: 26, hit: false }); s.nextSand += 330 + s.rnd() * 220; }
        for (const p of s.patches) {
          if (!p.found && Math.abs(wheelWy - p.wy) < p.r && Math.abs(wheelX - p.x) < p.r * 0.95) {
            p.found = true;
            s.found++;
            sfx.good();
            api.toast(s.found === 1 ? "✨ Bright WHITE soil! The Mini-TES says it's silica-rich!" : `✨ Silica patch ${s.found}/3 uncovered!`, "good");
            for (let i = 0; i < 14; i++) s.spark.push({ x: p.x, wy: p.wy, vx: (Math.random() - 0.5) * 120, vy: (Math.random() - 0.5) * 120, l: 0.8 });
            this.stat(api);
            if (s.found >= 3) {
              const st = s.power > 55 ? 3 : s.power > 30 ? 2 : 1;
              setTimeout(() => api.win({ stars: st, line: `You uncovered <b>3 silica-rich patches</b> with ${Math.round(s.power)}% power left, just like Spirit's surprise find in 2007.`, summary: "Drove Spirit backwards, dragging the broken wheel, and uncovered silica-rich soil from ancient hot springs." }), 700);
              s.found = 99;
            }
          }
        }
        for (const z of s.sand) {
          const ry = (z.wy - s.wy) / z.ry, rx = (s.x - z.x) / z.rx;
          if (!z.hit && rx * rx + ry * ry < 1) {
            z.hit = true;
            s.power -= 18;
            api.fail("🏜️ Soft sand! Spinning wheels drained 18% power. Spirit got stuck like this at 'Troy' in 2009.");
          }
        }
        s.spark.forEach((p) => { p.x += p.vx * dt; p.wy += p.vy * dt; p.l -= dt; });
        s.spark = s.spark.filter((p) => p.l > 0);
        s.patches = s.patches.filter((p) => p.wy > s.wy - 600);
        s.sand = s.sand.filter((p) => p.wy > s.wy - 600);
        if (Math.floor(s.t * 2) !== Math.floor((s.t - dt) * 2)) this.stat(api);
        if (s.power <= 0 && s.found < 3) api.lose({ line: "🔋 Out of power! Dust on the solar panels and soft sand drained the batteries." });
      },
      draw(ctx, api) {
        const W = api.W, H = api.H, ry = H * 0.66, sy = (wy) => ry - (wy - s.wy);
        ctx.fillStyle = "#a35d38";
        ctx.fillRect(0, 0, W, H);
        const tile = 160, k0 = Math.floor((s.wy - (H - ry)) / tile) - 1, k1 = Math.floor((s.wy + ry) / tile) + 1;
        for (let k = k0; k <= k1; k++) {
          const r = seeded(k * 977 + 13);
          for (let i = 0; i < 26; i++) {
            const x = r() * W, wy = k * tile + r() * tile, rad = r() * 3 + 0.6;
            ctx.fillStyle = r() > 0.5 ? "rgba(70,30,12,.28)" : "rgba(255,210,170,.12)";
            ctx.beginPath(); ctx.arc(x, sy(wy), rad, 0, PI2); ctx.fill();
          }
          if (r() > 0.55) { const x = r() * W, wy = k * tile + r() * tile, rd = seeded(k * 5 + 1); ctx.fillStyle = "#6c4434"; blob(ctx, x, sy(wy), 10 + r() * 10, rd); ctx.fill(); }
        }
        for (const z of s.sand) {
          const y = sy(z.wy);
          if (y < -60 || y > H + 60) continue;
          ctx.fillStyle = z.hit ? "rgba(225,175,120,.55)" : "rgba(230,182,128,.85)";
          ctx.beginPath(); ctx.ellipse(z.x, y, z.rx, z.ry, 0, 0, PI2); ctx.fill();
          ctx.strokeStyle = "rgba(150,95,55,.6)"; ctx.lineWidth = 1.5;
          for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(z.x, y + i * 7, z.rx * (0.9 - Math.abs(i) * 0.15), 3, 0, 0, Math.PI); ctx.stroke(); }
        }
        // trench
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = "#5a2a14"; ctx.lineWidth = 9;
        ctx.beginPath();
        s.trench.forEach((p, i) => (i ? ctx.lineTo(p.x, sy(p.wy)) : ctx.moveTo(p.x, sy(p.wy))));
        ctx.stroke();
        for (const p of s.patches) {
          if (!p.found) continue;
          ctx.strokeStyle = "#f6f3ea"; ctx.lineWidth = 9; ctx.shadowColor = "#fff"; ctx.shadowBlur = 12;
          ctx.beginPath(); let st = false;
          for (const t of s.trench) { if (Math.hypot(t.x - p.x, t.wy - p.wy) < p.r * 1.3) { st ? ctx.lineTo(t.x, sy(t.wy)) : ctx.moveTo(t.x, sy(t.wy)); st = true; } else st = false; }
          ctx.stroke(); ctx.shadowBlur = 0;
        }
        for (const p of s.patches) {
          if (p.found) continue;
          const y = sy(p.wy), ahead = p.wy - s.wy;
          if (ahead > 40 && ahead < 300) {
            const ph = (s.t * 1.3 + p.x * 0.01) % 1, a = Math.max(0, Math.sin(ph * Math.PI)) * (1 - ahead / 300) * 0.9;
            ctx.strokeStyle = `rgba(92,200,255,${a})`; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.arc(p.x, y, p.r * (0.7 + ph * 0.5), 0, PI2); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        s.spark.forEach((p) => { ctx.fillStyle = `rgba(255,255,255,${p.l})`; ctx.beginPath(); ctx.arc(p.x, sy(p.wy), 3, 0, PI2); ctx.fill(); });
        // rover (front faces down; it drives backward / up the screen)
        ctx.save(); ctx.translate(s.x, ry);
        ctx.fillStyle = "rgba(0,0,0,.25)"; rr(ctx, -30, -26, 64, 60, 10); ctx.fill();
        ctx.fillStyle = "#1e1e24";
        [[-27, -20], [21, -20], [-27, -2], [21, -2], [21, 14]].forEach(([x, y]) => { rr(ctx, x, y, 10, 14, 3); ctx.fill(); });
        ctx.fillStyle = "#3a1e14"; rr(ctx, -27, 14, 10, 14, 3); ctx.fill();
        ctx.strokeStyle = "#ff5d5d"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-26, 15); ctx.lineTo(-18, 27); ctx.moveTo(-18, 15); ctx.lineTo(-26, 27); ctx.stroke();
        ctx.fillStyle = "#2c3f66"; rr(ctx, -40, -14, 80, 22, 4); ctx.fill();
        ctx.fillStyle = "#d8d2c4"; rr(ctx, -16, -22, 32, 44, 6); ctx.fill();
        ctx.fillStyle = "#888"; ctx.fillRect(-3, 16, 6, 10);
        ctx.restore();
        text(ctx, "▲ reversing", s.x, ry - 38, 11, "rgba(255,255,255,.75)", "center", 600);
        text(ctx, "✖ broken wheel", s.x - 30, ry + 44, 10, "#ffb0a8", "center", 700);
      },
    };
  })();

  /* ---------- 4. OPPORTUNITY · Blueberry Hunt ---------- */
  (function () {
    let s;
    const TEX = 900;
    function makeTex(seed) {
      const c = document.createElement("canvas");
      c.width = c.height = TEX;
      const x = c.getContext("2d"), r = seeded(seed);
      x.fillStyle = "#94704f"; x.fillRect(0, 0, TEX, TEX);
      for (let b = 0; b < 26; b++) {
        const y0 = b * (TEX / 24) + r() * 10, tint = ["#8a6548", "#9d7858", "#a5805f", "#85603f"][b % 4];
        x.fillStyle = tint; x.beginPath(); x.moveTo(0, y0);
        for (let i = 0; i <= 12; i++) x.lineTo((i / 12) * TEX, y0 + Math.sin(i * 0.9 + b) * 6 + i * 0.8);
        x.lineTo(TEX, y0 + 40); x.lineTo(0, y0 + 40); x.closePath(); x.fill();
      }
      for (let i = 0; i < 5200; i++) { x.fillStyle = r() > 0.5 ? "rgba(60,35,20,.35)" : "rgba(255,230,200,.18)"; x.fillRect(r() * TEX, r() * TEX, r() * 3 + 1, r() * 3 + 1); }
      const items = [], ok = (px, py, pr) => Math.hypot(px - TEX / 2, py - TEX / 2) < TEX / 2 - pr - 40 && items.every((it) => Math.hypot(it.x - px, it.y - py) > it.r + pr + 26);
      const place = (type, n, rmin, rmax) => { let guard = 0; while (n > 0 && guard++ < 2000) { const pr = rmin + r() * (rmax - rmin), px = r() * TEX, py = r() * TEX; if (ok(px, py, pr)) { items.push({ type, x: px, y: py, r: pr, found: false, seed: Math.floor(r() * 1e6) }); n--; } } };
      place("berry", 9, 20, 32); place("grain", 6, 14, 22); place("vug", 3, 18, 26);
      for (const it of items) {
        if (it.type === "berry") {
          x.fillStyle = "rgba(30,15,8,.45)"; x.beginPath(); x.arc(it.x + 5, it.y + 6, it.r, 0, PI2); x.fill();
          const g = x.createRadialGradient(it.x - it.r * 0.35, it.y - it.r * 0.4, it.r * 0.1, it.x, it.y, it.r);
          g.addColorStop(0, "#9aa0ad"); g.addColorStop(0.45, "#4f5563"); g.addColorStop(1, "#2a2d36");
          x.fillStyle = g; x.beginPath(); x.arc(it.x, it.y, it.r, 0, PI2); x.fill();
        } else if (it.type === "grain") {
          const g = x.createRadialGradient(it.x - it.r * 0.3, it.y - it.r * 0.3, 1, it.x, it.y, it.r);
          g.addColorStop(0, "#f1d9b5"); g.addColorStop(1, "#c39a6b");
          x.fillStyle = g; blob(x, it.x, it.y, it.r, seeded(it.seed), 8); x.fill();
        } else {
          x.fillStyle = "#2b1a10"; x.beginPath();
          const rr2 = seeded(it.seed);
          for (let i = 0; i < 5; i++) { const a = (i / 5) * PI2 + rr2(), d = it.r * (0.7 + rr2() * 0.5); i ? x.lineTo(it.x + Math.cos(a) * d, it.y + Math.sin(a) * d * 0.5) : x.moveTo(it.x + Math.cos(a) * d, it.y + Math.sin(a) * d * 0.5); }
          x.closePath(); x.fill();
        }
      }
      return { c, items };
    }
    GAMES.opp = {
      id: "opp", mission: "Opportunity Rover", icon: "🫐", title: "Blueberry Hunt",
      tagline: "Use Opportunity's <b>Microscopic Imager</b> to zoom in on Martian rock. First get a sharp focus, then find the mysterious round grains scientists nicknamed <b>'blueberries'</b>.",
      how: [["🔎", "Move the <b>arm distance</b> slider until the picture is perfectly sharp."], ["🫐", "Tap <b>7 blueberries</b>: small, dark grey, perfectly round balls."], ["❌", "Don't be fooled by light sand grains or empty holes. Wrong taps cost 3 seconds."]],
      sci: "<b>Real science:</b> In 2004 Opportunity's Microscopic Imager found millimetre-sized spheres embedded in layered rock at Meridiani Planum. Its Mössbauer spectrometer showed they were rich in <b>hematite</b>, an iron mineral that often forms in water. The blueberries probably grew inside the rock as <b>groundwater</b> seeped through it. That's strong evidence Mars was once wet.",
      photo: { src: "assets/hardware/opportunity-rover/evidence_blueberries-PIA19113.jpg", cap: "Martian concretions ('blueberries') near Fram Crater (NASA/JPL-Caltech/Cornell/USGS)" },
      hintFor(l) {
        if (!s || s.phase === "focus") return ["Slowly slide the arm distance and watch the picture. Somewhere in the middle it snaps into focus.", "The sharpness meter turns green when you're close. Make tiny moves (arrow keys work too)."][Math.min(l, 1)];
        return ["Blueberries are <b>dark grey</b>, perfectly <b>round</b>, and have a shiny highlight. Light tan blobs are just sand grains.", "Dark <b>angular</b> holes are 'vugs', spaces where crystals dissolved. Skip them.", "Scan the image in rows from top to bottom so you don't miss any."][Math.min(l, 2)];
      },
      init(api) {
        const t = makeTex((Date.now() % 7907) + 5);
        s = { phase: "focus", t: 0, tex: t.c, items: t.items, v: 8, target: 52 + Math.floor(Math.random() * 30), lockT: 0, time: 45, found: 0, need: 7, marks: [], tmp: document.createElement("canvas") };
        this.api = api;
        api.ctrls(`<label style="display:flex;align-items:center;gap:10px;flex:1;max-width:560px;font-weight:600;font-size:14px">↔ Arm distance <input id="rq-opp-f" type="range" min="0" max="100" value="8" style="flex:1;accent-color:#ff8a3d;min-height:36px" aria-label="Microscopic Imager arm distance"></label>`);
        const f = document.getElementById("rq-opp-f");
        f.oninput = () => { s.v = +f.value; RQ.hints && RQ.hints.bump(); };
        api.stat(`<span>🔎 Focus the imager</span>`);
      },
      key(code) {
        if (s.phase !== "focus") return false;
        const f = document.getElementById("rq-opp-f");
        if (code === "ArrowLeft" || code === "ArrowRight") { s.v = clamp(s.v + (code === "ArrowRight" ? 1 : -1), 0, 100); if (f) f.value = s.v; return true; }
        return false;
      },
      geom(api) { const R = Math.min(api.W, api.H) * 0.45; return { cx: api.W / 2, cy: api.H / 2, R, k: (R * 2) / TEX }; },
      down(x, y) {
        if (s.phase !== "hunt") return;
        const api = this.api, g = this.geom(api);
        if (Math.hypot(x - g.cx, y - g.cy) > g.R) return;
        const tx = (x - g.cx) / g.k + TEX / 2, ty = (y - g.cy) / g.k + TEX / 2;
        let best = null, bd = 1e9;
        for (const it of s.items) { const d = Math.hypot(it.x - tx, it.y - ty); if (d < it.r + 16 / g.k && d < bd) { bd = d; best = it; } }
        if (!best) { s.marks.push({ x: tx, y: ty, t: 0.5, ok: null }); return; }
        if (best.found) return;
        if (best.type === "berry") {
          best.found = true;
          s.found++;
          sfx.good();
          s.marks.push({ x: best.x, y: best.y, t: 99, ok: true, r: best.r });
          api.stat(`<span>🫐 ${s.found}/${s.need}</span><span>⏱ ${Math.ceil(s.time)}s</span>`);
          if (s.found >= s.need) {
            const st = s.time > 22 ? 3 : s.time > 10 ? 2 : 1;
            api.win({ stars: st, line: `You spotted <b>${s.found} hematite blueberries</b> with ${Math.ceil(s.time)} seconds to spare.`, summary: "Focused Opportunity's Microscopic Imager and identified hematite 'blueberries', evidence of ancient groundwater." });
          }
        } else {
          best.found = true;
          s.time -= 3;
          s.marks.push({ x: best.x, y: best.y, t: 1.2, ok: false, r: best.r });
          api.fail(best.type === "grain" ? "That's a light sand grain, not a blueberry. Blueberries are dark grey and perfectly round. (−3 s)" : "That's a 'vug', an empty hole left where crystals dissolved. It's also a clue to water, but not a blueberry! (−3 s)");
        }
      },
      update(dt, api) {
        s.t += dt;
        s.marks.forEach((m) => (m.t -= dt));
        s.marks = s.marks.filter((m) => m.t > 0);
        if (s.phase === "focus") {
          if (Math.abs(s.v - s.target) <= 3) {
            s.lockT += dt;
            if (s.lockT > 0.6) {
              s.phase = "hunt";
              sfx.good();
              api.toast("🔒 Focus locked! Now tap the blueberries.", "good");
              api.ctrls("");
              api.stat(`<span>🫐 0/${s.need}</span><span>⏱ ${s.time}s</span>`);
              MG.resize();
            }
          } else s.lockT = 0;
        } else if (s.phase === "hunt") {
          const prev = Math.ceil(s.time);
          s.time -= dt;
          if (Math.ceil(s.time) !== prev) api.stat(`<span>🫐 ${s.found}/${s.need}</span><span>⏱ ${Math.max(0, Math.ceil(s.time))}s</span>`);
          if (s.time <= 0) api.lose({ line: `Time's up! You found ${s.found} of ${s.need} blueberries.` });
        }
      },
      draw(ctx, api) {
        const W = api.W, H = api.H, g = this.geom(api);
        ctx.fillStyle = "#05070b"; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R, 0, PI2); ctx.clip();
        const blurAmt = s.phase === "focus" ? Math.abs(s.v - s.target) / 100 : 0;
        if (blurAmt > 0.03) {
          const f = clamp(1 - blurAmt * 2.2, 0.06, 1), w = Math.max(8, Math.round(TEX * f * 0.5));
          s.tmp.width = s.tmp.height = w;
          const tc = s.tmp.getContext("2d");
          tc.imageSmoothingEnabled = true;
          tc.drawImage(s.tex, 0, 0, w, w);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(s.tmp, g.cx - g.R, g.cy - g.R, g.R * 2, g.R * 2);
        } else ctx.drawImage(s.tex, g.cx - g.R, g.cy - g.R, g.R * 2, g.R * 2);
        for (const m of s.marks) {
          const x = g.cx + (m.x - TEX / 2) * g.k, y = g.cy + (m.y - TEX / 2) * g.k, r = ((m.r || 14) + 8) * g.k;
          ctx.lineWidth = 3;
          ctx.strokeStyle = m.ok === true ? "#46e0b0" : m.ok === false ? "#ff5d5d" : "rgba(255,255,255,.5)";
          ctx.beginPath(); ctx.arc(x, y, Math.max(8, r), 0, PI2); ctx.stroke();
          if (m.ok === false) { ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.6); ctx.stroke(); }
        }
        const vg = ctx.createRadialGradient(g.cx, g.cy, g.R * 0.7, g.cx, g.cy, g.R);
        vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)");
        ctx.fillStyle = vg; ctx.fillRect(g.cx - g.R, g.cy - g.R, g.R * 2, g.R * 2);
        ctx.restore();
        ctx.strokeStyle = "#3a4760"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(g.cx, g.cy, g.R + 3, 0, PI2); ctx.stroke();
        ctx.strokeStyle = "rgba(92,200,255,.4)"; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; ctx.beginPath(); ctx.moveTo(g.cx + Math.cos(a) * (g.R - 14), g.cy + Math.sin(a) * (g.R - 14)); ctx.lineTo(g.cx + Math.cos(a) * (g.R + 10), g.cy + Math.sin(a) * (g.R + 10)); ctx.stroke(); }
        text(ctx, "MICROSCOPIC IMAGER", 16, 18, 11, "#9aa7bb", "left");
        text(ctx, "View ≈ 3 cm wide", 16, 34, 11, "#9aa7bb", "left", 500);
        const bar = g.R * 2 * (1 / 3);
        ctx.fillStyle = "#fff"; ctx.fillRect(W - 20 - bar, H - 22, bar, 4);
        text(ctx, "1 cm", W - 20 - bar / 2, H - 34, 11, "#fff");
        if (s.phase === "focus") {
          const sharp = clamp(1 - Math.abs(s.v - s.target) / 40, 0, 1);
          const mw = Math.min(220, W * 0.4);
          ctx.fillStyle = "#1b2538"; rr(ctx, W / 2 - mw / 2, H - 26, mw, 10, 5); ctx.fill();
          ctx.fillStyle = sharp > 0.9 ? "#46e0b0" : sharp > 0.6 ? "#ffd166" : "#ff8a3d"; rr(ctx, W / 2 - mw / 2, H - 26, mw * sharp, 10, 5); ctx.fill();
          text(ctx, sharp > 0.9 ? "Almost… hold it!" : "Sharpness", W / 2, H - 38, 12, "#cdd6e4", "center", 600);
        }
      },
    };
  })();

  /* ---------- 5. INSIGHT · Marsquake Catcher ---------- */
  (function () {
    let s;
    const SPEED = 95;
    function sig(t) {
      let v = 0.045 * (Math.sin(t * 31) * 0.5 + Math.sin(t * 47.3 + 1) * 0.3 + Math.sin(t * 73.1 + 2) * 0.2);
      for (const q of s.quakes) {
        if (t > q.tp) { const d = t - q.tp; v += q.aP * Math.exp(-d * 1.6) * Math.sin(PI2 * 7.5 * d) * (0.8 + 0.2 * Math.sin(d * 23)); }
        if (t > q.tS) { const d = t - q.tS; v += q.aS * Math.exp(-d * 0.95) * Math.sin(PI2 * 3 * d + 0.5) * (0.85 + 0.15 * Math.sin(d * 17)); }
      }
      for (const w of s.wind) { if (t > w.t0 && t < w.t0 + w.d) { const d = (t - w.t0) / w.d; v += 0.2 * Math.sin(Math.PI * d) * Math.sin(PI2 * 0.9 * (t - w.t0)); } }
      return v;
    }
    GAMES.ins = {
      id: "ins", mission: "InSight Lander", icon: "🌋", title: "Marsquake Catcher",
      tagline: "InSight listened to Mars's heartbeat. Use the robotic arm to set the <b>SEIS seismometer</b> on the ground, cover it with its wind shield, then catch <b>3 marsquakes</b> as they arrive.",
      how: [["🦾", "<b>Drag</b> the orange SEIS onto the flat spot, then drag the white dome shield on top of it."], ["〰️", "When the first quick little wiggles appear, tap <b>P</b>. That's the fast P-wave."], ["🌊", "When the bigger, slower shaking arrives, tap <b>S</b>. Ignore gentle wobbles from the wind."]],
      sci: "<b>Real science:</b> InSight's arm placed SEIS on the ground in December 2018 and covered it with a wind and thermal shield. By the end of the mission in 2022 it had detected <b>1,319 marsquakes</b>. P-waves always arrive before S-waves, and the bigger the gap between them, the farther away the quake. Studying these waves showed that Mars has a <b>liquid metal core</b> about half as wide as the planet.",
      photo: { src: "assets/hardware/insight/instrument-PIA23177.jpg", cap: "InSight's seismometer on the Martian surface (NASA/JPL-Caltech)" },
      hintFor(l) {
        if (!s || s.phase !== "quake") return ["Press on the orange SEIS dome, then drag it onto the dashed flat spot on the ground.", "After SEIS is down, drag the white shield dome right on top of it."][Math.min(l, 1)];
        return ["Watch the line on the right. Small, fast wiggles = <b>P</b>. Bigger, slower shaking a few seconds later = <b>S</b>.", "Always tap P first. S-waves are slower, so they arrive second.", "Slow, gentle bumps marked 💨 are wind from a dust devil. Don't tap for those."][Math.min(l, 2)];
      },
      init(api) {
        const W = api.W;
        s = { phase: "seis", t: 0, ts: 0, drag: null, seis: { x: 0, y: 0, placed: false }, wts: { x: 0, y: 0, placed: false }, quakes: [], wind: [], caught: 0, cur: null, marks: [], trace: [] };
        this.api = api;
        this.layout(api, true);
        api.ctrls(`<button data-c="AUTO" title="Let the arm place it for you">🤖 Auto-place with arm</button>`);
        api.stat(`<span>🦾 Deploy SEIS</span>`);
      },
      layout(api, reset) {
        const W = api.W, H = api.H;
        s.gy = H * 0.72;
        s.deckY = s.gy - 70;
        s.zone = { x: W * 0.66, y: s.gy };
        if (reset || !s.seis.placed) { s.seis.x = W * 0.27; s.seis.y = s.deckY - 18; }
        else { s.seis.x = s.zone.x; s.seis.y = s.gy - 18; }
        if (reset || !s.wts.placed) { s.wts.x = W * 0.15; s.wts.y = s.deckY - 22; }
        else { s.wts.x = s.zone.x; s.wts.y = s.gy - 24; }
      },
      resize(api) { this.layout(api, false); },
      startQuakes(api) {
        s.phase = "quake";
        s.ts = 0;
        api.ctrls(`<button class="rq-btn big" data-c="P" style="min-width:120px;border-color:#5cc8ff">P-wave</button><button class="rq-btn big" data-c="S" style="min-width:120px;border-color:#ffb36b">S-wave</button>`);
        api.stat(`<span>🌋 0/3 quakes</span>`);
        this.schedule(2.6);
      },
      schedule(delay) {
        const tp = s.ts + delay + Math.random() * 2.2, gap = 2.6 + Math.random() * 3;
        const q = { tp, tS: tp + gap, aP: 0.32 + Math.random() * 0.1, aS: 0.85 + Math.random() * 0.15, p: false, sDone: false };
        s.quakes.push(q);
        s.cur = q;
        if (s.caught >= 1) s.wind.push({ t0: s.ts + delay * 0.2 + 0.2, d: 2.2 });
      },
      ctrl(c) {
        const api = this.api;
        if (c === "AUTO" && s.phase === "seis") {
          if (!s.seis.placed) this.place("seis");
          else this.place("wts");
          return;
        }
        if (s.phase !== "quake" || !s.cur) return;
        const q = s.cur, t = s.ts;
        if (c === "P") {
          if (q.p) { api.toast("You already marked this P-wave. Now wait for the S-wave.", ""); return; }
          const inWind = s.wind.some((w) => t > w.t0 && t < w.t0 + w.d);
          if (t < q.tp) return api.fail(inWind ? "💨 That gentle wobble is wind from a dust devil, not a marsquake." : "Too early! That's just background noise. Wait for the sharp first wiggles.");
          if (t > q.tS + 0.2) return api.fail("Too late for the P-wave. The S-wave is already here!");
          q.p = true; q.pAt = t; sfx.good(); api.toast("✅ P-wave marked! The slower S-wave is coming…", "good");
        } else if (c === "S") {
          if (!q.p) return api.fail("Mark the <b>P-wave</b> first. P-waves are faster, so they always arrive first!");
          if (t < q.tS) return api.fail("Not yet! That's still the P-wave. S-waves are bigger, slower shakes.");
          q.sDone = true;
          s.caught++;
          sfx.good();
          const gap = q.tS - q.tp;
          api.toast(`🌋 Quake caught! S–P gap ${gap.toFixed(1)} s ≈ ${Math.round(gap * 8)} km away <small>(game rule: ~8 km per second of gap)</small>`, "good");
          api.stat(`<span>🌋 ${s.caught}/3 quakes</span>`);
          s.cur = null;
          if (s.caught >= 3) {
            const st = api.fails === 0 ? 3 : api.fails <= 2 ? 2 : 1;
            setTimeout(() => api.win({ stars: st, line: `You deployed SEIS and caught <b>3 marsquakes</b>${api.fails ? ` with ${api.fails} slip${api.fails > 1 ? "s" : ""}` : " without a single mistake"}.`, summary: "Deployed InSight's SEIS with the robotic arm and timed P- and S-wave arrivals for 3 marsquakes." }), 1400);
          } else this.schedule(3);
        }
      },
      key(code, down) {
        if (!down) return false;
        if (code === "KeyP" || code === "Digit1") { this.ctrl("P"); return true; }
        if (code === "KeyS" || code === "Digit2") { this.ctrl("S"); return true; }
        if (code === "Enter" && s.phase === "seis") { this.ctrl("AUTO"); return true; }
        return false;
      },
      place(which) {
        const api = this.api;
        if (which === "seis") { s.seis.placed = true; s.seis.x = s.zone.x; s.seis.y = s.gy - 18; sfx.good(); api.toast("✅ SEIS is on the ground! Now cover it with the wind & thermal shield.", "good"); api.stat(`<span>🦾 Cover with shield</span>`); }
        else { s.wts.placed = true; s.wts.x = s.zone.x; s.wts.y = s.gy - 24; sfx.good(); api.toast("✅ Shield on! The wind noise drops away. Listening for marsquakes…", "good"); setTimeout(() => this.startQuakes(api), 1100); s.phase = "wait"; }
      },
      down(x, y) {
        if (s.phase !== "seis") return;
        if (!s.seis.placed && Math.hypot(x - s.seis.x, y - s.seis.y) < 44) s.drag = "seis";
        else if (s.seis.placed && !s.wts.placed && Math.hypot(x - s.wts.x, y - s.wts.y) < 50) s.drag = "wts";
        else if (s.seis.placed && Math.hypot(x - s.seis.x, y - s.seis.y) < 40) this.api.toast("SEIS is placed. Now drag the <b>white dome</b> shield onto it.", "");
        else if (!s.seis.placed && Math.hypot(x - s.wts.x, y - s.wts.y) < 50) this.api.toast("Place the <b>orange SEIS</b> first. The shield goes on top of it.", "");
      },
      move(x, y) { if (s.drag) { const o = s[s.drag]; o.x = x; o.y = y; } },
      up(x, y) {
        if (!s.drag) return;
        const api = this.api, which = s.drag;
        s.drag = null;
        if (which === "seis") {
          if (Math.abs(x - s.zone.x) < 60 && y > s.gy - 80 && y < s.gy + 40) this.place("seis");
          else { api.fail("SEIS needs the flat, marked spot on the ground so it sits perfectly still."); this.layout(api, false); s.seis.x = api.W * 0.27; s.seis.y = s.deckY - 18; }
        } else {
          if (Math.hypot(x - s.zone.x, y - (s.gy - 24)) < 60) this.place("wts");
          else { api.fail("Drop the shield right on top of SEIS to block wind and temperature swings."); s.wts.x = api.W * 0.15; s.wts.y = s.deckY - 22; }
        }
      },
      update(dt, api) {
        s.t += dt;
        if (s.phase === "quake") {
          s.ts += dt;
          const q = s.cur;
          if (q && s.ts > q.tS + 3) {
            api.fail("Missed that one! The quake passed. Watch for the small fast wiggles first.");
            s.cur = null;
            this.schedule(2);
          }
        }
      },
      draw(ctx, api) {
        const W = api.W, H = api.H;
        if (s.phase === "quake") return this.drawSeismo(ctx, api);
        const sky = ctx.createLinearGradient(0, 0, 0, s.gy);
        sky.addColorStop(0, "#caa07e"); sky.addColorStop(1, "#ead0b2");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, s.gy);
        ctx.fillStyle = "#b8774d"; ctx.fillRect(0, s.gy, W, H - s.gy);
        const r = seeded(21);
        for (let i = 0; i < 90; i++) { ctx.fillStyle = "rgba(70,35,15,.25)"; ctx.beginPath(); ctx.arc(r() * W, s.gy + r() * (H - s.gy), r() * 2 + 0.5, 0, PI2); ctx.fill(); }
        for (let i = 0; i < 6; i++) { const x = W * (0.4 + r() * 0.55); if (Math.abs(x - s.zone.x) < 80) continue; ctx.fillStyle = "#7a5442"; blob(ctx, x, s.gy + 4, 8 + r() * 10, seeded(i + 40)); ctx.fill(); }
        // flat zone
        ctx.setLineDash([6, 5]); ctx.strokeStyle = s.seis.placed ? "rgba(70,224,176,.8)" : "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(s.zone.x, s.gy + 4, 58, 13, 0, 0, PI2); ctx.stroke(); ctx.setLineDash([]);
        if (!s.seis.placed) text(ctx, "flat spot ↓", s.zone.x, s.gy - 26, 12, "#3a1a0c");
        // lander
        const lx = W * 0.2;
        ctx.strokeStyle = "#c8c8c8"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(lx - 50, s.deckY + 8); ctx.lineTo(lx - 64, s.gy); ctx.moveTo(lx + 50, s.deckY + 8); ctx.lineTo(lx + 64, s.gy); ctx.stroke();
        [-1, 1].forEach((d) => { ctx.fillStyle = "#3a4f78"; ctx.beginPath(); ctx.ellipse(lx + d * 100, s.deckY + 2, 50, 14, 0, 0, PI2); ctx.fill(); ctx.strokeStyle = "#7d8fb5"; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(lx + d * 100, s.deckY + 2); ctx.lineTo(lx + d * 100 + Math.cos(i) * 50, s.deckY + 2 + Math.sin(i) * 14); ctx.stroke(); } });
        ctx.fillStyle = "#e3ddd0"; rr(ctx, lx - 54, s.deckY - 4, 108, 22, 5); ctx.fill();
        text(ctx, "INSIGHT", lx, s.deckY + 7, 10, "#444");
        // arm to dragged/last object
        const tgt = s.drag ? s[s.drag] : !s.seis.placed ? s.seis : !s.wts.placed ? s.wts : s.wts;
        const sx = lx + 40, sy0 = s.deckY - 4, ex = tgt.x, ey = tgt.y - 24, mx = (sx + ex) / 2, my = Math.min(sy0, ey) - 60;
        ctx.strokeStyle = "#e8e4da"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.lineTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = "#9aa"; ctx.beginPath(); ctx.arc(mx, my, 6, 0, PI2); ctx.fill();
        // SEIS
        ctx.save(); ctx.translate(s.seis.x, s.seis.y);
        ctx.fillStyle = "#d18a3a"; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * PI2; i ? ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 10 + 6) : ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 10 + 6); } ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#f0b25e"; ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0, Math.PI, 0); ctx.fill();
        ctx.restore();
        text(ctx, "SEIS", s.seis.x, s.seis.y + 26, 10, "#fff");
        // WTS
        ctx.save(); ctx.translate(s.wts.x, s.wts.y);
        ctx.globalAlpha = s.wts.placed ? 0.95 : 1;
        ctx.fillStyle = "#f4f4f2"; ctx.beginPath(); ctx.ellipse(0, 6, 36, 30, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#c9c4b8"; ctx.fillRect(-38, 4, 76, 6);
        ctx.restore();
        if (!s.wts.placed) text(ctx, "SHIELD", s.wts.x, s.wts.y + 20, 10, "#333");
        text(ctx, !s.seis.placed ? "Drag the orange SEIS to the flat spot" : !s.wts.placed ? "Now drag the white shield onto SEIS" : "Listening…", W / 2, 24, Math.min(16, W / 28), "#3a1a0c");
      },
      drawSeismo(ctx, api) {
        const W = api.W, H = api.H;
        ctx.fillStyle = "#0a0f19"; ctx.fillRect(0, 0, W, H);
        const px = 14, py = 46, pw = W - 28, ph = H - 70, nowX = px + pw - 50, mid = py + ph / 2, amp = ph * 0.42;
        ctx.fillStyle = "#0f1625"; rr(ctx, px, py, pw, ph, 12); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.05)"; ctx.lineWidth = 1;
        for (let x = nowX; x > px; x -= SPEED) { ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x, py + ph); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(px, mid); ctx.lineTo(px + pw, mid); ctx.stroke();
        ctx.strokeStyle = "#7df0c8"; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = px + 2; x <= nowX; x += 1.5) { const t = s.ts - (nowX - x) / SPEED; const v = t < 0 ? 0 : sig(t); const y = mid - clamp(v, -1.1, 1.1) * amp; x === px + 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        for (const w of s.wind) { const x = nowX - (s.ts - (w.t0 + w.d / 2)) * SPEED; if (x > px && x < nowX && s.ts > w.t0 + 0.6) text(ctx, "💨", x, py + 18, 16); }
        for (const q of s.quakes) {
          [[q.p ? q.tp : null, "P", "#5cc8ff"], [q.sDone ? q.tS : null, "S", "#ffb36b"]].forEach(([t, l, c]) => {
            if (t == null) return;
            const x = nowX - (s.ts - t) * SPEED;
            if (x < px) return;
            ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, py + 8); ctx.lineTo(x, py + ph - 8); ctx.stroke(); ctx.setLineDash([]);
            text(ctx, l, x, py + ph - 16, 14, c, "center", 800);
          });
          if (q.p && q.sDone) { const x1 = nowX - (s.ts - q.tp) * SPEED, x2 = nowX - (s.ts - q.tS) * SPEED; if (x2 > px) { ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Math.max(px, x1), py + 26); ctx.lineTo(x2, py + 26); ctx.stroke(); text(ctx, (q.tS - q.tp).toFixed(1) + " s", (Math.max(px, x1) + x2) / 2, py + 16, 12, "#ffd166"); } }
        }
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nowX, py + 4); ctx.lineTo(nowX, py + ph - 4); ctx.stroke();
        text(ctx, "NOW", nowX, py - 10, 11, "#fff");
        text(ctx, "SEIS · live ground motion (simulated)", px + 6, 22, 12, "#9aa7bb", "left", 600);
        const q = s.cur;
        const msg = !q ? "Quake recorded!" : !q.p ? "Watch for small, fast wiggles → tap P" : "Now wait for the big, slow shaking → tap S";
        text(ctx, msg, W - 20, 22, Math.min(13, W / 36), "#e8eef8", "right", 600);
      },
    };
  })();

  /* ============================================== OBSERVATION vs INTERPRETATION SORTER */
  const SORT = {
    Sojourner: [
      ["Sojourner's APXS measured which chemical elements were in a rock.", 0, "A measurement made by an instrument is an observation."],
      ["Because the rock's chemistry differs from the soil, it may have a different history.", 1, "'May have' explains what the data could mean. That's an interpretation."],
      ["Sojourner drove about 100 metres during its whole mission.", 0, "Distance driven was measured, so it's an observation."],
      ["Rounded pebbles at the site suggest floods of water once flowed there.", 1, "'Suggest' links evidence to a past event that nobody saw. That's an interpretation."],
    ],
    "Viking 1 Lander": [
      ["The GCMS did not detect complex organic molecules in the soil.", 0, "This is what the instrument recorded, so it's an observation."],
      ["Perchlorate salts may have destroyed organics when the soil was heated.", 1, "This explains why nothing was found. It's an interpretation."],
      ["Viking 1's arm dug trenches in the soil of Chryse Planitia.", 0, "Photos show the trenches, so it's an observation."],
      ["The surface of Mars may be too harsh for life today.", 1, "A conclusion drawn from many results is an interpretation."],
    ],
    "Spirit Rover": [
      ["The dragged wheel uncovered bright white soil.", 0, "Cameras saw the white soil, so it's an observation."],
      ["Instruments measured about 90% silica in that soil.", 0, "A measured amount is an observation."],
      ["Hot springs or steam vents probably made the silica long ago.", 1, "'Probably made' explains the past. That's an interpretation."],
      ["Places like this could once have been good homes for microbes.", 1, "'Could have been' is a reasoned idea, an interpretation."],
    ],
    "Opportunity Rover": [
      ["The Microscopic Imager saw small round grains embedded in the rock.", 0, "What the camera saw is an observation."],
      ["The Mössbauer spectrometer detected hematite in the grains.", 0, "An instrument detection is an observation."],
      ["The 'blueberries' grew in groundwater inside the rock.", 1, "How they formed is inferred from evidence. That's an interpretation."],
      ["Meridiani Planum was once wet.", 1, "A conclusion about the ancient past is an interpretation."],
    ],
    "InSight Lander": [
      ["SEIS recorded P-waves arriving before S-waves.", 0, "The recorded arrival order is an observation."],
      ["InSight detected 1,319 marsquakes.", 0, "A count of recorded events is an observation."],
      ["Mars has a liquid metal core.", 1, "Nobody can see the core. It's inferred from how the waves behave, which makes it an interpretation."],
      ["Some marsquakes may be caused by the planet's crust cooling and shrinking.", 1, "A possible cause is an interpretation."],
    ],
  };
  const sorter = (RQ.sorter = {
    st: null,
    data: SORT,
    html(mission) {
      if (!SORT[mission]) return "";
      this.st = { m: mission, i: 0, res: [], busy: false };
      return `<div class="rq-sort" id="rq-sort" data-m="${esc(mission)}"><h4>🧠 Quick sort: observation or interpretation?</h4>
        <p class="sub">Scientists keep <b>what was measured</b> separate from <b>what it might mean</b>. Sort each card (you can swipe it too).</p>
        <div class="cardq" id="rq-sort-card" tabindex="0"></div>
        <div class="bins"><button type="button" class="obs" onclick="RQ.sorter.pick(0)">👁 Observation<br><small style="font-weight:500;color:#9aa7bb">seen or measured</small></button><button type="button" class="int" onclick="RQ.sorter.pick(1)">🧠 Interpretation<br><small style="font-weight:500;color:#9aa7bb">explains or infers</small></button></div>
        <div class="meter" id="rq-sort-meter">${SORT[mission].map(() => "<i></i>").join("")}</div><div class="why" id="rq-sort-why" aria-live="polite"></div></div>`;
    },
    mount() {
      const card = document.getElementById("rq-sort-card");
      if (!card || !this.st) return;
      this.show();
      let x0 = null;
      card.addEventListener("pointerdown", (e) => { x0 = e.clientX; card.setPointerCapture && card.setPointerCapture(e.pointerId); });
      card.addEventListener("pointermove", (e) => { if (x0 != null) card.style.transform = `translateX(${(e.clientX - x0) * 0.6}px) rotate(${(e.clientX - x0) * 0.03}deg)`; });
      const end = (e) => { if (x0 == null) return; const d = e.clientX - x0; x0 = null; card.style.transform = ""; if (Math.abs(d) > 70) this.pick(d < 0 ? 0 : 1); };
      card.addEventListener("pointerup", end);
      card.addEventListener("pointercancel", () => { x0 = null; card.style.transform = ""; });
      card.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") this.pick(0); if (e.key === "ArrowRight") this.pick(1); });
    },
    show() {
      const st = this.st, card = document.getElementById("rq-sort-card");
      if (!card) return;
      const list = SORT[st.m];
      if (st.i >= list.length) {
        const n = st.res.filter(Boolean).length;
        card.className = "cardq";
        card.innerHTML = `<div>${n === list.length ? "🏅 Perfect sort! You think like a mission scientist." : `✅ ${n}/${list.length} correct. Observations come from instruments, and interpretations explain them.`}<br><button type="button" style="margin-top:10px" onclick="RQ.sorter.restart()">↺ Sort again</button></div>`;
        document.querySelectorAll("#rq-sort .bins button").forEach((b) => (b.disabled = true));
        try {
          const done = JSON.parse(localStorage.getItem("rq.sort") || "{}");
          if (!done[st.m]) { done[st.m] = n; localStorage.setItem("rq.sort", JSON.stringify(done)); if (typeof S !== "undefined") { S.xp += 5 + n * 2; typeof hud === "function" && hud(); } }
        } catch (e) {}
        return;
      }
      card.className = "cardq";
      card.textContent = "“" + list[st.i][0] + "”";
    },
    pick(k) {
      const st = this.st;
      if (!st || st.busy) return;
      const list = SORT[st.m], it = list[st.i];
      if (!it) return;
      const card = document.getElementById("rq-sort-card"), why = document.getElementById("rq-sort-why"), meter = document.querySelectorAll("#rq-sort-meter i");
      const ok = k === it[1];
      st.res.push(ok);
      if (meter[st.i]) meter[st.i].className = ok ? "ok" : "no";
      why.innerHTML = (ok ? "✅ " : "❌ ") + it[2];
      RQ.hints && RQ.hints.bump();
      st.busy = true;
      if (ok) { sfx.good(); card.className = "cardq " + (k ? "r" : "l"); }
      else { sfx.bad(); card.className = "cardq shake"; }
      setTimeout(() => { st.busy = false; st.i++; this.show(); }, ok ? 650 : 1500);
    },
    restart() {
      const m = this.st && this.st.m;
      const el = document.getElementById("rq-sort");
      if (!el || !m) return;
      el.outerHTML = this.html(m);
      this.mount();
    },
  });
})();
