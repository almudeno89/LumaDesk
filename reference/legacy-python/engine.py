"""Original lighting prototype: explicit generic profiles, deterministic fades, ArtDmx/OSC.

No Lightkey binaries, images, profiles or proprietary code are used at runtime.
"""
import copy
import math
import struct
import uuid

PROFILES = {'RGB': ['r', 'g', 'b'], 'RGBW': ['r', 'g', 'b', 'w'],
            'Dimmer + RGB': ['dimmer', 'r', 'g', 'b'], 'Dimmer': ['dimmer']}


def number(value, low, high):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Expected a finite number')
    if not low <= value <= high:
        raise ValueError(f'Value must be between {low} and {high}')
    return value


def integer(value, low, high):
    n = number(value, low, high)
    if int(n) != n:
        raise ValueError('Expected a whole number')
    return int(n)


def label(value, length=80):
    if not isinstance(value, str) or not value.strip() or len(value) > length:
        raise ValueError(f'Text must contain 1–{length} characters')
    return value.strip()


def look(value):
    if not isinstance(value, dict):
        raise ValueError('Invalid fixture look')
    return {key: number(value[key], 0, 1) for key in ('level', 'r', 'g', 'b', 'w')}


def validate_project(project):
    if not isinstance(project, dict) or project.get('format') != 'luma-desk-v1':
        raise ValueError('Expected a Luma Desk v1 project')
    fixtures = project.get('fixtures')
    scenes = project.get('scenes')
    if not isinstance(fixtures, list) or not 1 <= len(fixtures) <= 128:
        raise ValueError('Use 1–128 fixtures')
    if not isinstance(scenes, list) or len(scenes) > 128:
        raise ValueError('Use at most 128 scenes')
    clean = {'format': 'luma-desk-v1', 'name': label(project.get('name')), 'fixtures': [], 'scenes': []}
    occupied, ids = set(), set()
    for f in fixtures:
        ident = label(f['id'])
        if ident in ids:
            raise ValueError('Duplicate fixture ID')
        ids.add(ident)
        profile = f['profile']
        if profile not in PROFILES:
            raise ValueError('Unknown profile; choose an explicit generic channel layout')
        address = integer(f['address'], 1, 512)
        if address + len(PROFILES[profile]) - 1 > 512:
            raise ValueError('Fixture extends beyond channel 512')
        slots = set(range(address, address + len(PROFILES[profile])))
        if occupied.intersection(slots):
            raise ValueError('Fixtures overlap in the DMX patch')
        occupied.update(slots)
        clean['fixtures'].append({'id': ident, 'name': label(f['name']), 'zone': label(f['zone']),
            'profile': profile, 'address': address, 'x': number(f['x'], 4, 96),
            'y': number(f['y'], 8, 86), **look(f)})
    scene_ids = set()
    for s in scenes:
        ident = label(s['id'])
        if ident in scene_ids:
            raise ValueError('Duplicate scene ID')
        scene_ids.add(ident)
        if set(s['looks']) != ids:
            raise ValueError('Scene must contain every patched fixture exactly once')
        clean['scenes'].append({'id': ident, 'name': label(s['name']),
            'fade': number(s['fade'], 0, 30), 'looks': {k: look(v) for k, v in s['looks'].items()}})
    return clean


def demo_project():
    fixtures = []
    for i in range(8):
        fixtures.append({'id': f'f{i + 1}', 'name': f'{"Wash" if i < 6 else "Front"} {i + 1 if i < 6 else i - 5}',
            'zone': 'Stage wash' if i < 6 else 'Front light', 'profile': 'RGBW',
            'address': i * 4 + 1, 'x': 12 + i * 15 if i < 6 else 30 + (i - 6) * 40,
            'y': 18 if i < 6 else 64, 'level': .7, 'r': .46, 'g': .35, 'b': 1, 'w': 0})
    scenes = []
    for name, rgb, level in [('Welcome', (1, .66, .3), .65), ('Worship', (.4, .28, 1), .85),
                             ('Message', (1, .87, .68), .42), ('Prayer', (.2, .55, 1), .25)]:
        looks = {}
        for f in fixtures:
            front = f['zone'] == 'Front light'
            color = (1, .82, .58) if front else rgb
            looks[f['id']] = dict(zip(('level', 'r', 'g', 'b', 'w'),
                (.8 if front else level, *color, .2 if front else 0)))
        scenes.append({'id': str(uuid.uuid4()), 'name': name, 'fade': 1.5, 'looks': looks})
    return validate_project({'format': 'luma-desk-v1', 'name': 'Sunday • Lighting Lab', 'fixtures': fixtures, 'scenes': scenes})


class Engine:
    def __init__(self, project=None):
        self.project = validate_project(project or demo_project())
        self.master = .8
        self.blackout = False
        self.fade = None
        self.active_scene = None

    def looks_at(self, now):
        base = {f['id']: look(f) for f in self.project['fixtures']}
        if not self.fade:
            return base
        start, duration, before, after = self.fade
        t = min(1, max(0, (now - start) / duration)) if duration else 1
        t = t * t * (3 - 2 * t)
        result = {ident: {k: before[ident][k] + (v - before[ident][k]) * t
                         for k, v in target.items()} for ident, target in after.items()}
        if t == 1:
            self.fade = None
        return result

    def frame(self, now):
        data = bytearray(512)
        current = self.looks_at(now)
        for f in self.project['fixtures']:
            state = current[f['id']]
            intensity = 0 if self.blackout else self.master * state['level']
            channels = PROFILES[f['profile']]
            for offset, prop in enumerate(channels):
                value = intensity if prop == 'dimmer' else state[prop] * (1 if 'dimmer' in channels else intensity)
                data[f['address'] - 1 + offset] = round(value * 255)
        return bytes(data)

    def freeze_fade(self, now):
        current = self.looks_at(now)
        for f in self.project['fixtures']:
            f.update(current[f['id']])
        self.fade = None

    def cue(self, scene_id, now):
        scene = next(s for s in self.project['scenes'] if s['id'] == scene_id)
        before = self.looks_at(now)
        after = copy.deepcopy(scene['looks'])
        for f in self.project['fixtures']:
            f.update(after[f['id']])
        self.fade = (now, scene['fade'], before, after)
        self.active_scene = scene_id


def artdmx(data, port_address=0, sequence=1):
    """Minimal unicast ArtDmx sender, not a complete Art-Net discovery/controller stack."""
    integer(port_address, 0, 32767)
    integer(sequence, 0, 255)
    if not isinstance(data, bytes) or not 2 <= len(data) <= 512 or len(data) % 2:
        raise ValueError('ArtDmx requires 2–512 slots and an even payload length')
    return b'Art-Net\0' + struct.pack('<H', 0x5000) + struct.pack('>H', 14) + bytes([sequence, 0]) + struct.pack('<H', port_address) + struct.pack('>H', len(data)) + data


def osc_message(address, value):
    if not isinstance(address, str) or not address.startswith('/') or '\0' in address or len(address) > 1024:
        raise ValueError('Paste an OSC address beginning with /')
    value = number(value, -1e6, 1e6)
    def osc_string(text):
        raw = text.encode('utf-8') + b'\0'
        return raw + b'\0' * (-len(raw) % 4)
    return osc_string(address) + osc_string(',f') + struct.pack('>f', value)
