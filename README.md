# RoverQuest: Beyond the Silent Machines

An offline-capable educational game for learners aged **10–18**, built for the **NASA Space Apps 2026** challenge *Abandoned but not Forgotten*. Your ship crash-lands, and the machines NASA left behind hold the know-how to fix it. There are **two fully explorable 3D worlds**:

- **Mars** (`mars.html`): **9 places** to explore. Restore **any 5** to bring the ship's five systems back online and fly home.
- **The Moon** (`mars.html?world=moon`, or `moon.html`): **4 Apollo-era sites** on a grey plain with Earth in the sky. Restore **any 3** to lift off.

> **Disclaimer:** Independent educational submission. NASA does not endorse this project.

---

## 1. Run locally (offline-first)

1. Install **Node.js v18+**.
2. Double-click `run.bat` on Windows, or run this from the project root:

```bash
node tools/serve.mjs
```

3. Open **http://127.0.0.1:4173/index.html** and choose **Mars** or **the Moon**, or go straight to **http://127.0.0.1:4173/mars.html** (Mars) or **http://127.0.0.1:4173/mars.html?world=moon** (Moon).
   - `run.bat`, `tools/serve.mjs` and `playwright.config.mjs` all use port **4173**.
   - **No external runtime dependencies.** Three.js r128 is bundled at `vendor/three.min.js` (license in `vendor/THREE_LICENSE.txt`). All 32 NASA hardware and evidence photographs are stored locally under `assets/hardware/`.
   - An optional NASA 360° video in the Sojourner hub only loads after an explicit click (`loadOptionalVideo`). Nothing else touches the network. Links to NASA mission pages and NSSDCA records open only when the player clicks them.
   - Add `?intro=1` to replay the opening cinematic, or `?intro=0` to skip it. Both work with `?world=moon` too.

---

## 2. How the game plays

### 2.1 Pilot profile: name and age
On first launch, TARS asks the player for a **first name or nickname** (up to 20 characters) and their **age** (9 or under, then 10–17, then 18+). The age picks one of three explanation tiers:

| Age | Tier | What changes |
|---|---|---|
| 10 and under | **Explorer** | Simplest wording, extra-forgiving mini-games (about 30% more fuel, battery and aiming tolerance), and TARS offers hints sooner. Some games show extra guides, such as a longer aiming line in Slingshot or a "ghost" ring in Hit the Mirror. |
| 11–14 | **Scientist** | Standard wording and a slightly forgiving difficulty. |
| 15+ | **Engineer** | Terse mission-data style, extra "Engineer's notes" on some discoveries, tighter tolerances, and TARS waits longer before offering hints. |

The name is used throughout the game:
- the title-screen greeting ("Welcome aboard, Commander …") and the intro captions;
- TARS's lines, hints and progress messages, and the mission picker heading;
- a name badge on the astronaut in the ending presentation, plus "Presented by Commander …";
- the end card ("Welcome home, …!").

Players can change their name or age at any time from **⚙ Menu → Pilot**. The profile is shared by both worlds.

**Privacy:** name and age are stored only in this browser's `localStorage` (`btsm_v4_profile`) and are never sent anywhere. **⚙ Menu → Reset progress** erases them.

### 2.2 The story arc (same in both worlds)
1. **Crash intro (~20 s, skippable).**
   - Mars: approach, main-engine failure, fiery re-entry, crash landing, "5 SHIP SYSTEMS OFFLINE".
   - Moon: descent-engine failure with *no air to slow the ship*, hard landing, "3 SHIP SYSTEMS OFFLINE".
2. **Explore.** Walk the astronaut across the 3D terrain (WASD / arrows, or the on-screen pad on phones). Every place has a 3D model, a light beam and a name label. The radar and its roster show what is still silent, and **🚶 Go** walks you there.
3. **Restore a place.** Walk up and press **E / Enter** (or tap **E**). Each place is a short loop: **hands-on mini-game → real NASA discovery and fact-vs-idea sort → restore step**. Each one restored brings the next ship system online.
   - Mars systems: **Navigation → Power → Comms → Heat shield → Main engine**.
   - Moon systems: **Guidance → Power → Ascent engine**.
4. **Final launch check.** Once every system is online, the ship asks one question from each of the places that player restored first. So every player's check is different.
5. **Launch and ending (~30 s).** Lift-off, then the player presents a "Mission Report" to a cheering crowd. The slides and captions come from the places *that player* restored, and their name is on the astronaut's badge. The end card shows datapoints, systems and XP, and links to the other world.

