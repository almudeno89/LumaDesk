# Luma Desk: church hardware and compatibility research

Research recorded October 16, 2026. This is a development decision record, not a claim of working hardware integration. No output was sent to physical equipment. Luma's current web application remains a simulation.

## Intended result and responsibility

Luma should replace myDMX as the program the operator uses. The owner uses a Mac and wants the source maintained on GitHub. Researching drivers, protocols, SDKs, and compatible connections is the developer's responsibility; do not ask the owner to research those technical questions. Use the inventory below instead of repeatedly asking for information already supplied.

The owner can eventually run a simple diagnostic or observe a fixture during a controlled test. That is physical evidence the cloud workspace cannot obtain by itself. Device discovery, compiled code, a successful USB write, and an actual fixture responding correctly are different validation stages.

## Owner-confirmed equipment

| Equipment | Quantity | Intended connection | Remaining device-specific evidence |
| --- | --- | --- | --- |
| ADJ myDMX 3.0 interface; currently used with myDMX 3 software | 1 | USB to the Mac, if independent control is supported | Actual USB identity, protocol/firmware support, Mac driver or SDK evidence |
| Chauvet DJ Pinspot Bar | 1 | **Wireless DMX**, per the owner's correction | Exact fixture channel map; compatible transmitter/receiver system |
| Chauvet DJ COLORband Q3BT ILS | 2 | Bluetooth, currently controlled with BTAir | Exact Bluetooth protocol and model-specific DMX fallback definition |
| Chauvet DJ SlimPAR Q12 BT | 2 | Bluetooth, currently controlled with BTAir | Exact Bluetooth protocol; DMX fallback definition exists |
| Boulder Pro 19x15W zoom wash moving head, warm-white/cool-white 2-in-1 LEDs | 2 | Planned wireless DMX | Exact model-specific channel chart and operating mode |
| 32-channel 96A RGBW DMX512 LED decoder, DC5–24V, advertised 8/16-bit | 1, controlling 8 DIY vertical LED strips | Wired DMX | Actual selected mode and output wiring; marketing title is not a unique model ID |
| Eliminator DMX dimmer box | 1, controlling 4 bottle lights | Wired DMX | Exact model and channel/mode map |

The Pinspot is not part of the BTAir integration. The four Bluetooth fixtures are the two COLORbands and two SlimPARs. Preserve that distinction.

The existing demo has 14 fixtures and five vertical bars. The physical inventory above is a separate future project configuration; do not silently replace the approved demo or assume its generic channel maps describe the church equipment.

## Findings and strength of evidence

### 1. Reusing myDMX 3.0: unresolved, not ruled out

No verified supported driver for this exact retail interface on current macOS was found in the inspected sources. This does not prove that the interface is locked or impossible to reuse.

- Current [QLC+ USB documentation][qlc-usb] lists supported interfaces but does not list myDMX. Inspection of QLC+ plugins/docs and OLA's plugin source did not find a myDMX/SIUDI driver. The [OLA request about myDMX 2.0][ola-issue] is about a different version and does not settle 3.0 compatibility.
- [jesselang/mydmx][old-mydmx] is an older Linux kernel driver using USB vendor/product IDs `6244:0301`. It is not evidence of a Mac driver or compatibility with myDMX 3.0.
- [artnet-siudi][siudi-match] matches SIUDI 8A/9A devices with IDs `6244:0421` and `6244:0441`. It does not establish which retail hardware the owner's box contains. Its [initialization sequence][siudi-init] includes an unexplained fixed block; the inspected project has no Mac build/test documentation or exact myDMX 3.0 claim.
- The inspected [SIUDI 6C wrapper][siudi-wrapper] and [later SDK example][siudi-example] document Windows DLLs and different devices, not a verified Mac/myDMX 3.0 solution.

Identifying the USB device would select a candidate investigation path, not prove that output works. Before using a proprietary SDK, establish its actual Mac support and applicable terms. Before a service, test real output, reconnect behavior, and failure handling.

Do not tell the owner a replacement interface is already necessary. Keep reuse as an investigation path, with a standards-based network-to-DMX interface as a fallback.

### 2. BTAir fixtures: Mac transport is available; the fixture protocol is unverified

The owner reports controlling the four fixtures with BTAir. That establishes their working existing control route. It does not reveal the radio details or the command format available to another application.

