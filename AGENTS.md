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
- For physical-lighting work, read `docs/HARDWARE-COMPATIBILITY.md` for the owner's equipment and connection choices. Own technical driver/protocol research; do not ask the owner to determine compatibility or repeat information already recorded. Keep verified support, research candidates, and untested hardware behavior distinct.

## Cloud development and online change links

- The user wants the project kept in `almudeno89/LumaDesk` on GitHub and developed in the cloud, without requiring local downloads.
- After completing and validating an authorized change, commit and push it to the appropriate remote branch. Preserve concurrent changes; never force-push or overwrite remote work. Respect any branch protection and use a pull request when required.
- In every completion report for a saved and pushed edit, include a clickable GitHub link to each changed file (group long lists when useful) and the commit or pull request showing the changes. Clearly distinguish local-only edits from successfully pushed changes.
- When a website deployment is requested, verify deployment before claiming the app is live. Include the verified app URL and say if deployment is pending or blocked. A GitHub file link displays source, not the running app.
- See `docs/ONLINE.md` for the repository links, publishing instructions, and current storage limitations.
