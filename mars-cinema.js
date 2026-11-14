/* ============================================================================
   RoverQuest — Mars cinematics (mars-cinema.js)
   • 20-second intro: cruise → engine failure → fiery entry → crash → hatch exit
   • 30-second outro: liftoff → 7 months home → briefing-room report → applause
   Drives the existing Three.js scenes (sp = space, mr = Mars) through the page's
   main loop by swapping window.intro while S.mode === "intro".
   ============================================================================ */
(function () {
  "use strict";
  const RQ = (window.RQ = window.RQ || {});
  const sfx = () => RQ.sfx || { ensure() {}, tone() {}, noise() {}, sweep() {}, thud() {}, win() {}, good() {}, click() {} };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerpN = (a, b, t) => a + (b - a) * t;
  const ease = (k) => k * k * (3 - 2 * k);
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const C = (RQ.cine = { active: false, gate: false, kind: "", t: 0, frame: null, cue: {} });
  let el, raf = 0, last = 0;
  const q = (s) => el.querySelector(s);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const NM = () => esc(RQ.me ? RQ.me.name() : "Explorer");
  const W = RQ.W || { id: "mars", name: "Mars", NAME: "MARS", emoji: "🔴", required: 5, isMoon: false, key: (k) => k, other: { name: "Moon", emoji: "🌙", href: "mars.html?world=moon" } };
  const MOON = !!W.isMoon;
  const TOTAL = () => (RQ.dp ? RQ.dp.TOTAL : MOON ? 4 : 9);
  const REQ = W.required || 5;
  const NUMW = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const profileOpen = () => { const p = document.getElementById("rq-profile"); return !!(p && p.classList.contains("on")); };

  /* ------------------------------------------------------------ overlay */
  function build() {
    if (el) return;
    el = document.createElement("div");
    el.id = "rq-cine";
    el.innerHTML = `
      <div class="red"></div><div class="flash"></div><div class="fade" style="position:absolute;inset:0;background:#000;opacity:0;transition:opacity .5s"></div>
      <div class="lb t"></div><div class="lb b"></div>
      <div class="title"><h1></h1><p></p></div>
      <div class="alert" role="alert"><h2></h2><p></p></div>
      <div class="hudtxt"></div>
      <div id="rq-room" aria-hidden="true"></div>
      <div class="cap" aria-live="polite"></div>
      <div class="rq-gate" hidden>
        <p class="rq-gate-hi"></p>
        <button type="button" class="rq-btn primary big" id="rq-gate-go">▶ Begin the mission</button>
        <button type="button" class="rq-btn ghost" id="rq-gate-skip">Skip intro</button>
        <small>Turn your sound on 🔊 · intro is 20 seconds</small>
      </div>
      <button type="button" class="skip rq-btn ghost" id="rq-cine-skip">Skip ▸</button>
      <div class="pbar"><i></i></div>`;
    document.body.appendChild(el);
    q("#rq-cine-skip").onclick = () => skip();
    q("#rq-gate-skip").onclick = () => skip();
    q("#rq-gate-go").onclick = () => {
      sfx().ensure();
      sfx().click();
      C.gate = false;
      C.t = 0;
      q(".rq-gate").hidden = true;
      q("#rq-cine-skip").hidden = false;
    };
    addEventListener("keydown", (e) => {
      if (!C.active || profileOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); skip(); }
      else if (C.gate && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); q("#rq-gate-go").click(); }
    }, true);
  }
  function setPart(sel, on, a, b) {
    const n = q(sel);
    if (!n) return;
    const key = sel + "|" + (on ? (a || "") + "|" + (b || "") : "");
    if (C.cue[sel] === key) return;
    C.cue[sel] = key;
    if (on) {
      if (sel === ".cap" || sel === ".hudtxt") n.innerHTML = a;
      else { n.children[0].innerHTML = a || ""; n.children[1].innerHTML = b || ""; }
    }
    n.classList.toggle("on", !!on);
  }
  function cueAt(list, t) {
    for (const c of list) if (t >= c[0] && t < c[1]) return c;
    return null;
  }
  function begin(kind) {
    build();
    C.active = true;
    C.kind = kind;
    C.t = 0;
    C.cue = {};
    document.body.classList.add("rq-cinema");
    const d = document.getElementById("dlg");
    if (d) d.style.display = "none";
    if (typeof ov === "function") ov("");
    q(".pbar i").style.width = "0";
    q(".flash").style.opacity = 0;
    q(".fade").style.opacity = 0;
    q(".red").style.opacity = 0;
    q("#rq-room").className = "";
    q("#rq-room").innerHTML = "";
    q("#rq-cine-skip").hidden = false;
    q(".rq-gate").hidden = true;
    ["title", "alert", "cap", "hudtxt"].forEach((k) => q("." + k).classList.remove("on"));
    RQ.hints && RQ.hints.pause && RQ.hints.pause(true);
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!C.active) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!C.gate) C.t += dt;
    try {
      if (C.kind === "intro") introOverlay(C.t, dt);
      else outroOverlay(C.t, dt);
    } catch (e) { console.error("[RQ cinema]", e); }
    raf = requestAnimationFrame(tick);
  }
  function end() {
    C.active = false;
    C.gate = false;
    cancelAnimationFrame(raf);
    document.body.classList.remove("rq-cinema");
    if (el) {
      q("#rq-room").classList.remove("on", "clapping");
      ["title", "alert", "cap", "hudtxt"].forEach((k) => q("." + k).classList.remove("on"));
    }
    stopApplause();
    RQ.hints && RQ.hints.pause && RQ.hints.pause(false);
  }

  /* ------------------------------------------------------------ helpers */
  const tmpV = () => new THREE.Vector3();
  function groundY() { return H(-14, -10); }
  function landShip() {
    const gy = groundY();
    G2.position.set(-14, gy + 4.2, -10);
    G2.rotation.set(0.14, 0, 0.26);
  }
  function resetSpace() {
    if (typeof endPres === "function") endPres();
    IP = 10;
    SH.visible = true;
    SH.position.set(0, 0, 0);
    SH.rotation.set(0, 0, 0);
    flame.material.opacity = 0.7;
    flame.scale.set(1, 1, 1);
    plasma.material.opacity = 0;
    sp.background.setRGB(0, 0, 0.016);
    planet.visible = true;
    const cp = document.getElementById("cp");
    if (cp) { cp.style.display = "none"; cp.className = ""; }
    shake = 0;
  }
  function placeAtHatch(walkOut) {
    const door = SHIP2.userData.door, hv = tmpV(), hd = tmpV();
    G2.updateMatrixWorld(true);
    door.getWorldPosition(hv);
    hd.set(0, 0, 1).transformDirection(G2.matrixWorld);
    hd.y = 0;
    hd.normalize();
    pl.x = hv.x + hd.x * walkOut;
    pl.z = hv.z + hd.z * walkOut;
    pl.vx = pl.vz = 0;
    pl.ang = Math.atan2(hd.x, hd.z);
    if (typeof tarsPl !== "undefined") { tarsPl.x = pl.x + 1.6; tarsPl.z = pl.z + 0.8; }
    AS.g.visible = true;
    TS.g.visible = true;
  }
  function spawnDebris(cx, cz, gy) {
    for (let i = 0; i < 26; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: i % 3 ? 0x5a3a28 : 0x8a8f99 }));
      p.position.set(cx + rnd(-4, 4), gy + 3, cz + rnd(-4, 4));
      p.userData.v = new THREE.Vector3(rnd(-9, 9), rnd(6, 15), rnd(-9, 9));
      p.userData.d = 1;
      mr.add(p);
      puffs.push(p);
      setTimeout(() => { mr.remove(p); const k = puffs.indexOf(p); if (k >= 0) puffs.splice(k, 1); }, 4500);
    }
    for (let i = 0; i < 16; i++) dust(cx + rnd(-3, 3), gy + 1, cz + rnd(-3, 3), (MOON ? 0x9a9ca2 : 0xcc9a78), 0.65, rnd(0.5, 2.6), 6000);
  }
  function dust(x, y, z, color, op, vy, life, additive) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, fog: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    p.position.set(x, y, z);
    p.userData.v = new THREE.Vector3(rnd(-3, 3), vy, rnd(-3, 3));
    mr.add(p);
    puffs.push(p);
    setTimeout(() => { mr.remove(p); const k = puffs.indexOf(p); if (k >= 0) puffs.splice(k, 1); p.geometry.dispose(); p.material.dispose(); }, life || 4000);
    return p;
  }
  let sparkT = 0;
  function sparks(dt, rate) {
    sparkT += dt;
    if (sparkT < 0.04) return;
    sparkT = 0;
    if (Math.random() > rate) return;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09), new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xffcc66 : 0xff6a2a }));
    s.position.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 2));
    SH.add(s);
    setTimeout(() => SH.remove(s), 160);
  }

  /* ================================================================ INTRO */
  const INTRO_LEN = 20;
  const INTRO_CAPS = [
    [0.9, 4.6, () => `<b>${W.NAME} APPROACH</b> · Commander <b>${NM()}</b>, you and your robot co-pilot <b>TARS</b> are minutes from ${MOON ? "touchdown" : "orbit"}.`],
    [5.0, 8.0, () => `<b>TARS:</b> ${NM()}, the ${MOON ? "descent" : "main"} engine just cut out. That's… not ideal. Hold on!`],
    [8.2, 12, () => (MOON ? "<b>TARS:</b> No air here to slow us down. I'm firing every thruster I've got and aiming for flat ground." : "<b>TARS:</b> We're hitting the atmosphere way too fast. I'm aiming for the flattest ground I can find.")],
    [15.3, 17.7, () => `<b>TARS:</b> We're down, ${NM()}, and we're in one piece. The ship isn't. <b>${NUMW[REQ][0].toUpperCase() + NUMW[REQ].slice(1)} systems</b> are offline.`],
    [17.7, 30, () => (MOON
      ? "<b>TARS:</b> Four Apollo-era machines are out on this plain. Each one holds know-how we need. Restore <b>any three</b> and we can lift off."
      : "<b>TARS:</b> Nine places on this plain hold the know-how: NASA machines, plus beacons that tell the stories of craft that flew elsewhere. Restore <b>any five</b> and we fly home.")],
  ];
  function introPlay(opts) {
    opts = opts || {};
    begin("intro");
    resetSpace();
    impacted = false;
    EX.i = 0; EX.t = 0; EX.vx = EX.vz = 0; EX.lift = 0;
    SHIP2.userData.door.rotation.x = 0;
    const gy = groundY();
    G2.position.set(-14, gy + 90, -10);
    AS.g.visible = false;
    TS.g.visible = false;
    T = 0;
    S.mode = "intro";
    C.frame = introFrame;
    C.gate = !!opts.gate;
    q(".rq-gate").hidden = !C.gate;
    q("#rq-cine-skip").hidden = C.gate;
    if (C.gate) setPart(".title", true, "ROVERQUEST", "Beyond the Silent Machines · " + W.name);
    q(".rq-gate-hi").innerHTML = RQ.me && RQ.me.has() ? `Welcome aboard, Commander <b>${NM()}</b>.` : "";
    C.alarmT = 0;
    C.sfx = {};
  }
  function once(key, fn) { if (!C.sfx[key]) { C.sfx[key] = 1; fn(); } }
  function introFrame(dt) {
    IP = 10;
    const t = C.gate ? 0.6 : C.t;
    T = t;
    let sc = sp;
    if (t < 12) {
      const z = -Math.min(t, 11) * 30;
      const fail = Math.max(0, t - 5);
      SH.position.set(Math.sin(t * 0.5) * 0.2, Math.sin(t) * 0.3 - fail * fail * 0.12, z);
      SH.rotation.z = Math.sin(t * 0.7) * 0.05 + fail * fail * 0.05;
      SH.rotation.x = fail ? Math.sin(t * 3.1) * 0.04 * fail : 0;
      planet.position.set(0, -40, -1150 + Math.min(t, 11) * 40);
      planet.rotation.y += dt * 0.01;
      const k = clamp(t / 8, 0, 1);
      cam.position.set(lerpN(14, -11, k), lerpN(5, 3, k), z + lerpN(28, 22, k));
      cam.lookAt(SH.position.x, SH.position.y, z - 8);
      // engine: steady → sputter → dead
      flame.material.opacity = t < 5 ? 0.7 : t < 6.3 ? (Math.random() > 0.45 ? 0.75 : 0.05) : 0;
      flame.scale.setScalar(t < 5 ? 1 + Math.sin(t * 30) * 0.06 : 0.7);
      if (t > 5) sparks(dt, t < 8 ? 0.9 : 0.4);
      const cp = document.getElementById("cp");
      if (t >= 8) {
        SH.visible = false;
        cam.position.set(SH.position.x, SH.position.y + 0.6, z - 3);
        cam.lookAt(planet.position);
        cam.rotateZ(Math.sin(t * 2.6) * (t - 8) * 0.09);
        cp.style.display = "block";
        cp.className = t >= 9 ? "al" : "";
        cp.style.setProperty("--h", MOON ? 0 : clamp((t - 8) / 3.5, 0, 1) * 0.6);
      } else {
        SH.visible = true;
        cp.style.display = "none";
      }
      const e = clamp((t - 8) / 3.5, 0, 1);
      plasma.material.opacity = MOON ? 0 : e * 0.65 * (0.8 + 0.2 * Math.sin(t * 40));
      if (MOON) sp.background.setRGB(0, 0, 0.016); else sp.background.setRGB(e * 0.14, e * 0.045, e * 0.02);
      shake = t < 5 ? 0 : t < 8 ? 0.04 + (t - 5) * 0.025 : 0.08 + (t - 8) * 0.05;
    } else {
      sc = mr;
      document.getElementById("cp").style.display = "none";
      plasma.material.opacity = 0;
      sp.background.setRGB(0, 0, 0.016);
      const k = clamp((t - 12) / 3, 0, 1), cx = -14, cz = -10, gy = groundY();
      G2.position.set(cx + (1 - k) * 18, lerpN(gy + 90, gy + 4.2, k * k), cz - (1 - k) * 10);
      G2.rotation.set(lerpN(2.2, 0.14, k), (1 - k) * 4, lerpN(0.6, 0.26, k));
      if (!impacted) {
        cam.position.set(cx + 34, gy + lerpN(70, 13, ease(k)), cz + 48);
        cam.lookAt(G2.position);
        // fiery trail
        C.trailT = (C.trailT || 0) + dt;
        if (C.trailT > 0.035) {
          C.trailT = 0;
          dust(G2.position.x + rnd(-1, 1), G2.position.y + 2, G2.position.z + rnd(-1, 1), MOON ? (Math.random() > 0.5 ? 0xffd9a0 : 0x8a8d94) : Math.random() > 0.4 ? 0xff7a2a : 0x5a4a44, 0.7, 2, 1800, Math.random() > 0.5);
        }
        shake = 0.08;
      } else {
        const a = (t - 15) * 0.12;
        cam.position.set(cx + 34 * Math.cos(a) - 8 * Math.sin(a), gy + 13 + (t - 15) * 0.6, cz + 48 * Math.cos(a));
        cam.lookAt(cx, gy + 4, cz);
        shake = Math.max(0, 0.9 - (t - 15) * 0.7);
      }
      if (k >= 1 && !impacted) {
        impacted = true;
        spawnDebris(cx, cz, gy);
        flash();
        sfx().thud();
        sfx().noise(1.6, 0.5, 300, 0.5);
      }
      if (t >= 15.4 && S.mode === "intro") {
        // hand over to the original hatch-exit sequence (≈4.5 s)
        landShip();
        EX.i = 0;
        EX.t = 0.55;
        S.mode = "exit";
      }
    }
    if (shake) shk(shake);
    return sc;
  }
  function flash() {
    const f = q(".flash");
    f.style.transition = "none";
    f.style.opacity = 1;
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transition = "opacity 1.1s"; f.style.opacity = 0; }));
  }
  function introOverlay(t, dt) {
    if (C.gate) return;
    q(".pbar i").style.width = clamp((t / INTRO_LEN) * 100, 0, 100) + "%";
    setPart(".title", t > 0.4 && t < 4.4, "ROVERQUEST", "Beyond the Silent Machines · " + W.name);
    const c = cueAt(INTRO_CAPS, t);
    setPart(".cap", !!c, c ? (typeof c[2] === "function" ? c[2]() : c[2]) : "");
    const al = t >= 5 && t < 8 ? (MOON ? ["DESCENT ENGINE FAILURE", "THRUST LOST · FALLING TOWARD THE MOON"] : ["MAIN ENGINE FAILURE", "THRUST LOST · FALLING TOWARD MARS"]) : t >= 9 && t < 12 ? (MOON ? ["NO AIR TO SLOW US", "BRACE FOR HARD LANDING"] : ["HEAT SHIELD CRITICAL", "BRACE FOR EMERGENCY LANDING"]) : t >= 15 && t < 17.4 ? ["HULL DAMAGE", `${REQ} SHIP SYSTEMS OFFLINE`] : null;
    setPart(".alert", !!al, al && al[0], al && al[1]);
    const red = q(".red");
    red.style.opacity = (t >= 5 && t < 12) ? (0.35 + 0.35 * Math.abs(Math.sin(t * 5))) : (t >= 15 && t < 16.5 ? 0.4 : 0);
    if (t >= 8 && t < 12) {
      const k = clamp((t - 8) / 4, 0, 1);
      const alt = MOON ? lerpN(15, 0.2, k).toFixed(1) : Math.round(lerpN(125, 2, k)), vel = (MOON ? lerpN(1.7, 0.1, k * k) : lerpN(5.8, 0.4, k * k)).toFixed(1), heat = Math.round(lerpN(100, 9, k));
      setPart(".hudtxt", true, `ALTITUDE ${alt} km<br>VELOCITY ${vel} km/s<br>${MOON ? "FUEL" : "HEAT SHIELD"} ${heat}%`);
      q(".hudtxt").classList.toggle("warn", heat < 40);
    } else setPart(".hudtxt", false);
    // sound design
    if (t >= 5 && t < 12) {
      C.alarmT += dt;
      if (C.alarmT > 0.55) { C.alarmT = 0; sfx().tone(880, 0.18, "square", 0.035); sfx().tone(660, 0.18, "square", 0.03, 0.2); }
    }
    if (t >= 5) once("fail", () => { sfx().sweep(240, 38, 1.4, "sawtooth", 0.08); sfx().noise(0.6, 0.35, 900, 1); });
    if (t >= 8 && !MOON) once("entry", () => sfx().noise(4, 0.28, 260, 0.4));
    if (t >= 12) once("whoosh", () => sfx().sweep(900, 120, 2.6, "sine", 0.05));
    // safety net: the hatch exit should have handed off by now
    if (t > INTRO_LEN + 4 && C.kind === "intro") finishIntro();
  }
  function finishIntro() {
    if (!C.active || C.kind !== "intro") return;
    end();
    LS.set(W.key("rq.introSeen"), "1");
    resetSpace();
    if (!impacted || S.mode === "intro" || S.mode === "exit") {
      landShip();
      impacted = true;
      SHIP2.userData.door.rotation.x = 1.82;
      if (S.mode === "intro" || S.mode === "exit") placeAtHatch(7);
    }
    EX.i = 1;
    EX.vx = EX.vz = 0;
    EX.lift = 0;
    T = Math.max(T, 30);
    const sk = document.getElementById("skip");
    if (sk) sk.style.display = "none";
    S.mode = "talk";
    if (typeof ov === "function") ov("");
    window.missionPicker();
    setTimeout(() => {
      if (window.tarsSay) window.tarsSay(RQ.me ? RQ.me.t({
        explorer: `OK <b>${NM()}</b>, here's the plan! Pick any place on the map. Play its game, learn its secret, and fix part of our ship. We need <b>${REQ} of the ${TOTAL()}</b>. Tap me if you get stuck! 🤖`,
        scientist: `Here's the plan, <b>${NM()}</b>: pick any of the ${TOTAL()} places on the map. Each has a <b>mini-game</b> and a real NASA discovery, and restoring it brings one ship system back online. We need <b>any ${REQ}</b>. Stuck? Tap me any time.`,
        engineer: `Status, <b>${NM()}</b>: ${REQ} ship systems offline. ${TOTAL()} NASA datapoints available, ${REQ} required. Each one is a mini-game plus mission data. Ping me if you need a hint.`,
      }) : "Pick a NASA machine to visit. Stuck? Tap me any time for a hint.");
    }, 600);
  }
  function skip() {
    if (!C.active) return;
    if (C.kind === "intro") { flame.material.opacity = 0.7; finishIntro(); }
    else outroEnd();
  }

  /* ================================================================ OUTRO */
  const OUTRO_LEN = 30;
  let oFlame, oGlow, earth, earthGlow, confetti = [], cctx, applause = 0;
  function ensureOutroProps() {
    if (!oFlame) {
      oFlame = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.ConeGeometry(1.0, 5, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.2, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      outer.position.y = -2.5; inner.position.y = -1.6;
      oFlame.add(outer, inner);
      oFlame.position.y = -2.6;
      outer.rotation.x = Math.PI; inner.rotation.x = Math.PI;
      oFlame.visible = false;
      G2.add(oFlame);
      oGlow = new THREE.PointLight(0xff9a52, 0, 60);
      oGlow.position.set(0, -4, 0);
      G2.add(oGlow);
    }
    if (!earth) {
      const cv = document.createElement("canvas");
      cv.width = 1024; cv.height = 512;
      const x = cv.getContext("2d");
      const g = x.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#2a6db5"); g.addColorStop(0.5, "#1c4f93"); g.addColorStop(1, "#2a6db5");
      x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
      let s = 4242; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 26; i++) {
        const cx = r() * 1024, cy = 90 + r() * 330, rad = 20 + r() * 70;
        x.fillStyle = r() > 0.35 ? "#3f8a3c" : "#a68a55";
        x.beginPath();
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, d = rad * (0.6 + r() * 0.6); k ? x.lineTo(cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d) : x.moveTo(cx + Math.cos(a) * d * 1.4, cy + Math.sin(a) * d); }
        x.fill();
      }
      x.fillStyle = "#f4f7fb"; x.fillRect(0, 0, 1024, 34); x.fillRect(0, 478, 1024, 34);
      x.strokeStyle = "rgba(255,255,255,.75)"; x.lineCap = "round";
      for (let i = 0; i < 70; i++) { x.lineWidth = 4 + r() * 10; const cx = r() * 1024, cy = 40 + r() * 430; x.beginPath(); x.moveTo(cx, cy); x.bezierCurveTo(cx + 30, cy - 10, cx + 70, cy + 10, cx + 60 + r() * 80, cy + r() * 12); x.stroke(); }
      const tex = new THREE.CanvasTexture(cv);
      earth = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 32), new THREE.MeshBasicMaterial({ map: tex }));
      earth.visible = false;
      sp.add(earth);
      const gc = document.createElement("canvas");
      gc.width = gc.height = 256;
      const gx = gc.getContext("2d"), rg = gx.createRadialGradient(128, 128, 60, 128, 128, 128);
      rg.addColorStop(0, "rgba(120,190,255,.55)"); rg.addColorStop(0.5, "rgba(90,160,255,.18)"); rg.addColorStop(1, "rgba(90,160,255,0)");
      gx.fillStyle = rg; gx.fillRect(0, 0, 256, 256);
      earthGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      earthGlow.scale.set(190, 190, 1);
      earthGlow.visible = false;
      sp.add(earthGlow);
    }
  }
  function outroPlay() {
    if (typeof THREE === "undefined") return;
    ensureOutroProps();
    begin("outro");
    resetSpace();
    if (typeof exitSub === "function") { /* close any dialog without changing mode semantics */ document.getElementById("dlg").style.display = "none"; }
    landShip();
    AS.g.visible = false;
    TS.g.visible = false;
    oFlame.visible = false;
    C.frame = outroFrame;
    C.sfx = {};
    C.dustT = 0;
    S.mode = "intro";
    buildOutroScript();
    buildRoom();
  }
  /* personalised outro: captions + slides from the datapoints this player restored */
  function buildOutroScript() {
    const list = (RQ.dp ? RQ.dp.restored() : []).slice(0, REQ), n = RQ.dp ? RQ.dp.count() : REQ, nm = NM();
    const NAME = nm.toUpperCase();
    C.ocaps = [
      [0.3, 2.8, `<b>ALL ${REQ} SHIP SYSTEMS ONLINE</b> · Every system reads green.`],
      [2.8, 6.4, `<b>TARS:</b> Engines are go, ${nm}. Thank you, silent machines. Next stop: home.`],
      [13.4, 15, `<b>${NAME}:</b> Team, the machines NASA left ${MOON ? "on the Moon" : "on Mars and across the solar system"} aren't junk. They're still teaching us.`],
    ];
    list.forEach((d, i) => C.ocaps.push([15 + i * 1.7, 16.7 + i * 1.7, esc(d.line)]));
    C.ocaps.push([23.5, 30, `<b>${NAME}:</b> They were silent, but they were never forgotten. 👏`]);
    C.slides = [{ ttl: "Mission Report", sub: MOON ? "The Silent Machines of the Moon" : "The Silent Machines of Mars and beyond", img: "" }];
    list.forEach((d) => C.slides.push({ ttl: d.slide.ttl, sub: d.slide.sub, img: d.slide.img || d.img, credit: d.legacy ? "Photo: NASA/JPL-Caltech" : "AI-assisted illustration · based on NASA records" }));
    const PAD = MOON
      ? [{ ttl: "Footprints still there", sub: "No wind on the Moon, so Apollo's tracks remain", img: "" }, { ttl: "Still working", sub: "Apollo's laser mirrors still bounce Earth's light back", img: "" }]
      : SLIDES.slice(1, 6);
    for (let i = 0; C.slides.length < 6 && i < PAD.length; i++) if (!C.slides.some((x) => x.ttl.split(" ")[0] === PAD[i].ttl.split(" ")[0])) C.slides.push(PAD[i]);
    while (C.slides.length < 6) C.slides.push({ ttl: "Silent machines", sub: "Still teaching us", img: "" });
    C.slides.push({ ttl: "Silent, not forgotten", sub: `${n} of ${TOTAL()} datapoints · ${REQ} systems · ${nm} home`, img: "" });
  }
  function outroFrame(dt) {
    IP = 10;
    const t = C.t, cx = -14, cz = -10, gy = groundY();
    if (t < 7) {
      planet.visible = true;
      const door = SHIP2.userData.door;
      door.rotation.x = Math.max(0, door.rotation.x - dt * 1.5);
      const up = ease(clamp(t / 2, 0, 1));
      const lift = t > 3 ? Math.pow(t - 3, 2.2) * 5 : 0;
      G2.position.set(cx, gy + 4.2 + lift, cz);
      G2.rotation.set(lerpN(0.14, 0, up), 0, lerpN(0.26, 0, up));
      const ign = clamp((t - 1.8) / 1.2, 0, 1);
      oFlame.visible = ign > 0;
      oFlame.scale.set(0.6 + ign * 0.6 + Math.sin(t * 40) * 0.05, 0.4 + ign * (0.9 + Math.sin(t * 33) * 0.1), 0.6 + ign * 0.6);
      oGlow.intensity = ign * 3;
      if (ign > 0) {
        C.dustT += dt;
        if (C.dustT > 0.05 && lift < 30) { C.dustT = 0; dust(cx + rnd(-4, 4), gy + 0.8, cz + rnd(-4, 4), (MOON ? 0x9a9ca2 : 0xcc9a78), 0.55, rnd(0.3, 1.6), 4000); }
      }
      const orbit = t * 0.18;
      if (t < 3) {
        cam.position.set(cx + 30 * Math.cos(orbit), gy + 9 + t, cz + 40 * Math.cos(orbit) + 6 * Math.sin(orbit));
        cam.lookAt(cx, gy + 6, cz);
      } else {
        cam.position.set(cx + 26, gy + 8 + lift * 0.35, cz + 36);
        cam.lookAt(G2.position.x, G2.position.y + 2, G2.position.z);
      }
      shake = ign > 0 && t < 5 ? 0.05 + ign * 0.1 : 0;
      if (shake) shk(shake);
      return mr;
    }
    // space: homeward cruise toward Earth
    const k = clamp((t - 7) / 6, 0, 1);
    oFlame.visible = false;
    planet.visible = false;
    earth.visible = earthGlow.visible = true;
    const z = -k * 160;
    SH.visible = true;
    SH.position.set(0, Math.sin(t) * 0.3, z);
    SH.rotation.set(0, 0, Math.sin(t * 0.6) * 0.06);
    flame.material.opacity = 0.75;
    flame.scale.setScalar(1 + Math.sin(t * 30) * 0.08);
    earth.position.set(40, -20, lerpN(-1100, -420, ease(k)));
    earth.rotation.y += dt * 0.08;
    earthGlow.position.copy(earth.position);
    cam.position.set(lerpN(-12, 10, k), lerpN(4, 3, k), z + lerpN(22, 18, k));
    cam.lookAt(lerpN(SH.position.x, earth.position.x * 0.5, k * 0.6), SH.position.y, z - 30);
    return sp;
  }
  function outroOverlay(t, dt) {
    q(".pbar i").style.width = clamp((t / OUTRO_LEN) * 100, 0, 100) + "%";
    const caps = C.ocaps || [
      [0.3, 2.8, `<b>ALL ${REQ} SHIP SYSTEMS ONLINE</b> · Every system reads green.`],
      [2.8, 6.4, "<b>TARS:</b> Engines are go. Thank you, silent machines. Next stop: home."],
      [13.4, 15, "<b>YOU:</b> Team, those machines on Mars aren't junk. They're still teaching us."],
      [15, 16.7, "Sojourner showed why you plan every move when signals take minutes to arrive."],
      [16.7, 18.4, "Viking 1 taught us that 'not detected' doesn't mean 'not there'."],
      [18.4, 20.1, "Spirit's broken wheel dug up silica from ancient hot springs."],
      [20.1, 21.8, "Opportunity's 'blueberries' proved that water once soaked Mars."],
      [21.8, 23.5, "InSight's 1,319 marsquakes revealed a liquid metal core."],
      [23.5, 30, "<b>YOU:</b> They were silent, but they were never forgotten. 👏"],
    ];
    const c = cueAt(caps, t);
    setPart(".cap", !!c, c ? c[2] : "");
    setPart(".alert", t >= 2.6 && t < 3.9, t < 3.2 ? "IGNITION" : "LIFTOFF", `${W.NAME} ASCENT · COURSE SET FOR EARTH`);
    setPart(".title", t >= 7.6 && t < 11.6, MOON ? "3 DAYS LATER" : "7 MONTHS LATER", "Earth orbit · mission control");
    const fade = q(".fade");
    fade.style.opacity = (t > 6.4 && t < 7.4) || (t > 12.4 && t < 13.2) ? 1 : 0;
    if (t >= 1.8) once("ign", () => { sfx().noise(5, 0.4, 140, 0.4); sfx().sweep(60, 160, 4, "sawtooth", 0.05); });
    if (t >= 13) { q("#rq-room").classList.add("on"); once("room", () => sfx().tone(523, 0.3, "sine", 0.05)); }
    const slide = t < 15 ? 0 : t < 23.5 ? 1 + Math.floor((t - 15) / 1.7) : 6;
    if (t >= 13 && C.slide !== slide) { C.slide = slide; showSlide(slide); if (slide) sfx().sweep(500, 900, 0.18, "sine", 0.03); }
    if (t >= 23.6) {
      q("#rq-room").classList.add("clapping");
      once("clap", () => { startApplause(); sfx().win(); burstConfetti(); });
    }
    stepConfetti(dt);
    if (t >= OUTRO_LEN) outroEnd();
  }

  /* ----- briefing room (SVG) ----- */
  const SLIDES = [
    { ttl: "Mission Report", sub: "The Silent Machines of Mars", img: "" },
    { ttl: "Sojourner · 1997", sub: "First Mars rover · rock chemistry with APXS", img: "assets/hardware/sojourner/overview-nasa.jpg" },
    { ttl: "Viking 1 · 1976–1982", sub: "Soil baked in the GCMS · organics not detected", img: "assets/hardware/viking-1-lander/overview-PIA03165.jpg" },
    { ttl: "Spirit · 2004–2010", sub: "Broken wheel uncovered ~90% silica", img: "assets/hardware/spirit-rover/wheels-PIA12312.jpg" },
    { ttl: "Opportunity · 2004–2018", sub: "Hematite 'blueberries' · ancient water", img: "assets/hardware/opportunity-rover/evidence_blueberries-PIA19113.jpg" },
    { ttl: "InSight · 2018–2022", sub: "1,319 marsquakes · liquid metal core", img: "assets/hardware/insight/overview-PIA23203.jpg" },
    { ttl: "Silent, not forgotten", sub: "5 machines · 10 modules · 1 crew home", img: "" },
  ];
  function buildRoom() {
    const skins = ["#f1c7a5", "#c68c62", "#8d5a3b", "#e2b28c", "#5e3b28", "#d9a27a"], hair = ["#2b1c14", "#111", "#7a4a22", "#3b2a20", "#c9a35a", "#1f1f2a"], suits = ["#2f5d9e", "#3a7d6b", "#7a3f8c", "#a8532f", "#3e4a63", "#2d6f8f"];
    let members = "";
    const rows = [{ y: 760, n: 7, s: 1.15, x0: 120, dx: 228 }, { y: 860, n: 6, s: 1.35, x0: 200, dx: 250 }];
    let idx = 0;
    rows.forEach((r) => {
      for (let i = 0; i < r.n; i++, idx++) {
        const x = r.x0 + i * r.dx, sk = skins[idx % 6], hr = hair[(idx * 5) % 6], su = suits[(idx * 7) % 6];
        members += `<g transform="translate(${x} ${r.y}) scale(${r.s})"><g class="member" style="animation-delay:${(idx % 4) * 0.08}s">
          <rect class="arm-l" x="-46" y="-78" width="16" height="58" rx="8" fill="${su}"/><circle cx="-38" cy="-82" r="9" fill="${sk}" class="arm-l"/>
          <rect class="arm-r" x="30" y="-78" width="16" height="58" rx="8" fill="${su}"/><circle cx="38" cy="-82" r="9" fill="${sk}" class="arm-r"/>
          <path d="M-52 40 Q-52 -30 0 -32 Q52 -30 52 40 Z" fill="${su}"/>
          <circle cx="0" cy="-56" r="27" fill="${sk}"/><path d="M-27 -58 Q-26 -88 0 -86 Q26 -88 27 -58 Q14 -70 0 -68 Q-14 -70 -27 -58Z" fill="${hr}"/>
        </g></g>`;
      }
    });
    q("#rq-room").innerHTML = `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid ${innerWidth / innerHeight < 1.25 ? "meet" : "slice"}" role="img" aria-label="Briefing room: you present the mission report to your team">
      <defs><linearGradient id="rqw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2436"/><stop offset="1" stop-color="#101622"/></linearGradient>
      <linearGradient id="rqf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232a38"/><stop offset="1" stop-color="#0c0f16"/></linearGradient>
      <radialGradient id="rqbeam" cx=".5" cy="0" r="1"><stop offset="0" stop-color="rgba(140,190,255,.18)"/><stop offset="1" stop-color="rgba(140,190,255,0)"/></radialGradient></defs>
      <rect width="1600" height="900" fill="url(#rqw)"/>
      <g opacity=".5">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${60 + i * 200}" y="0" width="6" height="560" fill="#0d121c"/>`).join("")}</g>
      <rect x="0" y="560" width="1600" height="340" fill="url(#rqf)"/>
      <circle cx="1450" cy="130" r="58" fill="#23304a"/><circle cx="1450" cy="130" r="40" fill="#2c6fb5"/><path d="M1425 118 q14 -10 28 0 q8 14 -6 22 q-16 2 -22 -22z" fill="#3f8a3c"/>
      <text x="1450" y="214" fill="#6f7f9a" font-size="18" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="700">MISSION CONTROL</text>
      <rect x="400" y="52" width="800" height="470" rx="10" fill="#0a0d14" stroke="#3a4760" stroke-width="6"/>
      <foreignObject x="412" y="64" width="776" height="446"><div xmlns="http://www.w3.org/1999/xhtml" id="rq-slide" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;font-family:Segoe UI,system-ui,sans-serif;text-align:center;background:radial-gradient(ellipse at center,#1b2a44,#0b111c);overflow:hidden"></div></foreignObject>
      <path d="M520 522 L1080 522 L1220 900 L380 900 Z" fill="url(#rqbeam)"/>
      <g transform="translate(330 318) scale(0.95)">
        <ellipse cx="0" cy="300" rx="70" ry="12" fill="rgba(0,0,0,.4)"/>
        <rect x="-34" y="190" width="28" height="110" rx="12" fill="#e9ecef"/><rect x="6" y="190" width="28" height="110" rx="12" fill="#e9ecef"/>
        <rect x="-50" y="60" width="100" height="150" rx="30" fill="#f4f4f4"/><rect x="-26" y="92" width="52" height="30" rx="6" fill="#2b2f36"/><rect x="-46" y="140" width="92" height="24" rx="5" fill="#0e131b"/><text x="0" y="157" fill="#ffb36b" font-size="15" text-anchor="middle" font-family="Segoe UI, sans-serif" font-weight="800">${NM().slice(0, 10).toUpperCase()}</text><circle cx="-10" cy="107" r="5" fill="#ff8a3d"/><circle cx="10" cy="107" r="5" fill="#46e0b0"/>
        <rect x="-72" y="72" width="26" height="100" rx="13" fill="#e2e5e9"/>
        <g class="rq-point"><rect x="40" y="66" width="120" height="24" rx="12" fill="#e2e5e9" transform="rotate(-28 40 78)"/></g>
        <circle cx="0" cy="18" r="48" fill="#f4f4f4"/><ellipse cx="0" cy="22" rx="32" ry="26" fill="#c9a227"/><ellipse cx="-10" cy="12" rx="10" ry="6" fill="#fff" opacity=".45"/>
      </g>
      <g transform="translate(1275 345)">
        <ellipse cx="0" cy="260" rx="60" ry="10" fill="rgba(0,0,0,.4)"/>
        ${[0, 1, 2, 3].map((i) => `<rect x="${-46 + i * 23}" y="20" width="21" height="240" rx="3" fill="#8c95a3" stroke="#59616e" stroke-width="2"/>`).join("")}
        <rect x="-40" y="60" width="80" height="18" rx="3" fill="#0e131b"/><text x="0" y="74" fill="#46e0b0" font-size="14" text-anchor="middle" font-family="Consolas, monospace" font-weight="700">TARS</text>
      </g>
      ${members}
    </svg><canvas id="rq-confetti"></canvas>`;
    C.slide = -1;
    const cv = q("#rq-confetti");
    cv.width = innerWidth;
    cv.height = innerHeight;
    cctx = cv.getContext("2d");
    confetti = [];
  }
  function showSlide(i) {
    const s = (C.slides || SLIDES)[i], box = el.querySelector("#rq-slide");
    if (!box || !s) return;
    const big = !s.img;
    box.innerHTML = big
      ? `<div style="font-size:${i ? 56 : 64}px">${i ? "🏅" : "🚀"}</div><div style="font-size:${i ? 52 : 58}px;font-weight:800;letter-spacing:.02em">${s.ttl}</div><div style="font-size:26px;color:#ffb36b;font-weight:600">${s.sub}</div>${i ? "" : `<div style="font-size:20px;color:#9aa7bb;margin-top:8px">Presented by Commander ${NM()}</div>`}`
      : `<img src="${s.img}" alt="" style="width:100%;height:300px;object-fit:cover;display:block"/><div style="font-size:38px;font-weight:800">${s.ttl}</div><div style="font-size:24px;color:#ffb36b;font-weight:600">${s.sub}</div><div style="font-size:13px;color:#7f8ca3">${s.credit || "Photo: NASA/JPL-Caltech"}</div>`;
  }
  function burstConfetti() {
    const cols = ["#ff8a3d", "#46e0b0", "#ffd166", "#5cc8ff", "#ff6b9a", "#ffffff"];
    for (let i = 0; i < 160; i++) confetti.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 140, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 8, w: 6 + Math.random() * 6, c: cols[i % cols.length] });
  }
  function stepConfetti(dt) {
    if (!cctx || !confetti.length) return;
    cctx.clearRect(0, 0, cctx.canvas.width, cctx.canvas.height);
    for (const p of confetti) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.r); cctx.fillStyle = p.c; cctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); cctx.restore();
    }
    confetti = confetti.filter((p) => p.y < innerHeight + 30);
  }
  function startApplause() {
    stopApplause();
    let n = 0;
    applause = setInterval(() => {
      if (n++ > 70) return stopApplause();
      for (let i = 0; i < 3; i++) sfx().noise(0.05, 0.22 + Math.random() * 0.2, 1400 + Math.random() * 1800, 1.4, Math.random() * 0.08);
    }, 85);
  }
  function stopApplause() { if (applause) clearInterval(applause); applause = 0; }

  function outroEnd() {
    if (!C.active || C.kind !== "outro") return;
    LS.set(W.key("rq.outroSeen"), "1");
    C.frame = () => { IP = 10; return C.t < 13 ? mr : sp; };
    cancelAnimationFrame(raf);
    stopApplause();
    let box = document.getElementById("rq-end");
    if (!box) { box = document.createElement("div"); box.id = "rq-end"; document.body.appendChild(box); }
    const xp = (typeof S !== "undefined" && S.xp) || 0, n = RQ.dp ? RQ.dp.count() : REQ, nm = NM(), TOT = TOTAL();
    box.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-label="Mission complete">
      <div style="font-size:46px">🌍</div><h2>Welcome home, ${nm}!</h2>
      <p style="color:var(--rq-mute);margin:0">You repaired your ship with knowledge from ${n === TOT ? "all " + NUMW[TOT] : n} real NASA ${MOON ? "machines on the Moon" : "missions"}, and brought the crew home.</p>
      <div class="stats"><div><b>${n}/${TOT}</b><small>datapoints</small></div><div><b>${REQ}/${REQ}</b><small>ship systems</small></div><div><b>${xp}</b><small>science XP</small></div></div>
      <div class="acts">
        <button type="button" class="rq-btn primary big" id="rq-end-mars">${W.emoji || "🔴"} Keep exploring ${MOON ? "the Moon" : "Mars"}</button>
        <button type="button" class="rq-btn" id="rq-end-replay">↺ Replay ending</button>
        <button type="button" class="rq-btn ghost" id="rq-end-report">📊 My learning report</button>
        <a class="rq-btn ghost" href="index.html">🌐 Choose world</a>
      </div>
      <p style="margin:14px 0 0;font-size:13px;color:var(--rq-mute)">${n < TOT ? `🔓 <b>${TOT - n} datapoint${TOT - n > 1 ? "s" : ""}</b> still waiting. Keep exploring to restore all ${NUMW[TOT]}.` : `🏆 You restored all ${NUMW[TOT]} datapoints. Legendary.`} · ${W.other.emoji} Ready for more? <a href="${W.other.href}" style="color:#a9f1da">Explore ${W.other.id === "moon" ? "the Moon" : W.other.name}</a>.</p></div>`;
    box.classList.add("on");
    box.querySelector("#rq-end-mars").onclick = () => { box.classList.remove("on"); backToMars(); };
    box.querySelector("#rq-end-replay").onclick = () => { box.classList.remove("on"); outroPlay(); };
    box.querySelector("#rq-end-report").onclick = () => { box.classList.remove("on"); backToMars(); if (window.openFinalLearningReport) window.openFinalLearningReport(); };
    setTimeout(() => box.querySelector("#rq-end-mars").focus(), 50);
    C.active = true; // keep cinema chrome hidden behind the end card
  }
  function backToMars() {
    end();
    if (oFlame) { oFlame.visible = false; oGlow.intensity = 0; }
    if (earth) earth.visible = earthGlow.visible = false;
    resetSpace();
    landShip();
    SHIP2.userData.door.rotation.x = 1.82;
    placeAtHatch(7);
    T = Math.max(T, 30);
    S.mode = "play";
    if (typeof hud === "function") hud();
    if (window.tarsSay) window.tarsSay(`Mission complete, <b>${NM()}</b>! ${RQ.dp && RQ.dp.count() < TOTAL() ? `There are still ${TOTAL() - RQ.dp.count()} datapoints to restore. ` : ""}Replay any mini-game for 3 stars, or check your learning report from the ⚙ menu.`);
  }

  /* ------------------------------------------------------------ install */
  window.intro = function (dt) { return C.frame ? C.frame(dt) : sp; };
  window.storyBox = function () {
    if (C.active && C.kind === "intro") return finishIntro();
    window.missionPicker();
  };
  RQ.cine.playIntro = introPlay;
  RQ.cine.playOutro = outroPlay;
  RQ.cine.skip = skip;
  RQ.cine.finishIntro = finishIntro;
  RQ.cine.landShip = landShip;
  RQ.cine.hideGate = (v) => { build(); q(".rq-gate").hidden = !!v; };
  RQ.cine.startFromGate = () => { build(); if (C.active && C.gate) q("#rq-gate-go").click(); };
})();
