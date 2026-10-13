# Expanded Lightkey-style application — findings and build plan

Prepared October 12, 2026 (America/Los_Angeles). Scope: familiar and expandable controls, independent lighting playback, broader USB hardware, Lightkey automation and eventual project migration.

## What the installed application establishes

Read-only inspection of `/Applications/Lightkey.app` found:

| Evidence | Finding | What it means |
| --- | --- | --- |
| `Contents/Info.plist` | Lightkey 6.0.2, minimum macOS 26.0 | The installed version is a concrete reference target. |
| Linked framework files | `libola`, `libolacommon`, `libartnet`, `MIKMIDI`, `F53OSC`, `libprotobuf` | Hardware and external control already have separable components. Presence does not imply every library feature is exposed by Lightkey. |
| Separate OLA installation | `/Library/OLA/0.10.8/bin/olad` | OLA exists outside the Lightkey executable. No daemon or driver configuration was changed. |
| Exported document types | `.lightkeyproj`, `.lightkeyfxt`, `.lightkeybindings`, `.lightkeypresets` | Separate project, profile, binding, and preset formats can be investigated. |
| Both bundled projects and one sampled fixture file | `bplist00`, `NSKeyedArchiver`, indexed `$objects` and `$top` | These samples are inspectable structured data; this is not evidence that all versions/fields are understood. |
| Bundled Demo Project | 20 fixture objects, 51 cues, 58 MIDI triggers | The first inspector can inventory useful migration inputs. |
| Demo fixture object | name, raw address, profile reference, personality index, universe reference | Patch migration looks feasible, but one-based/zero-based semantics and references must be validated. |
| Demo preset object | named preset and `fpStore` reference | Preset/effect decoding remains a separate task. |

The earlier system USB inventory returned an empty list. The continuation's USB registry query was unavailable under the current execution permissions. No specific USB-DMX adapter was identified or tested; neither result establishes what is physically connected to the Mac.

## Feasibility

An independent application with the same useful interaction ideas is feasible. Recovering the original source project is not the strategy, and this first pass did not decompile the executable. We can study observable behavior, read compatible file structures, and write our own implementation. Our interface should preserve quick fixture selection, clear color/intensity controls, immediate preview, and simple live scene triggering while adding easier patching and automation.

There are two independently valuable paths:

1. **Keep Lightkey as the playback engine.** Build a custom control surface and use its documented OSC/MIDI interfaces. Investigate an independently configured OLA daemon for hardware expansion. This may deliver benefits before a full replacement is ready. It retains Lightkey's capabilities and license limits.
2. **Build our own playback engine.** Control fixture properties, scenes, effects and timing ourselves; use a driver layer for DMX output. This provides full architectural control and permits a distinct UI and feature set. Matching the maturity of Lightkey requires substantial iteration and real hardware testing.

The prototype exercises path 2 and supplies the beginning of path 1's OSC bridge.

## Proposed architecture

| Layer | Responsibility | First implementation / next decision |
| --- | --- | --- |
| Control surface | Live desk, fixture layout, inspector, patch, show programming | Browser UI used to iterate quickly; native Mac shell remains a product decision. |
| Show model | Fixtures, profiles, groups, preset/cue references, setlists | Versioned JSON prototype; evolve with stable IDs, migrations, autosave and undo. |
| Playback engine | Fades, effect phase, cue priority, intensity/color merge, clock | Independent process/thread; timing must not depend on browser animation. Current prototype implements fades and master only. |
| Output adapter layer | OLA/USB, Art-Net, sACN; device diagnostics | Minimal ArtDmx sender now. Device discovery and OLA integration next. |
| Automation layer | OSC, CoreMIDI, app API, Playback/ProPresenter mappings | Outgoing OSC now; native MIDI and authenticated control API later. |
| Import layer | Parse Lightkey data, map known concepts, report unsupported fields | Read-only inventory now. Never silently pretend unsupported effects have imported. |

The long-term engine should be native or a measured, robust service with bounded scheduling and independent monitoring. The current Python loop is a development implementation, not hard real-time software. A local web interface alone does not supply general USB-DMX access; a native/daemon adapter is necessary.

## Hardware expansion candidates

Support status below means documented upstream capability, not a promise about this prototype or the installed OLA build.

| Family | Evidence / route | Remaining check |
| --- | --- | --- |
| ENTTEC DMX USB Pro / Pro Mk II | OLA Serial USB plugin lists both; ENTTEC publishes a Pro API. | Exact model, driver ownership, output ports and sustained timing. |
| DMXking USB DMX512-A / Ultra DMX / Ultra DMX Pro | Listed by OLA Serial USB plugin. | Exact USB product/firmware and per-port routing. |
| Anyma uDMX | Listed by OLA USB plugin. | USB access on current macOS and sustained output. |
| Nodle U1, FX5, Digital Enlightenment | Listed by OLA USB plugin. | Plugin included in selected build; correct device mode. |
| Eurolite USB-DMX512 PRO / PRO MK2 | Listed by OLA USB plugin. | MK2 detection defaults off and can conflict with FTDI/serial plugins. |
| ShowJockey SJ-DMX-U1, Velleman K8062, Sunlite USBDMX2 | Listed by OLA USB plugin. | Exact model and platform behavior. No blanket support for all Sunlite devices. |
| Enttec Open DMX / raw FTDI-style cables | Lightkey documents host-timing limitations for unbuffered devices. | Hardware-specific timing, chipset identification and macOS access; a USB plug does not establish compatibility. |
| Proprietary or manufacturer-locked interfaces | Investigate vendor SDK or documented protocol. | Some may have no practical support route. Do not promise universal USB support. |
| Art-Net / sACN nodes | Published network protocols; Lightkey documents these output paths. | Addressing, receiver configuration, network load and failure behavior. sACN is not implemented here. |

