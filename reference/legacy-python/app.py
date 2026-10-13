"""Run with Python 3.10+: python3 app.py. Default is preview only, loopback UI."""
import argparse
import copy
import ipaddress
import json
import os
from pathlib import Path
import secrets
import socket
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from engine import Engine, PROFILES, artdmx, osc_message, validate_project, label, number, integer
from inspect_lightkey import inspect_bytes

ROOT = Path(__file__).resolve().parent


class Runtime:
    def __init__(self, args):
        self.args = args
        self.lock = threading.RLock()
        self.engine = Engine()
        self.token = secrets.token_urlsafe(32)
        self.armed = False
        self.error = None
        self.sent = 0
        self.stop = threading.Event()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.settimeout(.05)
        self.thread = threading.Thread(target=self.tick, daemon=True)

    def tick(self):
        deadline = time.monotonic()
        seq = 1
        while not self.stop.is_set():
            with self.lock:
                if self.armed and self.args.artnet_target:
                    try:
                        self.sock.sendto(artdmx(self.engine.frame(time.monotonic()), self.args.port_address, seq),
                                         (self.args.artnet_target, 6454))
                        self.sent += 1
                        seq = seq % 255 + 1
                    except OSError as exc:
                        self.error = str(exc)
                        self.armed = False
            deadline += .025
            now = time.monotonic()
            if deadline < now:
                deadline = now
            self.stop.wait(max(0, deadline - now))

    def snapshot(self):
        with self.lock:
            now = time.monotonic()
            return {'project': copy.deepcopy(self.engine.project), 'looks': self.engine.looks_at(now),
                'master': self.engine.master, 'blackout': self.engine.blackout,
                'active_scene': self.engine.active_scene, 'fading': bool(self.engine.fade),
                'frame': list(self.engine.frame(now)), 'armed': self.armed,
                'target': self.args.artnet_target, 'port_address': self.args.port_address,
                'packets': self.sent, 'error': self.error,
                'osc_target': f'{self.args.osc_host}:{self.args.osc_port}' if self.args.osc_port else None}

    def blackout_output(self):
        was_armed = self.armed
        # Stop future frames even if sending the final blackout fails.
        self.armed = False
        if was_armed and self.args.artnet_target:
            old = self.engine.blackout
            self.engine.blackout = True
            try:
                for seq in (1, 2, 3):
                    self.sock.sendto(artdmx(self.engine.frame(time.monotonic()), self.args.port_address, seq),
                                     (self.args.artnet_target, 6454))
            except OSError as exc:
                self.error = 'Output stopped; final blackout could not be sent: ' + str(exc)
                raise
            finally:
                self.engine.blackout = old

    def action(self, body):
        with self.lock:
            e, now = self.engine, time.monotonic()
            op = body['op']
            if op == 'master':
                e.master = number(body['value'], 0, 1)
            elif op == 'blackout':
                if not isinstance(body['value'], bool): raise ValueError('Expected boolean')
                e.blackout = body['value']
            elif op == 'fixture':
                patch = body['patch']
                if not isinstance(patch, dict) or set(patch) - {'level', 'r', 'g', 'b', 'w', 'x', 'y'}:
                    raise ValueError('Unsupported fixture properties')
                chosen = set(body['ids'])
                if not chosen or chosen - {f['id'] for f in e.project['fixtures']}:
                    raise ValueError('Select valid fixtures')
                for k, v in patch.items(): number(v, 4 if k == 'x' else 8 if k == 'y' else 0, 96 if k == 'x' else 86 if k == 'y' else 1)
                e.freeze_fade(now)
                for f in e.project['fixtures']:
                    if f['id'] in chosen: f.update(patch)
                e.active_scene = None
            elif op == 'cue':
                e.cue(body['id'], now)
            elif op == 'save_scene':
                if len(e.project['scenes']) >= 128: raise ValueError('Scene limit reached')
                e.project['scenes'].append({'id': str(uuid.uuid4()), 'name': label(body['name']),
                    'fade': number(body['fade'], 0, 30), 'looks': copy.deepcopy(e.looks_at(now))})
            elif op == 'add_fixture':
                if self.armed: raise ValueError('Disarm output before changing the patch')
                p = copy.deepcopy(e.project)
                f = {'id': str(uuid.uuid4()), 'name': label(body['name']), 'zone': label(body['zone']),
                    'profile': body['profile'], 'address': integer(body['address'], 1, 512),
                    'x': 50, 'y': 45, 'level': 0, 'r': 1, 'g': 1, 'b': 1, 'w': 0}
                p['fixtures'].append(f)
                for s in p['scenes']: s['looks'][f['id']] = {k: f[k] for k in ('level', 'r', 'g', 'b', 'w')}
                e.project = validate_project(p)
                e.fade = None
            elif op == 'import':
                if self.armed: raise ValueError('Disarm output before importing')
                self.engine = Engine(validate_project(body['project']))
            elif op == 'arm':
                if not isinstance(body['value'], bool): raise ValueError('Expected boolean')
                if body['value']:
                    if not self.args.artnet_target: raise ValueError('Launch with an explicit Art-Net target first')
                    self.armed = True
                    self.error = None
                else:
                    self.blackout_output()
            elif op == 'osc':
                if not self.args.osc_port: raise ValueError('Launch with --osc-port to configure the bridge')
                packet = osc_message(body['address'], body['value'])
                self.sock.sendto(packet, (self.args.osc_host, self.args.osc_port))
            else:
                raise ValueError('Unknown action')
            return self.snapshot()


