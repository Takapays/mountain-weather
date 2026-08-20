#!/usr/bin/env python3
"""Mountain Weather Decision V5.5.1 production web server.

Serves the static frontend and provides same-origin proxy endpoints for the
external weather / geocoding / elevation / Overpass services used by app.js.
Designed to run locally with `python server.py` and in production with Gunicorn.
"""

from __future__ import annotations

import gzip
import heapq
import json
import math
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import OrderedDict
from typing import Any

from flask import Flask, Response, jsonify, request, send_from_directory

BASE = os.path.dirname(os.path.abspath(__file__))
APP_VERSION = "5.5.1"
PORT = int(os.environ.get("PORT", "8000"))
UPSTREAM_TIMEOUT = int(os.environ.get("UPSTREAM_TIMEOUT", "45"))
OVERPASS_TIMEOUT = int(os.environ.get("OVERPASS_TIMEOUT", "70"))
CACHE_TTL = int(os.environ.get("CACHE_TTL", "120"))
OVERPASS_CACHE_TTL = int(os.environ.get("OVERPASS_CACHE_TTL", "86400"))
CACHE_MAX_ITEMS = int(os.environ.get("CACHE_MAX_ITEMS", "256"))
MAX_OVERPASS_BYTES = int(os.environ.get("MAX_OVERPASS_BYTES", str(512 * 1024)))

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
USAGE_LOG_STDOUT = os.environ.get("USAGE_LOG_STDOUT", "1").lower() not in {"0", "false", "no"}
USAGE_EVENT_TIMEOUT = int(os.environ.get("USAGE_EVENT_TIMEOUT", "8"))
USAGE_EVENT_MAX_BYTES = int(os.environ.get("USAGE_EVENT_MAX_BYTES", str(32 * 1024)))

ALLOWED_EVENT_NAMES = {
    "page_view",
    "route_candidates_loaded",
    "route_created",
    "trail_route_calculated",
    "arrival_times_calculated",
    "weather_analysis",
}

ALLOWED_HOSTS = {
    "api.open-meteo.com",
    "geocoding-api.open-meteo.com",
    "nominatim.openstreetmap.org",
}

OVERPASS_ENDPOINTS = [
    x.strip()
    for x in os.environ.get(
        "OVERPASS_ENDPOINTS",
        "https://overpass-api.de/api/interpreter,"
        "https://overpass.kumi.systems/api/interpreter,"
        "https://lz4.overpass-api.de/api/interpreter,"
        "https://overpass.private.coffee/api/interpreter",
    ).split(",")
    if x.strip()
]

UA = os.environ.get(
    "UPSTREAM_USER_AGENT",
    "MountainWeatherDecision/5.5",
)

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_OVERPASS_BYTES

_cache: "OrderedDict[str, tuple[float, int, str, bytes]]" = OrderedDict()
_cache_lock = threading.Lock()

TRAIL_DATA_DIR = os.path.join(BASE, "trail_data")
TRAIL_GRAPH_CACHE_MAX = int(os.environ.get("TRAIL_GRAPH_CACHE_MAX", "2"))
_trail_graph_cache: "OrderedDict[str, dict[str, Any]]" = OrderedDict()
_trail_graph_lock = threading.Lock()


def _load_trail_manifest() -> dict[str, Any]:
    path = os.path.join(TRAIL_DATA_DIR, "manifest.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"schema": 1, "regions": []}


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p = math.pi / 180.0
    dlat = (lat2 - lat1) * p
    dlon = (lon2 - lon1) * p
    x = math.sin(dlat / 2) ** 2 + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(x))