- [Bleak][bleak] is a Bluetooth Low Energy GATT client with macOS CoreBluetooth support. Its [Mac documentation][bleak-mac] describes the normal Bluetooth permission and packaging requirements.
- Bleak would be a possible connector component **if the fixtures expose a compatible BLE interface**. Their exact Bluetooth type, services, characteristic IDs, command bytes, pairing/authentication requirements, and write rate remain unverified.
- Its [connection documentation][bleak-connections] says simultaneous connections depend on adapter hardware. Four-fixture connectivity and range must be measured, not promised.
- [MDN browser compatibility data][web-bluetooth] records Web Bluetooth support in Chrome on macOS, but not Safari or Firefox. A direct Chrome-to-light implementation is therefore an option to investigate if the fixtures expose BLE GATT and their command protocol is understood. Do not claim that browsers categorically cannot control Bluetooth lights.
- Searches of public GitHub repositories for `chauvet bluetooth`, `chauvet btair`, `chauvet BLE`, and `BTAir in:readme` did not produce a relevant verified controller implementation. This is a limited search result, not proof that no implementation or SDK exists.

A different model's firmware release, including Q12BT ILS firmware, does not establish the protocol for the owner's non-ILS SlimPAR Q12 BT.

The next useful device investigation is a targeted Mac diagnostic: collect owned fixture advertisements and available service/characteristic information without writing control values. Establish the actual protocol from documentation or authorized observation of the owner's BTAir communications. Do not send guessed commands. Do not describe discovery as successful control.

Preserve the requested Bluetooth route in the design. Wireless DMX receivers on these fixtures would be a separate fallback choice, not a silent replacement for the requested Bluetooth integration.

### 3. Verified fixture-profile evidence

