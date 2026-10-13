"""Behavior and packet tests. No physical lighting hardware is contacted."""
import copy
import json
import math
from pathlib import Path
import socket
import struct
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from app import Runtime
from engine import Engine, artdmx, osc_message, validate_project
from inspect_lightkey import inspect_bytes


class LightingTests(unittest.TestCase):
    def test_patch_bounds_overlap_and_nonfinite(self):
        base = Engine().project
        for key, val in [('address', 0), ('address', 511), ('level', math.nan)]:
            with self.subTest(key=key, value=val):
                p = copy.deepcopy(base); p['fixtures'][0][key] = val
                with self.assertRaises(ValueError): validate_project(p)
        p = copy.deepcopy(base); p['fixtures'][1]['address'] = 1
        with self.assertRaises(ValueError): validate_project(p)

    def test_master_and_blackout_restore(self):
        e = Engine(); normal = e.frame(1)
        self.assertEqual(len(normal), 512)
        self.assertEqual(normal[0], round(.46 * .7 * .8 * 255))
        e.blackout = True
        self.assertEqual(e.frame(1), bytes(512))
        e.blackout = False
        self.assertEqual(e.frame(1), normal)
        e.master = 0
        self.assertEqual(e.frame(1), bytes(512))

    def test_separate_dimmer_not_double_applied(self):
        e = Engine(); e.project['fixtures'][0]['profile'] = 'Dimmer + RGB'
        frame = e.frame(1)
        self.assertEqual(frame[0], round(.7 * .8 * 255))
        self.assertEqual(frame[1], round(.46 * 255))
        e.blackout = True
        self.assertEqual(e.frame(1)[0], 0)
        self.assertEqual(e.frame(1)[1], round(.46 * 255))

    def test_fade_midpoint_end_and_retarget_continuity(self):
        e = Engine(); before = e.looks_at(10)
        first, second = e.project['scenes'][:2]
        e.cue(first['id'], 10)
        self.assertEqual(e.looks_at(10), before)
        half = e.looks_at(10.75)
        self.assertAlmostEqual(half['f1']['r'], (before['f1']['r'] + first['looks']['f1']['r']) / 2)
        e.cue(second['id'], 10.75)
        self.assertEqual(e.looks_at(10.75), half)
        self.assertEqual(e.looks_at(12.25), second['looks'])
        self.assertIsNone(e.fade)

    def test_export_import_roundtrip(self):
        e = Engine(); encoded = json.dumps(e.project)
        restored = Engine(json.loads(encoded))
        self.assertEqual(restored.frame(1), e.frame(1))

    def test_artdmx_packet_encoding(self):
        data = bytes(range(256)) * 2
        packet = artdmx(data, port_address=0x1234, sequence=255)
        self.assertEqual(packet[:18], b'Art-Net\x00\x00\x50\x00\x0e\xff\x00\x34\x12\x02\x00')
        self.assertEqual(packet[18:], data)
        with self.assertRaises(ValueError): artdmx(b'123')

    def test_osc_packet_encoding(self):
        packet = osc_message('/test/cue', 1.0)
        self.assertEqual(packet, b'/test/cue\x00\x00\x00,f\x00\x00' + struct.pack('>f', 1))
        with self.assertRaises(ValueError): osc_message('bad', 1)

    def assert_loopback_delivery(self, packet):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as rx, socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as tx:
            try:
                rx.bind(('127.0.0.1', 0))
            except PermissionError as exc:
                self.skipTest('Environment blocks UDP bind; transport unverified: ' + str(exc))
            rx.settimeout(1)
            tx.sendto(packet, rx.getsockname()); received, _ = rx.recvfrom(1024)
        self.assertEqual(received, packet)

    def test_artdmx_over_real_loopback_udp(self):
        self.assert_loopback_delivery(artdmx(bytes(range(256)) * 2, 0x1234, 255))

    def test_osc_over_real_loopback_udp(self):
        self.assert_loopback_delivery(osc_message('/test/cue', 1.0))

    def test_disarm_stops_output_even_if_blackout_send_fails(self):
        with patch('app.socket.socket') as socket_factory:
            runtime = Runtime(SimpleNamespace(artnet_target='127.0.0.1', port_address=0))
            runtime.armed = True
            before = runtime.engine.frame(0)
            socket_factory.return_value.sendto.side_effect = OSError('Simulated transport failure')
            with self.assertRaises(OSError): runtime.blackout_output()
            self.assertFalse(runtime.armed)
            self.assertFalse(runtime.engine.blackout)
            self.assertEqual(runtime.engine.frame(0), before)
            self.assertIn('final blackout could not be sent', runtime.error)
            runtime.blackout_output()
            self.assertEqual(socket_factory.return_value.sendto.call_count, 1)

    def test_disarm_sends_dark_frames_and_preserves_preview(self):
        with patch('app.socket.socket') as socket_factory:
            runtime = Runtime(SimpleNamespace(artnet_target='127.0.0.1', port_address=0))
            runtime.armed = True
            before = runtime.engine.frame(0)
            runtime.blackout_output()
            calls = socket_factory.return_value.sendto.call_args_list
            self.assertEqual(len(calls), 3)
            self.assertTrue(all(c.args[0][18:] == bytes(512) for c in calls))
            self.assertFalse(runtime.armed)
            self.assertEqual(runtime.engine.frame(0), before)

    def test_inspector_on_installed_demo(self):
        path = Path('/Applications/Lightkey.app/Contents/Resources/Demo Project.lightkeyproj')
        if not path.exists(): self.skipTest('Lightkey demo is not installed')
        before = path.read_bytes(); result = inspect_bytes(before)
        self.assertGreater(len(result['fixtures']), 0)
        self.assertGreater(len(result['cues']), 0)
        self.assertEqual(before, path.read_bytes())
        json.dumps(result, allow_nan=False)


if __name__ == '__main__': unittest.main(verbosity=2)
