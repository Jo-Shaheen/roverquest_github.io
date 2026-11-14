# RoverQuest — Learning Outcomes & Epistemic Alignment Matrix

> **Honesty Note:** Pre-checks and transfer post-checks in RoverQuest are **unvalidated practice checks**, and rubric depth scores (`0–2`) are **local reflection heuristics**, not formal psychometric assessments or proven classroom learning gains. Classroom pilot evaluation (`docs/LEARNER_PILOT_PROTOCOL.md`) has not yet been conducted.

## Core Pedagogical Spine
Every mission follows the five-stage structure:

`Diagnostic Idea → Meet Hardware & Context → Operate & Compare Evidence → Transfer Check & Structured Report → Archive Record`

Learners repeatedly practice three scientific habits across all nine hardware stories:
1. **Instrument geometry matters:** Cameras, contact spectrometers, sample scoops, seismic shields, and laser ranging all require specific physical conditions (standoff distance, obstacle clearance, wind shielding, controlled test geometry, two-way light time).
2. **Observation vs. Interpretation:** A spectrum peak, white silica trench, chlorinated gas desorption, or concrete spherule does not automatically prove biological life or global uniformity—context and alternative chemical/geological pathways must be weighed.
3. **Explicit simplification & uncertainty:** Learners are shown exactly what each interactive model simplifies or invents so they never mistake educational sliders for raw NASA flight telemetry.

---

## Story-by-Story Curriculum Alignment (All 9 Machines)

### Mars Chapter (`mars.html`)

| Mission | Core Concept | Common Misconception Addressed | Diagnostic Pre vs Transfer Post Design | Teaching Simplifications Disclosed |
| --- | --- | --- | --- | --- |
| **Sojourner** (`1996-068A`) | Hazard avoidance, rear-mounted APXS close-contact alpha/X-ray sensing | Thinking a rover measures elements accurately from meters away, or that one chemical reading alone proves origin | **Pre:** Effect of a 5 cm air gap on low-energy APXS particles.<br>**Post:** Interpreting a different rock composition (low silica basalt vs reference soil) on a future rover without claiming biological origin. | 2D hazard grid, rover heading, `0–5 cm` gap slider, and teaching oxide values are invented instructional models (not Pathfinder telemetry). |
| **Viking 1 Lander** (`1975-075C`) | Subsurface sampling vs UV-exposed dust & pyrolysis/perchlorate confounding | Assuming Viking either proved life via trace chlorinated gases or proved all Martian soil sterile everywhere | **Pre:** Difference between sunlit surface dust crust and shielded soil.<br>**Post:** Applying pyrolysis confounding to a new lander finding trace organics only at low heat with oxychlorine salts. | Single-step `200°C / 500°C` schematic buttons; note clearly states Phoenix detected perchlorates at a different site rather than Viking soil itself. |
| **Spirit Rover** (`2003-027A`) | Distinguishing weathering coatings (RAT) from wheel-exposed hydrothermal silica (~91 wt%) | Confusing pure amorphous opaline silica precipitated in hot fluids with desert windblown quartz sand | **Pre:** Why geologists grind away dust/rinds before claiming rock composition.<br>**Post:** Identifying fossilized hot-spring/acid-steam precipitation when opaline silica & sinter textures appear together. | Published Squyres et al. (2008) silica conclusion is compared directly rather than computing raw Mini-TES emissivity spectra. |
| **Opportunity Rover** (`2003-032A`) | Fixed-focus MI arm standoff (~68 mm), Mössbauer mineral ID, multiple lines of outcrop evidence (`PIA19113`) | Picking loose sand grains to infer bedrock growth history or mixing observation with assumption | **Pre:** Distinguishing loose lag spherules from outcrop-embedded spherules.<br>**Post:** Recognizing similar water-precipitated concretions when laminated claystone contains iron-oxide spheres and gypsum veins. | Synthetic MI blur texture and schematic 6-line / 2-line Mössbauer graphs; explicitly contrasted with real NASA MI photo `PIA19113`. |
| **InSight Lander** (`2018-042A`) | Seismometer placement & wind/thermal shielding, P–S lag time, shear waves vs liquid core | Thinking wind shielding only protects solar panels or that S waves travel easily through liquids | **Pre:** Effect of surface wind gusts and ±70°C swings on an exposed seismometer.<br>**Post:** Explaining an S-wave shadow zone opposite an exoplanet quake via a fluid core region. | Clean synthetic P (~22 s) and S (~58 s) waveform (not raw event S0976a); core radius noted as model-dependent including 2023 molten silicate revisions. |

### Moon (earlier 2D lab, archived)

