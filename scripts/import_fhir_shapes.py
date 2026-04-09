#!/usr/bin/env python3
"""
Parse sparql/files/fhir.shex and upload each shape as a separate ShExMap
entry via the repository API.

Usage:
    python scripts/import_fhir_shapes.py [--api-url http://localhost/api/v1] [--dry-run]

Each top-level shape (lines starting with `<ShapeName>`) becomes one ShExMap.
The global PREFIX block and the value sets referenced by that shape are
prepended/appended so that each entry is fully self-contained and can be
validated independently.  The comment line immediately preceding the shape
(if any) is used as the description.

If the local ShEx file is not found it is automatically downloaded from
--source-url and saved in place.  Pass --no-download to disable this.
"""

import argparse
import re
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests is not installed.  Run: pip install requests")

# ── Parse arguments ────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("--api-url", default="http://localhost/api/v1", help="Base URL of the API (default: http://localhost/api/v1)")
parser.add_argument("--shex-file", default="data/fhir.shex", help="Path to the ShEx file (default: data/fhir.shex)")
parser.add_argument("--no-download", action="store_true", help="Do not download fhir.shex from source-url even if the local file is missing")
parser.add_argument("--source-url", default="https://build.fhir.org/fhir.shex", help="sourceUrl stored on each ShExMap (dct:source)")
parser.add_argument("--delay", type=float, default=0.05, help="Seconds to wait between API calls (default: 0.05)")
parser.add_argument("--dry-run", action="store_true", help="Parse and show what would be uploaded; make no API calls")
parser.add_argument("--limit", type=int, default=0, help="Stop after uploading this many shapes (0 = all)")
parser.add_argument("--skip", type=int, default=0, help="Skip the first N shapes (useful for resuming)")
parser.add_argument("--api-key", default="", help="Optional X-API-Key header value")
args = parser.parse_args()

# ── Locate the ShEx file ───────────────────────────────────────────────────────

shex_path = Path(args.shex_file)
if not shex_path.is_absolute():
    repo_root = Path(__file__).parent.parent
    shex_path = repo_root / shex_path

if not shex_path.exists():
    if args.no_download:
        sys.exit(f"ShEx file not found: {shex_path}")
    print(f"Local file not found: {shex_path}")
    print(f"Downloading from {args.source_url} …", flush=True)
    try:
        resp = requests.get(args.source_url, timeout=120)
        resp.raise_for_status()
    except requests.RequestException as exc:
        sys.exit(f"Download failed: {exc}")
    shex_path.parent.mkdir(parents=True, exist_ok=True)
    shex_path.write_text(resp.text, encoding="utf-8")
    print(f"Saved to {shex_path} ({len(resp.content):,} bytes)\n")

raw = shex_path.read_text(encoding="utf-8")
lines = raw.splitlines()

# ── Extract global PREFIX block ────────────────────────────────────────────────
# Everything before the first `<ShapeName>` line.

shape_start_re = re.compile(r'^<\w')
valueset_start_re = re.compile(r'^fhirvs:\S+\s+\[')

prefix_lines: list[str] = []
for line in lines:
    if shape_start_re.match(line):
        break
    prefix_lines.append(line)

while prefix_lines and not prefix_lines[-1].strip():
    prefix_lines.pop()

prefix_block = "\n".join(prefix_lines)

# ── Extract value sets ─────────────────────────────────────────────────────────
# Value sets appear after `#--- Value Sets ---` near the end of the file.
# Each is a single line:  fhirvs:name ["val1" "val2" ...]
# We also capture the optional comment on the line immediately before it.

# dict: vs_name (str without "fhirvs:" prefix) → full definition line(s)
value_sets: dict[str, str] = {}
# dict: vs_name → description comment
value_set_comments: dict[str, str] = {}

in_vs_section = False
for idx, line in enumerate(lines):
    if '#' in line and 'Value Set' in line:
        in_vs_section = True
        continue
    if not in_vs_section:
        continue
    m = valueset_start_re.match(line)
    if m:
        vs_key = line.split('[')[0].strip()          # e.g. "fhirvs:account-status"
        short = vs_key.replace('fhirvs:', '')
        value_sets[short] = line
        # look back for comment
        j = idx - 1
        while j >= 0 and not lines[j].strip():
            j -= 1
        if j >= 0 and lines[j].startswith('#') and 'Value Set' not in lines[j]:
            value_set_comments[short] = lines[j].lstrip('# ').strip()

print(f"Parsed {len(value_sets)} value sets from {shex_path.name}")

# ── Parse shapes ───────────────────────────────────────────────────────────────

Shape = dict

