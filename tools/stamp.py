#!/usr/bin/env python3
"""Stamp a content hash into index.html and sw.js (?v=<hash> / VERSION) for cache busting.
Run before each deploy. Idempotent: re-stamping replaces the previous hash."""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def content_hash():
    h = hashlib.sha256()
    for sub in ("js", "css", "data"):
        d = os.path.join(ROOT, sub)
        for name in sorted(os.listdir(d)):
            p = os.path.join(d, name)
            if os.path.isfile(p):
                h.update(name.encode())
                h.update(open(p, "rb").read())
    return h.hexdigest()[:8]


def stamp_file(path, stamp):
    src = open(path, encoding="utf-8").read()
    # guard fresh placeholders, restamp previous hashes (incl. double-stamped v=v=), restore
    out = src.replace("__STAMP__", "\x00")
    out = re.sub(r"v=v=[0-9a-f]{8}|v=[0-9a-f]{8}", "v=" + stamp, out)
    out = out.replace("\x00", stamp)
    out = re.sub(r'const VERSION = "[^"]*"', 'const VERSION = "%s"' % stamp, out)
    if out != src:
        open(path, "w", encoding="utf-8", newline="\n").write(out)
    return True


def main():
    stamp = content_hash()
    for f in ("index.html", "sw.js"):
        stamp_file(os.path.join(ROOT, f), stamp)
    print("stamped v=" + stamp)


if __name__ == "__main__":
    main()
