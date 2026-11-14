/* ============================================================================
   RoverQuest — world switch (rq-world.js)
   One engine, two explorable worlds:
     mars.html               → Mars  (9 places, any 5 restore the ship)
     mars.html?world=moon    → Moon  (4 Apollo-era sites, any 3)
   moon.html redirects to the Moon world.
   RQ.W holds the per-world config. RQ.W.applyScene() re-skins the shared
   Three.js scene (terrain, sky, light, intro planet) once it has been built.
   ============================================================================ */
(function () {
  "use strict";
  const RQ = (window.RQ = window.RQ || {});
  let id = "mars";
  try { id = (new URLSearchParams(location.search).get("world") || window.RQ_WORLD || "mars").toLowerCase(); } catch (e) {}
  if (id !== "moon") id = "mars";

  const WORLDS = {
    mars: {
      id: "mars", name: "Mars", NAME: "MARS", emoji: "🔴", adj: "Martian",
      label: "Mars · silent machines",
      required: 5,
      systems: [["🧭", "Navigation"], ["⚡", "Power"], ["📡", "Comms"], ["🛡", "Heat shield"], ["🔥", "Main engine"]],
      explore: "Explore Mars freely",
      other: { id: "moon", name: "Moon", emoji: "🌙", href: "mars.html?world=moon" },
    },
    moon: {
      id: "moon", name: "Moon", NAME: "MOON", emoji: "🌙", adj: "lunar",
      label: "Moon · silent machines",
      required: 3,
      systems: [["🧭", "Guidance"], ["⚡", "Power"], ["🔥", "Ascent engine"]],
      explore: "Explore the Moon freely",
      other: { id: "mars", name: "Mars", emoji: "🔴", href: "mars.html" },
    },
  };
  const W = (RQ.W = Object.assign({}, WORLDS[id]));
  W.isMoon = id === "moon";
  /* per-world storage keys: Mars keeps the original names so old saves still work */
  W.key = (k) => (id === "mars" ? k : k + "." + id);
  try {
    document.documentElement.classList.add("world-" + id);
    if (W.isMoon) document.title = "RoverQuest: Beyond the Silent Machines — Moon Chapter";
  } catch (e) {}

  /* ---------------------------------------------------------------- Moon skin */
  function moonNoise(x, z) {
    return Math.sin(x * 0.021 + 1.3) * Math.cos(z * 0.017 - 0.4) + 0.6 * Math.sin(x * 0.006 - z * 0.009 + 2.1);
  }
  function earthTexture() {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 128;
    const x = cv.getContext("2d");
    x.fillStyle = "#2a6db5"; x.fillRect(0, 0, 256, 128);
    let s = 7;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) { x.fillStyle = r() > 0.35 ? "#3f8a3c" : "#a68a55"; x.beginPath(); x.ellipse(r() * 256, 20 + r() * 88, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, 7); x.fill(); }
    x.fillStyle = "rgba(255,255,255,.75)";
    for (let i = 0; i < 30; i++) { x.beginPath(); x.ellipse(r() * 256, r() * 128, 6 + r() * 30, 2 + r() * 5, 0, 0, 7); x.fill(); }
    x.fillStyle = "#f4f7fb"; x.fillRect(0, 0, 256, 9); x.fillRect(0, 119, 256, 9);
    const t = new THREE.CanvasTexture(cv);
    return t;
  }
  W.applyScene = function () {
    if (!W.isMoon || W._skinned || typeof THREE === "undefined" || typeof mr === "undefined") return;
    W._skinned = true;
    const M = Math;
    try {
      mr.fog = new THREE.Fog(0x000000, 170, 720);
      mr.background = new THREE.Color(0x000000);
      mr.traverse((o) => {
        // terrain → grey regolith with darker "maria" patches
        if (o.isMesh && o.geometry && o.geometry.type === "PlaneGeometry" && o.geometry.attributes.color) {
          const p = o.geometry.attributes.position, c = o.geometry.attributes.color;
          for (let i = 0; i < c.count; i++) {
            const k = c.getX(i) / 0.66, n = moonNoise(p.getX(i), p.getZ(i));
            const g = k * (0.56 + (n < -0.35 ? -0.12 : 0) + n * 0.03);
            c.setXYZ(i, g, g, g * 1.03);
          }
          c.needsUpdate = true;
        }
        // rocks → grey
        if (o.isInstancedMesh && o.instanceColor) {
          const col = new THREE.Color();
          for (let i = 0; i < o.count; i++) { const v = 0.28 + Math.random() * 0.22; o.setColorAt(i, col.setRGB(v, v, v * 1.04)); }
          o.instanceColor.needsUpdate = true;
        }
        // sky dome → black space
        if (o.isMesh && o.material && o.material.isShaderMaterial && o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 1500) {
          o.material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, depthWrite: false, fog: false });
        }
        if (o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 14 && o.material && o.material.color) o.material.color.set(0xffffff);
        if (o.isHemisphereLight) { o.color.set(0xc4ccd8); o.groundColor.set(0x23252b); o.intensity = 0.42; }
      });
      if (typeof sun2 !== "undefined") { sun2.color.set(0xffffff); sun2.intensity = 2.5; }
      if (typeof dust !== "undefined") dust.visible = false;
      // stars
      const sv = [];
      for (let i = 0; i < 1800; i++) {
        const u = Math.random() * 2 - 1, a = Math.random() * M.PI * 2, r = 1200, s = M.sqrt(1 - u * u);
        const y = M.abs(u) * r * 0.9 + 20;
        sv.push(M.cos(a) * s * r, y, M.sin(a) * s * r);
      }
      const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(sv, 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false }));
      mr.add(stars);
      // Earth hanging in the black sky
      const earth = new THREE.Mesh(new THREE.SphereGeometry(46, 32, 20), new THREE.MeshBasicMaterial({ map: earthTexture(), fog: false }));
      earth.position.set(520, 330, -820);
      mr.add(earth);
      W.earth = earth;
      // crater rims scattered across the plain (kept away from the sites)
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x7c7f86, roughness: 1 });
      const keep = (W.siteSpots || []).concat([[-14, -10]]);
      let placed = 0, tries = 0;
      while (placed < 34 && tries++ < 400) {
        const x = (Math.random() - 0.5) * 520, z = (Math.random() - 0.5) * 520, r = 3 + Math.pow(Math.random(), 2) * 16;
        if (keep.some((k) => M.hypot(k[0] - x, k[1] - z) < r + 12)) continue;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 6, 30), rimMat);
        rim.rotation.x = -M.PI / 2;
        rim.scale.z = 0.45;
        rim.position.set(x, H(x, z) + 0.05, z);
        rim.receiveShadow = true;
        mr.add(rim);
        placed++;
      }
    } catch (e) { console.warn("[RQ world] moon skin", e); }
    // intro planet → the Moon
    try {
      if (typeof planet !== "undefined" && planet.geometry.attributes.color) {
        const p = planet.geometry.attributes.position, c = planet.geometry.attributes.color;
        for (let i = 0; i < c.count; i++) {
          const n = M.sin(p.getX(i) * 0.031 + p.getY(i) * 0.02) * M.cos(p.getZ(i) * 0.027) + 0.5 * M.sin(p.getY(i) * 0.06 - p.getZ(i) * 0.04);
          const g = 0.62 + n * 0.1 - (n < -0.3 ? 0.16 : 0);
          c.setXYZ(i, g, g, g * 1.03);
        }
        c.needsUpdate = true;
      }
    } catch (e) {}
    // radar labels
    try {
      const wrap = document.getElementById("mm-wrap");
      if (wrap) {
        wrap.setAttribute("aria-label", "Moon Radar & silent machines");
        const tw = document.createTreeWalker(wrap, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/mars radar/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace("MARS RADAR", "MOON RADAR").replace("Mars Radar", "Moon Radar");
        wrap.querySelectorAll("[title]").forEach((el) => { el.title = el.title.replace("Mars Radar", "Moon Radar"); });
      }
    } catch (e) {}
    // hide the five Mars machines: the Moon has its own sites
    try {
      if (typeof MC !== "undefined") {
        MC.forEach((m) => { if (m.g) { m.g.visible = false; mr.remove(m.g); } if (m.beam) { m.beam.visible = false; mr.remove(m.beam); } });
        W.marsMachines = MC.splice(0);
      }
    } catch (e) {}
  };
})();