shapes: list[Shape] = []
i = 0
n = len(lines)

# Stop before the value-set section so we don't mistake `fhirvs:` lines as shapes
vs_section_start = next(
    (k for k, l in enumerate(lines) if '#' in l and 'Value Set' in l),
    n
)

while i < vs_section_start:
    line = lines[i]

    if not shape_start_re.match(line):
        i += 1
        continue

    name_match = re.match(r'^<(\w+)>', line)
    shape_name = name_match.group(1) if name_match else line.strip().lstrip('<').split('>')[0]

    # Look back for an optional comment
    description = ""
    j = i - 1
    while j >= 0 and not lines[j].strip():
        j -= 1
    if j >= 0 and lines[j].startswith('#'):
        description = lines[j].lstrip('# ').strip()

    # Collect the shape body by tracking brace depth
    shape_lines: list[str] = [line]
    depth = line.count('{') - line.count('}')

    if depth <= 0:
        i += 1
    else:
        i += 1
        while i < vs_section_start and depth > 0:
            l = lines[i]
            shape_lines.append(l)
            depth += l.count('{') - l.count('}')
            i += 1

    shape_content = "\n".join(shape_lines)

    shapes.append({
        "name": shape_name,
        "description": description,
        "raw_content": shape_content,
    })

print(f"Parsed {len(shapes)} shapes from {shex_path.name}")

# ── Attach referenced value sets to each shape ────────────────────────────────
# Find every `fhirvs:xyz` token in the shape body and append those definitions.

fhirvs_ref_re = re.compile(r'fhirvs:([\w\-]+)')

for shape in shapes:
    refs = set(fhirvs_ref_re.findall(shape["raw_content"]))
    # sort for deterministic output
    vs_lines: list[str] = []
    for vs_name in sorted(refs):
        if vs_name in value_sets:
            comment = value_set_comments.get(vs_name)
            if comment:
                vs_lines.append(f"# {comment}")
            vs_lines.append(value_sets[vs_name])

    vs_block = ("\n\n#--- Value Sets ---\n\n" + "\n".join(vs_lines)) if vs_lines else ""
    shape["content"] = f"{prefix_block}\n\n{shape['raw_content']}{vs_block}"
    shape["value_sets"] = sorted(refs & value_sets.keys())

# ── Dry-run output ─────────────────────────────────────────────────────────────

if args.dry_run:
    for s in shapes[:5]:
        print(f"\n── {s['name']} ──")
        print(f"  description : {s['description'] or '(none)'}")
        print(f"  value sets  : {s['value_sets'] or '(none)'}")
        print(f"  content     : {len(s['content'])} chars, {s['content'].count(chr(10))+1} lines")
    if len(shapes) > 5:
        print(f"\n  … and {len(shapes)-5} more shapes.")
    sys.exit(0)

# ── Upload via API ─────────────────────────────────────────────────────────────

endpoint = f"{args.api_url.rstrip('/')}/shexmaps"
headers = {"Content-Type": "application/json"}
if args.api_key:
    headers["X-API-Key"] = args.api_key

to_upload = shapes[args.skip:]
if args.limit:
    to_upload = to_upload[:args.limit]

print(f"Uploading {len(to_upload)} shapes to {endpoint}")
if args.skip:
    print(f"  (skipping first {args.skip})")

ok = 0
failed = 0
skipped_existing = 0

for idx, shape in enumerate(to_upload, start=1):
    payload = {
        "title": f"FHIR {shape['name']}",
        "description": shape["description"],
        "content": shape["content"],
        "fileName": shex_path.name,
        "fileFormat": "shexc",
        "sourceUrl": args.source_url,
        "tags": ["fhir", "hl7", "r5"],
        "version": "1.0.0",
    }

    try:
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
    except requests.RequestException as exc:
        print(f"  [{idx}/{len(to_upload)}] {shape['name']:40s}  ERROR  {exc}", flush=True)
        failed += 1
        continue

    if resp.status_code == 201:
        created = resp.json()
        print(f"  [{idx}/{len(to_upload)}] {shape['name']:40s}  created  id={created.get('id','?')}", flush=True)
        ok += 1
    elif resp.status_code == 409:
        print(f"  [{idx}/{len(to_upload)}] {shape['name']:40s}  skipped (already exists)", flush=True)
        skipped_existing += 1
    else:
        body = resp.text[:200]
        print(f"  [{idx}/{len(to_upload)}] {shape['name']:40s}  FAILED  {resp.status_code}  {body}", flush=True)
        failed += 1

    if args.delay:
        time.sleep(args.delay)

print(f"\nDone — created: {ok}, skipped: {skipped_existing}, failed: {failed}")
