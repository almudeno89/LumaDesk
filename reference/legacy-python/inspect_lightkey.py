"""Read-only structural inspector. Parses data without instantiating Cocoa classes."""
import argparse
import collections
import json
import plistlib
from pathlib import Path


def inspect_bytes(raw):
    if len(raw) > 16 * 1024 * 1024:
        raise ValueError('Inspection is limited to 16 MiB per file')
    archive = plistlib.loads(raw)
    if not isinstance(archive, dict) or archive.get('$archiver') != 'NSKeyedArchiver':
        raise ValueError('Not an NSKeyedArchiver property list')
    objects = archive.get('$objects')
    if not isinstance(objects, list) or len(objects) > 100000:
        raise ValueError('Unsupported object table')
    def ref(value):
        if isinstance(value, plistlib.UID):
            if not 0 <= value.data < len(objects):
                raise ValueError('Invalid archive reference')
            return objects[value.data]
        return value
    def cls(obj):
        if not isinstance(obj, dict):
            return None
        meta = ref(obj.get('$class'))
        return meta.get('$classname') if isinstance(meta, dict) else None
    def scalar(value):
        value = ref(value)
        if isinstance(value, dict) and cls(value) == 'NSMutableString':
            value = ref(value.get('NS.string'))
        return value if isinstance(value, (str, int, float, bool)) else None
    def fields(obj, names):
        return {k: scalar(obj.get(k)) for k in names}
    counts = collections.Counter(cls(o) for o in objects if cls(o))
    fixtures, cues, profiles, midi = [], [], [], []
    for obj in objects:
        kind = cls(obj)
        if kind == 'LXDMXFixture':
            fixtures.append(fields(obj, ('shortName', 'address', 'personalityIndex', 'comments')))
        elif kind == 'LXCue':
            cues.append(fields(obj, ('name', 'fadeInDuration', 'fadeOutDuration', 'holdDuration', 'priority')))
        elif kind == 'LXFixtureProfile':
            profiles.append(fields(obj, ('manufacturer', 'name', 'comments')))
        elif kind == 'LXMIDITrigger':
            midi.append(fields(obj, ('channel', 'commandType', 'controllerNumber', 'controllerValue', 'triggerType')))
    return {'archive': 'NSKeyedArchiver', 'bytes': len(raw), 'objects': len(objects),
        'app_version': scalar(archive.get('$top', {}).get('appVersion')),
        'counts': dict(sorted(counts.items())), 'fixtures': fixtures, 'cues': cues,
        'profiles': profiles, 'midi_triggers': midi,
        'limitations': ['Read-only inventory, not a playback-compatible import.',
            'Address and MIDI channel fields are raw stored values; numbering conventions require validation.',
            'Preset values, effects, cue relationships and fixture channel capabilities are not converted.',
            'No project or profile contents are modified. Unknown fields are ignored.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project', type=Path)
    args = parser.parse_args()
    print(json.dumps(inspect_bytes(args.project.read_bytes()), ensure_ascii=False, indent=2, allow_nan=False))
