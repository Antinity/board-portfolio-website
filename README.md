# Antinity — Investigation Board Portfolio

Lakshya Kumar's portfolio as a 3D evidence board in a dark room. A hand-held torch lights the
board; click any cluster of evidence to fly to it and open its case file.

- **Drag** to pan · **scroll / pinch** to zoom · **click** a section to open it
- **1–7** jump to an exhibit · **← / →** step through · **Esc** closes · **F** toggles the torch
- `?fx=high | low | off` forces the post-processing quality (auto-detected otherwise)

```bash
npm run dev
```

## Where to edit

| What                                   | File                                         |
| -------------------------------------- | -------------------------------------------- |
| Everything the board says about you    | `src/data/content.js`                        |
| What's pinned where + red strings      | `src/data/boardLayout.js`                    |
| How a piece of evidence is drawn       | `src/three/painters/*`                       |
| Expanded case-file content             | `src/sections/files.jsx`                     |
| Torch feel (size, brightness, weight)  | `TORCH` in `src/three/scene/Flashlight.jsx`  |
| Post-processing strengths              | `src/three/scene/PostFX.jsx`                 |

Images live in `public/evidence/`.

## How it works

```
src/
  data/
    content.js        facts (subject, projects, to-dos, experience, witnesses, stack, contact)
    boardLayout.js    SECTIONS (click areas), ITEMS (each paper/photo), LINKS (red strings)
  three/
    Experience.jsx    <Canvas>: board, items, strings, targets, torch, camera, post FX
    painters/         canvas-2D painters → textures (dossier, print, todo, crew sheet, flyer…)
    scene/
      BoardSurface    cork (procedural texture + bump) in an aluminium frame
      Item            curled paper mesh + pins / tape
      RedStrings      sagging yarn between two specific items, pinned at both ends
      SectionTargets  invisible click areas + animated red marker loop on hover
      Flashlight      shadow-casting spotlight through a damaged-lens cookie texture
      CameraRig       cover-fit camera, drag / wheel / pinch, flights to sections
      PostFX          SSAO, depth of field, bloom, motion blur, lens distortion, grain
    effects/          custom motion-blur + lens (barrel + chromatic aberration) effects
  sections/           case-file panel content per section
  components/         app shell + case-file panel (HTML, accessible)
```

### Adding evidence

1. Add the facts to `content.js`.
2. Add an item to `ITEMS` in `boardLayout.js` (`kind` picks a painter; positions are in board
   pixels on a 2400 × 1400 cork).
3. Connect it with a `LINKS` entry if it relates to something else on the board.
4. New look? Add a painter in `src/three/painters` and register it in `painters/index.js`.
