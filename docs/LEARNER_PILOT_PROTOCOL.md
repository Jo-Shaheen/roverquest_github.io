# RoverQuest — Youth Learner Pilot Protocol (Ages 10–18)

> **Status:** Protocol prepared and ready to administer; **no classroom or youth pilot has been conducted yet**. Do not cite any metrics from this protocol as collected evidence until sessions are run and logged honestly.

## 1. Purpose
Evaluate whether learners aged 10–18 can use RoverQuest independently to:
1. Navigate between worlds (`index.html`, `mars.html`, `mars.html?world=moon`) and operate instrument simulations without facilitator hints.
2. Separate **authentic mission observations** (NASA images, archive records) from **scientific interpretations** and **teaching reconstructions / simplifications**.
3. Formulate a written Claim–Evidence–Uncertainty report that identifies at least one limitation or assumption.

## 2. Target Participants & Sampling
- **Age band:** 10–18 years (approximately Grades 5–12), stratified across younger (10–12) and older (13–16) bands using the in-app **Explorer / Scientist / Engineer** explanation selector.
- **Recommended sample:** 8–15 youth across individual and paired laptop/tablet sessions (plus 1–2 mobile phone sessions at `390×844` to check touch layout usability).
- **Pre-session safeguard:** Obtain parent/guardian permission before running sessions with minors; record responses under anonymous participant codes (`P01`, `P02`, ...) with zero personal identifying information.

## 3. Environment & Setup
1. Serve RoverQuest locally (`npm start`, opening `http://127.0.0.1:4173/index.html`) or verify complete offline execution with Wi-Fi disabled.
2. Clear `localStorage` before each new participant starts so diagnostic pre-checks and saved journals start clean.
3. Have screen recording or facilitator observation notes ready to mark timestamps where a participant hesitates or asks a question.

## 4. Session Flow (25–30 Minutes)
1. **Orientation (2 min):** Read short prompt: *"Explore one Moon site and at least one Mars investigation. Think aloud as you decide what buttons to press. There is no grade — we are testing the software, not you."*
2. **Moon World (8–10 min):**
   - Open **the Moon (`mars.html?world=moon`)**, walk to either the **Apollo 15 LRV** (Walk-back Rule) or the **laser retroreflectors** (Hit the Mirror).
   - Complete the loop: mini-game → discovery and fact-vs-idea sort → restore question.
3. **Mars Investigation (12–15 min):**
   - Open **Mars (`mars.html`)**, complete **Sojourner** (ramp decision, hazard route, APXS contact gap, claim/evidence/uncertainty report) or **Opportunity** (Microscopic Imager focus standoff, Mössbauer iron-mineral pair, PIA19113 comparison, interpretation).
   - Reload browser mid-mission once (facilitator asks learner to refresh browser tab) to confirm saved progress resumes cleanly with **Continue / Restart** behavior.
4. **Short Debrief & Form (3–5 min):**
   - Ask 3 oral reflection questions and have the learner complete `docs/LEARNER_FEEDBACK_FORM.md`.

## 5. Observation Metrics Checklist (Facilitator Log)
Record strictly observed counts during real sessions:
- **Task completion without verbal intervention:** Yes / Partial (needed 1 hint) / Blocked.
- **Diagnostic pre-check vs transfer post-check selection:** Record participant's first answer on both (without coaching).
- **Evidence vs inference check:** Can the learner point out *which elements* in the simulation are invented/synthetic teaching datasets vs real NASA images/records? (Yes / Needs prompt / No).
- **UI friction points:** Any confusing button label, hidden control, scroll issue, keyboard focus trap, or unreadable text.
- **Session log export:** Export Moon (`roverquest-moon-journal.json`) and Mars (`roverquest-learning-report.json`) JSON files under the anonymous code `P##`.
