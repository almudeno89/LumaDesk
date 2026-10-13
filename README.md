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

## Verify

```sh
npm test
```

The engine tests exercise effects, fades, scenes, patch data, and persistence. The UI tests execute the actual inline scripts against a small DOM shim and cover selection, controls, SVG animation updates, and fixture appearance. They do not replace a real browser layout or hardware test. The photo decoder is stubbed in this harness.

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
