import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SHOT_DIR = path.resolve('docs/screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

function attachRuntimeMonitors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const blockedExternal = [];
  const failedLocal = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.startsWith('http://127.0.0.1:4173')) {
      failedLocal.push(`${req.method()} ${url}: ${req.failure()?.errorText || 'failed'}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    blockedExternal,
    failedLocal,
    async enableOfflineBlock() {
      await page.route('**/*', (route) => {
        const url = route.request().url();
        if (
          url.startsWith('http://127.0.0.1:4173') ||
          url.startsWith('data:') ||
          url.startsWith('blob:') ||
          url.startsWith('about:')
        ) {
          return route.continue();
        }
        blockedExternal.push(url);
        return route.abort();
      });
    },
    assertClean(contextLabel) {
      expect(blockedExternal, `${contextLabel}: unexpected external network requests`).toEqual([]);
      expect(pageErrors, `${contextLabel}: uncaught page errors`).toEqual([]);
      expect(consoleErrors, `${contextLabel}: console errors`).toEqual([]);
      expect(failedLocal, `${contextLabel}: failed local asset requests`).toEqual([]);
    }
  };
}

async function assertAllLoadedImages(page, label) {
  const imgs = page.locator('img:visible');
  const count = await imgs.count();
  for (let i = 0; i < count; i++) {
    const img = imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(async () => {
      return await img.evaluate((el) => el.complete && el.naturalWidth > 0);
    }, { message: `${label} image #${i} failed to decode` }).toBe(true);
  }
}

async function bootMarsMission(page, missionName) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/mars.html', { waitUntil: 'networkidle' });
  const threeInfo = await page.evaluate(() => ({
    rev: typeof THREE !== 'undefined' ? THREE.REVISION : null,
    canvasCount: document.querySelectorAll('canvas').length,
    w: document.querySelector('canvas')?.width || 0
  }));
  expect(threeInfo.rev).toBe('128');
  expect(threeInfo.canvasCount).toBeGreaterThanOrEqual(1);
  expect(threeInfo.w).toBeGreaterThan(200);
  await expect(page.locator('#dlg')).toBeVisible();
  if (missionName) {
    await page.locator(`#dlg button:has-text("${missionName}")`).first().click();
  }
}

async function inspectCurrentMachinePhotos(page, labelPrefix = 'Mars stage 2') {
  await page.locator('#dlg button:has-text("Stage 2")').click();
  await expect(page.locator('#dlg')).toContainText(/Procedural Educational Approximation/i);
  const hotspotButtons = page.locator('#dlg .rg button.opt');
  const n = await hotspotButtons.count();
  expect(n).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < n; i++) {
    await hotspotButtons.nth(i).click();
    await assertAllLoadedImages(page, `${labelPrefix} hotspot ${i}`);
  }
  await page.locator('#dlg button:has-text("Back to Communication Hub")').click();
}

