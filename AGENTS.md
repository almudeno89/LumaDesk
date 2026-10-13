# Working on Luma Desk

Read `docs/HANDOFF.md` before changing the application. `index.html` is the current design and behavior baseline. The Python reference is older and separate.

- Preserve the user's approved visual direction and existing features while making focused changes.
- Keep Effects studio on the left, the live stage in the center, and the color/movement inspector on the right at desktop sizes. Panels need independent scrolling and must not cover each other.
- Keep all five upright LED bars in the example stage. Fixture appearance and channel profile are separate properties.
- Keep changes runnable. Use `npm test` for changes affecting the engine or event wiring. Inspect actual browser layouts when the environment permits; do not describe DOM-shim checks as browser screenshots.
- Document simulation versus implemented hardware behavior accurately. Generic preview channel layouts are not manufacturer fixture profiles.
- Preserve compatibility with existing project JSON where practical. Saving must retain fixture appearance, scene looks, effects, and stage guides.
- Do not use the older Python interface as a replacement for the latest UI.
- No dependencies are currently required. Add tooling only when it helps the requested change.
