/* ============================================================================
   RoverQuest — Moon world sites (rq-sites-moon.js)
   The 4 Apollo-era machines you can walk up to on the Moon
   (mars.html?world=moon): data, 3D models and their mini-games.
   ============================================================================ */
(function () {
  "use strict";
  const RQ = window.RQ;
  if (!RQ || !RQ.gfx || !RQ.site || !RQ.W || RQ.W.id !== "moon") return;
  const { esc, clamp, rr, txt, space, fit, gauge, shuffle, sfx, M3 } = RQ.gfx;
  const ME = RQ.me;
  const G = (RQ.games = RQ.games || {});
  const MOONBG = ["#03050a", "#151922"];

  const NSSDC = "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=";
  const DRAW = {
    eag: '<path d="M145 190L95 250M255 190L305 250M170 190L155 255M230 190L245 255" stroke="#d4c09b" stroke-width="7"/><path d="M130 140L165 120H240L270 145V195H130Z" fill="#b7954e"/><path d="M95 250h20M285 250h20" stroke="#d4c09b" stroke-width="6"/><path d="M330 255V170" stroke="#ddd" stroke-width="3"/><rect x="330" y="170" width="38" height="24" fill="#c9d3e0"/>',
    lrv: '<path d="M95 210H300L270 165H135Z" fill="#b9ad80"/><g fill="#171d24" stroke="#bdc9d4" stroke-width="4"><circle cx="120" cy="222" r="28"/><circle cx="275" cy="222" r="28"/></g><path d="M155 160v-45h40v45m15 0v-45h40v45M278 165V70" stroke="#c6d5df" stroke-width="6" fill="none"/><ellipse cx="278" cy="65" rx="25" ry="14" fill="none" stroke="#c6d5df" stroke-width="3"/>',
    sur: '<path d="M200 110L110 250M200 110L295 250M200 150V255" stroke="#d4c09b" stroke-width="6"/><path d="M145 190H255L200 115Z" fill="none" stroke="#b9a566" stroke-width="5"/><path d="M200 120V55H245V90H200M180 190L130 200L90 230" stroke="#c2d0dc" fill="none" stroke-width="7"/><rect x="165" y="30" width="70" height="25" fill="#47638c"/>',
    llr: '<path d="M40 10L196 205" stroke="#46e0b0" stroke-width="3" stroke-dasharray="9 6"/><path d="M60 10L214 205" stroke="#46e0b0" stroke-width="2" stroke-dasharray="4 8" opacity=".6"/><path d="M140 190H265L245 240H120Z" fill="#b7c4d0"/><g fill="#39546c">' + Array.from({ length: 12 }, (_, i) => `<rect x="${142 + (i % 4) * 25}" y="${198 + Math.floor(i / 4) * 13}" width="17" height="9"/>`).join("") + "</g>",
  };
  function art(id) {
    let stars = "";
    for (let i = 0; i < 40; i++) stars += `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 200}" r="${i % 5 ? 0.9 : 1.6}" fill="#fff" opacity="${0.35 + (i % 4) * 0.15}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 290"><rect width="400" height="290" fill="#05070d"/>${stars}<circle cx="340" cy="52" r="22" fill="#2c6fb5"/><path d="M326 46q10-8 20 0q5 10-4 15q-12 1-16-15z" fill="#3f8a3c"/><path d="M0 238Q200 218 400 238V290H0Z" fill="#6b6f75"/><ellipse cx="80" cy="262" rx="40" ry="7" fill="#585c62"/><ellipse cx="330" cy="275" rx="52" ry="8" fill="#585c62"/>${DRAW[id] || ""}</svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  const MOON = [
    {
      id: "eag", short: "Eagle", name: "Eagle’s descent stage", mission: "Apollo 11", yr: "1969", site: "Sea of Tranquility", record: "1969-059C",
      role: "Lunar Module lower stage", icon: "🦅",
      voice: "I carried two explorers to a world no one had walked on. My lower half became their launch pad. That part of me never came home.",
      status: "The descent stage is still at Tranquility Base, with its legs, engine and a plaque. The ascent stage lifted off from it on July 21, 1969.",
      found: {
        explorer: "On July 21, 1969, the top half of Eagle blasted off. The bottom half stayed on the Moon, and it is still there today.",
        scientist: "Apollo 11’s Lunar Module had two stages. On July 21, 1969, the ascent stage fired its own engine and lifted off from the descent stage, which stayed at Tranquility Base with its legs, engine, empty tanks and a plaque.",
      },
      means: {
        explorer: "Leaving the heavy bottom half behind meant the rocket needed much less fuel to get back up.",
        scientist: "Every kilogram lifted off the Moon costs fuel. Using the descent stage as a launch pad meant the small ascent engine only had to lift the cabin, the crew and about 21.5 kg of samples into lunar orbit.",
      },
      deep: "The stages separated with explosive bolts and a cable cutter. The ascent engine then burned for about 7 minutes to reach orbit and meet Columbia. Plans for bringing samples back from Mars use the same idea: a small rocket that launches off a lander.",
      sort: [
        ["Apollo 11’s ascent stage lifted off and left the descent stage on the Moon.", 0, "Photos and mission logs recorded it. That's an observation."],
        ["Leaving the descent stage behind saved fuel for the trip to orbit.", 1, "It explains why the design worked. That's an interpretation."],
        ["The Apollo 11 crew brought about 21.5 kg of Moon rock and soil back to Earth.", 0, "A measured amount is an observation."],
        ["Splitting a lander into two stages is a smart design for coming home from other worlds.", 1, "A general lesson drawn from the evidence is an interpretation."],
      ],
      restore: { q: "Why did Apollo 11 build Eagle with two stages instead of one?", o: [["So the top part didn’t have to lift heavy legs and empty tanks back into orbit.", ""], ["Because Moon dust glued the landing legs to the ground.", "The legs weren't stuck. They were left on purpose to save fuel."], ["So the astronauts could leave the Command Module on the Moon.", "The Command Module, Columbia, stayed in orbit the whole time."]], a: 0 },
      final: { icon: "🦅", t: "Lift off with less fuel", q: "Your ship's heavy landing frame is bent, but the cabin is fine. You want to lift off using as little fuel as possible. What would Eagle do?", o: [["Leave the heavy landing frame behind and launch only the light upper part.", ""], ["Take everything with you. Never leave parts behind.", "Every extra kilogram needs extra fuel to lift off."], ["Launch the landing frame and leave the cabin.", "The cabin holds the crew. It's the part that has to fly."]], a: 0, ok: "That's Apollo 11's staging trick: Eagle's descent stage stayed on the Moon as a launch pad." },
      slide: { ttl: "Eagle · Apollo 11 · 1969", sub: "Left its lower half behind to save fuel" },
      line: "Eagle showed that leaving heavy parts behind gets you home on less fuel.",
    },
    {
      id: "lrv", short: "Lunar Rover", name: "The parked lunar rover", mission: "Apollo 15", yr: "1971", site: "Hadley–Apennine", record: "1971-063C",
      role: "First crewed rover", icon: "🚙",
      voice: "I was the first car on another world. My crew trusted me, but they never drove farther than they could walk back. I am still parked where they left me.",
      status: "Apollo 15’s Lunar Roving Vehicle is still parked at Hadley–Apennine. Its TV camera, steered from Earth, broadcast the crew’s liftoff.",
      found: {
        explorer: "In 1971, Apollo 15 astronauts drove the first car on the Moon. They drove about 28 km and found a very old white rock.",
        scientist: "Apollo 15’s Lunar Roving Vehicle carried Dave Scott and Jim Irwin about 28 km across the Hadley–Apennine region in three drives. At Spur crater they collected an ancient white rock later nicknamed the ‘Genesis Rock’.",
      },
      means: {
        explorer: "With a rover, astronauts could reach many more places. But they always stayed close enough to walk home if it broke.",
        scientist: "The rover let the crew sample far more kinds of rock than walking allowed. Every drive was planned inside a walk-back limit, so the crew could get back on foot if the rover failed.",
      },
      deep: "The rover ran on two 36-volt silver-zinc batteries that could not be recharged. It folded up to ride on the side of the Lunar Module and weighed about 210 kg on Earth. Three of these rovers are still parked on the Moon, from Apollo 15, 16 and 17.",
      sort: [
        ["Apollo 15’s rover drove about 28 km across the Hadley–Apennine region.", 0, "The rover's distance was measured. That's an observation."],
        ["The crew picked up an ancient white rock at Spur crater.", 0, "Finding and photographing a rock is an observation."],
        ["The ‘Genesis Rock’ is probably a piece of the Moon’s very early crust.", 1, "'Probably' explains where it came from. That's an interpretation."],
        ["A rover lets astronauts study many more kinds of rock than walking would.", 1, "A reasoned conclusion is an interpretation."],
      ],
      restore: { q: "Apollo 15 planned every drive with a ‘walk-back limit’. What does that mean?", o: [["Never drive farther than you could safely walk back to the lander.", ""], ["Push the rover back to the lander after every drive.", "The rover drove itself back. The limit was about the crew's safety."], ["Only ever drive backwards.", "The rover drove forwards. The limit was about distance."]], a: 0 },
      final: { icon: "🚙", t: "Plan a safe drive", q: "You want to drive a rover to a crater far from your ship. Which rule kept Apollo 15's crew safe?", o: [["Only drive as far as you could walk back if the rover broke.", ""], ["Drive as far as the batteries allow.", "If the rover broke down out there, you'd be stranded."], ["Always visit the farthest crater first.", "Distance isn't the goal. A safe return is."]], a: 0, ok: "That's the walk-back limit Apollo 15 planned every drive around." },
      slide: { ttl: "Lunar Rover · Apollo 15 · 1971", sub: "28 km driven · the walk-back rule" },
      line: "Apollo 15's rover taught us never to drive farther than you can walk back.",
    },
    {
      id: "sur", short: "Surveyor 3", name: "Surveyor 3: the scout", mission: "Surveyor 3 · Apollo 12", yr: "1967", site: "Ocean of Storms", record: "1967-035A",
      role: "Robotic lunar scout", icon: "🛰️",
      voice: "I landed alone in 1967 and dug into the soil to see if people could follow. Two and a half years later, they did. They walked right up to me and took my camera home.",
      status: "Surveyor 3 is silent in the Ocean of Storms. Apollo 12 brought its TV camera, scoop and some cables back to Earth in 1969.",
      found: {
        explorer: "Surveyor 3 landed on the Moon in 1967 and dug into the soil with a scoop. Two and a half years later, Apollo 12 astronauts landed nearby, walked over and took its camera home.",
        scientist: "Surveyor 3 landed in the Ocean of Storms in April 1967, bouncing before it settled, and used its scoop to dig trenches that tested the soil. In November 1969, Apollo 12 landed about 180 m away. Pete Conrad and Alan Bean walked over and removed its TV camera, scoop, and pieces of cable and tubing.",
      },
      means: {
        explorer: "The soil was firm enough for people to land. And the returned parts showed scientists how things change after years on the Moon.",
        scientist: "Surveyor’s trenches showed the soil could hold up a crewed lander. The returned parts let engineers measure how 31 months of sunlight, dust and extreme temperatures changed real spacecraft materials.",
      },
      deep: "Apollo 12 also proved pinpoint landing. Intrepid touched down close enough for a short walk, which was vital for planning later landings at exact science targets. Surveyor 3’s camera is now at the Smithsonian’s National Air and Space Museum.",
      sort: [
        ["Surveyor 3’s scoop dug trenches in the lunar soil.", 0, "Its camera photographed the trenches. That's an observation."],
        ["Apollo 12 landed about 180 m from Surveyor 3.", 0, "A measured distance is an observation."],
        ["The soil at this site is firm enough to hold up a crewed lander.", 1, "A conclusion drawn from the trench tests is an interpretation."],
        ["Every place on the Moon has soil exactly like this one.", 1, "That stretches one site to the whole Moon. It's an interpretation, and a risky one."],
      ],
      restore: { q: "Why did the Apollo 12 astronauts bring parts of Surveyor 3 back to Earth?", o: [["To study how materials changed after two and a half years on the Moon.", ""], ["Because Surveyor 3 was still working and needed repairs.", "Surveyor 3 had been silent since 1967."], ["To reuse its camera on the next mission.", "The parts went to labs for study, not back into space."]], a: 0 },
      final: { icon: "🛰️", t: "Check an old part", q: "You want to know how 2.5 years in space changed a part of your ship. What is the best evidence?", o: [["Bring the part back and test it in a lab, like Apollo 12 did with Surveyor 3.", ""], ["Guess from a photo taken before launch.", "An old photo can't show what changed afterwards."], ["Assume nothing changes in space.", "Sunlight, dust and temperature swings do change materials."]], a: 0, ok: "Returned hardware is direct evidence. Surveyor 3's camera showed how the Moon ages spacecraft." },
      slide: { ttl: "Surveyor 3 · 1967", sub: "Parts brought home by Apollo 12" },
      line: "Surveyor 3's camera came home so scientists could see how space changes materials.",
    },
    {
      id: "llr", short: "Laser mirrors", name: "Experiments that stayed", mission: "Apollo 11, 14, 15", yr: "1969–today", site: "Apollo landing sites", record: "1969-059C",
      role: "Laser retroreflectors", icon: "🔦",
      voice: "Not every quiet instrument is finished. My neighbours listened for moonquakes until they were switched off. My mirrors simply wait for a beam of light from Earth.",
      status: "Powered Apollo experiment stations (ALSEP) were switched off in 1977. The laser mirrors need no power and are still used today.",
      found: {
        explorer: "Apollo astronauts left special mirrors on the Moon. Scientists on Earth still shine lasers at them and time how long the light takes to come back.",
        scientist: "Apollo 11, 14 and 15 left laser retroreflectors made of corner-cube prisms. Observatories fire laser pulses at them and time the light that returns. The round trip takes about 2.5 seconds. The powered ALSEP experiment stations were switched off in 1977.",
      },
      means: {
        explorer: "Light goes there and back, so you halve the time to find the distance: about 384,000 km. The mirrors need no batteries, so they still work.",
        scientist: "Distance = speed of light × time ÷ 2. Decades of measurements show the Moon’s distance changes along its orbit and that the Moon is slowly drifting away from Earth, about 3.8 cm per year.",
      },
      deep: "A corner cube sends light straight back toward where it came from. Only a few photons from each huge laser pulse make it home, so stations add up many returns and correct for Earth’s atmosphere. The Apollo 11 seismometer worked for about three weeks. Later ALSEP stations listened for moonquakes until 1977.",
      sort: [
        ["Telescopes on Earth detect laser light coming back from the Apollo 11 mirror.", 0, "Detected light is an observation."],
        ["A laser pulse takes about 2.5 seconds to go there and back.", 0, "A timed measurement is an observation."],
        ["The mirrors still work because they need no power.", 1, "This explains why they work. That's an interpretation."],
        ["Apollo’s powered experiment stations were switched off in 1977.", 0, "A recorded event is an observation."],
      ],
      restore: { q: "The Apollo 11 laser mirror has no batteries. How does it still work?", o: [["Its corner-cube prisms bounce Earth’s laser light straight back.", ""], ["It makes its own laser light every night.", "All the lasers and clocks are on Earth. The mirror only reflects."], ["Astronauts recharge it by radio each year.", "It needs no power at all. That's why it still works."]], a: 0 },
      final: { icon: "🔦", t: "Measure a distance with light", q: "A laser pulse takes 2.56 s to reach a mirror and come back. Light travels about 300,000 km every second. How far away is the mirror?", o: [["About 384,000 km. You halve the round trip.", ""], ["About 768,000 km.", "That's the whole round trip. The light went there AND back."], ["About 117,000 km.", "Distance = speed × time. Don't divide the speed by the time."]], a: 0, ok: "Lunar laser ranging uses exactly that: speed of light × round-trip time ÷ 2." },
      slide: { ttl: "Apollo laser mirrors · since 1969", sub: "Still bouncing lasers back to Earth" },
      line: "Apollo's laser mirrors still measure the distance to the Moon, with no batteries.",
    },
  ];
  MOON.forEach((m) => (m.img = art(m.id)));

  /* ---------------------------------------------------------------- mini-games */
  /* ---------- A. EAGLE · Lighten & Lift ---------- */
  (function () {
    const ITEMS = [
      ["🦿", "Four landing legs", "stay", "Their job ended at touchdown. Lifting them again would waste fuel."],
      ["🔥", "Descent engine", "stay", "It slowed the landing. The ascent stage has its own engine."],
      ["🛢️", "Empty descent fuel tanks", "stay", "Empty tanks are just dead weight."],
      ["📡", "Experiment package", "stay", "Its seismometer and laser mirror were meant to stay and keep working on the Moon."],
      ["👩‍🚀", "Crew cabin + 2 astronauts", "fly", "The crew has to get home!"],
      ["🚀", "Ascent engine", "fly", "This engine lifts the cabin up to orbit."],
      ["🪨", "21.5 kg of Moon samples", "fly", "These rocks and soil were the science treasure of Apollo 11."],
    ];
    let s = null, sortedOnce = false;
    const flyUI = (api) => { api.ctrls(`<button type="button" class="rq-btn primary big" data-hold="BURN" style="touch-action:none;flex:1 1 260px">🔥 Hold to BURN</button>`); api.toast("Ascent stage ready. Hold <b>BURN</b> (or Space) to climb to Columbia!"); };
    const sortUI = (api) => { api.ctrls(`<button type="button" data-c="stay" style="flex:1 1 180px">🌙 Leave on the Moon</button><button type="button" data-c="fly" style="flex:1 1 180px">🚀 Take to orbit</button>`); };
    G.eag = {
      title: "Lighten & Lift", mission: "Apollo 11 · Eagle", icon: "🦅", bg: MOONBG,
      tagline: "Eagle has to leave the Moon. Decide what stays behind, then fly the ascent stage up to Columbia in orbit.",
      how: [["🌙", "Sort each part: <b>leave it on the Moon</b> or <b>take it to orbit</b> (← / → keys work too)."], ["🔥", "<b>Hold BURN</b> to climb. Moon gravity pulls you back down."], ["🎯", "Hover slowly inside the <b>green orbit band</b> for 2 seconds to dock."]],
      sci: "<b>The real thing:</b> On July 21, 1969, Eagle’s ascent stage fired its own engine and lifted off, using the descent stage as its launch pad. The descent stage, with its legs, engine, empty tanks and a plaque, is still at Tranquility Base.",
      photo: { src: art("eag"), cap: "Eagle’s descent stage at Tranquility Base (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        if (!s || s.phase === "sort") return ["Ask yourself: does this part still have a job after liftoff? If not, it stays.", "Landing hardware (legs, descent engine, its tanks) stays. People, the ascent engine and samples fly.", "Science instruments like the seismometer and laser mirror were <b>meant</b> to stay and keep working.", "Every kilogram you take needs extra fuel to lift."][Math.min(l, 3)];
        return ["Tap BURN in short bursts. Long burns overshoot the orbit band.", "Watch the speed number. In the green band, keep it between −5 and +5.", "Climb with one steady burn of about 3 seconds, then pulse gently.", "Falling? A short tap slows you. Rising too fast? Let go and let gravity slow you."][Math.min(l, 3)];
      },
      init(api) {
        const e = ME.ease();
        s = { api, phase: sortedOnce ? "fly" : "sort", items: shuffle(ITEMS.slice()), i: 0, mist: 0, anim: null, stay: [], go: [], t: 0, y: 0, v: 0, fuel: 100 * e, fuel0: 100 * e, burn: false, inBand: 0, over: false, lifted: false, stT: 0 };
        if (s.phase === "sort") { sortUI(api); api.stat(`<span>📦 0/${ITEMS.length} sorted</span>`); } else flyUI(api);
      },
      choose(k) {
        if (!s || s.phase !== "sort" || s.anim) return;
        const it = s.items[s.i];
        if (k === it[2]) { sfx().good(); s.anim = { k, t: 0, it }; s.api.toast("✅ " + it[3], "good"); }
        else { s.mist++; s.api.fail("❌ " + it[3]); }
      },
      ctrl(c) { this.choose(c); },
      hold(c, v) { if (c === "BURN" && s) s.burn = v; },
      key(code, down) {
        if (!s) return false;
        if (s.phase === "sort" && down) { if (code === "ArrowLeft") { this.choose("stay"); return true; } if (code === "ArrowRight") { this.choose("fly"); return true; } }
        if (code === "Space" || code === "ArrowUp" || code === "KeyW") { s.burn = down; return true; }
        return false;
      },
      update(dt, api) {
        s.t += dt;
        if (s.phase === "sort") {
          if (s.anim) {
            s.anim.t += dt * 2.4;
            if (s.anim.t >= 1) {
              (s.anim.k === "stay" ? s.stay : s.go).push(s.anim.it);
              s.anim = null; s.i++;
              api.stat(`<span>📦 ${s.i}/${ITEMS.length} sorted</span>`);
              if (s.i >= s.items.length) { sortedOnce = true; s.phase = "fly"; flyUI(api); }
            }
          }
          return;
        }
        const GR = 6, TH = 14, burning = s.burn && s.fuel > 0;
        s.v += ((burning ? TH : 0) - GR) * dt;
        if (burning) { s.fuel = Math.max(0, s.fuel - 12 * dt); s.lifted = true; }
        s.y += s.v * dt;
        if (s.y <= 0) { s.y = 0; if (s.v < 0) s.v = 0; }
        if (s.y > 100) { s.y = 100; if (s.v > 0) s.v = 0; if (!s.over) { s.over = true; api.fail("Too high! You shot past Columbia’s orbit. Ease off the burn."); } }
        else if (s.y < 94) s.over = false;
        const ok = s.y >= 78 && s.y <= 92 && Math.abs(s.v) < 5;
        s.inBand = ok ? s.inBand + dt : 0;
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>⛽ ${Math.round((s.fuel / s.fuel0) * 100)}%</span><span>↕ ${s.v >= 0 ? "+" : ""}${s.v.toFixed(1)}</span>`); }
        if (s.inBand >= 2) {
          const fl = s.fuel / s.fuel0, st = s.mist === 0 && fl > 0.35 && api.fails === 0 ? 3 : s.mist <= 1 && fl > 0.15 ? 2 : 1;
          api.win({ stars: st, line: `Docked with Columbia with ${Math.round(fl * 100)}% fuel left${s.mist ? ` after ${s.mist} sorting slip${s.mist > 1 ? "s" : ""}` : ""}.`, summary: `${ME.name()} left Eagle's descent stage on the Moon and flew the light ascent stage up to Columbia.` });
          return;
        }
        if (s.fuel <= 0 && s.lifted && s.y < 78 && s.v <= 0) api.lose({ line: "Out of fuel before reaching orbit. Shorter, smarter burns save fuel." });
      },
      draw(c, api) {
        const W = api.W, H = api.H;
        space(c, W, H, s.t);
        const gy = H * 0.86;
        c.fillStyle = "#5f646b"; c.fillRect(0, gy, W, H - gy);
        c.fillStyle = "#4e5359"; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(((i * 233) % W), gy + 14 + (i % 3) * 10, 30, 5, 0, 0, 7); c.fill(); }
        // Earth
        c.fillStyle = "#2c6fb5"; c.beginPath(); c.arc(W * 0.93, H * 0.07, Math.min(W, H) * 0.045, 0, 7); c.fill();
        if (s.phase === "sort") {
          const lx = W * 0.18, rx = W * 0.82;
          txt(c, "🌙 STAYS ON THE MOON", lx, gy - 70, 13, "#ffb36b", "center", 800);
          txt(c, "🚀 FLIES TO ORBIT", rx, H * 0.16, 13, "#46e0b0", "center", 800);
          s.stay.forEach((it, i) => txt(c, it[0], lx - 50 + (i % 4) * 34, gy - 30, 26, "#fff", "center"));
          s.go.forEach((it, i) => txt(c, it[0], rx - 40 + (i % 3) * 38, H * 0.25 + Math.floor(i / 3) * 34, 26, "#fff", "center"));
          // descent stage on ground
          c.strokeStyle = "#d4c09b"; c.lineWidth = 5; c.beginPath(); c.moveTo(W / 2 - 40, gy - 30); c.lineTo(W / 2 - 64, gy); c.moveTo(W / 2 + 40, gy - 30); c.lineTo(W / 2 + 64, gy); c.stroke();
          c.fillStyle = "#b7954e"; c.fillRect(W / 2 - 46, gy - 58, 92, 34);
          const it = s.anim ? s.anim.it : s.items[s.i];
          if (it) {
            let cx = W / 2, cy = H * 0.42, sc = 1;
            if (s.anim) { const k = s.anim.t, tx = s.anim.k === "stay" ? lx : rx, ty = s.anim.k === "stay" ? gy - 30 : H * 0.25; cx += (tx - cx) * k; cy += (ty - cy) * k; sc = 1 - 0.55 * k; }
            const bw = Math.min(300, W * 0.7) * sc, bh = 130 * sc;
            rr(c, cx - bw / 2, cy - bh / 2, bw, bh, 16 * sc); c.fillStyle = "rgba(20,28,44,.95)"; c.fill(); c.strokeStyle = "rgba(255,179,107,.6)"; c.lineWidth = 2; c.stroke();
            txt(c, it[0], cx, cy - 20 * sc, 46 * sc, "#fff", "center");
            txt(c, it[1], cx, cy + 36 * sc, 17 * sc, "#eef2f8", "center", 700);
          }
          txt(c, "Which parts still have a job after liftoff?", W / 2, H * 0.08, 15, "#9aa7bb", "center", 600);
          return;
        }
        const top = H * 0.14, bot = gy - 30, ay = (a) => bot - (a / 100) * (bot - top);
        // orbit band
        c.fillStyle = "rgba(70,224,176,.13)"; c.fillRect(0, ay(92), W, ay(78) - ay(92));
        c.setLineDash([8, 6]); c.strokeStyle = "rgba(70,224,176,.6)"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(0, ay(92)); c.lineTo(W, ay(92)); c.moveTo(0, ay(78)); c.lineTo(W, ay(78)); c.stroke(); c.setLineDash([]);
        txt(c, "COLUMBIA’S ORBIT", 12, ay(92) - 10, 11, "#46e0b0", "left", 800);
        // Columbia
        const cx = ((s.t * 50) % (W + 160)) - 80, cyy = ay(85);
        c.fillStyle = "#cfd6df"; c.fillRect(cx - 22, cyy - 7, 34, 14); c.beginPath(); c.moveTo(cx + 12, cyy - 7); c.lineTo(cx + 28, cyy); c.lineTo(cx + 12, cyy + 7); c.fill();
        // descent stage left behind
        c.strokeStyle = "#d4c09b"; c.lineWidth = 5; c.beginPath(); c.moveTo(W / 2 - 40, gy - 4); c.lineTo(W / 2 - 64, gy + 26); c.moveTo(W / 2 + 40, gy - 4); c.lineTo(W / 2 + 64, gy + 26); c.stroke();
        c.fillStyle = "#b7954e"; c.fillRect(W / 2 - 46, gy - 32, 92, 34);
        // ascent stage
        const py = ay(s.y);
        if (s.burn && s.fuel > 0) { c.fillStyle = `rgba(255,${150 + Math.random() * 80},60,.9)`; c.beginPath(); c.moveTo(W / 2 - 12, py + 20); c.lineTo(W / 2, py + 44 + Math.random() * 18); c.lineTo(W / 2 + 12, py + 20); c.fill(); }
        c.fillStyle = "#c9cfd8"; c.beginPath(); c.moveTo(W / 2 - 30, py + 20); c.lineTo(W / 2 - 30, py - 6); c.lineTo(W / 2 - 14, py - 22); c.lineTo(W / 2 + 18, py - 22); c.lineTo(W / 2 + 30, py - 6); c.lineTo(W / 2 + 30, py + 20); c.closePath(); c.fill();
        c.fillStyle = "#2b2f36"; c.fillRect(W / 2 - 18, py - 10, 12, 10);
        // gauges
        gauge(c, 14, H * 0.3, 22, H * 0.38, s.fuel / s.fuel0, s.fuel / s.fuel0 < 0.2 ? "#ff5d5d" : "#ffb36b", "FUEL");
        const vOk = Math.abs(s.v) < 5;
        txt(c, `SPEED ${s.v >= 0 ? "+" : ""}${s.v.toFixed(1)}`, W - 14, H * 0.3, 14, vOk ? "#46e0b0" : "#ffd166", "right", 800);
        txt(c, `ALT ${Math.round(s.y)}%`, W - 14, H * 0.3 + 22, 13, "#9aa7bb", "right", 700);
        if (s.inBand > 0) { c.strokeStyle = "#46e0b0"; c.lineWidth = 5; c.beginPath(); c.arc(W / 2, py, 46, -Math.PI / 2, -Math.PI / 2 + (s.inBand / 2) * Math.PI * 2); c.stroke(); }
        if (!s.lifted) txt(c, "Hold 🔥 BURN to lift off", W / 2, H * 0.5, 18, "#eef2f8", "center", 700);
        txt(c, "Moon gravity: about 1/6 of Earth’s", W / 2, H - 14, 11, "#c9cfd8", "center", 600);
      },
      cleanup() { if (s) s.burn = false; },
    };
  })();

  /* ---------- B. APOLLO 15 ROVER · Walk-back Rule ---------- */
  (function () {
    const LW = 1000, LH = 640, LM = { x: 200, y: 380 }, R = 330, SP = 115;
    const STN = [
      { x: 470, y: 232, n: "Hadley Rille edge", f: "Hadley Rille is a winding valley about 300 m deep. The crew photographed and sampled its edge." },
      { x: 500, y: 470, n: "Spur crater", f: "Here the crew found the ‘Genesis Rock’, an ancient piece of the Moon’s early crust." },
      { x: 360, y: 565, n: "St. George crater", f: "Rocks on this slope rolled down from the nearby Apennine mountains." },
    ];
    const CR = [{ x: 330, y: 300, r: 38 }, { x: 430, y: 392, r: 32 }, { x: 265, y: 492, r: 30 }, { x: 610, y: 330, r: 44 }, { x: 412, y: 150, r: 28 }, { x: 560, y: 590, r: 26 }];
    let s = null;
    const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    G.lrv = {
      title: "Walk-back Rule", mission: "Apollo 15 · Lunar Roving Vehicle", icon: "🚙", bg: MOONBG,
      tagline: "Drive the first car on the Moon to three science stops and back, without ever leaving the walk-back circle.",
      how: [["🕹", "Hold <b>◀ ▶</b> (or arrow keys), or <b>drag</b> on the map to steer. The rover drives itself forward."], ["🚩", "Visit all <b>3 science stops</b>, then return to the <b>lunar module</b>."], ["⭕", "Stay inside the <b>dashed walk-back circle</b> and avoid crater rims."]],
      sci: "<b>The real thing:</b> In 1971, Apollo 15’s rover carried Dave Scott and Jim Irwin about 28 km in three drives. Every drive was planned so the crew could walk back to the lunar module if the rover failed. At Spur crater they found the ‘Genesis Rock’.",
      photo: { src: art("lrv"), cap: "Apollo 15’s Lunar Roving Vehicle, still parked at Hadley–Apennine (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) { return ["Steer early. The rover turns slowly, like a real car.", "The dashed circle is the walk-back limit. If it turns red, head back toward the lunar module.", "Try the order Hadley Rille → Spur crater → St. George, then drive home.", "Drag your finger where you want to go. The rover will turn toward it."][Math.min(l, 3)]; },
      init(api) {
        const e = ME.ease();
        s = { api, x: 245, y: 380, a: -0.55, bat: 100 * e, bat0: 100 * e, got: [false, false, false], L: false, R: false, ptr: null, out: 0, cool: 0, trail: [], tt: 0, t: 0, stT: 0 };
        api.ctrls(`<button type="button" data-hold="L" aria-label="Steer left" style="min-width:96px;touch-action:none">◀</button><span class="sep"></span><button type="button" data-hold="R" aria-label="Steer right" style="min-width:96px;touch-action:none">▶</button>`);
      },
      hold(c, v) { if (!s) return; if (c === "L") s.L = v; if (c === "R") s.R = v; },
      key(code, down) { if (!s) return false; if (code === "ArrowLeft" || code === "KeyA") { s.L = down; return true; } if (code === "ArrowRight" || code === "KeyD") { s.R = down; return true; } return false; },
      toW(x, y) { const f = fit(s.api, LW, LH); return { x: (x - f.ox) / f.s, y: (y - f.oy) / f.s }; },
      down(x, y) { s.ptr = this.toW(x, y); },
      move(x, y, pressed) { if (pressed && s.ptr) s.ptr = this.toW(x, y); },
      up() { s.ptr = null; },
      update(dt, api) {
        s.t += dt; s.cool -= dt;
        let turn = (s.L ? -1 : 0) + (s.R ? 1 : 0);
        if (s.ptr) turn = clamp(ang(Math.atan2(s.ptr.y - s.y, s.ptr.x - s.x) - s.a) * 3, -1, 1);
        s.a += turn * 2.6 * dt;
        if (s.bat > 0) { s.x += Math.cos(s.a) * SP * dt; s.y += Math.sin(s.a) * SP * dt; s.bat -= 7 * dt; }
        if (s.x < 16 || s.x > LW - 16 || s.y < 16 || s.y > LH - 16) { s.x = clamp(s.x, 16, LW - 16); s.y = clamp(s.y, 16, LH - 16); s.a += Math.PI * 0.6; }
        for (const c of CR) {
          const d = Math.hypot(s.x - c.x, s.y - c.y);
          if (d < c.r + 10) {
            const nx = (s.x - c.x) / (d || 1), ny = (s.y - c.y) / (d || 1);
            s.x = c.x + nx * (c.r + 12); s.y = c.y + ny * (c.r + 12);
            s.a = Math.atan2(ny, nx);
            if (s.cool <= 0) { s.cool = 1.2; api.fail("💥 Crater rim! The rover bounced off. Steer around craters."); }
          }
        }
        const dl = Math.hypot(s.x - LM.x, s.y - LM.y);
        if (dl > R) {
          s.out += dt;
          if (s.out > 2.2) { s.out = 0; s.a = Math.atan2(LM.y - s.y, LM.x - s.x); api.fail("🚶 Too far! If the rover broke down here, the crew couldn’t walk back safely. Turning back."); }
        } else s.out = Math.max(0, s.out - dt * 2);
        STN.forEach((st, i) => {
          if (!s.got[i] && Math.hypot(s.x - st.x, s.y - st.y) < 32) { s.got[i] = true; sfx().good(); api.toast(`🚩 <b>${st.n}</b>: ${st.f}`, "good"); }
        });
        s.tt += dt; if (s.tt > 0.08) { s.tt = 0; s.trail.push([s.x, s.y]); if (s.trail.length > 260) s.trail.shift(); }
        const n = s.got.filter(Boolean).length;
        s.stT -= dt; if (s.stT <= 0) { s.stT = 0.2; api.stat(`<span>🚩 ${n}/3</span><span>🔋 ${Math.max(0, Math.round((s.bat / s.bat0) * 100))}%</span>`); }
        if (n === 3 && dl < 36) {
          const bl = s.bat / s.bat0, st = api.fails === 0 && bl > 0.3 ? 3 : api.fails <= 2 && bl > 0.1 ? 2 : 1;
          api.win({ stars: st, line: `All 3 stops sampled and home with ${Math.round(bl * 100)}% battery.`, summary: `${ME.name()} drove the Apollo 15 rover to 3 science stops and stayed inside the walk-back limit.` });
          return;
        }
        if (s.bat <= 0) api.lose({ line: "Battery empty! That's exactly why Apollo crews never drove beyond the walk-back limit." });
      },
      draw(c, api) {
        const W = api.W, H = api.H, f = fit(api, LW, LH);
        c.fillStyle = "#3b3f45"; c.fillRect(0, 0, W, H);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        c.fillStyle = "#6b7077"; c.fillRect(0, 0, LW, LH);
        c.fillStyle = "rgba(0,0,0,.08)"; for (let i = 0; i < 140; i++) c.fillRect((i * 337) % LW, (i * 211) % LH, 3, 3);
        // Hadley Rille (outside the safe circle)
        c.strokeStyle = "#3d4046"; c.lineWidth = 34; c.lineCap = "round"; c.beginPath(); c.moveTo(720, 0); c.bezierCurveTo(640, 160, 820, 260, 700, 380); c.bezierCurveTo(620, 470, 760, 560, 700, 640); c.stroke();
        c.lineWidth = 1; txt(c, "HADLEY RILLE", 770, 120, 14, "#2a2d31", "left", 800);
        // walk-back circle
        const outside = Math.hypot(s.x - LM.x, s.y - LM.y) > R;
        c.setLineDash([14, 10]); c.lineWidth = 3; c.strokeStyle = outside ? "#ff5d5d" : "rgba(255,255,255,.7)";
        c.beginPath(); c.arc(LM.x, LM.y, R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        txt(c, "WALK-BACK LIMIT", LM.x, LM.y - R - 14, 13, outside ? "#ff5d5d" : "#eef2f8", "center", 800);
        for (const cr of CR) { c.fillStyle = "#4f545b"; c.beginPath(); c.arc(cr.x, cr.y, cr.r, 0, 7); c.fill(); c.strokeStyle = "#868b92"; c.lineWidth = 4; c.stroke(); }
        // trail
        c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 3; c.beginPath(); s.trail.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
        STN.forEach((st, i) => {
          c.strokeStyle = "#ddd"; c.lineWidth = 3; c.beginPath(); c.moveTo(st.x, st.y); c.lineTo(st.x, st.y - 34); c.stroke();
          c.fillStyle = s.got[i] ? "#46e0b0" : "#ff8a3d"; c.beginPath(); c.moveTo(st.x, st.y - 34); c.lineTo(st.x + 24, st.y - 26); c.lineTo(st.x, st.y - 18); c.fill();
          txt(c, (s.got[i] ? "✔ " : "") + st.n, st.x, st.y + 16, 14, "#fff", "center", 700);
        });
        // lunar module
        c.strokeStyle = "#d4c09b"; c.lineWidth = 4; c.beginPath(); c.moveTo(LM.x - 20, LM.y - 8); c.lineTo(LM.x - 32, LM.y + 14); c.moveTo(LM.x + 20, LM.y - 8); c.lineTo(LM.x + 32, LM.y + 14); c.stroke();
        c.fillStyle = "#b7954e"; c.fillRect(LM.x - 24, LM.y - 22, 48, 22); c.fillStyle = "#c9cfd8"; c.fillRect(LM.x - 16, LM.y - 40, 32, 18);
        txt(c, "LUNAR MODULE", LM.x, LM.y + 30, 12, "#eef2f8", "center", 800);
        // rover
        c.save(); c.translate(s.x, s.y); c.rotate(s.a);
        c.fillStyle = "#171d24"; [[-14, -13], [10, -13], [-14, 9], [10, 9]].forEach((w) => c.fillRect(w[0], w[1], 10, 5));
        c.fillStyle = "#c9b98a"; c.fillRect(-16, -9, 32, 18); c.fillStyle = "#e8edf3"; c.fillRect(6, -6, 8, 12);
        c.restore();
        if (s.ptr) { c.strokeStyle = "rgba(255,179,107,.8)"; c.lineWidth = 2; c.beginPath(); c.arc(s.ptr.x, s.ptr.y, 12, 0, 7); c.stroke(); }
        c.restore();
        gauge(c, 12, 12, 18, Math.min(140, H * 0.3), s.bat / s.bat0, s.bat / s.bat0 < 0.2 ? "#ff5d5d" : "#46e0b0", "🔋");
        txt(c, "Map simplified · not to scale", W - 10, H - 10, 11, "#c9cfd8", "right", 600);
      },
      cleanup() { if (s) { s.L = s.R = false; s.ptr = null; } },
    };
  })();

  /* ---------- C. SURVEYOR 3 · Pinpoint Landing ---------- */
  (function () {
    const LW = 1000, LH = 640, GY = 560, SVX = 560, ZONE = [640, 790];
    const PARTS = [
      ["📷", "TV camera", 1, "The camera came home so engineers could study how 2.5 years on the Moon changed it."],
      ["🥄", "Soil scoop", 1, "This scoop dug the trenches that tested the Moon’s soil."],
      ["🔌", "Cable & tubing pieces", 1, "Small samples of materials showed how dust, sunlight and temperature swings affect hardware."],
      ["🛰️", "The whole spacecraft", 0, "Far too big and heavy for the lunar module to carry home."],
      ["☀️", "Solar panel", 0, "Not returned. Space was tight, so the crew took small parts that told the most."],
    ];
    let s = null;
    const reset = () => { s.x = 140; s.y = 70; s.vx = 45; s.vy = 0; s.fuel = s.fuel0; };
    G.sur = {
      title: "Pinpoint Landing", mission: "Apollo 12 · Surveyor 3", icon: "🛰️", bg: MOONBG,
      tagline: "Apollo 12 had to land close enough to walk to Surveyor 3. Fly Intrepid down softly inside the landing zone, then pick what to bring home.",
      how: [["⬆", "Hold <b>▲ THRUST</b> (or ↑ / Space) to slow your fall."], ["↔", "Hold <b>◀ ▶</b> to drift sideways into the <b>green landing zone</b>."], ["🪶", "Touch down gently: fall speed under <b>40</b>, sideways under <b>22</b>."]],
      sci: "<b>The real thing:</b> In November 1969, Apollo 12’s lunar module Intrepid landed about 180 m from Surveyor 3, which had been sitting there since 1967. Pete Conrad and Alan Bean walked over and brought back its TV camera, scoop and pieces of cable and tubing.",
      photo: { src: art("sur"), cap: "Surveyor 3 in the Ocean of Storms, with its scoop arm (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        if (s && s.phase === "pick") return ["Think small and useful: which parts could two astronauts carry and fit in the lunar module?", "Apollo 12 took the camera, the scoop and some cables and tubing.", "The whole spacecraft and the big solar panel stayed behind.", "Three parts went home."][Math.min(l, 3)];
        return ["Start braking early. Short thrust pulses save fuel.", "Drift right toward the green zone first, then deal with your fall speed.", "Watch the FALL number. Keep it under 40 just before touchdown.", "Too fast sideways? Tap the opposite side thruster."][Math.min(l, 3)];
      },
      init(api) {
        const e = ME.ease();
        s = { api, phase: "land", fuel0: 100 * e, up: false, L: false, R: false, got: 0, picked: {}, t: 0, stT: 0 };
        reset();
        api.ctrls(`<button type="button" data-hold="L" aria-label="Thrust left" style="min-width:80px;touch-action:none">◀</button><button type="button" class="rq-btn primary" data-hold="UP" style="min-width:150px;touch-action:none">▲ THRUST</button><button type="button" data-hold="R" aria-label="Thrust right" style="min-width:80px;touch-action:none">▶</button>`);
      },
      hold(c, v) { if (!s) return; if (c === "UP") s.up = v; if (c === "L") s.L = v; if (c === "R") s.R = v; },
      key(code, down) {
        if (!s || s.phase !== "land") return false;
        if (code === "ArrowUp" || code === "KeyW" || code === "Space") { s.up = down; return true; }
        if (code === "ArrowLeft" || code === "KeyA") { s.L = down; return true; }
        if (code === "ArrowRight" || code === "KeyD") { s.R = down; return true; }
        return false;
      },
      ctrl(c, b) {
        if (!s || s.phase !== "pick" || c[0] !== "P") return;
        const i = +c.slice(1), p = PARTS[i];
        if (s.picked[i]) return;
        s.picked[i] = 1;
        if (b) { b.disabled = true; b.style.borderColor = p[2] ? "#46e0b0" : "#ff5d5d"; }
        if (p[2]) { s.got++; sfx().good(); s.api.toast("✅ " + p[3], "good"); }
        else s.api.fail("❌ " + p[3]);
        if (s.got >= 3) {
          const st = s.api.fails === 0 ? 3 : s.api.fails <= 2 ? 2 : 1;
          s.api.win({ stars: st, line: "Pinpoint landing, and the right parts are packed for Earth.", summary: `${ME.name()} landed Intrepid next to Surveyor 3 and chose the parts Apollo 12 brought home.` });
        }
      },
      update(dt, api) {
        s.t += dt;
        if (s.phase !== "land") return;
        const f = s.fuel > 0;
        const ax = f ? (s.L ? -26 : 0) + (s.R ? 26 : 0) : 0, ay = 20 - (s.up && f ? 46 : 0);
        if (f) s.fuel = Math.max(0, s.fuel - ((s.up ? 9 : 0) + (s.L || s.R ? 3.5 : 0)) * dt);
        s.vx += ax * dt; s.vy += ay * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.x < 30 || s.x > LW - 30) { s.x = clamp(s.x, 30, LW - 30); s.vx = 0; }
        if (s.y < 20) { s.y = 20; s.vy = Math.max(0, s.vy); }
        s.stT -= dt; if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>⛽ ${Math.round((s.fuel / s.fuel0) * 100)}%</span><span>⬇ ${Math.round(s.vy)}</span>`); }
        if (s.y >= GY - 26) {
          s.y = GY - 26;
          if (s.vy > 40 || Math.abs(s.vx) > 22) { api.fail(`💥 Too hard! You hit at ${Math.round(s.vy)} down and ${Math.round(Math.abs(s.vx))} sideways. Try again.`); reset(); return; }
          if (s.x < ZONE[0] || s.x > ZONE[1]) { api.fail("Soft landing, but too far from Surveyor 3. Apollo 12 had to land close enough to walk over."); reset(); return; }
          s.phase = "pick"; s.up = s.L = s.R = false; sfx().win();
          api.toast("🦅 Intrepid has landed about 180 m from Surveyor 3! Walk over and choose what to bring home.", "good");
          api.stat(`<span>🎒 Pick 3 parts</span>`);
          api.ctrls(PARTS.map((p, i) => `<button type="button" data-c="P${i}" style="flex:1 1 160px">${p[0]} ${p[1]}</button>`).join(""));
        }
      },
      draw(c, api) {
        const W = api.W, H = api.H, f = fit(api, LW, LH);
        space(c, W, H, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        c.fillStyle = "#2c6fb5"; c.beginPath(); c.arc(880, 90, 34, 0, 7); c.fill();
        c.fillStyle = "#666b72"; c.beginPath(); c.moveTo(0, GY); for (let x = 0; x <= LW; x += 50) c.lineTo(x, GY + Math.sin(x * 0.02) * 4); c.lineTo(LW, LH); c.lineTo(0, LH); c.fill();
        // zone
        c.fillStyle = "rgba(70,224,176,.18)"; c.fillRect(ZONE[0], GY - 4, ZONE[1] - ZONE[0], 10);
        c.setLineDash([6, 6]); c.strokeStyle = "#46e0b0"; c.lineWidth = 2; c.beginPath(); c.moveTo(ZONE[0], GY - 90); c.lineTo(ZONE[0], GY); c.moveTo(ZONE[1], GY - 90); c.lineTo(ZONE[1], GY); c.stroke(); c.setLineDash([]);
        txt(c, "LANDING ZONE", (ZONE[0] + ZONE[1]) / 2, GY - 100, 13, "#46e0b0", "center", 800);
        // Surveyor 3
        c.strokeStyle = "#d4c09b"; c.lineWidth = 3; c.beginPath(); c.moveTo(SVX, GY - 50); c.lineTo(SVX - 26, GY); c.moveTo(SVX, GY - 50); c.lineTo(SVX + 26, GY); c.moveTo(SVX, GY - 40); c.lineTo(SVX, GY); c.stroke();
        c.fillStyle = "#47638c"; c.fillRect(SVX - 16, GY - 66, 32, 10); c.strokeStyle = "#c2d0dc"; c.beginPath(); c.moveTo(SVX, GY - 56); c.lineTo(SVX, GY - 78); c.lineTo(SVX + 12, GY - 78); c.stroke();
        txt(c, "SURVEYOR 3", SVX, GY + 22, 12, "#eef2f8", "center", 800);
        // lander
        const x = s.x, y = s.y;
        if (s.phase === "land" && s.fuel > 0) {
          if (s.up) { c.fillStyle = `rgba(255,${150 + Math.random() * 80},60,.9)`; c.beginPath(); c.moveTo(x - 8, y + 12); c.lineTo(x, y + 34 + Math.random() * 14); c.lineTo(x + 8, y + 12); c.fill(); }
          c.fillStyle = "rgba(255,220,150,.9)";
          if (s.L) c.fillRect(x + 22, y - 6, 12, 4);
          if (s.R) c.fillRect(x - 34, y - 6, 12, 4);
        }
        c.strokeStyle = "#d4c09b"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 16, y + 6); c.lineTo(x - 26, y + 26); c.moveTo(x + 16, y + 6); c.lineTo(x + 26, y + 26); c.stroke();
        c.fillStyle = "#b7954e"; c.fillRect(x - 20, y - 6, 40, 16); c.fillStyle = "#c9cfd8"; c.fillRect(x - 14, y - 22, 28, 16);
        if (s.phase === "pick") {
          c.setLineDash([4, 8]); c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 30, GY - 4); c.lineTo(SVX + 34, GY - 4); c.stroke(); c.setLineDash([]);
          txt(c, "👩‍🚀👨‍🚀", (x + SVX) / 2, GY - 24, 26, "#fff", "center");
          txt(c, "≈ 180 m walk", (x + SVX) / 2, GY + 22, 12, "#c9cfd8", "center", 700);
        }
        c.restore();
        if (s.phase === "land") {
          gauge(c, 12, 12, 18, Math.min(130, H * 0.28), s.fuel / s.fuel0, s.fuel / s.fuel0 < 0.2 ? "#ff5d5d" : "#ffb36b", "FUEL");
          txt(c, `FALL ${Math.round(s.vy)}`, W - 12, 22, 15, s.vy > 40 ? "#ff5d5d" : "#46e0b0", "right", 800);
          txt(c, `SIDEWAYS ${Math.round(Math.abs(s.vx))}`, W - 12, 44, 13, Math.abs(s.vx) > 22 ? "#ffd166" : "#9aa7bb", "right", 700);
        }
      },
      cleanup() { if (s) s.up = s.L = s.R = false; },
    };
  })();

  /* ---------- D. LASER MIRRORS · Lunar Laser Ranging ---------- */
  (function () {
    const LW = 1000, LH = 640, E = { x: 130, y: 330, r: 70 }, MO = { x: 810, y: 320, r: 130 }, REF = { x: 790, y: 300 }, ONE = 1.28;
    let s = null;
    const target = (t) => ({ x: REF.x + Math.sin(t * 0.8) * 34, y: REF.y + Math.cos(t * 1.1) * 26 });
    function calcUI(api) {
      const avg = s.hits.reduce((a, b) => a + b, 0) / s.hits.length;
      const fmt = (n) => Math.round(n / 1000) * 1000;
      const opts = shuffle([[fmt((300000 * avg) / 2), 1, ""], [fmt(300000 * avg), 0, "That's the whole round trip. The light went there AND back, so halve it."], [fmt(300000 / avg), 0, "Distance = speed × time. Don't divide the speed by the time."]]);
      s.opts = opts; s.avg = avg;
      api.stat(`<span>📡 Average ${avg.toFixed(2)} s</span>`);
      api.ctrls(opts.map((o, i) => `<button type="button" data-c="C${i}" style="flex:1 1 170px">${o[0].toLocaleString()} km</button>`).join(""));
      api.toast(`3 photons caught! Average round trip <b>${avg.toFixed(2)} s</b>. Light travels about 300,000 km/s. How far away is the Moon?`);
    }
    G.llr = {
      title: "Hit the Mirror", mission: "Apollo laser retroreflectors", icon: "🔦", bg: MOONBG,
      tagline: "Apollo left mirrors on the Moon that still work today. Aim an Earth laser at one, catch 3 returning flashes, then work out how far away the Moon is.",
      how: [["🎯", "<b>Drag</b> on the Moon (or use the arrow keys) to aim the crosshair at the shiny mirror."], ["⚡", "Press <b>FIRE</b> (or Space). Light takes about <b>1.3 s</b> to get there, and the mirror keeps moving."], ["🧮", "Catch <b>3 returns</b>, then calculate the distance."]],
      sci: "<b>The real thing:</b> Observatories still fire lasers at the mirrors left by Apollo 11, 14 and 15. Timing the round trip (about 2.5 s) gives the Moon’s distance to within millimetres, and shows the Moon drifting away by about 3.8 cm a year.",
      photo: { src: art("llr"), cap: "An Apollo laser retroreflector panel of corner-cube prisms (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        if (s && s.phase === "calc") return ["The light went to the Moon AND back.", "Distance = speed × time ÷ 2.", "300,000 km/s × about 2.55 s ÷ 2 ≈ 384,000 km.", "Pick the answer close to 384,000 km."][Math.min(l, 3)];
        return ["Put the crosshair right on the shiny mirror, then FIRE.", "The mirror drifts in a small loop. Aim where it is heading, not where it is now.", ME.tier() === "explorer" ? "See the faint ring? That's where the mirror will be when your light arrives." : "Light needs about 1.3 s to arrive, so lead the target a little.", "Wait for each pulse to come back before firing again."][Math.min(l, 3)];
      },
      init(api) {
        s = { api, phase: "aim", rx: MO.x - 30, ry: MO.y - 10, t: 0, pulse: null, hits: [], keys: {}, tol: 26 * ME.ease(), calcFail: 0 };
        api.ctrls(`<button type="button" class="rq-btn primary big" data-c="FIRE" style="flex:1 1 240px">⚡ Fire laser</button>`);
        api.stat(`<span>📡 0/3 returns</span>`);
      },
      fire() {
        if (!s || s.phase !== "aim" || s.pulse) return;
        s.pulse = { t: 0, ax: s.rx, ay: s.ry, back: false };
        sfx().tone(1400, 0.08, "square", 0.04);
      },
      ctrl(c) {
        if (c === "FIRE") return this.fire();
        if (s.phase === "calc" && c[0] === "C") {
          const o = s.opts[+c.slice(1)];
          if (o[1]) {
            const st = s.api.fails === 0 ? 3 : s.api.fails <= 2 ? 2 : 1;
            s.api.win({ stars: st, line: `${o[0].toLocaleString()} km. Speed of light × ${s.avg.toFixed(2)} s ÷ 2. That's the real way Apollo’s mirrors measure the Moon.`, summary: `${ME.name()} bounced a laser off an Apollo mirror and measured the Moon's distance.` });
          } else s.api.fail("❌ " + o[2]);
        }
      },
      key(code, down) {
        if (!s) return false;
        if (code === "Space" && down) { this.fire(); return true; }
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(code)) { s.keys[code] = down; return true; }
        return false;
      },
      toW(x, y) { const f = fit(s.api, LW, LH); return { x: (x - f.ox) / f.s, y: (y - f.oy) / f.s }; },
      aim(x, y) { const p = this.toW(x, y), dx = p.x - MO.x, dy = p.y - MO.y, d = Math.hypot(dx, dy), k = d > MO.r - 6 ? (MO.r - 6) / d : 1; s.rx = MO.x + dx * k; s.ry = MO.y + dy * k; },
      down(x, y) { if (s.phase === "aim") this.aim(x, y); },
      move(x, y, pressed) { if (pressed && s.phase === "aim") this.aim(x, y); },
      update(dt, api) {
        s.t += dt;
        const k = s.keys, v = 230 * dt;
        if (k.ArrowLeft) s.rx -= v; if (k.ArrowRight) s.rx += v; if (k.ArrowUp) s.ry -= v; if (k.ArrowDown) s.ry += v;
        const dx = s.rx - MO.x, dy = s.ry - MO.y, d = Math.hypot(dx, dy);
        if (d > MO.r - 6) { s.rx = MO.x + (dx * (MO.r - 6)) / d; s.ry = MO.y + (dy * (MO.r - 6)) / d; }
        const p = s.pulse;
        if (!p) return;
        p.t += dt;
        if (!p.back && p.t >= ONE) {
          const tg = target(s.t);
          if (Math.hypot(p.ax - tg.x, p.ay - tg.y) < s.tol) { p.back = true; sfx().tone(900, 0.06, "sine", 0.04); }
          else { s.pulse = null; api.fail("Missed! The beam lit up bare Moon dust. The mirror moved while your light was travelling, so aim a little ahead."); }
        } else if (p.back && p.t >= ONE * 2) {
          const rt = 2.5 + Math.random() * 0.12;
          s.hits.push(rt); s.pulse = null; sfx().good();
          api.toast(`📡 Photon back! Round trip <b>${rt.toFixed(2)} s</b>`, "good");
          api.stat(`<span>📡 ${s.hits.length}/3 returns</span>`);
          if (s.hits.length >= 3) { s.phase = "calc"; calcUI(api); }
        }
      },
      draw(c, api) {
        const W = api.W, H = api.H, f = fit(api, LW, LH);
        space(c, W, H, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        // Earth + observatory
        c.fillStyle = "#2c6fb5"; c.beginPath(); c.arc(E.x, E.y, E.r, 0, 7); c.fill();
        c.fillStyle = "#3f8a3c"; c.beginPath(); c.ellipse(E.x - 10, E.y - 14, 30, 20, 0.4, 0, 7); c.fill();
        c.fillStyle = "#eef2f8"; c.beginPath(); c.arc(E.x + 52, E.y - 44, 10, Math.PI, 0); c.fill(); c.fillRect(E.x + 42, E.y - 44, 20, 8);
        txt(c, "OBSERVATORY", E.x, E.y + E.r + 22, 13, "#9aa7bb", "center", 800);
        // Moon
        const mg = c.createRadialGradient(MO.x - 40, MO.y - 40, 20, MO.x, MO.y, MO.r); mg.addColorStop(0, "#c9ccd1"); mg.addColorStop(1, "#7d8188");
        c.fillStyle = mg; c.beginPath(); c.arc(MO.x, MO.y, MO.r, 0, 7); c.fill();
        c.fillStyle = "rgba(60,64,70,.45)"; [[-40, -30, 34], [30, 40, 26], [50, -50, 18], [-50, 50, 20]].forEach((m) => { c.beginPath(); c.arc(MO.x + m[0], MO.y + m[1], m[2], 0, 7); c.fill(); });
        const tg = target(s.t);
        // mirror glint
        c.fillStyle = "#e8fbff"; c.fillRect(tg.x - 5, tg.y - 4, 10, 8);
        c.strokeStyle = `rgba(160,240,255,${0.5 + 0.5 * Math.sin(s.t * 6)})`; c.lineWidth = 2; c.beginPath(); c.arc(tg.x, tg.y, 10, 0, 7); c.stroke();
        if (ME.tier() === "explorer" && s.phase === "aim") { const fu = target(s.t + ONE); c.strokeStyle = "rgba(70,224,176,.45)"; c.setLineDash([3, 4]); c.beginPath(); c.arc(fu.x, fu.y, s.tol, 0, 7); c.stroke(); c.setLineDash([]); }
        // pulse
        const p = s.pulse;
        if (p) {
          const k = p.back ? 2 - p.t / ONE : p.t / ONE, px = E.x + 52 + (p.ax - E.x - 52) * k, py = E.y - 44 + (p.ay - E.y + 44) * k;
          c.strokeStyle = "rgba(70,224,176,.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(E.x + 52, E.y - 44); c.lineTo(p.ax, p.ay); c.stroke();
          c.fillStyle = "#46e0b0"; c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill();
          txt(c, `⏱ ${p.t.toFixed(2)} s`, LW / 2, 60, 22, "#eef2f8", "center", 800);
        }
        if (s.phase === "aim") {
          c.strokeStyle = "#ffb36b"; c.lineWidth = 2.5; c.beginPath(); c.arc(s.rx, s.ry, 16, 0, 7); c.moveTo(s.rx - 26, s.ry); c.lineTo(s.rx - 8, s.ry); c.moveTo(s.rx + 8, s.ry); c.lineTo(s.rx + 26, s.ry); c.moveTo(s.rx, s.ry - 26); c.lineTo(s.rx, s.ry - 8); c.moveTo(s.rx, s.ry + 8); c.lineTo(s.rx, s.ry + 26); c.stroke();
        }
        txt(c, "≈ 384,000 km (not to scale)", LW / 2, LH - 30, 13, "#9aa7bb", "center", 700);
        s.hits.forEach((h, i) => txt(c, `#${i + 1}  ${h.toFixed(2)} s`, 40, 60 + i * 26, 15, "#46e0b0", "left", 700));
        c.restore();
      },
      cleanup() { if (s) s.keys = {}; },
    };
  })();

  /* ---------------------------------------------------------------- 3D models */
  const BUILD = {
    eag() {
      const g = new THREE.Group();
      const gold = M3.mat(0xc9a24a, 0.35, 0.75), foil = M3.mat(0x8f7a43, 0.5, 0.6), metal = M3.mat(0xb8bcc4, 0.4, 0.7), dark = M3.mat(0x3a3d44, 0.6, 0.4);
      const body = M3.at(M3.cyl(1.7, 1.7, 1.5, gold, 8), 0, 1.75, 0); body.rotation.y = Math.PI / 8; g.add(body);
      g.add(M3.at(M3.cyl(1.72, 1.72, 0.08, foil, 8), 0, 2.52, 0));
      g.add(M3.at(M3.cyl(0.35, 0.75, 0.9, dark, 16), 0, 0.75, 0));
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
        g.add(M3.rod([a * 1.1, 2.1, b * 1.1], [a * 2.5, 0.12, b * 2.5], 0.07, metal));
        g.add(M3.rod([a * 1.25, 1.1, b * 1.25], [a * 2.45, 0.2, b * 2.45], 0.04, metal));
        g.add(M3.at(M3.cyl(0.45, 0.45, 0.1, metal, 14), a * 2.55, 0.05, b * 2.55));
      });
      // ladder on the front leg and the plaque
      for (let i = 0; i < 6; i++) g.add(M3.at(M3.box(0.5, 0.04, 0.04, metal), 1.55 + i * 0.16, 1.9 - i * 0.3, 1.55 + i * 0.16, 0, Math.PI / 4));
      g.add(M3.at(M3.box(0.5, 0.36, 0.03, M3.mat(0xd9dde3, 0.3, 0.8)), 1.32, 1.95, 1.32, 0, Math.PI / 4));
      // footprints trail
      const fp = M3.mat(0x55585e, 1, 0);
      for (let i = 0; i < 10; i++) g.add(M3.at(M3.box(0.14, 0.01, 0.3, fp), 3 + i * 0.45 + (i % 2) * 0.12, 0.02, 3.2 + i * 0.38, 0, 0.6));
      return g;
    },
    lrv() {
      const g = new THREE.Group();
      const frame = M3.mat(0xc8ccd2, 0.45, 0.6), tyre = M3.mat(0x5d6168, 0.8, 0.3), seat = M3.mat(0x7c8a99, 0.7, 0.2), dark = M3.mat(0x2e3238, 0.6, 0.4), white = M3.mat(0xeeeeee, 0.4, 0.2);
      g.add(M3.at(M3.box(3.1, 0.14, 1.3, frame), 0, 0.82, 0));
      [[1.15, 1], [1.15, -1], [-1.15, 1], [-1.15, -1]].forEach(([x, s]) => {
        const w = M3.at(M3.cyl(0.41, 0.41, 0.23, tyre, 18), x, 0.41, s * 0.92, Math.PI / 2); g.add(w);
        g.add(M3.at(M3.box(0.95, 0.04, 0.32, frame), x, 0.9, s * 0.92));
      });
      [[0.1, 0.33], [0.1, -0.33]].forEach(([x, z]) => { g.add(M3.at(M3.box(0.5, 0.06, 0.5, seat), x, 0.95, z)); g.add(M3.at(M3.box(0.06, 0.5, 0.5, seat), x - 0.25, 1.2, z)); });
      g.add(M3.at(M3.box(0.35, 0.4, 0.5, dark), 0.75, 1.08, 0));
      g.add(M3.at(M3.cyl(0.03, 0.03, 1.3, frame, 6), 1.35, 1.55, 0.3));
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 6, 0, Math.PI * 2, 0, Math.PI / 3), M3.mat(0xe8e8e8, 0.4, 0.3, { side: THREE.DoubleSide }));
      dish.position.set(1.35, 2.25, 0.3); dish.rotation.set(-0.6, 0, -0.5); g.add(dish);
      g.add(M3.at(M3.box(0.18, 0.14, 0.28, white), 1.35, 1.55, -0.3));
      g.add(M3.at(M3.cyl(0.015, 0.015, 1.1, frame, 4), 1.2, 1.5, -0.45));
      // tyre tracks
      const tr = M3.mat(0x50535a, 1, 0);
      [-0.92, 0.92].forEach((z) => g.add(M3.at(M3.box(9, 0.01, 0.22, tr), -5.5, 0.015, z)));
      return g;
    },
    sur() {
      const g = new THREE.Group();
      const metal = M3.mat(0xc2c6cc, 0.4, 0.7), gold = M3.mat(0xb9a566, 0.4, 0.6), cell = M3.mat(0x1d3566, 0.3, 0.6), rim = M3.mat(0x6b6e74, 1, 0);
      const crater = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.55, 6, 36), rim); crater.rotation.x = -Math.PI / 2; crater.scale.z = 0.45; crater.position.y = 0.08; g.add(crater);
      g.add(M3.at(M3.cyl(0.06, 0.06, 2.6, metal, 8), 0, 1.5, 0));
      [0, 2.094, 4.189].forEach((a) => {
        const fx = Math.cos(a) * 1.7, fz = Math.sin(a) * 1.7;
        g.add(M3.rod([Math.cos(a) * 0.5, 0.95, Math.sin(a) * 0.5], [fx, 0.12, fz], 0.05, metal));
        g.add(M3.at(M3.cyl(0.25, 0.3, 0.12, metal, 12), fx, 0.06, fz));
        g.add(M3.rod([Math.cos(a) * 0.5, 0.95, Math.sin(a) * 0.5], [Math.cos(a + 2.094) * 0.5, 0.95, Math.sin(a + 2.094) * 0.5], 0.035, metal));
      });
      g.add(M3.at(M3.box(0.45, 0.35, 0.35, gold), 0.35, 1.1, -0.2));
      g.add(M3.at(M3.box(0.95, 0.03, 0.62, cell), 0, 2.85, 0.15, -0.5));
      g.add(M3.at(M3.box(0.7, 0.03, 0.5, metal), 0, 2.6, -0.4, 0.6));
      g.add(M3.at(M3.cyl(0.11, 0.11, 0.4, metal, 10), -0.45, 1.25, 0.3, 0, 0, 0.4));
      g.add(M3.rod([0.4, 1.0, 0.4], [1.3, 0.45, 1.0], 0.03, metal));
      g.add(M3.at(M3.box(0.18, 0.1, 0.12, metal), 1.32, 0.42, 1.02));
      return g;
    },
    llr() {
      const g = new THREE.Group();
      const metal = M3.mat(0xb8bcc4, 0.4, 0.7), gold = M3.mat(0xc9a24a, 0.4, 0.7);
      const cv = document.createElement("canvas"); cv.width = cv.height = 128;
      const x = cv.getContext("2d"); x.fillStyle = "#9aa1aa"; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { x.fillStyle = "#1a1f27"; x.beginPath(); x.arc(7 + i * 12.6, 7 + j * 12.6, 5, 0, 7); x.fill(); x.fillStyle = "rgba(160,220,255,.35)"; x.beginPath(); x.arc(5.5 + i * 12.6, 5.5 + j * 12.6, 1.6, 0, 7); x.fill(); }
      const top = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.25, metalness: 0.6 });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.4), [metal, metal, top, metal, metal, metal]);
      panel.position.set(0, 0.75, 0); panel.rotation.x = -0.45; g.add(panel);
      g.add(M3.rod([-0.55, 0.5, 0.3], [-0.6, 0, 0.5], 0.04, metal));
      g.add(M3.rod([0.55, 0.5, 0.3], [0.6, 0, 0.5], 0.04, metal));
      g.add(M3.rod([0, 0.95, -0.4], [0, 0, -0.7], 0.04, metal));
      // passive seismometer next to it (Apollo 11's other experiment)
      g.add(M3.at(M3.box(0.7, 0.55, 0.6, gold), 2.6, 0.3, -1.2));
      g.add(M3.at(M3.box(1.3, 0.03, 0.7, M3.mat(0x1d3566, 0.3, 0.6)), 3.6, 0.6, -1.2));
      g.add(M3.at(M3.box(1.3, 0.03, 0.7, M3.mat(0x1d3566, 0.3, 0.6)), 1.6, 0.6, -1.2));
      // laser pulse from Earth, now and then
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 400, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0x46e0b0, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      const dir = new THREE.Vector3(520, 330, -820).normalize();
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      beam.position.copy(dir.clone().multiplyScalar(200)).add(new THREE.Vector3(0, 0.8, 0));
      beam.visible = false; g.add(beam);
      g.userData.spin = (t) => { beam.visible = t % 5 < 0.35; };
      return g;
    },
  };
  const PLACE = { eag: [[40, -32], 0xffd166, 4.4, 0.4], lrv: [[-62, -68], 0x9fd8ff, 3.4, 2.1], sur: [[82, 48], 0xc9b7ff, 4.2, 0], llr: [[-48, 72], 0x46e0b0, 3, 0] };
  MOON.forEach((m) => { const p = PLACE[m.id]; m.kind = "surface"; m.pos = p[0]; m.color = p[1]; m.labelY = p[2]; m.rot = p[3]; m.build = BUILD[m.id]; });
  RQ.site.add("moon", MOON);
})();
