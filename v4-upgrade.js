/* ============================================================================
   BEYOND THE SILENT MACHINES — V4 UPGRADE MODULE (v4-upgrade.js)
   Addresses Judging Evaluation P0/P1/P2 + Player Personalization + TARS Assistant
   ============================================================================ */

(function () {
  "use strict";

  /* ---------- 1. STYLES FOR TARS, PROFILE MODAL, ARCHIVE & SIMULATIONS ---------- */
  const v4Style = document.createElement("style");
  v4Style.textContent = `
    /* TARS Floating Companion Widget */
    #tars-widget {
      position: fixed;
      left: 14px;
      bottom: 14px;
      z-index: 25;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      max-width: min(420px, calc(100vw - 28px));
      font-family: inherit;
      pointer-events: none;
    }
    #tars-monolith {
      pointer-events: auto;
      width: 54px;
      height: 78px;
      background: linear-gradient(145deg, #2b313d 0%, #141820 60%, #0d1016 100%);
      border: 1.5px solid #ff9b5e;
      border-radius: 4px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.8), 0 0 12px rgba(255,155,94,0.28);
      cursor: pointer;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      padding: 4px;
      position: relative;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    #tars-monolith:hover {
      transform: translateY(-3px) rotate(-2deg);
      border-color: #4cd98a;
    }
    .tars-slab {
      background: linear-gradient(180deg, #3a4252 0%, #1c222d 50%, #2a303c 100%);
      border: 1px solid #556070;
      border-radius: 1px;
      position: relative;
    }
    .tars-led {
      position: absolute;
      top: 10px;
      left: 2px;
      right: 2px;
      height: 6px;
      background: #4cd98a;
      box-shadow: 0 0 6px #4cd98a;
      animation: tarsPulse 2.4s infinite ease-in-out;
    }
    @keyframes tarsPulse {
      0%, 100% { opacity: 0.45; }
      50% { opacity: 1; }
    }
    #tars-label {
      position: absolute;
      bottom: 3px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      font-weight: bold;
      letter-spacing: 0.12em;
      color: #ff9b5e;
    }
    #tars-bubble {
      pointer-events: auto;
      background: rgba(10, 15, 24, 0.96);
      border: 1px solid rgba(76, 217, 138, 0.65);
      border-radius: 10px 10px 10px 2px;
      padding: 10px 14px;
      color: #e9eef7;
      font-size: 12.5px;
      line-height: 1.45;
      box-shadow: 0 8px 28px rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
    }
    #tars-bubble.minimized { display: none; }
    #tars-hdr {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      letter-spacing: 0.08em;
      color: #4cd98a;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .tars-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .tars-btn {
      font-size: 11px !important;
      padding: 4px 9px !important;
      background: #172636 !important;
      border: 1px solid #4cd98a88 !important;
      color: #dffbe9 !important;
      border-radius: 4px;
      cursor: pointer;
    }
    .tars-btn:hover { background: #213c52 !important; border-color: #4cd98a !important; }

    /* Personalization Onboarding Modal */
    #profile-modal, #archive-modal {
      position: fixed;
      inset: 0;
      background: rgba(5, 8, 14, 0.88);
      backdrop-filter: blur(10px);
      z-index: 55;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .v4-card {
      background: rgba(12, 17, 26, 0.98);
      border: 1px solid #ff9b5e88;
      border-radius: 12px;
      max-width: 760px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 20px 24px;
      color: #eef3fb;
      box-shadow: 0 16px 50px rgba(0,0,0,0.9);
    }
    .v4-input {
      background: #141c2b;
      border: 1px solid #ff9b5e66;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
    }
    .v4-grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 12px 0;
    }
    @media (max-width: 600px) {
      .v4-grid2 { grid-template-columns: 1fr; }
      #tars-widget { bottom: 180px; }
    }
    .nssdca-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 10px;
    }
    .nssdca-table th, .nssdca-table td {
      border: 1px solid #2b384e;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    .nssdca-table th { background: #182234; color: #ff9b5e; }
    .opt.tars-elim {
      opacity: 0.35 !important;
      text-decoration: line-through;
    }
  `;
  document.head.appendChild(v4Style);

  /* ---------- 2. PLAYER PROFILE & AGE-ADAPTIVE TIER SYSTEM ---------- */
  const PROFILE_KEY = "btsm_v4_profile";
  let storedProfile = null;
  try { storedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch {}
  window.playerProfile = {
    name: "",
    age: null,
    tier: "scientist", // 'explorer' (K-5, <=10), 'scientist' (6-9, 11-14), 'engineer' (10-12, 15+)
    humor: 75,
    honesty: 90,
    preQuiz: {},       // { [machineName]: { score, total, answers } }
    postQuiz: {},      // { [machineName]: { score, total, answers } }
    hintsUsed: 0
  };

  if (storedProfile && typeof storedProfile === "object") Object.assign(window.playerProfile, storedProfile);
  window.playerProfile.name = String(window.playerProfile.name || "").replace(/[<>&"']/g, "");
  window.playerProfile.preQuiz ||= {}; window.playerProfile.postQuiz ||= {};

  function saveProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(window.playerProfile)); } catch (e) {}
  }

  function ageToTier(age) {
    const a = Number(age) || 12;
    if (a <= 10) return "explorer";
    if (a <= 14) return "scientist";
    return "engineer";
  }

  function tierLabel(tier) {
    if (tier === "explorer") return "Explorer (Grades K–5)";
    if (tier === "scientist") return "Scientist (Grades 6–9)";
    return "Engineer (Grades 10–12+)";
  }

  window.getExplorerName = function () {
    return (window.playerProfile && window.playerProfile.name) ? window.playerProfile.name : "Explorer";
  };

  /* ---------- 3. TARS ASSISTANT (INTERSTELLAR-INSPIRED COMPANION & HINT ENGINE) ---------- */
  const TARS_HINTS = {
    "Sojourner": {
      task: [
        "TARS [Honesty 90%]: Before reading elemental spectra with the APXS, check what coats almost every rock on Mars — windblown dust.",
        "TARS [Telemetry]: Press the APXS sensor head within 2 cm of 'Barnacle Bill' or 'Yogi' and integrate for 10 hours. Loose drift soil only tells you global dust composition, not volcanic rock history.",
        "TARS [Solution Path]: 1) Select 'Barnacle Bill (Andesitic Rock)' 2) Deploy APXS contact mechanism 3) Run 10-hour Alpha/Proton/X-ray integration 4) Conclude high silica + low Mg/Fe indicates evolved crustal rock."
      ],
      hardware: "TARS: Click Sojourner's 6-wheel Rocker-Bogie suspension, GaAs solar panel, stereo cameras, or the rear APXS deployment mechanism."
    },
    "Viking 1 Lander": {
      task: [
        "TARS [Honesty 90%]: Ultraviolet light sterilizes the top millimeter of Martian dust. If you scoop only the surface crust, any organics would already be photolytically destroyed.",
        "TARS [Telemetry]: Trench 10–15 cm into the subsurface, deliver the sample to the GCMS oven, and ramp from 200°C (water/CO2 release) to 500°C.",
        "TARS [Solution Path]: Remember Phoenix's 2008 discovery — Martian soil contains perchlorate salts (ClO4-). At 500°C, perchlorates oxidize organic molecules into CO2 and chlorinated methanes, making Viking's null GCMS result ambiguous."
      ],
      hardware: "TARS: Inspect Viking 1's 3-meter retractable surface sampler boom, dual SNAP-19 RTG covers, facsimile cameras, and GCMS biology deck."
    },
    "Spirit Rover": {
      task: [
        "TARS [Humor 75%]: Spirit's right-front wheel actuator failed in 2006. Turns out dragging a dead wheel backwards excavated buried subsurface soil.",
        "TARS [Telemetry]: In May 2007 near Home Plate, the dragged wheel exposed bright white silica-rich soil (~91 wt% opaline silica, Squyres et al. 2008). Compare wheel-trench soil against dusty basalt.",
        "TARS [Solution Path]: Concentrated amorphous opaline silica (SiO2·nH2O) forms around hot volcanic springs or acidic steam vents (fumaroles) — supporting past hydrothermal activity, though not proof of life."
      ],
      hardware: "TARS: Check Spirit's locked right-front wheel, Pancam/Mini-TES mast, solar wings, and the IDD turret carrying the Rock Abrasion Tool (RAT)."
    },
    "Opportunity Rover": {
      task: [
        "TARS [Telemetry]: To test whether 'blueberries' grew inside the rock as groundwater concretions, you need an undisturbed layered rock outcrop, not loose windblown sand.",
        "TARS [Instrument Check]: Open the Microscopic Imager dust cover first, then set arm standoff near 68 mm (fixed focus, 31 µm/px). Next, run a 12-hour Mössbauer integration on both matrix and spherules.",
        "TARS [Solution Path]: Embedded, uniform spherules enriched in hematite (Fe2O3) inside a jarosite-bearing sulfate outcrop support past water alteration of Meridiani Planum."
      ],
      hardware: "TARS: Opportunity has 8 articulated hotspots — inspect the MI, Mössbauer, APXS, and RAT on the IDD turret, plus Pancam and Mini-TES."
    },
    "InSight Lander": {
      task: [
        "TARS [Telemetry]: SEIS cannot record clean marsquakes while sitting on the lander deck or exposed to Martian wind and day-night thermal swings.",
        "TARS [Seismology]: First use the 1.8 m IDA arm to place SEIS on Elysium Planitia soil, then lower the Wind and Thermal Shield (WTS). Next, mark the fast P-wave arrival and slower S-wave arrival on the waveform.",
        "TARS [Solution Path]: P-S arrival lag gives epicentral distance. Because shear (S) waves cannot travel through liquid and cast a shadow zone beyond ~105°, Mars must have a liquid iron-alloy core (size depends on the interior model)."
      ],
      hardware: "TARS: Inspect InSight's 1.8-meter Instrument Deployment Arm (IDA), the copper-colored hexagonal SEIS + white WTS dome, HP3 mole, and dual circular solar arrays."
    }
  };

  let tarsHintLevel = 0;

  function buildTarsWidget() {
    if (document.getElementById("tars-widget")) return;
    const w = document.createElement("div");
    w.id = "tars-widget";
    w.innerHTML = `
      <button type="button" id="tars-monolith" aria-label="Toggle TARS Tactical Assistant" title="Click TARS for Mission Hints & Telemetry" onclick="window.toggleTarsBubble()" style="font:inherit;color:inherit">
        <div class="tars-slab"><div class="tars-led"></div></div>
        <div class="tars-slab"><div class="tars-led" style="animation-delay:0.4s"></div></div>
        <div class="tars-slab"><div class="tars-led" style="animation-delay:0.8s"></div></div>
        <div class="tars-slab"><div class="tars-led" style="animation-delay:1.2s"></div></div>
        <div id="tars-label">TARS</div>
      </button>
      <div id="tars-bubble">
        <div id="tars-hdr">
          <span>🤖 TARS · CASE-LINK TACTICAL ASSISTANT</span>
          <button type="button" aria-label="Minimize TARS assistant" style="cursor:pointer;color:#9fb4c9;background:none;border:0;padding:2px 8px;min-height:28px" onclick="window.toggleTarsBubble(true)">[–]</button>
        </div>
        <div id="tars-msg">Systems online, <b>${window.getExplorerName()}</b>. Humor setting at 75%, Honesty at 90%. Click <b>Hint</b> anytime during a scientific investigation or quiz.</div>
        <div class="tars-actions">
          <button type="button" class="tars-btn" onclick="window.tarsGiveHint()">💡 Request Hint</button>
          <button type="button" class="tars-btn" onclick="window.tarsEliminateWrong()">🎯 Narrow Options</button>
          <button type="button" class="tars-btn" onclick="window.openNSSDCAArchive()">🗺️ NASA Archive & Map</button>
          <button type="button" class="tars-btn" onclick="window.openProfileModal()">👤 ${window.getExplorerName()}</button>
        </div>
      </div>
    `;
    document.body.appendChild(w);
  }

  window.toggleTarsBubble = function (forceHide) {
    const b = document.getElementById("tars-bubble");
    if (!b) return;
    if (forceHide === true) b.classList.add("minimized");
    else b.classList.toggle("minimized");
  };

  window.tarsSay = function (html, autoShow = true) {
    const m = document.getElementById("tars-msg");
    const b = document.getElementById("tars-bubble");
    if (m) m.innerHTML = html;
    if (b && autoShow) b.classList.remove("minimized");
    if (typeof beep === "function") beep([520, 740], 0.05, "triangle");
  };

  window.tarsGiveHint = function () {
    const name = window.getExplorerName();
    const activeM = (typeof curM !== "undefined" && curM && curM.n) || (typeof inspM !== "undefined" && inspM && inspM.n) || null;
    const stg = (typeof interactionState !== "undefined" && interactionState.stage) || "idle";
    window.playerProfile.hintsUsed = (window.playerProfile.hintsUsed || 0) + 1;
    saveProfile();

    if (!activeM) {
      window.tarsSay(`<b>${name}</b>, walk up to any of the five silent NASA machines on the ridge (press <b>E</b> or click a machine) to establish an archived telemetry link. I recommend starting with <b>Opportunity</b> or <b>Sojourner</b>.`);
      return;
    }

    const bank = TARS_HINTS[activeM];
    if (!bank) return;

    if (stg === "task") {
      const msg = bank.task[tarsHintLevel % bank.task.length];
      tarsHintLevel++;
      window.tarsSay(`<b>[Hint ${((tarsHintLevel - 1) % bank.task.length) + 1}/3 for ${activeM}]</b><br>${msg}`);
    } else if (stg === "hardware") {
      window.tarsSay(bank.hardware);
    } else {
      window.tarsSay(`<b>${name}</b>, on <b>${activeM}</b>: complete the <b>Pre-Mission Check</b>, inspect the <b>3D Hardware Hotspots</b> (Stage 2), run the <b>Scientific Investigation</b> (Stage 3), and verify your learning in the <b>Post-Mission Assessment</b>.`);
    }
  };

  window.tarsEliminateWrong = function () {
    const opts = Array.from(document.querySelectorAll("#dlg .opt:not(:disabled):not(.tars-elim)"));
    if (opts.length <= 2) {
      window.tarsSay(`TARS: I've already narrowed the field as far as my 90% honesty setting allows, <b>${window.getExplorerName()}</b>. Make the call!`);
      return;
    }
    // Check if we are in a chapter question or final quiz
    let correctIdx = -1;
    try {
      if (typeof interactionState !== "undefined" && interactionState.stage === "chapters" && typeof CH !== "undefined" && typeof ch !== "undefined" && CH[ch] && CH[ch][3]) {
        correctIdx = CH[ch][3].a;
      } else if (typeof Q !== "undefined" && typeof qi !== "undefined" && Q[qi]) {
        correctIdx = Q[qi][4];
      }
    } catch (e) {}

    const allButtons = Array.from(document.querySelectorAll("#dlg .opt"));
    const candidates = allButtons.filter((btn, idx) => idx !== correctIdx && !btn.classList.contains("tars-elim") && !btn.disabled);
    if (candidates.length > 0) {
      const target = candidates[0];
      target.classList.add("tars-elim");
      window.tarsSay(`TARS [Tactical Filter]: I've crossed out an implausible option for you, <b>${window.getExplorerName()}</b>. Focus on the remaining physical evidence.`);
    } else {
      window.tarsGiveHint();
    }
  };

  /* ---------- 4. PERSONALIZATION MODAL (NAME & AGE AT START) ---------- */
  function buildProfileModal() {
    if (document.getElementById("profile-modal")) return;
    const m = document.createElement("div");
    m.id = "profile-modal";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.setAttribute("aria-label", "Explorer calibration profile");
    m.innerHTML = `
      <div class="v4-card" style="max-width:540px">
        <div class="top">
          <span>🚀 EXPLORER CALIBRATION · OPTIONAL SETTINGS</span>
          <button type="button" onclick="document.getElementById('profile-modal').style.display='none'" style="padding:3px 10px">✕ Close</button>
        </div>
        <h2 style="margin:8px 0 4px;color:#ff9b5e">Beyond the Silent Machines</h2>
        <p style="font-size:13px;color:#b8c7dc;margin:4px 0 12px">
          Optionally set a display name and explanation depth level. Your setting stays in this browser only.
        </p>
        <div class="v4-grid2">
          <div>
            <label for="v4-name-in" style="font-size:12px;color:#ff9b5e;display:block;margin-bottom:4px"><b>Explorer Name (Optional)</b></label>
            <input id="v4-name-in" class="v4-input" type="text" placeholder="e.g., Explorer" maxlength="32" value="${window.playerProfile.name || ""}" />
          </div>
          <div>
            <label for="v4-age-in" style="font-size:12px;color:#ff9b5e;display:block;margin-bottom:4px"><b>Target Age Calibration</b></label>
            <input id="v4-age-in" class="v4-input" type="number" min="6" max="99" placeholder="e.g., 13" value="${window.playerProfile.age || 13}" oninput="window.previewAgeTier(this.value)" />
          </div>
        </div>
        <div id="v4-tier-preview" class="tag-note" style="margin:8px 0">
          🎓 <b>Calibrated Science Depth:</b> Scientist (Grades 6–9) — balances engineering mechanisms with planetary geology.
        </div>
        <div class="bar" style="margin-top:14px">
          <span style="font-size:11px;color:#8fa3bf">Saved locally in browser</span>
          <button type="button" onclick="window.saveProfileAndLaunch()" style="background:#ff9b5e;color:#111;font-weight:bold;padding:8px 18px">Save Settings ▸</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
  }

  window.previewAgeTier = function (ageVal) {
    const tier = ageToTier(ageVal);
    const el = document.getElementById("v4-tier-preview");
    if (!el) return;
    const desc = {
      explorer: "<b>Explorer (Grades K–5 · Ages ≤10):</b> Clear analogies, foundational hardware concepts, and guided TARS hints.",
      scientist: "<b>Scientist (Grades 6–9 · Ages 11–14):</b> Connects instrument operation to geological and chemical evidence.",
      engineer: "<b>Engineer (Grades 10–12+ · Ages 15+):</b> Full quantitative telemetry (APXS keV spectra, GCMS pyrolysis, Mössbauer Fe²⁺/Fe³⁺, P/S wave shadow zones)."
    };
    el.innerHTML = `🎓 <b>Calibrated Science Depth:</b> ${desc[tier]}`;
  };

  window.openProfileModal = function () {
    buildProfileModal();
    const m = document.getElementById("profile-modal");
    if (m) {
      m.style.display = "flex";
      window.previewAgeTier(document.getElementById("v4-age-in").value || 14);
    }
  };

  window.saveProfileAndLaunch = function () {
    const nameIn = (document.getElementById("v4-name-in").value || "").trim() || "Explorer";
    const ageIn = Math.max(5, Math.min(99, parseInt(document.getElementById("v4-age-in").value, 10) || 14));
    const tier = ageToTier(ageIn);
    window.playerProfile.name = nameIn.replace(/[<>&"']/g, "");
    window.playerProfile.age = ageIn;
    window.playerProfile.tier = tier;
    saveProfile();

    // Sync with existing V3 explanation level if present
    if (typeof window.interactionState !== "undefined") {
      window.interactionState.level = tier === "explorer" ? "simple" : tier === "scientist" ? "mid" : "adv";
    }
    const m = document.getElementById("profile-modal");
    if (m) m.style.display = "none";

    // Update Intro Messages with personalized astronaut name
    if (typeof MSG !== "undefined" && Array.isArray(MSG)) {
      MSG[0] = `Welcome aboard, Astronaut <b>${nameIn}</b>! Five historic NASA Mars machines have fallen silent after completing groundbreaking missions. Their scientific discoveries hold the key to repairing our damaged ship.`;
      MSG[1] = `I'm <b>TARS</b>, your tactical robot companion (calibrated to <b>${tierLabel(tier)}</b> for age ${ageIn}). Operate each machine's real instruments, verify what you learn, and recover all 10 engineering blueprints!`;
    }
    if (typeof pmi !== "undefined") pmi = -1; // force intro bubble refresh
    window.tarsSay(`Credentials verified: Astronaut <b>${nameIn}</b> (Age ${ageIn} · <b>${tierLabel(tier)}</b>). Ready for Mars atmospheric entry!`);
  };

  /* ---------- 5. FOUR DISTINCTIVE 3D MACHINE BUILDERS (REPLACING GENERIC MODELS) ---------- */
  // Uses existing V3 helpers: THREE, mat, mesh, tagPart, addHoloAndBeacon, M

  window.buildSojourner = function (k = 1.65) {
    const g = new THREE.Group(), parts = {};
    g.name = "Sojourner";
    const gold = mat(0xd4a843, 0.35, 0.75),
      alu = mat(0xcfd4dc, 0.4, 0.75),
      dark = mat(0x20242a, 0.8, 0.25),
      cell = mat(0x162955, 0.25, 0.65);

    // Flat microwave-sized Warm Electronics Box (65 x 48 x 30 cm proportions)
    const bodyGrp = new THREE.Group();
    mesh(new THREE.BoxGeometry(0.95 * k, 0.26 * k, 1.25 * k), gold, 0, 0.42 * k, 0, bodyGrp);
    // Sagan Memorial Station / Pathfinder petal ramp base beneath rover
    g.add(bodyGrp);

    // Flat GaAs 0.22 m² Solar Panel on top deck (16 W peak)
    const solarGrp = new THREE.Group();
    mesh(new THREE.BoxGeometry(0.92 * k, 0.035 * k, 1.18 * k), cell, 0, 0.57 * k, 0, solarGrp);
    tagPart(solarGrp, "solarPanels");
    g.add(solarGrp);
    parts.solarPanels = solarGrp;

    // 6-wheel Rocker-Bogie (13 cm cleats + aluminum bogie tubes)
    const wheelGrp = new THREE.Group();
    for (const sx of [-1, 1]) {
      mesh(new THREE.BoxGeometry(0.04 * k, 0.04 * k, 0.96 * k), alu, sx * 0.52 * k, 0.32 * k, 0, wheelGrp);
      for (const wz of [-0.46, 0, 0.46]) {
        const w = mesh(new THREE.CylinderGeometry(0.16 * k, 0.16 * k, 0.14 * k, 16), dark, sx * 0.58 * k, 0.18 * k, wz * k, wheelGrp);
        w.rotation.z = M.PI / 2;
        mesh(new THREE.CylinderGeometry(0.09 * k, 0.09 * k, 0.15 * k, 12), alu, sx * 0.58 * k, 0.18 * k, wz * k, wheelGrp).rotation.z = M.PI / 2;
      }
    }
    tagPart(wheelGrp, "wheels");
    g.add(wheelGrp);
    parts.wheels = wheelGrp;

    // Front stereo camera + 5 laser stripe hazard projectors (no tall mast!)
    const camGrp = new THREE.Group();
    camGrp.position.set(0, 0.5 * k, 0.64 * k);
    mesh(new THREE.BoxGeometry(0.36 * k, 0.14 * k, 0.12 * k), alu, 0, 0, 0, camGrp);
    for (const lx of [-0.1, 0.1]) {
      mesh(new THREE.CylinderGeometry(0.03 * k, 0.03 * k, 0.08 * k, 10), mat(0x66ccff, 0.2, 0.8), lx * k, 0, 0.05 * k, camGrp).rotation.x = M.PI / 2;
    }
    tagPart(camGrp, "camera");
    g.add(camGrp);
    parts.camera = camGrp;

    const rearCamera = mesh(new THREE.BoxGeometry(0.16*k,0.1*k,0.08*k), dark, 0.25*k,0.49*k,-0.65*k,g);
    tagPart(rearCamera,"camera");
    // Rear-mounted extendable APXS Sensor Head on deployment linkage
    const armGrp = new THREE.Group();
    armGrp.position.set(0, 0.38 * k, -0.66 * k);
    mesh(new THREE.BoxGeometry(0.08 * k, 0.08 * k, 0.28 * k), alu, 0, 0, -0.12 * k, armGrp);
    const apxsHead = mesh(new THREE.CylinderGeometry(0.09 * k, 0.09 * k, 0.18 * k, 14), gold, 0, -0.1 * k, -0.26 * k, armGrp);
    tagPart(armGrp, "roboticArm");
    parts.roboticArm = armGrp;
    g.add(armGrp);
    parts.instrument = armGrp;
    parts.apxs = armGrp;

    // UHF Whip Antenna
    const ant = mesh(new THREE.CylinderGeometry(0.015 * k, 0.015 * k, 0.65 * k, 8), alu, 0.36 * k, 0.88 * k, -0.45 * k, g);
    tagPart(ant, "antenna");
    parts.antenna = ant;

    const hb = addHoloAndBeacon(g, k, 0xff9b5e);
    parts.beacon = hb.beacon;
    parts.holo = hb.holo;
    g.userData.parts = parts;
    return g;
  };

  window.buildViking1 = function (k = 1.9) {
    const g = new THREE.Group(), parts = {};
    g.name = "Viking 1 Lander";
    const white = mat(0xdcd7cc, 0.55, 0.35),
      alu = mat(0xb8c0c8, 0.4, 0.7),
      gold = mat(0xc99e42, 0.4, 0.65),
      dark = mat(0x252830, 0.75, 0.25);

    // Hexagonal Lander Deck + 3 shock-absorbing leg struts with circular footpads
    const deckGrp = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.95 * k, 1.05 * k, 0.38 * k, 6), white, 0, 0.62 * k, 0, deckGrp);
    for (let i = 0; i < 3; i++) {
      const ang = (i * 2 * M.PI) / 3 + M.PI / 6;
      const lx = M.cos(ang) * 1.15 * k, lz = M.sin(ang) * 1.15 * k;
      const leg = mesh(new THREE.CylinderGeometry(0.045 * k, 0.035 * k, 0.78 * k, 8), alu, lx * 0.75, 0.35 * k, lz * 0.75, deckGrp);
      leg.rotation.z = -M.cos(ang) * 0.42;
      leg.rotation.x = M.sin(ang) * 0.42;
      mesh(new THREE.CylinderGeometry(0.22 * k, 0.24 * k, 0.05 * k, 16), dark, lx, 0.03 * k, lz, deckGrp);
    }
    g.add(deckGrp);

    // Two SNAP-19 RTG Windscreen Covers (70 W continuous nuclear power, not solar!)
    const rtgGrp = new THREE.Group();
    for (const sx of [-0.52, 0.52]) {
      mesh(new THREE.CylinderGeometry(0.18 * k, 0.22 * k, 0.42 * k, 12), gold, sx * k, 1.02 * k, -0.25 * k, rtgGrp);
    }
    tagPart(rtgGrp, "solarPanels");
    tagPart(rtgGrp, "rtg");
    g.add(rtgGrp);
    parts.solarPanels = rtgGrp;

    // Two Vertical Cylindrical Facsimile Cameras on deck
    const camGrp = new THREE.Group();
    camGrp.position.set(0, 0.98 * k, 0.38 * k);
    for (const sx of [-0.28, 0.28]) {
      mesh(new THREE.CylinderGeometry(0.09 * k, 0.09 * k, 0.38 * k, 14), white, sx * k, 0.12 * k, 0, camGrp);
      mesh(new THREE.BoxGeometry(0.06 * k, 0.12 * k, 0.06 * k), dark, sx * k, 0.22 * k, 0.07 * k, camGrp);
    }
    tagPart(camGrp, "camera");
    g.add(camGrp);
    parts.camera = camGrp;

    // 3-meter Retractable Surface Sampler Boom + Collector Scoop Head + Excavated Trench
    const armGrp = new THREE.Group();
    armGrp.position.set(0.15 * k, 0.68 * k, 0.75 * k);
    const boom = mesh(new THREE.CylinderGeometry(0.035 * k, 0.035 * k, 1.25 * k, 10), alu, 0, -0.18 * k, 0.55 * k, armGrp);
    boom.rotation.x = M.PI / 2.3;
    mesh(new THREE.BoxGeometry(0.16 * k, 0.1 * k, 0.24 * k), gold, 0, -0.45 * k, 1.12 * k, armGrp);
    tagPart(armGrp, "roboticArm");
    tagPart(armGrp, "sampler");
    g.add(armGrp);
    parts.roboticArm = armGrp;

    // GCMS + Biology Instrument Hopper on Deck
    const instGrp = new THREE.Group();
    mesh(new THREE.BoxGeometry(0.46 * k, 0.24 * k, 0.42 * k), alu, -0.15 * k, 0.92 * k, 0.05 * k, instGrp);
    mesh(new THREE.CylinderGeometry(0.08 * k, 0.05 * k, 0.12 * k, 12), gold, -0.15 * k, 1.08 * k, 0.05 * k, instGrp);
    tagPart(instGrp, "instrument");
    tagPart(instGrp, "gcms");
    g.add(instGrp);
    parts.instrument = instGrp;

    // High-Gain Parabolic S-band Dish Antenna on mast
    const antGrp = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.03 * k, 0.03 * k, 0.55 * k, 8), alu, 0, 1.08 * k, -0.58 * k, antGrp);
    const dish = mesh(new THREE.CylinderGeometry(0.38 * k, 0.08 * k, 0.12 * k, 18), white, 0, 1.38 * k, -0.58 * k, antGrp);
    dish.rotation.x = 0.45;
    tagPart(antGrp, "antenna");
    g.add(antGrp);
    parts.antenna = antGrp;

    const hb = addHoloAndBeacon(g, k, 0xff9b5e);
    parts.beacon = hb.beacon;
    parts.holo = hb.holo;
    g.userData.parts = parts;
    return g;
  };

  window.buildSpirit = function () {
    // Spirit is Opportunity's twin MER-A rover, customized with its locked right-front wheel
    // and the bright >90% opaline silica trench churned up near Home Plate (2007).
    const g = typeof buildOpportunity === "function" ? buildOpportunity(1.9) : rover(2.4, 0xd8d8d8, 1);
    g.name = "Spirit Rover";
    const pts = g.userData.parts || {};

    // Add bright white opaline silica soil trench behind the right-front wheel
    const silicaTrench = mesh(
      new THREE.BoxGeometry(0.42, 0.05, 1.65),
      mat(0xf5f2e8, 0.9, 0.05),
      0.95,
      0.03,
      0.15,
      g
    );
    tagPart(silicaTrench, "wheels");

    // Cant the right-front wheel to visually show the 2006 actuator failure
    if (pts.wheels && pts.wheels.children && pts.wheels.children.length > 0) {
      const rfWheel = pts.wheels.children[3] || pts.wheels.children[0];
      rfWheel.rotation.y = 0.38;
    }

    // Ensure compatibility with V3 Spirit hotspot keys ('camera', 'solarPanels', 'wheels', 'instrument', 'antenna')
    if (pts.pancam && !pts.camera) pts.camera = pts.pancam;
    if (pts.rat) {
      tagPart(pts.rat, "instrument");
      pts.instrument = pts.rat;
    }
    if (pts.idd) {
      tagPart(pts.idd, "roboticArm");
      pts.roboticArm = pts.idd;
    }
    return g;
  };

  window.buildInSight = function (k = 1.95) {
    const g = new THREE.Group(), parts = {};
    g.name = "InSight Lander";
    const deckCol = mat(0xc4c9d1, 0.45, 0.65),
      cell = mat(0x182b54, 0.3, 0.65),
      copper = mat(0xc86d3b, 0.35, 0.7),
      white = mat(0xedeff2, 0.5, 0.4),
      dark = mat(0x20242c, 0.8, 0.25);

    // Circular 3-legged Lander Deck
    const bodyGrp = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.85 * k, 0.9 * k, 0.34 * k, 16), deckCol, 0, 0.58 * k, 0, bodyGrp);
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * M.PI) / 3;
      mesh(new THREE.CylinderGeometry(0.04 * k, 0.03 * k, 0.68 * k, 8), deckCol, M.cos(a) * 0.82 * k, 0.3 * k, M.sin(a) * 0.82 * k, bodyGrp);
      mesh(new THREE.CylinderGeometry(0.18 * k, 0.2 * k, 0.04 * k, 12), dark, M.cos(a) * 0.95 * k, 0.02 * k, M.sin(a) * 0.95 * k, bodyGrp);
    }
    g.add(bodyGrp);

    // Signature Twin Circular Decagonal Ultraflex Solar Arrays (2.15 m diameter each)
    const solarGrp = new THREE.Group();
    for (const sx of [-1.72, 1.72]) {
      mesh(new THREE.BoxGeometry(0.45 * k, 0.04 * k, 0.12 * k), deckCol, sx * 0.52 * k, 0.68 * k, 0, solarGrp);
      const fan = mesh(new THREE.CylinderGeometry(0.82 * k, 0.82 * k, 0.03 * k, 20), cell, sx * k, 0.68 * k, 0, solarGrp);
      mesh(new THREE.CylinderGeometry(0.14 * k, 0.14 * k, 0.045 * k, 12), copper, sx * k, 0.68 * k, 0, solarGrp);
    }
    tagPart(solarGrp, "solarPanels");
    g.add(solarGrp);
    parts.solarPanels = solarGrp;

    // 1.8-meter Instrument Deployment Arm (IDA) + Grapple + IDC Camera
    const armGrp = new THREE.Group();
    armGrp.position.set(0.12 * k, 0.76 * k, 0.45 * k);
    const boom1 = mesh(new THREE.CylinderGeometry(0.035 * k, 0.035 * k, 0.75 * k, 10), deckCol, 0, 0.32 * k, 0.18 * k, armGrp);
    boom1.rotation.x = 0.55;
    const boom2 = mesh(new THREE.CylinderGeometry(0.03 * k, 0.03 * k, 0.68 * k, 10), deckCol, 0, 0.42 * k, 0.65 * k, armGrp);
    boom2.rotation.x = 1.25;
    // Grapple hook hanging from end of 1.8 m arm
    mesh(new THREE.CylinderGeometry(0.012 * k, 0.012 * k, 0.32 * k, 8), dark, 0, 0.18 * k, 0.92 * k, armGrp);
    tagPart(armGrp, "roboticArm");
    g.add(armGrp);
    parts.roboticArm = armGrp;

    // SEIS Copper Hexagonal Seismometer + White Domed Wind & Thermal Shield (WTS) + HP3 Mole
    const instGrp = new THREE.Group();
    // Placed on ground at (0,0,0) when deployed; stowed on deck initially
    mesh(new THREE.CylinderGeometry(0.24 * k, 0.27 * k, 0.18 * k, 6), copper, 0, 0.11 * k, 1.28 * k, instGrp);
    mesh(new THREE.CylinderGeometry(0.34 * k, 0.38 * k, 0.14 * k, 16), white, 0, 0.22 * k, 1.28 * k, instGrp);
    // HP3 Heat Flow Probe support housing next to SEIS
    mesh(new THREE.CylinderGeometry(0.06 * k, 0.08 * k, 0.38 * k, 10), dark, -0.45 * k, 0.19 * k, 1.15 * k, instGrp);
    tagPart(instGrp, "instrument");
    tagPart(instGrp, "seis");
    g.add(instGrp);
    parts.instrument = instGrp;
    g.userData.seisStowed = new THREE.Vector3(0, 0.62 * k, -0.82 * k);
    instGrp.position.copy(g.userData.seisStowed);

    // RISE X-band Horn Antennas + Context Camera
    const camGrp = new THREE.Group();
    camGrp.position.set(-0.28 * k, 0.78 * k, 0.45 * k);
    mesh(new THREE.BoxGeometry(0.16 * k, 0.14 * k, 0.16 * k), dark, 0, 0, 0, camGrp);
    tagPart(camGrp, "camera");
    g.add(camGrp);
    parts.camera = camGrp;

    const antGrp = new THREE.Group();
    for (const sx of [-0.38, 0.38]) {
      const horn = mesh(new THREE.CylinderGeometry(0.09 * k, 0.04 * k, 0.24 * k, 12), copper, sx * k, 0.86 * k, -0.25 * k, antGrp);
      horn.rotation.z = sx * 0.35;
    }
    tagPart(antGrp, "antenna");
    g.add(antGrp);
    parts.antenna = antGrp;

    const hb = addHoloAndBeacon(g, k, 0xff9b5e);
    parts.beacon = hb.beacon;
    parts.holo = hb.holo;
    g.userData.parts = parts;
    return g;
  };

  /* ---------- 6. PRE- AND POST-MISSION LEARNING ASSESSMENTS ---------- */
  const ASSESS_BANK = {
    "Sojourner": {
      objective: "Distinguish what an elemental spectrometer (APXS) measures from broader claims about rock origin or life.",
      misconception: "Assuming elemental rock chemistry directly proves biological life or explains a rock's history on its own.",
      pre: {
        q: "Before investigating: What quantity does Sojourner's rear Alpha Proton X-ray Spectrometer (APXS) directly measure?",
        opts: [
          "The relative chemical elements inside a rock or soil sample (such as silicon and iron)",
          "Whether living cells are metabolizing oxygen underground",
          "The age of a crater to the exact year using optical zoom"
        ],
        a: 0,
        why: "APXS emits alpha particles and detects returned alpha particles, protons, and X-rays to identify chemical elements."
      },
      post: {
        q: "Transfer check: Suppose a future rover measures higher silica (SiO₂) and lower iron in one boulder than in nearby dust. What can the team defend from this APXS measurement alone?",
        opts: [
          "The boulder differs in bulk elemental composition from the nearby dust; explaining how it formed needs more context",
          "The boulder definitely grew from photosynthetic microorganisms",
          "Every rock across Mars has the exact same history as that boulder"
        ],
        a: 0,
        why: "Elemental composition shows chemical differences between materials, while geological origin requires textures, mineralogy, and regional field context."
      }
    },
    "Viking 1 Lander": {
      objective: "Explain why a negative thermal detection requires caution when reactive soil salts can alter samples during heating.",
      misconception: "Treating 'no organics detected in one heated test' as final proof that Mars is sterile everywhere.",
      pre: {
        q: "Before investigating: Why did Viking 1 use an oven-based GCMS rather than just looking at soil with a camera?",
        opts: [
          "Cameras can only see sand grains vertically; ovens melt iron cores",
          "Heating soil releases volatile gases whose molecular masses help identify carbon-based compounds",
          "Cameras cannot function on Chryse Planitia during summer"
        ],
        a: 1,
        why: "Viking's Gas Chromatograph Mass Spectrometer heated soil in steps (up to 500°C) to vaporize and separate molecular fragments by mass."
      },
      post: {
        q: "Transfer check: Years after Viking 1 recorded no complex organics, Phoenix (2008) detected perchlorate salts in polar soil. How should scientists state what this implies for Viking's 1976 data?",
        opts: [
          "It proves Viking 1 directly measured perchlorates at Chryse Planitia",
          "Heating reactive salts can destroy or chlorinate organics during pyrolysis, so a non-detection does not prove global sterility",
          "It guarantees Viking 1 photographed fossilized bacteria in 1976"
        ],
        a: 1,
        why: "Phoenix measured perchlorates at a different polar site; lab experiments show heating perchlorates with organics produces chlorinated products and destroys fragile carbon compounds, leaving Viking's negative detection debated."
      }
    },
    "Spirit Rover": {
      objective: "Contrast surface dust/weathering rinds with subsurface or exposed mineral clues to hydrothermal water.",
      misconception: "Confusing RAT-ground volcanic basalt with the accidentally trenched silica soil, or treating hot-water minerals as proof of microbes.",
      pre: {
        q: "Before investigating: Why did Spirit carry a Rock Abrasion Tool (RAT) when it already had spectrometers?",
        opts: [
          "Martian dust and weathering crusts coat rock surfaces, hiding the unweathered rock underneath",
          "To drill 100 meters deep into groundwater aquifers",
          "To polish its wheel spokes when stuck in sand"
        ],
        a: 0,
        why: "Reddish surface dust dominates thin optical/X-ray/alpha signals unless the RAT grinds past the outer rind."
      },
      post: {
        q: "Transfer check: Near Home Plate in May 2007, Spirit's dragged broken wheel churned bright ~91 wt% opaline silica soil. Which pair correctly matches Spirit's discovery to what remains open?",
        opts: [
          "The silica-rich patch came from a dragged wheel trench and supports past hot-water/steam leaching, though it does not by itself prove ancient microbes lived there",
          "The RAT ground quartz beach sand sorted by a global ocean",
          "Frozen dry ice frost drifted into a wheel track and turned into silica"
        ],
        a: 0,
        why: "Opaline silica discovered in the dragged-wheel trench points to past hydrothermal leaching or fumaroles (Squyres et al. 2008), which represents an ancient habitable environment candidate — not confirmed past life."
      }
    },
    "Opportunity Rover": {
      objective: "Combine morphological texture (MI) with iron-mineral identification (Mössbauer) to weigh hypotheses for aqueous concretions.",
      misconception: "Thinking visual shape alone proves origin, or that hematite spherules equal direct observation of ancient living cells.",
      pre: {
        q: "Before investigating: Opportunity spotted millimeter-sized spheres ('blueberries') at Meridiani Planum. Why wasn't a panoramic photo alone enough to explain them?",
        opts: [
          "Pancam couldn't resolve where grains sat inside rock layers or identify their iron minerals",
          "Blueberries are blue only because of sky reflection",
          "Panoramic images always blur out centimeter-scale outcrops"
        ],
        a: 0,
        why: "Solving how spherules formed required close-up MI texture (~3 cm field, showing spheres embedded throughout layers) paired with Mössbauer mineral chemistry."
      },
      post: {
        q: "Transfer check: Imagine another rover finds uniform spheres embedded throughout sulfate rock containing jarosite. Which limitation STILL applies even with strong mineral and textural evidence?",
        opts: [
          "It shows liquid water soaked the rock once, not how long water persisted or whether organisms ever lived there",
          "Jarosite only forms inside molten volcanic lava lakes without water",
          "Spheres of uniform size prove meteors struck every outcrop simultaneously"
        ],
        a: 0,
        why: "Hematite concretions inside jarosite-bearing sulfate beds strongly support acidic saline groundwater (Squyres et al. 2004; Klingelhöfer et al. 2004), without measuring habitability duration or proving life."
      }
    },
    "InSight Lander": {
      objective: "Explain how P/S wave travel-time separation and core-interacting seismic waves constrain interior models (and why models revise).",
      misconception: "Thinking seismic wave arrivals give a single model-independent photograph of the core without geophysical assumptions.",
      pre: {
        q: "Before investigating: Why did InSight's arm lift the SEIS seismometer off the lander deck and cover it with a dome?",
        opts: [
          "Soil placement couples SEIS directly to the ground, while the dome blocks Martian wind and sharp daily temperature swings",
          "The lander deck blocked Mars's magnetic field from reaching SEIS",
          "SEIS needed to dig 5 meters down to measure interior heat flow"
        ],
        a: 0,
        why: "Deck vibrations and wind buffetings drown out tiny marsquake motions unless SEIS rests directly on the regolith under its Wind and Thermal Shield."
      },
      post: {
        q: "Transfer check: After recording 1,319 marsquakes, scientists inferred Mars has a liquid core — yet 2023 studies revised estimated core radius downward. Why can the inferred core radius change using the same mission dataset?",
        opts: [
          "Core size estimates depend on interior velocity models (such as adding a molten silicate layer above the core) rather than direct visual measurement",
          "Mars's iron core shrank physically by 150 km between 2021 and 2023",
          "SEIS accidentally reversed P-wave and S-wave speeds in 2023"
        ],
        a: 0,
        why: "Seismic inversion translates arrival times and reflected phases through layered interior density/velocity models — accounting for a basal molten silicate layer changed the inferred metallic core radius."
      }
    }
  };

  window.openAssessmentModal = function (machineName, mode, onDoneCallback) {
    const item = ASSESS_BANK[machineName];
    if (!item) { if (onDoneCallback) onDoneCallback(); return; }
    const isPre = mode === "pre";
    const block = isPre ? item.pre : item.post;
    const name = window.getExplorerName();

    dl(`
      <div class="top">
        <span>${isPre ? "📊 DIAGNOSTIC PRE-CHECK" : "🎓 DISTINCT TRANSFER POST-CHECK"} · ${machineName.toUpperCase()}</span>
        <span style="color:#4cd98a">PRACTICE CHECK (NOT GRADED)</span>
      </div>
      <div class="row">
        ${typeof PORT !== "undefined" ? PORT : ""}
        <div class="say">
          <div class="sp">🤖 GOAL: ${item.objective}</div>
          <p>${isPre
            ? `Before investigating <b>${machineName}</b>, <b>${name}</b>, record your starting idea below. You'll answer a different transfer question afterward.`
            : `Now apply what you observed with <b>${machineName}</b> to a new scenario, <b>${name}</b>.`
          }</p>
        </div>
      </div>
      <p style="margin:12px 0 8px"><b>${block.q}</b></p>
      <div id="v4-assess-opts">
        ${block.opts.map((o, idx) => `<button class="opt" onclick="window.submitAssessment('${machineName}', '${mode}', ${idx})">${o}</button>`).join("")}
      </div>
      <div id="v4-assess-fb"></div>
    `);
    window._assessCallback = onDoneCallback;
  };

  window.submitAssessment = function (machineName, mode, pickedIdx) {
    const item = ASSESS_BANK[machineName];
    const isPre = mode === "pre";
    const block = isPre ? item.pre : item.post;
    const ok = pickedIdx === block.a;
    const bucket = isPre ? window.playerProfile.preQuiz : window.playerProfile.postQuiz;
    if (!bucket[machineName]) bucket[machineName] = { ok: ok ? 1 : 0, picked: pickedIdx, ts: Date.now() };
    saveProfile();

    const btns = document.querySelectorAll("#v4-assess-opts .opt");
    btns.forEach((b, i) => {
      b.disabled = true;
      if (i === block.a) b.classList.add("g");
      else if (i === pickedIdx) b.classList.add("b");
    });

    const fb = document.getElementById("v4-assess-fb");
    if (fb) {
      fb.innerHTML = `
        <div class="fb" style="margin-top:10px;border-left:3px solid ${ok ? "#4cd98a" : "#ff9b5e"};padding-left:10px">
          <b>${ok ? "✔ Supported Reasoning!" : isPre ? "ℹ Starting Idea Recorded — Now Test It:" : "ℹ Compare With Evidence:"}</b><br>
          ${block.why}
        </div>
        <div class="bar" style="margin-top:12px">
          <span>First attempt saved locally for comparison (not validated learning score)</span>
          <button onclick="if(window._assessCallback) window._assessCallback();" style="background:#ff9b5e;color:#111;font-weight:bold">Continue Mission ▸</button>
        </div>
      `;
    }
  };

  /* ---------- 7. PERSISTENT DEEPENED SCIENTIFIC INVESTIGATIONS ---------- */
  const V4_TASK_KEY = "btsm.v4tasks.v2";
  function freshV4Tasks() {
    return {
      soj: { phase: 0, target: null, deployed: false, integrated: false, hyp: null, msg: "" },
      vik: { phase: 0, depth: null, temp: 0, hyp: null, msg: "" },
      spi: { phase: 0, site: null, abraded: 0, scanned: false, hyp: null, msg: "" },
      ins: { phase: 0, seisDown: false, wtsDown: false, pPick: 28, sPick: 54, shadowTested: false, hyp: null, msg: "" }
    };
  }
  function sanitizeV4Tasks(raw) {
    const out = freshV4Tasks();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
    const t = raw.tasks && typeof raw.tasks === "object" ? raw.tasks : raw;
    if (t.vik && typeof t.vik === "object") {
      if (Number.isInteger(t.vik.phase) && t.vik.phase >= 0 && t.vik.phase <= 2) out.vik.phase = t.vik.phase;
      if (t.vik.depth === "uv_surface" || t.vik.depth === "subsurface") out.vik.depth = t.vik.depth;
      if (t.vik.temp === 0 || t.vik.temp === 200 || t.vik.temp === 500) out.vik.temp = t.vik.temp;
      if (typeof t.vik.msg === "string") out.vik.msg = t.vik.msg.slice(0, 300);
    }
    if (t.spi && typeof t.spi === "object") {
      if (Number.isInteger(t.spi.phase) && t.spi.phase >= 0 && t.spi.phase <= 2) out.spi.phase = t.spi.phase;
      if (t.spi.site === "trench" || t.spi.site === null) out.spi.site = t.spi.site;
      if (typeof t.spi.abraded === "number" && t.spi.abraded >= 0 && t.spi.abraded <= 5) out.spi.abraded = t.spi.abraded;
      out.spi.scanned = !!t.spi.scanned;
      if (typeof t.spi.msg === "string") out.spi.msg = t.spi.msg.slice(0, 300);
    }
    if (t.ins && typeof t.ins === "object") {
      if (Number.isInteger(t.ins.phase) && t.ins.phase >= 0 && t.ins.phase <= 2) out.ins.phase = t.ins.phase;
      out.ins.seisDown = !!t.ins.seisDown;
      out.ins.wtsDown = !!t.ins.wtsDown && out.ins.seisDown;
      if (typeof t.ins.pPick === "number" && t.ins.pPick >= 5 && t.ins.pPick <= 45) out.ins.pPick = t.ins.pPick;
      if (typeof t.ins.sPick === "number" && t.ins.sPick >= 35 && t.ins.sPick <= 85) out.ins.sPick = t.ins.sPick;
      if (typeof t.ins.msg === "string") out.ins.msg = t.ins.msg.slice(0, 300);
    }
    return out;
  }
  function loadV4Tasks() {
    try {
      return sanitizeV4Tasks(JSON.parse(localStorage.getItem(V4_TASK_KEY) || "null"));
    } catch { return freshV4Tasks(); }
  }
  function saveV4Tasks() {
    try { localStorage.setItem(V4_TASK_KEY, JSON.stringify({ v: 2, tasks: window.v4TaskState })); } catch {}
  }
  window.v4TaskState = loadV4Tasks();
  window.v4RestartTask = function (machineName) {
    const map = { "Viking 1 Lander": "vik", "Spirit Rover": "spi", "InSight Lander": "ins" };
    const k = map[machineName];
    if (k) {
      window.v4TaskState[k] = freshV4Tasks()[k];
      saveV4Tasks();
    } else if (machineName === "Opportunity Rover" && typeof restartOppTask === "function") {
      restartOppTask();
      return;
    } else if (machineName === "Opportunity Rover" && typeof oppInit === "function" && typeof taskState !== "undefined") {
      taskState.opp = oppInit();
    }
    if (typeof interactionState !== "undefined") delete interactionState.completedTasks[machineName];
    if (typeof taskState !== "undefined") taskState.done = false;
    if (machineName === "InSight Lander" && typeof curM !== "undefined" && curM) curM.seisDeployed = false;
    if (typeof saveState === "function") saveState();
    if (typeof renderTaskUI === "function") renderTaskUI();
  };

  // --- SOJOURNER DEEP APXS INVESTIGATION ---
  window.sojSelectTarget = function (t) {
    const s = window.v4TaskState.soj;
    s.target = t;
    if (typeof highlight3DPart === "function") highlight3DPart(curM, "camera");
    if (t === "drift") {
      s.msg = "⚠ Consequence: Loose windblown drift dust is homogenized across all of Mars. Measuring it won't reveal Ares Vallis's volcanic rock history! Pick a solid rock target ('Barnacle Bill' or 'Yogi').";
    } else {
      s.msg = `✔ Stereo cameras locked onto '${t === "barnacle" ? "Barnacle Bill" : "Yogi"}'. Ready to back the rover up and deploy the APXS sensor head.`;
      s.phase = 1;
    }
    renderTaskUI();
  };

  window.sojDeployAPXS = function (action) {
    const s = window.v4TaskState.soj;
    if (typeof highlight3DPart === "function") highlight3DPart(curM, "instrument");
    if (action === "deploy") {
      s.deployed = true;
      s.msg = "✔ APXS deployment mechanism pressed the 50 mm sensor ring within 2 cm of the rock face.";
    } else if (action === "integrate") {
      if (!s.deployed) { s.msg = "⚠ Deploy the APXS contact head against the rock first! Alpha particles cannot cross a wide air gap."; renderTaskUI(); return; }
      s.integrated = true;
      s.phase = 2;
      s.msg = "✔ 10-hour nocturnal APXS integration complete (simulated). Alpha, proton, and X-ray backscatter spectrum acquired!";
    }
    renderTaskUI();
  };

  window.sojSubmitHyp = function (idx) {
    const s = window.v4TaskState.soj;
    s.hyp = idx;
    if (idx === 1) {
      completeCollaborativeTask(
        "Scientific Investigation Complete! By pressing Sojourner's APXS against 'Barnacle Bill' for 10 hours, you measured ~58 wt% SiO2 and low Mg/Fe — proving Mars has silica-rich, evolved volcanic rocks (similar to terrestrial andesites), not just primitive basalt."
      );
    } else {
      s.msg = idx === 0
        ? "✘ Incorrect: APXS detects chemical elements (Si, Fe, Mg, Al, Ca), not biological DNA or living cells."
        : "✘ Incorrect: High silicon and potassium with lower iron/magnesium matches evolved igneous rock (andesite-like), not pure metallic iron.";
      renderTaskUI();
    }
  };

  // --- VIKING 1 DEEP GCMS & PERCHLORATE INVESTIGATION ---
  window.vikScoop = function (depth) {
    const v = window.v4TaskState.vik;
    if (typeof highlight3DPart === "function") highlight3DPart(curM, "roboticArm");
    v.depth = depth;
    if (depth === "uv_surface") {
      v.msg = "⚠ Consequence: The top 1 mm of Martian dust is blasted by solar UV radiation and oxidizing superoxides. Trench deeper (10–15 cm) to collect shielded subsurface soil!";
    } else {
      v.phase = 1;
      v.msg = "✔ Collector boom delivered a subsurface sample to the analytical instrument (simplified procedure).";
    }
    saveV4Tasks();
    renderTaskUI();
  };

  window.vikHeatOven = function (temp) {
    const v = window.v4TaskState.vik;
    if (typeof highlight3DPart === "function") highlight3DPart(curM, "instrument");
    if (temp === 200) {
      v.temp = 200;
      v.msg = "🌡️ 200°C Pyrolysis Step: Adsorbed H2O vapor and CO2 desorbed from soil grains. Ramp oven to 500°C to test for refractory organic compounds.";
    } else if (temp === 500) {
      if (v.temp < 200) {
        v.msg = "⚠ Protocol violation: Run the 200°C step first to drive off adsorbed atmospheric water and CO2 before high-temperature pyrolysis.";
        saveV4Tasks();
        renderTaskUI();
        return;
      }
      v.temp = 500;
      v.phase = 2;
      v.msg = "🌡️ 500°C Pyrolysis Step: Teaching result: gas signatures need interpretation. Chlorinated compounds and non-detections are not a direct test that proves or disproves life.";
    }
    saveV4Tasks();
    renderTaskUI();
  };

  window.vikSubmitHyp = function (idx) {
    const v = window.v4TaskState.vik;
    v.hyp = idx;
    if (idx === 1) {
      saveV4Tasks();
      completeCollaborativeTask(
        "Investigation complete. Viking GCMS results did not demonstrate life. Later experiments with perchlorate-bearing soil showed how heating can alter organics, complicating interpretation. Phoenix detected perchlorate at a different landing site; this is not a direct measurement of Viking soil perchlorate."
      );
    } else {
      v.msg = idx === 0
        ? "✘ Scientific Overclaim: Trace chloromethane and CO2 do not prove living microbes exist today."
        : "✘ Incomplete: While Viking detected no organics at the time, heating perchlorate-bearing soil can destroy organics during the test itself, so Mars is not proven 100% sterile everywhere.";
      saveV4Tasks();
      renderTaskUI();
    }
  };

  // --- SPIRIT DEEP SILICA TRENCH & RAT INVESTIGATION ---
  window.spiAction = function (act) {
    const sp = window.v4TaskState.spi;
    if (act === "coat") {
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "instrument");
      sp.msg = "⚠ Consequence: Scanning an unbrushed, dust-coated basalt rock can be affected by surface dust and the weathering rind. Either grind 5 mm deep with the RAT or inspect the 2007 dragged-wheel trench!";
    } else if (act === "rat") {
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "instrument");
      sp.abraded = Math.min(5, sp.abraded + 2.5);
      sp.msg = `⚙ RAT diamond burrs ground ${sp.abraded.toFixed(1)} mm / 5.0 mm (45 mm diameter circle) through the altered rind.`;
      if (sp.abraded >= 5) sp.phase = 1;
    } else if (act === "trench") {
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "wheels");
      sp.site = "trench";
      sp.phase = 1;
      sp.msg = "✔ Inspected the 2007 dragged-wheel trench churned up by Spirit's immobile right-front wheel near Home Plate — bright white subsurface soil exposed!";
    } else if (act === "scan") {
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "camera");
      if (sp.site !== "trench") {
        sp.msg = "The ground rock and wheel-exposed soil are different targets. The silica discovery belongs to the wheel trench: inspect that site before comparing the published result.";
        sp.phase = 0;
        saveV4Tasks();
        renderTaskUI();
        return;
      }
      sp.scanned = true;
      sp.phase = 2;
      sp.msg = "✔ Published evidence summary: APXS found silica-rich soil; Mini-TES supported opaline silica. This activity does not acquire a real spectrum.";
    }
    saveV4Tasks();
    renderTaskUI();
  };

  window.spiSubmitHyp = function (idx) {
    const sp = window.v4TaskState.spi;
    sp.hyp = idx;
    if (idx === 1) {
      saveV4Tasks();
      completeCollaborativeTask(
        "Scientific Investigation Complete! In 2007, Spirit's failed right-front wheel scraped open bright soil near Home Plate containing ~91 wt% opaline silica (Squyres et al. 2008). On Earth, such concentrated amorphous silica forms around volcanic hot springs and acidic steam vents (fumaroles) — supporting past hydrothermal activity near Home Plate; this does not demonstrate life!"
      );
    } else {
      sp.msg = idx === 0
        ? "✘ Incorrect: Pure quartz beach sand requires long-term ocean wave sorting; Mini-TES showed amorphous opaline silica next to volcanic Home Plate."
        : "✘ Incorrect: Frozen carbon dioxide (dry ice) sublimates into gas and contains no silicon (SiO2).";
      saveV4Tasks();
      renderTaskUI();
    }
  };

  // --- INSIGHT DEEP SEISMIC WAVEFORM & CORE SHADOW INVESTIGATION ---
  window.insStep = function (act, val) {
    const ins = window.v4TaskState.ins;
    if (act === "seis") {
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "roboticArm");
      ins.seisDown = true;
      if (curM) curM.seisDeployed = true;
      ins.msg = "✔ 1.8-meter Instrument Deployment Arm grappled SEIS off the deck and placed it onto Elysium Planitia.";
      saveV4Tasks();
      renderTaskUI();
    } else if (act === "noisy") {
      ins.msg = "⚠ Consequence: Without the Wind & Thermal Shield (WTS), Martian gusts and ±70°C daily temperature swings saturate SEIS with noise! Lower the WTS dome first.";
      saveV4Tasks();
      renderTaskUI();
    } else if (act === "wts") {
      if (!ins.seisDown) {
        ins.msg = "⚠ Place SEIS on the ground before lowering the Wind & Thermal Shield!";
        saveV4Tasks();
        renderTaskUI();
        return;
      }
      if (typeof highlight3DPart === "function") highlight3DPart(curM, "instrument");
      ins.wtsDown = true;
      ins.phase = 1;
      ins.msg = "✔ White domed Wind & Thermal Shield (WTS) lowered over SEIS. Broadband seismic channel quiet — synthetic teaching waveform incoming (not a recorded marsquake)!";
      saveV4Tasks();
      renderTaskUI();
    } else if (act === "pickP") {
      ins.pPick = Number(val);
      saveV4Tasks();
      drawInSightSeismogram();
    } else if (act === "pickS") {
      ins.sPick = Number(val);
      saveV4Tasks();
      drawInSightSeismogram();
    } else if (act === "verifyPick") {
      const pErr = Math.abs(ins.pPick - 22);
      const sErr = Math.abs(ins.sPick - 58);
      if (pErr <= 6 && sErr <= 6) {
        ins.phase = 2;
        ins.msg = "✔ Accurate P-wave (~22 s) and S-wave (~58 s) picks! The synthetic arrival separation is ~36 seconds. Distance requires an assumed velocity model; this activity does not invert real data.";
      } else {
        ins.msg = `⚠ Check the seismogram: P-wave (fast compressional onset) begins near 22 s, and the larger S-wave (shear onset) arrives near 58 s. Current picks: P=${ins.pPick}s, S=${ins.sPick}s.`;
      }
      saveV4Tasks();
      renderTaskUI();
    } else if (act === "hyp") {
      ins.hyp = val;
      if (val === 1) {
        saveV4Tasks();
        completeCollaborativeTask(
          "Investigation complete. Your synthetic P and S picks show different wave arrival times. Published InSight analyses support a layered interior and liquid core; core radius estimates changed as models incorporated a molten silicate layer (2023)."
        );
      } else {
        ins.msg = val === 0
          ? "✘ Violates Wave Physics: Shear (S) waves CAN travel through a solid core. Liquid material does not transmit shear waves. Published core inferences combine several observations and interior models; one missing arrival is not sufficient."
          : "✘ Incorrect: P-S lag time relates to wave speeds and distance to the quake, not atmospheric wind speed.";
        saveV4Tasks();
        renderTaskUI();
      }
    }
  };

  function drawInSightSeismogram() {
    const cv = document.getElementById("insWaveCanvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, Hc = cv.height;
    const ins = window.v4TaskState.ins;
    ctx.fillStyle = "#080d16";
    ctx.fillRect(0, 0, W, Hc);

    // Grid lines
    ctx.strokeStyle = "#1b283d";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hc); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, Hc / 2); ctx.lineTo(W, Hc / 2); ctx.stroke();

    // Synthetic broadband marsquake trace (0 to 90 s)
    ctx.strokeStyle = "#4cd98a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let px = 0; px < W; px++) {
      const t = (px / W) * 90; // seconds
      let amp = Math.sin(t * 7.3) * 2.2 + Math.cos(t * 13.1) * 1.5; // background microseism
      if (t >= 22) {
        // P-wave packet at t = 22s
        const dtP = t - 22;
        amp += Math.exp(-dtP * 0.14) * Math.sin(dtP * 16) * 18;
      }
      if (t >= 58) {
        // S-wave packet at t = 58s (larger, lower frequency shear wave)
        const dtS = t - 58;
        amp += Math.exp(-dtS * 0.11) * Math.sin(dtS * 9.5) * 38;
      }
      const y = Hc / 2 - amp;
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();

    // Draw P and S markers
    const xP = (ins.pPick / 90) * W;
    const xS = (ins.sPick / 90) * W;
    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xP, 0); ctx.lineTo(xP, Hc); ctx.stroke();
    ctx.fillStyle = "#66ccff";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`P-Pick (${ins.pPick}s)`, Math.min(W - 85, xP + 4), 14);

    ctx.strokeStyle = "#ff9b5e";
    ctx.beginPath(); ctx.moveTo(xS, 0); ctx.lineTo(xS, Hc); ctx.stroke();
    ctx.fillStyle = "#ff9b5e";
    ctx.fillText(`S-Pick (${ins.sPick}s)`, Math.min(W - 85, xS + 4), 28);

    ctx.fillStyle = "#9fb4c9";
    ctx.font = "10px monospace";
    ctx.fillText("SCHEMATIC BROADBAND SEISMOGRAM (0–90 s) · P onset ~22 s · S onset ~58 s", 8, Hc - 6);
  }

  /* ---------- 8. NSSDCA MISSION ARCHIVE & INTERACTIVE MARS LANDING MAP ---------- */
  const NSSDCA_RECORDS = [
    {
      name: "Viking 1 Lander",
      cospar: "1975-075C (Orbiter: 1975-075A)",
      launch: "Aug 20, 1975",
      landing: "Jul 20, 1976 (11:53 UT)",
      end: "Nov 11, 1982 (Sol 2245 · Faulty battery-charging command)",
      site: "Western Chryse Planitia (Thomas Mutch Memorial Station)",
      coords: "22.483° N, 47.94° W (312.06° E)",
      lat: 22.483,
      lonE: 312.06,
      power: "2 × SNAP-19 RTGs (~70 W continuous)",
      discovery: "First successful Mars lander; first surface photos, long-term meteorology, and GCMS/biology soil tests (later re-evaluated after Phoenix's 2008 perchlorate discovery).",
      ref: "NASA NSSDCA 1975-075C; Biemann et al. (1977) JGR; Navarro-González et al. (2010) JGR"
    },
    {
      name: "Sojourner (Mars Pathfinder)",
      cospar: "1996-068A",
      launch: "Dec 4, 1996",
      landing: "Jul 4, 1997",
      end: "Sept 27, 1997 (83 sols · Loss of contact; failure mechanism uncertain)",
      site: "Ares Vallis Outflow Channel (Carl Sagan Memorial Station)",
      coords: "19.33° N, 33.55° W (326.45° E)",
      lat: 19.33,
      lonE: 326.45,
      power: "0.22 m² GaAs Solar Panel (16 W peak) + LiSOCl2 primary batteries",
      discovery: "First rover on Mars; drove ~100 m, returned 550 rover images, and used APXS to identify silica-rich andesitic rocks ('Barnacle Bill') and rounded flood conglomerates.",
      ref: "NASA NSSDCA 1996-068A; Rieder et al. (1997) Science 278:1771"
    },
    {
      name: "Spirit Rover (MER-A)",
      cospar: "2003-027A",
      launch: "Jun 10, 2003",
      landing: "Jan 4, 2004 (04:35 UTC)",
      end: "Last signal Mar 22, 2010 (Concluded May 25, 2011 · Stuck in soft soil May 1, 2009)",
      site: "Gusev Crater / Husband Hill / Home Plate (Columbia Memorial Station)",
      coords: "14.5692° S, 175.4729° E",
      lat: -14.5692,
      lonE: 175.4729,
      power: "Triple-junction GaInP/GaAs/Ge solar arrays (~140 W clean)",
      discovery: "Drove 7.73 km; in 2007, its immobile right-front wheel churned up ~91 wt% opaline silica soil near Home Plate — supporting ancient hydrothermal activity; the formation mechanism remains interpreted.",
      ref: "NASA NSSDCA 2003-027A; Squyres et al. (2008) Science 320(5879):1063–1067, DOI: 10.1126/science.1155429"
    },
    {
      name: "Opportunity Rover (MER-B)",
      cospar: "2003-032A",
      launch: "Jul 7, 2003",
      landing: "Jan 25, 2004 (04:54 UTC)",
      end: "Last contact Jun 10, 2018 (Mars-wide dust storm · Concluded Feb 13, 2019)",
      site: "Meridiani Planum — Eagle to Endeavour Crater (Challenger Memorial Station)",
      coords: "1.9483° S, 354.4742° E (5.53° W)",
      lat: -1.9483,
      lonE: 354.4742,
      power: "Triple-junction solar arrays + Li-ion batteries (45.16 km total drive)",
      discovery: "Discovered embedded hematite concretions ('blueberries') and jarosite sulfates in Eagle Crater bedrock using MI + Mössbauer + APXS, supporting past interaction with liquid water, including acidic conditions.",
      ref: "NASA NSSDCA 2003-032A; Squyres et al. (2004) Science 306:1698 (10.1126/science.1104559); Klingelhöfer et al. (2004) Science 306:1740"
    },
    {
      name: "InSight Lander",
      cospar: "2018-042A",
      launch: "May 5, 2018",
      landing: "Nov 26, 2018",
      end: "Last contact Dec 15, 2022 (Concluded Dec 21, 2022 · Dust-covered solar arrays)",
      site: "Western Elysium Planitia",
      coords: "4.5024° N, 135.6234° E",
      lat: 4.5024,
      lonE: 135.6234,
      power: "Dual 2.15 m circular Ultraflex solar arrays",
      discovery: "Deployed SEIS with its 1.8 m arm; recorded 1,319 marsquakes and impacts, supporting a layered interior and liquid iron-alloy core. Published size estimates depend on the interior model.",
      ref: "NASA NSSDCA 2018-042A; Stähler et al. (2021) Science 373:443 (10.1126/science.abi7730); Knapmeyer-Endrun et al. (2021) Science 373:438"
    }
  ];

  let selectedArchiveIdx = 3; // Default highlight Opportunity

  let _archivePrevFocus = null;
  window.closeNSSDCAArchive = function () {
    const modal = document.getElementById("archive-modal");
    if (modal) modal.style.display = "none";
    if (_archivePrevFocus && typeof _archivePrevFocus.focus === "function") {
      try { _archivePrevFocus.focus(); } catch {}
    }
    _archivePrevFocus = null;
  };

  window.openNSSDCAArchive = function (idx) {
    if (typeof idx === "number") selectedArchiveIdx = idx;
    if (!_archivePrevFocus && document.activeElement && document.activeElement !== document.body) {
      _archivePrevFocus = document.activeElement;
    }
    let modal = document.getElementById("archive-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "archive-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "NASA NSSDCA Master Catalog Archive");
      document.body.appendChild(modal);
    }
    const rec = NSSDCA_RECORDS[selectedArchiveIdx];
    modal.innerHTML = `
      <div class="v4-card" style="max-width:860px">
        <div class="top">
          <span>🛰️ NASA NSSDCA MASTER CATALOG ARCHIVE & REAL MARS LANDING SITES</span>
          <button type="button" id="archive-close-btn" onclick="window.closeNSSDCAArchive()" style="padding:3px 10px">✕ Close</button>
        </div>
        <p style="font-size:12.5px;color:#b8c7dc;margin:6px 0">
          <b>Scientific Geography Disclaimer:</b> In gameplay, all five machines are gathered in an <i>archived reconstruction</i> so you can walk between them. On the real planet Mars, they landed thousands of kilometers apart across the coordinates plotted below:
        </p>
        <canvas id="mars-map-canvas" width="760" height="280" aria-label="Simplified Mars landing-site map" style="width:100%;height:auto;border:1px solid #ff9b5e66;border-radius:6px;background:#1c0f0a"></canvas>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">
          ${NSSDCA_RECORDS.map((r, i) => `
            <button type="button" onclick="window.openNSSDCAArchive(${i})" style="font-size:11.5px;padding:5px 10px;border-color:${i === selectedArchiveIdx ? "#4cd98a" : "#ff9b5e55"};background:${i === selectedArchiveIdx ? "#1a3528" : "#151d2b"}">
              ${i === selectedArchiveIdx ? "● " : ""}${r.name}
            </button>
          `).join("")}
        </div>
        <div style="background:#101724;border:1px solid #2b3c56;border-radius:8px;padding:10px 14px;font-size:12.5px">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px">
            <b style="color:#ff9b5e;font-size:14px">${rec.name}</b>
            <span style="color:#4cd98a;font-family:monospace">NSSDCA / COSPAR ID: ${rec.cospar}</span>
          </div>
          <div class="v4-grid2" style="margin:6px 0;font-size:12px">
            <div><b>Launch Date:</b> ${rec.launch}<br><b>Landing Date:</b> ${rec.landing}<br><b>Mission End:</b> ${rec.end}</div>
            <div><b>Landing Site:</b> ${rec.site}<br><b>Rounded landing-site coordinates:</b> ${rec.coords}<br><b>Power System:</b> ${rec.power}</div>
          </div>
          <div style="margin-top:4px"><b>Observation &amp; interpretation summary:</b> ${rec.discovery}</div>
          <div style="margin-top:4px;color:#8fa3bf;font-size:11px"><b>Primary Literature &amp; NASA Records:</b> ${rec.ref} · <a href="https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=${rec.cospar.split(" ")[0]}" target="_blank" rel="noopener">Open NSSDCA record ↗</a></div>
        </div>
        <table class="nssdca-table">
          <thead>
            <tr><th>Mission</th><th>NSSDCA ID</th><th>Landing Date</th><th>Landing-site coordinates</th><th>End of Operations</th></tr>
          </thead>
          <tbody>
            ${NSSDCA_RECORDS.map((r, i) => `
              <tr style="${i === selectedArchiveIdx ? "background:#1b293d" : ""}">
                <td><button type="button" onclick="window.openNSSDCAArchive(${i})" style="background:none;border:none;color:inherit;font-weight:bold;padding:2px 0;text-align:left;cursor:pointer;text-decoration:underline">${r.name}</button></td>
                <td style="font-family:monospace">${r.cospar}</td>
                <td>${r.landing}</td>
                <td>${r.coords}</td>
                <td>${r.end}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    modal.style.display = "flex";
    drawMarsLandingMap();
    const closeBtn = document.getElementById("archive-close-btn");
    if (closeBtn) closeBtn.focus();
  };

  function drawMarsLandingMap() {
    const cv = document.getElementById("mars-map-canvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width, Hc = cv.height;

    // Equirectangular MOLA-inspired topographic base gradient
    const grad = ctx.createLinearGradient(0, 0, 0, Hc);
    grad.addColorStop(0, "#3b2318");
    grad.addColorStop(0.35, "#5c2e1c"); // Northern lowlands (Chryse / Utopia / Acidalia)
    grad.addColorStop(0.55, "#874327"); // Equatorial plains
    grad.addColorStop(0.85, "#a35532"); // Southern cratered highlands
    grad.addColorStop(1, "#4a2c20");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, Hc);

    // Major topographic features (Tharsis bulge, Valles Marineris, Hellas Basin, Elysium)
    ctx.fillStyle = "rgba(210, 125, 75, 0.25)";
    ctx.beginPath(); ctx.ellipse(W * 0.7, Hc * 0.5, 95, 55, 0, 0, Math.PI * 2); ctx.fill(); // Tharsis
    ctx.fillStyle = "rgba(40, 25, 35, 0.45)";
    ctx.beginPath(); ctx.ellipse(W * 0.19, Hc * 0.73, 55, 32, 0, 0, Math.PI * 2); ctx.fill(); // Hellas Basin
    ctx.strokeStyle = "rgba(50, 20, 15, 0.65)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(W * 0.76, Hc * 0.53); ctx.lineTo(W * 0.88, Hc * 0.55); ctx.stroke(); // Valles Marineris

    // Lat/Lon Grid (-180° W to +180° E, +90° N to -90° S)
    ctx.strokeStyle = "rgba(255, 200, 160, 0.18)";
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 60) {
      const x = ((lon + 180) / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hc); ctx.stroke();
      ctx.fillStyle = "rgba(255,220,190,0.5)";
      ctx.font = "10px monospace";
      ctx.fillText(`${lon}°`, x + 3, Hc - 6);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * Hc;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,220,190,0.5)";
      ctx.fillText(`${lat === 0 ? "0° EQ" : lat + "°"}`, 6, y - 3);
    }

    // Plot all 5 verified NASA landing sites (converting 0–360E to -180..+180)
    NSSDCA_RECORDS.forEach((r, idx) => {
      const lon180 = r.lonE > 180 ? r.lonE - 360 : r.lonE;
      const x = ((lon180 + 180) / 360) * W;
      const y = ((90 - r.lat) / 180) * Hc;
      const active = idx === selectedArchiveIdx;

      if (active) {
        ctx.strokeStyle = "#4cd98a";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = active ? "#4cd98a" : "#ff9b5e";
      ctx.beginPath(); ctx.arc(x, y, active ? 6 : 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = active ? "bold 11px sans-serif" : "10.5px sans-serif";
      const labelY = idx === 1 ? y - 10 : idx === 0 ? y + 15 : y - 8; // offset Viking 1 & Pathfinder in Chryse/Ares
      ctx.fillText(r.name.replace(" Rover", "").replace(" Lander", ""), Math.min(W - 115, Math.max(8, x - 24)), labelY);
    });

    cv.onclick = function (ev) {
      const rect = cv.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      const my = ((ev.clientY - rect.top) / rect.height) * Hc;
      let best = -1, bestD = 999;
      NSSDCA_RECORDS.forEach((r, idx) => {
        const lon180 = r.lonE > 180 ? r.lonE - 360 : r.lonE;
        const x = ((lon180 + 180) / 360) * W;
        const y = ((90 - r.lat) / 180) * Hc;
        const d = Math.hypot(mx - x, my - y);
        if (d < bestD) { bestD = d; best = idx; }
      });
      if (best >= 0 && bestD < 45) window.openNSSDCAArchive(best);
    };
  }

  /* ---------- 9. FINAL MISSION REPORT GENERATOR (REFLECTION & PROGRESS EXPORT) ---------- */
  function readMoonJournalSummary() {
    const names = { eagle: "Apollo 11 Eagle Descent Stage", lrv: "Apollo 15 LRV", surveyor: "Surveyor 3", experiments: "EASEP, ALSEP & Laser Reflectors" };
    try {
      const raw = JSON.parse(localStorage.getItem("btsm.moon.v1") || "null");
      const map = raw && raw.missions && typeof raw.missions === "object" ? raw.missions : (raw || {});
      return Object.keys(names).map((id) => {
        const rec = map && typeof map[id] === "object" ? map[id] : {};
        const done = !!rec.done && !!rec.postOk;
        const rub = rec.rubricScore ? `${rec.rubricScore.total}/6` : "—";
        return `<tr><td><b>${names[id]}</b></td><td>${rec.prePicked != null ? (rec.preOk ? "✔ 1/1" : "○ 0/1") : "—"}</td><td>${done ? "✔ Submitted for reflection" : (rec.labDone || rec.stage > 0 ? "In progress" : "Not started")}</td><td>${rec.postOk ? `✔ Transfer (${rub})` : "—"}</td></tr>`;
      }).join("");
    } catch {
      return Object.keys(names).map((id) => `<tr><td><b>${names[id]}</b></td><td>—</td><td>Not started</td><td>—</td></tr>`).join("");
    }
  }

  window.exportCombinedJournal = function () {
    let moon = null, soj = null;
    try { moon = JSON.parse(localStorage.getItem("btsm.moon.v1") || "null"); } catch {}
    try { soj = JSON.parse(localStorage.getItem("btsm.soj.state.v2") || "null"); } catch {}
    const payload = {
      exportedAt: new Date().toISOString(),
      explorer: window.getExplorerName(),
      note: "Submitted for reflection — practice checks and self-check rubrics are not validated learning gains.",
      mars: { profile: window.playerProfile, v4Tasks: window.v4TaskState, sojournerReport: soj },
      moon
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roverquest-learning-report.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  window.openFinalLearningReport = function () {
    const p = window.playerProfile;
    const name = window.getExplorerName();
    const machines = ["Sojourner", "Viking 1 Lander", "Spirit Rover", "Opportunity Rover", "InSight Lander"];
    let preTotal = 0, postTotal = 0, preCount = 0, postCount = 0;

    let sojNote = "";
    try {
      const sojRaw = JSON.parse(localStorage.getItem("btsm.soj.state.v2") || "null");
      const s = sojRaw && sojRaw.state ? sojRaw.state : sojRaw;
      if (s && s.submitted) {
        const rubricCount = s.checkedObs && s.checkedObs.length ? s.checkedObs.length : 0;
        sojNote = ` · Report submitted for reflection (${rubricCount}/2 observation tags)`;
      }
    } catch {}

    const rows = machines.map((m) => {
      const pre = p.preQuiz[m];
      const post = p.postQuiz[m];
      const taskDone = typeof interactionState !== "undefined" && !!interactionState.completedTasks[m];
      if (pre) { preCount++; preTotal += pre.ok; }
      if (post) { postCount++; postTotal += post.ok; }
      return `
        <tr>
          <td><b>${m}</b></td>
          <td>${pre ? (pre.ok ? "✔ 1/1" : "○ 0/1") : "—"}</td>
          <td>${taskDone ? "✔ Completed" + (m === "Sojourner" ? sojNote : "") : "Pending"}</td>
          <td>${post ? (post.ok ? "✔ 1/1" : "○ 0/1") : "—"}</td>
        </tr>
      `;
    }).join("");

    dl(`
      <div class="top">
        <span>📜 PERSONAL MISSION REPORT · EXPLORER ${name.toUpperCase()}</span>
        <span style="color:#4cd98a">SUBMITTED FOR REFLECTION</span>
      </div>
      <p style="font-size:13px">
        <b>Mars Practice Checks (Diagnostic Pre vs Transfer Post):</b> Pre: <b>${preTotal}/${preCount || 0}</b> · Post: <b>${postTotal}/${postCount || 0}</b> · Hints Viewed: <b>${p.hintsUsed || 0}</b>
      </p>
      <table class="nssdca-table">
        <thead>
          <tr><th>Mars Mission</th><th>Diagnostic Pre</th><th>Investigation</th><th>Transfer Post</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:13px;margin:10px 0 6px"><b>Moon Chapter Journal Summary (Saved Locally):</b></p>
      <table class="nssdca-table">
        <thead>
          <tr><th>Moon Story</th><th>Diagnostic Pre</th><th>Status</th><th>Transfer &amp; Rubric</th></tr>
        </thead>
        <tbody>${readMoonJournalSummary()}</tbody>
      </table>
      <div class="tag-note" style="margin-top:10px">
        <b>Submitted for reflection — not validated learning scores.</b> Pre-checks ask a baseline diagnostic question; post-checks ask a distinct transfer scenario. No formal classroom study has been completed yet.
      </div>
      <div class="bar" style="margin-top:12px">
        <button type="button" onclick="window.openNSSDCAArchive()">🗺️ NASA NSSDCA Archive</button>
        <button type="button" onclick="window.exportCombinedJournal()">⬇ Export JSON Report</button>
        <button type="button" onclick="window.print()" style="background:#4cd98a;color:#111;font-weight:bold">🖨️ Print / Save PDF</button>
      </div>
    `);
  };

  /* ---------- 10. HOOKS & OVERRIDES INTO EXISTING V3 RUNTIME ---------- */
  function installV4Hooks() {
    buildTarsWidget();
    buildProfileModal();

    // Personalization is optional; chapter navigation opens in mars-polish.js.

    // Add "NASA Archive & Map" and "Mission Report" buttons to top-right control bar (#ctl)
    const ctl = document.getElementById("ctl");
    if (ctl && !document.getElementById("v4-archive-btn")) {
      const anchor = document.getElementById("bb") ? document.getElementById("bb").nextSibling : ctl.firstChild;
      const archBtn = document.createElement("button");
      archBtn.type = "button";
      archBtn.id = "v4-archive-btn";
      archBtn.innerHTML = "🗺️ NASA Archive";
      archBtn.onclick = () => window.openNSSDCAArchive();
      ctl.insertBefore(archBtn, anchor);

      const repBtn = document.createElement("button");
      repBtn.type = "button";
      repBtn.id = "v4-report-btn";
      repBtn.innerHTML = "📊 Learning Report";
      repBtn.onclick = () => window.openFinalLearningReport();
      ctl.insertBefore(repBtn, anchor);
    }

    // 10A. Fix Science Fact-Check strings in MC / STATUS / SCANFACT
    if (typeof STATUS !== "undefined") {
      STATUS["Viking 1 Lander"] = "CONTACT LOST Nov 11, 1982 (Sol 2245) after a faulty battery-charging command. NSSDCA ID: 1975-075C. Resting at 22.483°N, 47.94°W on Chryse Planitia.";
      STATUS["Sojourner"] = "FINAL DATA TRANSMISSION Sept 27, 1997 (Sol 83) after loss of the lander communications link; exact cause uncertain. NSSDCA ID: 1996-068A. Landing region at 19.33°N, 33.55°W in Ares Vallis.";
      STATUS["Spirit Rover"] = "LAST COMMUNICATION Mar 22, 2010 (concluded May 25, 2011) after becoming embedded in soft sulfate-rich soil on May 1, 2009. NSSDCA ID: 2003-027A (14.569°S, 175.473°E).";
      STATUS["Opportunity Rover"] = "LAST CONTACT Jun 10, 2018 during a severe Mars-wide dust storm (End of Mission Feb 13, 2019; 45.16 km driven). NSSDCA ID: 2003-032A (1.948°S, 354.474°E).";
      STATUS["InSight Lander"] = "LAST CONTACT Dec 15, 2022 (concluded Dec 21, 2022) after dust coated its solar arrays; 1,319 marsquakes recorded. NSSDCA ID: 2018-042A (4.502°N, 135.623°E).";
    }

    // 10B. Replace generic 3D rover()/lander() models on MC with authentic mission-specific 3D models
    if (typeof MC !== "undefined" && Array.isArray(MC) && typeof mr !== "undefined") {
      const customBuilders = {
        "Sojourner": window.buildSojourner,
        "Viking 1 Lander": window.buildViking1,
        "Spirit Rover": window.buildSpirit,
        "InSight Lander": window.buildInSight
      };
      MC.forEach((m) => {
        // Fix InSight 2.4m -> 1.8m arm description & Spirit March 2007 -> 2007 (2007 discovery)
        if (m.n === "InSight Lander" && m.interaction && m.interaction.hotspots) {
          m.interaction.hotspots.forEach((h) => {
            if (h.key === "roboticArm") {
              h.simple = "A robotic arm 1.8 meters (5.9 feet) long, with a grapple on its end, that lifted SEIS off the lander deck and set it on the Martian soil.";
            }
          });
        }
        if (customBuilders[m.n]) {
          m.b = customBuilders[m.n];
          if (m.g) {
            const pos = m.g.position.clone();
            const rotY = m.g.rotation.y;
            mr.remove(m.g);
            m.g = m.b();
            m.g.position.copy(pos);
            m.g.rotation.y = rotY;
            mr.add(m.g);
          }
        }
      });
    }

    // 10C. Wrap openStageTask to trigger Diagnostic Pre-Check first, restore 3D deployed props, and show simulations
    if (typeof window.openStageTask === "function" && !window._origOpenStageTask) {
      window._origOpenStageTask = window.openStageTask;
      window.openStageTask = function () {
        tarsHintLevel = 0;
        const m = curM;
        if (m && m.n === "InSight Lander" && window.v4TaskState && window.v4TaskState.ins) {
          m.seisDeployed = !!window.v4TaskState.ins.seisDown;
        }
        if (m && !window.playerProfile.preQuiz[m.n]) {
          window.openAssessmentModal(m.n, "pre", () => window._origOpenStageTask());
          return;
        }
        window._origOpenStageTask();
      };
    }

    // 10D. mars-polish.js provides the single unified Post-Check button in Stage 3 / Hub (avoid duplicate buttons)

    // 10E. Upgrade renderTaskUI for Viking 1, Spirit, and InSight with authentic NASA evidence, disclosures & replay
    if (typeof window.renderTaskUI === "function" && !window._origRenderTaskUI) {
      window._origRenderTaskUI = window.renderTaskUI;
      window.renderTaskUI = function () {
        if (!curM || curM.n === "Opportunity Rover") {
          return window._origRenderTaskUI();
        }
        const m = curM;
        let body = "";
        let extraBtns = "";

        if (m.n === "Sojourner") {
          return window._origRenderTaskUI();
        } else if (m.n === "Viking 1 Lander") {
          const v = window.v4TaskState.vik;
          const steps = ["1 Excavate Trench", "2 200°C / 500°C GCMS Pyrolysis", "3 Evaluate Perchlorate Evidence"].map((t, i) =>
            `<span style="opacity:${i === v.phase ? 1 : 0.5};${i === v.phase ? "color:#ff9b5e" : ""}">${i < v.phase ? "✔ " : ""}${t}</span>`
          ).join(" · ");
          body = `<div class="sim-box"><div class="sim-hdr"><span>VIKING 1 · CHRYSE PLANITIA GCMS PYROLYSIS (TEACHING SIMULATION)</span><span>${steps}</span></div>`;
          body += `<div style="margin:4px 0 6px;padding:6px 10px;border-radius:6px;background:rgba(255,209,102,.12);border:1px solid rgba(255,209,102,.4);font-size:11.5px;color:#ffd166"><b>🧪 SYNTHETIC TEACHING SIMULATION — NOT RAW NASA TELEMETRY:</b> The 200°C / 500°C oven buttons and gas summary are simplified teaching steps paired with real Viking 1 trench photograph <b>PIA00389</b>.</div>`;
          body += `<div style="margin:4px 0 8px;padding:6px 10px;border-radius:6px;background:rgba(102,204,255,.08);border:1px solid rgba(102,204,255,.28);font-size:11.5px;color:#cfe6ff"><b>📖 Quick Science Terms (Ages 10–16):</b> <b>GCMS</b> = Gas Chromatograph Mass Spectrometer (bakes soil and sniffs the gases released) · <b>Organics</b> = carbon-based molecules · <b>Perchlorate (ClO₄⁻)</b> = a reactive salt in Martian soil that can burn up carbon when heated.</div>`;
          body += `<figure style="margin:6px 0 8px"><img src="assets/hardware/viking-1-lander/evidence_trench-PIA00389.jpg" alt="Viking 1 sample trench dug into Chryse Planitia soil" style="max-height:130px;width:100%;object-fit:cover;border-radius:6px;border:1px solid #2b3c56"><figcaption style="font-size:11px;color:#9eb3d0;margin-top:3px">Authentic NASA Evidence (PIA00389): Viking 1 Lander sample trench in Chryse Planitia. Trenching exposed soil below the sunlit surface crust for GCMS thermal analysis.</figcaption></figure>`;
          if (v.phase === 0) {
            body += `<p style="font-size:13px"><b>Science Question:</b> Does Martian soil contain organic carbon molecules? Command the retractable sampler boom:</p>
              <div class="rg">
                <button type="button" class="opt" onclick="window.vikScoop('uv_surface')"><b>Skim Top 1 mm Dust Crust</b><br><small>Directly exposed to solar UV &amp; oxidants</small></button>
                <button type="button" class="opt" onclick="window.vikScoop('subsurface')"><b>Collect a Subsurface Sample</b><br><small>Compare exposure conditions; depth is simplified</small></button>
              </div>`;
          } else if (v.phase === 1) {
            body += `<p style="font-size:13px">Operate the <b>Gas Chromatograph Mass Spectrometer (GCMS)</b> thermal volatilization oven in sequence:</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
                <button type="button" onclick="window.vikHeatOven(200)">Teaching step 1: Heat to 200°C ${v.temp >= 200 ? "✔" : ""}</button>
                <button type="button" onclick="window.vikHeatOven(500)">Teaching step 2: Heat to 500°C ${v.temp >= 500 ? "✔" : ""}</button>
              </div>`;
          } else {
            body += `<p style="font-size:13px"><b>Schematic Teaching Summary (not flight telemetry):</b> Heated soil released H₂O, CO₂, and trace chlorinated hydrocarbons without detecting complex indigenous organics. Knowing later Phoenix (2008) polar soil measurements of <b>perchlorate salts (ClO₄⁻)</b>, what is the strongest scientific conclusion?</p>
              <button type="button" class="opt" onclick="window.vikSubmitHyp(0)">The chloromethane proves living bacteria are breathing chlorine on Chryse Planitia today.</button>
              <button type="button" class="opt" onclick="window.vikSubmitHyp(1)">Heating can alter or destroy organics in perchlorate-bearing soil. Later lab studies complicate Viking's interpretation without proving life or directly measuring perchlorate at the Viking site.</button>
              <button type="button" class="opt" onclick="window.vikSubmitHyp(2)">Mars has never received even a single carbon atom from meteorites.</button>`;
          }
          body += `<div class="tag-note" style="margin-top:8px"><b>What we simplified:</b> Real Viking soil ovens used multiple stepped temperatures, gas chromatography columns, and isotope reference standards; Phoenix later detected perchlorate at a different latitude, so perchlorate at Viking 1 is inferred rather than directly measured there.</div>`;
          if (v.msg) body += `<div class="fb" style="margin-top:8px">${v.msg}</div>`;
          body += `</div>`;
          if (v.phase > 0 || v.depth) extraBtns = `<button type="button" onclick="window.v4RestartTask('Viking 1 Lander')">↺ Restart / Replay</button>`;
        } else if (m.n === "Spirit Rover") {
          const sp = window.v4TaskState.spi;
          const steps = ["1 Expose Subsurface", "2 Mini-TES & APXS Scan", "3 Hydrothermal Interpretation"].map((t, i) =>
            `<span style="opacity:${i === sp.phase ? 1 : 0.5};${i === sp.phase ? "color:#ff9b5e" : ""}">${i < sp.phase ? "✔ " : ""}${t}</span>`
          ).join(" · ");
          body = `<div class="sim-box"><div class="sim-hdr"><span>SPIRIT · HOME PLATE SILICA &amp; RAT INVESTIGATION (TEACHING SIMULATION)</span><span>${steps}</span></div>`;
          body += `<div style="margin:4px 0 6px;padding:6px 10px;border-radius:6px;background:rgba(255,209,102,.12);border:1px solid rgba(255,209,102,.4);font-size:11.5px;color:#ffd166"><b>🧪 SYNTHETIC TEACHING SIMULATION — NOT RAW NASA TELEMETRY:</b> The RAT abrasion steps and ~91 wt% silica summary are simplified teaching steps paired with real Spirit wheel-trench photograph <b>PIA12312</b>.</div>`;
          body += `<div style="margin:4px 0 8px;padding:6px 10px;border-radius:6px;background:rgba(102,204,255,.08);border:1px solid rgba(102,204,255,.28);font-size:11.5px;color:#cfe6ff"><b>📖 Quick Science Terms (Ages 10–16):</b> <b>RAT</b> = Rock Abrasion Tool (diamond grinding brush on the arm) · <b>Opaline Silica</b> = a bright mineral left behind by hot water or volcanic steam · <b>Hydrothermal</b> = heated water moving through volcanic rock.</div>`;
          body += `<figure style="margin:6px 0 8px"><img src="assets/hardware/spirit-rover/wheels-PIA12312.jpg" alt="Spirit wheel trench in bright silica-rich Martian soil" style="max-height:130px;width:100%;object-fit:cover;border-radius:6px;border:1px solid #2b3c56"><figcaption style="font-size:11px;color:#9eb3d0;margin-top:3px">Authentic NASA Evidence (PIA12312 / MER): Spirit's dragged right-front wheel carved a trench near Home Plate, exposing bright subsurface silica-rich soil.</figcaption></figure>`;
          if (sp.phase === 0) {
            body += `<p style="font-size:13px"><b>Science Question:</b> Did hot volcanic water once alter rocks near Home Plate in Gusev Crater? Expose unaltered subsurface soil:</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
                <button type="button" onclick="window.spiAction('coat')">Scan Unbrushed Dusty Rock Rind</button>
                <button type="button" onclick="window.spiAction('rat')">Grind 5 mm with RAT (${sp.abraded.toFixed(1)}/5.0 mm)</button>
                <button type="button" onclick="window.spiAction('trench')">Inspect the 2007 Dragged-Wheel Trench</button>
              </div>`;
          } else if (sp.phase === 1) {
            body += `<p style="font-size:13px">Bright white subsurface soil is exposed! Compare published <b>Mini-TES</b> thermal infrared emissivity and <b>APXS</b> chemistry findings:</p>
              <button type="button" onclick="window.spiAction('scan')">Compare Mini-TES + APXS Summary ▸</button>`;
          } else {
            body += `<p style="font-size:13px"><b>Published Composition (Squyres et al. 2008):</b> <b>~91 wt% amorphous opaline silica (SiO₂·nH₂O)</b> with titanium enrichment. How do geologists interpret this deposit?</p>
              <button type="button" class="opt" onclick="window.spiSubmitHyp(0)">Ocean waves sorted quartz beach sand for billions of years.</button>
              <button type="button" class="opt" onclick="window.spiSubmitHyp(1)">Past hydrothermal water or acidic volcanic steam (fumaroles) leached mobile elements and left concentrated opaline silica — a habitability clue, not proof of past life.</button>
              <button type="button" class="opt" onclick="window.spiSubmitHyp(2)">Winter frost froze carbon dioxide gas into white dry ice.</button>`;
          }
          body += `<div class="tag-note" style="margin-top:8px"><b>What we simplified:</b> You compare published ~91 wt% silica conclusions rather than inverting raw Mini-TES thermal infrared spectra or fitting APXS alpha/X-ray peaks.</div>`;
          if (sp.msg) body += `<div class="fb" style="margin-top:8px">${sp.msg}</div>`;
          body += `</div>`;
          if (sp.phase > 0 || sp.abraded > 0 || sp.site) extraBtns = `<button type="button" onclick="window.v4RestartTask('Spirit Rover')">↺ Restart / Replay</button>`;
        } else if (m.n === "InSight Lander") {
          const ins = window.v4TaskState.ins;
          const steps = ["1 Deploy SEIS & WTS", "2 Pick P & S Wave Arrivals", "3 Infer Liquid Core"].map((t, i) =>
            `<span style="opacity:${i === ins.phase ? 1 : 0.5};${i === ins.phase ? "color:#ff9b5e" : ""}">${i < ins.phase ? "✔ " : ""}${t}</span>`
          ).join(" · ");
          body = `<div class="sim-box"><div class="sim-hdr"><span>INSIGHT · SEIS MARSQUAKE &amp; INTERIOR STRUCTURE (TEACHING SIMULATION)</span><span>${steps}</span></div>`;
          body += `<div style="margin:4px 0 6px;padding:6px 10px;border-radius:6px;background:rgba(255,209,102,.12);border:1px solid rgba(255,209,102,.4);font-size:11.5px;color:#ffd166"><b>🧪 SYNTHETIC TEACHING SIMULATION — NOT RAW NASA TELEMETRY:</b> The 0–90 s waveform below is a clean schematic teaching trace (P onset ~22 s, S onset ~58 s) paired with real SEIS photograph <b>PIA23177</b>.</div>`;
          body += `<div style="margin:4px 0 8px;padding:6px 10px;border-radius:6px;background:rgba(102,204,255,.08);border:1px solid rgba(102,204,255,.28);font-size:11.5px;color:#cfe6ff"><b>📖 Quick Science Terms (Ages 10–16):</b> <b>P-Wave</b> = primary push-pull seismic wave (travels fastest, passes through solids &amp; liquids) · <b>S-Wave</b> = secondary side-to-side shear wave (slower, <i>blocked by liquids</i>) · <b>WTS</b> = Wind &amp; Thermal Shield dome.</div>`;
          body += `<figure style="margin:6px 0 8px"><img src="assets/hardware/insight/instrument-PIA23177.jpg" alt="InSight SEIS seismometer covered by its white Wind and Thermal Shield on Mars" style="max-height:130px;width:100%;object-fit:cover;border-radius:6px;border:1px solid #2b3c56"><figcaption style="font-size:11px;color:#9eb3d0;margin-top:3px">Authentic NASA Evidence (PIA23177): SEIS placed on Elysium Planitia soil under its domed Wind &amp; Thermal Shield (WTS) to cut wind and thermal noise.</figcaption></figure>`;
          if (ins.phase === 0) {
            body += `<p style="font-size:13px"><b>Science Question:</b> How did InSight measure Mars's internal layers? Deploy the seismometer with the 1.8 m IDA arm:</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">
                <button type="button" onclick="window.insStep('seis')">1. Grapple &amp; Place SEIS on Soil (${ins.seisDown ? "✔ Placed" : "On Deck"})</button>
                <button type="button" onclick="window.insStep('noisy')">Record Without Wind Shield</button>
                <button type="button" onclick="window.insStep('wts')">2. Lower Wind &amp; Thermal Shield (WTS) (${ins.wtsDown ? "✔ Shielded" : "Stowed"})</button>
              </div>`;
          } else if (ins.phase === 1) {
            body += `<p style="font-size:13px">Align the <b>P-Wave</b> (fast compressional onset ~22 s) and <b>S-Wave</b> (larger shear onset ~58 s) markers on this <b>synthetic teaching waveform</b> (schematic trace, not real event S0976a):</p>
              <canvas id="insWaveCanvas" width="620" height="140" aria-label="Synthetic marsquake waveform showing P and S wave picks" style="width:100%;border:1px solid #4cd98a66;border-radius:4px"></canvas>
              <div class="v4-grid2" style="margin:6px 0">
                <label style="font-size:12px">P-Wave Arrival: <b>${ins.pPick} s</b> <input type="range" min="5" max="45" value="${ins.pPick}" oninput="window.insStep('pickP', this.value)" style="width:100%"></label>
                <label style="font-size:12px">S-Wave Arrival: <b>${ins.sPick} s</b> <input type="range" min="35" max="85" value="${ins.sPick}" oninput="window.insStep('pickS', this.value)" style="width:100%"></label>
              </div>
              <button type="button" onclick="window.insStep('verifyPick')">Lock P–S Arrival Picks ▸</button>`;
          } else {
            body += `<p style="font-size:13px"><b>Published Seismic Summary (Stähler et al. 2021; 2023 revisions):</b> Across its mission, InSight logged <b>1,319 marsquakes</b>; selected distant events showed core-reflected <i>ScS</i> waves and an S-wave shadow zone. What do those observations support?</p>
              <button type="button" class="opt" onclick="window.insStep('hyp', 0)">Mars has a completely solid frozen iron core.</button>
              <button type="button" class="opt" onclick="window.insStep('hyp', 1)">Because shear (S) waves do not propagate through liquid, seismic models support a liquid iron-alloy core beneath the mantle (exact radius depends on interior models, later revised for a basal molten silicate layer).</button>
              <button type="button" class="opt" onclick="window.insStep('hyp', 2)">Mars is hollow inside.</button>`;
          }
          body += `<div class="tag-note" style="margin-top:8px"><b>What we simplified:</b> The waveform shown is a clean synthetic trace without Martian wind glitches or velocity-model inversion. Real core-size estimates depend on assumed mantle composition and a possible basal molten silicate layer.</div>`;
          if (ins.msg) body += `<div class="fb" style="margin-top:8px">${ins.msg}</div>`;
          body += `</div>`;
          if (ins.phase > 0 || ins.seisDown) extraBtns = `<button type="button" onclick="window.v4RestartTask('InSight Lander')">↺ Restart / Replay</button>`;
        }

        dl(`
          <div class="top">
            <span>STAGE 3 — SCIENTIFIC INVESTIGATION · ${m.n.toUpperCase()}</span>
            <span style="color:#4cd98a">🤖 CLICK TARS FOR HINTS</span>
          </div>
          ${typeof stageBarHTML === "function" ? stageBarHTML(m, "task") : ""}
          ${body}
          <div class="bar">
            <button type="button" onclick="openMachineHub(curM)">◂ Back to Hub</button>
            ${extraBtns}
            <button type="button" onclick="window.tarsGiveHint()">💡 Ask TARS for a Hint</button>
          </div>
        `);
        if (m.n === "InSight Lander" && window.v4TaskState.ins.phase === 1) {
          setTimeout(drawInSightSeismogram, 30);
        }
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(installV4Hooks, 120));
  } else {
    setTimeout(installV4Hooks, 120);
  }
})();