**Bonus places:** the ending needs only 5 on Mars (3 on the Moon), but every place stays playable before and after it. Extra restorations show as `+N` on the top bar.

### 2.3 Mars: the nine places

| # | Place | How it appears | Mini-game | What the player learns |
|---|---|---|---|---|
| 1 | **Sojourner Rover** (Mars Pathfinder) | 3D rover | Signal-Delay Driver | Driving with an Earth–Mars light-time delay; APXS needs close contact. |
| 2 | **Spirit & Opportunity** | Two 3D rovers (pick one, both count) | Dead-Wheel Dig / Blueberry Hunt | A stuck wheel dug up ~90% silica; hematite "blueberries" formed in groundwater. |
| 3 | **Viking 1 & 2 Landers** | Viking 1 plus a Viking 2 model | Scoop & Bake | Why "no organics found" was not "no life". |
| 4 | **Phoenix & InSight Landers** | InSight plus a Phoenix model | Marsquake Catcher | P and S waves; the shadow of a liquid core. Phoenix touched water ice. |
| 5 | **Ingenuity Helicopter** | 3D helicopter with a broken blade | First Flight | Thin air means fast rotors and light parts; the first powered flight on another planet. |
| 6 | **Dawn** | 📡 Holo-beacon | Orbit Hopper | Ion engines: tiny thrust for a very long time; orbiting two worlds (Vesta and Ceres). |
| 7 | **NEAR Shoemaker** | 📡 Holo-beacon | Soft Touch on Eros | Landing on a tiny asteroid with almost no gravity. |
| 8 | **Pioneer 10 & 11** | 📡 Holo-beacon | Slingshot | Gravity assists: gaining speed from a planet without fuel. |
| 9 | **Kepler Space Telescope** | 📡 Holo-beacon | Transit Hunter | Finding planets from repeated dips in starlight; one dip is not proof. |

Dawn, NEAR Shoemaker, Pioneer and Kepler **never went to Mars**. They appear as clearly labelled **holo-beacon stations**: a relay pad projects a hologram built from NASA records, and the hub always says where the real spacecraft is now. Each place links to its NASA mission page and its NSSDCA record.

### 2.4 The Moon: four Apollo-era sites

| # | Site (NSSDCA) | Mini-game | What the player learns |
|---|---|---|---|
| 1 | **Apollo 11 Eagle descent stage** (1969-059C) | Lighten & Lift | The descent stage stayed behind as a launch pad, so less mass had to fly to orbit. |
| 2 | **Apollo 15 Lunar Roving Vehicle** (1971-063C) | Walk-back Rule | The rover never drove farther than the crew could walk back. |
| 3 | **Surveyor 3** (1967-035A) | Pinpoint Landing | Apollo 12 landed near Surveyor 3 and brought parts home to study 31 months of space exposure. |
| 4 | **Apollo laser retroreflectors** | Hit the Mirror | Distance = speed of light × round-trip time ÷ 2 (about 1.28 s each way). |

The Moon world reuses the same engine with a lunar skin: grey regolith with dark maria patches, crater rims, a black starry sky, a bright white Sun and Earth hanging overhead. The 3D models and card artwork are original illustrations labelled **"Illustration · based on NASA records"**.

### 2.5 TARS, the hint system
- Tap TARS any time for a hint about the current screen: the hint fits the mini-game, question or panel that is open.
- If the player is idle or keeps failing, TARS offers help on its own (sooner for younger players). In question screens it can cross out one wrong answer.
- Auto-hints can be turned off from the ⚙ menu.

### 2.6 Deeper Mars investigations (original archive)
Each original Mars machine also keeps its full inquiry investigation (**Meet Hardware → Operate → Observe → Interpret → Report**):
- the Sojourner 3D rock yard and rear-APXS contact gap;
- the Viking 200 °C / 500 °C GCMS and perchlorate interpretation;
- Spirit's RAT vs. silica trench;
- Opportunity's IDD turret switcher (68 mm MI focus, Mössbauer);
- InSight's SEIS deployment and P/S picks.

These include Claim / Evidence / Uncertainty reports, pre/post transfer checks and the NSSDCA archive.

---

## 3. Project files

