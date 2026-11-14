# QA & Technical Verification Report — RoverQuest: Beyond the Silent Machines

**Updated:** November 13, 2026  
**Target Build:** NASA Space Apps Cairo 2026 Final Quality, Learning & Submission Upgrade  
**Local Server & Launcher Port:** `http://127.0.0.1:4173/index.html` (`run.bat`, `tools/serve.mjs`, `playwright.config.mjs`)

---

## 1. Automated Deterministic Logic & Asset Suite (`node tools/check.mjs` — 27 / 27 Passing Groups)

Executing `node tools/check.mjs` runs 27 deterministic verification groups. **Update (November 13, 2026):** the 2D Moon lab was archived, so its three groups (old items 14, 17 and the Moon half of 16) were replaced by syntax groups for `rq-world.js`, `rq-sites-mars.js` and `rq-sites-moon.js` and a new group, *World switch, 9 Mars places (any 5) and 4 explorable Moon sites (any 3)*, which checks the required counts, per-world storage keys, all 13 places, their final questions, NSSDCA ids, mini-games and the `moon.html` redirect. Since the last full write-up, four syntax groups were added for `mars-games.js`, `mars-datapoints.js`, `mars-cinema.js` and `mars-experience.js`. The original 22 groups are listed below:

1. **`PASS rq-world.js` / `rq-sites-mars.js` / `rq-sites-moon.js` syntax** — Valid script syntax for the world switch and the site files (replaces the old `moon.js` group).
2. **`PASS mars-polish.js syntax`** — Valid script syntax for the Mars FTUE, Sojourner 5-step investigation, and 3D rock yard integration.
3. **`PASS v4-upgrade.js syntax`** — Valid script syntax for custom 3D hardware builders, assessments, NSSDCA archive, and Viking/Spirit/InSight tasks.
4. **`PASS index.html inline syntax and static local links`** — Valid HTML/JS and verified local relative asset links.
5. **`PASS moon.html inline syntax and static local links`** — `moon.html` is now a small redirect to `mars.html?world=moon`; its inline script and link are checked.
6. **`PASS mars.html inline syntax and static local links`** — Valid HTML/JS and verified local relative asset links.
7. **`PASS 32 manifest entries; local image signatures, attribution, and unique keys`** — All **32** entries in `data/hardware-images.json` have `status: "locally_acquired"`, exist on disk under `assets/hardware/`, have verified magic-byte headers (JPEG/GIF) and non-trivial file sizes, and carry NASA attribution, source links, and alt text.
8. **`PASS generated image fallback matches central manifest`** — `DEFAULT_PHOTOS` in `mars.html` and `docs/IMAGE_CREDITS.md` are 100% synchronized with `data/hardware-images.json` via `node tools/sync-docs.mjs`.
9. **`PASS Sojourner gates: ramp, obstacle, target, contact, inference, report`** — Rejects obstructed front ramp, blocked boulder coordinates, premature APXS measurement, non-zero APXS contact gap (`gap > 0`), unsupported life/origin claims, and incomplete reports; completes when valid Claim, Evidence, and Uncertainty are submitted.
10. **`PASS Viking heating order and interpretation`** — Enforces subsurface trenching before 200°C and 500°C GCMS pyrolysis steps and requires the scientifically nuanced perchlorate (`ClO4-`) interpretation.
11. **`PASS Spirit separates RAT target from silica trench`** — Distinguishes 5 mm RAT basalt abrasion from the 2007 dragged right-front wheel trench (`~91 wt%` opaline silica) and requires hydrothermal interpretation without claiming proof of life.
12. **`PASS InSight deployment and synthetic arrival interpretation`** — Enforces SEIS + Wind & Thermal Shield deployment before P-wave (~22 s) and S-wave (~58 s) arrival picking and requires shear-wave liquid-core physics.
13. **`PASS Opportunity: cover, working distance, measurements, evidence and interpretation`** — Requires Target B outcrop selection, opening the MI dust cover, focusing within `68 ± 4 mm`, integrating Mössbauer on both a spherule and host rock, selecting the 4 valid evidence items, and choosing the aqueous concretion hypothesis.
14. **`PASS World switch, 9 Mars places (any 5) and 4 explorable Moon sites (any 3)`** — Replaces the archived lunar report lifecycle group.
15. **`PASS Offline Three.js r128 bundle, license, and click-to-load video gate`** — Verifies `vendor/three.min.js` and `vendor/THREE_LICENSE.txt` exist locally, zero `cdnjs.cloudflare.com` references remain in `mars.html`, and the optional YouTube 360° preview does not auto-load an `<iframe>` without user click.
16. **`PASS Distinct pre/post transfer questions and learning objectives for all 5 Mars investigations`** — Every original Mars investigation presents a diagnostic pre-check and a distinct transfer post-check with a learning objective.
17. *(Removed: tested the archived 2D Moon lab.)*
18. **`PASS Mars storage tamper validation and gibberish rejection`** — Rejects out-of-range task phases/abrasion values while restoring valid mid-task progress (`vik.temp = 200`, `spi.site = 'trench'`), and rejects repeated-character mash in Sojourner reports.
19. **`PASS Astronaut avatar and 3D/2D TARS companion visibility regression`** — Confirms that both the 3D Astronaut (`AS.g`) and the 3D articulated TARS robot (`TS.g`, built by `tars3D()`) are made visible when skipping the intro sequence via the mission picker, and that `#tars-widget` remains visible in a compact layout (`top:128px`) on mobile viewports (`<=700px`).
20. **`PASS Launcher port 4173 consistency, server hardening, and clean directory layout`** — Confirms `run.bat`, `tools/serve.mjs`, and `playwright.config.mjs` all use port `4173` (no `8000` mismatch), `tools/serve.mjs` returns `403 Forbidden` for dotfiles and internal dev directories (`.git`, `node_modules`, `original`, `test-results`, `playwright-report`), and no nested `RoverQuest/` folder exists.
21. **`PASS Draggable Mars Radar, 3D Sojourner rock yard, and Opportunity strategy switcher`** — Confirms `window.moveMarsRadar`, `window.resetMarsRadarPosition`, `window.goToMachineFromRadar`, `pl.radarTarget`, `ensureSoj3DProps` (`SojournerRockYard3D`), `window.toggleSojSplitView`, and `window.oppSwitchInstrument` (`IDD Turret Strategy (Flexible Order)`).
22. **`PASS Unified branding, persistent synthetic badges, age 10-16 glossaries, and self-check checklists`** — Confirms `RoverQuest: Beyond the Silent Machines` across `index.html`, `moon.html`, and `mars.html`, plus persistent `SYNTHETIC TEACHING DATA` badges, `Quick Science Terms (Ages 10–16)` glossaries, `Self-Check Explanation Checklist` blocks, and `Procedural Educational Approximation (Not Engineering CAD)` disclosures.

