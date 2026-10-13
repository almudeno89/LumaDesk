# Luma Desk — lighting lab 0.1

An original first prototype for Pablo's expanded lighting application, informed by an inspection of Lightkey 6.0.2. Working title only. This is the beginning of a replacement and integration project, not a complete Lightkey clone or a production show controller.

## Run

Requires Python 3.10 or later. No Python packages, JavaScript packages, account, or Internet connection are required.

```sh
python3 app.py
```

Open http://127.0.0.1:8768 in a browser. Use Control-C in the terminal to stop. The UI is local to this computer. It is not exposed to an iPad or the local network.

## What works

- Select fixtures or zones, change intensity/color/white, and drag fixtures around the stage concept.
- Play scenes with smooth fades; capture additional scenes.
- Master intensity and reversible blackout.
- Patch RGB, RGBW, Dimmer + RGB, and single-channel Dimmer fixtures. Starting addresses are one-based. Channel overlaps and out-of-range patches are rejected.
- Generate all 512 DMX slot values, with a visible monitor of channels 1–64.
- Export/import the app's own JSON project format. Changes are in memory until exported; export before closing the engine. Reloading the browser does not reset the running engine.
- Read-only Lightkey archive inventory: fixtures, cue names, profile metadata, and raw MIDI fields.
- Minimal unicast ArtDmx output at a target rate of 40 Hz when explicitly configured and armed.
- OSC/UDP output with one float argument, to an explicitly configured Lightkey destination.

## Output and compatibility

Preview is the default. Starting the app without flags sends no lighting commands. To prepare an output route:

```sh
python3 app.py --artnet-target RECEIVER_IPV4 --port-address 0
```

Replace `RECEIVER_IPV4` with the specific receiver's address. `--port-address` is the **zero-based Art-Net Port-Address**, not a DMX fixture address. Configure the receiver to match. Then use **Connections → Arm output**. The receiver may be a network DMX interface or a separately configured OLA instance that routes Art-Net into a supported USB adapter. This prototype does not configure OLA or claim the USB adapter has been verified.

The interface's packet count means UDP packets were handed to the operating system, not that a fixture acknowledged them. No ArtPoll discovery, subscription management, ArtSync, RDM, input merging, or full Art-Net conformance is implemented. Art-Net™ is designed by and Copyright Artistic Licence. See the protocol's OEM-code and attribution requirements before distributing a full controller.

**Blackout & disarm** attempts to send three frames with supported intensity channels set to zero and stops output. Disarming takes effect even if a final packet fails; the error remains visible. Control-C does the same on a graceful exit. Color channels on Dimmer + RGB fixtures retain their values while the dimmer goes to zero. Closing the browser alone leaves the engine and any armed output running. A crash or forced termination cannot guarantee a final blackout; receiver behavior must be tested before live use.

To prepare the Lightkey bridge:

```sh
python3 app.py --osc-host 127.0.0.1 --osc-port LIGHTKEY_OSC_PORT
```

Use the exact port shown in Lightkey's OSC settings. Copy the desired cue/action's OSC address from Lightkey, paste it into Connections, and send the appropriate float argument. Port and action are not guessed. Packet encoding is tested; actual UDP delivery needs an environment that permits local sockets. This has not been validated against an active Lightkey show. It does not change Lightkey preferences or bypass its license/channel limits.

## Inspect a Lightkey file

Use **Lightkey inspector → Choose file**, or:

```sh
python3 inspect_lightkey.py /path/to/project.lightkeyproj
```

The inspector parses the property list as data; it does not instantiate archived Objective-C classes. It does not overwrite input files, import a playable show, decode effect algorithms, or convert preset payloads. Stored addresses and MIDI channels are reported raw. Their UI numbering and semantics still require controlled comparison tests. File size is limited to 16 MiB.

## Verify

```sh
python3 -m unittest -v test_engine.py
```

Twelve tests cover patch bounds/overlap/non-finite inputs; master and blackout restoration; separate-dimmer scaling; fade midpoint/completion/retarget continuity; JSON round trip; ArtDmx and OSC encoding; disarm success and transport failure; real loopback UDP delivery; and read-only inspection of the installed Lightkey demo, when present.

Latest check: **10 passed, 2 skipped** because this execution environment denied UDP socket binding. Skipped transport checks are not evidence of working hardware output. Run the suite in a normal local terminal to exercise them. No physical adapter or active Lightkey OSC action has been verified.

## Files

| File | Purpose |
| --- | --- |
| `app.py` | Loopback HTTP API and output loop |
| `engine.py` | Generic fixture model, fades, DMX mapping, packet encoders |
| `index.html` | Original control interface, no external assets |
| `inspect_lightkey.py` | Structural archive inventory |
| `test_engine.py` | Behavioral and loopback tests |
| `RESEARCH.md` | Installed-app findings, architecture, hardware roadmap |

## Scope still ahead

Physical USB drivers and validation; OLA discovery/configuration; native Mac packaging; persistent undo/autosave; multiple universes and sACN; moving-head profiles; effects and cuelists; MIDI learn/input/feedback; full Lightkey show conversion; smart-light adapters; remote authentication; calibrated visualization; and production reliability testing.

No Lightkey executable, proprietary UI artwork, bundled fixture library, demo show, or decompiled implementation is included in this package. The prototype does not recover Lightkey's original source code.
