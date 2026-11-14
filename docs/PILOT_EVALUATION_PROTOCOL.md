# Classroom & Learner Pilot Evaluation Protocol (Ages 10–18)

**Project:** RoverQuest: Beyond the Silent Machines  
**Status:** Ready-to-Administer Evaluation Protocol (**No empirical learner study has been conducted yet; zero learner outcome numbers are fabricated.**)  
**Companion Forms:** See also `docs/LEARNER_PILOT_PROTOCOL.md` and `docs/LEARNER_FEEDBACK_FORM.md`.

---

## 1. Purpose & Honest Impact Posture

To satisfy the **NASA Space Apps Cairo 2026 Impact & Validity** criteria honestly:
- In-app diagnostic pre-checks, transfer post-checks, and 0–2 Claim/Evidence/Uncertainty rubrics are explicitly labelled **"Submitted for reflection — not validated learning scores."**
- This protocol provides a complete, classroom-ready 25-minute evaluation procedure for 5–15 students aged 10–16 so educators or judges can measure authentic usability and conceptual transfer without requiring accounts or cloud servers.

---

## 2. Target Participants & Setup

- **Age Group:** 10–18 years old (Grades 5–12; middle school and early high school earth/space science).
- **Group Size:** 5–15 learners (individual or paired workstations).
- **Hardware & Network:** Any desktop, laptop, or tablet running Chrome, Edge, Firefox, or Safari at `http://127.0.0.1:4173/index.html` via `run.bat` / `node tools/serve.mjs` (100% offline-capable).
- **Privacy & Ethics:** Zero PII collected online. Learners may enter an optional nickname stored only in local `localStorage` (`btsm_v4_profile`), and exported JSON journals (`lunar-field-journal.json`, `roverquest-learning-report.json`) remain on the local device.

---

## 3. 25-Minute Guided Session Structure

| Minute | Activity Phase | Facilitator Instructions & Observation Focus |
|---|---|---|
| **0–3 min** | **Introduction & World Choice (`index.html`)** | Ask students to open `http://127.0.0.1:4173/index.html`, read the 5-step inquiry loop (*Meet Hardware → Operate → Observe → Interpret → Report*), and choose either the **Moon** or **Mars** chapter. |
| **3–10 min** | **Moon World (`mars.html?world=moon` → Eagle or laser mirrors)** | Students walk to the **Eagle descent stage** (Lighten & Lift) or the **laser retroreflectors** (Hit the Mirror), finish the mini-game, read the NASA discovery, sort facts from ideas, and answer the restore question. Note whether they can explain why the descent stage stayed behind, or why the round-trip time is halved. |
| **10–18 min** | **Mars Flagship Investigation (`mars.html` → Sojourner or Opportunity)** | Students use the Mission Picker or movable Mars Radar (`#mm-wrap`) to visit **Sojourner** (rear ramp → 3D rock yard route → 0 cm rear APXS contact → report) or **Opportunity** (Target B → flexible IDD turret switcher for 68 mm MI focus & 12 h Mössbauer → `PIA19113` evidence checklist). |
| **18–22 min** | **Source Verification & Export (`#v4-archive-btn`, `#v4-report-btn`)** | Students open the **NASA NSSDCA Archive** to compare the gameplay reconstruction against real planetary landing coordinates, then open the **Learning Report** and click `⬇ Export JSON Report`. |
| **22–25 min** | **5-Question Learner Feedback Form (`docs/LEARNER_FEEDBACK_FORM.md`)** | Students complete the short usability and conceptual reflection form. |

---

## 4. Quantitative & Qualitative Metrics to Record

1. **Task Completion Rate (%):** Percentage of learners who complete at least 1 Moon investigation and 1 Mars investigation within 20 minutes without facilitator intervention.
2. **Pre- vs. Transfer Post-Check Shift:** First-attempt accuracy on the baseline diagnostic question vs. first-attempt accuracy on the distinct post-activity transfer scenario (exported in `roverquest-learning-report.json`).
3. **Scientific Report Rubric Score (0–6 scale):**
   - **Claim (0–2):** `0` = missing/off-topic; `1` = states a conclusion; `2` = states a specific, accurate conclusion bounded by the instrument's capability.
   - **Evidence (0–2):** `0` = no data cited; `1` = general reference; `2` = cites specific measurements/observations from the activity (e.g., 68 mm MI focus, 0 cm APXS gap, 6-line hematite + 2-line jarosite, or 2-trial LLR mean distance).
   - **Uncertainty / Simplification (0–2):** `0` = claims absolute proof or life; `1` = notes a general limit; `2` = explains a specific instrument limitation or teaching simplification (e.g., surface dust coatings, perchlorate thermal oxidation, velocity-model dependence, or synthetic teaching values).
4. **UI Friction & Hint Usage:** Number of TARS hints requested (`hintsUsed`) and any observed navigation or vocabulary bottlenecks.