| File | Role |
|---|---|
| `index.html` | Landing page: choose Mars or the Moon. |
| `mars.html` | The 3D engine for both worlds: Three.js scene, original Mars investigations, save state (`btsm.save.v1`). |
| `rq-world.js` | World switch (`RQ.W`): reads `?world=moon`, holds per-world settings (required count, ship systems) and re-skins the scene for the Moon. |
| `mars-games.js` | Mini-game engine (`RQ.mg`), the original Mars mini-games and the evidence sorter. |
| `mars-datapoints.js` | Pilot profile (`RQ.me`), the shared site layer (`RQ.site`: 3D placement, holo-beacons, radar, walk-up prompts) and the progression, ship panel and final launch check (`RQ.dp`). |
| `rq-sites-mars.js` | Ingenuity and the Dawn, NEAR, Pioneer and Kepler beacons: content, 3D models, mini-games, plus the Viking 2 and Phoenix models. |
| `rq-sites-moon.js` | The four Apollo-era Moon sites: content, 3D models and mini-games. |
| `mars-cinema.js` | Crash intro, launch, personalized presentation ending and end card (`RQ.cine`), for either world. |
| `mars-experience.js` | Top bar, next-step guidance, mission picker, machine hubs, TARS hints, boot flow. |
| `mars-ui.css` | UI styles for all of the above, including mobile layouts below 640 px. |
| `moon.html` | Redirects to `mars.html?world=moon`. |

The earlier 2D Moon "magazine" lab (`moon.html`, `moon.js`) is archived under `original/moon-magazine/` and is not part of the release.

### Saved on the device (`localStorage`)
| Key | Contents |
|---|---|
| `btsm_v4_profile` | Name, age, tier and quiz answers (shared by both worlds). |
| `btsm.save.v1` | Original Mars machine progress (XP, modules, machines). |
| `rq.sites` | Progress for the newer places on both worlds (seen / won / stars / discovery / restored). |
| `rq.dpOrder`, `rq.dpOrder.moon` | Order in which places were restored on each world. |
| `rq.launchOK`, `rq.launchOK.moon` | Final launch check passed on each world. |
| `rq.stars`, `rq.sort` | Mini-game stars and sorter results. |
| `rq.introSeen(.moon)`, `rq.outroSeen(.moon)`, `rq.autohint` | Cinematic and hint preferences. |

Mars keeps the original key names, so older saves still load. Old Spirit/Opportunity and InSight entries are upgraded to the combined places automatically.

---

## 4. Image manifest and offline assets

<!-- IMAGE_COUNTS -->
32 manifest entries: 32 locally_acquired.
<!-- /IMAGE_COUNTS -->

`data/hardware-images.json` is the single source of truth for all 32 NASA hardware, overview and evidence photographs. After editing the manifest, run `node tools/sync-docs.mjs` to update `docs/IMAGE_CREDITS.md`, this README and the embedded fallback in `mars.html`. Artwork for the newer places is drawn in code (SVG and Three.js) and labelled "AI-assisted illustration".

---

## 5. Testing, verification and release packaging

Run the deterministic Node.js logic, syntax and asset suite (27 groups):

```bash
node tools/sync-docs.mjs
```

```bash
node tools/check.mjs
```

Verify the clean release manifest (no nested `.git`, `node_modules` or dev clutter):

```bash
node tools/build-release.mjs
```

Run the real-browser Playwright suite (it needs Playwright's Chromium: `npx playwright install chromium`):

```bash
npx playwright test --reporter=list
```

The suite seeds a returning-player profile so the first-run name/age screen and intro don't block the scripted flows.

See also:
- [docs/QA_REPORT.md](docs/QA_REPORT.md) and [docs/BROWSER_QA_REPORT.md](docs/BROWSER_QA_REPORT.md): test evidence and screenshots.
- [docs/SCIENCE_FACT_CHECK.md](docs/SCIENCE_FACT_CHECK.md): claim-by-claim science ledger.
- [docs/LEARNING_OUTCOMES.md](docs/LEARNING_OUTCOMES.md) and [docs/PILOT_EVALUATION_PROTOCOL.md](docs/PILOT_EVALUATION_PROTOCOL.md): learning design and the classroom evaluation protocol.
- [docs/SUBMISSION.md](docs/SUBMISSION.md) and [docs/PRESENTATION_SLIDES.md](docs/PRESENTATION_SLIDES.md): the submission package and slide outline.
- [docs/AI_USE_DISCLOSURE.md](docs/AI_USE_DISCLOSURE.md): how AI assistance (Claude, Anthropic) was used, and how AI-assisted content is labelled.
- [docs/REFERENCES.md](docs/REFERENCES.md): every NASA source, photo, paper, library and tool.
