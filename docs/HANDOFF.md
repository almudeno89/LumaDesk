# Luma Desk development handoff

Prepared October 13, 2026 from the latest `Luma-Desk-Preview.html` (saved version 6). The initial `index.html` was an exact copy of that file; subsequent changes are recorded in Git. This is a project handoff, not a completed migration to a framework or desktop runtime.

## Product intent

Pablo is building a clean, approachable church lighting application. He asked for an Apple-inspired interface and wants to see the stage respond live while adjusting controls. Keep the current design; he has repeatedly approved it and requested specific additions.

On October 17, 2026, Pablo explicitly approved the version with the per-light iOS-style context menu as the official Luma Desk baseline. The approved application is commit [`2352669`](https://github.com/almudeno89/LumaDesk/commit/2352669b597f43b0b9e81a2a5647ce090b4c91f4), published at https://almudeno89.github.io/LumaDesk/. Future updates should build on this version and preserve its approved menu, layout, and interactions unless Pablo requests a change. This approval establishes the product baseline; the hardware and persistence work listed below remains incomplete.

An earlier completed request moved Effects studio from below the stage to its own left column because the right-hand inspector obscured the previous layout while scrolling. The left panel now has independent scrolling, a fixed header, and an always-visible action footer. The center holds the stage and scenes, with color and movement controls on the right. Responsive layouts use fewer columns at narrower widths.

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
- A Living light demo scene starts on page load, animating washes, bars, and the moving head. It initially selects the moving head so movement controls are immediately available.

### Per-light context menu (October 17, 2026)

Right-click a fixture on the stage or in the sidebar to select only that fixture and open an iOS-inspired frosted menu. It supports Adjust light, Change light, Rename, Duplicate, Move on stage, Select its group, Stop effects, and confirmed removal. Keyboard access uses Shift+F10 or the Context Menu key, arrow navigation, and Escape with focus restored. Outside clicks, wheel scrolling, window blur, and resizing dismiss it.

The shared Add/Change dialog shows validation errors inline. Metadata and appearance edits preserve effect timing. Profile changes clear unsupported current and saved effect layers; channel collisions fail without partial changes. Copies get a free channel block and begin off, without effects, in both the current look and saved scenes. Removal updates all scene looks/effects. Duplication and removal retain the other fixtures' running scene fade. The project must retain at least one fixture. Project format remains v2 and changes still require Export for persistence.

Engine and DOM-shim regression checks cover these operations. Chromium checks at desktop, laptop, and narrow viewport sizes exercise real context-menu events, keyboard focus, editing errors, copy/remove actions, group selection, arrangement, controls, and menu placement. These are browser simulation checks, not physical-lighting tests. Safari on an actual Mac remains untested.

### Expanded Space designer (October 17, 2026)

The user requested a more customizable stage and optional real-world stage dimensions and light mounting heights. Space now uses its own independently scrolling right-hand inspector with Stage, Objects, and Reference sections. Done restores the approved light inspector. The left Effects studio, center lighting canvas, five LED bars, and per-light context menu remain available.

The stage has rectangular, curved, and thrust footprints, slate/wood/black floor finishes, three room moods, and a configurable edge color. Canvas grid, labels, measurement annotations, and 5% object snapping can be toggled. Existing objects gain names, colors, placement locks, numeric size/position/rotation editing, duplication, and arrow-key movement. Lecterns, keyboards, steps, crosses, tables, and rugs join the original object types. The first platform is the main stage; other platforms use rectangular footprints. Photo and OBJ controls are retained in Reference.

Space stores `unit` (`m` or `ft`), optional `widthM`, `depthM`, and `elevationM`, plus validated style and guide settings. Fixtures store optional `mountHeightM`, editable from Space or the shared Add/Change light dialog. All physical values are canonical meters, converted for display/input; unchanged displayed conversions retain the exact original value. `null` means unspecified, and height zero means room-floor level. Stage size is limited to 0.01–500 m, and elevations/heights to 0–100 m. These are optional planning references, not calibrated beam geometry or output controls. Fit proportions fits and centers the main platform on the current canvas without moving fixtures. Object size and position remain canvas percentages.

All new metadata is additive within project format v2, survives Export/Open, and receives defaults when importing older projects. Metadata edits preserve lighting effects and transitions. Automated regression checks cover optional values, bounds, invalid-edit atomicity, legacy import, unit round trips, mounting-height persistence, object locking/snapping, and stage proportions. Actual Chromium checks cover desktop/laptop/mobile layouts, the real Export/Open flow, relocated OBJ controls, and the existing lighting/menu interactions. No physical-lighting accuracy or hardware support is implied.

## Requested ambitions that remain incomplete

- Actual hardware discovery and auto-identification. The current Discovery panel explains RDM requirements; it does not scan devices. Auto-patch only allocates addresses in the project.
- Hardware-specific fixture profiles, real USB/network DMX integration, multiple universes, and production reliability.
- MIDI cue integration with the user's church playback workflow.
- Automatic creation of a reconstructed working stage from a photo. The current feature is a reference backdrop with manually positioned fixtures and objects, not computer vision or a calibrated 3D model.
- More complete Polycam import. Current support is a bounded OBJ wireframe guide; it does not import every Polycam export format or reconstruct textures and physical lighting.
- Durable autosave, undo/redo, recovery, show management, and packaging as an installable app.

## Architecture and file history

`index.html` contains CSS, markup, and six inline scripts. There is no build step, framework, external font, or CDN dependency. Main components:

1. `LumaPreviewEngine`, fixture artwork helpers, deterministic effect sampling, OBJ parser, and demo project.
2. Base UI rendering, selection and arrangement, scenes, controls, patch view, project import/export.
3. Space designer, optional physical measurements, stage guides and objects, contextual fixture controls, blackout timing, and preview discovery/auto-patch UI.
4. Effects studio controls, presets, waveform, playback, and scene effect indicators.
5. Evaluated-frame SVG light rendering and right-side Color/Movement/Both inspector.
6. Per-light context menu, shared fixture editor, and removal confirmation.

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
