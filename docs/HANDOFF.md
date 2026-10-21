# Luma Design development handoff

Prepared October 13, 2026 from the latest `Luma-Desk-Preview.html` (saved version 6). The initial `index.html` was an exact copy of that file; subsequent changes are recorded in Git. This is a project handoff, not a completed migration to a framework or desktop runtime.

## Product name · October 17, 2026

The app is now named **Luma Design**. The header, browser title, import error, export filename and current development metadata use this name. Keep the GitHub repository/Pages URL, `luma-desk-v1`/`luma-desk-v2` format IDs and `luma-desk.saved-project.v1` storage key unchanged so existing links and projects continue working. The original black-and-gold LD logo was supplied in `LumaDesign Logo3.png.zip`. Its exact transparent PNG is stored at `assets/luma-design-logo.png` and used for the header, browser-tab icon and Apple touch icon. Preserve the original artwork. Asset links are relative to support GitHub Pages under `/LumaDesk/` and direct file opening. The preview server explicitly allows this PNG route alongside the HTML.

## Product intent

Pablo is building a clean, approachable church lighting application. He asked for an Apple-inspired interface and wants to see the stage respond live while adjusting controls. Keep the current design; he has repeatedly approved it and requested specific additions.

On October 17, 2026, Pablo explicitly approved the version with the per-light iOS-style context menu as the official Luma Desk baseline. The approved application is commit [`2352669`](https://github.com/almudeno89/LumaDesk/commit/2352669b597f43b0b9e81a2a5647ce090b4c91f4), published at https://almudeno89.github.io/LumaDesk/. Future updates should build on this version and preserve its approved menu, layout, and interactions unless Pablo requests a change. This approval establishes the product baseline; the hardware and persistence work listed below remains incomplete.

An earlier completed request moved Effects studio from below the stage to its own left column because the right-hand inspector obscured the previous layout while scrolling. The left panel now has independent scrolling, a fixed header, and an always-visible action footer. The center holds the stage and scenes, with color and movement controls on the right. Responsive layouts use fewer columns at narrower widths.

## Live edits during demo and scene playback · October 21, 2026

Reproducing the reported Static issue showed that `aim` already stopped only the selected motion layer, but clearing `active_scene` replaced the demo label with Custom look. The unchanged Live demo button also re-cued the saved demo and discarded live edits. Separately, manual intensity was still being multiplied by its running dimmer effect, and some live edits cancelled the entire scene fade.

Runtime `liveScene` now retains the last cued scene independently of exact saved-state `active`. Snapshots expose `live_scene` and `scene_edited`; the scene card/footer show Edited live and the loaded demo button reads Restart demo with an explanatory tooltip. Pause/Resume preserves edits. Explicit scene recall reloads saved settings. Updating the currently loaded scene clears its edited indicator; import resets playback identity. This metadata is not stored in project JSON.

`changeFixtures` validates the whole edit before mutation, takes manual control of only matching dimmer/color/motion layers (including release runs), and holds untouched components of an overridden color or aim at their evaluated values. Unrelated layers retain timing. Per-fixture/channel `fade.overrides` make manual controls immediate while preserving other scene fades. The same helper is used for aim, effect apply/remove and library recipes. Master, blackout and explicit effect transitions continue to apply. A manual intensity edit now stops that light's brightness animation; effect-studio and library brightness adjustments continue to adjust their animations.

Regression tests compare untouched lights against uninterrupted playback through and beyond scene transitions, exercise manual control during playback/pause/releases, invalid-edit atomicity, and scene save/recall. DOM checks cover actual control handlers, scene feedback and explicit restart. Chromium checks cover Static, continuing color/other lights, intensity/color/beam edits, Pause/Resume, scene saving/recall, browser Save/reload, and desktop/mobile layouts. This remains visual preview behavior; no hardware output was added.

## Preset Library · October 21, 2026

The library is a guided entry point to the existing effect engine: 17 curated recipes across Sunday, Color, Movement and Brightness; searchable cards; a capability summary; and an animated pattern illustration using `sampleEffect`. Entry points are the stage heading, Effects studio and the per-light context menu. Selection can be changed inside the library. No project mutations occur while browsing/customizing; Use applies the recipe. Pattern previews respect reduced-motion preferences and stop when the dialog closes. Desktop browsing and editing scroll independently; action buttons remain visible in the detail pane. Mobile uses a single scrolling flow.

`LUMA_PRESETS`, `presetDefaults`, `presetLayer` and capability helpers live in the first script so they are testable without the DOM. `preset_apply` validates the complete recipe/options/selection and a cloned project before changing state. Complete looks replace all supported effect types on selected lights; single-type recipes replace only their own type. Compatibility is based on configured channel profiles, not fixture artwork or hardware discovery. Motion/color offsets use only compatible lights, sorted by stage X/Y/address. Other fixtures, effect phase, global master/blackout/pause and ongoing scene fades are retained. Speed edits preserve phase. Steady looks use effect-release runs to ease back to their new base settings. The synthetic preview profile remains the only supported moving-head profile.

Applied recipes expose a session-only Quick edit card for live speed/brightness/size adjustments, Customize, Save to scene and advanced controls. A fingerprint of the affected looks/effects invalidates stale quick-edit settings after manual edits, cue/import/profile changes or removal, so using a stale recipe cannot overwrite later work. Recipes persist through their ordinary fixture/scene looks and effects; no project-format change or saved library-specific metadata is needed. Reopened projects are editable in the existing Effects studio. Quick edit does not claim to be a permanent custom-preset manager.

The shared scene dialog now offers New scene or an explicit existing-scene target. `update_scene` validates name/fade before replacing that scene's whole-stage looks and effects, retaining its ID and scene count. Saving a scene marks the project dirty; top-bar Save still persists the project in the browser. Tests cover all recipes across mixed profiles, incompatible selection, unchanged other lights/layers/fades, invalid-data atomicity, continuous speed changes, steady-look transitions, scene update/recall and export/import. DOM/browser checks cover no-change browsing, filtering/search, apply/tweak/customize, scene save/reload, context-menu access, keyboard dismissal and mobile layout.

## Stage reference aiming and pinspot lenses

Every fixture has a persisted `aimEnabled` switch, exposed in the inspector, fixture popup and Add/Change dialog. It defaults to false for fixed lights and true for legacy moving-head profiles. Switching from on to off clears the shared and six per-head reference targets. Moving-head profiles also reset pan/tilt to engine defaults through `aim`, removing only their current motion layer (including release runs) and overriding aim channels in active fades; scene definitions, color and dimmer layers stay intact. This reset occurs on the true→false transition, so unrelated edits to an already-disabled fixture do not reset its look. Static fixtures store an optional normalized `{x,y}` `beamTarget`; pinspot bars store six nullable normalized `pinspotTargets` in original SVG lens order. `pinspotAimMode` defaults to `individual`; its numbered handles independently aim each head. `together` exposes one handle at the centroid of the six evaluated targets. Dragging or keyboard nudging translates all targets by the same amount, clamped as a group at stage boundaries to preserve spacing. The original targets are captured at pointer-down; draft translation never accumulates. Changing modes retains the arrangement and cancels any active drag. The session-only Target to adjust selector can isolate a handle when spots overlap. Fixed targets remain anchored to stage coordinates when the fixture moves, rotates or is flipped. Reset reference targets clears this metadata. Manual moving-head aiming continues to use pan/tilt and stop only that fixture's motion layer.

Draft targets render during a drag but commit only on release; Escape/pointer cancellation/tool changes discard them. Keyboard arrows and Shift steps work on all targets. Turning the switch off also cancels a draft. Static aiming, target resets and lens changes use fixture metadata only, preserving DMX channel values, scene looks, effect runs and fades. The vertical LED strip keeps its old diffuse output until a target is positioned, then displays a directional wash toward that reference. A change of fixture appearance retains the metadata so switching back restores targets.

Pinspot fixtures store `pinspotLens` (narrow/medium/wide/custom) and `pinspotAngle` (1–90°, default custom angle 10°). Preview presets use 5°, 10° and 20° full beam angles; per-head radius uses distance × tan(angle/2), bounded by the drawn source radius. The same lens setting applies to all six heads. Manufacturer and retailer pages could not be retrieved in this environment, so these are explicitly approximate preview presets, not verified Chauvet insert angles or calibrated photometry. The custom setting allows matching a known insert angle. No hardware lens/motor operation is implied.

Validation checks boolean types, normalized target bounds, exactly six pinspot targets, lens enums and finite angle limits atomically. Defaults migrate prior v1/v2 projects. Save/Open, Export and duplication preserve the new metadata. Engine/DOM tests cover migration, invalid-data atomicity, no static-channel changes, draft/cancel/commit, switch resets, individual/group targets, group boundary clamping and keyboard translation, reset, overlap selection and lens width. Chromium checks cover real drags on all fixture shapes, six independent pinspot targets, moving-head behavior, popup controls, custom lenses, Save/reload and mobile layout.

## Multi-lens beam rendering correction

Pinspot bars, wash fixtures and PARs now render from the actual positions of their six/six/seven lenses instead of a single synthetic center source. `fixtureEmitterGeometry` maps SVG lens coordinates through aspect-fit, mounting flip and housing rotation into the live-stage coordinate system, including Arrange and forward-direction drafts. The pinspot bar uses six parallel narrow beams with separate compact landing spots. Wash/PAR beams are wider and overlap into a soft field. Per-fixture transverse color gradients and a shared axial falloff mask soften the beam edges/endpoints; the duplicate center cone, glow and pool are suppressed. Geometry is rebuilt on appearance changes and updated for stage resizing. Existing moving-head and vertical-bar optics remain in place.

All emitter nodes inherit the evaluated fixture color, intensity, effects, master and blackout. This changes visualization only: project fields, saved looks and DMX channel values remain unchanged. It is a qualitative 2D preview, not calibrated photometry, and the heads share the fixture's current aim/color/dimmer controls. Regression checks cover source/target topology, spread differences, color/zero-output and appearance transitions. Chromium checks compare each drawn lens center to its beam origin at desktop/mobile sizes across mounting flips and five orientations, plus blackout and actual rendered screenshots.

## Pinspot bar appearance

Added `pinspot-bar` to both fixture-shape selectors, appearance validation, artwork and footprint helpers. The horizontal 112 × 48 px silhouette has six spotlight heads with emitters driven by the fixture's existing color/intensity. Automatic appearance recognizes “Pinspot Bar” in a name/group. Stage, sidebar and context menu share the SVG; selection, arrangement, duplication, Save/Open and Export use the existing fixture model. Existing vertical bars remain unchanged. This is a visual style inspired by Chauvet DJ Pinspot Bar, not an exact manufacturer channel profile, individual head control, or a physical optics model.

## Explicit project Save · October 17, 2026

The top-bar Save button and ⌘S / Ctrl+S write a validated whole project to `localStorage` under `luma-desk.saved-project.v1`, in an envelope with `version:1`, `savedAt`, and `project`. A single atomic write preserves the previous save on quota/permission failure. Startup restores through engine validation before UI initialization, and skips automatic Living light demo playback for restored projects. Invalid stored data is retained untouched and a recovery message points to Open. Save is explicit, not automatic; one current project is stored per site/browser. Import marks the project unsaved until Save. Export still provides a separate downloadable backup.

The status distinguishes unsaved edits, saved/reopened browser data, and failures. Keyboard saving commits a focused field's change event first; open dialogs and active placement drafts must be finished before saving. All project metadata, fixtures, scenes, effects and stage guides persist; transient selection, popup position, effect phase, master/blackout and running scene-transition time are not project data. No cloud or GitHub project upload is implemented. Clearing browser data/private browsing can remove the saved copy; exports remain the portable backup. Regression tests cover save/load, invalid data and storage failure; Chromium checks cover reload, a new tab, keyboard saving, mobile header layout, and no download on Save.

The per-light forward arrow now uses a centered SVG with explicit dimensions instead of a font glyph, eliminating the off-center symbol reported by the user.

## Fixture mounting and direct aiming update · October 17, 2026

- All fixtures retain validated `mounting` (`normal` / `upside-down`) and `forward` (0–360°) metadata. Missing legacy values default to normal mounting and 0° forward, or 180° for existing front-light groups to preserve their inward direction. Fixed-light beams follow the forward arrow. Inspector multi-edit and the shared Add/Change light form expose these fields. Duplication and JSON export/import preserve them; scene looks continue to store normalized channel values.
- Selected lights show a draggable forward arrow. Selected moving heads also show a draggable beam target. Pointer capture isolates these gestures from marquee/arrange; changes preview until release, and Escape, pointer cancel, or switching tools discards a draft. Keyboard arrows adjust direction/target; Shift uses larger increments. Handles hide in Space mode and while arranging fixtures. Forward handles move farther from the fixture if they would overlap its beam target.
- `stageLightGeometry` now maps pan/tilt across the full stage. `rotateStagePoint` rotates rays around the fixture while preserving their fractional distance to the stage boundary, so its inverse `stageAimLook` can reach every edge/corner even with rotated or upside-down fixtures. Upside-down mounting mirrors the pan mapping and flips the housing; forward rotates the preview. Existing channel values remain unchanged, although older scene previews use this new full-stage mapping. This is an illustrative 2D map, not physical calibration; optional dimensions/heights still do not determine real optical reach.
- The engine `aim` operation validates all IDs/channels before applying, holds evaluated pan/tilt, removes only selected motion layers and release runs, and overrides only those channels in an active scene fade. Color, brightness, and other fixtures continue. Manual pad/slider/target changes use this operation, as do Movement → None / Static and Stop. Saving a scene captures the held aim without a motion layer.
- The fixture popup heading supports pointer dragging, keyboard arrows, Escape cancellation, and double-click reset. Its position persists for the page session and is clamped on resizing; it is UI state, not project data.
- Validation includes engine atomicity, fade/layer preservation, legacy metadata and round trips; DOM events and geometric inverse coverage across flips, rotations and stage edges; actual Chromium mouse/keyboard, export and responsive layout checks. Hardware remains untested.

## Implemented in the current preview

- Select one fixture, add to selection, or drag a marquee across multiple fixtures. Arrange mode moves selected groups together; marquee hit testing includes the full height of LED bars.
- Four generic static channel layouts plus a synthetic 16-channel moving-head profile. Patch validation prevents overlaps and out-of-universe addresses.
- Fourteen demo fixtures: six LED washes, two front lights, one moving head, and five upright LED bars evenly spaced across the stage. The patch occupies channels 1–68.
- Configurable PAR, LED wash, Fresnel/front, moving-head, and vertical-bar SVG appearances. Appearance is independent of DMX channel layout. These are type silhouettes, not exact manufacturer model drawings.
- Intensity, RGB/white, and supported moving-head controls; contextual additional controls; right inspector toggles for Color, Movement, or Both.
- Real time-based SVG stage animation: moving beam aim and floor pools, movement-path guides, changing color and brightness, diffused LED-bar emission, strobe, simplified gobo/prism/focus/iris/frost effects.
- Brightness effects: breathe, pulse, flicker, and chase. Color effects: palette flow, rainbow, and steps. Moving-head paths: circle, figure eight, pan sweep, tilt sweep, and wander.
- Cycle times, transitions, per-step fades, brightness bounds, motion dimensions, direction, and group offsets. Pause/resume and graceful effect removal.
- Smooth scene changes and blackout/restoration fades. Manual color edits stop the selected color effect so manual choices take effect.
- Save scenes with their base looks and effect configurations. Import/export the app's JSON format, including fixture appearance, effects, scenes, and stage guides. Legacy projects without appearance metadata get inferred shapes.
- Photo/camera image as a stage reference canvas, OBJ scan geometry as a layout guide, and platform/truss/speaker/screen/drums/person primitives.
- A Living light demo scene starts on page load when no browser save is restored, animating washes, bars, and the moving head. It initially selects the moving head so movement controls are immediately available.

### Per-light context menu (October 17, 2026)

Right-click a fixture on the stage or in the sidebar to select only that fixture and open an iOS-inspired frosted menu. It supports Adjust light, Change light, Rename, Duplicate, Move on stage, Select its group, Stop effects, and confirmed removal. Keyboard access uses Shift+F10 or the Context Menu key, arrow navigation, and Escape with focus restored. Outside clicks, wheel scrolling, window blur, and resizing dismiss it.

The shared Add/Change dialog shows validation errors inline. Metadata and appearance edits preserve effect timing. Profile changes clear unsupported current and saved effect layers; channel collisions fail without partial changes. Copies get a free channel block and begin off, without effects, in both the current look and saved scenes. Removal updates all scene looks/effects. Duplication and removal retain the other fixtures' running scene fade. The project must retain at least one fixture. Project format remains v2; Save now retains changes in this browser, and Export creates portable backups.

Engine and DOM-shim regression checks cover these operations. Chromium checks at desktop, laptop, and narrow viewport sizes exercise real context-menu events, keyboard focus, editing errors, copy/remove actions, group selection, arrangement, controls, and menu placement. These are browser simulation checks, not physical-lighting tests. Safari on an actual Mac remains untested.

### Expanded Space designer (October 17, 2026)

The user requested a more customizable stage and optional real-world stage dimensions and light mounting heights. Space now uses its own independently scrolling right-hand inspector with Stage, Objects, and Reference sections. Done restores the approved light inspector. The left Effects studio, center lighting canvas, five LED bars, and per-light context menu remain available.

The stage has rectangular, curved, and thrust footprints, slate/wood/black floor finishes, three room moods, and a configurable edge color. Canvas grid, labels, measurement annotations, and 5% object snapping can be toggled. Existing objects gain names, colors, placement locks, numeric size/position/rotation editing, duplication, and arrow-key movement. Lecterns, keyboards, steps, crosses, tables, and rugs join the original object types. The first platform is the main stage; other platforms use rectangular footprints. Photo and OBJ controls are retained in Reference.

Space stores `unit` (`m` or `ft`), optional `widthM`, `depthM`, and `elevationM`, plus validated style and guide settings. Fixtures store optional `mountHeightM`, editable from Space or the shared Add/Change light dialog. All physical values are canonical meters, converted for display/input; unchanged displayed conversions retain the exact original value. `null` means unspecified, and height zero means room-floor level. Stage size is limited to 0.01–500 m, and elevations/heights to 0–100 m. These are optional planning references, not calibrated beam geometry or output controls. Fit proportions fits and centers the main platform on the current canvas without moving fixtures. Object size and position remain canvas percentages.

All new metadata is additive within project format v2, survives Export/Open, and receives defaults when importing older projects. Metadata edits preserve lighting effects and transitions. Automated regression checks cover optional values, bounds, invalid-edit atomicity, legacy import, unit round trips, mounting-height persistence, object locking/snapping, and stage proportions. Actual Chromium checks cover desktop/laptop/mobile layouts, the real Export/Open flow, relocated OBJ controls, and the existing lighting/menu interactions. No physical-lighting accuracy or hardware support is implied.

### Direct object manipulation (October 17, 2026)

In Space, selecting or adding an object now shows four corner resize handles and an on-canvas Duplicate / Rotate / Lock / Delete action bar. Handles support mouse, touch, and keyboard. Resizing operates in the object's rotated coordinate system and fixes the opposite corner; Shift-drag preserves proportions. Snapping rounds resized dimensions to 5% canvas increments. The existing 2–95% size and 0–100% center limits remain enforced. Rotate advances by 90 degrees; locked objects keep duplication and unlocking available while preventing destructive or placement edits.

Movement and resizing preview locally, committing only on pointer release. Escape, pointer cancellation, lost pointer capture, window blur/resize, or leaving Space cancels the gesture. Clicking blank canvas or pressing Escape with no active gesture clears object selection. Focused objects and corners accept Delete/Backspace. The selection frame and handles are separate from object buttons, and toolbar controls remain reachable at narrow widths. Changes use the existing object fields and preserve Export/Open compatibility. Automated geometry/event checks and actual Chromium mouse, keyboard, touch, and persistence checks cover these behaviors.

## Requested ambitions that remain incomplete

- Actual hardware discovery and auto-identification. The current Discovery panel explains RDM requirements; it does not scan devices. Auto-patch only allocates addresses in the project.
- Hardware-specific fixture profiles, real USB/network DMX integration, multiple universes, and production reliability.
- MIDI cue integration with the user's church playback workflow.
- Automatic creation of a reconstructed working stage from a photo. The current feature is a reference backdrop with manually positioned fixtures and objects, not computer vision or a calibrated 3D model.
- More complete Polycam import. Current support is a bounded OBJ wireframe guide; it does not import every Polycam export format or reconstruct textures and physical lighting.
- Durable autosave, undo/redo, recovery, show management, and packaging as an installable app.

## Architecture and file history

`index.html` contains CSS, markup, and seven inline scripts. There is no build step, framework, external font, or CDN dependency. Main components:

1. `LumaPreviewEngine`, fixture artwork helpers, deterministic effect sampling, OBJ parser, and demo project.
2. Base UI rendering, selection and arrangement, scenes, controls, patch view, project import/export.
3. Space designer, optional physical measurements, stage guides and objects, contextual fixture controls, blackout timing, and preview discovery/auto-patch UI.
4. Effects studio controls, presets, waveform, playback, and scene effect indicators.
5. Evaluated-frame SVG light rendering and right-side Color/Movement/Both inspector.
6. Per-light context menu, shared fixture editor, removal confirmation and browser saving.
7. Preset Library browsing/preview, quick adjustments and scene-saving workflow.

The current project format is `luma-desk-v2`; import also accepts `luma-desk-v1`. The engine evaluates base looks, effect layers, scene transitions, and master/blackout gain before building the simulated 512-slot frame. The SVG renderer uses that evaluated state rather than an independent decorative animation.

`reference/legacy-python/` contains the earlier `lightkey-lab` code: Python engine, loopback HTTP server, unicast ArtDmx/OSC experiments, tests, and a read-only Lightkey archive inspector. That work predates the latest UI and effects. It is not integrated into this HTML. Its README documents output behavior and limitations. Preserve it as reference when designing the eventual bridge.

## Validation and remaining uncertainty

The included engine and DOM-shim tests passed before this handoff. They exercise timing, fades, effect pause/resume, scene recall, live SVG attribute updates, multi-edit controls, full-height bar selection, appearance persistence, patch allocation, stage objects, and mocked photo import. CSS and all inline scripts compiled in the original workspace.

The environment used to create this handoff could not perform a full browser layout check: a local preview route was unavailable, and an attempted browser file route was denied. Those restrictions were not bypassed. Offline SVG artwork was rendered and inspected for the fixture-shape update. The latest left-panel layout was checked structurally and with a CSS parser, not through an actual browser screenshot.

No physical fixture, USB adapter, active Lightkey show, DMX receiver, or RDM discovery has been validated with the current UI. Older Python socket tests had environment-related skips. Keep these distinctions in test reports.

## Suggested first development pass

1. Run the included checks and inspect the current app at desktop and laptop viewport sizes. Confirm the left panel can scroll through every control without covering the stage or right inspector.
2. Create a local version-control baseline. Preserve the approved appearance and behavior while extracting the engine, renderer, and UI into maintainable modules if needed.
3. Add reliable project persistence and recovery with migration tests, then address one requested hardware or MIDI integration at a time.

This package includes the app and a task-focused handoff, not unrelated personal data or a verbatim copy of the entire conversation. Direct creation/forking of a Codex task failed in the originating session; this folder is ready for the user to open in Codex.
