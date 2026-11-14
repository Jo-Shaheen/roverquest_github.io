#!/usr/bin/env python3
"""Run LOCALLY (needs internet). For every 'source_verified' entry: download image_remote into
assets/hardware/<mission>/, check it really is a JPEG/PNG of reasonable size, then set
status 'locally_acquired' and 'image' to the local path. Failures are listed, never faked.
Usage (from project root): python3 tools/download_photos.py
Not run in the authoring sandbox (no network)."""
import json, os, re, urllib.request
p = "data/hardware-images.json"; d = json.load(open(p, encoding="utf-8")); fails = []
def img_ext(b):
    if len(b) <= 5000: return None
    if b[:3] == b"\xff\xd8\xff": return ".jpg"
    if b[:8] == b"\x89PNG\r\n\x1a\n": return ".png"
    if b[:6] in (b"GIF87a", b"GIF89a"): return ".gif"
    return None
for it in d["items"]:
    if it["status"] != "source_verified": continue
    folder = os.path.join("assets", "hardware", re.sub(r"\W+", "-", it["mission"]).lower()); os.makedirs(folder, exist_ok=True)
    try:
        data = urllib.request.urlopen(urllib.request.Request(it["image_remote"], headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read()
        ext = img_ext(data)
        if not ext: raise ValueError("not a valid JPEG/PNG/GIF image")
        dest = os.path.join(folder, f'{it["component"]}-{it["nasaId"] or "nasa"}{ext}')
        open(dest, "wb").write(data); it["image"] = dest.replace(os.sep, "/"); it["status"] = "locally_acquired"; print("ok  ", dest, len(data))
    except Exception as e:
        fails.append(it["component"]); print("FAIL", it["mission"], it["component"], it["image_remote"], e)
json.dump(d, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print("\nUnresolved or failed:", fails or "none")
