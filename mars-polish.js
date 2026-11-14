/* Integration of the existing Mars game with the chapter release. */
(() => {
  'use strict';
  const SOJ_STATE_KEY = 'btsm.soj.state.v2';
  const SOJ_REPORT_KEY = 'btsm.soj.report';
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const targets = { bill: { name: 'Teaching rock A', x: 5, y: 1, si: 58, fe: 8 }, yogi: { name: 'Teaching rock B', x: 5, y: 4, si: 46, fe: 14 } };
  const blocked = new Set(['2,1', '2,2', '2,3', '3,3']);
  const OBS_OPTIONS = [
    'Inspected exit ramps: front obstructed, rear ramp clear',
    'Navigated around marked hazard boulders without collisions',
    'Positioned rear APXS against rock (0 cm contact gap)',
    'Compared teaching oxide values against soil without overclaiming life'
  ];

  function freshSoj() {
    return { stage: 0, x: 0, y: 0, path: [], facing: 'E', target: null, contact: false, gap: 5, obsTags: [0, 1, 2, 3], feedback: '', report: {} };
  }

  function sanitizeSoj(raw) {
    const base = freshSoj();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
    if (Number.isInteger(raw.stage) && raw.stage >= 0 && raw.stage <= 4) base.stage = raw.stage;
    const x = Number.isInteger(raw.x) && raw.x >= 0 && raw.x <= 5 ? raw.x : 0;
    const y = Number.isInteger(raw.y) && raw.y >= 0 && raw.y <= 4 ? raw.y : 0;
    if (!blocked.has(x + ',' + y)) { base.x = x; base.y = y; }
    if (Array.isArray(raw.path)) {
      base.path = raw.path.filter(pt => Array.isArray(pt) && pt.length === 2 && Number.isInteger(pt[0]) && Number.isInteger(pt[1]) && pt[0] >= 0 && pt[0] <= 5 && pt[1] >= 0 && pt[1] <= 4 && !blocked.has(pt[0] + ',' + pt[1])).slice(0, 40);
    }
    if (raw.target === 'bill' || raw.target === 'yogi') base.target = raw.target;
    if (['N', 'S', 'E', 'W'].includes(raw.facing)) base.facing = raw.facing;
    if (Number.isInteger(raw.gap) && raw.gap >= 0 && raw.gap <= 5) base.gap = raw.gap;
    if (Array.isArray(raw.obsTags)) base.obsTags = raw.obsTags.filter(i => Number.isInteger(i) && i >= 0 && i < OBS_OPTIONS.length);
    if (typeof raw.feedback === 'string') base.feedback = raw.feedback.slice(0, 300);
    if (raw.report && typeof raw.report === 'object') {
      ['claim', 'evidence', 'uncertainty'].forEach(k => {
        if (typeof raw.report[k] === 'string') base.report[k] = raw.report[k].slice(0, 1500);
      });
    }
    return base;
  }

  function loadSoj() {
    try {
      const raw = JSON.parse(localStorage.getItem(SOJ_STATE_KEY) || 'null');
      return sanitizeSoj(raw);
    } catch {
      return freshSoj();
    }
  }

  let soj = loadSoj();

  function saveSoj() {
    try {
      localStorage.setItem(SOJ_STATE_KEY, JSON.stringify({ v: 2, ...soj }));
    } catch {}
  }

  const hasRock = () => soj.target && soj.x === targets[soj.target].x && soj.y === targets[soj.target].y;

  function cleanWords(text) {
    return (String(text || '').toLowerCase().match(/[a-z]{2,}/g) || []);
  }

  function validateSojReport(fieldsObj, obsCount) {
    for (const [k, label] of [['claim', 'Claim'], ['evidence', 'Evidence'], ['uncertainty', 'Uncertainty']]) {
      const val = String(fieldsObj[k] || '').trim();
      if (val.length < 15) return `${label} needs at least one clear explanatory sentence (minimum 15 characters).`;
      if (/(.)\1{4,}/i.test(val)) return `${label} repeats the same character; please explain in plain words.`;
      const words = cleanWords(val);
      if (words.length < 3 || new Set(words).size < 3) return `${label} needs at least 3 distinct words explaining your reasoning.`;
    }
    const text = `${fieldsObj.claim} ${fieldsObj.evidence}`.toLowerCase();
    for (const bad of ['proves living microbes', 'living cells inside', 'ocean beneath ares', 'all mars rocks have the same origin']) {
      if (text.includes(bad)) return `Check your claim against the evidence: APXS elemental values cannot support "${bad}".`;
    }
    if (obsCount === 0) return 'Select at least one observed finding above to link your conclusion to evidence.';
    return '';
  }

  function sojRubric(rep) {
    const scoreOne = (s, kw) => {
      const w = new Set(cleanWords(s)).size;
      if (w >= 7 && kw.test(s || '')) return 2;
      return w >= 3 ? 1 : 0;
    };
    const c = scoreOne(rep.claim, /differ|rock|soil|sio|composition|apxs|evidence/i);
    const e = scoreOne(rep.evidence, /\d|sio|feo|44|58|46|18|14|gap|ramp|sample/i);
    const u = scoreOne(rep.uncertainty, /uncertain|limit|invent|dust|origin|more|assume|cannot|simplif|only/i);
    return { c, e, u, total: c + e + u };
  }

  let soj3DGroup = null;
  let sojSplitView = false;

  window.toggleSojSplitView = () => {
    sojSplitView = !sojSplitView;
    const dlg = document.getElementById('dlg');
    if (dlg) {
      if (sojSplitView && window.innerWidth > 760) {
        dlg.style.width = 'min(490px, 50vw)';
        dlg.style.left = 'auto';
        dlg.style.right = '14px';
        dlg.style.transform = 'none';
      } else {
        dlg.style.width = '';
        dlg.style.left = '';
        dlg.style.right = '';
        dlg.style.transform = '';
      }
    }
    if (typeof renderTaskUI === 'function') renderTaskUI();
  };

  function ensureSoj3DProps() {
    if (typeof THREE === 'undefined' || typeof window.mr === 'undefined' || typeof MC === 'undefined') return;
    const sojM = MC.find(m => m.n === 'Sojourner');
    if (!sojM) return;
    if (!soj3DGroup) {
      soj3DGroup = new THREE.Group();
      soj3DGroup.name = 'SojournerRockYard3D';
      const gy = typeof H === 'function' ? H(sojM.x, sojM.z) : 0;
      // Rear deployment ramp at grid (0,0)
      const rampx = sojM.x + (0 - 1.5) * 0.9;
      const rampz = sojM.z + (0 - 2.0) * 0.9;
      const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.06, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 })
      );
      ramp.position.set(rampx, (typeof H === 'function' ? H(rampx, rampz) : gy) + 0.03, rampz);
      soj3DGroup.add(ramp);

      // Hazard boulders matching blocked set
      blocked.forEach(coord => {
        const [bx, by] = coord.split(',').map(Number);
        const wx = sojM.x + (bx - 1.5) * 0.9;
        const wz = sojM.z + (by - 2.0) * 0.9;
        const wy = typeof H === 'function' ? H(wx, wz) : gy;
        const bMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.28, 1),
          new THREE.MeshStandardMaterial({ color: 0x6f3e34, roughness: 0.9 })
        );
        bMesh.position.set(wx, wy + 0.18, wz);
        soj3DGroup.add(bMesh);
      });

      // Target rocks A (bill) and B (yogi)
      soj3DGroup.userData.targets = {};
      Object.entries(targets).forEach(([id, t]) => {
        const wx = sojM.x + (t.x - 1.5) * 0.9;
        const wz = sojM.z + (t.y - 2.0) * 0.9;
        const wy = typeof H === 'function' ? H(wx, wz) : gy;
        const rGroup = new THREE.Group();
        rGroup.position.set(wx, wy, wz);
        const rockMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(id === 'yogi' ? 0.42 : 0.34, 1),
          new THREE.MeshStandardMaterial({ color: id === 'yogi' ? 0x8b5c48 : 0x7a6558, roughness: 0.82 })
        );
        rockMesh.position.y = 0.24;
        rGroup.add(rockMesh);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.45, 0.55, 24),
          new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.04;
        rGroup.add(ring);
        soj3DGroup.userData.targets[id] = { group: rGroup, ring };
        soj3DGroup.add(rGroup);
      });
      window.mr.add(soj3DGroup);
    }
    if (soj3DGroup && soj3DGroup.userData && soj3DGroup.userData.targets) {
      Object.entries(soj3DGroup.userData.targets).forEach(([id, obj]) => {
        if (obj.ring && obj.ring.material) {
          obj.ring.material.color.setHex(soj.target === id ? 0x4cd98a : 0xffd166);
        }
      });
    }
  }

  function syncSoj3D(dx = 0, dy = 0) {
    if (typeof curM === 'undefined' || !curM || curM.n !== 'Sojourner' || !curM.g) return;
    ensureSoj3DProps();
    curM.sojDriven = true;
    const ox = curM.x + (soj.x - 1.5) * 0.9;
    const oz = curM.z + (soj.y - 2.0) * 0.9;
    const y = typeof H === 'function' ? H(ox, oz) : curM.g.position.y;
    curM.g.position.set(ox, y, oz);
    if (soj.stage >= 2) {
      // Turn 180 degrees so rear APXS sensor head faces the target rock (+X)
      curM.g.rotation.y = -Math.PI / 2;
      const arm = curM.g.userData && curM.g.userData.parts && curM.g.userData.parts.roboticArm;
      if (arm) {
        arm.position.z = -0.35 - (5 - (soj.gap ?? 5)) * 0.025;
      }
    } else if (dx || dy) {
      curM.g.rotation.y = Math.atan2(dx, dy);
    }
    if (typeof highlight3DPart === 'function') {
      highlight3DPart(curM, soj.stage >= 2 ? 'roboticArm' : 'wheels');
    }
  }

  window.sojUpdateDraft = (field, val) => {
    soj.report[field] = String(val || '').slice(0, 1500);
    saveSoj();
  };

  window.sojToggleObs = (idx, checked) => {
    const set = new Set(soj.obsTags || []);
    if (checked) set.add(idx); else set.delete(idx);
    soj.obsTags = [...set];
    saveSoj();
  };

  window.sojReset = (confirmReset = true) => {
    if (confirmReset && typeof window.interactionState !== 'undefined') {
      delete window.interactionState.completedTasks['Sojourner'];
      if (typeof taskState !== 'undefined') taskState.done = false;
    }
    soj = freshSoj();
    saveSoj();
    try { localStorage.removeItem(SOJ_REPORT_KEY); } catch {}
    if (typeof curM !== 'undefined' && curM && curM.n === 'Sojourner' && curM.g) {
      const gy = typeof H === 'function' ? H(curM.x, curM.z) : curM.g.position.y;
      curM.g.position.set(curM.x, gy, curM.z);
    }
    if (typeof renderTaskUI === 'function') renderTaskUI();
  };

  window.sojMissionAction = (action, value) => {
    if (action === 'ramp' && soj.stage === 0) {
      if (value !== 'rear') {
        soj.feedback = 'The front route is obstructed in this reconstruction. Inspect both ramps; use the clear rear ramp.';
      } else {
        soj.stage = 1;
        soj.feedback = 'Deployed from the rear ramp. Choose a rock, then drive around the marked boulders.';
        syncSoj3D(1, 0);
      }
    }
    if (action === 'target' && soj.stage === 1) {
      soj.target = value;
      syncSoj3D(0, 0);
      soj.feedback = `Target selected (${targets[value]?.name || value}). Inspect clear grid squares and steer around × hazards.`;
    }
    if (action === 'move' && soj.stage === 1) {
      if (!soj.target) {
        soj.feedback = 'Select a scientific target before driving.';
      } else {
        const [dx, dy] = value.split(',').map(Number);
        const x = soj.x + dx;
        const y = soj.y + dy;
        soj.facing = dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N';
        if (x < 0 || x > 5 || y < 0 || y > 4 || blocked.has(x + ',' + y)) {
          soj.feedback = 'Route blocked by boundary or hazard boulder. No movement made; choose a clear neighboring square.';
        } else {
          soj.x = x;
          soj.y = y;
          soj.path.push([x, y]);
          syncSoj3D(dx, dy);
          soj.feedback = hasRock()
            ? 'Arrived at the selected rock. Turn the rear APXS toward the rock to begin positioning.'
            : `Moved ${soj.facing === 'E' ? 'East' : soj.facing === 'W' ? 'West' : soj.facing === 'S' ? 'South' : 'North'} to Col ${x + 1}, Row ${y + 1}. 3D rover synchronized.`;
        }
      }
    }
    if (action === 'align' && soj.stage === 1) {
      if (!hasRock()) {
        soj.feedback = 'Reach the selected rock first.';
      } else {
        soj.stage = 2;
        syncSoj3D(0, 0);
        if (typeof highlight3DPart === 'function' && typeof curM !== 'undefined') highlight3DPart(curM, 'roboticArm');
        soj.feedback = 'Rear APXS faces the rock. Close the contact gap to 0 cm before collecting a measurement.';
      }
    }
    if (action === 'gap' && soj.stage === 2) {
      soj.gap = Number(value);
      syncSoj3D(0, 0);
      soj.feedback = `Contact gap set to ${soj.gap} cm (simplified positioning control).`;
    }
    if (action === 'measure' && soj.stage === 2) {
      if (soj.gap > 0) {
        soj.feedback = 'The sensor must be against the rock in this simplified model. Close the gap to 0 cm first.';
      } else {
        soj.stage = 3;
        soj.feedback = 'Measurement acquired. Values below are invented educational oxide abundances, not NASA telemetry.';
      }
    }
    if (action === 'interpret' && soj.stage === 3) {
      if (value !== 1) {
        soj.feedback = 'APXS measures elemental chemistry. Chemistry alone cannot identify living cells or uniquely prove one origin for every rock.';
      } else {
        soj.stage = 4;
        soj.feedback = 'Supported: the sample differs from the teaching soil. Link your claim, evidence, and uncertainty below.';
      }
    }
    if (action === 'finish' && soj.stage === 4) {
      const fields = ['claim', 'evidence', 'uncertainty'];
      const draft = {};
      fields.forEach(k => { draft[k] = document.getElementById('soj-' + k)?.value.trim() || ''; });
      const obsBoxes = [...document.querySelectorAll('[data-soj-obs]')];
      const hasCheckProps = obsBoxes.length > 0 && 'checked' in obsBoxes[0];
      const pickedCount = hasCheckProps ? obsBoxes.filter(b => b.checked).length : (soj.obsTags?.length || 1);
      const err = validateSojReport(draft, pickedCount);
      if (err) {
        soj.feedback = err;
        saveSoj();
        document.getElementById('soj-feedback').textContent = err;
        return;
      }
      soj.report = draft;
      const rub = sojRubric(draft);
      try {
        localStorage.setItem(SOJ_REPORT_KEY, JSON.stringify({
          ...soj.report,
          target: soj.target,
          path: soj.path,
          obs: hasCheckProps ? obsBoxes.filter((b, i) => b.checked).map((_, i) => OBS_OPTIONS[i]) : [OBS_OPTIONS[0]],
          rubric: rub,
          submittedForReflection: true
        }));
      } catch {}
      saveSoj();
      completeCollaborativeTask('Completed deployment, obstacle avoidance, rear APXS positioning, and interpretation of a labelled teaching dataset. Your claim, evidence, and uncertainty are saved on this device.');
      saveState();
      return;
    }
    saveSoj();
    renderTaskUI();
  };

  function routeMap() {
    const facingGlyph = { N: '▲', S: '▼', E: '▶', W: '◀' }[soj.facing] || '▶';
    return `<svg viewBox="0 0 380 264" role="img" aria-label="2D planning map: rover at column ${soj.x + 1}, row ${soj.y + 1} facing ${soj.facing}; hazards at column 3 rows 2 to 4 and column 4 row 4; Targets at column 6 rows 2 and 5." style="width:100%;max-width:480px;background:#181a20;border-radius:8px;border:1px solid #3c4858">
      ${[1, 2, 3, 4, 5, 6].map((c, idx) => `<text x="${idx * 60 + 34}" y="14" fill="#9fb4c9" font-size="10" text-anchor="middle">C${c}</text>`).join('')}
      ${[1, 2, 3, 4, 5].map((r, idx) => `<text x="9" y="${idx * 48 + 46}" fill="#9fb4c9" font-size="10">R${r}</text>`).join('')}
      ${Array.from({ length: 30 }, (_, i) => {
        const x = i % 6, y = Math.floor(i / 6), hazard = blocked.has(x + ',' + y);
        return `<rect x="${x * 60 + 20}" y="${y * 48 + 20}" width="54" height="42" rx="5" fill="${hazard ? '#6f3e34' : '#2a333b'}" stroke="${hazard ? '#ff8b73' : '#586776'}"/><title>Column ${x + 1}, Row ${y + 1}: ${hazard ? 'Boulder hazard (blocked)' : 'Clear regolith'}</title>${hazard ? `<text x="${x * 60 + 47}" y="${y * 48 + 46}" fill="#ffd2c8" font-size="18" text-anchor="middle">×</text>` : ''}`;
      }).join('')}
      <text x="47" y="34" fill="#a9f1da" font-size="9" text-anchor="middle" font-weight="bold">RAMP</text>
      ${Object.entries(targets).map(([id, t]) => `<circle cx="${t.x * 60 + 47}" cy="${t.y * 48 + 41}" r="16" fill="${id === soj.target ? '#ffd166' : '#7d8288'}" stroke="#fff" stroke-width="${id === soj.target ? 2 : 0.8}"/><text x="${t.x * 60 + 47}" y="${t.y * 48 + 45}" fill="#111" font-weight="bold" text-anchor="middle">${id === 'bill' ? 'A' : 'B'}</text>`).join('')}
      <polyline points="${[[0, 0], ...soj.path].map(([x, y]) => `${x * 60 + 47},${y * 48 + 41}`).join(' ')}" fill="none" stroke="#a9f1da" stroke-width="3"/>
      <rect x="${soj.x * 60 + 35}" y="${soj.y * 48 + 29}" width="24" height="24" rx="5" fill="#4cd98a" stroke="#081410" stroke-width="1.5"/>
      <text x="${soj.x * 60 + 47}" y="${soj.y * 48 + 45}" fill="#081410" font-size="13" font-weight="bold" text-anchor="middle">${facingGlyph}</text>
    </svg>`;
  }

  function apxsDiagram(gap) {
    const rockX = 195;
    const apxsX = rockX - 18 - gap * 10;
    return `<svg viewBox="0 0 280 96" role="img" aria-label="Rear APXS positioning diagram: ${gap} cm gap between sensor head and rock face" style="width:100%;max-width:340px;background:#101722;border:1px solid #35475e;border-radius:6px;margin:6px 0">
      <rect x="20" y="32" width="${apxsX - 20}" height="32" rx="4" fill="#3a4c62"/><text x="30" y="52" fill="#e6edf5" font-size="10">SOJOURNER REAR</text>
      <rect x="${apxsX}" y="38" width="18" height="20" rx="2" fill="#66ccff"/>
      <path d="M${rockX} 18 L255 18 L262 80 L${rockX - 4} 80 Z" fill="#8b5c48"/>
      <text x="208" y="52" fill="#fff" font-size="10">ROCK</text>
      <text x="12" y="88" fill="#a9f1da" font-size="10">${gap === 0 ? '✔ APXS sensor ring touching rock face (0 cm)' : `Air gap: ${gap} cm — move to 0 cm for alpha/X-ray contact`}</text>
    </svg>`;
  }

  function sojBody() {
    ensureSoj3DProps();
    const t = targets[soj.target] || targets.bill;
    const sojWorldX = typeof curM !== 'undefined' && curM ? (curM.x + (soj.x - 1.5) * 0.9).toFixed(1) : '0.0';
    const sojWorldZ = typeof curM !== 'undefined' && curM ? (curM.z + (soj.y - 2.0) * 0.9).toFixed(1) : '0.0';
    const live3DBar = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 8px;padding:6px 10px;border-radius:6px;background:rgba(76,217,138,.09);border:1px solid rgba(76,217,138,.32);font-size:11.5px;color:#d6f5e3">
      <span>🛰️ <b>3D Rover Linked:</b> Grid (C${soj.x + 1}, R${soj.y + 1}) → 3D Mars (${sojWorldX}m, ${sojWorldZ}m) · Heading ${soj.facing}</span>
      <button type="button" style="padding:2px 8px;font-size:11px" onclick="toggleSojSplitView()">${sojSplitView ? '🗖 Center Panel' : '👁️ Split 3D Rover View'}</button>
    </div>`;
    const synthBadge = `<div style="margin:4px 0 6px;padding:6px 10px;border-radius:6px;background:rgba(255,209,102,.12);border:1px solid rgba(255,209,102,.4);font-size:11.5px;color:#ffd166"><b>🧪 SYNTHETIC TEACHING DATA — NOT RAW NASA TELEMETRY:</b> The 6×5 boulder grid, 0–5 cm APXS gap slider, and oxide percentages below are simplified teaching models paired with real Mars Pathfinder imagery.</div>`;
    const glossaryBar = `<div style="margin:4px 0 8px;padding:6px 10px;border-radius:6px;background:rgba(102,204,255,.08);border:1px solid rgba(102,204,255,.28);font-size:11.5px;color:#cfe6ff"><b>📖 Quick Science Terms (Ages 10–16):</b> <b>APXS</b> = Alpha Proton X-Ray Spectrometer (rear sensor that reads chemical elements in rocks) · <b>Oxide (SiO₂ / FeO)</b> = how geologists report silicon and iron amounts · <b>Regolith</b> = loose Martian soil and dust.</div>`;
    let b = '';
    if (soj.stage === 0) {
      b = '<p>Mars Pathfinder’s lander has two ramp exit directions. In this teaching reconstruction, rocks block the front ramp while the rear ramp is clear. Which should Sojourner use?</p><div class="bar"><button onclick="sojMissionAction(\'ramp\',\'front\')">Inspect / try front ramp</button> <button onclick="sojMissionAction(\'ramp\',\'rear\')">Deploy down clear rear ramp</button></div>';
    }
    if (soj.stage === 1) {
      const dist = soj.target ? Math.abs(targets[soj.target].x - soj.x) + Math.abs(targets[soj.target].y - soj.y) : '—';
      b = `<p>Select a teaching target, then drive around <b>× hazards</b>. Moving updates both this 2D grid map and the 3D Sojourner rover + 3D rock yard in the Mars scene. <small>(2D planning reconstruction — not historical Pathfinder coordinates.)</small></p>
        <div class="bar" style="justify-content:flex-start"><button class="${soj.target === 'bill' ? 'g' : ''}" onclick="sojMissionAction('target','bill')">Investigate Teaching rock A</button> <button class="${soj.target === 'yogi' ? 'g' : ''}" onclick="sojMissionAction('target','yogi')">Investigate Teaching rock B</button></div>
        ${routeMap()}
        <p style="margin:4px 0;font-size:12px;color:#cbd6e5">Position: Col ${soj.x + 1}, Row ${soj.y + 1} · Heading: ${soj.facing} · Steps logged: ${soj.path.length} · Manhattan distance to target: ${dist}</p>
        <div class="bar" style="justify-content:flex-start"><button aria-label="Drive north" onclick="sojMissionAction('move','0,-1')">↑ North</button><button aria-label="Drive west" onclick="sojMissionAction('move','-1,0')">← West</button><button aria-label="Drive east" onclick="sojMissionAction('move','1,0')">East →</button><button aria-label="Drive south" onclick="sojMissionAction('move','0,1')">↓ South</button></div>
        <button ${hasRock() ? '' : 'disabled'} onclick="sojMissionAction('align')">Turn rear APXS toward rock →</button>`;
    }
    if (soj.stage === 2) {
      b = `<p>Sojourner’s APXS sits at the <b>rear</b> beside the color camera. Alpha particles and low-energy X-rays drop sharply across air or dust gaps.</p>
        ${apxsDiagram(soj.gap)}
        <label for="soj-gap">APXS contact gap: <b>${soj.gap} cm</b></label>
        <input id="soj-gap" aria-label="APXS contact gap in centimeters" type="range" min="0" max="5" step="1" value="${soj.gap}" oninput="sojMissionAction('gap',this.value)" onchange="sojMissionAction('gap',this.value)" style="width:100%">
        <button onclick="sojMissionAction('measure')">Collect APXS measurement</button>
        <p><small>What this simplifies: real APXS integrated overnight (~10 hours) and probed a micrometer surface skin affected by dust coatings.</small></p>`;
    }
    if (soj.stage === 3) {
      b = `<p><b>Educational dataset — invented, not NASA measurements.</b> Oxide equivalents below compare Teaching Rock ${soj.target === 'yogi' ? 'B' : 'A'} with reference soil. APXS identifies chemical elements; geological origin requires context beyond chemistry alone.</p>
        <table class="nssdca-table"><thead><tr><th>Sample (Teaching)</th><th>SiO₂ equivalent</th><th>FeO equivalent</th></tr></thead><tbody><tr><td>${t.name}</td><td>${t.si}%</td><td>${t.fe}%</td></tr><tr><td>Teaching soil</td><td>44%</td><td>18%</td></tr></tbody></table>
        <button class="opt" onclick="sojMissionAction('interpret',0)">These numbers prove living microbes.</button>
        <button class="opt" onclick="sojMissionAction('interpret',1)">This rock differs from the soil; its origin needs more evidence.</button>
        <button class="opt" onclick="sojMissionAction('interpret',2)">One measurement proves all Mars rocks have the same origin.</button>`;
    }
    if (soj.stage === 4) {
      b = `<p>Target investigated: <b>${t.name}</b> (teaching SiO₂ ${t.si}%, FeO ${t.fe}% vs teaching soil 44% SiO₂, 18% FeO). Select observed findings, write your report, and save for reflection.</p>
        <div class="fb"><b>Link your findings (check observed items):</b><br>
        ${OBS_OPTIONS.map((txt, idx) => `<label style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;font-size:12.5px"><input type="checkbox" data-soj-obs="${idx}" ${(soj.obsTags || []).includes(idx) ? 'checked' : ''} onchange="sojToggleObs(${idx},this.checked)"><span>${safe(txt)}</span></label>`).join('')}</div>
        <div style="margin:6px 0;padding:8px 10px;border-radius:8px;background:rgba(76,217,138,.08);border:1px solid rgba(76,217,138,.28);font-size:12px;color:#d6f5e3">
          <b>✅ Self-Check Explanation Checklist (Before You Submit):</b>
          <ul style="margin:4px 0 0 18px;padding:0">
            <li><b>Claim:</b> State clearly that ${t.name} has a different chemical composition from the Martian soil.</li>
            <li><b>Evidence:</b> Cite the 0 cm APXS contact gap and compare the teaching numbers (${t.si}% SiO₂, ${t.fe}% FeO vs 44% SiO₂, 18% FeO).</li>
            <li><b>Uncertainty:</b> Explain that surface dust coatings or invented teaching values limit what one reading can prove (and cannot prove life).</li>
          </ul>
        </div>
        <details style="margin:6px 0"><summary style="cursor:pointer;color:#a9f1da">Inspect strong example report</summary><p style="font-size:12px;color:#cbd6e5"><b>Claim:</b> The tested teaching rock differs chemically from the surrounding soil, though origin needs additional context.<br><b>Evidence:</b> After closing APXS gap to 0 cm, teaching SiO₂ (${t.si}%) and FeO (${t.fe}%) differed from teaching soil (44% SiO₂, 18% FeO).<br><b>Uncertainty:</b> Values are invented for learning, and APXS surface readings can reflect dust coatings without proving rock formation history.</p></details>
        ${['claim', 'evidence', 'uncertainty'].map(k => `<label for="soj-${k}">${k[0].toUpperCase() + k.slice(1)}</label><textarea id="soj-${k}" maxlength="1500" oninput="sojUpdateDraft('${k}',this.value)" style="width:100%;min-height:70px;background:#111c29;color:white;padding:10px;border:1px solid #35475e;border-radius:6px">${safe(soj.report[k] || '')}</textarea>`).join('')}
        <button onclick="sojMissionAction('finish')">Submit for reflection & save report</button>`;
    }
    const resumeBanner = soj.stage > 0 && soj.stage <= 4
      ? `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:#a9f1da"><span>Progress auto-saved on this device</span><button type="button" style="padding:3px 10px;font-size:12px" onclick="sojReset(false)">Restart Sojourner</button></div>`
      : '';
    return `<div class="sim-box"><div class="sim-hdr"><span>SOJOURNER · ${['1 Deploy', '2 Navigate', '3 Position APXS', '4 Interpret', '5 Report'][soj.stage]}</span><span>Step ${soj.stage + 1}/5</span></div><progress max="5" value="${soj.stage}" aria-label="Sojourner investigation progress" style="width:100%"></progress>${synthBadge}${glossaryBar}${live3DBar}${resumeBanner}${b}<p id="soj-feedback" role="status" aria-live="polite">${safe(soj.feedback)}</p><small>What this simplifies: route grid, gaps, and chemistry tables are educational reconstructions · ${sourceLink('https://nssdc.gsfc.nasa.gov/planetary/mesur.html', 'NSSDCA mission context')} · ${sourceLink('https://science.nasa.gov/resource/sojourners-apxs-wedge/', 'NASA rear APXS image')}</small></div>`;
  }

  const sourceLink = (url, label) => `<a href="${url}" target="_blank" rel="noopener" style="color:#a9f1da">${label} ↗</a>`;

  window.missionPicker = () => {
    if (typeof MC === 'undefined') return;
    endPres();
    T = Math.max(T, 30);
    const sk = document.getElementById('skip');
    if (sk) sk.style.display = 'none';
    S.mode = 'talk';
    ov('');
    const doneCount = Object.keys(interactionState.completedTasks).length;
    dl(`<div class="top"><span>MARS · CHOOSE YOUR INVESTIGATION</span><span>${doneCount} / 5 COMPLETED</span></div>
      <p style="margin:6px 0 10px">Inspect hardware in 3D, run an instrument reconstruction, distinguish observations from interpretations, and record uncertainties. Landing sites are combined here into one offline archive terrain.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">${MC.map((m, i) => {
        const done = !!interactionState.completedTasks[m.n];
        const tag = i === 0 ? 'Start here · deploy, route & APXS' : i === 3 ? 'Flagship · NASA photo + water mystery' : m.interaction.task.title;
        return `<button onclick="visitMission(${i})" style="padding:14px;text-align:left;${i === 0 && !done ? 'border-color:#4cd98a;' : ''}"><b>${m.n}</b><br><small style="color:#cbd6e5">${safe(tag)}</small><br><small style="color:${done ? '#4cd98a' : '#ffd166'}">${done ? '✓ Investigation complete (review)' : 'Begin / Continue →'}</small></button>`;
      }).join('')}</div>
      <div class="bar"><button type="button" onclick="exitSub()">Explore 3D Mars freely ▸</button><span><a href="moon.html#archive" style="color:#a9f1da">Search NSSDCA archive</a> · <a href="index.html" style="color:#a9f1da">Change world</a></span></div>`);
  };

  window.visitMission = i => {
    const m = MC[i];
    if (!m) return;
    endPres();
    T = Math.max(T, 30);
    const sk = document.getElementById('skip');
    if (sk) sk.style.display = 'none';
    S.mode = 'talk';
    ov('');
    pl.x = m.x - 1.8;
    pl.z = m.z + 1.6;
    if (typeof window.tarsPl !== 'undefined') {
      window.tarsPl.x = m.x + 1.8;
      window.tarsPl.z = m.z + 1.6;
    }
    if (typeof window.AS !== 'undefined' && window.AS.g) {
      window.AS.g.visible = true;
      window.AS.g.position.set(pl.x, typeof H === 'function' ? H(pl.x, pl.z) : 0, pl.z);
    }
    if (typeof window.TS !== 'undefined' && window.TS.g && typeof window.tarsPl !== 'undefined') {
      window.TS.g.visible = true;
      window.TS.g.position.set(window.tarsPl.x, typeof H === 'function' ? H(window.tarsPl.x, window.tarsPl.z) : 0, window.tarsPl.z);
    }
    curM = m;
    if (m.n === 'Sojourner') syncSoj3D(0, 0);
    openMachineHub(m);
  };

  function install() {
    if (typeof MC === 'undefined' || typeof renderTaskUI !== 'function') { showFailure(); return; }
    const previous = window.renderTaskUI;
    window.renderTaskUI = () => {
      if (!curM) return previous();
      if (taskState.done) {
        const hasPost = !!(window.playerProfile?.postQuiz?.[curM.n]);
        let sojSavedHtml = '';
        if (curM.n === 'Sojourner') {
          let rep = null;
          try { rep = JSON.parse(localStorage.getItem(SOJ_REPORT_KEY) || 'null'); } catch {}
          if (rep && rep.claim) {
            const rub = rep.rubric || sojRubric(rep);
            sojSavedHtml = `<div class="fig"><b>Saved Reflection Report (Sojourner):</b><br><b>Claim:</b> ${safe(rep.claim)}<br><b>Evidence:</b> ${safe(rep.evidence)}<br><b>Uncertainty:</b> ${safe(rep.uncertainty)}<br><small>Self-check rubric depth: Claim ${rub.c}/2 · Evidence ${rub.e}/2 · Uncertainty ${rub.u}/2 · Submitted for reflection (saved locally)</small></div>`;
          }
        }
        const replayFn = curM.n === 'Sojourner' ? 'sojReset(true)' : `window.v4RestartTask('${curM.n}')`;
        dl(`<div class="top"><span>${safe(curM.n)} · INVESTIGATION COMPLETE</span><span style="color:#4cd98a">SUBMITTED FOR REFLECTION</span></div>
          <div class="fb">${safe(taskState.summary || interactionState.completedTasks[curM.n] || 'Completed')}</div>
          ${sojSavedHtml}
          <p><small>What this simplifies: instrument actions and synthetic tables illustrate scientific reasoning and are not live NASA telemetry.</small></p>
          <div class="bar">
            ${!hasPost ? `<button onclick="openAssessmentModal('${safe(curM.n)}','post',()=>openStageDiscovery())" style="background:#4cd98a;color:#111;font-weight:bold">After-investigation transfer check ▸</button>` : `<button onclick="openStageDiscovery()">Examine scientific discovery →</button>`}
            ${!hasPost ? `<button onclick="openStageDiscovery()">Discovery Card</button>` : ''}
            <button onclick="${replayFn}">Replay investigation</button>
            <button onclick="missionPicker()">Choose another mission</button>
          </div>`);
        return;
      }
      if (curM.n === 'Sojourner') {
        dl(`<div class="top">SOJOURNER · FIRST TRACKS, FIRST QUESTIONS</div>${stageBarHTML(curM, 'task')}${sojBody()}<div class="bar"><button onclick="openMachineHub(curM)">← Mission hub</button><span></span></div>`);
        return;
      }
      previous();
      const label = document.createElement('p');
      label.className = 'fb';
      label.textContent = 'Educational reconstruction: instrument controls and synthetic graphs are simplified models, not original flight telemetry. Read the linked NASA sources to separate observation from interpretation.';
      document.getElementById('dlg').appendChild(label);
    };

    const complete = window.completeCollaborativeTask;
    window.completeCollaborativeTask = summary => {
      complete(summary);
      saveState();
    };

    // Prevent camera lenses and entire wheel groups spinning continuously on Sojourner.
    const animate = window.animateMachineParts;
    window.animateMachineParts = (m, dt, dist) => {
      animate(m, dt, dist);
      if (m.n === 'Sojourner') {
        const p = m.g.userData.parts;
        if (p.camera) p.camera.rotation.set(0, 0, 0);
        if (p.wheels) p.wheels.children.forEach(w => { w.rotation.x = 0; });
        if (p.roboticArm) p.roboticArm.rotation.set(0, 0, 0);
      }
    };

    document.getElementById('profile-modal')?.style.setProperty('display', 'none');
    document.getElementById('tars-bubble')?.classList.add('minimized');

    const hint = window.tarsGiveHint;
    window.tarsGiveHint = () => {
      if (curM?.n === 'Sojourner') window.tarsSay('Inspect both ramps, select Rock A or B, steer around × boulders, close the rear APXS contact gap to 0 cm, and cite your teaching data without claiming proof of life.');
      else hint();
    };

    const dlg = document.getElementById('dlg');
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-label', 'Mars mission investigation');
    dlg.setAttribute('aria-modal', 'true');
    new MutationObserver(() => {
      if (dlg.style.display === 'block' && !dlg.contains(document.activeElement)) {
        dlg.querySelector('button:not([disabled]),a[href],input,textarea')?.focus();
      }
    }).observe(dlg, { childList: true });

    document.addEventListener('keydown', e => {
      const prof = document.getElementById('profile-modal');
      const arch = document.getElementById('archive-modal');
      if (e.key === 'Escape') {
        if (prof && prof.style.display === 'flex') { prof.style.display = 'none'; return; }
        if (arch && arch.style.display === 'flex') { if (window.closeNSSDCAArchive) window.closeNSSDCAArchive(); else arch.style.display = 'none'; return; }
        const bp = document.getElementById('bp');
        if (bp && bp.style.display === 'flex') { if (window.closeBadges) window.closeBadges(); else bp.style.display = 'none'; return; }
      }
      if (dlg.style.display !== 'block') return;
      if (e.key === 'Escape') {
        exitSub();
        document.querySelector('#ctl button')?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const controls = [...dlg.querySelectorAll('button:not([disabled]),a[href],input,textarea')].filter(el => el.offsetParent !== null);
      if (!controls.length) return;
      const first = controls[0], last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const oldReset = window.resetProgress;
    window.resetProgress = () => {
      oldReset();
      if (Object.keys(interactionState.completedTasks).length === 0) {
        soj = freshSoj();
        try { localStorage.removeItem(SOJ_STATE_KEY); } catch {}
      }
    };
    if (window.RQ && RQ.boot) RQ.boot(); else missionPicker();
  }

  function showFailure() {
    if (document.getElementById('runtime-failure')) return;
    const box = document.createElement('section');
    box.id = 'runtime-failure';
    box.style = 'position:fixed;inset:0;z-index:999;background:#090e17;color:#edf3f6;padding:10vh 8vw;overflow:auto';
    box.innerHTML = '<h1>The Mars renderer could not start.</h1><p>This chapter requires WebGL and the locally bundled Three.js library (vendor/three.min.js). Check that WebGL is enabled in your browser and local static assets are served correctly.</p><p><a href="moon.html" style="color:#a9f1da">Continue with the Moon chapter</a> · <a href="index.html" style="color:#a9f1da">Choose a world</a></p><button onclick="location.reload()">Try again</button>';
    document.body.appendChild(box);
  }

  window.addEventListener('error', e => { if (/THREE|WebGL|buildSojourner/.test(e.message || '')) showFailure(); });
  window.addEventListener('load', () => setTimeout(install, 250), { once: true });
})();
