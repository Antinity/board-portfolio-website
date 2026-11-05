# Investigation Board Portfolio

A portfolio presented as a detective's evidence board: drag to explore, scroll / pinch to zoom,
click a cluster of evidence to fly to it and open its case file. A hand-held flashlight lights the
room (press **F** to toggle room lights; **1–7** jump to exhibits; **Esc** closes; **← / →** move
between files).

```bash
npm run dev
```

## Where to edit

| What                          | File                                    |
| ----------------------------- | --------------------------------------- |
| All your info (placeholders)  | `src/data/content.js`                   |
| Section positions on board    | `src/data/boardLayout.js`               |
| How a section looks / expands | `src/sections/<section>.jsx`            |
| Flashlight feel (tunables)    | `CONFIG` in `src/components/flashlight/Flashlight.jsx` |

Images: set any `image` field in `content.js` to a path in `/public`; otherwise a generated
placeholder photo is shown.

## Structure

```
src/
  data/            content + board geometry (no UI)
  sections/        one module per exhibit: <Evidence> (on the board) + <File> (expanded view)
  components/
    evidence/      reusable board primitives: BoardItem, Pin, Tape, Polaroid, StickyNote,
                   Paper, IndexCard, Clipping, Blueprint, Stamp, Snapshot...
    board/         Board (camera + surface), Cluster, CaseCard, RedStrings
    case-file/     sliding manila-folder panel + FileParts (blocks for expanded content)
    flashlight/    canvas darkness + beam, film grain
    hud/           title, exhibit index, zoom / light controls
  hooks/
    useBoardCamera.js   pan / zoom / pinch / inertia / animated focus
  lib/panel.js     side-panel width shared by camera framing and CSS
```

### Adding a section

1. Add an entry to `SECTION_LAYOUT` in `src/data/boardLayout.js` (id, exhibit letter, title,
   bounds, string anchor).
2. Create `src/sections/<id>.jsx` exporting `XEvidence` and `XFile`, built from the
   `components/evidence` primitives and `components/case-file/FileParts`.
3. Register both in `src/sections/index.js`.
