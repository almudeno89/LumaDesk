# Luma Desk online

The project is stored at https://github.com/almudeno89/LumaDesk.
Development can happen in the Codex cloud workspace; keeping a ZIP or project folder on a personal computer is not required.

## Where to see changes

- All current files: https://github.com/almudeno89/LumaDesk/tree/main
- Current application source: https://github.com/almudeno89/LumaDesk/blob/main/index.html
- Change history: https://github.com/almudeno89/LumaDesk/commits/main
- Development handoff: https://github.com/almudeno89/LumaDesk/blob/main/docs/HANDOFF.md

After each authorized edit is validated, committed, and pushed, the agent should report direct links to the changed files and the commit or pull request. A commit page shows exactly what changed. Local-only changes must be identified as such.

## Website publishing

This app is a static, dependency-free `index.html` and can be hosted with GitHub Pages. Source upload does not automatically enable Pages.

Repository administrators can open https://github.com/almudeno89/LumaDesk/settings/pages and, if available for the repository and account plan, choose **Deploy from a branch**, **main**, and **/ (root)**, then save. Keep the existing repository visibility; do not make a private repository public merely to enable Pages.

Use the URL GitHub reports after a successful deployment. Confirm that it loads the current Luma Desk interface before describing the app as published. The cloud environment used for the initial upload could not reach the GitHub API or the Pages hostname, so website publication was not verified at that point.

With branch-based Pages enabled, later pushes to `main` trigger site updates. A file being saved in a workspace, a Git commit, a GitHub push, and a completed website deployment are separate steps. Report which have completed and provide the live URL only when verified.

## What remains local to the browser

The current app holds a lighting project in browser memory and uses **Export** to download saved projects. Reloading without exporting can lose changes. GitHub stores the application source; it does not automatically save scenes or layouts edited inside the app. Online saving of lighting projects needs a separate feature.

Real DMX/RDM and MIDI integrations remain future work. The current application is a simulation and does not send hardware output.