The [Open Fixture Library definition for SlimPAR Q12 BT][slimpar-ofl] identifies a 3-pin DMX input, **RGBA** emitters, and 4-channel/8-channel modes. [QLC+'s corresponding definition][slimpar-qlc] independently lists the same color channels and channel counts. The fourth color is amber, not white. A generic RGBW mapping would be wrong.

These are community definitions, not a substitute for the fixture manual and a bench check. The OFL file itself flags an unresolved strobe-range question; do not infer exact strobe behavior from it without verification.

QLC+ also contains a [COLORband Q3BT definition][colorband-qlc] with RGBA channels and 4/6/16-channel modes. It is labeled **Q3BT**, not **Q3BT ILS**. It is a useful lead, but must not be presented as a verified profile for the exact ILS version.

The Boulder moving heads are described as warm-white/cool-white fixtures. Luma's current synthetic RGB moving-head profile is not an established mapping for them. The decoder's 8/16-bit options and the Eliminator's exact mode also need genuine channel definitions; do not assign speculative addresses or assume a final universe count yet.

### 4. Wired and wireless DMX share an output path

Wireless DMX equipment transports DMX commands between a compatible transmitter and receivers. It is not the same connection as Bluetooth or BTAir. Receivers can feed fixtures' DMX inputs; supported receiver families and fixture input connectors still need to match.

The recommended independent output architecture has an Art-Net backend on the Mac and a compatible Ethernet-to-DMX node if the existing USB box cannot be supported. [QLC+'s Art-Net documentation][artnet] documents a native implementation on macOS and interoperability with established network-to-DMX device families. This supports the architecture, not a claim that a specific current product or Luma itself has been tested.

Luma's older Python reference already contains a minimal ArtDmx sender. It is separate from the current interface and is not a production connector. Its presence does not validate physical output, discovery, manufacturer profiles, or reliability.

## Proposed implementation order

1. **Own discovery and evidence collection.** Obtain exact vendor documentation when network access permits. Prepare a simple Mac diagnostic for USB identity and Bluetooth discovery, keeping it separate from lighting output. The developer interprets the results.
2. **Build Luma's Mac connection layer.** Keep UI controls independent of transport. Support a documented Art-Net output path; add a myDMX USB backend only when its protocol and Mac support are established. Add a separate BTAir backend only after valid commands are known. A user-operated Luma connector avoids dependence on the incumbent lighting program.
3. **Create verified fixture profiles.** Map the real emitters and movement channels, the eight-strip decoder, the dimmer box, and multi-head/multi-zone fixtures correctly. Preserve the approved interface while adding hardware profiles separately from artwork.
4. **Test one device at a time.** Verify selection, basic dimming/color, transitions, output rate, blackout, deliberate reconnect, and device behavior on controller loss. For Bluetooth, progress from one light to all four and measure response and range. Confirm wireless DMX transmitter/receiver interoperability separately.
5. **Prepare for a full service.** Add durable show saving and recovery, clear connected/armed states, local operation during internet loss, and a tested fallback procedure. A browser tab closing or a disconnected link cannot itself guarantee that fixtures go dark; verify receiver behavior.

The source can remain entirely on GitHub. Physical control still needs a local running device with access to the lights. A small installed Mac connector is distinct from keeping a development checkout. Direct Chrome Bluetooth may reduce requirements for the Bluetooth-only portion. The proposed Art-Net route needs a local connector because ordinary browser pages cannot send its UDP packets directly. Browser USB would still require a supported browser and a verified protocol for the particular interface; independent access to the myDMX USB interface remains unverified.

## Limits of this research

Public GitHub source and documentation were accessible. The environment's network proxy returned 403 for the attempted official manufacturer sites and Apple documentation, including `www.chauvetdj.com`, `www.adj.com`, `www.nicolaudie.com`, `www.dmxsoft.com`, `dmxking.com`, `www.enttec.com`, and `developer.apple.com`. No network restriction was bypassed. No vendor SDK, licensing claim, exact current product recommendation, or complete manufacturer's Bluetooth protocol was verified.

Those seven research destinations were added to the cloud environment configuration draft while preserving its existing network presets. Saving that draft does not apply the changes to the running machine; the environment settings must be reviewed/saved and the environment published before relying on the new configuration. Manufacturer access must then be retried.

No physical device is attached to this cloud machine. There is no verified Luma hardware output, Mac connector release, BTAir control, or synchronized mixed-fixture show yet. This document narrows the engineering work; it does not mark the integration complete.

## Source snapshots

[qlc-usb]: https://github.com/mcallegari/qlcplus/blob/b3e82d587e4122607248c6f7c255db91c5d42954/resources/docs/html_en_EN/dmxusbplugin.html
[ola-issue]: https://github.com/OpenLightingProject/ola/issues/1082
[old-mydmx]: https://github.com/jesselang/mydmx/blob/3ed5e8ac7e7f339f50e503433c787d34ddb95308/src/mydmx.c#L17-L32
[siudi-match]: https://github.com/jduepmeier/artnet-siudi/blob/07ad3b2f2aff44b7c6e3d1a695ecb1e857113816/usb.c#L157-L170
[siudi-init]: https://github.com/jduepmeier/artnet-siudi/blob/07ad3b2f2aff44b7c6e3d1a695ecb1e857113816/usb.c#L46-L108
[siudi-wrapper]: https://github.com/acarreras/ofxDmxSuidi/blob/7bed819950715f14b36fc4e59ad94cc9404e1e76/readme.txt
[siudi-example]: https://github.com/okini3939/Siudi_test/blob/801316d1173bd8bab057e73d4735d831539bc34e/README.md
[bleak]: https://github.com/hbldh/bleak/blob/c7ca1b04b00b0bda5f98ccf9493e24784cfe869d/README.rst
[bleak-mac]: https://github.com/hbldh/bleak/blob/c7ca1b04b00b0bda5f98ccf9493e24784cfe869d/docs/backends/macos.rst
[bleak-connections]: https://github.com/hbldh/bleak/blob/c7ca1b04b00b0bda5f98ccf9493e24784cfe869d/bleak/__init__.py#L548
[web-bluetooth]: https://github.com/mdn/browser-compat-data/blob/0416078da7a1eafd7b308b37366eeac492bc1e46/api/Bluetooth.json
[slimpar-ofl]: https://github.com/OpenLightingProject/open-fixture-library/blob/82fa2646d57a38c09649f3f918aa16babcd01aa5/fixtures/chauvet-dj/slimpar-q12-bt.json
[slimpar-qlc]: https://github.com/mcallegari/qlcplus/blob/b3e82d587e4122607248c6f7c255db91c5d42954/resources/fixtures/Chauvet/Chauvet-SlimPAR-Q12BT.qxf
[colorband-qlc]: https://github.com/mcallegari/qlcplus/blob/b3e82d587e4122607248c6f7c255db91c5d42954/resources/fixtures/Chauvet/Chauvet-COLORband-Q3BT.qxf
[artnet]: https://github.com/mcallegari/qlcplus/blob/b3e82d587e4122607248c6f7c255db91c5d42954/resources/docs/html_en_EN/artnetplugin.html