def _load_trail_graph(region: dict[str, Any]) -> dict[str, Any] | None:
    rid = str(region.get("id") or "")
    if not rid or not region.get("ready"):
        return None
    with _trail_graph_lock:
        if rid in _trail_graph_cache:
            _trail_graph_cache.move_to_end(rid)
            return _trail_graph_cache[rid]
    filename = os.path.basename(str(region.get("file") or f"{rid}.json.gz"))
    path = os.path.join(TRAIL_DATA_DIR, filename)
    if not os.path.isfile(path):
        return None
    try:
        with gzip.open(path, "rt", encoding="utf-8") as f:
            raw = json.load(f)
        nodes = {int(row[0]): (float(row[1]), float(row[2])) for row in raw.get("nodes", [])}
        adj: dict[int, list[tuple[int, float]]] = {}
        for row in raw.get("edges", []):
            a, b, w = int(row[0]), int(row[1]), float(row[2])
            if a not in nodes or b not in nodes:
                continue
            adj.setdefault(a, []).append((b, w))
            adj.setdefault(b, []).append((a, w))
        graph = {"nodes": nodes, "adj": adj, "region": rid, "name": region.get("name") or rid}
        with _trail_graph_lock:
            _trail_graph_cache[rid] = graph
            _trail_graph_cache.move_to_end(rid)
            while len(_trail_graph_cache) > max(1, TRAIL_GRAPH_CACHE_MAX):
                _trail_graph_cache.popitem(last=False)
        return graph
    except Exception as exc:
        print(f"[trail-graph-load-error] {rid}: {exc}", flush=True)
        return None


def _nearest_trail_node(graph: dict[str, Any], lat: float, lon: float) -> tuple[int, float] | None:
    best_id = None
    best_dist = float("inf")
    for nid, (nlat, nlon) in graph["nodes"].items():
        d = _haversine(lat, lon, nlat, nlon)
        if d < best_dist:
            best_id, best_dist = nid, d
    return (best_id, best_dist) if best_id is not None else None


def _astar_trail(graph: dict[str, Any], start: int, goal: int) -> list[int] | None:
    nodes = graph["nodes"]
    adj = graph["adj"]
    if start == goal:
        return [start]
    goal_lat, goal_lon = nodes[goal]
    heap: list[tuple[float, int]] = [(0.0, start)]
    g = {start: 0.0}
    came: dict[int, int] = {}
    closed: set[int] = set()
    while heap:
        _, cur = heapq.heappop(heap)
        if cur in closed:
            continue
        if cur == goal:
            path = [cur]
            while cur in came:
                cur = came[cur]
                path.append(cur)
            path.reverse()
            return path
        closed.add(cur)
        base = g[cur]
        for nxt, weight in adj.get(cur, []):
            tentative = base + weight
            if tentative >= g.get(nxt, float("inf")):
                continue
            came[nxt] = cur
            g[nxt] = tentative
            lat, lon = nodes[nxt]
            h = _haversine(lat, lon, goal_lat, goal_lon)
            heapq.heappush(heap, (tentative + h, nxt))
    return None


def _simplify_trail(coords: list[dict[str, float]], min_m: float = 55.0) -> list[dict[str, float]]:
    if len(coords) <= 2:
        return coords
    out = [coords[0]]
    last = coords[0]
    for p in coords[1:-1]:
        if _haversine(last["lat"], last["lon"], p["lat"], p["lon"]) >= min_m:
            out.append(p)
            last = p
    out.append(coords[-1])
    return out


def _candidate_trail_regions(lat1: float, lon1: float, lat2: float, lon2: float) -> list[dict[str, Any]]:
    manifest = _load_trail_manifest()
    candidates = []
    for region in manifest.get("regions", []):
        if not region.get("ready"):
            continue
        bbox = region.get("bbox") or []
        if len(bbox) != 4:
            continue
        south, west, north, east = map(float, bbox)
        pad = 0.02
        inside1 = south-pad <= lat1 <= north+pad and west-pad <= lon1 <= east+pad
        inside2 = south-pad <= lat2 <= north+pad and west-pad <= lon2 <= east+pad
        if inside1 and inside2:
            candidates.append(region)
    return candidates



def _clean_text(value: Any, limit: int = 500) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text[:limit] if text else None


def _clean_int(value: Any, minimum: int = 0, maximum: int = 10_000_000) -> int | None:
    if value is None or value == "":
        return None
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        return None
    return max(minimum, min(maximum, number))


