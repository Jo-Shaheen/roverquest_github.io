# 7-Slide Presentation Deck & Demo Script — RoverQuest: Beyond the Silent Machines

**Event:** NASA Space Apps Cairo 2026  
**Project:** RoverQuest: Beyond the Silent Machines  
**Format:** 7-Slide Judge Presentation + 30-Second / 3-Minute Live Demo Script

---

## Slide 1 — Title & Core Problem
- **Headline:** **RoverQuest: Beyond the Silent Machines** — *Left Behind on Mars and the Moon. Still Teaching Us.*
- **Visual:** `docs/screenshots/landing-desktop.png` (Landing hub showing Mars & Moon chapters and the 5-step inquiry loop).
- **Key Points:**
  - Dozens of historic spacecraft rest silently on the Moon and Mars.
  - NASA's NSSDCA catalog and Planetary Photojournal hold rich records, but 10–18 year-old students struggle to connect **hardware design → instrument measurements → scientific interpretation → uncertainty**.
  - **Our Solution:** An offline-first story game with **two explorable 3D worlds**. On Mars, restore **any 5 of 9** places (Sojourner, Spirit & Opportunity, Viking 1 & 2, Phoenix & InSight, Ingenuity, plus holo-beacons for Dawn, NEAR Shoemaker, Pioneer 10 & 11 and Kepler). On the Moon, restore **any 3 of 4** Apollo-era sites.

---

## Slide 2 — Personalised Learning & the Inquiry Loop
- **Headline:** It Knows Your Name, and How You Learn (Ages 10–18)
- **Visual:** Diagram of **Meet Hardware → Operate → Observe → Interpret → Report** alongside the **Quick Science Terms** and **Self-Check Explanation Checklist**.
- **Key Points:**
  - **Name + Age Onboarding:** TARS asks for the player's name and age. Age sets the tier: Explorer (≤10), Scientist (11–14) or Engineer (15+). The tier changes wording depth, mini-game difficulty and how soon TARS offers hints. The name runs through the captions, the coaching and the ending. Both are stored on the device only.
  - **Choice + Retrieval:** Any 5 of 9 places on Mars (any 3 of 4 on the Moon) unlock the ending. The final launch check asks one question from each datapoint *this player* restored.
  - **Diagnostic Pre-Check vs. Distinct Transfer Post-Check:** Every mission tests conceptual transfer to a new scenario rather than repeating the same trivia question.
  - **Epistemological Honesty:** Persistent `🧪 SYNTHETIC TEACHING DATA — NOT RAW NASA TELEMETRY` badges and `🧊 3D Model: Procedural Educational Approximation` disclosures ensure students never confuse teaching simulations with raw flight telemetry.
  - **Built for Ages 10–18:** Age-adaptive tiers, inline vocabulary glossaries, and gibberish-resistant Claim / Evidence / Uncertainty reports.

---

## Slide 3 — Mars Flagship 1: 3D Exploration, Astronaut + 3D TARS & Sojourner
- **Headline:** Synchronized 2D Route Planning & Live 3D Martian Hardware
- **Visual:** `docs/screenshots/mars-astronaut-tars-desktop.png` and `docs/screenshots/mars-picker-desktop.png`.
- **Key Points:**
  - **3D Astronaut & Articulated 3D TARS Companion:** Both walk together across the Martian terrain, guided by a **draggable, click-to-walk Mars Radar (`#mm-wrap`)**.
  - **Sojourner (1996-068A):** Students inspect the obstructed front ramp vs. clear rear ramp, steer around hazard boulders on a 2D planner that **drives the 3D Sojourner rover through a 3D rock yard in real time** (`👁️ Split 3D Rover View`), rotate the rover 180° to place its **rear APXS** at a **0 cm contact gap**, and write an evidence-based report.

---

## Slide 4 — Mars Flagship 2: Opportunity's Multi-Instrument Water Investigation
- **Headline:** How Hardware Design Shapes Scientific Evidence at Meridiani Planum
- **Visual:** `docs/screenshots/mars-opportunity-evidence.png` (`PIA19113` concretions + MI & Mössbauer controls).
- **Key Points:**
  - **Flexible IDD Turret Strategy Switcher:** Once students select the layered outcrop (`Target B`), they can deploy Opportunity's **Microscopic Imager** (opening the dust cover and adjusting arm standoff to the fixed **68 mm** focus) and **Mössbauer Spectrometer** (12-hour integration on a spherule vs. host rock) in flexible order.
  - **Synthesizing Clues:** Combining embedded ~4 mm spherule texture (`PIA19113`) with 6-line **hematite** and 2-line **jarosite** spectra supports acidic groundwater concretions—while explicitly noting that water evidence alone does not prove past life.

