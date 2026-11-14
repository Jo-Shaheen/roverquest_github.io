/* ============================================================================
   RoverQuest — Mars experience layer (mars-experience.js)
   New top bar + menu, photo mission picker, step-based machine hub,
   mini-game wiring, observation/interpretation sorter, launch-home trigger,
   and the TARS "you look stuck" hint engine.
   Hooks the existing globals of mars.html / v4-upgrade.js / mars-polish.js.
   ============================================================================ */
(function () {
  "use strict";
  const RQ = (window.RQ = window.RQ || {});
  const $id = (i) => document.getElementById(i);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    json(k, d) { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } },
  };

  const META = {
    Sojourner: { short: "Sojourner", yr: "1997", site: "Ares Vallis", img: "assets/hardware/sojourner/overview-nasa.jpg", game: "soj" },
    "Viking 1 Lander": { short: "Viking 1", yr: "1976–1982", site: "Chryse Planitia", img: "assets/hardware/viking-1-lander/overview-PIA03165.jpg", game: "vik" },
    "Spirit Rover": { short: "Spirit", yr: "2004–2010", site: "Gusev Crater", img: "assets/hardware/spirit-rover/overview-PIA05040.jpg", game: "spi" },
    "Opportunity Rover": { short: "Opportunity", yr: "2004–2018", site: "Meridiani Planum", img: "assets/hardware/opportunity-rover/overview-PIA17759.jpg", game: "opp" },
    "InSight Lander": { short: "InSight", yr: "2018–2022", site: "Elysium Planitia", img: "assets/hardware/insight/overview-PIA23203.jpg", game: "ins" },
  };
  const meta = (m) => META[m && m.n] || { short: m ? m.n : "", yr: "", site: "", img: "", game: null };
  const done = (m) => !!interactionState.completedTasks[m.n];
  const stars = () => LS.json("rq.stars", {});
  const starStr = (n) => (n ? "⭐".repeat(n) + "☆".repeat(3 - n) : "");
  const gameOf = (m) => (RQ.games && meta(m).game ? RQ.games[meta(m).game] : null);

  const UI = (RQ.ui = {});

  /* ================================================================ NEXT OBJECTIVE */
  function nextObjective() {
    const DP = RQ.dp;
    if (DP.launchOK()) return { ic: "🚀", txt: "Launch home!", act: () => RQ.cine.playOutro(), key: "launch" };
    if (DP.ready()) return { ic: "🧠", txt: "Final launch check at the ship", act: () => openShip(() => openFinal(0)), key: "final" };
    const i1 = MC.findIndex((m) => done(m) && !m.dn);
    if (i1 >= 0) return { ic: "📦", txt: `Restore ${meta(MC[i1]).short}: collect its modules`, act: () => { window.visitMission(i1); openStageLegacy(); }, key: "legacy", id: meta(MC[i1]).game };
    const mid = DP.list().find((d) => !d.legacy && DP.started(d.id) && !DP.done(d.id));
    if (mid) return { ic: "💾", txt: `Finish ${mid.short}'s datapoint`, act: () => RQ.site.visit(mid.id), key: "site", id: mid.id };
    if (!RQ.W.isMoon && S.rec.some((r, i) => r && !S.inst[i])) return { ic: "🔧", txt: "Install your modules at the ship", act: () => openShip(), key: "install" };
    const id = DP.recommended();
    if (id) { const d = DP.byId(id), g = RQ.games[d.game]; return { ic: d.group === "beacon" ? "📡" : d.group === "moon" ? "🌙" : "🎮", txt: `Visit ${d.short}: ${g ? g.title : "mission"}`, act: () => DP.visit(id), key: "visit", id }; }
    return { ic: "🔧", txt: "Return to the ship", act: () => openShip(), key: "ship" };
  }
  function openShip(then) {
    if (typeof endPres === "function") endPres();
    S.mode = "talk";
    if (typeof exitSub === "function" && RQ.mg && RQ.mg.on) RQ.mg.close(false);
    openRepair();
    if (then) then();
  }
  UI.next = nextObjective;

  /* ================================================================ TOP BAR + MENU */
  function buildBar() {
    if ($id("rq-bar")) return;
    const bar = document.createElement("div");
    bar.id = "rq-bar";
    bar.innerHTML = `
      <div class="rq-chip" id="rq-brand"><a href="index.html" aria-label="Back to world select" title="Worlds">←</a><div class="t"><b>ROVERQUEST</b><small>${esc(RQ.W.label)}</small></div></div>
      <button type="button" class="rq-chip" id="rq-progress" aria-label="Ship repair progress. Open ship status"><div class="lbl"><span>🚀 Ship systems</span><b id="rq-pn">0/${RQ.W.required}</b></div><div class="track">${"<i></i>".repeat(RQ.W.required)}</div></button>
      <button type="button" id="rq-next" aria-label="Next step"><span class="ic" id="rq-next-ic">🎯</span><span><small>Next step</small><span class="txt" id="rq-next-txt">…</span></span></button>
      <div class="rq-chip" id="rq-tools">
        <button type="button" id="rq-missions-btn" title="Choose a mission">🗺<span class="lbl"> Missions</span></button>
        <button type="button" class="icon" id="rq-radar-btn" title="Radar map" aria-label="Toggle radar map">📡</button>
        <button type="button" class="icon" id="rq-menu-btn" title="Settings & more" aria-label="Settings and more" aria-expanded="false" aria-controls="rq-menu">⚙</button>
      </div>`;
    document.body.appendChild(bar);
    const menu = document.createElement("div");
    menu.id = "rq-menu";
    menu.setAttribute("role", "menu");
    document.body.appendChild(menu);
    $id("rq-progress").onclick = () => openShip();
    $id("rq-next").onclick = () => { const o = nextObjective(); o.act(); };
    $id("rq-missions-btn").onclick = () => window.missionPicker();
    $id("rq-radar-btn").onclick = () => { if (typeof toggleMiniMap === "function") toggleMiniMap(); };
    $id("rq-menu-btn").onclick = (e) => { e.stopPropagation(); toggleMenu(); };
    document.addEventListener("pointerdown", (e) => {
      if (menu.classList.contains("open") && !menu.contains(e.target) && e.target.id !== "rq-menu-btn") toggleMenu(false);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { toggleMenu(false); $id("rq-menu-btn").focus(); } });
  }
  function menuHTML() {
    const lvl = typeof LEVELS !== "undefined" && LEVELS[SET.level] ? LEVELS[SET.level].label : "—";
    const auto = LS.get("rq.autohint") !== "0";
    const canOutro = RQ.dp.launchOK(), me = RQ.me;
    return `<h4>Pilot</h4>
      <button type="button" class="it" data-a="profile">👤 ${esc(me.name())} <em>${me.age() ? (me.age() >= 18 ? "18+" : "age " + me.age()) : "set up"} · edit</em></button>
      <h4>Learning</h4>
      <button type="button" class="it" data-a="level">🎓 Explanation level <em>${esc(lvl)}</em></button>
      <button type="button" class="it" data-a="hints">🤖 TARS auto-hints <em>${auto ? "On" : "Off"}</em></button>
      <button type="button" class="it" data-a="report">📊 My learning report</button>
      <button type="button" class="it" data-a="badges">🏅 Badges & archive</button>
      <button type="button" class="it" data-a="archive">🗺 NASA archive (NSSDCA)</button>
      <h4>Display & sound</h4>
      <div class="seg"><button type="button" data-a="fminus" aria-label="Smaller text">A−</button><button type="button" data-a="fplus" aria-label="Larger text">A+</button></div>
      <button type="button" class="it" data-a="motion">🌀 Motion <em>${SET.rm ? "Reduced" : "Full"}</em></button>
      <button type="button" class="it" data-a="sound">🔊 Sound <em>${SET.mute ? "Off" : "On"}</em></button>
      <h4>Story</h4>
      <button type="button" class="it" data-a="intro">🎬 Replay intro</button>
      ${canOutro ? `<button type="button" class="it" data-a="outro">🚀 Replay ending</button>` : ""}
      <button type="button" class="it danger" data-a="reset">⟲ Reset all progress</button>`;
  }
  function toggleMenu(force) {
    const menu = $id("rq-menu"), open = force === undefined ? !menu.classList.contains("open") : force;
    if (open) {
      menu.innerHTML = menuHTML();
      menu.onclick = (e) => {
        const b = e.target.closest("[data-a]");
        if (!b) return;
        const a = b.dataset.a, keep = ["level", "hints", "fminus", "fplus", "motion", "sound"].includes(a);
        ({
          profile: () => RQ.me.ask({ edit: true }, (ok) => ok && window.tarsSay && window.tarsSay(`Got it, <b>${esc(RQ.me.name())}</b>. I'll explain things at <b>${esc(LEVELS[SET.level] ? LEVELS[SET.level].label : "")}</b> level.`, true)),
          level: () => typeof cycleLevel === "function" && cycleLevel(),
          hints: () => LS.set("rq.autohint", LS.get("rq.autohint") === "0" ? "1" : "0"),
          report: () => window.openFinalLearningReport && window.openFinalLearningReport(),
          badges: () => typeof showBadges === "function" && showBadges(),
          archive: () => window.openNSSDCAArchive && window.openNSSDCAArchive(),
          fminus: () => setFont(-10),
          fplus: () => setFont(10),
          motion: () => toggleRM(),
          sound: () => toggleSound(),
          intro: () => RQ.cine.playIntro({ gate: false }),
          outro: () => RQ.cine.playOutro(),
          reset: () => resetProgress(),
        }[a] || (() => {}))();
        if (keep) menu.innerHTML = menuHTML();
        else toggleMenu(false);
      };
    }
    menu.classList.toggle("open", open);
    $id("rq-menu-btn").setAttribute("aria-expanded", open ? "true" : "false");
    if (open) setTimeout(() => { const f = menu.querySelector("button"); f && f.focus(); }, 30);
  }
  function refreshBar() {
    if (!$id("rq-bar")) return;
    const DP = RQ.dp, n = DP.count(), on = Math.min(n, DP.REQUIRED);
    const prog = DP.list().filter((d) => DP.started(d.id) && !DP.done(d.id)).length;
    $id("rq-pn").textContent = on + "/" + DP.REQUIRED + (n > DP.REQUIRED ? " +" + (n - DP.REQUIRED) : "");
    $id("rq-progress").querySelectorAll(".track i").forEach((i, k) => (i.className = k < on ? "f" : k < on + prog ? "r" : ""));
    $id("rq-progress").setAttribute("aria-label", `Ship systems ${on} of ${DP.REQUIRED} online, ${n} of ${DP.TOTAL} datapoints restored. Open ship status`);
    const o = nextObjective();
    $id("rq-next-ic").textContent = o.ic;
    $id("rq-next-txt").textContent = o.txt;
    $id("rq-next").title = o.txt;
    $id("rq-next").classList.toggle("rq-pulse", o.key === "launch");
  }
  UI.refresh = refreshBar;

  /* ================================================================ MISSION PICKER */
  function missionPicker() {
    if (typeof MC === "undefined") return;
    if (typeof endPres === "function") endPres();
    T = Math.max(T, 30);
    const sk = $id("skip");
    if (sk) sk.style.display = "none";
    if (RQ.mg && RQ.mg.on) RQ.mg.close(false);
    S.mode = "talk";
    if (typeof ov === "function") ov("");
    interactionState.stage = "picker";
    const DP = RQ.dp, next = nextObjective(), rec = next.key === "visit" ? next.id : null;
    const n = DP.count(), ready = DP.ready(), name = esc(RQ.me.name());
    let k = 0;
    const card = (d) => {
      const g = RQ.games[d.game], dn = DP.done(d.id), started = DP.started(d.id), st = DP.stars(d.id), num = String(++k).padStart(2, "0");
      const badge = dn ? `<span class="st done">✔ Restored</span>` : started ? `<span class="st rec">▶ In progress</span>` : d.id === rec ? `<span class="st rec">★ Next</span>` : "";
      return `<button type="button" class="rq-mcard ${d.world} ${d.id === rec ? "rec-next" : ""}" onclick="RQ.dp.visit('${d.id}')" aria-label="Visit ${esc(d.short)}${dn ? ", restored" : ""}">
        <div class="ph" style="background-image:url('${d.img}')"><span class="num">${num}</span>${badge}</div>
        <div class="bd"><span class="yr">${esc(d.yr)} · ${esc(d.site)}</span><b>${esc(d.short)}</b><small>🎮 ${g ? esc(g.title) : ""}</small>${st ? `<small>${starStr(st)}</small>` : ""}</div></button>`;
    };
    const list = DP.list(), W = RQ.W, TOT = list.length;
    const groups = W.isMoon
      ? [["moon", "🌙 Apollo-era sites", "Out on this plain · walk up to them"]]
      : [["plain", "🔴 On the plain", "Walk up to these machines"], ["beacon", "📡 Deep-space beacons", "Holograms of NASA craft that explored elsewhere"]];
    const head = ready
      ? `<h2>All systems online, ${name}! 🚀</h2><p>You've restored ${n} of ${TOT} datapoints. Run the <b>final launch check</b> at the ship, or keep exploring. ${n < TOT ? `${TOT - n} more ${TOT - n > 1 ? "are" : "is"} still waiting.` : "You found them all!"}</p>`
      : `<h2>${n ? `Where next, ${name}?` : `Where to first, ${name}?`}</h2><p>Restore <b>any ${DP.REQUIRED} of these ${TOT}</b> ${W.isMoon ? "lunar sites" : "places on Mars"} to bring your ship's systems back online. Each one has a <b>hands-on mini-game</b> and a real NASA discovery.</p>`;
    dl(`<i data-rqctx="picker" hidden></i>
      <div class="top"><span>CHOOSE A PLACE TO EXPLORE · ${W.NAME}</span><span>${n}/${TOT} RESTORED</span></div>
      <div class="rq-pick-head"><div>${head}</div>
        <div class="rq-ring"><b>${Math.min(n, DP.REQUIRED)}/${DP.REQUIRED}</b><span>ship systems<br>online</span></div></div>
      ${ready ? `<div class="bar" style="margin:0 0 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>🧠 Every lesson counts. Prove the ship is safe.</span><button type="button" class="rq-btn primary" onclick="RQ.ui.next().act()">${DP.launchOK() ? "🚀 Launch home" : "🧠 Final launch check"} ▸</button></div>` : ""}
      ${groups.map((g) => { const cards = list.filter((d) => d.group === g[0]).map(card).join(""); return cards ? `<h3 class="rq-world ${g[0] === "plain" ? "" : "moon"}"><span>${g[1]}</span><small>${g[2]}</small></h3><div class="rq-missions">${cards}</div>` : ""; }).join("")}
      <div class="rq-pick-foot"><button type="button" class="rq-btn ghost" onclick="exitSub()">🧭 ${esc(W.explore)}</button>
        <a class="rq-btn ghost" href="${W.other.href}" style="text-decoration:none">${W.other.emoji} Visit ${W.other.id === "moon" ? "the " : ""}${esc(W.other.name)}</a>
        <small style="color:var(--rq-mute);max-width:460px">${W.isMoon
          ? "These Apollo-era machines landed at different sites. Here they share one map so you can visit them all. The real hardware is still on the Moon, untouched."
          : "The Mars machines landed at different sites. Here they share one map so you can visit them all. Dawn, NEAR Shoemaker, Pioneer and Kepler never came to Mars: their beacons project holograms and tell you where each craft really is."}</small></div>`);
  }

  /* ================================================================ MACHINE HUB */
  /* the 4 original machines each host a datapoint with a twin */
  const TWINNOTE = {
    "Viking 1 Lander": "🛰 <b>Viking 2</b>, the model beside this lander, touched down on September 3, 1976 at Utopia Planitia and worked until April 1980. It photographed frost on the ground in winter. Restoring Viking 1 restores the <b>Viking 1 &amp; 2</b> datapoint.",
    "InSight Lander": "❄️ <b>Phoenix</b>, the model nearby, landed on May 25, 2008 near Mars's north pole. Bright chunks it dug up vanished over about 4 days: water ice turning straight into vapour. Its last signal came on November 2, 2008. Restoring InSight restores the <b>Phoenix &amp; InSight</b> datapoint.",
    "Spirit Rover": "🤝 <b>Twin rover:</b> Opportunity is parked right next to Spirit. Restoring either twin restores the <b>Spirit &amp; Opportunity</b> datapoint. Spirit's last contact was on March 22, 2010.",
    "Opportunity Rover": "🤝 <b>Twin rover:</b> Spirit is parked right next to Opportunity. Restoring either twin restores the <b>Spirit &amp; Opportunity</b> datapoint. Opportunity's last contact was on June 10, 2018.",
  };
  function openMachineHub(m) {
    curM = m;
    curI = MC.indexOf(m);
    interactionState.activeMachine = m.n;
    interactionState.stage = "hub";
    if (typeof highlight3DPart === "function") highlight3DPart(m, null);
    try { scans.push({ m, t: 0 }); } catch (e) {}
    if (typeof beep === "function") beep([480, 640, 960], 0.07, "sine");
    const me = meta(m), info = m.interaction, g = gameOf(m);
    const p = (interactionState.inspectedParts[m.n] || new Set()).size, nH = info.hotspots.length;
    const t = done(m), d = !!interactionState.discoveries[m.n], st = stars()[m.n] || 0;
    const nextStep = !t ? 2 : !d ? 3 : !m.dn ? 4 : 0;
    const step = (n, ic, title, sub, fn, isDone, locked) => `<button type="button" class="rq-step ${isDone ? "done" : ""} ${nextStep === n ? "next" : ""} ${locked ? "locked" : ""}" onclick="${fn}" data-step="${n}">
      <span class="n">${isDone ? "✔" : ic}</span><span><b>${title}</b><small>${sub}</small></span><span class="go">${isDone ? "DONE ✓" : nextStep === n ? "START ▸" : "OPEN ▸"}</span></button>`;
    dl(`<i data-rqctx="hub" hidden></i>
      <div class="top"><span>${esc(m.n.toUpperCase())} · ARCHIVED MISSION LINK</span><span style="color:var(--rq-teal)">● CONNECTED</span></div>
      ${window.stageBarHTML(m, "hub")}
      <div class="rq-hub-hero">
        <div class="ph" role="img" aria-label="NASA photo of ${esc(me.short)}" style="background-image:url('${me.img}')" onclick="window.open('${me.img}','_blank')"></div>
        <div><h2>${esc(me.short)}</h2>
          <div class="meta"><span class="rq-tag o">${me.yr}</span><span class="rq-tag">📍 ${esc(me.site)}</span><span class="rq-tag g">${esc(info.role)}</span></div>
          <div class="rq-quote">“${info.greeting}”</div></div>
      </div>
      <div class="rq-steps">
        ${step(1, "⚙️", "Explore the parts", `Tap glowing parts to see what each instrument does · ${p}/${nH} inspected`, "openStageHardware(0)", p >= nH, false)}
        ${step(2, "🎮", g ? "Play: " + esc(g.title) : esc(info.task.title), g ? (st ? `Your best: ${starStr(st)} · play again for 3 stars` : "Hands-on mini-game · unlocks 2 repair modules") : "Hands-on investigation", "openStageTask()", t, false)}
        ${step(3, "🔬", "Discovery + quick sort", "See what NASA really found, then sort facts from ideas", "openStageDiscovery()", d, false)}
        ${step(4, "📦", "Legacy · restore the datapoint", t ? (m.dn ? "Datapoint restored · 2 modules recovered ✓" : "Collect 2 modules to restore this datapoint") : "Win the mini-game first to unlock it", "openStageLegacy()", !!m.dn, !t)}
      </div>
      <div class="rq-extra">
        <button type="button" onclick="startLearn()">📖 Story & quiz</button>
        <button type="button" onclick="RQ.ui.lab()" title="The original step-by-step instrument simulation">🧪 Advanced lab</button>
        <button type="button" onclick="missionPicker()">🗺 All missions</button>
      </div>
      ${TWINNOTE[m.n] ? `<div class="rq-note">${TWINNOTE[m.n]}</div>` : ""}
      <div class="rq-note">📡 <b>What happened to it:</b> ${typeof STATUS !== "undefined" ? STATUS[m.n] || "" : ""} Its voice here is a friendly reconstruction based on NASA mission records.</div>`);
  }
  function stageBarHTML(m, act) {
    const pSet = interactionState.inspectedParts[m.n] || new Set();
    const items = [
      ["hub", "📡", "Hub", true, "openMachineHub(curM)"],
      ["hardware", "⚙️", "Parts", pSet.size > 0, "openStageHardware(0)"],
      ["task", "🎮", "Mini-game", done(m), "openStageTask()"],
      ["discovery", "🔬", "Discovery", !!interactionState.discoveries[m.n], "openStageDiscovery()"],
      ["legacy", "📦", "Legacy", !!m.dn, "openStageLegacy()"],
    ];
    const a = act === "chapters" ? "legacy" : act;
    return `<div class="stbar rq-stbar" role="navigation" aria-label="Mission steps">${items.map((x) => `<button type="button" class="${x[0] === a ? "act" : x[3] ? "dn" : ""}" onclick="${x[4]}" ${x[0] === a ? 'aria-current="step"' : ""}>${x[3] && x[0] !== a && x[0] !== "hub" ? "✔" : x[1]} ${x[2]}</button>`).join("")}</div>`;
  }

  /* ================================================================ MINI-GAME WIRING */
  let prevOpenStageTask = null;
  function openStageTask() {
    const m = curM, g = gameOf(m);
    if (!m || !g || !RQ.mg) return prevOpenStageTask && prevOpenStageTask();
    interactionState.stage = "task";
    if (typeof highlight3DPart === "function") highlight3DPart(m, "roboticArm");
    const go = () => launchGame(m);
    if (window.playerProfile && window.playerProfile.preQuiz && !window.playerProfile.preQuiz[m.n] && window.openAssessmentModal) window.openAssessmentModal(m.n, "pre", go);
    else go();
  }
  function launchGame(m) {
    const id = meta(m).game;
    RQ.mg.open(id, {
      onClose: () => openMachineHub(m),
      onWin: (summary, st) => {
        const all = stars(), prev = all[m.n] || 0;
        if (st > prev) { all[m.n] = st; LS.set("rq.stars", JSON.stringify(all)); }
        curM = m;
        const first = !done(m);
        if (first) {
          taskState = { step: 0, cmds: [], prog: 0, temp: 20, rpm: 0, zoom: 1, focus: 30, seisStep: 0, opp: typeof oppInit === "function" ? oppInit() : {}, done: false, summary: "" };
          if (m.n === "InSight Lander") m.seisDeployed = true;
          completeCollaborativeTask(summary);
        } else if (st > prev) { S.xp += 5 * (st - prev); hud(); }
        winScreen(m, summary, st, first);
      },
    });
  }
  function winScreen(m, summary, st, first) {
    S.mode = "talk";
    interactionState.stage = "won";
    const me = meta(m), g = gameOf(m), hasPost = !!(window.playerProfile && window.playerProfile.postQuiz && window.playerProfile.postQuiz[m.n]);
    dl(`<i data-rqctx="won" hidden></i>
      <div class="top"><span>${esc(m.n.toUpperCase())} · MINI-GAME COMPLETE</span><span style="color:var(--rq-teal)">${starStr(st)}</span></div>
      ${stageBarHTML(m, "task")}
      <div class="rq-hub-hero"><div class="ph" style="background-image:url('${g && g.photo ? g.photo.src : me.img}')"></div>
        <div><h2>🏆 ${g ? esc(g.title) : "Investigation"} complete!</h2>
          <div class="rq-quote">${esc(summary)}</div>
          ${first ? `<p style="margin:10px 0 0">📦 <b>Datapoint unlocked!</b> Collect its 2 modules at the <b>Legacy</b> step to restore it.</p>` : `<p style="margin:10px 0 0;color:var(--rq-mute)">Replays can improve your star rating.</p>`}</div></div>
      <div class="bar" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button type="button" onclick="RQ.ui.replay()">↺ Play again</button>
        ${!hasPost ? `<button type="button" onclick="openStageDiscovery()">Skip to discovery</button><button type="button" onclick="openAssessmentModal('${esc(m.n)}','post',()=>openStageDiscovery())">🧠 1 quick question ▸</button>` : `<button type="button" onclick="openStageDiscovery()">🔬 See the real discovery ▸</button>`}
      </div>`);
    const nm = esc(RQ.me.name());
    if (window.tarsSay) window.tarsSay(first ? RQ.me.t({ explorer: `Awesome, ${nm}! 🎉 You solved it just like the real <b>${esc(me.short)}</b> team. Now let's see what NASA found!`, scientist: `Nice work, ${nm}! That's exactly the kind of problem the real <b>${esc(me.short)}</b> team solved. Next: see what NASA actually discovered.`, engineer: `Solid run, ${nm}. Same constraint the <b>${esc(me.short)}</b> engineers designed around. Check the discovery data next.` }) : `${st === 3 ? `Three stars, ${nm}. Show-off. 😎` : "Good run!"}`, true);
  }
  UI.replay = () => curM && launchGame(curM);
  UI.lab = () => { if (prevOpenStageTask) prevOpenStageTask(); };

  /* ================================================================ DISCOVERY SORTER */
  function wrapDiscovery() {
    const prev = window.openStageDiscovery;
    window.openStageDiscovery = function () {
      prev.apply(this, arguments);
      const html = RQ.sorter && RQ.sorter.html(curM && curM.n);
      if (!html) return;
      const d = $id("dlg"), anchor = d.querySelector(".stbar");
      const w = document.createElement("div");
      w.innerHTML = html;
      const node = w.firstElementChild;
      if (anchor && anchor.nextSibling) d.insertBefore(node, anchor.nextSibling);
      else d.insertBefore(node, d.firstChild);
      RQ.sorter.mount();
    };
  }

  /* ================================================================ DIALOG CLOSE BUTTON */
  function watchDialog() {
    const d = $id("dlg");
    if (!d) return;
    const fix = () => {
      if (d.style.display === "none" || d.querySelector(":scope > .rq-close-wrap")) return;
      const w = document.createElement("div");
      w.className = "rq-close-wrap";
      w.innerHTML = '<button type="button" aria-label="Close panel and return to the ' + RQ.W.name + '" title="Close (Esc)" onclick="exitSub()">✕</button>';
      d.insertBefore(w, d.firstChild);
    };
    new MutationObserver(fix).observe(d, { childList: true });
    fix();
  }

  /* ================================================================ TARS HINT ENGINE */
  const HINT_GAP = 15000;
  const Hn = (RQ.hints = { last: Date.now(), lastHint: 0, paused: false, lvl: {}, acts: [] });
  Hn.bump = () => { Hn.last = Date.now(); };
  Hn.pause = (v) => { Hn.paused = !!v; Hn.bump(); };
  function ctx() {
    if (RQ.cine && RQ.cine.active) return null;
    if (RQ.mg && RQ.mg.on) return "mg";
    const vis = (id) => { const e = $id(id); return e && getComputedStyle(e).display !== "none"; };
    if (vis("bp") || vis("archive-modal") || vis("profile-modal")) return null;
    if ($id("rq-profile") && $id("rq-profile").classList.contains("on")) return null;
    const d = $id("dlg");
    if (d && d.style.display === "block") {
      if (d.querySelector("#v4-assess-opts")) return "assess";
      const mk = d.querySelector("[data-rqctx]");
      if (mk) return mk.dataset.rqctx;
      return interactionState.stage || "panel";
    }
    if (S.mode === "play") return "explore";
    return null;
  }
  function pulse(sel) {
    const e = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!e) return;
    e.classList.add("rq-pulse");
    setTimeout(() => e.classList.remove("rq-pulse"), 4500);
  }
  function hintFor(c, lv) {
    const o = nextObjective(), m = curM, short = m ? meta(m).short : "";
    switch (c) {
      case "explore":
        if (lv % 2 === 0) return { msg: `Not sure where to go? Your next step: <b>${esc(o.txt)}</b>.`, acts: [["Take me there", o.act]], pulse: "#rq-next" };
        return { msg: "Move with <b>WASD</b>, the arrow keys or the on-screen pad. <b>Drag</b> to look around. Walk up to a machine and press <b>E</b> (or tap it).", acts: [["Pick a mission", () => window.missionPicker()]], pulse: "#rq-missions-btn" };
      case "picker":
        if (o.key === "visit") { const d = RQ.dp.byId(o.id); return { msg: `Tap any card. You only need <b>${RQ.dp.REQUIRED} of the ${RQ.dp.TOTAL}</b>, so pick the ones that look fun! Not sure? Try <b>${esc(d.short)}</b>. It's marked ★.`, acts: [["Go to " + d.short, o.act]], pulse: ".rq-mcard.rec-next" }; }
        return { msg: `Your next step: <b>${esc(o.txt)}</b>.`, acts: [["Let's go", o.act]], pulse: "#rq-next" };
      case "hub": {
        if (!m) return null;
        if (!done(m)) return { msg: `Tap <b>🎮 Play</b> for ${esc(short)}'s mini-game. Winning it unlocks <b>2 repair modules</b>.`, acts: [["Start mini-game", () => window.openStageTask()]], pulse: '.rq-step[data-step="2"]' };
        if (!interactionState.discoveries[m.n]) return { msg: `Great job on the mini-game! Now open <b>🔬 Discovery</b> to see what the real ${esc(short)} found.`, acts: [["Open discovery", () => window.openStageDiscovery()]], pulse: '.rq-step[data-step="3"]' };
        if (!m.dn) return { msg: "Open <b>📦 Legacy</b> to collect 2 modules and restore this datapoint.", acts: [["Restore it", () => openStageLegacy()]], pulse: '.rq-step[data-step="4"]' };
        return { msg: `${esc(short)} is complete! Next: <b>${esc(o.txt)}</b>.`, acts: [["Let's go", o.act]], pulse: "#rq-next" };
      }
      case "hardware":
        return { msg: "Tap each part button to learn what it does. The matching part glows on the 3D machine. When you're ready, tap the orange button to continue.", acts: [["Back to hub", () => openMachineHub(curM)]], pulse: "#dlg .bar > button:last-child" };
      case "discovery":
        return document.querySelector("#rq-sort-card") && !document.querySelector("#rq-sort .bins button:disabled")
          ? { msg: "Sorting tip: if an <b>instrument measured or saw</b> it, it's an <b>observation</b>. If it <b>explains why</b> or uses words like 'may', 'probably' or 'suggests', it's an <b>interpretation</b>.", acts: [], pulse: "#rq-sort-card" }
          : { msg: "Read the discovery card, then head to <b>📦 Legacy</b> to restore this datapoint.", acts: [["Go to Legacy", () => openStageLegacy()]], pulse: null };
      case "legacy":
      case "chapters":
        return { msg: `Use the buttons at the bottom to move through the story. Next: <b>${esc(o.txt)}</b>.`, acts: [["Let's go", o.act]], pulse: "#dlg .bar > button:last-child" };
      case "won":
        return { msg: "Answer one quick question (it's not graded), or jump to the discovery.", acts: [], pulse: "#dlg .bar > button:last-child" };
      case "assess":
        return { msg: "Pick the answer you think fits best. It isn't graded. It helps show how much you learn. Want me to cross out a wrong answer?", acts: [["Cross one out", () => window.tarsEliminateWrong && window.tarsEliminateWrong()]], pulse: "#v4-assess-opts" };
      case "repair": {
        const DP = RQ.dp, n = DP.count();
        if (DP.launchOK()) return { msg: `The ship is ready, ${esc(RQ.me.name())}. Press <b>🚀 Launch home</b>!`, acts: [["Launch!", () => RQ.cine.playOutro()]], pulse: ".rq-launch button" };
        if (DP.ready()) return { msg: "All 5 systems are online! Start the <b>final launch check</b> to prove the ship is safe.", acts: [["Start final check", () => openFinal(0)]], pulse: null };
        if (!RQ.W.isMoon && S.rec.some((r, i) => r && !S.inst[i])) return { msg: "Tap <b>Install</b> to fit your recovered Mars modules into the ship.", acts: [], pulse: "#ib" };
        return { msg: `${DP.REQUIRED - n} more datapoint${DP.REQUIRED - n > 1 ? "s" : ""} to go. Tap any tile to visit it. Next idea: <b>${esc(o.txt)}</b>.`, acts: [["Let's go", o.act]], pulse: null };
      }
      case "final":
        return { msg: "Each question uses one of <b>your</b> datapoints. Think back to that mini-game. Want me to cross out a wrong answer?", acts: [["Cross one out", () => window.tarsEliminateWrong && window.tarsEliminateWrong()]], pulse: null };
      case "task":
        return { lab: true };
      default:
        if (/^site/.test(c) && RQ.site && RQ.site.hintFor) { const mh = RQ.site.hintFor(c); if (mh) return mh; }
        return { msg: "Use the buttons in the panel to continue, or press ✕ to go back to " + (RQ.W.isMoon ? "the Moon" : "Mars") + ".", acts: [["Next step", o.act]], pulse: "#rq-next" };
    }
  }
  function give(manual) {
    const c = ctx();
    if (!c) return false;
    if (c === "mg") {
      const mg = RQ.mg;
      const h = mg.currentHint();
      if (!h) return false;
      say(`<span class="rq-hint-lvl">TIP ${Math.min(mg.hintLevel + 1, 4)}</span> ${h}`, []);
      if (mg.state === "play") mg.hintLevel++;
      return true;
    }
    const lv = Hn.lvl[c] || 0;
    const h = hintFor(c, lv);
    if (!h) return false;
    if (h.lab) { if (prevHint) prevHint(); return true; }
    Hn.lvl[c] = lv + 1;
    say(h.msg, h.acts || []);
    if (h.pulse) pulse(h.pulse);
    return true;
  }
  function say(msg, acts) {
    if (!window.tarsSay) return;
    Hn.acts = acts.map((a) => a[1]);
    const btns = acts.length ? `<div class="tars-actions" style="margin-top:8px">${acts.map((a, i) => `<button type="button" class="rq-tb ${i === 0 ? "primary" : ""}" onclick="RQ.hints.act(${i})">${esc(a[0])}</button>`).join("")}</div>` : "";
    window.tarsSay(`<b>TARS:</b> ${msg}${btns}`, true);
    const w = $id("tars-widget");
    if (w) { w.classList.remove("rq-alert"); void w.offsetWidth; w.classList.add("rq-alert"); setTimeout(() => w.classList.remove("rq-alert"), 2600); }
    Hn.lastHint = Date.now();
    Hn.bump();
    try { window.playerProfile.hintsUsed = (window.playerProfile.hintsUsed || 0) + 1; } catch (e) {}
  }
  Hn.act = (i) => { const f = Hn.acts[i]; if (f) { if (window.toggleTarsBubble) window.toggleTarsBubble(true); f(); } };
  Hn.giveNow = (manual) => { if (!give(manual)) say("Everything's on track. Keep exploring! I'll pipe up if you look stuck.", []); };
  Hn.onGameFail = (n) => { if ((n === 2 || n === 4 || n === 7) && Date.now() - Hn.lastHint > 4000) give(false); };
  let prevHint = null;
  function hintLoop() {
    setInterval(() => {
      if (Hn.paused || LS.get("rq.autohint") === "0" || document.hidden) return;
      const c = ctx();
      if (!c) return;
      const idle = Date.now() - Hn.last, thr = (c === "mg" ? 12000 : c === "explore" ? 20000 : 24000) * (RQ.me ? RQ.me.hintMul() : 1);
      if (idle > thr && Date.now() - Hn.lastHint > HINT_GAP) give(false);
    }, 1000);
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, Hn.bump, { passive: true, capture: true }));
  }

  /* ================================================================ BOOT */
  let booted = false;
  RQ.boot = function () {
    if (booted) return;
    booted = true;
    try {
      buildBar();
      prevOpenStageTask = window.openStageTask;
      prevHint = window.tarsGiveHint;
      window.missionPicker = missionPicker;
      window.openMachineHub = openMachineHub;
      window.stageBarHTML = stageBarHTML;
      window.openStageTask = openStageTask;
      window.tarsGiveHint = () => Hn.giveNow(true);
      const prevSay = window.tarsSay;
      let sayT = 0;
      if (prevSay) window.tarsSay = function (html, autoShow) {
        prevSay.apply(this, arguments);
        clearTimeout(sayT);
        if (autoShow !== false) sayT = setTimeout(() => {
          const b = $id("tars-bubble");
          if (b && !b.matches(":hover") && !b.contains(document.activeElement) && window.toggleTarsBubble) window.toggleTarsBubble(true);
        }, 11000);
      };
      wrapDiscovery();
      if (RQ.dp) RQ.dp.install();
      const prevHud = window.hud;
      window.hud = function () { const r = prevHud.apply(this, arguments); refreshBar(); return r; };
      watchDialog();
      hintLoop();
      refreshBar();
      setInterval(refreshBar, 1500);
      const nav = $id("nav");
      if (nav) nav.style.setProperty("display", "none", "important");
      // Tidy the TARS widget: Hint first, fewer buttons
      const acts = document.querySelector("#tars-bubble .tars-actions");
      if (acts) {
        acts.innerHTML = `<button type="button" class="rq-tb primary" onclick="window.tarsGiveHint()">💡 I'm stuck, give me a hint</button><button type="button" class="rq-tb" onclick="RQ.ui.next().act()">🎯 Next step</button>`;
      }
    } catch (e) { console.error("[RQ boot]", e); }
    const qp = new URLSearchParams(location.search).get("intro");
    const hasSave = !RQ.W.isMoon && (S.xp > 0 || S.rec.some(Boolean) || Object.keys(interactionState.completedTasks).length > 0);
    const play = qp === "1" || (qp !== "0" && !LS.get(RQ.W.key("rq.introSeen")) && !hasSave);
    const ME = RQ.me;
    if (play && RQ.cine) {
      RQ.cine.playIntro({ gate: true });
      // First flight: ask name + age, then the "Let's go" click starts the intro (and unlocks audio).
      if (ME && !ME.has()) {
        RQ.cine.hideGate(true);
        ME.ask({}, () => RQ.cine.startFromGate());
      }
    } else {
      if (RQ.cine) RQ.cine.landShip();
      impacted = true;
      try { SHIP2.userData.door.rotation.x = 1.82; } catch (e) {}
      missionPicker();
      const greet = () => {
        missionPicker();
        setTimeout(() => window.tarsSay && window.tarsSay(`Welcome back, <b>${esc(ME.name())}</b>! ${RQ.dp.count()}/${RQ.dp.TOTAL} ${RQ.W.isMoon ? "lunar sites" : "places"} restored. Next step: <b>${esc(nextObjective().txt)}</b>. Tap me if you get stuck.`, false), 400);
      };
      if (ME && !ME.has()) ME.ask({}, greet);
      else greet();
    }
  };
})();
