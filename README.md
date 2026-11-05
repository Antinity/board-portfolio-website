# Antinity — Investigation Board Portfolio

Lakshya Kumar's portfolio as a 3D evidence board in a moonlit room, laid out like a heist
planning board around a poster of the subject, framed in the navy/sage identity of his site. The torch is the cursor; hover a document to highlight it, click to pick it up
and read it — like the notes and letters in Resident Evil or The Last of Us. Links printed on a
page (sites, email, socials) are clickable while it's held up.

- **Drag** to pan · **scroll / pinch** to zoom · **click** a document to read it
- While reading: **Esc** or click outside puts it back · **← / →** previous / next document
- **F** toggles the torch
- `?fx=high | low | off` forces the post-processing quality (auto-detected otherwise)

```bash
npm run dev
```

## Where to edit

| What                                   | File                                         |
| -------------------------------------- | -------------------------------------------- |
| Everything the board says about you    | `src/data/content.js` (works, socials — fill the TODO social links) |
| What's pinned where + red strings      | `src/data/boardLayout.js`                    |
| How a piece of evidence is drawn       | `src/three/painters/*`                       |
| Screen-reader transcripts              | `src/reading/transcripts.jsx`                |
| Torch feel (size, brightness, weight)  | `TORCH` in `src/three/scene/Flashlight.jsx`  |
| Post-processing strengths              | `src/three/scene/PostFX.jsx`                 |

Images live in `public/evidence/`.

## How it works

```
src/
  data/
    content.js        facts (subject, projects, to-dos, experience, witnesses, stack, contact)
    boardLayout.js    SECTIONS (labels), ITEMS (each paper/photo), LINKS (red strings)
  three/
    Experience.jsx    <Canvas>: board, items, strings, targets, torch, camera, post FX
    painters/         canvas-2D painters → textures (dossier, print, todo, crew sheet, flyer…)
    scene/
      BoardSurface    cork (procedural texture + bump) in an aluminium frame
      Item            curled paper + pins / tape; hover overlay; lifts off to be read
      ReadingBackdrop dark veil behind a page being read (click to put it back)
      RedStrings      sagging yarn between two specific items, pinned at both ends
      Flashlight      shadow-casting spotlight through a worn-lens cookie texture
      CameraRig       cover-fit camera, drag / wheel / pinch, intro on the subject
      PostFX          SSAO, depth of field, bloom, motion blur, lens distortion, grain
    effects/          custom motion-blur + lens (barrel + chromatic aberration) effects
  reading/            keyboard handling + screen-reader transcripts for the reading view
  components/         app shell
```

### Adding evidence

1. Add the facts to `content.js`.
2. Add an item to `ITEMS` in `boardLayout.js` (`kind` picks a painter and a transcript;
   positions are in board pixels on a 2800 × 1560 cork, laid out on the `COL` / `ROW` grid).
3. Connect it with a `LINKS` entry if it relates to something else on the board.
4. New kind? Add a painter in `src/three/painters` (register it in `painters/index.js`) and a
   transcript in `src/reading/transcripts.jsx`.