A newer OLA version or custom plugin can be useful, but merely exposing every upstream plugin does not guarantee a reliable Mac driver. Document compatibility at exact model/firmware/OS level.

## Product direction for the church

- Separate a programming workspace from a simplified volunteer desk.
- Visual fixture groups and stage/front/room zones, with explicit output status.
- Song sections such as intro, verse, chorus, bridge, and prayer, with reusable cue templates.
- MIDI mappings for Playback/ProPresenter; an inspectable list of messages and targets.
- A fixture wizard based on the manufacturer's actual DMX chart, with overlap checks and a per-channel monitor.
- Device diagnostics that distinguish detected USB devices, loaded drivers, patched ports, and verified output.
- Optional house-light adapters for exact Hue/Govee/Matter models after API and local-control checks. These are candidates, not confirmed integrations.
- Touch-friendly remote control with authentication, reconnect behavior, and explicit operator ownership.

## Delivery milestones and acceptance

| Milestone | Acceptance |
| --- | --- |
| 0 — Prototype (this package) | Working fixture controls/scenes/patch, project round trip, raw archive inventory, tested ArtDmx/OSC packet encoding. Live UDP transport remains unverified in the current session. |
| 1 — First real adapter | User identifies exact USB model; discover it, patch one known fixture, verify every channel and 30–60 minutes of output; check unplug/replug and sleep/wake. |
| 2 — Reusable show engine | Presets independent from cues, fixture groups, multiple universes, parameter-aware fades, moving-head modes, cue release/priority and effects with deterministic timing. |
| 3 — Church automation | MIDI learn and feedback, song-section triggers, ProPresenter/Playback integration, logged and reversible assignments. |
| 4 — Migration | Compare controlled Lightkey sample projects differing by one setting; map identities/references/values; import only verified features with a conversion report. |
| 5 — Daily use | Native packaging, project autosave/undo, crash recovery, clear output ownership, sustained hardware testing, operator documentation. |

No calendar estimate is given before the adapter and must-have advanced features are identified. A usable subset is achievable much sooner than complete feature parity.

## Verification completed

- Continuation check on October 12 local time: **10 Python tests passed; 2 UDP transport tests were skipped** because socket binding was denied by this execution environment. Pure ArtDmx and OSC packet encoding was verified separately. Prior notes claimed a successful UDP test; that result was not independently reproduced here.
- Checks cover bounds/overlap/finite-number validation, master/blackout restoration, separate dimmer scaling, fade continuity, JSON round trip, exact packet bytes, and unchanged Lightkey demo input bytes.
- Fixed and tested output disarming so a failed final blackout send cannot leave the output loop armed. A separate test verifies successful blackout frames and retained preview state.
- Direct read-only inspection reported 20 fixtures, 51 cues and 58 MIDI triggers in the installed demo; Effects Showcase reported 25 fixtures, 50 cues and 55 MIDI triggers.
- Browser verification confirmed the existing preview server is accessible, both external output routes are unconfigured, and selecting Welcome changes the preview color/intensity through its fade.
- The running preview predates the shutdown fix. The corrected source is in this package and takes effect on the next normal launch. This session cannot restart a listening service because local socket operations are restricted.
- API host/origin/session-token checks are present in source; the earlier pass reported a missing-token rejection, but it was not re-run in this continuation.
- No physical USB output, real network lighting receiver, active Lightkey OSC action, or stage rig has been validated.

## Primary references

- Lightkey specifications: https://www.lightkeyapp.com/en/specs
- Lightkey Help Center, OLA and USB hardware sections: https://www.lightkeyapp.com/en/help
- OLA source and architecture: https://github.com/OpenLightingProject/ola
- OLA USB plugin: https://docs.openlighting.org/ola/conf/ola-usbdmx.conf.html
- OLA Serial USB plugin: https://docs.openlighting.org/ola/conf/ola-usbserial.conf.html
- ENTTEC Pro API documentation entry: https://support.enttec.com/dmx/usbdmx-dmx-usb-pro-70304/dmx-usb-pro-api
- Art-Net specification: https://art-net.org.uk/downloads/art-net.pdf
- OSC 1.0 specification: https://opensoundcontrol.stanford.edu/spec-1_0.html

Open-source dependencies have their own licenses. Use upstream releases and preserve their applicable notices/source obligations when packaging; no third-party runtime is bundled in this prototype. This is a technical implementation plan, not a legal conclusion about every potential reverse-engineering or distribution method.
