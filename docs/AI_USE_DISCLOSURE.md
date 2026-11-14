# Use of Super Intelligence (SI): disclosure

**Project:** RoverQuest: Beyond the Silent Machines
**Team:** Explorers (Egypt)
**Event:** NASA Space Apps Challenge 2026, challenge "Abandoned but not Forgotten"

The NASA Space Apps rules require teams to disclose any use of SI (AI) tools, to watermark SI-generated images and videos, to acknowledge SI-generated code and data in text and metadata, and never to use NASA branding in SI-generated content. This document explains how we did each of these.

## 1. SI tools used

| Tool | Provider | How we used it |
|---|---|---|
| Claude | Anthropic | AI coding and writing assistant inside our code editor and terminal |

> **Team note:** if any team member used another SI tool (for example an image generator or another chatbot), add it to this table and to the "Use of Super Intelligence" field on the project page before submitting.

## 2. What SI helped with

- **Game code:** writing, refactoring and debugging the JavaScript for the 3D worlds, the 14 mini-games, the place registries, the radar, saving progress and the responsive and mobile layout.
- **Procedural 3D models and original illustrations:** the code that builds the low-poly spacecraft models, holograms and characters, and the code that draws the SVG illustrations of Ingenuity, Dawn, NEAR Shoemaker, Pioneer, Kepler and the four Moon sites.
- **Text:** drafting in-game explanations, TARS's dialogue, the README, the project-page text and these documents.
- **Science checking:** cross-checking facts against the NASA sources in `REFERENCES.md`, and helping keep observations, interpretations and teaching simplifications clearly separated.
- **Quality and packaging:** writing the automated checks (`tools/check.mjs`), the release builder, and the script that lays out the 7-slide demo deck (`deck/make_deck.py`).

## 3. What the team did

- Chose the concept, story and audience (ages 10–18) and the missions to include.
- Made the game-design decisions, for example "any 5 of 9 places on Mars", holo-beacons for spacecraft that never went to Mars, and a full Moon world.
- Reviewed and edited the code and text, played and tested the game on desktop and phone-sized screens, and checked the science against NASA sources.
- Made every final decision about what goes into the submission.

## 4. What SI was NOT used for

- **No SI-generated photographs.** Every photograph in the game (32 in total) is a real NASA/JPL image, credited in the game and in `docs/IMAGE_CREDITS.md`.
- **No SI-generated NASA data.** Numbers presented as NASA facts come from the NASA sources listed in `REFERENCES.md`. Where the game uses invented teaching values (for example a simplified seismogram or light curve), it labels them on screen as synthetic or simplified.
- **No people generated.** SI was not used to create any image of a person. The astronaut and TARS are cartoon characters. No images, video or likeness of anyone under 18 appear anywhere. The only real people who may appear are adult engineers in historical NASA photographs.

## 5. Watermarks and labels (visible)

| Content | Visible label |
|---|---|
| Original illustrations in the game (drawn by SI-assisted code) | "AI-assisted illustration" in the picture caption and inside the SVG image itself |
| Ending presentation slides in the game | "AI-assisted illustration · based on NASA records" credit (real photos say "Photo: NASA/JPL-Caltech") |
| 3D models and holograms | labelled in-game as educational approximations or holograms, not NASA hardware photos |
| Demo deck (all 7 slides) | "Made with AI assistance (see AI disclosure)" footer on every slide |
| Screenshots in `screenshots/` | real captures of the running game. They show the in-game labels above. |

We made no videos. If the team records a demo video later, it must carry a visible "Made with AI assistance" watermark if any SI-generated imagery appears in it.

## 6. Metadata acknowledgement (code and files)

- `index.html` and `mars.html`: `<meta name="ai-assistance" content="…">` in the page head.
- `package.json`: the `aiAssistance` field.
- `deck/RoverQuest_Demo.pdf`: the PDF keywords property says "Made with AI assistance (Claude, Anthropic)".
- `deck/RoverQuest_Demo.pptx`: the document comments property records the same.
- `deck/make_deck.py`: the header comment records SI assistance.

## 7. No NASA branding in SI-assisted content

None of the SI-assisted illustrations, 3D models, holograms, slide designs or screenshots contain NASA logos (the "meatball" or the "worm"), insignia, flags or mission patches. Real NASA photographs are shown only with their NASA/JPL credit, and no NASA endorsement is implied.
