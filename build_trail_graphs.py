#!/usr/bin/env python3
"""Build compact, deploy-time OSM hiking graphs for major Japanese Alps regions.

The generated files are part of the deployed app artifact and are used before
runtime Overpass fallback. Data source: OpenStreetMap contributors (ODbL).
"""
from __future__ import annotations

import argparse
import gzip
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent
OUT = BASE / "trail_data"
OUT.mkdir(exist_ok=True)

ENDPOINTS = [x.strip() for x in os.environ.get(
    "TRAIL_BUILD_OVERPASS_ENDPOINTS",
    "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter"
).split(",") if x.strip()]
TIMEOUT = int(os.environ.get("TRAIL_BUILD_TIMEOUT", "180"))
RETRIES = int(os.environ.get("TRAIL_BUILD_RETRIES", "2"))
STRICT = os.environ.get("STRICT_TRAIL_BUILD", "0").lower() in {"1","true","yes"}
UA = os.environ.get("UPSTREAM_USER_AGENT", "MountainWeatherDecision/5.5.1 trail-builder")

# Broad mountain-range boxes, intentionally split so runtime loads only one graph.
# [south, west, north, east]
REGIONS = [
    {"id":"north_alps_north", "name":"北アルプス北部（白馬・唐松・五竜・鹿島槍）", "bbox":[36.45,137.55,36.95,137.98]},
    {"id":"north_alps_tateyama", "name":"立山・剱・薬師・黒部源流", "bbox":[36.25,137.20,36.80,137.75]},
    {"id":"north_alps_south", "name":"北アルプス南部（槍・穂高・常念・燕）", "bbox":[35.95,137.45,36.55,137.95]},
    {"id":"north_alps_norikura", "name":"乗鞍・焼岳周辺", "bbox":[35.75,137.35,36.20,137.80]},
    {"id":"central_alps", "name":"中央アルプス（木曽駒・空木・越百）", "bbox":[35.45,137.65,35.95,138.05]},
    {"id":"south_alps_north", "name":"南アルプス北部（甲斐駒・仙丈・北岳・間ノ岳）", "bbox":[35.55,137.95,36.05,138.55]},
    {"id":"south_alps_central", "name":"南アルプス中部（塩見・荒川・赤石）", "bbox":[35.05,137.95,35.65,138.48]},
    {"id":"south_alps_south", "name":"南アルプス南部（聖・光・茶臼）", "bbox":[34.65,137.95,35.25,138.45]},
]


def haversine(a,b,c,d):
    r=6371000.0; p=math.pi/180.0
    x=math.sin((c-a)*p/2)**2 + math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*r*math.asin(math.sqrt(x))


def fetch_overpass(query: str) -> dict:
    errors=[]
    for attempt in range(RETRIES):
        for endpoint in ENDPOINTS:
            try:
                data=urllib.parse.urlencode({"data":query}).encode()
                req=urllib.request.Request(endpoint,data=data,method="POST",headers={
                    "User-Agent":UA,"Accept":"application/json",
                    "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
                })
                with urllib.request.urlopen(req,timeout=TIMEOUT) as resp:
                    if resp.status != 200:
                        raise RuntimeError(f"HTTP {resp.status}")
                    return json.loads(resp.read().decode("utf-8"))
            except Exception as exc:
                errors.append(f"{endpoint}: {exc}")
        time.sleep(2 + attempt*3)
    raise RuntimeError(" / ".join(errors[-6:]))


def build_region(region: dict) -> dict:
    s,w,n,e=region["bbox"]
    q=(
        f'[out:json][timeout:150];('
        f'way["highway"~"path|footway|steps|bridleway"]["access"!="private"]({s},{w},{n},{e});'
        f'way["highway"="track"]["access"!="private"]["sac_scale"]({s},{w},{n},{e});'
        f'way["highway"="track"]["access"!="private"]["trail_visibility"]({s},{w},{n},{e});'
        f'way["highway"="track"]["access"!="private"]["name"]({s},{w},{n},{e});'
        f');(._;>;);out body;'
    )
    raw=fetch_overpass(q)
    node_raw={int(el["id"]):(float(el["lat"]),float(el["lon"])) for el in raw.get("elements",[])
              if el.get("type")=="node" and "lat" in el and "lon" in el}
    used=set(); edges=[]
    for el in raw.get("elements",[]):
        if el.get("type")!="way" or not isinstance(el.get("nodes"),list): continue
        tags=el.get("tags") or {}
        hw=tags.get("highway","")
        penalty=1.35 if hw=="steps" else 1.08 if hw=="track" else 1.0
        ids=el["nodes"]
        for i in range(1,len(ids)):
            a,b=int(ids[i-1]),int(ids[i])
            if a not in node_raw or b not in node_raw: continue
            aa=node_raw[a]; bb=node_raw[b]
            dist=haversine(aa[0],aa[1],bb[0],bb[1])
            if dist<=0 or dist>3000: continue
            used.add(a); used.add(b)
            edges.append([a,b,round(dist*penalty,1)])
    nodes=[[nid,round(node_raw[nid][0],6),round(node_raw[nid][1],6)] for nid in sorted(used)]
    payload={
        "schema":1,"region":region["id"],"name":region["name"],"bbox":region["bbox"],
        "source":"OpenStreetMap","license":"ODbL","attribution":"© OpenStreetMap contributors",
        "generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
        "nodes":nodes,"edges":edges,
    }
    path=OUT/f'{region["id"]}.json.gz'
    with gzip.open(path,"wt",encoding="utf-8",compresslevel=9) as f:
        json.dump(payload,f,ensure_ascii=False,separators=(",",":"))
    return {**region,"file":path.name,"nodes":len(nodes),"edges":len(edges),"bytes":path.stat().st_size,"ready":True}


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--region",action="append",help="region id; may be repeated")
    args=ap.parse_args()
    chosen=[r for r in REGIONS if not args.region or r["id"] in set(args.region)]
    results=[]; failures=[]
    print(f"Building {len(chosen)} Japanese Alps trail regions into {OUT}",flush=True)
    for i,r in enumerate(chosen,1):
        print(f"[{i}/{len(chosen)}] {r['name']} ...",flush=True)
        try:
            meta=build_region(r); results.append(meta)
            print(f"  OK nodes={meta['nodes']} edges={meta['edges']} size={meta['bytes']/1024/1024:.1f}MB",flush=True)
        except Exception as exc:
            failures.append((r,str(exc)))
            print(f"  WARN failed: {exc}",flush=True)
            results.append({**r,"file":f"{r['id']}.json.gz","nodes":0,"edges":0,"bytes":0,"ready":False})
    manifest={
        "schema":1,"app_version":"5.5.1","generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
        "source":"OpenStreetMap","license":"ODbL","attribution":"© OpenStreetMap contributors",
        "regions":results,
    }
    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"Manifest written. ready={sum(1 for r in results if r['ready'])}/{len(results)}",flush=True)
    if failures and STRICT:
        return 2
    return 0

if __name__=="__main__":
    raise SystemExit(main())
