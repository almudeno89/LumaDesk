# Luma Design

Pablo's church lighting studio, transferred into a standalone development folder on October 13, 2026. This package preserves the latest working HTML prototype, including the left Effects studio panel.

## Open in Codex

1. Open this `luma-desk-codex` folder as a local project in Codex.
2. Paste the contents of `START-HERE.md` into a new task.

The handoff is in `docs/HANDOFF.md`. The folder contains the app and its tests; it does not depend on the original ChatGPT workspace.

## Run the current app

Open `index.html` directly in a browser, keeping the `assets` folder beside it. The original Luma Design logo is bundled locally; no network assets or package dependencies are required.

With Node.js 18 or newer, you can also run:

```sh
npm start
```

Then open `http://127.0.0.1:8770`. The server serves only the preview and its logo, binds to loopback, and sends no DMX commands. `PORT=8771 npm start` selects a different port. No `npm install` is necessary.

## Preset Library

1. Select lights on the stage, then click **Preset Library**. You can also right-click a light → **Preset Library…**, or use **Find a ready-made look** in Effects studio.
2. Choose a preset: Sunday looks, color flows, moving-head patterns, or brightness rhythms and flashes. The library has 17 ready-made choices, a search box, and a pattern preview. Browsing does not change the stage.
3. Click **Use on … lights**. **Quick edit** in Effects studio adjusts speed, brightness and movement size live. **Customize** offers colors, timing between lights, direction and ease-in; **More effect controls** opens the existing controls for individual layers.
4. Click **Save to scene…** to create a scene or explicitly replace an existing one with the whole current stage, including its animations. Then click the top **Save** button to keep your project in this browser.

Complete Sunday looks replace effects on the compatible selected lights. Color, movement and brightness presets replace only their own effect type, so you can combine them. Unselected and incompatible lights keep their settings. The library uses the channel layouts of fixtures already in the project; it does not automatically discover physical hardware. Movement needs a moving-head channel layout, and color needs color channels. A fixed light drawn with a moving-head shape does not gain motors. Blackout, master intensity and the global effects pause remain under your control.

Preset adjustments are saved as ordinary scene looks and effect settings, so existing Open/Export workflows retain them. The Quick edit card is a session shortcut: after reopening or making advanced edits, continue adjusting the saved effect layers in Effects studio.

## Edit while the stage is live

Live playback stays running while you change lights. **Movement → None / Static** holds the selected moving head at its current aim; its color and brightness effects, and the other lights, keep playing. Manual intensity replaces that light's brightness animation, and a manual color replaces its color animation. Beam controls and new effect settings also take effect during scene transitions without interrupting the other lights.

The scene shows **Edited live** after a change. **Pause / Resume** keeps those changes. **Restart demo** reloads the saved demo settings; clicking any scene recalls that scene's saved settings. To keep your edited version for later scene recall, use **Save look** and choose a new or existing scene, then click the top **Save** button to keep the project in this browser.

## Save your project

Click the blue **Save** button at the top, or press **⌘S** on Mac / **Ctrl+S** on Windows. It saves the entire project in this browser and automatically reopens that save next time you visit the same site. The status shows **Saved in this browser** or **Unsaved changes**. Changes after saving need another Save.

Save does not download a file or upload your lighting project to GitHub. It uses a small amount of storage on this device. It does not sync across browsers/devices, and clearing site data or leaving a private browsing session can remove the save. Use **Export** for a separate backup and **Open** to import one, then Save to retain it here. If browser storage is full or blocked, the app reports failure and keeps the previous save.

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

Actions target the light you clicked. Shape changes preserve its channel layout and running effects. Changing a channel layout removes unsupported effect layers from that light and its scenes. Use **Save** to keep edits in this browser, or **Export** for a separate backup.

**Pinspot bars:** Choose **Fixture shape → Pinspot bar · 6 heads** when adding or changing a light, or from the selected light’s right panel. This horizontal style is inspired by fixtures such as the Chauvet DJ Pinspot Bar, with six spotlight heads. The preview draws a separate beam and landing spot for each of its six lenses. Enable **Aim on stage**, then choose **Aim control → Individual heads** to drag the numbered targets independently, or **Move together** to drag one shared target and shift all six while keeping their spacing. **Target to adjust** isolates a head when spots overlap. **Pinspot lens spread** offers narrow, medium, wide and custom-angle settings for all six heads. The presets are approximate preview widths, not verified included-lens specifications. Multi-lens washes and PARs blend broader, softer beams from their individual lenses. These are illustrative optics using shared fixture controls; they do not install a manufacturer DMX profile or separate hardware channels for each head. Save retains the chosen style.

## Mount and aim lights

Select a light and use **Mounting → Normal / Upside down** in the right inspector. Set **Forward direction** with a degree value, or drag its blue arrow around the light. The same settings are available under **Change light**. Zero degrees points toward the bottom of the stage; 90° points right. Settings apply to the selected lights and are retained by Export/Open and duplication.

For any light, enable **Aim on stage** in the right panel or **More fixture controls**, then drag its target. Fixed-light targets record physical aiming as a stage reference and do not start movement or change DMX channels. Turn the switch off to clear manual targets and restore default aiming. Moving heads return to default pan/tilt and stop their motion pattern; color and brightness keep running. Lens settings, mounting and forward direction stay unchanged. **Reset reference targets** restores default fixed-light aiming. Pinspot bars expose six numbered targets; other fixed shapes use one shared target. Save retains these settings.

For a moving head with **Aim on stage** enabled, drag the **⊕ target** at the beam’s landing point anywhere on the stage. This holds the new aim and stops that head’s motion pattern while leaving color and brightness effects running. Choose **Movement → None / Static** or **Stop** to hold the current aim. Sliders and the aiming pad also take manual control. Use Escape to cancel a stage drag; focused arrows and targets support keyboard arrow keys, with Shift for larger steps.

Drag the heading of **More fixture controls** to move its popup. It stays where you place it during the session, stays inside the viewport, and supports arrow keys when its heading is focused. Double-click the heading to return it beside the light.

These are stage-preview controls. The full-stage aiming map, forward direction, and mounting display are illustrative; they do not calibrate real fixture pan/tilt ranges or enable physical hardware output. Existing scene channel values stay intact, but their beam positions in the preview now use the full stage. Save your project to retain the light settings and static aims in this browser.

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

Project changes stay in memory until you click **Save** (this browser) or **Export** (downloaded backup). Autosave, undo, real fixture profiles, MIDI, physical DMX integration, and RDM discovery remain development work.