def _sanitize_metadata(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    # Keep analytics payloads small and deliberately exclude common identity fields.
    blocked = {"ip", "ip_address", "email", "name", "user_agent", "ua", "phone", "address"}
    out: dict[str, Any] = {}
    for key, val in list(value.items())[:24]:
        k = str(key)[:64]
        if k.lower() in blocked:
            continue
        if isinstance(val, (str, int, float, bool)) or val is None:
            out[k] = val if not isinstance(val, str) else val[:300]
    return out


def _usage_row(payload: dict[str, Any]) -> dict[str, Any]:
    event_name = _clean_text(payload.get("event_name"), 80)
    if event_name not in ALLOWED_EVENT_NAMES:
        raise ValueError("unknown event_name")
    session_id = _clean_text(payload.get("session_id"), 80)
    if not session_id:
        raise ValueError("session_id is required")
    return {
        "session_id": session_id,
        "app_version": _clean_text(payload.get("app_version"), 20) or APP_VERSION,
        "event_name": event_name,
        "success": bool(payload.get("success")) if payload.get("success") is not None else None,
        "duration_ms": _clean_int(payload.get("duration_ms"), 0, 3_600_000),
        "mountain": _clean_text(payload.get("mountain"), 120),
        "route_points": _clean_int(payload.get("route_points"), 0, 200),
        "stay_count": _clean_int(payload.get("stay_count"), 0, 30),
        "error_message": _clean_text(payload.get("error_message"), 700),
        "metadata": _sanitize_metadata(payload.get("metadata")),
    }


def _write_supabase_event(row: dict[str, Any]) -> bool:
    if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY):
        return False
    url = f"{SUPABASE_URL}/rest/v1/usage_events"
    body = json.dumps(row, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "User-Agent": UA,
        },
    )
    with urllib.request.urlopen(req, timeout=USAGE_EVENT_TIMEOUT) as resp:
        return 200 <= resp.status < 300

def _cache_get(key: str):
    now = time.time()
    with _cache_lock:
        item = _cache.get(key)
        if not item:
            return None
        expires, status, ctype, body = item
        if expires <= now:
            _cache.pop(key, None)
            return None
        _cache.move_to_end(key)
        return status, ctype, body


def _cache_put(key: str, status: int, ctype: str, body: bytes, ttl: int | None = None):
    cache_ttl = CACHE_TTL if ttl is None else ttl
    if cache_ttl <= 0 or status != 200:
        return
    with _cache_lock:
        _cache[key] = (time.time() + cache_ttl, status, ctype, body)
        _cache.move_to_end(key)
        while len(_cache) > CACHE_MAX_ITEMS:
            _cache.popitem(last=False)


def _request_url(url: str, timeout: int = UPSTREAM_TIMEOUT):
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.headers.get("Content-Type", "application/json"), resp.read()


def _request_overpass(endpoint: str, query: str, timeout: int = OVERPASS_TIMEOUT):
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "User-Agent": UA,
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.headers.get("Content-Type", "application/json"), resp.read()


def _bytes_response(status: int, ctype: str, body: bytes, *, cache_control: str = "no-store"):
    response = Response(body, status=status, content_type=ctype)
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/api/health")
def health():
    return jsonify(
        ok=True,
        version=APP_VERSION,
        service="mountain-weather-decision",
        overpass_endpoints=len(OVERPASS_ENDPOINTS),
        usage_logging=True,
        supabase_configured=bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY),
        trail_regions_ready=sum(1 for r in _load_trail_manifest().get("regions", []) if r.get("ready")),
    )




@app.post("/api/event")
def usage_event():
    if request.content_length and request.content_length > USAGE_EVENT_MAX_BYTES:
        return jsonify(error="event payload too large"), 413
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(error="JSON body is required"), 400
    try:
        row = _usage_row(payload)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400

    if USAGE_LOG_STDOUT:
        print("[usage] " + json.dumps(row, ensure_ascii=False, separators=(",", ":")), flush=True)

    stored = False
    storage_error = None
    try:
        stored = _write_supabase_event(row)
    except Exception as exc:
        storage_error = str(exc)[:500]
        print(f"[usage-storage-error] {storage_error}", flush=True)

    return jsonify(
        ok=True,
        stored=stored,
        sink="supabase" if stored else "render-log",
        storage_error=storage_error if (storage_error and os.environ.get("APP_ENV") != "production") else None,
    ), 202


@app.get("/api/trail-regions")
def trail_regions():
    manifest = _load_trail_manifest()
    return jsonify(manifest)


