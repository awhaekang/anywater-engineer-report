from __future__ import annotations

import json
import os
import shutil
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

HOST = "127.0.0.1"
PORT = 4174
ENV_FILE = Path(".env.local")
NAVER_REVERSE_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc"


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def reverse_geocode(lat: str, lng: str) -> dict:
    client_id = os.environ.get("NAVER_MAPS_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_MAPS_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return {"ok": False, "error": "missing Naver Maps credentials"}

    query = urlencode({"coords": f"{lng},{lat}", "orders": "roadaddr,addr", "output": "json"})
    url = f"{NAVER_REVERSE_GEOCODE_URL}?{query}"
    curl = shutil.which("curl") or "/usr/bin/curl"
    curl_config = "\n".join(
        [
            "silent",
            "show-error",
            "max-time = 8",
            f"url = {json.dumps(url)}",
            'header = "Accept: application/json"',
            f"header = {json.dumps(f'x-ncp-apigw-api-key-id: {client_id}')}",
            f"header = {json.dumps(f'x-ncp-apigw-api-key: {client_secret}')}",
            'write-out = "\\n%{http_code}"',
        ]
    )
    completed = subprocess.run(
        [curl, "--config", "-"],
        check=False,
        capture_output=True,
        input=curl_config,
        text=True,
    )
    if completed.returncode != 0:
        return {"ok": False, "error": completed.stderr.strip() or "reverse geocode request failed"}

    body, _, status_text = completed.stdout.rpartition("\n")
    if int(status_text or "0") >= 400:
        return {"ok": False, "error": body[:300]}

    payload = json.loads(body or "{}")
    results = payload.get("results") or []
    if not results:
        return {"ok": False, "error": "no address result"}

    result = results[0]
    region = result.get("region", {})
    land = result.get("land", {})
    area_parts = [
        region.get("area1", {}).get("name", ""),
        region.get("area2", {}).get("name", ""),
        region.get("area3", {}).get("name", ""),
        region.get("area4", {}).get("name", ""),
    ]
    area = " ".join(part for part in area_parts if part)
    road = land.get("name", "")
    number = land.get("number1", "")
    if land.get("number2"):
        number = f"{number}-{land['number2']}" if number else land["number2"]
    addition = land.get("addition0", {}).get("value", "")
    address = " ".join(part for part in [area, road, number, addition] if part)
    return {"ok": True, "address": address or area, "rawName": result.get("name", "")}


class LocalHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/reverse-geocode":
            params = parse_qs(parsed.query)
            lat = (params.get("lat") or [""])[0]
            lng = (params.get("lng") or [""])[0]
            try:
                payload = reverse_geocode(lat, lng)
                status = 200 if payload.get("ok") else 502
            except Exception as error:
                payload = {"ok": False, "error": str(error)}
                status = 500
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main() -> None:
    load_env_file()
    server = ThreadingHTTPServer((HOST, PORT), LocalHandler)
    print(f"Serving local app at http://{HOST}:{PORT}/index.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