def handler(runtime):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass

        def reply(self, code, value, content_type='application/json'):
            data = value if isinstance(value, bytes) else json.dumps(value, allow_nan=False).encode()
            self.send_response(code)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('X-Frame-Options', 'DENY')
            self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(data)

        def valid_host(self):
            expected = {f'127.0.0.1:{runtime.args.port}', f'localhost:{runtime.args.port}'}
            if self.headers.get('Host') not in expected:
                self.reply(403, {'error': 'Local connections only'})
                return False
            return True

        def do_GET(self):
            if not self.valid_host(): return
            if self.path == '/':
                html = (ROOT / 'index.html').read_text().replace('__SESSION_TOKEN__', runtime.token)
                self.reply(200, html.encode(), 'text/html; charset=utf-8')
            elif self.path == '/api/state': self.reply(200, runtime.snapshot())
            elif self.path == '/api/project': self.reply(200, runtime.snapshot()['project'])
            else: self.reply(404, {'error': 'Not found'})

        def do_POST(self):
            if not self.valid_host(): return
            if not secrets.compare_digest(self.headers.get('X-Luma-Token', ''), runtime.token):
                self.reply(403, {'error': 'Missing session token'}); return
            origin = self.headers.get('Origin')
            if origin and origin not in {f'http://127.0.0.1:{runtime.args.port}', f'http://localhost:{runtime.args.port}'}:
                self.reply(403, {'error': 'Same-origin requests only'}); return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 16 * 1024 * 1024: raise ValueError('Invalid request size')
                raw = self.rfile.read(length)
                if self.path == '/api/inspect': result = inspect_bytes(raw)
                elif self.path == '/api/action': result = runtime.action(json.loads(raw))
                else: self.reply(404, {'error': 'Not found'}); return
                self.reply(200, result)
            except (ValueError, KeyError, TypeError, StopIteration, IndexError, OverflowError) as exc:
                self.reply(400, {'error': str(exc) or 'Invalid or missing value'})
            except OSError as exc:
                self.reply(503, {'error': str(exc)})
    return Handler


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--port', type=int, default=8768)
    p.add_argument('--artnet-target', help='Explicit receiver IPv4; output still requires Arm in the UI')
    p.add_argument('--port-address', type=int, default=0, help='Art-Net zero-based Port-Address')
    p.add_argument('--osc-host', default='127.0.0.1')
    p.add_argument('--osc-port', type=int, help='Exact port configured in Lightkey; no assumed default')
    args = p.parse_args()
    integer(args.port, 1024, 65535)
    integer(args.port_address, 0, 32767)
    if args.artnet_target:
        ip = ipaddress.IPv4Address(args.artnet_target)
        if ip.is_multicast or ip.is_unspecified or str(ip) == '255.255.255.255':
            p.error('Use a specific unicast receiver address')
    if args.osc_port:
        integer(args.osc_port, 1, 65535)
        ipaddress.IPv4Address(args.osc_host)
    runtime = Runtime(args)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler(runtime))
    runtime.thread.start()
    print(f'Luma Desk preview: http://127.0.0.1:{args.port} — output DISARMED', flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally:
        runtime.stop.set()
        runtime.thread.join(timeout=1)
        with runtime.lock:
            try: runtime.blackout_output()
            except OSError: pass
        runtime.sock.close()
        server.server_close()


if __name__ == '__main__': main()
