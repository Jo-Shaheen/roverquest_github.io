# NASA Space Apps 2026 Submission Package: RoverQuest: Beyond the Silent Machines

**Challenge:** Abandoned but not Forgotten  
**Project title:** RoverQuest: Beyond the Silent Machines  
**Audience:** Learners aged 10–18, educators, and space history enthusiasts  
**Runtime:** 100% offline-capable HTML5 / CSS3 / vanilla JS, with Three.js r128 bundled locally (`vendor/three.min.js`) and 32 NASA photographs packaged in `assets/hardware/`. Works on desktop, tablet and phone.

---

## 1. Summary and problem statement

Decades of exploration have left a silent museum of human-made machines on Mars and the Moon: landers, rovers, scoops and laser mirrors. NASA's **NSSDCA** and **Planetary Photojournal** preserve their records. Young learners, though, rarely connect **how a machine was engineered** with **what scientists learned from it, and what is still uncertain**.

**RoverQuest** turns these machines into one story across **two fully explorable 3D worlds**. The player's ship crash-lands with its systems offline, and the silent machines hold the know-how to fix it.

- **Mars (9 places, any 5):** Sojourner, Spirit & Opportunity, Viking 1 & 2, Phoenix & InSight and Ingenuity stand on the plain as 3D models. Dawn, NEAR Shoemaker, Pioneer 10 & 11 and Kepler never went to Mars, so they appear as clearly labelled **holo-beacon stations** that say where the real spacecraft is.
- **The Moon (4 sites, any 3):** the Apollo 11 Eagle descent stage, the Apollo 15 Lunar Roving Vehicle, Surveyor 3 and the Apollo laser retroreflectors, on a grey plain with Earth in the black sky.

Each place is a hands-on mini-game plus a real NASA discovery. Restoring enough of them brings every ship system online, unlocks a final launch check built from that player's own places, and leads to a personalized ending where the player presents what they learned. Every place stays playable as bonus content.

The game asks for the player's **name and age** at the start and adapts to them:
- the name appears in captions, TARS's lines and the ending presentation;
- the age sets explanation depth, mini-game difficulty and how soon TARS offers hints.

Both are stored only on the device.

---

## 2. Judging criteria alignment

| Criterion | Evidence in this repository | Honest scope |
|---|---|---|
| **Impact** | A personalized learning path for ages 10–18, in three tiers: Explorer (≤10), Scientist (11–14) and Engineer (15+). Each tier changes wording, difficulty and hint timing. Players choose any 5 of 9 places on Mars and any 3 of 4 on the Moon, which gives them agency and replay value. TARS gives context-aware hints that adapt to the player. Progress is saved locally, with a learning report and JSON export. A ready-to-run classroom protocol is in `docs/PILOT_EVALUATION_PROTOCOL.md`. | Reflection scores are labelled *"Submitted for reflection — not validated learning scores."* No student pilot study is claimed. |
| **Creativity** | A crash-landing intro and a launch-and-presentation ending, where the slides and captions come from the datapoints the player actually restored. There are 14 original mini-games: Signal-Delay Driver, Scoop & Bake, Dead-Wheel Dig, Blueberry Hunt, Marsquake Catcher, First Flight, Orbit Hopper, Soft Touch on Eros, Slingshot, Transit Hunter, Lighten & Lift, Walk-back Rule, Pinpoint Landing and Hit the Mirror. Both 3D worlds include an astronaut, the TARS companion, holo-beacons and a draggable radar. | Procedural 3D models, holograms and original illustrations are labelled as approximations, never as NASA photographs. |
| **Validity** | **27 / 27** deterministic Node.js groups pass (`node tools/check.mjs`). All 32 NASA images are bundled locally. Each place links to its NSSDCA record and NASA mission page. Mini-game physics are labelled simplifications. Examples: two-way light time (~1.28 s each way) for laser ranging, and the walk-back radius for the LRV. | The claim-by-claim ledger is in `docs/SCIENCE_FACT_CHECK.md`. |
| **Relevance** | The game is built directly on the challenge theme: machines that are "silent but not forgotten". It covers the nine missions in the challenge brief (Sojourner, Spirit & Opportunity, Viking 1 & 2, Phoenix & InSight, Dawn, NEAR Shoemaker, Pioneer 10 & 11, Ingenuity and Kepler) on Mars, plus four Apollo-era machines on the Moon. Each shows how abandoned hardware still teaches us or still works (the lunar laser mirrors are ranged to this day). | It separates documented observations from interpretations, real photos from teaching simulations, and real locations from holo-beacons. |
| **Presentation** | A cinematic opening and ending, a polished mobile-first UI, a one-click Windows launcher (`run.bat`), a release validator (`node tools/build-release.mjs`) and a slide outline (`docs/PRESENTATION_SLIDES.md`). | Ready for a live offline demo or static hosting. |

---

## 3. Quick verification commands for judges

Start the local server, then open http://127.0.0.1:4173/mars.html:

```bash
node tools/serve.mjs
```

Sync the manifest docs and run the 27 automated checks:

```bash
node tools/sync-docs.mjs
```

```bash
node tools/check.mjs
```

Verify the clean release file manifest:

```bash
node tools/build-release.mjs
```

**A suggested 3-minute demo:**
1. Open `mars.html?intro=1`, enter a name and age, and watch the crash.
2. Restore Ingenuity, then walk to the Kepler holo-beacon and show where the real telescope is.
3. Open the ship panel to see 2/5 systems online.
4. Open `mars.html?world=moon` to show the lunar world: the Eagle descent stage with Earth in the sky.
5. Show how changing the age in **⚙ Menu → Pilot** changes TARS's wording.
