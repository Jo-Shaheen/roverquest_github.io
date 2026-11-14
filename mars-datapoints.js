/* ============================================================================
   RoverQuest — pilot profile + datapoints + explorable sites (mars-datapoints.js)
   • RQ.me    — asks the player's name and age, sets explanation level,
                difficulty and hint timing from the age (stored on-device only).
   • RQ.gfx   — shared canvas / Three.js helpers for the site files.
   • RQ.dp    — the world's datapoints and the "any N" ship-repair gate:
                Mars  = 9 places (Sojourner · Spirit & Opportunity · Viking 1 & 2 ·
                        Phoenix & InSight · Ingenuity · 4 deep-space holo-beacons),
                        any 5 restore the ship.
                Moon  = 4 Apollo-era sites, any 3.
   • RQ.site  — hub → mini-game → discovery → restore flow for every site,
                plus the 3D layer (models, beacons, proximity, minimap, roster).
   Site content lives in rq-sites-mars.js and rq-sites-moon.js.
   ============================================================================ */
(function () {
  "use strict";
  const RQ = (window.RQ = window.RQ || {});
  const $id = (i) => document.getElementById(i);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    json(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } },
  };
  const say = (h, a) => window.tarsSay && window.tarsSay(h, a);
  const sfx = () => RQ.sfx || { good() {}, bad() {}, click() {}, tone() {}, win() {}, ensure() {} };

  /* ======================================================================
     1. PILOT PROFILE (name + age → personalised experience)
     ====================================================================== */
  const PROFILE_KEY = "btsm_v4_profile";
  const ME = (RQ.me = {
    prof() { return window.playerProfile || (window.playerProfile = { name: "", age: null, tier: "scientist", preQuiz: {}, postQuiz: {}, hintsUsed: 0 }); },
    has() { const p = this.prof(); return !!(p.name && String(p.name).trim() && p.age); },
    name() { return (String(this.prof().name || "").trim()) || "Explorer"; },
    age() { return Number(this.prof().age) || null; },
    tier() { const p = this.prof(); return p.tier || (typeof SET !== "undefined" && SET.level) || "scientist"; },
    tierFor(a) { a = Number(a) || 12; return a <= 10 ? "explorer" : a <= 14 ? "scientist" : "engineer"; },
    /* pick tier-specific text: ME.t({explorer, scientist, engineer}) */
    t(o) { const k = this.tier(); return o[k] != null ? o[k] : o.scientist != null ? o.scientist : o.explorer; },
    /* game ease: >1 = more fuel / battery / tolerance */
    ease() { return { explorer: 1.3, scientist: 1.1, engineer: 0.95 }[this.tier()] || 1; },
    /* TARS hint idle multiplier: younger players get help sooner */
    hintMul() { return { explorer: 0.7, scientist: 1, engineer: 1.35 }[this.tier()] || 1; },
    save(name, age) {
      const p = this.prof();
      p.name = String(name || "").replace(/[<>&"'`]/g, "").trim().slice(0, 20);
      p.age = clamp(Math.round(Number(age) || 12), 5, 99);
      p.tier = this.tierFor(p.age);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
      try { SET.level = p.tier; if (typeof applySettings === "function") applySettings(); } catch (e) {}
      try { interactionState.level = p.tier; } catch (e) {}
      if (RQ.ui && RQ.ui.refresh) RQ.ui.refresh();
    },
    ask(opts, cb) {
      opts = opts || {};
      let box = $id("rq-profile");
      if (!box) { box = document.createElement("div"); box.id = "rq-profile"; document.body.appendChild(box); }
      const p = this.prof(), cur = this.has() ? this.age() : null;
      const ages = [[9, "9 or under"], [10, "10"], [11, "11"], [12, "12"], [13, "13"], [14, "14"], [15, "15"], [16, "16"], [17, "17"], [18, "18+"]];
      const sel = cur == null ? null : cur <= 9 ? 9 : cur >= 18 ? 18 : cur;
      box.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-labelledby="rq-pf-h">
        <div class="face" aria-hidden="true">🤖</div>
        <h2 id="rq-pf-h">${opts.edit ? "Update your pilot profile" : "Hi, I'm TARS, your robot co-pilot."}</h2>
        <p class="lead">${opts.edit ? "Change your name or age. I'll adjust how I explain things." : "Before we fly, tell me who's in the pilot seat."}</p>
        <label class="fld" for="rq-pf-name">What should I call you?</label>
        <input id="rq-pf-name" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Your first name or a nickname" value="${esc(p.name || "")}">
        <div class="fld" id="rq-pf-agel">How old are you?</div>
        <div class="ages" role="radiogroup" aria-labelledby="rq-pf-agel">${ages.map((a) => `<button type="button" role="radio" aria-checked="${sel === a[0]}" class="${sel === a[0] ? "on" : ""}" data-age="${a[0]}">${a[1]}</button>`).join("")}</div>
        <div class="tier" id="rq-pf-tier" aria-live="polite"></div>
        <div class="err" id="rq-pf-err" role="alert"></div>
        <button type="button" class="rq-btn primary big" id="rq-pf-go">${opts.edit ? "Save" : "🚀 Let's go"}</button>
        ${opts.edit ? `<button type="button" class="rq-btn ghost" id="rq-pf-cancel">Cancel</button>` : ""}
        <small class="priv">🔒 Saved only on this device and never sent anywhere. A nickname is fine. You can change this any time in ⚙ Settings.</small>
      </div>`;
      box.classList.add("on");
      let age = sel;
      const nameIn = box.querySelector("#rq-pf-name"), tierEl = box.querySelector("#rq-pf-tier"), err = box.querySelector("#rq-pf-err"), go = box.querySelector("#rq-pf-go");
      const TIERTXT = {
        explorer: "🧒 <b>Explorer level</b> · short, friendly explanations, extra fuel in mini-games and quicker hints.",
        scientist: "🔬 <b>Scientist level</b> · what each machine did and why it mattered.",
        engineer: "🛠 <b>Engineer level</b> · the engineering details, tougher mini-games, fewer hints.",
      };
      const upd = () => {
        tierEl.innerHTML = age ? TIERTXT[this.tierFor(age)] : "Pick your age so I can pitch explanations at the right level.";
        const n = nameIn.value.replace(/[<>&"'`]/g, "").trim();
        go.textContent = opts.edit ? "Save" : n ? `🚀 Let's go, ${n}!` : "🚀 Let's go";
      };
      box.querySelectorAll("[data-age]").forEach((b) => (b.onclick = () => {
        age = Number(b.dataset.age);
        box.querySelectorAll("[data-age]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b ? "true" : "false"); });
        err.textContent = "";
        upd();
      }));
      nameIn.oninput = () => { err.textContent = ""; upd(); };
      nameIn.onkeydown = (e) => { if (e.key === "Enter") go.click(); };
      const close = () => { box.classList.remove("on"); box.innerHTML = ""; };
      go.onclick = () => {
        const n = nameIn.value.replace(/[<>&"'`]/g, "").trim();
        if (!n) { err.textContent = "Type a name or nickname first."; nameIn.focus(); return; }
        if (!age) { err.textContent = "Tap your age."; return; }
        try { sfx().ensure(); sfx().click(); } catch (e) {}
        this.save(n, age);
        close();
        if (cb) cb(true);
      };
      const cancel = box.querySelector("#rq-pf-cancel");
      if (cancel) cancel.onclick = () => { close(); if (cb) cb(false); };
      upd();
      setTimeout(() => nameIn.focus(), 60);
    },
  });

  /* ======================================================================
     2. SHARED HELPERS (RQ.gfx): canvas + Three.js helpers for site files
     ====================================================================== */
  const W = RQ.W || { id: "mars", name: "Mars", NAME: "MARS", emoji: "🔴", required: 5, isMoon: false, key: (k) => k, label: "Mars", systems: [["🧭", "Navigation"], ["⚡", "Power"], ["📡", "Comms"], ["🛡", "Heat shield"], ["🔥", "Main engine"]], other: { name: "Moon", emoji: "🌙", href: "mars.html?world=moon" } };
  const STARS = Array.from({ length: 90 }, (_, i) => [((i * 7919) % 1000) / 1000, ((i * 3571) % 1000) / 1000, i % 7 ? 0.8 : 1.6]);
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function txt(c, s, x, y, size, color, align, weight) { c.font = `${weight || 600} ${size}px Segoe UI, system-ui, sans-serif`; c.fillStyle = color; c.textAlign = align || "left"; c.textBaseline = "middle"; c.fillText(s, x, y); }
  function space(c, Wd, Hd, t) {
    const g = c.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, "#02040a"); g.addColorStop(1, "#0b0f1a");
    c.fillStyle = g; c.fillRect(0, 0, Wd, Hd);
    for (const s of STARS) { c.globalAlpha = 0.4 + 0.4 * Math.sin((t || 0) * 1.3 + s[0] * 20); c.fillStyle = "#fff"; c.fillRect(s[0] * Wd, s[1] * Hd, s[2], s[2]); }
    c.globalAlpha = 1;
  }
  function fit(api, LW, LH) { const s = Math.min(api.W / LW, api.H / LH); return { s, ox: (api.W - LW * s) / 2, oy: (api.H - LH * s) / 2 }; }
  function gauge(c, x, y, w, h, frac, col, label) {
    rr(c, x, y, w, h, 5); c.fillStyle = "#0b111c"; c.fill();
    const fh = clamp(frac, 0, 1) * (h - 4);
    rr(c, x + 2, y + h - 2 - fh, w - 4, Math.max(0, fh), 4); c.fillStyle = col; c.fill();
    txt(c, label, x + w / 2, y + h + 12, 11, "#9aa7bb", "center", 700);
  }
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* tiny Three.js kit for the procedural site models */
  const M3 = {
    mat(c, r, m, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r == null ? 0.7 : r, metalness: m == null ? 0.2 : m }, o || {})); },
    m(c) { return c && c.isMaterial ? c : M3.mat(c); },
    box(w, h, d, c) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M3.m(c)); },
    cyl(rt, rb, h, c, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), M3.m(c)); },
    sph(r, c, seg) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, Math.max(6, (seg || 16) >> 1)), M3.m(c)); },
    at(o, x, y, z, rx, ry, rz) { o.position.set(x || 0, y || 0, z || 0); if (rx) o.rotation.x = rx; if (ry) o.rotation.y = ry; if (rz) o.rotation.z = rz; return o; },
    group() { const g = new THREE.Group(); for (const k of arguments) g.add(k); return g; },
    /* a rod between two points */
    rod(a, b, r, c) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B); const o = M3.cyl(r, r, L, c, 6); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return o; },
    shadows(g) { g.traverse((o) => { if (o.isMesh && !(o.material && o.material.transparent)) { o.castShadow = true; o.receiveShadow = true; } }); return g; },
    label(text, color) {
      const cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
      const x = cv.getContext("2d");
      x.fillStyle = "rgba(6,10,18,.72)"; rr(x, 8, 14, 496, 68, 30); x.fill();
      x.strokeStyle = color || "#66ccff"; x.lineWidth = 4; x.stroke();
      x.font = "700 40px Segoe UI, system-ui, sans-serif"; x.fillStyle = "#eef4ff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 256, 50);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
      sp.scale.set(6.4, 1.2, 1);
      return sp;
    },
  };
  RQ.gfx = { esc, clamp, rr, txt, space, fit, gauge, shuffle, sfx, LS, M3, STARS };

  /* ======================================================================
     3. DATAPOINTS + "ANY N" SHIP GATE (world-aware)
        Mars: 4 legacy machines (Sojourner · Spirit & Opportunity ·
        Viking 1 & 2 · Phoenix & InSight) + 5 sites from rq-sites-mars.js.
        Moon: 4 sites from rq-sites-moon.js.
     ====================================================================== */
  const HW = "assets/hardware/";
  const LEGACY = W.id !== "mars" ? [] : [
    { id: "soj", ns: ["Sojourner"], games: ["soj"], icon: "🛞", short: "Sojourner", name: "Sojourner Rover", yr: "1997", site: "Ares Vallis", img: HW + "sojourner/overview-nasa.jpg", url: "https://science.nasa.gov/mission/mars-pathfinder/",
      slide: { ttl: "Sojourner · 1997", sub: "First Mars rover · rock chemistry with APXS", img: HW + "sojourner/overview-nasa.jpg" }, line: "Sojourner showed why you plan every move when signals take minutes to arrive." },
    { id: "mer", ns: ["Spirit Rover", "Opportunity Rover"], games: ["spi", "opp"], icon: "🚙", short: "Spirit & Opportunity", name: "Spirit & Opportunity", yr: "2004–2018", site: "Gusev Crater · Meridiani Planum", img: HW + "spirit-rover/overview-PIA05040.jpg", url: "https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/",
      slide: { ttl: "Spirit & Opportunity · 2004–2018", sub: "Twin rovers · silica and hematite 'blueberries' · ancient water", img: HW + "opportunity-rover/evidence_blueberries-PIA19113.jpg" }, line: "Spirit and Opportunity found signs of ancient water on opposite sides of Mars." },
    { id: "vik", ns: ["Viking 1 Lander"], games: ["vik"], icon: "🧪", short: "Viking 1 & 2", name: "Viking 1 & 2 Landers", yr: "1976–1982", site: "Chryse · Utopia Planitia", img: HW + "viking-1-lander/overview-PIA03165.jpg", url: "https://science.nasa.gov/mission/viking-1/",
      slide: { ttl: "Viking 1 & 2 · 1976–1982", sub: "Soil baked in the GCMS · organics not detected", img: HW + "viking-1-lander/overview-PIA03165.jpg" }, line: "The Viking landers taught us that 'not detected' doesn't mean 'not there'." },
    { id: "phi", ns: ["InSight Lander"], games: ["ins"], icon: "📈", short: "Phoenix & InSight", name: "Phoenix & InSight Landers", yr: "2008 · 2018–2022", site: "Vastitas Borealis · Elysium Planitia", img: HW + "insight/overview-PIA23203.jpg", url: "https://science.nasa.gov/mission/insight/",
      slide: { ttl: "Phoenix & InSight · 2008–2022", sub: "Ice under the soil · 1,319 marsquakes · liquid metal core", img: HW + "insight/overview-PIA23203.jpg" }, line: "Phoenix touched buried ice, and InSight's marsquakes revealed a liquid metal core." },
  ];
  const TWIN = {
    "Spirit Rover": { short: "Spirit", where: "Gusev Crater", img: HW + "spirit-rover/overview-PIA05040.jpg", game: "spi" },
    "Opportunity Rover": { short: "Opportunity", where: "Meridiani Planum", img: HW + "opportunity-rover/overview-PIA17759.jpg", game: "opp" },
  };
  const ALIAS = { spi: "mer", opp: "mer", ins: "phi" }; // ids from older saves
  const REQUIRED = W.required || 5;
  const SYSTEMS = W.systems;
  const RECOMMENDED = W.isMoon ? ["eag", "lrv", "sur", "llr"] : ["soj", "ing", "mer", "daw", "vik", "kep", "phi", "nea", "pio"];
  const K_ORDER = W.key("rq.dpOrder"), K_LAUNCH = W.key("rq.launchOK");

  /* site progress: {id: {seen, won, stars, disc, done}} (ids are unique across worlds) */
  let ssCache = null;
  const SS = {
    all() { return ssCache || (ssCache = LS.json("rq.sites", {})); },
    get(id) { return this.all()[id] || {}; },
    set(id, patch) { const a = this.all(); a[id] = Object.assign(a[id] || {}, patch); LS.set("rq.sites", JSON.stringify(a)); },
  };
  const SITE = (RQ.site = RQ.site || {});
  SITE.registry = SITE.registry || { mars: [], moon: [] };
  SITE.decorate = SITE.decorate || {};
  SITE.store = SS;
  SITE.add = function (world, arr) {
    (SITE.registry[world] = SITE.registry[world] || []).push(...arr);
    arr.forEach((m) => { if (RQ.sorter && RQ.sorter.data) RQ.sorter.data["site:" + m.id] = m.sort; });
    listCache = null;
  };
  const sites = () => SITE.registry[W.id] || [];
  SITE.byId = (id) => sites().find((s) => s.id === id);
  const LEG = (id) => LEGACY.find((x) => x.id === id);
  const mcs = (d) => (typeof MC === "undefined" ? [] : d.ns.map((n) => MC.find((m) => m.n === n)).filter(Boolean));
  const groupOf = (s) => (s.kind === "beacon" ? "beacon" : W.isMoon ? "moon" : "plain");
  let listCache = null;

  const DP = (RQ.dp = {
    REQUIRED, SYSTEMS, LEGACY, W,
    get TOTAL() { return this.list().length; },
    list() {
      if (listCache) return listCache;
      listCache = [
        ...LEGACY.map((d) => Object.assign({ world: W.id, group: "plain", game: d.games[0], legacy: true }, d)),
        ...sites().map((s) => Object.assign({ world: W.id, group: groupOf(s), game: s.id }, s)),
      ];
      return listCache;
    },
    byId(id) { return this.list().find((d) => d.id === id); },
    done(id) {
      const d = LEG(id);
      if (d) return mcs(d).some((m) => m.dn);
      return !!(SITE.byId(id) && SS.get(id).done);
    },
    started(id) {
      const d = LEG(id);
      if (d) return !!(typeof interactionState !== "undefined" && d.ns.some((n) => interactionState.completedTasks[n]));
      return !!SS.get(id).won;
    },
    stars(id) {
      const d = LEG(id);
      if (d) { const st = LS.json("rq.stars", {}); return Math.max(0, ...d.ns.map((n) => st[n] || 0)); }
      return SS.get(id).stars || 0;
    },
    count() { return this.list().filter((d) => this.done(d.id)).length; },
    order() {
      const saved = [];
      LS.json(K_ORDER, []).forEach((id) => { id = ALIAS[id] || id; if (this.done(id) && !saved.includes(id)) saved.push(id); });
      RECOMMENDED.forEach((id) => { if (this.done(id) && !saved.includes(id)) saved.push(id); });
      this.list().forEach((d) => { if (this.done(d.id) && !saved.includes(d.id)) saved.push(d.id); });
      return saved;
    },
    restored() { return this.order().map((id) => this.byId(id)).filter(Boolean); },
    ready() { return this.count() >= REQUIRED; },
    launchOK() {
      if (!this.ready()) return false;
      if (LS.get(K_LAUNCH) === "1") return true;
      return !!(!W.isMoon && typeof S !== "undefined" && S.finalDone && LEGACY.every((d) => this.done(d.id)));
    },
    recommended() { return RECOMMENDED.find((id) => this.byId(id) && !this.done(id) && !this.started(id)) || RECOMMENDED.find((id) => this.byId(id) && !this.done(id)) || null; },
    mark(id) {
      id = ALIAS[id] || id;
      const o = LS.json(K_ORDER, []).map((x) => ALIAS[x] || x);
      if (o.includes(id)) return;
      o.push(id);
      LS.set(K_ORDER, JSON.stringify(o));
      const n = this.count(), d = this.byId(id), nm = ME.name(), TOT = this.TOTAL;
      if (!d) return;
      if (RQ.ui && RQ.ui.refresh) RQ.ui.refresh();
      if (n < 1) return;
      setTimeout(() => {
        if (n === REQUIRED) say(`<b>${esc(nm)}, that's ${REQUIRED} of ${TOT}!</b> 🎉 All ${REQUIRED} ship systems are back online. Head to the ship for the <b>final launch check</b>. (The other places are still there if you want them.)`, true);
        else if (n > REQUIRED) say(`Bonus datapoint, ${esc(nm)}! <b>${esc(d.short)}</b> makes <b>${n}/${TOT}</b>. ${n === TOT ? "You've restored every single one. Legendary. 🏆" : "Collect them all if you like."}`, true);
        else say(ME.t({ explorer: `Yay! <b>${esc(d.short)}</b> is restored! The <b>${SYSTEMS[n - 1][1]}</b> is working again. ${REQUIRED - n} more to go!`, scientist: `Datapoint restored: <b>${esc(d.short)}</b>. Ship ${SYSTEMS[n - 1][1].toLowerCase()} back online. ${REQUIRED - n} more to go, ${esc(nm)}.`, engineer: `${esc(d.short)} datapoint integrated. ${SYSTEMS[n - 1][1]} subsystem nominal. ${REQUIRED - n} remaining for launch readiness.` }), true);
      }, 700);
    },
    visit(id) {
      const d = LEG(id);
      if (d) {
        const ms = mcs(d);
        if (ms.length > 1) return twinChooser(d);
        const i = typeof MC !== "undefined" ? MC.indexOf(ms[0]) : -1;
        if (i >= 0) window.visitMission(i);
        return;
      }
      if (SITE.byId(id)) SITE.visit(id);
    },
    finalQs() {
      const ids = this.order().slice(0, REQUIRED);
      return ids.map((id) => {
        const d = LEG(id);
        if (d) {
          const m = mcs(d).find((x) => x.dn) || mcs(d)[0], fi = typeof MC !== "undefined" ? MC.indexOf(m) : -1;
          return typeof FINAL !== "undefined" && FINAL[fi] ? Object.assign({ src: m && TWIN[m.n] ? TWIN[m.n].short : d.short }, FINAL[fi]) : null;
        }
        const s = SITE.byId(id);
        return s && s.final ? Object.assign({ src: s.short }, s.final) : null;
      }).filter(Boolean);
    },
  });

  /* ---------- Spirit & Opportunity: pick a twin ---------- */
  function twinChooser(d) {
    if (typeof endPres === "function") endPres();
    if (RQ.mg && RQ.mg.on) RQ.mg.close(false);
    T = Math.max(T, 30);
    S.mode = "talk";
    interactionState.stage = "twins";
    const ms = mcs(d), done = DP.done(d.id);
    dl(`<i data-rqctx="twins" hidden></i>
      <div class="top"><span>SPIRIT &amp; OPPORTUNITY · TWIN ROVERS</span><span style="color:${done ? "var(--rq-teal)" : "inherit"}">${done ? "✔ DATAPOINT RESTORED" : "PICK A TWIN"}</span></div>
      <p class="rq-sub">NASA landed two identical rovers in January 2004, on opposite sides of Mars. Both were planned to last 90 days. <b>Restore either twin</b> to restore this datapoint. You can do both.</p>
      <div class="rq-dpgrid">${ms.map((m) => {
        const i = MC.indexOf(m), t = TWIN[m.n] || {}, g = RQ.games[t.game], st = m.dn ? "✔ Restored" : interactionState.completedTasks[m.n] ? "▶ In progress" : "Not started";
        return `<button type="button" class="rq-dp ${m.dn ? "done" : interactionState.completedTasks[m.n] ? "prog" : ""}" onclick="visitMission(${i})" aria-label="${esc(t.short)}: ${st}">
          <span class="ph" style="background-image:url('${t.img}')"></span>
          <span class="tx"><b>${esc(t.short)}</b><small>📍 ${esc(t.where)} · ${st}</small><small>🎮 ${esc(g ? g.title : "Mission")}</small></span></button>`;
      }).join("")}</div>
      <div class="rq-note">📚 Spirit's last contact was March 22, 2010. Opportunity's was June 10, 2018, after a planet-wide dust storm. <a href="${d.url}" target="_blank" rel="noopener" style="color:#a9f1da">NASA mission page</a></div>
      <div class="bar"><button type="button" onclick="missionPicker()">🗺 All places</button><span></span></div>`);
  }

  /* ---------- ship panel (replaces openRepair) ---------- */
  function launchBar() {
    return `<div class="bar rq-launch" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>🚀 <b>Ship ready.</b> Time to take ${esc(ME.name())} home!</span><button type="button" class="rq-btn primary big rq-pulse" onclick="RQ.cine.playOutro()">🚀 Launch home</button></div>`;
  }
  const GROUPTXT = { plain: `${W.emoji} ${W.name}`, beacon: "📡 Beacon", moon: "🌙 Moon" };
  function tile(d) {
    const done = DP.done(d.id), started = DP.started(d.id);
    let mods = "";
    if (d.legacy && typeof CMP !== "undefined") {
      const ks = [];
      mcs(d).forEach((m) => { const i = MC.indexOf(m); if (i >= 0) ks.push(i * 2, i * 2 + 1); });
      mods = `<span class="mods">${ks.map((k) => { const st = S.inst[k] ? "INSTALLED" : S.rec[k] ? "RECOVERED" : "MISSING"; return `<span class="sl ${st}" id="s${k}" title="${esc(CMP[k][0])}: ${st.toLowerCase()}"><i>${CMP[k][1]}</i><small>${st}</small></span>`; }).join("")}</span>`;
    }
    const stTxt = done ? "✔ Restored" : started ? "▶ In progress" : "Not started";
    return `<button type="button" class="rq-dp ${done ? "done" : started ? "prog" : ""}" onclick="RQ.dp.visit('${d.id}')" aria-label="${esc(d.short)}: ${stTxt}">
      <span class="ph" style="background-image:url('${d.img}')"></span>
      <span class="tx"><b>${esc(d.short)}</b><small>${GROUPTXT[d.group] || ""} · ${stTxt}</small>${mods}</span></button>`;
  }
  function openShipPanel(msg) {
    if (RQ.mg && RQ.mg.on) RQ.mg.close(false);
    S.mode = "talk";
    interactionState.stage = "repair";
    const n = DP.count(), TOT = DP.TOTAL, on = Math.min(n, REQUIRED), order = DP.restored(), ready = DP.ready(), ok = DP.launchOK();
    const pend = W.isMoon ? [] : S.rec.map((r, i) => (r && !S.inst[i] ? i : -1)).filter((i) => i >= 0);
    dl(`<i data-rqctx="repair" hidden></i>
      <div class="top"><span>SPACECRAFT · ${ready ? "ALL SYSTEMS ONLINE" : `${REQUIRED - on} SYSTEM${REQUIRED - on > 1 ? "S" : ""} OFFLINE`}</span><span>SYSTEMS ${on}/${REQUIRED} · DATAPOINTS ${n}/${TOT}</span></div>
      <div class="rq-sys">${SYSTEMS.map((s, i) => `<div class="${i < on ? "on" : ""}"><span class="ic">${s[0]}</span><b>${s[1]}</b><small>${i < on && order[i] ? "Online · " + esc(order[i].short) : "Offline"}</small></div>`).join("")}</div>
      <p class="rq-sub">Restore <b>any ${REQUIRED}</b> of the ${TOT} ${W.isMoon ? "lunar sites" : "places on Mars"}. Each one brings a ship system back online.${n > REQUIRED ? ` <b style="color:var(--rq-gold)">+${n - REQUIRED} bonus</b>` : ""}</p>
      <div class="rq-dpgrid">${DP.list().map(tile).join("")}</div>
      ${msg ? `<div class="fb">${msg}</div>` : ""}
      ${pend.length ? `<div class="bar"><span>📦 ${pend.length} Mars module${pend.length > 1 ? "s" : ""} waiting to be fitted.</span><button id="ib" onclick="install()">Install ${pend.length} module${pend.length > 1 ? "s" : ""}</button></div>` : ""}
      ${ready && !ok ? `<div class="bar"><span>All ${REQUIRED} systems online. One last test uses what <b>your</b> ${REQUIRED} datapoints taught you.</span><button type="button" class="rq-btn primary" onclick="openFinal(0)">🧠 Final launch check ▸</button></div>` : ""}
      ${ok ? launchBar() : ""}
      <div class="tag-note">ℹ️ <b>Scientific accuracy note:</b> ${W.isMoon
        ? "the ship and its systems are fictional. The Apollo-era machines, places, dates and discoveries are real NASA history. The real hardware on the Moon remains untouched."
        : "the ship, its systems and the Mars repair modules are fictional. The machines, places, dates and discoveries are real NASA history. Dawn, NEAR Shoemaker, Pioneer and Kepler never visited Mars: their beacons show holograms. The real hardware remains untouched."}</div>`);
  }
  /* ---------- final launch check (built from YOUR first N datapoints) ---------- */
  let fin = { step: 0, fb: "", qs: [] };
  function openFinalCheck(step) {
    fin = { step: step || 0, fb: "", qs: DP.finalQs() };
    renderFinalCheck();
  }
  function renderFinalCheck() {
    const qs = fin.qs, st = fin.step;
    S.mode = "talk";
    interactionState.stage = "final";
    if (qs.length < REQUIRED) { openShipPanel(`Restore ${REQUIRED} datapoints first, then come back for the final launch check.`); return; }
    if (st >= qs.length) {
      const first = LS.get(K_LAUNCH) !== "1";
      LS.set(K_LAUNCH, "1");
      if (first) { if (!W.isMoon) S.finalDone = 1; S.xp += 50; hud(); try { saveState(); } catch (e) {} }
      if (typeof beep === "function") beep([523, 659, 784, 1046, 1318], 0.1, "triangle");
      dl(`<i data-rqctx="final" hidden></i><div class="top"><span>FINAL LAUNCH CHECK COMPLETE</span><span>LAUNCH SEQUENCE READY</span></div>
        <div class="fb" style="border-color:var(--ok)"><b style="color:var(--ok)">🚀 ${esc(ME.name())}, the ship is repaired and ready to launch.</b><br>You fixed it with knowledge, not just parts: ${qs.map((q) => `<b>${esc(q.src)}</b>`).join(", ")} each taught you something real.</div>
        <div class="tag-note">ℹ️ The repair story is fictional. The science comes from real NASA missions.</div>
        ${launchBar()}
        <div class="bar"><button type="button" onclick="openRepair()">◂ Ship status</button><span></span></div>`);
      return;
    }
    const f = qs[st];
    dl(`<i data-rqctx="final" hidden></i><div class="top"><span>FINAL LAUNCH CHECK · ${st + 1} / ${qs.length}</span><span>${f.icon} Lesson from ${esc(f.src)}</span></div>
      <div class="sim-box"><div class="sim-hdr"><span>${esc(f.t.toUpperCase())}</span><span>CHOOSE ONE</span></div>
      <p style="margin:6px 0;font-size:15px">${f.q}</p>
      ${f.o.map((o, i) => `<button type="button" class="opt" ${i === f.a ? "" : 'data-wrong="1"'} style="display:block;width:100%;text-align:left;margin:6px 0" onclick="RQ.dp.pick(${i})">${o[0]}</button>`).join("")}
      ${fin.fb ? `<div class="fb" style="color:#ffd166">${fin.fb}</div>` : ""}</div>
      <div class="bar"><button type="button" onclick="openRepair()">◂ Back</button><span></span></div>`);
  }
  DP.pick = (i) => {
    const f = fin.qs[fin.step];
    if (!f) return;
    if (i === f.a) { fin.step++; fin.fb = ""; if (typeof beep === "function") beep([660, 880], 0.07, "triangle"); if (f.ok) say(`✅ ${f.ok}`, false); renderFinalCheck(); return; }
    fin.fb = "⚠️ " + f.o[i][1];
    sfx().bad();
    renderFinalCheck();
  };

  /* ======================================================================
     4. SITE FLOW (hub → mini-game → discovery → restore)
        Used by Ingenuity, the 4 deep-space beacons and the 4 Moon sites.
     ====================================================================== */
  const NSSDC = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=";
  SITE.cur = null;
  SITE.near = null;
  SITE.target = null;
  function siteBar(m, act) {
    const st = SS.get(m.id), f = (n) => `RQ.site.${n}('${m.id}')`;
    const items = [["hub", "📡", "Hub", true, f("hub")], ["play", "🎮", "Mini-game", !!st.won, f("play")], ["disc", "🔬", "Discovery", !!st.disc, f("disc")], ["restore", "💾", "Restore", !!st.done, f("restore")]];
    return `<div class="stbar rq-stbar" role="navigation" aria-label="Datapoint steps">${items.map((x) => `<button type="button" class="${x[0] === act ? "act" : x[3] ? "dn" : ""}" onclick="${x[4]}" ${x[0] === act ? 'aria-current="step"' : ""}>${x[3] && x[0] !== act && x[0] !== "hub" ? "✔" : x[1]} ${x[2]}</button>`).join("")}</div>`;
  }
  function prep(id) {
    if (typeof endPres === "function") endPres();
    if (RQ.mg && RQ.mg.on) RQ.mg.close(false);
    T = Math.max(T, 30);
    S.mode = "talk";
    SITE.cur = id;
    return SITE.byId(id);
  }
  const kindTop = (m) => (m.kind === "beacon" ? "DEEP-SPACE BEACON · HOLOGRAM" : `${W.NAME} SURFACE SITE`);
  function siteNote(m) {
    if (m.kind === "beacon") return `📡 <b>Holo-beacon:</b> ${esc(m.short)} never came to Mars. This relay station projects a hologram built from NASA records. <b>Where it really is:</b> ${esc(m.status)} Its voice is a friendly reconstruction.`;
    return `📍 <b>A 3D model based on NASA records, not a photo.</b> <b>What happened to it:</b> ${esc(m.status)} Its voice is a friendly reconstruction.`;
  }
  SITE.hub = function (id) {
    const m = prep(id);
    if (!m) return;
    interactionState.stage = "sitehub";
    if (typeof beep === "function") beep([480, 640, 960], 0.07, "sine");
    const st = SS.get(id), g = RQ.games[id] || { title: "Mini-game" };
    const next = !st.won ? 1 : !st.disc ? 2 : !st.done ? 3 : 0;
    const step = (n, ic, title, sub, fn, isDone, locked) => `<button type="button" class="rq-step ${isDone ? "done" : ""} ${next === n ? "next" : ""} ${locked ? "locked" : ""}" onclick="${fn}" data-step="${n}"><span class="n">${isDone ? "✔" : ic}</span><span><b>${title}</b><small>${sub}</small></span><span class="go">${isDone ? "DONE ✓" : next === n ? "START ▸" : "OPEN ▸"}</span></button>`;
    const ss = st.stars ? "⭐".repeat(st.stars) + "☆".repeat(3 - st.stars) : "";
    dl(`<i data-rqctx="sitehub" hidden></i>
      <div class="top"><span>${esc(m.mission.toUpperCase())} · ${kindTop(m)}</span><span style="color:var(--rq-teal)">● ${m.kind === "beacon" ? "BEACON LINK" : "SIGNAL LOCKED"}</span></div>
      ${siteBar(m, "hub")}
      <div class="rq-hub-hero">
        <div class="ph" role="img" aria-label="Illustration of ${esc(m.name)}" style="background-image:url('${m.img}')"></div>
        <div><h2>${m.icon} ${esc(m.name)}</h2>
          <div class="meta"><span class="rq-tag o">${m.yr}</span><span class="rq-tag">📍 ${esc(m.site)}</span><span class="rq-tag g">${esc(m.role)}</span><span class="rq-tag">${m.kind === "beacon" ? "📡 Deep space" : W.emoji + " " + W.name}</span></div>
          <div class="rq-quote">“${esc(m.voice)}”</div></div>
      </div>
      <div class="rq-steps">
        ${step(1, "🎮", "Play: " + esc(g.title), st.won ? `Your best: ${ss} · play again for 3 stars` : "Hands-on mini-game · unlocks the datapoint", `RQ.site.play('${id}')`, !!st.won, false)}
        ${step(2, "🔬", "Discovery + quick sort", "What NASA really found, then sort facts from ideas", `RQ.site.disc('${id}')`, !!st.disc, false)}
        ${step(3, "💾", "Restore the datapoint", st.done ? "Datapoint restored ✓" : st.won ? "One question brings a ship system online" : "Win the mini-game first", `RQ.site.restore('${id}')`, !!st.done, !st.won)}
      </div>
      <div class="rq-extra">
        ${m.url ? `<a class="rq-btn ghost" href="${m.url}" target="_blank" rel="noopener" style="text-decoration:none">🌐 NASA mission page</a>` : ""}
        <a class="rq-btn ghost" href="${NSSDC + m.record}" target="_blank" rel="noopener" style="text-decoration:none">📚 NASA record ${m.record}</a>
        <button type="button" onclick="missionPicker()">🗺 All places</button>
      </div>
      <div class="rq-note">${siteNote(m)}</div>`);
  };
  SITE.play = function (id) {
    const m = prep(id);
    if (!m || !RQ.mg) return;
    interactionState.stage = "task";
    RQ.mg.open(id, {
      onClose: () => SITE.hub(id),
      onWin: (summary, stars) => {
        const st = SS.get(id), first = !st.won;
        SS.set(id, { won: 1, stars: Math.max(st.stars || 0, stars) });
        if (first) S.xp += 30; else if (stars > (st.stars || 0)) S.xp += 5 * (stars - (st.stars || 0));
        hud();
        SITE.won(id, summary, stars, first);
      },
    });
  };
  SITE.won = function (id, summary, stars, first) {
    const m = prep(id), g = RQ.games[id];
    interactionState.stage = "sitewon";
    dl(`<i data-rqctx="sitewon" hidden></i>
      <div class="top"><span>${esc(m.mission.toUpperCase())} · MINI-GAME COMPLETE</span><span style="color:var(--rq-teal)">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</span></div>
      ${siteBar(m, "play")}
      <div class="rq-hub-hero"><div class="ph" style="background-image:url('${m.img}')"></div>
        <div><h2>🏆 ${esc(g.title)} complete!</h2><div class="rq-quote">${esc(summary)}</div>
        ${first ? `<p style="margin:10px 0 0">💾 <b>Datapoint unlocked!</b> See the discovery, then restore it.</p>` : `<p style="margin:10px 0 0;color:var(--rq-mute)">Replays can improve your star rating.</p>`}</div></div>
      <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button type="button" onclick="RQ.site.play('${id}')">↺ Play again</button>
        <button type="button" class="rq-btn primary" onclick="RQ.site.disc('${id}')">🔬 See the real discovery ▸</button>
      </div>`);
    say(first ? ME.t({ explorer: `Awesome, ${esc(ME.name())}! 🚀 Now let's see what really happened.`, scientist: `Nice work, ${esc(ME.name())}! That's the same problem the real ${esc(m.mission)} team solved. Next: the real discovery.`, engineer: `Clean run, ${esc(ME.name())}. Same constraint the ${esc(m.mission)} engineers designed around. Review the discovery next.` }) : stars === 3 ? "Three stars. Show-off. 😎" : "Good run!", true);
  };
  SITE.disc = function (id) {
    const m = prep(id);
    if (!m) return;
    interactionState.stage = "sitedisc";
    SS.set(id, { disc: 1 });
    const tier = ME.tier(), k = tier === "explorer" ? "explorer" : "scientist";
    dl(`<i data-rqctx="sitedisc" hidden></i>
      <div class="top"><span>${esc(m.name.toUpperCase())} · DISCOVERY</span><span>NASA RECORD ${m.record}</span></div>
      ${siteBar(m, "disc")}
      <div class="rq-disc">
        <div><h4>👁 What NASA observed</h4><p>${esc(m.found[k])}</p></div>
        <div><h4>🧠 What it means</h4><p>${esc(m.means[k])}</p></div>
        ${tier === "engineer" ? `<div class="wide"><h4>🛠 Engineer's notes</h4><p>${esc(m.deep)}</p></div>` : ""}
      </div>
      ${RQ.sorter && RQ.sorter.data ? RQ.sorter.html("site:" + id) : ""}
      <div class="rq-note">📚 Sources: ${m.url ? `<a href="${m.url}" target="_blank" rel="noopener" style="color:#a9f1da">NASA mission page</a> · ` : ""}<a href="${NSSDC + m.record}" target="_blank" rel="noopener" style="color:#a9f1da">NASA NSSDCA catalog ${m.record}</a>. Change how much detail you see with <b>⚙ → Explanation level</b>.</div>
      <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button type="button" onclick="RQ.site.hub('${id}')">◂ Hub</button>
        <button type="button" class="rq-btn primary" onclick="RQ.site.restore('${id}')">💾 Restore the datapoint ▸</button></div>`);
    if (RQ.sorter && document.getElementById("rq-sort")) RQ.sorter.mount();
  };
  SITE.restore = function (id, fb) {
    const m = prep(id);
    if (!m) return;
    interactionState.stage = "siterestore";
    const st = SS.get(id);
    if (!st.won) {
      dl(`<i data-rqctx="siterestore" hidden></i><div class="top"><span>${esc(m.name.toUpperCase())} · RESTORE</span><span>🔒 LOCKED</span></div>${siteBar(m, "restore")}
        <div class="fb">🔒 Win the <b>${esc(RQ.games[id].title)}</b> mini-game first. It unlocks this datapoint.</div>
        <div class="bar"><button type="button" class="rq-btn primary" onclick="RQ.site.play('${id}')">🎮 Play the mini-game ▸</button><span></span></div>`);
      return;
    }
    if (st.done) {
      const n = DP.count();
      dl(`<i data-rqctx="siterestore" hidden></i><div class="top"><span>${esc(m.name.toUpperCase())} · DATAPOINT RESTORED</span><span style="color:var(--rq-teal)">✔ ${n}/${DP.TOTAL}</span></div>${siteBar(m, "restore")}
        <div class="fb" style="border-color:var(--rq-teal)"><b style="color:var(--rq-teal)">💾 ${esc(m.short)} datapoint restored.</b><br>${esc(m.line)}</div>
        <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button type="button" onclick="missionPicker()">🗺 Next place</button><button type="button" class="rq-btn primary" onclick="openRepair()">🚀 Ship status (${Math.min(n, REQUIRED)}/${REQUIRED})</button></div>`);
      return;
    }
    const q = m.restore;
    dl(`<i data-rqctx="siterestore" hidden></i><div class="top"><span>${esc(m.name.toUpperCase())} · RESTORE THE DATAPOINT</span><span>💾 ONE QUESTION</span></div>${siteBar(m, "restore")}
      <div class="sim-box"><div class="sim-hdr"><span>ARCHIVE CHECK</span><span>CHOOSE ONE</span></div>
      <p style="margin:6px 0;font-size:15px">${esc(q.q)}</p>
      ${q.o.map((o, i) => `<button type="button" class="opt" ${i === q.a ? "" : 'data-wrong="1"'} style="display:block;width:100%;text-align:left;margin:6px 0" onclick="RQ.site.answer('${id}',${i})">${esc(o[0])}</button>`).join("")}
      ${fb ? `<div class="fb" style="color:#ffd166">⚠️ ${esc(fb)}</div>` : ""}</div>
      <div class="bar"><button type="button" onclick="RQ.site.disc('${id}')">◂ Discovery</button><span></span></div>`);
  };
  SITE.answer = function (id, i) {
    const m = SITE.byId(id), q = m.restore;
    if (i !== q.a) { sfx().bad(); return SITE.restore(id, q.o[i][1]); }
    sfx().good();
    SS.set(id, { done: 1 });
    S.xp += 20;
    hud();
    if (typeof beep === "function") beep([523, 784, 1046], 0.09, "triangle");
    if (m._g && m._g.userData.onRestore) try { m._g.userData.onRestore(); } catch (e) {}
    DP.mark(id);
    SITE.restore(id);
  };
  SITE.hintFor = function (c) {
    const id = SITE.cur, m = SITE.byId(id), st = id ? SS.get(id) : {};
    if (!m) return null;
    if (c === "sitehub") {
      if (!st.won) return { msg: `Tap <b>🎮 Play</b> to start ${esc(m.short)}'s mini-game. Winning unlocks the datapoint.`, acts: [["Start mini-game", () => SITE.play(id)]], pulse: '.rq-step[data-step="1"]' };
      if (!st.disc) return { msg: "Open <b>🔬 Discovery</b> to see what NASA really found.", acts: [["Open discovery", () => SITE.disc(id)]], pulse: '.rq-step[data-step="2"]' };
      if (!st.done) return { msg: "One question left. Tap <b>💾 Restore the datapoint</b>.", acts: [["Restore it", () => SITE.restore(id)]], pulse: '.rq-step[data-step="3"]' };
      return null;
    }
    if (c === "sitewon") return { msg: "Tap <b>See the real discovery</b> to find out what actually happened.", acts: [["Open discovery", () => SITE.disc(id)]], pulse: "#dlg .bar .rq-btn.primary" };
    if (c === "sitedisc") return document.querySelector("#rq-sort-card") && !document.querySelector("#rq-sort .bins button:disabled")
      ? { msg: "Sorting tip: if someone <b>measured, saw or recorded</b> it, it's an <b>observation</b>. If it <b>explains why</b>, it's an <b>interpretation</b>.", acts: [], pulse: "#rq-sort-card" }
      : { msg: "Read both cards, then tap <b>💾 Restore the datapoint</b>.", acts: [["Restore it", () => SITE.restore(id)]], pulse: "#dlg .bar .rq-btn.primary" };
    if (c === "siterestore") return { msg: "Think back to the mini-game and the discovery cards. Want me to cross out a wrong answer?", acts: [["Cross one out", () => window.tarsEliminateWrong && window.tarsEliminateWrong()]], pulse: null };
    return null;
  };

  /* ======================================================================
     5. 3D SITE LAYER: models, beacons, proximity, minimap, roster
     ====================================================================== */
  const PROX = 6.5;
  const hex = (c) => "#" + (c >>> 0).toString(16).padStart(6, "0");
  function holoify(g, color) {
    const m1 = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const m2 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const add = [];
    g.traverse((o) => { if (o.isMesh) { o.material = m1; o.castShadow = false; o.receiveShadow = false; add.push(o); } });
    add.forEach((o) => o.add(new THREE.Mesh(o.geometry, m2)));
    g.userData.holoMats = [m1, m2];
    return g;
  }
  function beaconStation(s) {
    const c = s.color || 0x66ccff, g = new THREE.Group();
    const metal = M3.mat(0x8b919b, 0.45, 0.65), dark = M3.mat(0x2b3038, 0.7, 0.3);
    g.add(M3.at(M3.cyl(2.7, 3.1, 0.42, dark, 28), 0, 0.21, 0));
    g.add(M3.at(M3.cyl(1.7, 1.7, 0.12, M3.mat(c, 0.4, 0.2, { emissive: c, emissiveIntensity: 0.9 }), 32), 0, 0.48, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.07, 8, 48), new THREE.MeshBasicMaterial({ color: c }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.46; g.add(ring);
    g.add(M3.at(M3.cyl(0.09, 0.13, 3.8, metal, 8), 2.35, 2.3, -0.7));
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), M3.mat(0xdfe3e8, 0.4, 0.3, { side: THREE.DoubleSide }));
    dish.position.set(2.35, 4.25, -0.7); dish.rotation.set(-0.9, 0, 0.45); g.add(dish);
    g.add(M3.at(M3.box(1, 0.75, 0.6, dark), -2.3, 0.8, 0.9));
    g.add(M3.at(M3.box(0.7, 0.32, 0.05, M3.mat(c, 0.3, 0.1, { emissive: c, emissiveIntensity: 1 })), -2.3, 0.95, 1.21));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.4, 28, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.position.y = 2.75; cone.rotation.x = Math.PI; g.add(cone);
    M3.shadows(g);
    let holo = null;
    try { holo = s.holo ? s.holo() : null; } catch (e) { console.warn("[RQ site] holo", s.id, e); }
    if (!holo) holo = M3.sph(1.2, c);
    holoify(holo, c);
    const hw = new THREE.Group(); hw.add(holo); hw.position.y = 5.4; g.add(hw);
    g.userData.holo = hw; g.userData.holoMats = holo.userData.holoMats; g.userData.cone = cone;
    return g;
  }
  SITE.place = function () {
    if (SITE._placed || typeof THREE === "undefined" || typeof mr === "undefined" || typeof H !== "function") return;
    SITE._placed = true;
    const list = sites();
    W.siteSpots = list.map((s) => s.pos);
    try { if (W.applyScene) W.applyScene(); } catch (e) { console.warn("[RQ world]", e); }
    list.forEach((s) => {
      try {
        const [x, z] = s.pos, y = H(x, z);
        const g = s.kind === "beacon" ? beaconStation(s) : M3.shadows(s.build ? s.build() : M3.box(1, 1, 1, s.color));
        g.position.set(x, y, z);
        g.rotation.y = s.rot || 0;
        mr.add(g);
        const lab = M3.label(`${s.icon} ${s.short}`, hex(s.color || 0x66ccff));
        lab.position.set(x, y + (s.kind === "beacon" ? 9.6 : s.labelY || 5.5), z);
        mr.add(lab);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 60, 8, 1, true), new THREE.MeshBasicMaterial({ color: s.color || 0x66ccff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
        beam.position.set(x, y + 30, z);
        mr.add(beam);
        s._g = g; s._beam = beam; s._label = lab;
      } catch (e) { console.warn("[RQ site]", s.id, e); }
    });
    try { if (SITE.decorate[W.id]) SITE.decorate[W.id]({ M3, H, mr, MC: typeof MC !== "undefined" ? MC : [] }); } catch (e) { console.warn("[RQ decor]", e); }
    requestAnimationFrame(tick);
  };
  SITE.go = function (id) {
    const s = SITE.byId(id);
    if (!s) return;
    const [x, z] = s.pos;
    if (typeof endPres === "function") endPres();
    pl.radarTarget = null;
    pl.x = x - 2.8; pl.z = z + 3.4; pl.vx = 0; pl.vz = 0;
    if (typeof tarsPl !== "undefined") { tarsPl.x = x + 2.8; tarsPl.z = z + 3.4; }
    try { yaw = Math.atan2(pl.x - x, pl.z - z); } catch (e) {}
    if (typeof AS !== "undefined" && AS.g) { AS.g.visible = true; AS.g.position.set(pl.x, H(pl.x, pl.z), pl.z); AS.g.rotation.y = Math.atan2(x - pl.x, z - pl.z); }
    if (typeof TS !== "undefined" && TS.g && typeof tarsPl !== "undefined") { TS.g.position.set(tarsPl.x, H(tarsPl.x, tarsPl.z), tarsPl.z); TS.g.rotation.y = Math.atan2(x - tarsPl.x, z - tarsPl.z); }
    try { mmActiveTarget = null; } catch (e) {}
    SITE.target = id;
    try { if (mmState === "expanded") setMiniMapMode("compact"); } catch (e) {}
    if (typeof beep === "function") beep([560, 840], 0.05);
  };
  SITE.aim = function (id) {
    const s = SITE.byId(id);
    if (!s) return;
    try { mmActiveTarget = null; } catch (e) {}
    SITE.target = id;
    pl.radarTarget = { x: s.pos[0] - 2.4, z: s.pos[1] + 2.4, label: s.short };
    if (typeof beep === "function") beep([520, 700], 0.04);
  };
  SITE.visit = function (id) {
    if (!SITE.byId(id)) return;
    SITE.go(id);
    T = Math.max(T, 30);
    const sk = $id("skip");
    if (sk) sk.style.display = "none";
    if (typeof ov === "function") ov("");
    SITE.hub(id);
  };

  function foundCount() {
    const f = (typeof S !== "undefined" && S.found) || {};
    return LEGACY.filter((d) => d.ns.some((n) => f[n])).length + sites().filter((s) => SS.get(s.id).seen).length;
  }
  function drawSitesOnMap(list) {
    if (typeof mmState === "undefined" || mmState === "minimized") return;
    const wrap = $id("mm-wrap"), cvs = $id("mm-canvas");
    if (!cvs || (wrap && wrap.style.display === "none")) return;
    const ctx = cvs.getContext("2d"), cx = cvs.width / 2, cy = cvs.height / 2;
    const radius = Math.min(cx, cy) - 8, scale = radius / (135 / (typeof mmZoom === "number" && mmZoom ? mmZoom : 1));
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    list.forEach((s) => {
      let x = cx + (s.pos[0] - pl.x) * scale, y = cy + (s.pos[1] - pl.z) * scale;
      const dd = Math.hypot(x - cx, y - cy), done = SS.get(s.id).done, col = done ? "#4cd98a" : hex(s.color || 0x66ccff);
      ctx.fillStyle = col;
      if (dd > radius - 8) {
        const k = (radius - 8) / dd;
        x = cx + (x - cx) * k; y = cy + (y - cy) * k;
        ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        return;
      }
      if (SITE.target === s.id) { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(performance.now() / 200) * 1.5, 0, Math.PI * 2); ctx.stroke(); }
      ctx.beginPath();
      if (s.kind === "beacon") { ctx.moveTo(x, y - 6); ctx.lineTo(x + 5.5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 5.5, y); ctx.closePath(); } else ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill(); ctx.strokeStyle = "#070b13"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "8px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(238,244,255,.85)";
      ctx.fillText(s.short.length > 12 ? s.short.split(" ")[0] : s.short, x, y + 15);
    });
    ctx.restore();
  }
  function rosterRows(list) {
    return list.map((s) => {
      const st = SS.get(s.id), dist = Math.round(Math.hypot(s.pos[0] - pl.x, s.pos[1] - pl.z)), act = SITE.target === s.id;
      return `<div class="mm-row rq-site-row ${st.done ? "done" : "missing"} ${act ? "active" : ""}" onclick="RQ.site.aim('${s.id}')">
        <div><b>${s.icon} ${esc(s.short)}</b><br><small style="color:var(--mu)">${s.kind === "beacon" ? "📡 Holo-beacon · " : ""}${dist} m away</small></div>
        <div style="display:flex;gap:4px;align-items:center">
          <button type="button" class="mm-btn" style="padding:1px 6px;font-size:10px" onclick="event.stopPropagation();RQ.site.go('${s.id}')" title="Move Astronaut &amp; TARS directly to ${esc(s.short)}">🚶 Go</button>
          ${st.done ? '<span class="mm-badge ok">✔ RESTORED</span>' : st.won ? '<span class="mm-badge mis">▶ IN PROGRESS</span>' : '<span class="mm-badge mis">⚠️ SILENT</span>'}
        </div></div>`;
    }).join("");
  }
  let lastSlow = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (typeof S === "undefined") return;
    const list = sites();
    if (!list.length) return;
    const t = typeof T === "number" ? T : performance.now() / 1000;
    list.forEach((s) => {
      const g = s._g;
      if (!g) return;
      const hw = g.userData.holo;
      if (hw) {
        hw.rotation.y = t * 0.45;
        hw.position.y = 5.4 + Math.sin(t * 1.4 + s.pos[0]) * 0.2;
        const ms = g.userData.holoMats;
        if (ms) ms[0].opacity = 0.3 + 0.07 * Math.sin(t * 7 + s.pos[1]) - (Math.random() < 0.015 ? 0.18 : 0);
        if (g.userData.cone) g.userData.cone.material.opacity = 0.05 + 0.03 * Math.sin(t * 2.3);
      }
      if (g.userData.spin) try { g.userData.spin(t); } catch (e) {}
      if (s._beam) s._beam.material.opacity = SS.get(s.id).done ? 0.08 : 0.22 + 0.1 * Math.sin(t * 3 + s.pos[0]);
    });
    if (S.mode !== "play") { SITE.near = null; return; }
    let best = null, bd = 1e9;
    list.forEach((s) => {
      const d = Math.hypot(s.pos[0] - pl.x, s.pos[1] - pl.z);
      s._d = d;
      if (d < bd) { bd = d; best = s; }
      if (d < 14 && !SS.get(s.id).seen) {
        SS.set(s.id, { seen: 1 });
        if (typeof beep === "function") beep([440, 660, 880], 0.07);
        if (typeof ov === "function") {
          ov(`<p>${s.kind === "beacon" ? "HOLO-BEACON SIGNAL · ARCHIVE LINK" : "SIGNAL DETECTED · CAMERA TRACKING"}</p><h1>${esc(s.short.toUpperCase())}</h1><p style="font-size:12px">${s.kind === "beacon" ? "HOLOGRAM FROM NASA RECORDS" : "ARCHIVED TELEMETRY READY"}</p>`);
          setTimeout(() => ov(""), 2400);
        }
      }
    });
    let ld = 1e9;
    try { if (near) ld = Math.hypot(near.x - pl.x, near.z - pl.z); } catch (e) {}
    SITE.near = best && bd < PROX && bd < ld ? best : null;
    const pr = $id("pr");
    if (SITE.near && pr) {
      const st = SS.get(SITE.near.id);
      pr.style.display = "block";
      const K = window.matchMedia && matchMedia("(pointer:coarse)").matches ? "tap E" : "ENTER";
      pr.textContent = (st.done ? `✔ DATAPOINT RESTORED · ${K} to revisit ` : (K === "ENTER" ? "ENTER to " : "Tap E to ")) + (SITE.near.kind === "beacon" ? `open the ${SITE.near.short} holo-beacon` : `investigate ${SITE.near.short}`);
    }
    drawSitesOnMap(list);
    if (t - lastSlow < 0.25) return;
    lastSlow = t;
    // nav line: nearest silent place (legacy machines + sites)
    const nav = $id("nav"), pending = !W.isMoon && S.rec.some((r, i) => r && !S.inst[i]);
    let un = null, ud = 1e9;
    if (typeof MC !== "undefined") MC.forEach((m) => { if (!m.dn) { const d = Math.hypot(m.x - pl.x, m.z - pl.z); if (d < ud) { ud = d; un = m.n; } } });
    list.forEach((s) => { if (!SS.get(s.id).done && s._d < ud) { ud = s._d; un = s.short; } });
    if (nav && !pending) nav.textContent = un ? `Nearest signal: ${un} · ${Math.round(ud)} m` : `Every ${W.name} place restored!`;
    const hd = $id("hd");
    if (hd) hd.textContent = foundCount() + "/" + DP.TOTAL;
    // roster: the engine rewrites it every 0.4 s; append the site rows
    const roster = $id("mm-roster");
    if (roster && !roster.querySelector(".rq-site-row")) roster.insertAdjacentHTML("beforeend", rosterRows(list));
    const miss = DP.TOTAL - DP.count();
    const pill = $id("mm-pill-badge");
    if (pill) pill.textContent = `${miss} SILENT`;
    const ms = $id("mm-missing-summary");
    if (ms) ms.textContent = `${miss} OF ${DP.TOTAL} PLACES STILL SILENT`;
    // target readout: a site the player picked, or the nearest silent site when no machine target applies
    const te = $id("mm-target");
    let legacyTarget = false;
    try { legacyTarget = mmActiveTarget !== null && !!MC[mmActiveTarget]; } catch (e) {}
    const legacyLeft = typeof MC !== "undefined" && MC.some((m) => !m.dn && !interactionState.completedTasks[m.n]);
    let ts = SITE.target ? SITE.byId(SITE.target) : null;
    if (!ts && !legacyTarget && !legacyLeft) ts = list.filter((s) => !SS.get(s.id).done).sort((a, b) => a._d - b._d)[0] || null;
    if (te && !legacyTarget && ts) {
      const dx = ts.pos[0] - pl.x, dz = ts.pos[1] - pl.z, bearing = (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360;
      const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(bearing / 45) % 8], st = SS.get(ts.id);
      te.innerHTML = `🎯 <b>${esc(ts.short)}</b> · <span style="color:#fff">${Math.round(ts._d)}m ${compass}</span> ${st.done ? '<span class="mm-badge ok">✔ Done</span>' : '<span class="mm-badge mis">⚠️ SILENT</span>'}${ts.kind === "beacon" ? ' <span class="mm-badge ph">📡 beacon</span>' : ""}`;
    } else if (te && !legacyTarget && !legacyLeft) te.innerHTML = `🎉 <b>EVERY ${W.NAME} PLACE RESTORED!</b>`;
  }

  /* ======================================================================
     6. INSTALL OVERRIDES (called from RQ.boot)
     ====================================================================== */
  DP.install = function () {
    window.openRepair = openShipPanel;
    window.openFinal = openFinalCheck;
    window.renderFinal = renderFinalCheck;
    SITE.place();
    // a legacy machine restored = its datapoint restored
    const prevLegacy = window.openStageLegacy;
    if (prevLegacy) window.openStageLegacy = function () {
      const r = prevLegacy.apply(this, arguments);
      try { const d = LEGACY.find((x) => curM && x.ns.includes(curM.n)); if (d && curM.dn) DP.mark(d.id); } catch (e) {}
      return r;
    };
    // ENTER / E / the on-screen E button: open a site when it's the closest thing
    const prevInteract = window.interact;
    window.interact = function () {
      try {
        if (SITE.near && S.mode == "play" && T >= lockT && $id("bp").style.display != "flex" && Math.hypot(pl.x + 14, pl.z + 10) >= 10) {
          lockT = T + 0.8;
          $id("pr").style.display = "none";
          if (document.activeElement) document.activeElement.blur();
          return SITE.hub(SITE.near.id);
        }
      } catch (e) {}
      return prevInteract && prevInteract.apply(this, arguments);
    };
    // picking a machine on the radar clears a site target
    const prevTarget = window.targetMachine;
    if (prevTarget) window.targetMachine = function () { SITE.target = null; return prevTarget.apply(this, arguments); };
    const prevGo = window.goToMachineFromRadar;
    if (prevGo) window.goToMachineFromRadar = function () { SITE.target = null; return prevGo.apply(this, arguments); };
    // TARS "cross one out" works on any question marked with data-wrong
    const prevElim = window.tarsEliminateWrong;
    window.tarsEliminateWrong = function () {
      const wrong = Array.from(document.querySelectorAll('#dlg .opt[data-wrong]:not(.tars-elim)'));
      if (!document.querySelector("#dlg .opt[data-wrong]")) return prevElim && prevElim.apply(this, arguments);
      if (wrong.length <= 1) { say(`I've narrowed it down as far as I can, <b>${esc(ME.name())}</b>. Your call!`); return; }
      wrong[0].classList.add("tars-elim");
      wrong[0].disabled = true;
      say(`I crossed out one answer that doesn't fit, <b>${esc(ME.name())}</b>.`);
    };
    // Reset also clears the progress keys of both worlds
    window.resetProgress = function () {
      if (!confirm("Reset ALL saved progress on Mars and the Moon (your name and age, XP, datapoints, stars)? This cannot be undone.")) return;
      try {
        const per = ["rq.introSeen", "rq.outroSeen", "rq.dpOrder", "rq.launchOK"];
        ["btsm.save.v1", "btsm_v4_profile", "btsm.soj.report", "btsm.soj.state.v2", "btsm.v4tasks.v2", "rq.stars", "rq.sort", "rq.moon", "rq.sites", ...per, ...per.map((k) => k + ".moon")].forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
      location.reload();
    };
  };
})();