test.describe('RoverQuest Real-Browser E2E & Offline Verification', () => {
  // Seed a returning player so the first-run onboarding (name/age screen + crash intro) doesn't block the scripted flows.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        if (!localStorage.getItem('btsm_v4_profile')) localStorage.setItem('btsm_v4_profile', JSON.stringify({ name: 'Tester', age: 12, tier: 'scientist', preQuiz: {}, postQuiz: {}, hintsUsed: 0 }));
        localStorage.setItem('rq.introSeen', '1');
      } catch (e) {}
    });
  });

  test('Landing page loads offline with zero network dependencies and opens chapters', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/index.html', { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /RoverQuest/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mars/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Moon/i }).first()).toBeVisible();

    await page.screenshot({ path: path.join(SHOT_DIR, 'landing-desktop.png'), fullPage: true });
    mon.assertClean('landing');
  });

  test('Moon world: moon.html redirects to a 3D Moon with 4 Apollo-era sites, any 3 restore the ship', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/moon.html', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/mars\.html\?world=moon/);
    const info = await page.evaluate(() => ({
      world: RQ.W.id,
      required: RQ.W.required,
      total: RQ.dp.TOTAL,
      ids: RQ.dp.list().map((d) => d.id),
      marsMachinesHidden: MC.length === 0,
      rev: THREE.REVISION
    }));
    expect(info.world).toBe('moon');
    expect(info.rev).toBe('128');
    expect(info.required).toBe(3);
    expect(info.total).toBe(4);
    expect(info.ids.sort()).toEqual(['eag', 'llr', 'lrv', 'sur']);
    expect(info.marsMachinesHidden).toBe(true);
    // Walk to the Eagle site and open its hub with the interact key
    await page.evaluate(() => { const d = document.getElementById('dlg'); if (d && d.open !== false) d.style.display = 'none'; RQ.site.go('eag'); });
    await page.waitForTimeout(400);
    await page.evaluate(() => RQ.site.visit('eag'));
    await expect(page.locator('#dlg')).toContainText(/Eagle/i);
    await page.screenshot({ path: path.join(SHOT_DIR, 'moon-world-eagle.png') });
    mon.assertClean('moon');
  });

  test('Mars has 9 places to explore and needs any 5', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, null);
    const info = await page.evaluate(() => ({ required: RQ.W.required, ids: RQ.dp.list().map((d) => d.id) }));
    expect(info.required).toBe(5);
    expect(info.ids.sort()).toEqual(['daw', 'ing', 'kep', 'mer', 'nea', 'phi', 'pio', 'soj', 'vik']);
    mon.assertClean('mars-nine');
  });

  test('Mars 1/5 — Sojourner completes Stage 2 photos, 3D rock yard driving, rear APXS 0 cm gap, gibberish gate, report & transfer check', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, null);
    await page.screenshot({ path: path.join(SHOT_DIR, 'mars-picker-desktop.png') });

    await page.locator('#dlg button:has-text("Sojourner")').first().click();
    await assertAllLoadedImages(page, 'Sojourner hub');
    await inspectCurrentMachinePhotos(page, 'Sojourner');

    await page.locator('#dlg button:has-text("Stage 3")').click();
    await expect(page.locator('#dlg')).toContainText(/DIAGNOSTIC PRE-CHECK/i);
    await page.locator('#v4-assess-opts .opt').first().click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();

    await expect(page.locator('#dlg')).toContainText(/SYNTHETIC TEACHING DATA/i);
    await expect(page.locator('#dlg')).toContainText(/Quick Science Terms/i);

    await page.locator('#dlg button:has-text("front ramp")').click();
    await expect(page.locator('#soj-feedback')).toContainText(/obstructed|rear ramp/i);
    await page.locator('#dlg button:has-text("rear ramp")').click();
    await page.locator('#dlg button:has-text("Teaching rock A")').click();

    // Verify 3D rock yard exists and Sojourner 3D position moves when driving on the 2D grid
    const startX = await page.evaluate(() => curM.g.position.x);
    await page.getByRole('button', { name: 'Drive north' }).click();
    for (let k = 0; k < 4; k++) await page.getByRole('button', { name: 'Drive east' }).click();
    await page.getByRole('button', { name: 'Drive south' }).click();
    const drivenState = await page.evaluate(() => ({
      endX: curM.g.position.x,
      rockYard: !!mr.getObjectByName('SojournerRockYard3D')
    }));
    expect(drivenState.rockYard).toBe(true);
    expect(drivenState.endX).toBeGreaterThan(startX);

    await page.locator('#dlg button:has-text("Turn rear APXS toward rock")').click();

    // Test APXS gap gate & set slider to 0 cm
    await page.locator('#dlg button:has-text("Collect APXS measurement")').click();
    await expect(page.locator('#soj-feedback')).toContainText(/0 cm/i);
    await page.locator('#soj-gap').fill('0');
    await page.locator('#soj-gap').dispatchEvent('input');
    await page.locator('#dlg button:has-text("Collect APXS measurement")').click();

    await page.locator('#dlg button.opt').nth(1).click();
    await expect(page.locator('#dlg')).toContainText(/Self-Check Explanation Checklist/i);
    // Reject mash report
    await page.locator('#soj-claim').fill('qqqqqq wwww eeee');
    await page.locator('#soj-evidence').fill('rrrrrr tttt yyyy');
    await page.locator('#soj-uncertainty').fill('uuuuuu iiii oooo');
    await page.locator('#dlg button:has-text("Submit for reflection")').click();
    await expect(page.locator('#soj-feedback')).toContainText(/repeats|distinct|character|short/i);

    await page.locator('[data-soj-obs]').first().check();
    await page.locator('#soj-claim').fill('Teaching Rock A has higher silica than reference soil, pointing to a distinct rock composition.');
    await page.locator('#soj-evidence').fill('Closing the rear APXS gap to 0 cm recorded 58% SiO2 equivalent versus 44% SiO2 in teaching soil.');
    await page.locator('#soj-uncertainty').fill('These concentrations are an invented teaching dataset and do not prove rock origin from chemistry alone.');
    await page.locator('#dlg button:has-text("Submit for reflection")').click();
    await expect(page.locator('#dlg')).toContainText(/INVESTIGATION COMPLETE/i);

    await page.locator('#dlg button:has-text("After-investigation transfer check")').click();
    await expect(page.locator('#dlg')).toContainText(/DISTINCT TRANSFER POST-CHECK/i);
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();
    await expect(page.locator('#dlg')).toContainText(/NASA SCIENTIFIC DISCOVERY CARD/i);

    mon.assertClean('mars-sojourner');
  });

  test('Mars 2/5 — Viking 1 Lander completes Stage 2 photos, mid-task reload persistence at 200°C GCMS, perchlorate interpretation & transfer check', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, 'Viking 1 Lander');
    await inspectCurrentMachinePhotos(page, 'Viking 1');

    await page.locator('#dlg button:has-text("Stage 3")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();
    await expect(page.locator('#dlg')).toContainText(/SYNTHETIC TEACHING SIMULATION/i);
    await assertAllLoadedImages(page, 'Viking Stage 3 evidence');
    await page.locator('#dlg button:has-text("Collect a Subsurface Sample")').click();
    await page.locator('#dlg button:has-text("Heat to 200")').click();

    // Reload mid-task -> re-open Viking -> confirm oven still at phase 1 with 200C done!
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#dlg button:has-text("Viking 1 Lander")').first().click();
    await page.locator('#dlg button:has-text("Stage 3")').click();
    await expect(page.locator('#dlg')).toContainText(/Heat to 200.*✔/);
    await page.locator('#dlg button:has-text("Heat to 500")').click();
    await page.locator('#dlg button.opt').nth(1).click();
    await expect(page.locator('#dlg')).toContainText(/INVESTIGATION COMPLETE/i);
    await page.locator('#dlg button:has-text("After-investigation transfer check")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();

    mon.assertClean('mars-viking');
  });

  test('Mars 3/5 — Spirit Rover completes Stage 2 photos, dragged-wheel silica trench, Mini-TES/APXS & transfer check', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, 'Spirit Rover');
    await inspectCurrentMachinePhotos(page, 'Spirit');

    await page.locator('#dlg button:has-text("Stage 3")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();
    await expect(page.locator('#dlg')).toContainText(/SYNTHETIC TEACHING SIMULATION/i);
    await assertAllLoadedImages(page, 'Spirit Stage 3 evidence');
    await page.locator('#dlg button:has-text("Dragged-Wheel Trench")').click();
    await page.locator('#dlg button:has-text("Compare Mini-TES + APXS")').click();
    await page.locator('#dlg button.opt').nth(1).click();
    await expect(page.locator('#dlg')).toContainText(/INVESTIGATION COMPLETE/i);
    await page.locator('#dlg button:has-text("After-investigation transfer check")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();

    mon.assertClean('mars-spirit');
  });

  test('Mars 4/5 — Opportunity Rover completes Stage 2 photos, flexible IDD strategy switcher, MI 68 mm focus, Mössbauer, reload resume, PIA19113 & transfer check', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, 'Opportunity Rover');
    await inspectCurrentMachinePhotos(page, 'Opportunity');

    await page.locator('#dlg button:has-text("Stage 3")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();
    await expect(page.locator('#dlg')).toContainText(/SCHEMATIC TEACHING SIMULATION/i);
    await page.locator('#dlg button:has-text("Bright layered outcrop with small round bumps")').click();

    // Verify flexible IDD Turret Strategy Switcher is visible and allows switching to Mössbauer first or MI first
    await expect(page.locator('#dlg')).toContainText(/IDD Turret Strategy \(Flexible Order\)/i);
    await page.locator('#dlg button:has-text("3. Mössbauer")').click();
    await expect(page.locator('#dlg')).toContainText(/Place on a sphere/i);
    await page.locator('#dlg button:has-text("2. Microscopic Imager")').click();

    await page.locator('#dlg button:has-text("Open dust cover")').click();
    await page.locator('#oppD').fill('68');
    await page.locator('#oppD').dispatchEvent('input');
    await page.locator('#dlg button:has-text("Take MI image")').click();
    await page.locator('#dlg button:has-text("Continue: Mössbauer")').click();
    await page.locator('#dlg button:has-text("Place on a sphere")').click();
    await page.locator('#dlg button:has-text("Integrate 12 h")').click();
    await page.locator('#dlg button:has-text("Place on surrounding rock")').click();
    await page.locator('#dlg button:has-text("Integrate 12 h")').click();
    await page.locator('#dlg button:has-text("Continue: interpret the evidence")').click();

    // Reload mid-task before submitting interpretation -> verify Opportunity resumes at Phase 3 with PIA19113 visible!
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#dlg button:has-text("Opportunity Rover")').first().click();
    await page.locator('#dlg button:has-text("Stage 3")').click();
    await expect(page.locator('#dlg')).toContainText(/Primary NASA Evidence/i);
    await assertAllLoadedImages(page, 'Opportunity PIA19113 evidence');
    await page.screenshot({ path: path.join(SHOT_DIR, 'mars-opportunity-evidence.png') });

    // Select the 4 valid evidence checkboxes (0, 1, 2, 3) and Concretions explanation (2)
    const oppBoxes = page.locator('#dlg input[type="checkbox"]');
    await oppBoxes.nth(0).check();
    await oppBoxes.nth(1).check();
    await oppBoxes.nth(2).check();
    await oppBoxes.nth(3).check();
    await page.locator('#dlg input[type="radio"]').nth(2).check();
    await page.locator('#dlg button:has-text("Submit my interpretation")').click();
    await expect(page.locator('#dlg')).toContainText(/INVESTIGATION COMPLETE/i);
    await page.locator('#dlg button:has-text("After-investigation transfer check")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();

    mon.assertClean('mars-opportunity');
  });

  test('Mars 5/5 — InSight Lander completes Stage 2 photos, SEIS/WTS deployment, P/S wave arrival picks, liquid core inference, Archive, Report & 3D Inspector', async ({ page }) => {
    const mon = attachRuntimeMonitors(page);
    await mon.enableOfflineBlock();
    await bootMarsMission(page, 'InSight Lander');
    await inspectCurrentMachinePhotos(page, 'InSight');

    await page.locator('#dlg button:has-text("Stage 3")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();
    await expect(page.locator('#dlg')).toContainText(/SYNTHETIC TEACHING SIMULATION/i);
    await assertAllLoadedImages(page, 'InSight Stage 3 evidence');
    await page.locator('#dlg button:has-text("Place SEIS on Soil")').click();
    await page.locator('#dlg button:has-text("Wind & Thermal Shield")').click();
    await page.locator('#dlg input[type="range"]').nth(0).fill('22');
    await page.locator('#dlg input[type="range"]').nth(0).dispatchEvent('input');
    await page.locator('#dlg input[type="range"]').nth(1).fill('58');
    await page.locator('#dlg input[type="range"]').nth(1).dispatchEvent('input');
    await page.locator('#dlg button:has-text("Lock P–S Arrival Picks")').click();
    await page.locator('#dlg button.opt').nth(1).click();
    await expect(page.locator('#dlg')).toContainText(/INVESTIGATION COMPLETE/i);
    await page.locator('#dlg button:has-text("After-investigation transfer check")').click();
    await page.locator('#v4-assess-opts .opt').nth(1).click();
    await page.locator('#dlg button:has-text("Continue Mission")').click();

    // Verify Learning Report, NSSDCA Archive, Archive & Badges, 3D free explore & hardware inspector Esc/focus
    await page.locator('#v4-report-btn').click();
    await expect(page.locator('#dlg')).toContainText(/SUBMITTED FOR REFLECTION/i);
    await page.screenshot({ path: path.join(SHOT_DIR, 'mars-learning-report.png') });

    await page.locator('#v4-archive-btn').click();
    await expect(page.locator('#archive-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, 'mars-nssdca-archive.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('#archive-modal')).toBeHidden();

    await page.locator('#bb').click();
    await expect(page.locator('#bp')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#bp')).toBeHidden();

    // Free explore + 3D hardware inspector via key 'i'
    await page.locator('#ctl button:has-text("Choose mission")').click();
    await page.locator('#dlg button:has-text("Explore 3D Mars freely")').click();
    await expect(page.locator('#dlg')).toBeHidden();
    await page.keyboard.press('KeyI');
    await expect(page.locator('#insp')).toBeVisible();
    await page.locator('#insp .sl').first().click();
    await assertAllLoadedImages(page, 'Hardware Inspector');
    await page.screenshot({ path: path.join(SHOT_DIR, 'mars-3d-inspector.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('#insp')).toBeHidden();

    mon.assertClean('mars-insight-archive-inspector');
  });

  for (const vp of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    test(`Responsive layout, HUD non-overlap, font scaling & axe accessibility at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      const mon = attachRuntimeMonitors(page);
      await mon.enableOfflineBlock();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ['/index.html', '/mars.html?world=moon']) {
        await page.goto(route, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${route} horizontal overflow at ${vp.name}`).toBeLessThanOrEqual(2);
        const axe = await new AxeBuilder({ page }).analyze();
        const serious = axe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
        expect(serious, `${route} axe violations at ${vp.name}: ${JSON.stringify(serious.map((x) => x.id))}`).toEqual([]);
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/mars.html', { waitUntil: 'networkidle' });
      await expect(page.locator('#dlg')).toBeVisible();

      await page.locator('#dlg button:has-text("Explore 3D Mars freely")').click();

      const layout = await page.evaluate(() => {
        const ctl = document.getElementById('ctl').getBoundingClientRect();
        const hud = document.getElementById('hud').getBoundingClientRect();
        const overlapX = Math.min(ctl.right, hud.right) - Math.max(ctl.left, hud.left);
        const overlapY = Math.min(ctl.bottom, hud.bottom) - Math.max(ctl.top, hud.top);
        const firstBtn = document.querySelector('#ctl button').getBoundingClientRect();
        return {
          scrollOverflow: document.documentElement.scrollWidth - window.innerWidth,
          collides: overlapX > 2 && overlapY > 2,
          ctlBox: { left: Math.round(ctl.left), top: Math.round(ctl.top), right: Math.round(ctl.right), bottom: Math.round(ctl.bottom) },
          hudBox: { left: Math.round(hud.left), top: Math.round(hud.top), right: Math.round(hud.right), bottom: Math.round(hud.bottom) },
          btnHeight: Math.round(firstBtn.height),
          rmActive: document.body.classList.contains('rm')
        };
      });
      expect(layout.scrollOverflow, `mars.html horizontal overflow at ${vp.name}`).toBeLessThanOrEqual(2);
      expect(layout.collides, `#ctl and #hud overlapped at ${vp.name}: ctl=${JSON.stringify(layout.ctlBox)} hud=${JSON.stringify(layout.hudBox)}`).toBe(false);
      expect(layout.rmActive, 'reduced-motion class should be active').toBe(true);
      if (vp.width <= 768) {
        expect(layout.btnHeight, `touch button height at ${vp.name}`).toBeGreaterThanOrEqual(44);
      }

      const beforeFz = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
      await page.getByRole('button', { name: 'Larger text' }).click();
      const afterFz = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
      expect(afterFz).toBeGreaterThan(beforeFz);

      await page.locator('#ctl button:has-text("Choose mission")').click();
      const dlgRect = await page.locator('#dlg').boundingBox();
      expect(dlgRect.x).toBeGreaterThanOrEqual(0);
      expect(dlgRect.x + dlgRect.width).toBeLessThanOrEqual(vp.width + 2);
      expect(dlgRect.y + dlgRect.height).toBeLessThanOrEqual(vp.height + 2);

      if (vp.name === 'mobile') {
        await page.screenshot({ path: path.join(SHOT_DIR, 'mars-mobile-390x844.png') });
      } else if (vp.name === 'tablet') {
        await page.screenshot({ path: path.join(SHOT_DIR, 'mars-tablet-768x1024.png') });
      }

      const marsAxe = await new AxeBuilder({ page }).analyze();
      const marsSerious = marsAxe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(marsSerious, `mars.html axe violations at ${vp.name}: ${JSON.stringify(marsSerious.map((x) => x.id))}`).toEqual([]);

      mon.assertClean(`responsive-${vp.name}`);
    });
  }

  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    test(`Mars astronaut avatar, 3D TARS monolith, 2D TARS widget & movable radar are visible and interactive (${vp.name})`, async ({ page }) => {
      const mon = attachRuntimeMonitors(page);
      await mon.enableOfflineBlock();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/mars.html', { waitUntil: 'networkidle' });
      await expect(page.locator('#dlg')).toBeVisible();

      // Both 3D Astronaut (AS.g) and 3D TARS monolith (TS.g) are present and visible in the Three.js scene
      await expect.poll(() => page.evaluate(() => (
        AS.g.visible === true &&
        mr.children.includes(AS.g) &&
        TS.g.visible === true &&
        mr.children.includes(TS.g) &&
        TS.g.name === 'TARS'
      ))).toBe(true);

      // 2D TARS monolith widget rendered, in viewport, with accessible name and non-trivial size
      const tars = page.locator('#tars-monolith');
      await expect(tars).toBeVisible();
      const box = await tars.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(36);
      expect(box.height).toBeGreaterThanOrEqual(50);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
      expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
      await expect(tars).toHaveAttribute('aria-label', /TARS/);

      // TARS bubble opens on click and offers a hint button
      await tars.click({ force: true });
      await expect(page.locator('#tars-bubble')).not.toHaveClass(/minimized/);
      await expect(page.getByRole('button', { name: /Request Hint/ })).toBeVisible();

      // Leave picker to explore freely: both 3D Astronaut and 3D TARS stay visible
      await page.evaluate(() => exitSub());
      await expect.poll(() => page.evaluate(() => AS.g.visible && TS.g.visible)).toBe(true);

      if (vp.name === 'desktop') {
        // Test moving the Mars Radar around the screen and moving Astronaut + 3D TARS via Radar
        const beforeRadar = await page.locator('#mm-wrap').boundingBox();
        await page.evaluate(() => window.moveMarsRadar(42, 110));
        const movedRadar = await page.locator('#mm-wrap').boundingBox();
        expect(Math.round(movedRadar.x)).toBe(42);
        expect(Math.round(movedRadar.y)).toBe(110);
        expect(movedRadar.x).toBeGreaterThan(beforeRadar.x + 10);

        // Move Astronaut & 3D TARS to Opportunity Rover (index 3) via radar helper
        await page.evaluate(() => window.goToMachineFromRadar(3));
        const pos = await page.evaluate(() => ({
          ax: Math.round(pl.x),
          az: Math.round(pl.z),
          tx: Math.round(tarsPl.x),
          tz: Math.round(tarsPl.z)
        }));
        expect(pos.ax).not.toBe(-14);
        expect(Math.hypot(pos.tx - pos.ax, pos.tz - pos.az)).toBeLessThan(6);

        await page.evaluate(() => window.resetMarsRadarPosition());
      } else {
        // On mobile, the radar starts minimized so it doesn't cover the 3D scene
        await expect.poll(() => page.evaluate(() => document.getElementById('mm-wrap').className)).toContain('minimized');
        const mm = await page.locator('#mm-wrap').boundingBox();
        expect(mm.height).toBeLessThan(200);
      }

      await page.screenshot({ path: path.join(SHOT_DIR, `mars-astronaut-tars-${vp.name}.png`) });
      mon.assertClean(`astronaut-tars-${vp.name}`);
    });
  }
});