---

## Slide 5 — Beacons and the Moon: Two More Ways to Explore
- **Headline:** Holo-Beacons for Deep Space, and a Real Moon to Walk On
- **Holo-beacons on Mars:** Dawn (*Orbit Hopper*), NEAR Shoemaker (*Soft Touch on Eros*), Pioneer 10 & 11 (*Slingshot*) and Kepler (*Transit Hunter*) never went to Mars, so they appear as relay stations projecting holograms. Each one says where the real spacecraft is now. Ingenuity (*First Flight*) stands on the plain with its broken blade.
- **The Moon world (`mars.html?world=moon`):** the same engine with grey regolith, crater rims, a black sky and Earth overhead. *Lighten & Lift* (Eagle staging), *Walk-back Rule* (LRV safety radius), *Pinpoint Landing* (Apollo 12 → Surveyor 3) and *Hit the Mirror* (laser ranging, d = c × t ÷ 2). Any 3 of 4 repair the Guidance, Power and Ascent engine.
- **Visual:** `docs/screenshots/moon-world-eagle.png`.
- **Key Points:**
  - **Apollo 11 Eagle (`1969-059C`):** Why the descent stage remained as a launch pad and permanent monument.
  - **Apollo 15 LRV (`1971-063C`):** Never drive farther than the crew can walk back.
  - **Surveyor 3 (`1967-035A`):** Parts brought home by Apollo 12 show what 31 months on the Moon does to hardware.
  - **Laser retroreflectors:** Passive corner-cube mirrors still return laser pulses 55+ years later without batteries.

---

## Slide 6 — Engineering Rigor, Offline Reliability & NASA NSSDCA Traceability
- **Headline:** 100% Offline-First, Verified by 26 Logic Groups & Real-Browser Playwright Tests
- **Visual:** `docs/screenshots/mars-nssdca-archive.png` and `docs/screenshots/mars-3d-inspector.png`.
- **Key Points:**
  - **Zero External Runtime Dependencies:** Local `vendor/three.min.js` (Three.js r128) + **32 / 32 locally bundled NASA photographs** (`data/hardware-images.json`).
  - **Searchable NSSDCA Master Catalog & Topographic Map:** Plots real Martian landing coordinates (`1975-075C`, `1996-068A`, `2003-027A`, `2003-032A`, `2018-042A`, `1969-059C`, `1971-063C`, `1967-035A`) and explains gameplay geography vs. planetary coordinates.
  - **Automated QA:** 26 passing Node.js verification groups (`node tools/check.mjs`), 12 mission-level Playwright E2E/axe tests (`tests/e2e/roverquest.spec.mjs`), and hardened static serving on port `4173`.

---

## Slide 7 — Classroom Continuation & Honest Evaluation Roadmap
- **Headline:** Ready for Classrooms Today, Built for Measurable Impact Tomorrow
- **Visual:** `docs/screenshots/mars-learning-report.png` (Exportable JSON / Printable Reflection Report).
- **Key Points:**
  - **Zero-Account Privacy:** All progress, diagnostic pre-checks, transfer post-checks, and 0–2 rubric self-checks save locally on the student's device and export to JSON or print/PDF for teacher review.
  - **Ready-to-Run Pilot Protocol (`docs/PILOT_EVALUATION_PROTOCOL.md`):** Includes a 25-minute classroom script, 0–6 rubric scoring guide, and 5-question learner feedback form ready for 5–15 student trials.

---

## Demo Script (3 minutes)
1. **0:00–0:30.** Open `mars.html?intro=1` and enter a name and age (e.g. "Maya", 12). The crash intro addresses "Commander Maya".
2. **0:30–1:30.** Restore **Sojourner** (Signal-Delay Driver), then walk to the **Kepler holo-beacon** (Transit Hunter) and read where the real telescope is. Point out the top bar: *Ship systems 2/5*.
3. **1:30–2:00.** Open the ship panel: 5 systems and 9 place tiles, any 5 required. Change the age in **⚙ Menu → Pilot** and show TARS's wording change. Then open `mars.html?world=moon` to show the Moon world with Earth in the sky.
4. **2:00–3:00.** With 5 restored, run the final launch check (questions come from the player's own datapoints), then show the ending: Maya presents their mission report to a cheering crowd, and the end card reads *5/9 datapoints · 5/5 systems*.