---

## 2. Clean Release Packaging Verification (`node tools/build-release.mjs`)

- Deleted the accidental nested `RoverQuest/RoverQuest/.git` directory from the project root.
- Added `tools/build-release.mjs` (`npm run build:release`), which verifies that all required runtime, vendor, data, tool, and documentation files exist and reports the exact clean file manifest excluding `.git`, `node_modules`, `original`, `test-results`, and `playwright-report`.
- Hardened `tools/serve.mjs` so requests to dotfiles (e.g. `/.git/HEAD`) or dev directories return `403 Forbidden`.

---

## 3. Real-Browser Chromium Verification & E2E Test Suite (`tests/e2e/roverquest.spec.mjs`)

See **[docs/BROWSER_QA_REPORT.md](BROWSER_QA_REPORT.md)** for full details on real-browser Chromium execution, captured screenshots in `docs/screenshots/`, and the 12-test independent mission-level Playwright specification.

---

## 4. Personalisation & 9-Datapoint Progression Verification (November 13, 2026)

These checks were run manually in the in-app Chromium browser against `http://127.0.0.1:4173/mars.html`, with state read through the page's JavaScript.

| Area | Result |
|---|---|
| **Name/age onboarding** | An empty name or a missing age is rejected with an inline error. A valid entry saves `{name, age, tier}` to `btsm_v4_profile` (e.g. age 12 → `scientist`) and syncs `SET.level`. The "Let's go" click starts the intro. |
| **Personalised intro** | The title-screen greeting and the captions use the player's name. The alert reads "5 SHIP SYSTEMS OFFLINE" on Mars and "3 SHIP SYSTEMS OFFLINE" on the Moon. |
| **Mission picker** | Mars shows 9 cards in two groups, 🔴 *On the plain* (5) and 📡 *Deep-space beacons* (4). The Moon shows 4 cards under 🌙 *Apollo-era sites*. |
| **Moon mini-games** | All four (Lighten & Lift, Walk-back Rule, Pinpoint Landing, Hit the Mirror) render and are winnable. For Hit the Mirror, the wrong-answer feedback for the round-trip distance and the win path were both verified. |
| **Restore step** | Wrong answers show explained feedback, and TARS can cross out a wrong option. Restoring increments *Ship systems n/5* and triggers a personalised TARS message. |
| **Any-5-of-9 gate** | Restoring a mixed set (Eagle, LRV, Surveyor 3, Sojourner, InSight) shows *ALL SYSTEMS ONLINE · SYSTEMS 5/5 · DATAPOINTS 5/9*. The final launch check drew its 5 questions from exactly those datapoints. Passing it sets `rq.launchOK` and the next step becomes "Launch home!". |
| **Personalised ending** | Captions name the player and replay the restored datapoints' lessons. The slides show "Presented by Commander {name}", the 5 restored datapoints, and "5 of 9 datapoints · 5 systems · {name} home". The astronaut wears a name badge. The end card shows "Welcome home, {name}!", *5/9 datapoints · 5/5 ship systems*, and "4 datapoints still waiting". |
| **3D Mars places** | Ingenuity, Viking 2 and Phoenix models and the four holo-beacon stations render with labels and beams. Walking within 6.5 m shows "ENTER to open the … holo-beacon"; Enter opens the hub, which states where the real spacecraft is. The radar and roster list all 9. |
| **New mini-games** | First Flight, Orbit Hopper, Soft Touch on Eros, Slingshot and Transit Hunter each start and run with no console errors. A simulation of Slingshot found winning launch windows in both rounds. |
| **Moon world** | `moon.html` redirects to `mars.html?world=moon`. The scene shows grey terrain, crater rims, stars and Earth, and the Mars machines are hidden. The crash intro, radar label ("MOON RADAR"), picker, Eagle hub, all four mini-games, the any-3 gate, the 3-question final check, the launch, the slides and the end card ("3/4 datapoints · 3/3 ship systems", link to Mars) were checked. Moon progress uses `.moon` storage keys, so it never mixes with Mars. |
| **Mobile (375×812)** | The mission picker and ship panel (9 tiles) show no horizontal page scroll. |
| **Fixes from this pass** | `install()` no longer throws, and no longer stays locked, if the ship panel is replaced mid-animation. The Earth in Lighten & Lift no longer overlaps the sort labels. |

**Not re-run in this pass:** the Playwright suite (`npx playwright test`). Playwright's Chromium build is not installed on the development machine. The spec now seeds a returning-player profile and `rq.introSeen` in `beforeEach`, so the name/age screen and the intro don't block its scripted flows. Its mission-flow selectors predate the redesigned hubs and should be re-checked on the next full run.
