# Luma Desk

Pablo's church lighting studio, transferred into a standalone development folder on October 13, 2026. This package preserves the latest working HTML prototype, including the left Effects studio panel.

## Open in Codex

1. Open this `luma-desk-codex` folder as a local project in Codex.
2. Paste the contents of `START-HERE.md` into a new task.

The handoff is in `docs/HANDOFF.md`. The folder contains the app and its tests; it does not depend on the original ChatGPT workspace.

## Run the current app

Open `index.html` directly in a browser. It has no external assets or package dependencies.

With Node.js 18 or newer, you can also run:

```sh
npm start
```

Then open `http://127.0.0.1:8770`. The server serves only the preview, binds to loopback, and sends no DMX commands. `PORT=8771 npm start` selects a different port. No `npm install` is necessary.

## Design your space

Choose **Space** above the stage to open the stage designer in the right column. **Done** returns to the light controls.

- **Stage:** choose a rectangular, curved, or thrust platform; slate, wood, or black flooring; room mood; and edge color. Toggle grid lines, object labels, measurements, and object snapping.
- **Optional measurements:** enter stage width, depth, and stage-surface elevation in meters or feet. Enter each light’s mounting height above the room floor. Blank means unspecified; zero means floor level. Switching units converts existing values without changing their stored physical size. **Fit proportions** fits and centers the main platform to the entered width/depth on the current canvas; it does not move the lights.
- **Objects:** add platforms, trusses, speakers, screens, drums, people, lecterns, keyboards, steps, crosses, tables, and rugs. Rename, color, resize, rotate, duplicate, or remove them. Select an object to show four corner handles: drag a corner to resize, or Shift-drag to keep its proportions. The on-canvas action bar provides Duplicate, Rotate (90°), Lock/Unlock, and Delete. Drag the object to move it; Escape cancels an active drag, and clicking blank canvas or pressing Escape again clears the object selection. Arrow keys move a selected object or resize a focused corner; Delete/Backspace removes the focused object. Locked objects cannot be moved, resized, rotated, or deleted until unlocked. Object size and position fields use canvas percentages.
- **Reference:** add a photo, take a photo, or import a Polycam OBJ guide, with opacity and scan-view controls.

Stage dimensions and light heights are optional planning references, not a calibrated 3D lighting model. They do not change DMX output or beam physics. The first platform in the object list is the main stage. Measurements, styles, objects, and light heights are included in **Export** and restored with **Open**; older projects open with measurements unset.

## Quick light actions

Right-click any light on the stage or in the left light list to open its frosted shortcut menu. On a Mac trackpad, use a two-finger click. With a light focused, Shift+F10 opens the same menu; arrow keys navigate and Escape closes it.

- **Adjust light** opens its brightness, color, and supported movement controls.
- **Change light** edits its name, shape, group, channel layout, address, and optional mounting height. **Rename** opens the same editor with its name selected.
- **Duplicate light** creates a separate light at zero intensity, using the first available channel block. It starts off in every saved scene.
- **Move on stage**, **Select its group**, and **Stop effects** provide shortcuts to existing controls.
- **Remove light** asks for confirmation, then removes it from the stage and saved scenes. Keep at least one light in the project.

Actions target the light you clicked. Shape changes preserve its channel layout and running effects. Changing a channel layout removes unsupported effect layers from that light and its scenes. Use **Export** to keep project edits between visits.

## Verify

```sh
npm test
```

The engine tests exercise effects, fades, scenes, patch data, and persistence. The UI tests execute the actual inline scripts against a small DOM shim and cover selection, controls, SVG animation updates, fixture appearance, and the light context menu. Engine checks also cover atomic fixture edits, channel allocation, scene consistency, live fades during duplication/removal, optional physical measurements, unit conversion, and Space object editing. They do not replace a real browser layout or hardware test. The photo decoder is stubbed in this harness.

## Contents

| Path | Purpose |
| --- | --- |
| `index.html` | Current UI and simulation engine; start development here |
| `docs/HANDOFF.md` | User requirements, implemented features, limitations, and proposed next steps |
| `START-HERE.md` | Ready-to-paste first Codex task |
| `tests/` | Existing behavior checks, copied with their source |
| `scripts/serve.cjs` | Dependency-free local preview server |
| `reference/legacy-python/` | Earlier Python backend experiment, separate from the current preview |

The Python reference has an older UI and feature set. It is included to preserve earlier backend work. It is not the current app and is not connected to `index.html`.

Project changes inside the preview are currently kept in memory. Use its **Export** button to keep your scenes and layout. Autosave, undo, real fixture profiles, MIDI, physical DMX integration, and RDM discovery remain development work.
