#!/usr/bin/env python3
"""Run LOCALLY (needs internet). Lists candidate NASA photographs for every unresolved
entry in data/hardware-images.json so a human can verify each one before it is added.
Nothing is downloaded or marked 'acquired' automatically.
Usage: python3 tools/find_nasa_photos.py [mission-substring]
NOTE: written without network access in the authoring sandbox; it has NOT been run."""
import json, sys, urllib.parse, urllib.request
flt = (sys.argv[1] if len(sys.argv) > 1 else "").lower()
data = json.load(open("data/hardware-images.json"))
for it in data["items"]:
    if it["status"] != "unresolved" or flt not in it["mission"].lower():
        continue
    term = it["research"][0]["label"].split(": ", 1)[-1]
    url = "https://images-api.nasa.gov/search?media_type=image&q=" + urllib.parse.quote(term)
    try:
        items = json.load(urllib.request.urlopen(url, timeout=30))["collection"]["items"][:8]
    except Exception as e:
        print(f"## {it['mission']} / {it['component']}: request failed ({e})"); continue
    print(f"\n## {it['mission']} / {it['component']}  (query: {term})")
    for r in items:
        d = r["data"][0]
        print(f"- {d.get('nasa_id')} | {d.get('title')} | {d.get('date_created','')[:10]} | {d.get('photographer') or d.get('secondary_creator') or d.get('center')}")
        print(f"  manifest: https://images-api.nasa.gov/asset/{d.get('nasa_id')}")
