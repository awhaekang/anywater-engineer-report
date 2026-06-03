from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CUSTOMERS_FILE = Path("data/customers.local.json")
ENV_FILES = [Path(".env.supabase.local"), Path(".env.local")]
BATCH_SIZE = 400


def load_env_files() -> None:
    for env_file in ENV_FILES:
        if not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value.rstrip("/") if name == "SUPABASE_URL" else value


def chunked(items: list[dict], size: int):
    for start in range(0, len(items), size):
        yield items[start : start + size]


def row_from_store(store: dict) -> dict:
    return {
        "external_id": store.get("id", ""),
        "management_no": store.get("managementNo", ""),
        "name": store.get("name", ""),
        "owner_name": store.get("ownerName", ""),
        "address": store.get("address", ""),
        "address_memo": store.get("addressMemo", ""),
        "manager": store.get("manager", ""),
        "phone": store.get("phone", ""),
        "mobile": store.get("mobile", ""),
        "open_time": store.get("openTime", ""),
        "contact": store.get("contact") or {},
        "customer_type": store.get("customerType", ""),
        "customer_status": store.get("customerStatus", "caution"),
        "source": store.get("source", "encom"),
        "lat": store.get("lat"),
        "lng": store.get("lng"),
        "needs_geocode": bool(store.get("needsGeocode", False)),
        "equipment": store.get("equipment") or [],
        "products": store.get("products") or [],
        "route": store.get("route") or {},
        "contract": store.get("contract") or {},
        "product": store.get("product") or {},
        "filter_schedule": store.get("filterSchedule") or {},
        "service_order_snapshot": store.get("serviceOrder") or {},
        "service_memo": store.get("serviceMemo", ""),
        "active": store.get("customerStatus") != "terminated",
    }


def upsert_batch(supabase_url: str, service_role_key: str, rows: list[dict]) -> None:
    query = urlencode({"on_conflict": "external_id"})
    request = Request(
        f"{supabase_url}/rest/v1/stores?{query}",
        data=json.dumps(rows, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Prefer": "resolution=merge-duplicates",
        },
    )
    try:
        with urlopen(request, timeout=30) as response:
            if response.status not in {200, 201, 204}:
                raise RuntimeError(f"Unexpected Supabase status: {response.status}")
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase import failed: {error.code} {body[:500]}") from error
    except URLError as error:
        raise RuntimeError(f"Supabase import failed: {error}") from error


def main() -> int:
    load_env_files()
    supabase_url = require_env("SUPABASE_URL")
    service_role_key = require_env("SUPABASE_SERVICE_ROLE_KEY")

    if not CUSTOMERS_FILE.exists():
        raise RuntimeError(f"{CUSTOMERS_FILE} does not exist")

    payload = json.loads(CUSTOMERS_FILE.read_text(encoding="utf-8"))
    stores = payload.get("stores") or []
    rows = [row_from_store(store) for store in stores if store.get("name") and store.get("address")]
    if not rows:
        raise RuntimeError("No stores to import")

    total = len(rows)
    for index, batch in enumerate(chunked(rows, BATCH_SIZE), start=1):
      upsert_batch(supabase_url, service_role_key, batch)
      imported = min(index * BATCH_SIZE, total)
      print(f"Imported {imported:,}/{total:,} stores")

    print(f"Done. Imported {total:,} stores into Supabase.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
