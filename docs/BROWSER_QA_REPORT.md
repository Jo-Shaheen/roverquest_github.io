# Browser QA & Accessibility Report — RoverQuest: Beyond the Silent Machines

**Updated:** November 13, 2026  
**Browser Engine:** Playwright Chromium (Headless & Headed Desktop `1440×900`, Tablet `768×1024`, Mobile `390×844`)  
**Server URL:** `http://127.0.0.1:4173` (`tools/serve.mjs`)

---

## 1. Real-Browser Chromium Verification Executed

### Confirmed & Verified in Real Chromium (`mars-astronaut-tars-desktop.png`, `mars-astronaut-tars-mobile.png`)
- **Command Executed:**
  ```powershell
  node node_modules\@playwright\test\cli.js test -g "astronaut avatar" --reporter=list
  ```
- **Result:** `2 passed (23.2s)` in real Chromium:
  1. **Desktop (`1440×900`)**:
     - `mars.html` loads over `http://127.0.0.1:4173/mars.html` with local `vendor/three.min.js` (Three.js revision `128`).
     - `AS.g.visible === true` and `mr.children.includes(AS.g) === true` (3D Astronaut avatar is visible in the Three.js scene both during the mission picker and in free exploration after `exitSub()`).
     - `#tars-monolith` is visible (`width >= 36px`, `height >= 50px`, inside viewport bounds) with `aria-label` matching `/TARS/`.
     - Clicking `#tars-monolith` opens `#tars-bubble` and displays the `Request Hint` button.
     - Zero `pageerror`, zero `console.error`, and zero failed local asset requests.
     - Screenshot saved to `docs/screenshots/mars-astronaut-tars-desktop.png`.
  2. **Mobile (`390×844`)**:
     - `#tars-monolith` is visible at `top: 128px; right: 8px` (`40×58 px`) instead of being hidden by `@media(max-width:700px)`.
     - `#mm-wrap` starts in the `minimized` pill state (`height < 200px`) on mobile viewports so the Mars Radar roster does not cover the 3D Astronaut, 3D TARS, or Martian terrain.
     - Screenshot saved to `docs/screenshots/mars-astronaut-tars-mobile.png`.

---

## 2. Refactored 12-Test Mission-Level Playwright Suite (`tests/e2e/roverquest.spec.mjs`)

In response to the technical review recommendation to split the monolithic Mars test into independent, maintainable mission-level tests with shared helpers (`bootMarsMission`, `inspectCurrentMachinePhotos`, `assertAllLoadedImages`, `attachRuntimeMonitors`), `tests/e2e/roverquest.spec.mjs` is structured into **12 independent tests**:

1. **`Landing page loads offline with zero network dependencies and opens chapters`**
   - Verifies `index.html` heading `RoverQuest: Beyond the Silent Machines`, Mars/Moon links, offline route blocking, and saves `docs/screenshots/landing-desktop.png`.
2. **`Moon world: moon.html redirects to a 3D Moon with 4 Apollo-era sites, any 3 restore the ship`**
   - Verifies the redirect to `mars.html?world=moon`, Three.js r128, `RQ.W.required === 3`, the four site ids (`eag`, `lrv`, `sur`, `llr`), that the Mars machines are hidden, and that the Eagle hub opens; saves `docs/screenshots/moon-world-eagle.png`.
   - A companion test, **`Mars has 9 places to explore and needs any 5`**, checks the nine Mars place ids.
3. **`Mars 1/5 — Sojourner completes Stage 2 photos, 3D rock yard driving, rear APXS 0 cm gap, gibberish gate, report & transfer check`**
   - Verifies Stage 2 hotspot photos, 3D rock yard (`SojournerRockYard3D`), live 3D rover coordinate synchronization during 2D grid driving, rear APXS 0 cm contact gap gate, Self-Check Explanation Checklist, gibberish rejection, and transfer post-check.
4. **`Mars 2/5 — Viking 1 Lander completes Stage 2 photos, mid-task reload persistence at 200°C GCMS, perchlorate interpretation & transfer check`**
   - Verifies Stage 2 photos, `PIA00389` trench evidence photo, mid-task page reload at `200°C` GCMS step, `500°C` completion, and transfer post-check.
5. **`Mars 3/5 — Spirit Rover completes Stage 2 photos, dragged-wheel silica trench, Mini-TES/APXS & transfer check`**
   - Verifies Stage 2 photos, `PIA12312` wheel-trench evidence photo, ~91 wt% opaline silica interpretation, and transfer post-check.
6. **`Mars 4/5 — Opportunity Rover completes Stage 2 photos, flexible IDD strategy switcher, MI 68 mm focus, Mössbauer, reload resume, PIA19113 & transfer check`**
   - Verifies Stage 2 photos, the **IDD Turret Strategy (Flexible Order)** switcher between Microscopic Imager and Mössbauer, MI 68 mm standoff focusing, 12 h Mössbauer integration on sphere and rock, mid-task reload at Phase 3, `PIA19113` evidence decoding, and transfer post-check.
7. **`Mars 5/5 — InSight Lander completes Stage 2 photos, SEIS/WTS deployment, P/S wave arrival picks, liquid core inference, Archive, Report & 3D Inspector`**
   - Verifies Stage 2 photos, `PIA23177` SEIS evidence photo, P-wave (22 s) and S-wave (58 s) picks, Learning Report (`#v4-report-btn`), NSSDCA Archive (`#v4-archive-btn`), Badges (`#bb`), and 3D Hardware Inspector (`KeyI` + `Escape`).
8. **`Responsive layout, HUD non-overlap, font scaling & axe accessibility at desktop (1440x900)`**
9. **`Responsive layout, HUD non-overlap, font scaling & axe accessibility at tablet (768x1024)`**
10. **`Responsive layout, HUD non-overlap, font scaling & axe accessibility at mobile (390x844)`**
11. **`Mars astronaut avatar, 3D TARS monolith, 2D TARS widget & movable radar are visible and interactive (desktop)`**
12. **`Mars astronaut avatar, 3D TARS monolith, 2D TARS widget & movable radar are visible and interactive (mobile)`**

---

## 2b. First-Run Onboarding in Automated Tests

On a fresh browser profile, `mars.html` now opens with a **name/age screen** followed by the crash intro. `tests/e2e/roverquest.spec.mjs` seeds `btsm_v4_profile` (a test pilot, age 12) and `rq.introSeen` through `page.addInitScript` in `beforeEach`, so every test starts as a returning player. The manual verification of onboarding, the 9-datapoint picker, the any-5-of-9 gate and the personalised ending is recorded in [QA_REPORT.md §4](QA_REPORT.md).

---

## 3. How to Run the Full Playwright Suite Locally

From a terminal outside a loopback-restricted sandbox:

```bash
node tools/check.mjs
npx playwright test --reporter=list
```