The earlier 2D Moon "magazine" lab (four guided stories with written reports) is archived in `original/moon-magazine/` and is no longer part of the game. The Moon is now a 3D world built on the same engine as Mars; its learning targets are listed under **Moon world mini-games** below.

---

## Personalised Learning Path (both worlds, `mars.html` and `mars.html?world=moon`)

### Age-adaptive tiers
At first launch the learner enters a first name/nickname and age. The game stores them on the device only (`btsm_v4_profile`) and then picks a tier:

| Age | Tier | Explanation style | Mini-game tuning | TARS hint timing |
|---|---|---|---|---|
| 10 and under | Explorer | Short, concrete sentences; analogies | ~30% more fuel/battery/aim tolerance; "ghost" aiming aid in Hit the Mirror | Offers help ~30% sooner |
| 11–14 | Scientist | Standard explanations with key terms | Slightly forgiving | Standard |
| 15+ | Engineer | Mission-data style plus "Engineer's notes" on Moon discoveries | Slightly tighter tolerances | Waits ~35% longer |

The learner's name appears throughout: TARS's coaching, progress messages, and the ending, where they "present" a mission report built from their own datapoints. The aim is ownership: *"I fixed the ship with what I learned."*

### Choice: any 5 of 9 on Mars, any 3 of 4 on the Moon
Every place is playable. On **Mars**, restoring any five of the nine places brings the ship's five systems (Navigation, Power, Comms, Heat shield, Main engine) online. On the **Moon**, any three of the four Apollo-era sites bring its three systems (Guidance, Power, Ascent engine) online. Choice supports learner autonomy, and the rest stay available as bonus replay content.

Each place follows the same short loop:

`Walk up in 3D → Hands-on mini-game → Real NASA discovery → Fact-vs-idea sort → Restore question (with explained wrong answers)`

The **final launch check** asks one question from each of the places the learner restored first. It is a retrieval-practice review of their own path, not a fixed quiz.

### New Mars places: learning targets (`rq-sites-mars.js`)

| Place | Mini-game | Concept practised | Misconception targeted | Simplification disclosed |
|---|---|---|---|---|
| Ingenuity Helicopter (3D model) | First Flight | Mars air is ~1% as dense as Earth's, so rotors spin ~2,400 rpm; light parts and fast blades give lift | "Helicopters can't fly on Mars" / "Same rotor speed as on Earth" | Lift curve, gravity and dust drift are scaled game values |
| Dawn (holo-beacon) | Orbit Hopper | Ion engines give tiny thrust for a long time; changing orbit bands around Vesta/Ceres | "Spacecraft need big rockets for every move" | Orbit bands and fuel are game units; no orbital mechanics equations |
| NEAR Shoemaker (holo-beacon) | Soft Touch on Eros | On a tiny asteroid, landing is about matching speed gently (~1.5–1.8 m/s) | "Low gravity means landing is easy" | Gravity and braking are scaled; the photo count is illustrative |
| Pioneer 10 & 11 (holo-beacon) | Slingshot | Gravity assist: borrowing a planet's motion to gain speed without fuel | "A flyby only slows a spacecraft down" | 2D point-mass gravity with a moving planet; distances not to scale |
| Kepler (holo-beacon) | Transit Hunter | Repeating dips in starlight reveal a planet; a deeper dip means a bigger planet | "One dip proves a planet" | Synthetic light curve with added noise blips |

Holo-beacons are introduced as relay stations projecting holograms; each hub states that the spacecraft never went to Mars and where it really is now.

### Moon world mini-games: learning targets (`mars.html?world=moon`)

| Site | Mini-game | Concept practised | Misconception targeted | Simplification disclosed |
|---|---|---|---|---|
| Apollo 11 Eagle | Lighten & Lift | Staging: sort what stays (descent stage, legs, empty tanks, experiments) vs. what flies, then fly a fuel-limited ascent burn to orbit | "The whole lunar module flew home" | Gravity, thrust and fuel are scaled teaching values, not LM propulsion data |
| Apollo 15 LRV | Walk-back Rule | Exploring within a safety radius the crew could walk back from; battery budgeting | "Farther is always better" | Map, radius and battery drain are game units |
| Surveyor 3 | Pinpoint Landing | Precision landing (Apollo 12 landed near Surveyor 3); choosing which parts to bring home to study space exposure | "Old hardware has nothing left to teach" | Landing physics are simplified; the part list is based on what Apollo 12 retrieved |
| Laser retroreflectors | Hit the Mirror | Two-way light time: distance = c × t ÷ 2 (~1.28 s each way) | Forgetting to halve the round trip | Beam aiming and mirror drift are illustrative; no atmospheric or relativistic corrections |

> As elsewhere, these mini-games are **practice activities**, not validated assessments.