@app.get("/api/trail-route")
def trail_route():
    try:
        lat1 = float(request.args["lat1"]); lon1 = float(request.args["lon1"])
        lat2 = float(request.args["lat2"]); lon2 = float(request.args["lon2"])
    except Exception:
        return jsonify(error="lat1/lon1/lat2/lon2 are required"), 400
    for region in _candidate_trail_regions(lat1, lon1, lat2, lon2):
        graph = _load_trail_graph(region)
        if not graph or not graph["nodes"]:
            continue
        start = _nearest_trail_node(graph, lat1, lon1)
        goal = _nearest_trail_node(graph, lat2, lon2)
        if not start or not goal:
            continue
        if start[1] > 1800 or goal[1] > 1800:
            continue
        ids = _astar_trail(graph, start[0], goal[0])
        if not ids or len(ids) < 2:
            continue
        coords = [{"lat": lat1, "lon": lon1}]
        coords.extend({"lat": graph["nodes"][nid][0], "lon": graph["nodes"][nid][1]} for nid in ids)
        coords.append({"lat": lat2, "lon": lon2})
        coords = _simplify_trail(coords)
        response = jsonify(ok=True, source="preloaded-osm", region=graph["region"], region_name=graph["name"], coords=coords, start_gap_m=round(start[1]), end_gap_m=round(goal[1]))
        response.headers["Cache-Control"] = "public, max-age=86400"
        response.headers["X-Trail-Source"] = "PRELOADED"
        return response
    response = jsonify(ok=False, error="preloaded route not found")
    response.headers["X-Trail-Source"] = "MISS"
    return response, 404


@app.get("/api/proxy")
def proxy():
    url = request.args.get("url", "")
    try:
        target = urllib.parse.urlparse(url)
        if target.scheme != "https" or target.hostname not in ALLOWED_HOSTS:
            return jsonify(error="許可されていない接続先です"), 400

        cached = _cache_get("get:" + url)
        if cached:
            status, ctype, body = cached
            return _bytes_response(status, ctype, body, cache_control="public, max-age=60")

        status, ctype, body = _request_url(url)
        _cache_put("get:" + url, status, ctype, body)
        return _bytes_response(status, ctype, body, cache_control="public, max-age=60")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:1200]
        return jsonify(error=f"上流API HTTP {exc.code}", detail=detail), 502
    except Exception as exc:
        return jsonify(error=f"上流APIへ接続できません: {exc}"), 502


@app.post("/api/overpass")
def overpass():
    query = request.get_data(cache=False, as_text=True)
    if not query.strip():
        return jsonify(error="Overpass query is empty"), 400

    cache_key = "overpass:" + query
    cached = _cache_get(cache_key)
    if cached:
        status, ctype, body = cached
        response = _bytes_response(status, ctype, body, cache_control="public, max-age=300")
        response.headers["X-Route-Cache"] = "HIT"
        return response

    errors: list[str] = []
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            status, ctype, body = _request_overpass(endpoint, query)
            if status == 200:
                _cache_put(cache_key, status, ctype, body, ttl=OVERPASS_CACHE_TTL)
                response = _bytes_response(status, ctype, body, cache_control="public, max-age=300")
                response.headers["X-Route-Cache"] = "MISS"
                return response
            errors.append(f"{endpoint}: HTTP {status}")
        except Exception as exc:
            errors.append(f"{endpoint}: {exc}")

    return jsonify(error="Overpass取得失敗", detail=" / ".join(errors)), 502


@app.get("/")
def index():
    return send_from_directory(BASE, "index.html")


PUBLIC_FILES = {"app.js", "styles.css", "favicon.ico", "robots.txt"}


@app.get("/<path:path>")
def static_files(path: str):
    # Do not expose server/config files from the repository root.
    if path in PUBLIC_FILES and os.path.isfile(os.path.join(BASE, path)):
        response = send_from_directory(BASE, path)
        if path.endswith((".js", ".css")):
            response.headers["Cache-Control"] = "public, max-age=300"
        return response
    return send_from_directory(BASE, "index.html")


@app.after_request
def security_headers(response: Response):
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
    return response


if __name__ == "__main__":
    print(f"Mountain Weather Decision V{APP_VERSION}")
    print(f"Open http://localhost:{PORT}")
    print("Stop: Ctrl+C")
    app.run(host="0.0.0.0", port=PORT, threaded=True, debug=False)
