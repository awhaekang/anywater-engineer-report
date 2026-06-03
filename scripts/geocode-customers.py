from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode

CUSTOMERS = Path("data/customers.local.json")
RESULTS = Path("data/geocode-results.local.json")
ENV_FILE = Path(".env.local")
NAVER_GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"


def load_env_file(path: Path = ENV_FILE) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def compact_address(address: str) -> list[str]:
    address = re.sub(r"\s+", " ", address).strip()
    replacements = {
        "충천남도": "충청남도",
        "2충": "2층",
        "서울시": "서울",
    }
    for source, target in replacements.items():
        address = address.replace(source, target)
    candidates = [address]

    without_parentheses = re.sub(r"\([^)]*\)", "", address).strip()
    if without_parentheses and without_parentheses not in candidates:
        candidates.append(without_parentheses)

    before_comma = re.split(r"[,，]", without_parentheses)[0].strip()
    if before_comma and before_comma not in candidates:
        candidates.append(before_comma)

    without_duplicate_number = re.sub(r"\b(\d+(?:-\d+)?)\s+\1\b", r"\1", without_parentheses).strip()
    if without_duplicate_number and without_duplicate_number not in candidates:
        candidates.append(without_duplicate_number)

    underground_normalized = re.sub(r"(로|길)\s+지(?:하|[0-9]+층)\s*(\d)", r"\1 \2", without_parentheses).strip()
    if underground_normalized and underground_normalized not in candidates:
        candidates.append(underground_normalized)

    old_lot_base = re.sub(r"\s+(외\d+필|[가-힣A-Za-z0-9]+(?:타워|프라자|빌딩|시티|상가|병원|휴게소).*)$", "", without_parentheses).strip()
    if old_lot_base and old_lot_base not in candidates:
        candidates.append(old_lot_base)

    without_unit = re.sub(
        r"\s+\d+\s*(층|호|동|실)\b.*$|,\s*.*$",
        "",
        without_parentheses,
    ).strip()
    if without_unit and without_unit not in candidates:
        candidates.append(without_unit)

    return candidates


def load_customers(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("stores", [])


def load_previous_results(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {item["id"]: item for item in payload.get("results", [])}


def write_results(path: Path, results: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "provider": "naver",
                "results": list(results.values()),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def geocode_address(address: str, client_id: str, client_secret: str) -> dict:
    url = f"{NAVER_GEOCODE_URL}?{urlencode({'query': address})}"
    curl = shutil.which("curl") or "/usr/bin/curl"
    curl_config = "\n".join(
        [
            "silent",
            "show-error",
            "max-time = 15",
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
        raise RuntimeError(completed.stderr.strip() or f"curl exited with {completed.returncode}")

    body, _, status_text = completed.stdout.rpartition("\n")
    status_code = int(status_text or "0")
    payload = json.loads(body or "{}")
    if status_code >= 400:
        error = payload.get("error", {})
        message = error.get("message") or payload.get("message") or "request failed"
        details = error.get("details", "")
        raise RuntimeError(f"HTTP {status_code}: {message}{f' ({details})' if details else ''}")
    if payload.get("status") not in (None, "OK"):
        raise RuntimeError(payload.get("errorMessage") or payload.get("status"))
    return payload


def geocode_store(store: dict, client_id: str, client_secret: str) -> dict:
    attempts = []
    for candidate in compact_address(store.get("address", "")):
        try:
            payload = geocode_address(candidate, client_id, client_secret)
        except (RuntimeError, json.JSONDecodeError, ValueError) as error:
            return result_for(store, "error", candidate, error=str(error), attempts=attempts)

        total = payload.get("meta", {}).get("totalCount", 0)
        attempts.append({"query": candidate, "totalCount": total})
        if total:
            address = payload["addresses"][0]
            return result_for(
                store,
                "ok",
                candidate,
                lat=float(address["y"]),
                lng=float(address["x"]),
                road_address=address.get("roadAddress", ""),
                jibun_address=address.get("jibunAddress", ""),
                attempts=attempts,
            )

    return result_for(store, "no_result", attempts[-1]["query"] if attempts else "", attempts=attempts)


def result_for(
    store: dict,
    status: str,
    query: str,
    *,
    lat: float | None = None,
    lng: float | None = None,
    road_address: str = "",
    jibun_address: str = "",
    error: str = "",
    attempts: list[dict] | None = None,
) -> dict:
    return {
        "id": store.get("id"),
        "managementNo": store.get("managementNo", ""),
        "name": store.get("name", ""),
        "address": store.get("address", ""),
        "query": query,
        "provider": "naver",
        "status": status,
        "lat": lat,
        "lng": lng,
        "roadAddress": road_address,
        "jibunAddress": jibun_address,
        "error": error,
        "attempts": attempts or [],
        "geocodedAt": datetime.now(timezone.utc).isoformat(),
    }


def select_targets(stores: list[dict], status: str, force: bool, previous: dict[str, dict]) -> list[dict]:
    targets = []
    for store in stores:
        if not store.get("address"):
            continue
        if not force and store.get("id") in previous and previous[store["id"]].get("status") == "ok":
            continue
        if status != "all" and store.get("customerStatus") != status:
            continue
        if store.get("lat") is not None and store.get("lng") is not None and not force:
            continue
        targets.append(store)
    return targets


def main() -> None:
    parser = argparse.ArgumentParser(description="Geocode local Anywater customer addresses with Naver Maps.")
    parser.add_argument("--limit", type=int, default=20, help="Number of customers to process.")
    parser.add_argument("--status", choices=["active", "caution", "terminated", "all"], default="active")
    parser.add_argument("--dry-run", action="store_true", help="Show target addresses without calling the API.")
    parser.add_argument("--force", action="store_true", help="Re-run addresses that already have successful results.")
    parser.add_argument("--delay", type=float, default=0.08, help="Delay between API calls in seconds.")
    parser.add_argument("--output", type=Path, default=RESULTS)
    parser.add_argument("--retry-failed", action="store_true", help="Only retry previous no_result or error rows.")
    args = parser.parse_args()

    load_env_file()
    client_id = os.environ.get("NAVER_MAPS_CLIENT_ID")
    client_secret = os.environ.get("NAVER_MAPS_CLIENT_SECRET")

    stores = load_customers(CUSTOMERS)
    previous = load_previous_results(args.output)
    if args.retry_failed:
        retry_ids = {item_id for item_id, item in previous.items() if item.get("status") in {"no_result", "error"}}
        targets = [store for store in stores if store.get("id") in retry_ids][: args.limit]
    else:
        targets = select_targets(stores, args.status, args.force, previous)[: args.limit]

    if args.dry_run:
        for store in targets:
            print(f"{store.get('managementNo')} {store.get('name')} | {store.get('address')}")
        print(f"dry run target count: {len(targets)}")
        return

    if not client_id or not client_secret:
        raise SystemExit("NAVER_MAPS_CLIENT_ID and NAVER_MAPS_CLIENT_SECRET are required in .env.local")

    results = dict(previous)
    ok = no_result = error = 0
    for index, store in enumerate(targets, start=1):
        result = geocode_store(store, client_id, client_secret)
        results[result["id"]] = result
        ok += result["status"] == "ok"
        no_result += result["status"] == "no_result"
        error += result["status"] == "error"
        print(f"[{index}/{len(targets)}] {result['status']} {store.get('managementNo')} {store.get('name')} -> {result.get('lat')}, {result.get('lng')}")
        write_results(args.output, results)
        time.sleep(args.delay)

    print(f"done: ok={ok}, no_result={no_result}, error={error}, output={args.output}")


if __name__ == "__main__":
    main()
