/* ============================================================================
   RoverQuest — the 5 extra Mars places (rq-sites-mars.js)
   Mars has 9 places in all. Four are the original machines in mars.html
   (Sojourner · Spirit & Opportunity · Viking 1 & 2 · Phoenix & InSight).
   This file adds:
     • Ingenuity, the helicopter, standing on the plain (a 3D model)
     • 4 holo-beacon stations for spacecraft that never went to Mars:
       Dawn, NEAR Shoemaker, Pioneer 10 & 11, Kepler. Each beacon projects a
       hologram and says where the real craft is.
   Plus their mini-games and the Mars decorations (Viking 2, Phoenix and
   Opportunity moved next to its twin).
   ============================================================================ */
(function () {
  "use strict";
  const RQ = window.RQ;
  if (!RQ || !RQ.gfx || !RQ.site || !RQ.W || RQ.W.id !== "mars") return;
  const { clamp, rr, txt, space, fit, gauge, shuffle, sfx, M3 } = RQ.gfx;
  const ME = RQ.me;
  const G = (RQ.games = RQ.games || {});
  const SPACEBG = ["#03050a", "#151922"];
  const MARSBG = ["#2a1810", "#6b3a22"];
  const stars3 = (fails) => (fails === 0 ? 3 : fails <= 2 ? 2 : 1);

  /* ---------------------------------------------------------------- illustrations */
  const DRAW = {
    ing: '<rect y="200" width="400" height="90" fill="#b5673a"/><path d="M0 205q100-14 200 0t200 0" fill="#c97a48"/><g stroke="#2b2b2b" stroke-width="3"><path d="M178 175l-26 45M222 175l26 45M190 178l-10 42M210 178l10 42"/></g><rect x="176" y="150" width="48" height="30" rx="4" fill="#e9e4d6"/><rect x="196" y="96" width="8" height="56" fill="#555"/><rect x="88" y="120" width="224" height="6" rx="3" fill="#333"/><rect x="104" y="106" width="192" height="6" rx="3" fill="#444"/><rect x="170" y="78" width="60" height="16" fill="#27406e" stroke="#9fb7e0" stroke-width="2"/>',
    daw: '<circle cx="320" cy="215" r="70" fill="#5d5a57"/><circle cx="300" cy="200" r="7" fill="#f4f1e8"/><circle cx="340" cy="240" r="12" fill="#4b4845"/><rect x="40" y="95" width="120" height="30" fill="#27406e" stroke="#9fb7e0" stroke-width="2"/><rect x="200" y="95" width="120" height="30" fill="#27406e" stroke="#9fb7e0" stroke-width="2"/><rect x="160" y="88" width="40" height="44" fill="#c9a24a"/><path d="M162 132l-14 40h64l-14-40z" fill="#5fb6ff" opacity=".55"/><circle cx="180" cy="84" r="14" fill="#e9edf2"/>',
    nea: '<path d="M40 260q60-60 150-40t170 20q-20 40-170 40T40 260z" fill="#8a7357"/><circle cx="150" cy="245" r="9" fill="#6f5c45"/><circle cx="260" cy="250" r="6" fill="#6f5c45"/><path d="M180 120l20-12 20 12v28l-20 12-20-12z" fill="#c9a24a"/><rect x="90" y="124" width="80" height="18" fill="#27406e"/><rect x="230" y="124" width="80" height="18" fill="#27406e"/><path d="M178 108q22-24 44 0z" fill="#e9edf2"/><path d="M200 165v50" stroke="#ffd166" stroke-dasharray="4 6" stroke-width="2"/>',
    pio: '<circle cx="330" cy="70" r="42" fill="#d9a56b"/><path d="M290 64h80M292 80h76" stroke="#a8743f" stroke-width="5"/><path d="M110 150q60-80 120 0z" fill="#e9edf2" stroke="#9aa3ad" stroke-width="2"/><rect x="155" y="150" width="30" height="20" fill="#c9a24a"/><path d="M170 170L90 215M170 170l80 45" stroke="#bfc6cf" stroke-width="3"/><rect x="80" y="210" width="18" height="12" fill="#8a929c"/><rect x="242" y="210" width="18" height="12" fill="#8a929c"/><path d="M60 250q140-40 300-170" stroke="#ffd166" stroke-dasharray="6 7" stroke-width="2" fill="none"/>',
    kep: '<g fill="#fff"><circle cx="70" cy="60" r="2"/><circle cx="120" cy="40" r="1.5"/><circle cx="330" cy="50" r="2"/><circle cx="350" cy="120" r="1.5"/></g><rect x="160" y="80" width="70" height="150" rx="10" fill="#d6dbe2" transform="rotate(-18 195 155)"/><path d="M150 70l90-30 8 22-90 30z" fill="#3b4250"/><rect x="250" y="100" width="22" height="140" fill="#27406e" stroke="#9fb7e0" stroke-width="2" transform="rotate(-18 261 170)"/><path d="M40 255h80l10 10 10-10h220" stroke="#46e0b0" stroke-width="3" fill="none"/>',
  };
  function art(id) {
    const mars = id === "ing";
    let st = "";
    if (!mars) for (let i = 0; i < 40; i++) st += `<circle cx="${(i * 97) % 400}" cy="${(i * 53) % 200}" r="${i % 5 ? 0.9 : 1.6}" fill="#fff" opacity="${0.35 + (i % 4) * 0.15}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 290"><rect width="400" height="290" fill="${mars ? "#d8a273" : "#05070d"}"/>${st}${DRAW[id]}<text x="12" y="282" font-family="Segoe UI,sans-serif" font-size="11" fill="${mars ? "#3a2416" : "#9aa7bb"}">AI-assisted illustration · based on NASA records</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /* ---------------------------------------------------------------- data */
  const SITES = [
    {
      id: "ing", kind: "surface", pos: [-40, 30], rot: 0.6, color: 0x9ad0ff, labelY: 4.6,
      short: "Ingenuity", name: "Ingenuity Mars Helicopter", mission: "Mars 2020", yr: "2021–2024", site: "Jezero Crater", record: "2020-052A",
      url: "https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/",
      role: "First aircraft on another planet", icon: "🚁",
      voice: "They said I'd fly five times. I flew seventy-two. The air here is so thin my blades had to spin about forty times a second just to lift me.",
      status: "Ingenuity still stands where it last landed, in Jezero Crater, after its 72nd flight on January 18, 2024 damaged its rotor blades.",
      found: {
        explorer: "On April 19, 2021, Ingenuity lifted off the ground on Mars. It was the first time anything had flown under its own power on another planet. It ended up flying 72 times!",
        scientist: "Ingenuity, a 1.8 kg helicopter that rode to Mars under the Perseverance rover, made the first powered, controlled flight on another planet on April 19, 2021. Planned for 5 test flights, it flew 72 times, covering about 17 km and scouting routes for Perseverance.",
      },
      means: {
        explorer: "Mars air is super thin, so flying there is really hard. Ingenuity proved we can do it, so future explorers could send flying scouts.",
        scientist: "Mars's air is only about 1% as dense as Earth's, so the rotors had to spin at about 2,400 rpm. Ingenuity proved that aircraft can scout ahead for rovers and, one day, astronauts.",
      },
      deep: "Ingenuity's two 1.2 m counter-rotating rotors spun at roughly 2,400–2,700 rpm. It navigated with a downward camera that tracked surface features. Over smooth, featureless sand ripples on its last flight, the navigation system had too little to track, and the helicopter came down hard, breaking its blades.",
      sort: [
        ["Ingenuity flew 72 times on Mars.", 0, "A counted, recorded fact is an observation."],
        ["Helicopters could one day scout ahead for astronauts on Mars.", 1, "A prediction about the future is an interpretation."],
        ["Ingenuity's rotors spun at about 2,400 rpm.", 0, "A measured speed is an observation."],
        ["Smooth sand probably confused Ingenuity's navigation camera on its last flight.", 1, "A likely explanation for what went wrong is an interpretation."],
      ],
      restore: { q: "Why did Ingenuity's rotors have to spin so fast?", o: [["Mars's air is only about 1% as thick as Earth's, so the blades must move fast to push enough air down.", ""], ["To keep Mars dust devils away.", "Rotor speed was about lift, not dust devils."], ["Because gravity on Mars is stronger than on Earth.", "Mars gravity is only about 38% of Earth's. The thin air is the hard part."]], a: 0 },
      final: { icon: "🚁", t: "Fly in thin air", q: "Your ship's scout drone must fly in very thin air. Which change helps most?", o: [["Keep it very light and spin its rotors much faster.", ""], ["Make it heavier so it's more stable.", "More weight needs more lift, and thin air gives very little."], ["Spin the rotors slower to save battery.", "Slower blades push less air. In thin air it wouldn't even lift off."]], a: 0, ok: "That's Ingenuity's trick: 1.8 kg, with rotors at about 2,400 rpm." },
      slide: { ttl: "Ingenuity · 2021–2024", sub: "First flight on another planet · 72 flights" },
      line: "Ingenuity proved we can fly in the thin air of another world.",
    },
    {
      id: "daw", kind: "beacon", pos: [-125, 5], color: 0x7fb2ff,
      short: "Dawn", name: "Dawn spacecraft", mission: "Dawn", yr: "2007–2018", site: "Orbiting Ceres", record: "2007-043A",
      url: "https://science.nasa.gov/mission/dawn/",
      role: "First to orbit two worlds", icon: "🌅",
      voice: "My engines pushed no harder than a sheet of paper resting on your hand. But I never stopped pushing, and that took me to two worlds.",
      status: "Dawn is still circling the dwarf planet Ceres in the asteroid belt. It went silent on November 1, 2018, when it ran out of the hydrazine fuel it used to point itself.",
      found: {
        explorer: "Dawn visited two worlds in the asteroid belt: Vesta and the dwarf planet Ceres. On Ceres it found bright white spots made of salt.",
        scientist: "Dawn orbited the giant asteroid Vesta (2011–2012), then flew on to the dwarf planet Ceres (2015–2018). It was the first spacecraft to orbit two worlds beyond Earth. Ceres's bright spots in Occator Crater turned out to be salts, mostly sodium carbonate.",
      },
      means: {
        explorer: "Salt on Ceres means salty water was once there, and some may still be deep underground.",
        scientist: "Salts like sodium carbonate are left behind when salty water reaches the surface and evaporates. So Ceres had, and may still have, brine below its crust. Gentle ion engines made the two-world trip possible.",
      },
      deep: "Dawn's three xenon ion engines produced at most about 90 millinewtons of thrust, but over years of operation they changed its speed by about 11 km/s, more than any other spacecraft's own engines at the time. At Ceres it mapped from a sequence of lower orbits (Survey, HAMO and LAMO) before an elliptical final orbit dipped to about 35 km.",
      sort: [
        ["Dawn orbited Vesta and then Ceres.", 0, "A recorded mission event is an observation."],
        ["Ceres may still have salty water deep underground.", 1, "A conclusion drawn from the salts is an interpretation."],
        ["The bright spots in Occator Crater contain sodium carbonate.", 0, "Measured with Dawn's instruments, so it's an observation."],
        ["The salts were left behind when brine reached the surface and dried out.", 1, "An explanation of how they formed is an interpretation."],
      ],
      restore: { q: "What made Dawn the first spacecraft to orbit two different worlds?", o: [["Its ion engines: a tiny push kept up for years added up to a huge change in speed.", ""], ["It carried two separate rockets, one for each world.", "Dawn used the same three ion engines the whole way."], ["Vesta and Ceres touch, so it just drifted across.", "They're hundreds of millions of kilometres apart."]], a: 0 },
      final: { icon: "🌅", t: "A big change with a small push", q: "Your ship's main engine is gone. All you have is a tiny thruster that can run for months. Can you still change course a lot?", o: [["Yes. A small push kept up for a long time adds up to a big change in speed, like Dawn's ion engines.", ""], ["No. Only big, powerful burns can change your speed.", "Dawn changed its speed by about 11 km/s with a push the weight of a sheet of paper."], ["Only if you turn it on and off very fast.", "It's the total push over time that matters, not flickering it."]], a: 0, ok: "That's Dawn's ion engine: gentle, patient and incredibly efficient." },
      slide: { ttl: "Dawn · 2007–2018", sub: "Orbited Vesta and Ceres · salty bright spots" },
      line: "Dawn showed that a gentle push, kept up long enough, can take you to two worlds.",
      holo() {
        const b = M3.box(1.1, 1.1, 1.1, 0xffffff);
        const w1 = M3.at(M3.box(3.3, 0.05, 0.85, 0xffffff), 2.25, 0, 0), w2 = M3.at(M3.box(3.3, 0.05, 0.85, 0xffffff), -2.25, 0, 0);
        const dish = M3.at(M3.cyl(0.62, 0.18, 0.18, 0xffffff, 18), 0, 0.2, 0.68, Math.PI / 2);
        const eng = M3.at(M3.cyl(0.12, 0.25, 0.4, 0xffffff, 10), 0, -0.75, 0);
        return M3.group(b, w1, w2, dish, eng, M3.at(M3.box(0.6, 0.04, 0.04, 0xffffff), 0.85, 0, 0), M3.at(M3.box(0.6, 0.04, 0.04, 0xffffff), -0.85, 0, 0));
      },
    },
    {
      id: "nea", kind: "beacon", pos: [-30, -125], color: 0xffc27a,
      short: "NEAR Shoemaker", name: "NEAR Shoemaker", mission: "NEAR Shoemaker", yr: "1996–2001", site: "On asteroid 433 Eros", record: "1996-008A",
      url: "https://science.nasa.gov/mission/near-shoemaker/",
      role: "First to orbit and land on an asteroid", icon: "🪨",
      voice: "I was built to orbit, not to land. On my last day, they let me drift down to the surface of Eros anyway, slower than you walk, and I kept talking.",
      status: "NEAR Shoemaker is still sitting on the surface of the asteroid Eros, where it touched down on February 12, 2001. Its last signal was received on February 28, 2001.",
      found: {
        explorer: "NEAR Shoemaker circled the potato-shaped asteroid Eros for a whole year, then gently landed on it, even though it was never built to land.",
        scientist: "NEAR Shoemaker went into orbit around 433 Eros on February 14, 2000, the first spacecraft to orbit an asteroid. A year later, on February 12, 2001, it touched down at about 1.5–1.8 m/s, sending 69 close-up images on the way, the last from about 120 m up.",
      },
      means: {
        explorer: "Eros is like a giant floating rock pile with almost no gravity. NEAR showed that you can land on one if you go very, very slowly.",
        scientist: "Eros's gravity is less than a thousandth of Earth's, so landing is about matching speed, not braking hard. NEAR's data showed a dusty, boulder-strewn surface on a solid, very old body, which helps us understand what the planets were built from.",
      },
      deep: "Eros is about 34 km long. Mission controllers used a series of braking burns to lower NEAR from orbit over about 4.5 hours. Its gamma-ray spectrometer kept working on the surface for about two weeks, measuring the asteroid's composition from just centimetres away.",
      sort: [
        ["NEAR Shoemaker landed on Eros at about 1.6 m/s.", 0, "A measured speed is an observation."],
        ["Eros is a leftover building block from when the planets formed.", 1, "A conclusion about Eros's history is an interpretation."],
        ["NEAR sent 69 images during its descent.", 0, "A counted fact is an observation."],
        ["The surface boulders were probably thrown out by an impact.", 1, "A likely explanation is an interpretation."],
      ],
      restore: { q: "NEAR Shoemaker was built to orbit, not to land. How did it survive touching down on Eros?", o: [["It came down very slowly, about 1.6 m/s, in Eros's tiny gravity.", ""], ["It opened a parachute.", "Eros has no air, so a parachute would do nothing."], ["It drilled itself into the rock.", "NEAR had no drill. It just settled gently onto the surface."]], a: 0 },
      final: { icon: "🪨", t: "Touch down on a tiny world", q: "Your ship must land on a small asteroid with almost no gravity. What's the biggest danger?", o: [["Coming in too fast and bouncing off. Approach very slowly, like NEAR.", ""], ["Being crushed by the asteroid's strong gravity.", "A small asteroid's gravity is thousands of times weaker than Earth's."], ["Burning up in its thick air.", "Asteroids have no air at all."]], a: 0, ok: "NEAR Shoemaker settled onto Eros at walking speed or slower." },
      slide: { ttl: "NEAR Shoemaker · 1996–2001", sub: "First to orbit, then land on, an asteroid" },
      line: "NEAR Shoemaker proved a gentle touch can land you on an asteroid.",
      holo() {
        const body = M3.cyl(0.8, 0.8, 1.4, 0xffffff, 8);
        const ps = [0, 1, 2, 3].map((i) => { const p = M3.box(1.5, 0.05, 0.75, 0xffffff); const a = (i * Math.PI) / 2; p.position.set(Math.cos(a) * 1.5, 0.72, Math.sin(a) * 1.5); p.rotation.y = -a; return p; });
        const dish = M3.at(M3.cyl(0.75, 0.2, 0.2, 0xffffff, 18), 0, 0.92, 0);
        return M3.group(body, dish, ...ps, M3.at(M3.cyl(0.18, 0.18, 0.3, 0xffffff, 8), 0, -0.85, 0));
      },
    },
    {
      id: "pio", kind: "beacon", pos: [75, -105], color: 0xffe08a,
      short: "Pioneer 10 & 11", name: "Pioneer 10 & 11", mission: "Pioneer 10 & 11", yr: "1972–2003", site: "Leaving the solar system", record: "1972-012A",
      url: "https://science.nasa.gov/mission/pioneer-10/",
      role: "First to Jupiter and Saturn", icon: "📡",
      voice: "We were the first through the asteroid belt and the first to see Jupiter up close. Now we carry a golden plaque out into the stars.",
      status: "Pioneer 10 and 11 are still coasting out of the solar system, far beyond the planets. Pioneer 10 sent its last signal on January 23, 2003; Pioneer 11's last contact was on September 30, 1995.",
      found: {
        explorer: "Pioneer 10 was the first spacecraft to fly past Jupiter, in 1973. Its twin, Pioneer 11, then flew past Jupiter and became the first to visit Saturn, in 1979.",
        scientist: "Launched in 1972, Pioneer 10 was the first spacecraft to cross the asteroid belt and fly past Jupiter (December 1973). Pioneer 11 used Jupiter's gravity to swing on to Saturn, making the first Saturn flyby in 1979. Both carry a gold-anodized plaque showing who sent them and from where.",
      },
      means: {
        explorer: "Flying close to Jupiter flung the Pioneers faster, like a skateboarder grabbing a passing bus. That's how they could leave the solar system.",
        scientist: "A gravity assist lets a spacecraft borrow a little of a planet's orbital motion. Jupiter's flyby gave Pioneer 10 enough speed to escape the Sun's gravity, and bent Pioneer 11's path toward Saturn. Missions still use this trick today.",
      },
      deep: "Far from the Sun, solar panels are useless, so each Pioneer was powered by four radioisotope thermoelectric generators (RTGs) that turn heat from decaying plutonium-238 into electricity. As the plutonium decayed, the power slowly dropped until the instruments, and finally the radio, could no longer run.",
      sort: [
        ["Pioneer 11 flew past Saturn in 1979.", 0, "A recorded event is an observation."],
        ["Gravity assists are the best way to reach the outer planets.", 1, "A judgment about the best method is an interpretation."],
        ["Pioneer 10's last signal arrived on January 23, 2003.", 0, "A recorded date is an observation."],
        ["The fading signal was caused by the RTGs' power slowly dropping.", 1, "An explanation of why it faded is an interpretation."],
      ],
      restore: { q: "How did Pioneer 10 get fast enough to leave the solar system?", o: [["A gravity assist: flying past Jupiter flung it onward, faster.", ""], ["It refuelled at Jupiter.", "There are no fuel stops in space. Jupiter's gravity did the work."], ["Its engines kept firing for 30 years.", "Its rocket burned for minutes at launch. After that it coasted."]], a: 0 },
      final: { icon: "📡", t: "Speed without fuel", q: "Your ship is nearly out of fuel but needs more speed to reach home. What's the smartest move?", o: [["Fly just behind a moving planet and let its gravity fling you faster.", ""], ["Fly straight into the planet's atmosphere to slow down first.", "That would slow you down, or worse."], ["Turn the engines off and wait to speed up.", "Coasting alone doesn't add speed. A planet's pull can."]], a: 0, ok: "That's the Pioneer slingshot: Jupiter's gravity did what fuel couldn't." },
      slide: { ttl: "Pioneer 10 & 11 · 1972–2003", sub: "First to Jupiter and Saturn · gravity assist" },
      line: "The Pioneers showed how a planet's gravity can fling a spacecraft toward the stars.",
      holo() {
        const dish = new THREE.Mesh(new THREE.SphereGeometry(1.5, 22, 8, 0, Math.PI * 2, 0, Math.PI / 4.5), M3.m(0xffffff));
        dish.rotation.x = Math.PI; dish.position.y = 1.6;
        const bus = M3.at(M3.cyl(0.55, 0.55, 0.45, 0xffffff, 6), 0, 0, 0);
        const r1 = M3.rod([0.3, 0, 0.2], [1.9, -0.3, 0.6], 0.04, 0xffffff), r2 = M3.rod([-0.3, 0, 0.2], [-1.9, -0.3, 0.6], 0.04, 0xffffff);
        const t1 = M3.at(M3.cyl(0.18, 0.18, 0.5, 0xffffff, 8), 1.95, -0.3, 0.6, 0, 0, Math.PI / 2), t2 = M3.at(M3.cyl(0.18, 0.18, 0.5, 0xffffff, 8), -1.95, -0.3, 0.6, 0, 0, Math.PI / 2);
        const mag = M3.rod([0, 0, -0.3], [0.4, -0.2, -3], 0.025, 0xffffff);
        return M3.group(dish, bus, r1, r2, t1, t2, mag, M3.at(M3.cyl(0.08, 0.08, 1.2, 0xffffff, 6), 0, 0.85, 0));
      },
    },
    {
      id: "kep", kind: "beacon", pos: [140, -10], color: 0xb48cff,
      short: "Kepler", name: "Kepler Space Telescope", mission: "Kepler / K2", yr: "2009–2018", site: "Trailing Earth around the Sun", record: "2009-011A",
      url: "https://science.nasa.gov/mission/kepler/",
      role: "Planet hunter", icon: "🔭",
      voice: "I never saw a single planet with my own eyes. I just watched stars, very patiently, waiting for them to blink.",
      status: "Kepler is still orbiting the Sun, slowly drifting behind Earth. It was switched off on October 30, 2018, after running out of fuel.",
      found: {
        explorer: "Kepler stared at about 150,000 stars at once and spotted tiny dips in their light when a planet passed in front. It found more than 2,600 planets!",
        scientist: "From 2009, Kepler stared at about 150,000 stars in the constellations Cygnus and Lyra, measuring their brightness very precisely. Repeating dips, called transits, revealed planets passing in front of their stars. Kepler and its K2 mission confirmed more than 2,600 planets.",
      },
      means: {
        explorer: "Planets around other stars are really common. There could be billions in our galaxy, and some might be a bit like Earth.",
        scientist: "Kepler's results suggest that most stars have planets, and that small, rocky planets are common. A dip that repeats on a regular schedule shows a planet's orbit, and the dip's depth shows its size.",
      },
      deep: "A transit by an Earth-sized planet across a Sun-like star dims it by only about 0.01%, so Kepler needed extremely stable pointing. When a second of its four reaction wheels failed in 2013, engineers balanced it against the pressure of sunlight for the K2 mission, which ran until the fuel ran out in 2018.",
      sort: [
        ["Kepler measured tiny, repeating dips in starlight.", 0, "A measurement is an observation."],
        ["Most stars in our galaxy probably have planets.", 1, "A conclusion from many results is an interpretation."],
        ["Kepler confirmed more than 2,600 planets.", 0, "A counted result is an observation."],
        ["A deeper dip means a bigger planet.", 1, "Reasoning about what the data means is an interpretation."],
      ],
      restore: { q: "How did Kepler find planets it could never actually see?", o: [["It watched for tiny, repeating dips in a star's brightness when a planet passed in front.", ""], ["It photographed the planets' surfaces up close.", "They were far too far away. Kepler only measured starlight."], ["It listened for radio signals from them.", "Kepler measured light, not radio."]], a: 0 },
      final: { icon: "🔭", t: "Is it really there?", q: "Your ship's sensor sees one dip in a star's light. Have you found a planet?", o: [["Not yet. Wait to see the same dip repeat on a regular schedule.", ""], ["Yes. One dip is enough proof.", "One dip could be noise or a starspot. Kepler needed repeats."], ["No. Planets never dim stars.", "They do, slightly, when they pass in front. That's the transit method."]], a: 0, ok: "Kepler's rule: a planet makes the same dip again and again, on schedule." },
      slide: { ttl: "Kepler · 2009–2018", sub: "2,600+ planets found by watching stars blink" },
      line: "Kepler showed that planets around other stars are everywhere.",
      holo() {
        const tube = M3.cyl(0.72, 0.72, 2.6, 0xffffff, 18);
        const shade = M3.at(M3.box(1.7, 0.05, 1.7, 0xffffff), 0, 1.45, 0, 0.5);
        const bus = M3.at(M3.cyl(0.85, 0.85, 0.5, 0xffffff, 6), 0, -1.5, 0);
        const panel = M3.at(M3.box(0.06, 2.6, 1.6, 0xffffff), 1.05, -0.1, 0);
        const g = M3.group(tube, shade, bus, panel);
        g.rotation.z = 0.35;
        return g;
      },
    },
  ];
  SITES.forEach((s) => (s.img = art(s.id)));

  /* ---------------------------------------------------------------- 3D: Ingenuity */
  SITES[0].build = function () {
    const g = new THREE.Group(), k = 3;
    const film = M3.mat(0xe7e2d4, 0.55, 0.2), carbon = M3.mat(0x2a2a2c, 0.5, 0.4), blade = M3.mat(0x3a3a3c, 0.4, 0.3), cell = M3.mat(0x1d3566, 0.3, 0.6);
    g.add(M3.at(M3.box(0.2 * k, 0.14 * k, 0.16 * k, film), 0, 0.44 * k, 0));
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { g.add(M3.rod([a * 0.08 * k, 0.4 * k, b * 0.06 * k], [a * 0.26 * k, 0, b * 0.22 * k], 0.012 * k, carbon)); g.add(M3.at(M3.box(0.06 * k, 0.02 * k, 0.06 * k, carbon), a * 0.26 * k, 0.01 * k, b * 0.22 * k)); });
    g.add(M3.at(M3.cyl(0.012 * k, 0.012 * k, 0.42 * k, carbon, 8), 0, 0.72 * k, 0));
    const rot = (y, ry) => { const r = new THREE.Group(); r.add(M3.box(1.2 * k, 0.008 * k, 0.07 * k, blade)); r.add(M3.cyl(0.03 * k, 0.03 * k, 0.03 * k, carbon, 10)); r.position.y = y * k; r.rotation.y = ry; g.add(r); return r; };
    const r1 = rot(0.6, 0.4), r2 = rot(0.68, 1.6);
    g.add(M3.at(M3.box(0.42 * k, 0.012 * k, 0.17 * k, cell), 0, 0.94 * k, 0));
    // a broken blade tip lying nearby (its last flight damaged the rotors)
    g.add(M3.at(M3.box(0.32 * k, 0.008 * k, 0.07 * k, blade), 1.5, 0.03, 1.1, 0, 0.9));
    const store = RQ.site.store;
    g.userData.spin = (t) => { if (store.get("ing").done) { r1.rotation.y = t * 1.2; r2.rotation.y = -t * 1.2; } };
    return g;
  };

  /* ---------------------------------------------------------------- Mars decorations */
  RQ.site.decorate.mars = function ({ M3: K, H, mr, MC }) {
    const by = (n) => MC.find((m) => m.n === n);
    // Opportunity rolls over next to its twin so "Spirit & Opportunity" is one place
    const opp = by("Opportunity Rover");
    if (opp && opp.g) {
      opp.x = 95; opp.z = 56;
      opp.g.position.set(opp.x, H(opp.x, opp.z), opp.z);
      if (opp.beam) opp.beam.position.set(opp.x, H(opp.x, opp.z) + 30, opp.z);
    }
    const tag = (txtS, col, x, y, z) => { const l = K.label(txtS, col); l.position.set(x, y, z); l.scale.set(5.2, 1, 1); mr.add(l); };
    // Viking 2 (decorative model; the Viking 1 machine hosts the datapoint)
    try {
      if (typeof lander === "function") {
        const v2 = lander(2, 0xb09060, 0);
        v2.position.set(-82, H(-82, -64), -64); v2.rotation.y = 2.2;
        mr.add(K.shadows(v2));
        tag("Viking 2 · model", "#ffb36b", -82, H(-82, -64) + 4.6, -64);
      }
    } catch (e) {}
    // Phoenix (decorative model next to InSight)
    try {
      const p = new THREE.Group(), s = 1.5;
      const deck = K.mat(0xd8c9a0, 0.5, 0.3), cell = K.mat(0x1d3566, 0.3, 0.6), metal = K.mat(0x9aa0aa, 0.45, 0.6);
      p.add(K.at(K.cyl(0.75 * s, 0.75 * s, 0.22 * s, deck, 10), 0, 1.0 * s, 0));
      [0, 2.1, 4.2].forEach((a) => p.add(K.rod([Math.cos(a) * 0.55 * s, 0.95 * s, Math.sin(a) * 0.55 * s], [Math.cos(a) * 0.95 * s, 0.05, Math.sin(a) * 0.95 * s], 0.04 * s, metal)));
      [-1, 1].forEach((d) => { p.add(K.at(K.cyl(0.9 * s, 0.9 * s, 0.03 * s, cell, 10), d * 1.65 * s, 1.08 * s, 0)); p.add(K.rod([d * 0.7 * s, 1.05 * s, 0], [d * 0.8 * s, 1.08 * s, 0], 0.03 * s, metal)); });
      p.add(K.rod([0.3 * s, 1.15 * s, 0.4 * s], [0.6 * s, 1.6 * s, 1.1 * s], 0.035 * s, metal));
      p.add(K.rod([0.6 * s, 1.6 * s, 1.1 * s], [0.7 * s, 0.4 * s, 1.7 * s], 0.03 * s, metal));
      p.add(K.at(K.box(0.18 * s, 0.1 * s, 0.22 * s, metal), 0.7 * s, 0.38 * s, 1.72 * s));
      p.add(K.at(K.cyl(0.02 * s, 0.02 * s, 1.0 * s, metal, 6), -0.4 * s, 1.6 * s, -0.3 * s));
      p.add(K.at(K.box(0.2 * s, 0.12 * s, 0.12 * s, deck), -0.4 * s, 2.15 * s, -0.3 * s));
      p.position.set(26, H(26, 106), 106); p.rotation.y = -0.7;
      mr.add(K.shadows(p));
      tag("Phoenix · model", "#ffb36b", 26, H(26, 106) + 4.4, 106);
    } catch (e) {}
  };

  /* ================================================================ MINI-GAMES */
  /* ---------- A. INGENUITY · First Flight ---------- */
  (function () {
    const LW = 1000, LH = 640, GY = 560, GRAV = 90, PAD = [830, 970], SAND = [420, 700];
    const RINGS = [[320, 330], [560, 230], [740, 330]];
    let s = null;
    const home = () => { s.x = 120; s.y = GY - 18; s.vx = 0; s.vy = 0; s.rpm = 0; s.air = false; s.drift = 0; };
    G.ing = {
      title: "First Flight", mission: "Mars 2020 · Ingenuity", icon: "🚁", bg: MARSBG,
      tagline: "Mars's air is only about 1% as thick as Earth's. Spin Ingenuity's rotors fast enough to lift off, fly through 3 waypoints and land softly on the rocky airfield.",
      how: [["⬆", "Hold <b>▲ LIFT</b> (or ↑ / Space). The rotors must reach about <b>2,400 rpm</b> before you rise."], ["↔", "Hold <b>◀ ▶</b> (or ← →) to fly sideways through the <b>3 rings</b> in order."], ["🪨", "Land gently on the <b>rocky airfield</b>. Over smooth sand the navigation camera has nothing to track, so expect drift."]],
      sci: "<b>The real thing:</b> On April 19, 2021, Ingenuity made the first powered, controlled flight on another planet. Its 1.2 m rotors spun at about 2,400 rpm. Planned for 5 flights, it flew 72 times, about 17 km in total, until a hard landing over featureless sand on January 18, 2024 damaged its blades.",
      photo: { src: art("ing"), cap: "Ingenuity, the 1.8 kg Mars helicopter (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        return ["Hold LIFT and watch the RPM climb. You only rise once it passes about 2,400.", "Let go of LIFT to sink gently. Short holds keep your height steady and save battery.", "Over the smooth sand you'll drift. Tap the opposite arrow to correct.", "Land on the rocky patch on the right, slowly: keep FALL under 45."][Math.min(l, 3)];
      },
      init(api) {
        const e = ME.ease();
        s = { api, bat0: 100 * e, bat: 100 * e, up: false, L: false, R: false, ring: 0, t: 0, stT: 0, told: false };
        home();
        api.ctrls(`<button type="button" data-hold="L" aria-label="Fly left" style="min-width:80px;touch-action:none">◀</button><button type="button" class="rq-btn primary" data-hold="UP" style="min-width:150px;touch-action:none">▲ LIFT</button><button type="button" data-hold="R" aria-label="Fly right" style="min-width:80px;touch-action:none">▶</button>`);
      },
      hold(c, v) { if (!s) return; if (c === "UP") s.up = v; if (c === "L") s.L = v; if (c === "R") s.R = v; },
      key(code, down) {
        if (!s) return false;
        if (code === "ArrowUp" || code === "KeyW" || code === "Space") { s.up = down; return true; }
        if (code === "ArrowLeft" || code === "KeyA") { s.L = down; return true; }
        if (code === "ArrowRight" || code === "KeyD") { s.R = down; return true; }
        return false;
      },
      update(dt, api) {
        s.t += dt;
        const pow = s.bat > 0;
        const target = s.up && pow ? 2700 : s.air ? 2050 : 0;
        s.rpm += (target - s.rpm) * Math.min(1, dt * 1.6);
        const lift = GRAV * Math.pow(s.rpm / 2400, 2);
        let ax = 0;
        if (s.air) ax += ((s.R ? 1 : 0) - (s.L ? 1 : 0)) * 95;
        if (s.air && s.x > SAND[0] && s.x < SAND[1]) {
          s.drift = clamp(s.drift + (Math.random() - 0.5) * 420 * dt, -80, 80);
          ax += s.drift;
          if (!s.told) { s.told = true; api.toast("🏜 Smooth sand! The navigation camera can't find features to track, so Ingenuity drifts. Correct with ◀ ▶."); }
        } else s.drift *= 0.9;
        s.vx = (s.vx + ax * dt) * (1 - 0.9 * dt);
        if (s.air || lift > GRAV) s.vy += (GRAV - lift) * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.bat = Math.max(0, s.bat - (s.up ? 5 : s.air ? 1.2 : 0) * dt);
        if (s.x < 30 || s.x > LW - 30) { s.x = clamp(s.x, 30, LW - 30); s.vx = 0; }
        if (s.y < 50) { s.y = 50; s.vy = Math.max(0, s.vy); }
        if (s.y < GY - 19) s.air = true;
        if (s.ring < RINGS.length) {
          const r = RINGS[s.ring];
          if (Math.hypot(s.x - r[0], s.y - r[1]) < 42) { s.ring++; sfx().good(); api.toast(s.ring < 3 ? `Waypoint ${s.ring} of 3 ✓` : "All 3 waypoints ✓ Now land on the rocky airfield.", "good"); }
        }
        if (s.y >= GY - 18) {
          if (s.air) {
            if (s.vy > 45 || Math.abs(s.vx) > 38) { api.fail(`💥 Rough landing at ${Math.round(s.vy)} down. Ingenuity's final flight ended with broken blades after a hard touchdown. Try again.`); s.bat = s.bat0; s.ring = 0; home(); return; }
            s.air = false; s.vx = 0;
            if (s.x > PAD[0] && s.x < PAD[1]) {
              if (s.ring >= 3) {
                s.up = s.L = s.R = false;
                api.win({ stars: stars3(api.fails), line: "First flight complete: lift-off, waypoints and a soft landing.", summary: `${ME.name()} flew Ingenuity through thin Martian air at about 2,400 rpm and landed it softly on the airfield.` });
                return;
              }
              api.toast("Nice landing! But fly through all 3 rings first.");
            } else if (s.x > SAND[0] && s.x < SAND[1]) api.toast("You set down on smooth sand. Lift off again and head for the rocky airfield.");
          }
          s.y = GY - 18;
          if (s.vy > 0) s.vy = 0;
          if (!pow) { api.fail("🔋 Battery empty! Ingenuity recharged from its small solar panel between flights. Try shorter lifts."); s.bat = s.bat0; s.ring = 0; home(); return; }
        }
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>🔋 ${Math.round((s.bat / s.bat0) * 100)}%</span><span>🌀 ${Math.round(s.rpm).toLocaleString()} rpm</span><span>⭕ ${s.ring}/3</span>`); }
      },
      draw(c, api) {
        const Wd = api.W, Hd = api.H, f = fit(api, LW, LH);
        const sky = c.createLinearGradient(0, 0, 0, Hd); sky.addColorStop(0, "#b77a52"); sky.addColorStop(1, "#e2b088");
        c.fillStyle = sky; c.fillRect(0, 0, Wd, Hd);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        c.fillStyle = "#c98b5e"; c.beginPath(); c.moveTo(0, 420); for (let x = 0; x <= LW; x += 50) c.lineTo(x, 400 + Math.sin(x * 0.011) * 30); c.lineTo(LW, GY); c.lineTo(0, GY); c.fill();
        c.fillStyle = "#a9623a"; c.fillRect(0, GY, LW, LH - GY);
        c.fillStyle = "#c98457"; c.fillRect(SAND[0], GY, SAND[1] - SAND[0], LH - GY);
        txt(c, "SMOOTH SAND", (SAND[0] + SAND[1]) / 2, GY + 40, 13, "#7a4428", "center", 800);
        c.fillStyle = "#6e3d24"; for (let i = 0; i < 40; i++) { const x = PAD[0] + ((i * 37) % (PAD[1] - PAD[0])), y = GY + 6 + ((i * 13) % 50); c.beginPath(); c.arc(x, y, 2 + (i % 3), 0, 7); c.fill(); }
        for (let i = 0; i < 18; i++) { const x = 30 + ((i * 53) % 360), y = GY + 8 + ((i * 17) % 50); c.beginPath(); c.arc(x, y, 2 + (i % 3), 0, 7); c.fill(); }
        c.strokeStyle = "#46e0b0"; c.lineWidth = 3; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(PAD[0], GY + 2); c.lineTo(PAD[1], GY + 2); c.stroke(); c.setLineDash([]);
        txt(c, "AIRFIELD", (PAD[0] + PAD[1]) / 2, GY + 24, 13, "#d9fff2", "center", 800);
        RINGS.forEach((r, i) => {
          const done = i < s.ring, cur = i === s.ring;
          c.strokeStyle = done ? "#46e0b0" : cur ? `rgba(255,209,102,${0.7 + 0.3 * Math.sin(s.t * 6)})` : "rgba(255,255,255,.35)";
          c.lineWidth = cur ? 5 : 3; c.beginPath(); c.ellipse(r[0], r[1], 16, 40, 0, 0, 7); c.stroke();
          txt(c, done ? "✓" : String(i + 1), r[0], r[1] - 54, 15, done ? "#46e0b0" : "#fff", "center", 800);
        });
        const x = s.x, y = s.y;
        c.strokeStyle = "#2a2a2c"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x - 18, y + 18); c.moveTo(x + 8, y + 2); c.lineTo(x + 18, y + 18); c.stroke();
        c.fillStyle = "#ece6d6"; c.fillRect(x - 11, y - 8, 22, 14);
        c.fillStyle = "#555"; c.fillRect(x - 1.5, y - 30, 3, 22);
        const sp = s.rpm / 2700, bl = 46;
        c.globalAlpha = 0.35 + 0.5 * (1 - sp);
        c.fillStyle = "#333"; c.fillRect(x - bl * Math.abs(Math.cos(s.t * sp * 40)), y - 22, 2 * bl * Math.abs(Math.cos(s.t * sp * 40)), 3); c.fillRect(x - bl * Math.abs(Math.sin(s.t * sp * 40)), y - 29, 2 * bl * Math.abs(Math.sin(s.t * sp * 40)), 3);
        c.globalAlpha = sp * 0.35; c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, y - 25, bl, 4, 0, 0, 7); c.fill(); c.globalAlpha = 1;
        c.fillStyle = "#27406e"; c.fillRect(x - 12, y - 36, 24, 5);
        if (s.rpm > 1500 && y > GY - 60) { c.fillStyle = "rgba(201,139,94,.35)"; c.beginPath(); c.ellipse(x, GY, 30 + (GY - y), 6, 0, 0, 7); c.fill(); }
        c.restore();
        gauge(c, 12, 12, 18, Math.min(130, Hd * 0.28), s.bat / s.bat0, s.bat / s.bat0 < 0.2 ? "#ff5d5d" : "#46e0b0", "BATT");
        const rp = Math.round(s.rpm);
        txt(c, `${rp.toLocaleString()} rpm`, Wd - 12, 22, 16, rp >= 2400 ? "#46e0b0" : "#ffd166", "right", 800);
        txt(c, "hover ≈ 2,400", Wd - 12, 42, 12, "#3a2416", "right", 700);
        txt(c, `FALL ${Math.max(0, Math.round(s.vy))}`, Wd - 12, 62, 13, s.vy > 45 ? "#ff5d5d" : "#3a2416", "right", 800);
      },
      cleanup() { if (s) s.up = s.L = s.R = false; },
    };
  })();

  /* ---------- B. DAWN · Orbit Hopper ---------- */
  (function () {
    const LW = 1000, LH = 640, C = { x: 500, y: 330 }, CR = 62;
    const BANDS = [["Survey orbit", 255, 14, "Survey orbit mapped! Dawn's first full look at Ceres was from about 4,400 km up."], ["HAMO", 178, 11, "HAMO mapped! From about 1,470 km, Dawn made 3D maps of Ceres's craters."], ["LAMO", 108, 9, "LAMO mapped! From about 385 km, Dawn measured what the surface is made of."]];
    let s = null;
    const reset = () => { s.r = 330; s.dr = 0; s.band = 0; s.holdT = 0; s.hyd = s.hyd0; s.low = s.high = false; };
    G.daw = {
      title: "Orbit Hopper", mission: "Dawn · Ceres", icon: "🌅", bg: SPACEBG,
      tagline: "Dawn's ion engine pushed about as hard as a sheet of paper resting on your hand, but it could push for months. Spiral down into 3 mapping orbits around the dwarf planet Ceres.",
      how: [["⬇", "Hold <b>▼ LOWER</b> to spiral down. <b>▲ RAISE</b> pushes you back out. The push is gentle, so start slowing early."], ["🎯", "Stay inside each glowing band for <b>2 seconds</b> to map it: Survey → HAMO → LAMO."], ["💧", "Every burn you start uses a puff of <b>hydrazine</b> to turn the spacecraft. Run out and the mission ends, as the real Dawn's did in 2018."]],
      sci: "<b>The real thing:</b> Dawn's xenon ion engines gave the gentlest push of any spacecraft, but over 11 years they changed its speed by about 11 km/s. It orbited Vesta, then Ceres, lowering itself orbit by orbit. Its mission ended on November 1, 2018, when the hydrazine for its pointing thrusters ran out.",
      photo: { src: art("daw"), cap: "Dawn with its long solar wings above Ceres (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        return ["Hold LOWER for a short while, then let go. You'll keep drifting inward: that's momentum.", "To stop inside a band, give a short RAISE burn just before you reach it.", "Each new burn costs a drop of hydrazine. Fewer, longer burns save fuel.", "Watch the DRIFT number. Under 6 means you're steady enough to map."][Math.min(l, 3)];
      },
      init(api) {
        const e = ME.ease();
        s = { api, hyd0: Math.round(9 * e), t: 0, ang: 0, stT: 0, trail: [] };
        reset();
        api.ctrls(`<button type="button" class="rq-btn primary" data-hold="low" style="min-width:140px;touch-action:none">▼ LOWER</button><button type="button" data-hold="high" style="min-width:140px;touch-action:none">▲ RAISE</button>`);
      },
      hold(c, v) {
        if (!s || (c !== "low" && c !== "high")) return;
        if (v && !s[c]) {
          if (s.hyd <= 0) { s.api.fail("💧 No hydrazine left to turn the spacecraft. That's exactly how the real Dawn's mission ended. Starting over."); reset(); return; }
          s.hyd--;
        }
        s[c] = v;
      },
      key(code, down) {
        if (!s) return false;
        if (code === "ArrowDown" || code === "KeyS") { this.hold("low", down); return true; }
        if (code === "ArrowUp" || code === "KeyW") { this.hold("high", down); return true; }
        return false;
      },
      update(dt, api) {
        s.t += dt;
        const acc = ((s.high ? 1 : 0) - (s.low ? 1 : 0)) * 10;
        s.dr = clamp((s.dr + acc * dt) * (1 - 0.05 * dt), -40, 40);
        s.r += s.dr * dt;
        if (s.r > 380) { s.r = 380; s.dr = Math.min(0, s.dr); }
        if (s.r < CR + 18) { api.fail("Too low! Dawn would have hit Ceres. Start slowing your descent earlier."); reset(); return; }
        s.ang += 0.55 * Math.pow(250 / s.r, 1.5) * dt;
        const b = BANDS[s.band];
        if (b && Math.abs(s.r - b[1]) < b[2] && Math.abs(s.dr) < 6) s.holdT += dt; else s.holdT = Math.max(0, s.holdT - dt * 2);
        if (b && s.holdT >= 2) {
          s.band++; s.holdT = 0; sfx().good(); api.toast("🗺 " + b[3], "good");
          if (s.band >= BANDS.length) {
            const left = s.hyd / s.hyd0, st = left >= 0.45 && api.fails === 0 ? 3 : left >= 0.2 ? 2 : 1;
            s.low = s.high = false;
            api.win({ stars: st, line: `All 3 mapping orbits complete with ${s.hyd} hydrazine puffs to spare.`, summary: `${ME.name()} spiralled Dawn down through Survey, HAMO and LAMO orbits around Ceres with a gentle ion engine.` });
            return;
          }
        }
        if (Math.floor(s.t * 20) % 2 === 0) { s.trail.push([s.r, s.ang]); if (s.trail.length > 90) s.trail.shift(); }
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>💧 ${s.hyd}/${s.hyd0}</span><span>🗺 ${s.band}/3</span><span>↕ drift ${Math.abs(s.dr).toFixed(1)}</span>`); }
      },
      draw(c, api) {
        const Wd = api.W, Hd = api.H, f = fit(api, LW, LH);
        space(c, Wd, Hd, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        BANDS.forEach((b, i) => {
          const done = i < s.band, cur = i === s.band;
          c.strokeStyle = done ? "rgba(70,224,176,.55)" : cur ? `rgba(255,209,102,${0.25 + 0.15 * Math.sin(s.t * 4)})` : "rgba(255,255,255,.08)";
          c.lineWidth = b[2] * 2; c.beginPath(); c.arc(C.x, C.y, b[1], 0, 7); c.stroke();
          txt(c, (done ? "✓ " : "") + b[0], C.x + b[1] * 0.71 + 8, C.y - b[1] * 0.71 - 8, 13, done ? "#46e0b0" : cur ? "#ffd166" : "#6c778a", "left", 800);
        });
        const cg = c.createRadialGradient(C.x - 20, C.y - 20, 8, C.x, C.y, CR); cg.addColorStop(0, "#8b8781"); cg.addColorStop(1, "#4a4744");
        c.fillStyle = cg; c.beginPath(); c.arc(C.x, C.y, CR, 0, 7); c.fill();
        c.fillStyle = "#3f3c39"; [[-20, 15, 9], [18, -22, 7], [25, 20, 11]].forEach((k) => { c.beginPath(); c.arc(C.x + k[0], C.y + k[1], k[2], 0, 7); c.fill(); });
        c.fillStyle = "#f6f3ea"; c.beginPath(); c.arc(C.x - 6, C.y - 12, 3.5, 0, 7); c.fill();
        txt(c, "CERES", C.x, C.y + CR + 16, 12, "#9aa7bb", "center", 800);
        c.fillStyle = "rgba(127,178,255,.5)"; s.trail.forEach((p) => c.fillRect(C.x + Math.cos(p[1]) * p[0] - 1, C.y + Math.sin(p[1]) * p[0] - 1, 2, 2));
        const x = C.x + Math.cos(s.ang) * s.r, y = C.y + Math.sin(s.ang) * s.r;
        c.save(); c.translate(x, y); c.rotate(s.ang);
        if (s.low || s.high) { c.fillStyle = `rgba(95,182,255,${0.5 + Math.random() * 0.3})`; c.beginPath(); const d = s.low ? 1 : -1; c.moveTo(0, -4 * d); c.lineTo(-4, 24 * d); c.lineTo(4, 24 * d); c.fill(); }
        c.fillStyle = "#27406e"; c.fillRect(-32, -3, 24, 6); c.fillRect(8, -3, 24, 6);
        c.fillStyle = "#c9a24a"; c.fillRect(-7, -7, 14, 14);
        c.restore();
        c.restore();
        const b = BANDS[s.band];
        if (b) { rr(c, 12, Hd - 34, 160, 14, 6); c.fillStyle = "#0b111c"; c.fill(); rr(c, 14, Hd - 32, 156 * clamp(s.holdT / 2, 0, 1), 10, 5); c.fillStyle = "#ffd166"; c.fill(); txt(c, "MAPPING " + b[0].toUpperCase(), 12, Hd - 44, 11, "#9aa7bb", "left", 800); }
        for (let i = 0; i < s.hyd0; i++) { c.fillStyle = i < s.hyd ? "#7fb2ff" : "#222a38"; c.beginPath(); c.arc(20 + i * 16, 22, 6, 0, 7); c.fill(); }
        txt(c, "HYDRAZINE", 14, 42, 11, "#9aa7bb", "left", 800);
      },
      cleanup() { if (s) s.low = s.high = false; },
    };
  })();

  /* ---------- C. NEAR SHOEMAKER · Soft Touch on Eros ---------- */
  (function () {
    const LW = 1000, LH = 640, GY = 560, GRV = 2.2;
    let s = null;
    const alt = () => Math.max(0, Math.round((GY - 24 - s.y) * 12));
    const reset = () => { s.y = 70; s.vy = 32; s.fuel = s.fuel0; s.photos = []; s.lastAlt = 1e9; s.brake = false; };
    G.nea = {
      title: "Soft Touch on Eros", mission: "NEAR Shoemaker · 433 Eros", icon: "🪨", bg: SPACEBG,
      tagline: "NEAR Shoemaker was built to orbit, not land. Drift it down onto the asteroid Eros slower than walking pace, snapping photos on the way.",
      how: [["🛑", "Hold <b>BRAKE</b> (or ↑ / Space) to fire the thrusters and slow down."], ["📸", "Tap <b>SNAP</b> (or P) to take photos as you fall. Each one needs a new height."], ["🪶", "Touch down under <b>2.0 m/s</b>. Eros's gravity is tiny, so going too fast means bouncing off."]],
      sci: "<b>The real thing:</b> On February 12, 2001, after a year in orbit, NEAR Shoemaker made a series of braking burns and touched down on Eros at about 1.5–1.8 m/s. It sent 69 pictures on the way down, the last from about 120 m, and kept sending data until February 28.",
      photo: { src: art("nea"), cap: "NEAR Shoemaker descending to asteroid Eros (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        return ["Snap a photo every time the altitude drops another few hundred metres.", "Eros's gravity is tiny, but you're already falling at 3.2 m/s. Brake in short bursts.", "Watch SPEED: keep it under 2.0 m/s just before touchdown.", "Save some fuel for the last 1,000 m."][Math.min(l, 3)];
      },
      init(api) {
        const e = ME.ease();
        s = { api, fuel0: 100 * e, t: 0, stT: 0, flash: 0 };
        reset();
        api.ctrls(`<button type="button" class="rq-btn primary" data-hold="B" style="min-width:150px;touch-action:none">🛑 BRAKE</button><button type="button" data-c="SNAP" style="min-width:120px">📸 SNAP</button>`);
      },
      hold(c, v) { if (s && c === "B") s.brake = v; },
      key(code, down) {
        if (!s) return false;
        if (code === "ArrowUp" || code === "KeyW" || code === "Space") { s.brake = down; return true; }
        if (code === "KeyP" && down) { this.ctrl("SNAP"); return true; }
        return false;
      },
      ctrl(c) {
        if (!s || c !== "SNAP") return;
        const a = alt();
        if (s.lastAlt - a < 350) { s.api.toast("Too close to your last photo. Descend a bit more first."); return; }
        s.photos.push(a); s.lastAlt = a; s.flash = 0.25; sfx().click();
        s.api.toast(`📸 Photo ${s.photos.length} from ${a.toLocaleString()} m${a < 400 ? " · a close-up!" : ""}`, "good");
      },
      update(dt, api) {
        s.t += dt; s.flash = Math.max(0, s.flash - dt);
        const f = s.fuel > 0 && s.brake;
        s.vy += (GRV - (f ? 14 : 0)) * dt;
        if (f) s.fuel = Math.max(0, s.fuel - 12 * dt);
        if (s.vy < -10) s.vy = -10;
        s.y += s.vy * dt;
        if (s.y < 40) { s.y = 40; s.vy = Math.max(0, s.vy); }
        if (s.y >= GY - 24) {
          s.y = GY - 24;
          const v = s.vy / 10;
          if (v > 2) { api.fail(`💥 Touchdown at ${v.toFixed(1)} m/s. In Eros's tiny gravity NEAR would bounce off or break. The real one landed at about 1.6 m/s.`); reset(); return; }
          const n = s.photos.length, st = n >= 5 && api.fails === 0 ? 3 : n >= 3 ? 2 : 1;
          s.brake = false;
          api.win({ stars: st, line: `Touchdown at ${v.toFixed(1)} m/s with ${n} photos on the way down.`, summary: `${ME.name()} landed NEAR Shoemaker on Eros at ${v.toFixed(1)} m/s and took ${n} descent photos. The real NEAR took 69.` });
          return;
        }
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>⛽ ${Math.round((s.fuel / s.fuel0) * 100)}%</span><span>📏 ${alt().toLocaleString()} m</span><span>📸 ${s.photos.length}</span>`); }
      },
      draw(c, api) {
        const Wd = api.W, Hd = api.H, f = fit(api, LW, LH);
        space(c, Wd, Hd, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        c.fillStyle = "#7d6a52"; c.beginPath(); c.moveTo(0, LH); c.lineTo(0, GY + 20); for (let x = 0; x <= LW; x += 40) c.lineTo(x, GY + Math.sin(x * 0.013) * 14 + Math.sin(x * 0.051) * 5); c.lineTo(LW, LH); c.fill();
        c.fillStyle = "#5f503d"; [[180, 18], [330, 9], [640, 22], [820, 12]].forEach((b) => { c.beginPath(); c.ellipse(b[0], GY + 6, b[1], b[1] * 0.55, 0, 0, 7); c.fill(); });
        txt(c, "433 EROS", 60, GY + 50, 13, "#d9c7a8", "left", 800);
        const x = LW / 2, y = s.y;
        if (s.brake && s.fuel > 0) { c.fillStyle = `rgba(255,${170 + Math.random() * 60},80,.9)`; c.beginPath(); c.moveTo(x - 6, y + 16); c.lineTo(x, y + 34 + Math.random() * 10); c.lineTo(x + 6, y + 16); c.fill(); }
        c.fillStyle = "#27406e"; c.fillRect(x - 52, y - 4, 32, 10); c.fillRect(x + 20, y - 4, 32, 10);
        c.fillStyle = "#c9a24a"; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 16); } c.fill();
        c.fillStyle = "#e9edf2"; c.beginPath(); c.ellipse(x, y - 18, 16, 6, 0, Math.PI, 0); c.fill();
        c.restore();
        if (s.flash > 0) { c.fillStyle = `rgba(255,255,255,${s.flash * 2})`; c.fillRect(0, 0, Wd, Hd); }
        gauge(c, 12, 12, 18, Math.min(130, Hd * 0.28), s.fuel / s.fuel0, s.fuel / s.fuel0 < 0.2 ? "#ff5d5d" : "#ffb36b", "FUEL");
        const v = s.vy / 10;
        txt(c, `SPEED ${Math.max(0, v).toFixed(1)} m/s`, Wd - 12, 22, 15, v > 2 ? "#ff5d5d" : "#46e0b0", "right", 800);
        txt(c, `ALT ${alt().toLocaleString()} m`, Wd - 12, 44, 13, "#9aa7bb", "right", 700);
        txt(c, `PHOTOS ${s.photos.length}`, Wd - 12, 64, 13, "#ffd166", "right", 700);
      },
      cleanup() { if (s) s.brake = false; },
    };
  })();

  /* ---------- D. PIONEER 10 & 11 · Slingshot ---------- */
  (function () {
    const LW = 1000, LH = 640, GM = 1.1e6, V0 = 230, E = { x: 80, y: 430 }, JX = 600, JV = 70, JR = 30, SAT = { x: 870, y: 130, r: 90 };
    let s = null;
    const jy = (t) => LH + 80 - ((t * JV) % (LH + 160));
    function stepP(p, dt) {
      const dx = JX - p.x, dy = jy(p.t) - p.y, d = Math.hypot(dx, dy);
      const a = GM / Math.max(d * d, 900);
      p.vx += (a * dx) / d * dt; p.vy += (a * dy) / d * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
      return d;
    }
    const out = (p) => p.x > LW + 20 || p.x < -20 || p.y < -20 || p.y > LH + 20;
    const launchP = () => ({ x: E.x, y: E.y, vx: V0 * Math.cos(s.ang), vy: -V0 * Math.sin(s.ang), t: s.t });
    G.pio = {
      title: "Slingshot", mission: "Pioneer 10 & 11", icon: "📡", bg: SPACEBG,
      tagline: "The Pioneers didn't have the fuel to leave the solar system on their own. Aim and time your launch so you swing past moving Jupiter and get flung onward.",
      how: [["🎯", "Tap <b>◀ ▶</b> (or ← →) to aim. The dotted line shows your predicted path."], ["🚀", "Press <b>LAUNCH</b> (or Space) when Jupiter is in the right place. Pass just <b>behind</b> it as it moves."], ["🪐", "Round 1: Pioneer 10 escapes faster. Round 2: Pioneer 11 swings on to <b>Saturn</b>."]],
      sci: "<b>The real thing:</b> Pioneer 10 flew past Jupiter in December 1973, and the planet's gravity flung it fast enough to escape the solar system. Pioneer 11 used its 1974 Jupiter flyby to bend its path toward Saturn, which it reached in 1979, the first spacecraft ever to visit.",
      photo: { src: art("pio"), cap: "A Pioneer spacecraft swinging past Jupiter (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        return ["Watch Jupiter move up the screen. You want to cross its path just after it passes, behind it.", "If you crash into Jupiter, launch a little later or aim a little lower.", "If you pass too far away, there's no boost. Aim closer to Jupiter's path.", "For Saturn, try aiming slightly lower and launching as Jupiter rises toward the middle."][Math.min(l, 3)];
      },
      init(api) {
        s = { api, t: 0, round: 1, ang: 0.1, p: null, minJ: 1e9, trail: [], stT: 0, prevT: 1 };
        s.prevT = { explorer: 1, scientist: 0.45, engineer: 0.18 }[ME.tier()] || 0.45;
        this.ui();
      },
      ui() { s.api.ctrls(`<button type="button" data-c="L" aria-label="Aim up" style="min-width:70px">◀</button><button type="button" class="rq-btn primary" data-c="GO" style="min-width:150px">🚀 LAUNCH</button><button type="button" data-c="R" aria-label="Aim down" style="min-width:70px">▶</button>`); },
      ctrl(c) {
        if (!s || s.p) return;
        if (c === "L") s.ang = clamp(s.ang + 0.04, -0.6, 0.6);
        if (c === "R") s.ang = clamp(s.ang - 0.04, -0.6, 0.6);
        if (c === "GO") { s.p = launchP(); s.minJ = 1e9; s.trail = []; s.hitS = false; sfx().click(); }
      },
      key(code, down) {
        if (!s || !down) return false;
        if (code === "ArrowLeft" || code === "ArrowUp") { this.ctrl("L"); return true; }
        if (code === "ArrowRight" || code === "ArrowDown") { this.ctrl("R"); return true; }
        if (code === "Space" || code === "Enter") { this.ctrl("GO"); return true; }
        return false;
      },
      update(dt, api) {
        s.t += dt;
        if (s.p) {
          for (let i = 0; i < 2; i++) {
            const d = stepP(s.p, dt / 2);
            s.minJ = Math.min(s.minJ, d);
            if (d < JR) { api.fail("💥 Crashed into Jupiter! Launch a little later, or aim a little further away."); s.p = null; return; }
            if (s.round === 2 && Math.hypot(s.p.x - SAT.x, s.p.y - SAT.y) < SAT.r) s.hitS = true;
          }
          if (Math.floor(s.t * 30) % 2 === 0) s.trail.push([s.p.x, s.p.y]);
          const sp = Math.hypot(s.p.vx, s.p.vy), boosted = s.minJ < 170 && sp > V0 * 1.12;
          if (s.round === 2 && s.hitS) {
            if (boosted) { s.p = null; sfx().win(); api.win({ stars: stars3(api.fails), line: "Pioneer 10 escaped, and Pioneer 11 reached Saturn, both thanks to Jupiter.", summary: `${ME.name()} used Jupiter's gravity to fling Pioneer 10 out of the solar system and swing Pioneer 11 on to Saturn.` }); return; }
            api.fail("You reached Saturn's orbit, but without Jupiter's boost the real trip would have taken far longer. Swing past Jupiter first."); s.p = null; return;
          }
          if (out(s.p)) {
            const p = s.p; s.p = null;
            if (s.minJ >= 170) { api.fail("Too far from Jupiter: no slingshot. Aim so you pass just behind it."); return; }
            if (!boosted) { api.fail("You passed in front of Jupiter, and it slowed you down. Cross its path just after it goes by."); return; }
            if (s.round === 1) { s.round = 2; sfx().good(); api.toast(`🚀 Pioneer 10 flung out at ${Math.round((Math.hypot(p.vx, p.vy) / V0) * 100)}% of its launch speed! Now Pioneer 11: swing on to Saturn.`, "good"); return; }
            api.fail("Boosted, but you missed Saturn. Adjust your aim a little.");
          }
        }
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.15; api.stat(`<span>${s.round === 1 ? "🚀 Pioneer 10" : "🪐 Pioneer 11"}</span><span>🎯 ${Math.round((s.ang * 180) / Math.PI)}°</span>${s.p ? `<span>💨 ${Math.round((Math.hypot(s.p.vx, s.p.vy) / V0) * 100)}%</span>` : ""}`); }
      },
      draw(c, api) {
        const Wd = api.W, Hd = api.H, f = fit(api, LW, LH);
        space(c, Wd, Hd, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        c.strokeStyle = "rgba(217,165,107,.18)"; c.setLineDash([4, 8]); c.beginPath(); c.moveTo(JX, 0); c.lineTo(JX, LH); c.stroke(); c.setLineDash([]);
        const y = jy(s.t);
        c.fillStyle = "rgba(255,209,102,.06)"; c.beginPath(); c.arc(JX, y, 170, 0, 7); c.fill();
        const jg = c.createRadialGradient(JX - 8, y - 8, 4, JX, y, JR); jg.addColorStop(0, "#f0c792"); jg.addColorStop(1, "#b9824c");
        c.fillStyle = jg; c.beginPath(); c.arc(JX, y, JR, 0, 7); c.fill();
        c.strokeStyle = "#a8743f"; c.lineWidth = 3; c.beginPath(); c.moveTo(JX - 26, y - 6); c.lineTo(JX + 26, y - 6); c.moveTo(JX - 28, y + 8); c.lineTo(JX + 28, y + 8); c.stroke();
        txt(c, "JUPITER ↑", JX + 40, y, 12, "#f0c792", "left", 800);
        if (s.round === 2) {
          c.fillStyle = "rgba(255,209,102,.08)"; c.beginPath(); c.arc(SAT.x, SAT.y, SAT.r, 0, 7); c.fill();
          c.fillStyle = "#e3c88f"; c.beginPath(); c.arc(SAT.x, SAT.y, 20, 0, 7); c.fill();
          c.strokeStyle = "#cdb27a"; c.lineWidth = 3; c.beginPath(); c.ellipse(SAT.x, SAT.y, 36, 9, -0.3, 0, 7); c.stroke();
          txt(c, "SATURN", SAT.x, SAT.y + 36, 12, "#e3c88f", "center", 800);
        }
        c.fillStyle = "#2c6fb5"; c.beginPath(); c.arc(E.x, E.y, 18, 0, 7); c.fill();
        txt(c, "EARTH", E.x, E.y + 32, 12, "#9fc3ee", "center", 800);
        if (!s.p) {
          const p = launchP(), steps = Math.round(260 * s.prevT);
          c.fillStyle = "rgba(255,255,255,.55)";
          for (let i = 0; i < steps; i++) { stepP(p, 1 / 60); if (i % 4 === 0) c.fillRect(p.x - 1, p.y - 1, 2.4, 2.4); if (out(p)) break; }
        }
        c.fillStyle = "rgba(255,209,102,.7)"; s.trail.forEach((q) => c.fillRect(q[0] - 1, q[1] - 1, 2, 2));
        if (s.p) { c.fillStyle = "#fff"; c.beginPath(); c.arc(s.p.x, s.p.y, 4.5, 0, 7); c.fill(); }
        c.restore();
      },
    };
  })();

  /* ---------- E. KEPLER · Transit Hunter ---------- */
  (function () {
    const LW = 1000, LH = 640, PPS = 130, MARK = 760, BASE = 300;
    let s = null;
    const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
    function transitK(t) { const k = Math.floor((t - s.off) / s.P), ph = t - s.off - k * s.P; return { k, ph }; }
    function dip(t) {
      let d = 0;
      const { k, ph } = transitK(t);
      if (k >= 0 && ph >= 0 && ph < s.dur) d += s.depth * Math.min(1, ph / 0.08, (s.dur - ph) / 0.08);
      for (const b of s.blips) { const u = Math.abs(t - b) / 0.09; if (u < 1) d += s.depth * 0.95 * (1 - u); }
      return d + (hash(Math.floor(t * 40)) - 0.5) * s.jit;
    }
    G.kep = {
      title: "Transit Hunter", mission: "Kepler Space Telescope", icon: "🔭", bg: SPACEBG,
      tagline: "Kepler found planets by watching stars blink. A planet passing in front makes a small, flat-bottomed dip that repeats on schedule. Catch 3 real transits and ignore the noise.",
      how: [["⏱", "The star's brightness scrolls past. When a dip crosses the <b>marker line</b>, tap <b>MARK DIP</b> (or Space, or tap the screen)."], ["📉", "Real transits are <b>wide and flat-bottomed</b> and come back on a regular beat. Quick, pointy blips are noise."], ["🪐", "Then compare two stars and decide which planet is bigger."]],
      sci: "<b>The real thing:</b> From 2009 to 2018, Kepler measured the brightness of about 150,000 stars, looking for tiny repeating dips called transits. An Earth-sized planet dims a Sun-like star by only about 0.01%. Kepler and its K2 mission confirmed more than 2,600 planets.",
      photo: { src: art("kep"), cap: "The Kepler Space Telescope and a transit light curve (not to scale)", label: "AI-assisted illustration" },
      hintFor(l) {
        if (s && s.phase === "cmp") return ["Both stars are the same size. A bigger planet blocks more light.", "Look at how deep each dip goes, not how wide it is.", "The deeper dip belongs to the bigger planet."][Math.min(l, 2)];
        return ["Wait for a wide dip with a flat bottom, then tap as it reaches the marker line.", "Pointy little blips that vanish fast are noise. Don't tap those.", "Real transits repeat on a steady beat. Once you've caught one, the next comes after the same gap.", "Tap while the flat bottom of the dip is on the marker."][Math.min(l, 3)];
      },
      init(api) {
        const tier = ME.tier();
        s = { api, t: 0, phase: "hunt", found: 0, P: 3.4, dur: 0.6, off: 2.2, marked: {}, stT: 0, flash: 0, depth: { explorer: 46, scientist: 38, engineer: 30 }[tier] || 38, jit: { explorer: 5, scientist: 7, engineer: 9 }[tier] || 7, blips: [] };
        for (let t = 1.2; t < 120; t += 1.6 + hash(t) * 1.8) { const { ph } = transitK(t); if (ph > s.dur + 0.4 && ph < s.P - 0.4) s.blips.push(t); }
        api.ctrls(`<button type="button" class="rq-btn primary" data-c="MARK" style="min-width:180px">📍 MARK DIP</button>`);
      },
      down() { if (s && s.phase === "hunt") this.ctrl("MARK"); },
      key(code, down) { if (s && down && code === "Space") { this.ctrl(s.phase === "hunt" ? "MARK" : ""); return true; } return false; },
      ctrl(c, b) {
        if (!s) return;
        if (s.phase === "hunt" && c === "MARK") {
          const { k, ph } = transitK(s.t);
          if (k >= 0 && ph > -0.15 && ph < s.dur + 0.15) {
            if (s.marked[k]) { s.api.toast("You already marked this transit. Wait for the next one."); return; }
            s.marked[k] = 1; s.found++; s.flash = 0.4; sfx().good();
            if (s.found >= 3) {
              s.phase = "cmp";
              s.api.toast("✅ 3 transits on a steady beat: that's a planet! Now compare two more stars.", "good");
              s.cmp = shuffle([[24, "small"], [52, "big"]]);
              s.api.ctrls(`<button type="button" data-c="A" style="flex:1 1 160px">Star A's planet</button><button type="button" data-c="B" style="flex:1 1 160px">Star B's planet</button>`);
              return;
            }
            s.api.toast(`🪐 Transit ${s.found} of 3! ${s.found === 1 ? "Will it repeat?" : `Same gap again: about ${s.P.toFixed(1)} s. It's on schedule.`}`, "good");
            return;
          }
          const blip = s.blips.some((bt) => Math.abs(s.t - bt) < 0.2);
          s.api.fail(blip ? "That was a quick, pointy blip: noise, not a planet. Real transits are wide and flat-bottomed." : "No dip at the marker right now. Tap when a dip crosses the line.");
          return;
        }
        if (s.phase === "cmp" && (c === "A" || c === "B")) {
          const pick = s.cmp[c === "A" ? 0 : 1];
          if (b) b.disabled = true;
          if (pick[1] === "big") {
            s.api.win({ stars: stars3(s.api.fails), line: "3 transits caught, and you sized up the planets like Kepler's team.", summary: `${ME.name()} found a planet from 3 repeating transits, then picked the bigger planet from the deeper dip.` });
          } else s.api.fail("That's the shallower dip. A bigger planet blocks more starlight, so its dip is deeper.");
        }
      },
      update(dt, api) {
        s.t += dt; s.flash = Math.max(0, s.flash - dt);
        s.stT -= dt;
        if (s.stT <= 0) { s.stT = 0.2; api.stat(s.phase === "hunt" ? `<span>🪐 Transits ${s.found}/3</span>` : "<span>📏 Which planet is bigger?</span>"); }
      },
      draw(c, api) {
        const Wd = api.W, Hd = api.H, f = fit(api, LW, LH);
        space(c, Wd, Hd, s.t);
        c.save(); c.translate(f.ox, f.oy); c.scale(f.s, f.s);
        rr(c, 40, 80, LW - 80, 420, 14); c.fillStyle = "rgba(10,16,28,.85)"; c.fill(); c.strokeStyle = "#26324a"; c.lineWidth = 2; c.stroke();
        if (s.phase === "hunt") {
          txt(c, "STAR BRIGHTNESS", 60, 104, 13, "#9aa7bb", "left", 800);
          txt(c, "time →", LW - 60, 480, 12, "#6c778a", "right", 700);
          c.strokeStyle = "#b48cff"; c.lineWidth = 2.5; c.beginPath();
          for (let x = 60; x <= LW - 60; x += 3) {
            const tt = s.t + (x - MARK) / PPS, y = BASE + dip(tt);
            if (x === 60) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.stroke();
          c.fillStyle = "rgba(5,8,14,.72)"; c.fillRect(MARK + 70, 82, LW - 42 - MARK - 70, 416);
          c.strokeStyle = s.flash > 0 ? "#46e0b0" : "#ffd166"; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(MARK, 120); c.lineTo(MARK, 470); c.stroke(); c.setLineDash([]);
          txt(c, "MARKER", MARK, 128 - 14, 12, "#ffd166", "center", 800);
          Object.keys(s.marked).forEach((k) => { const tt = s.off + k * s.P + s.dur / 2, x = MARK + (tt - s.t) * PPS; if (x > 50 && x < MARK + 70) txt(c, "🪐", x, BASE + s.depth + 34, 18, "#fff", "center"); });
        } else {
          [["STAR A", 0], ["STAR B", 1]].forEach(([lab, i]) => {
            const y0 = 170 + i * 180, dd = s.cmp[i][0] * (s.depth / 38);
            txt(c, lab, 70, y0 - 50, 15, "#eef2f8", "left", 800);
            c.strokeStyle = i ? "#7fb2ff" : "#b48cff"; c.lineWidth = 2.5; c.beginPath();
            for (let x = 160; x <= LW - 80; x += 3) { const u = (x - 160) / (LW - 240), inT = u > 0.42 && u < 0.58, e = inT ? Math.min(1, (u - 0.42) / 0.03, (0.58 - u) / 0.03) : 0, y = y0 + e * dd + (hash(x + i * 999) - 0.5) * 4; if (x === 160) c.moveTo(x, y); else c.lineTo(x, y); }
            c.stroke();
          });
          txt(c, "Both stars are the same size. Which one has the bigger planet?", LW / 2, 470, 16, "#ffd166", "center", 800);
        }
        c.restore();
      },
    };
  })();

  RQ.site.add("mars", SITES);
})();
