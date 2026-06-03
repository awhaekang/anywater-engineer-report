from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlencode
from xml.etree.ElementTree import iterparse
from zipfile import ZipFile

SOURCE_XLSX = Path("/Users/haekang/Documents/projects/엔콤 전체 고객데이터.xlsx")
ENV_FILES = [Path(".env.supabase.local"), Path(".env.local")]
BATCH_SIZE = 400
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
COL_RE = re.compile(r"([A-Z]+)")


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


def col_to_idx(col: str) -> int:
    value = 0
    for char in col:
        value = value * 26 + ord(char) - 64
    return value - 1


def load_shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    strings: list[str] = []
    with archive.open("xl/sharedStrings.xml") as shared:
        for _, elem in iterparse(shared, events=("end",)):
            if elem.tag == f"{NS}si":
                strings.append("".join(text.text or "" for text in elem.iter(f"{NS}t")))
                elem.clear()
    return strings


def rows_from_xlsx(path: Path):
    with ZipFile(path) as archive:
        shared_strings = load_shared_strings(archive)
        with archive.open("xl/worksheets/sheet1.xml") as sheet:
            headers: list[str] | None = None
            for _, elem in iterparse(sheet, events=("end",)):
                if elem.tag != f"{NS}row":
                    continue

                raw_row: dict[int, str] = {}
                for cell in elem.findall(f"{NS}c"):
                    ref = cell.attrib.get("r", "")
                    match = COL_RE.match(ref)
                    if not match:
                        continue
                    col_idx = col_to_idx(match.group(1))
                    cell_type = cell.attrib.get("t")
                    value = ""
                    value_node = cell.find(f"{NS}v")
                    inline_node = cell.find(f"{NS}is")
                    if cell_type == "s" and value_node is not None and value_node.text:
                        value = shared_strings[int(value_node.text)]
                    elif inline_node is not None:
                        value = "".join(text.text or "" for text in inline_node.iter(f"{NS}t")).strip()
                    elif value_node is not None and value_node.text:
                        value = value_node.text.strip()
                    raw_row[col_idx] = value

                if raw_row:
                    if headers is None:
                        headers = [raw_row.get(i, "") for i in range(max(raw_row) + 1)]
                    else:
                        yield {header: raw_row.get(i, "") for i, header in enumerate(headers) if header}
                elem.clear()


def chunked(items: list[dict], size: int):
    for start in range(0, len(items), size):
        yield items[start : start + size]


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def stable_id(prefix: str, *parts: str) -> str:
    digest = hashlib.sha1("|".join(parts).encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


def first_value(rows: list[dict], key: str) -> str:
    for row in rows:
        value = clean_text(row.get(key, ""))
        if value:
            return value
    return ""


def unique_values(rows: list[dict], key: str, limit: int = 8) -> list[str]:
    values: list[str] = []
    seen = set()
    for row in rows:
        value = clean_text(row.get(key, ""))
        if value and value not in seen:
            values.append(value)
            seen.add(value)
        if len(values) >= limit:
            break
    return values


def infer_customer_type(name: str) -> str:
    cafe_words = ["카페", "커피", "cafe", "coffee", "바나타이거", "메가커피", "컴포즈"]
    factory_words = ["공장", "팩토리", "제조", "물류", "센터"]
    if any(word.lower() in name.lower() for word in cafe_words):
        return "카페"
    if any(word in name for word in factory_words):
        return "공장"
    return "음식점"


def row_is_terminated(row: dict) -> bool:
    if row.get("삭제일") or row.get("계약해지일"):
        return True
    if row.get("제품상태") == "계약해지":
        return True
    return bool(row.get("제품회수일") and row.get("관리여부") == "관리안함")


def product_is_active(row: dict) -> bool:
    product_name = clean_text(row.get("제품명", ""))
    return (
        product_name != "해지"
        and row.get("관리여부") == "관리함"
        and row.get("제품상태") == "설치완료"
    )


def product_filters(row: dict) -> list[dict]:
    filters = []
    for idx in range(1, 8):
        name = clean_text(row.get(f"필터 {idx}", ""))
        cycle = clean_text(row.get(f"주기 {idx}", ""))
        previous = clean_text(row.get(f"최근교환일 {idx}", ""))
        upcoming = clean_text(row.get(f"교환예정일 {idx}", ""))
        remaining = clean_text(row.get(f"잔여일 {idx}", ""))
        if any([name, cycle, previous, upcoming, remaining]):
            filters.append(
                {
                    "name": name or f"필터 {idx}",
                    "cycle": cycle,
                    "lastDate": previous,
                    "nextDate": upcoming,
                    "remainingDays": remaining,
                }
            )
    return filters


def filter_summary(filters: list[dict]) -> str:
    if not filters:
        return ""
    main = filters[0]
    parts = [
        main.get("name", ""),
        f"주기 {main['cycle']}" if main.get("cycle") else "",
        f"최근 {main['lastDate']}" if main.get("lastDate") else "",
        f"예정 {main['nextDate']}" if main.get("nextDate") else "",
    ]
    return " / ".join(part for part in parts if part)


def product_summary(row: dict, index: int) -> str:
    product_name = clean_text(row.get("제품명", "")) or "제품 확인 필요"
    install_place = clean_text(row.get("설치장소", ""))
    filters = filter_summary(product_filters(row))
    parts = [f"{index}. {product_name}", install_place, filters]
    return " / ".join(part for part in parts if part)


def customer_status(rows: list[dict]) -> str:
    if any(product_is_active(row) for row in rows):
        return "active"
    if all(row_is_terminated(row) or clean_text(row.get("제품명", "")) == "해지" for row in rows):
        return "terminated"
    return "caution"


def representative_rows(rows: list[dict]) -> list[dict]:
    return sorted(
        rows,
        key=lambda row: (
            0 if product_is_active(row) else 1,
            0 if clean_text(row.get("제품명", "")) != "해지" else 1,
            clean_text(row.get("관리번호", "")),
        ),
    )


def service_order_snapshot(rows: list[dict]) -> dict:
    candidates = [row for row in rows if clean_text(row.get("접수구분", ""))]
    if not candidates:
        return {"visitScheduledAt": "", "asReceivedAt": "", "progressStatus": "", "requestType": ""}
    preferred = [row for row in candidates if clean_text(row.get("진행상태", "")) != "취소"] or candidates
    row = preferred[0]
    return {
        "visitScheduledAt": clean_text(row.get("방문예정일", "")),
        "asReceivedAt": clean_text(row.get("A/S 접수일", "")),
        "progressStatus": clean_text(row.get("진행상태", "")),
        "requestType": clean_text(row.get("접수구분", "")),
    }


def store_row(group_key: tuple[str, str], rows: list[dict]) -> dict:
    name, address = group_key
    ordered = representative_rows(rows)
    representative = ordered[0]
    active_rows = [row for row in ordered if product_is_active(row)]
    product_rows = active_rows or [row for row in ordered if clean_text(row.get("제품명", "")) != "해지"] or ordered
    product_summaries = [product_summary(row, index + 1) for index, row in enumerate(product_rows)]
    management_numbers = unique_values(ordered, "관리번호", limit=12)
    service_notes = []
    for key in ["메모장", "주소메모", "접수내용", "처리내용"]:
        service_notes.extend(unique_values(ordered, key, limit=4))
    status = customer_status(ordered)

    return {
        "external_id": stable_id("encom-store", name, address),
        "management_no": ", ".join(management_numbers),
        "name": name,
        "owner_name": first_value(ordered, "성명"),
        "address": address,
        "address_memo": first_value(ordered, "주소메모"),
        "manager": first_value(ordered, "담당자(지역)"),
        "phone": first_value(ordered, "연락처1") or first_value(ordered, "연락처2"),
        "mobile": first_value(ordered, "휴대폰1") or first_value(ordered, "휴대폰2"),
        "open_time": first_value(ordered, "오픈시간"),
        "contact": {
            "phone1": first_value(ordered, "연락처1"),
            "phone1Memo": first_value(ordered, "연락처1 메모"),
            "phone2": first_value(ordered, "연락처2"),
            "phone2Memo": first_value(ordered, "연락처2 메모"),
            "mobile1": first_value(ordered, "휴대폰1"),
            "mobile1Memo": first_value(ordered, "휴대폰1 메모"),
            "mobile2": first_value(ordered, "휴대폰2"),
            "mobile2Memo": first_value(ordered, "휴대폰2 메모"),
        },
        "customer_type": infer_customer_type(name),
        "customer_status": status,
        "source": "encom",
        "lat": None,
        "lng": None,
        "needs_geocode": True,
        "equipment": product_summaries,
        "products": product_summaries,
        "route": {"serviceRegion": first_value(ordered, "담당자(지역)"), "routeMonth": ""},
        "contract": {
            "contractDate": first_value(ordered, "계약일자"),
            "cmsStatus": first_value(ordered, "CMS상태"),
            "endedAt": first_value(ordered, "해지일"),
            "contractEndedAt": first_value(ordered, "계약해지일"),
            "recoveredAt": first_value(ordered, "제품회수일"),
            "expiresAt": first_value(ordered, "계약만료일"),
        },
        "product": {
            "productName": clean_text(product_rows[0].get("제품명", "")) if product_rows else "",
            "modelName": "",
            "installPlace": clean_text(product_rows[0].get("설치장소", "")) if product_rows else "",
            "productStatus": clean_text(product_rows[0].get("제품상태", "")) if product_rows else "",
            "managementStatus": clean_text(product_rows[0].get("관리여부", "")) if product_rows else "",
            "installedAt": clean_text(product_rows[0].get("설치완료일", "")) if product_rows else "",
        },
        "filter_schedule": {
            "lastFilterDate": clean_text(product_rows[0].get("최근교환일 1", "")) if product_rows else "",
            "nextInspectionDate": "",
            "nextReplacementDate": clean_text(product_rows[0].get("교환예정일 1", "")) if product_rows else "",
            "remainingDays": clean_text(product_rows[0].get("잔여일 1", "")) if product_rows else "",
            "inspectionCycleMonths": "0" if infer_customer_type(name) == "카페" else "6",
            "replacementCycleMonths": "12",
            "cafePolicy": "new-12m" if infer_customer_type(name) == "카페" else "",
        },
        "service_order_snapshot": service_order_snapshot(ordered),
        "service_memo": " / ".join(note for note in service_notes if note),
        "product_count": len(ordered),
        "active_product_count": len(active_rows),
        "active": status != "terminated",
    }


def store_product_row(row: dict, store_external_id: str, store_id: str, sort_order: int) -> dict:
    product_name = clean_text(row.get("제품명", "")) or "제품 확인 필요"
    model_note = clean_text(row.get("모델명", ""))
    install_place = clean_text(row.get("설치장소", ""))
    install_place_note = ""
    if product_name == "해지" and install_place and not re.search(r"(^#?\s*-?\d+|주방|홀|바|카운터|제빙기|층|지하)", install_place):
        install_place_note = install_place
        install_place = ""
    return {
        "store_id": store_id,
        "external_id": stable_id("encom-product", store_external_id, clean_text(row.get("관리번호", "")), str(sort_order), product_name, install_place),
        "source": "encom",
        "management_no": clean_text(row.get("관리번호", "")),
        "product_name": product_name,
        "model_note": model_note,
        "install_place": install_place,
        "install_place_note": install_place_note,
        "connection_note": clean_text(row.get("모터명", "")),
        "reference_note": clean_text(row.get("참고내용", "")),
        "product_memo": clean_text(row.get("제품메모장", "")),
        "product_status": clean_text(row.get("제품상태", "")),
        "management_status": clean_text(row.get("관리여부", "")),
        "installed_at": clean_text(row.get("설치완료일", "")),
        "product_type": clean_text(row.get("제품구분", "")),
        "faucet_type": clean_text(row.get("코크형식", "")),
        "filters": product_filters(row),
        "sort_order": sort_order,
        "active": product_is_active(row),
    }


def curl_request(
    supabase_url: str,
    service_role_key: str,
    method: str,
    path: str,
    rows: list[dict] | None = None,
    query: dict[str, str] | None = None,
    extra_headers: list[str] | None = None,
    expected: set[int] | None = None,
):
    expected = expected or {200, 201, 204}
    url = f"{supabase_url}/rest/v1/{path}"
    if query:
        url = f"{url}?{urlencode(query)}"
    curl = shutil.which("curl") or "/usr/bin/curl"
    body_file = None
    config = [
        "silent",
        "show-error",
        "max-time = 60",
        f"request = {method}",
        f"url = {json.dumps(url)}",
        'header = "Content-Type: application/json"',
        f"header = {json.dumps(f'apikey: {service_role_key}')}",
        f"header = {json.dumps(f'Authorization: Bearer {service_role_key}')}",
        'write-out = "\\n%{http_code}"',
    ]
    for header in extra_headers or []:
        config.insert(-1, f"header = {json.dumps(header)}")
    if rows is not None:
        body_file = tempfile.NamedTemporaryFile(prefix="anywater-supabase-", suffix=".json", delete=False)
        body_file.write(json.dumps(rows, ensure_ascii=False).encode("utf-8"))
        body_file.close()
        config.insert(-1, 'header = "Prefer: resolution=merge-duplicates,return=minimal"')
        config.insert(-1, f"data-binary = {json.dumps(f'@{body_file.name}')}")

    try:
        completed = subprocess.run(
            [curl, "--config", "-"],
            check=False,
            capture_output=True,
            input="\n".join(config),
            text=True,
        )
    finally:
        if body_file:
            Path(body_file.name).unlink(missing_ok=True)

    response_body, _, status_text = (completed.stdout or "").rpartition("\n")
    status = int(status_text or "0")
    if completed.returncode != 0 or status not in expected:
        detail = response_body or completed.stderr.strip() or "no response body"
        raise RuntimeError(f"Supabase request failed: {method} {path} {status} {detail[:500]}")
    return json.loads(response_body or "[]") if response_body.strip() else []


def upsert_batch(supabase_url: str, service_role_key: str, table: str, rows: list[dict], on_conflict: str) -> None:
    curl_request(
        supabase_url,
        service_role_key,
        "POST",
        table,
        rows=rows,
        query={"on_conflict": on_conflict},
        expected={200, 201, 204},
    )


def fetch_store_ids(supabase_url: str, service_role_key: str) -> dict[str, str]:
    rows = []
    page_size = 1000
    for start in range(0, 20000, page_size):
        batch = curl_request(
            supabase_url,
            service_role_key,
            "GET",
            "stores",
            query={
                "select": "id,external_id",
                "source": "eq.encom",
                "order": "external_id.asc",
            },
            extra_headers=[f"Range: {start}-{start + page_size - 1}"],
            expected={200},
        )
        rows.extend(batch)
        if len(batch) < page_size:
            break
    return {row["external_id"]: row["id"] for row in rows}


def main() -> int:
    load_env_files()
    supabase_url = require_env("SUPABASE_URL")
    service_role_key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    if not SOURCE_XLSX.exists():
        raise RuntimeError(f"{SOURCE_XLSX} does not exist")

    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    skipped = 0
    for row in rows_from_xlsx(SOURCE_XLSX):
        name = clean_text(row.get("상호", ""))
        address = clean_text(row.get("주소1", ""))
        if not name or not address:
            skipped += 1
            continue
        grouped[(name, address)].append(row)

    store_rows = [store_row(group_key, rows) for group_key, rows in grouped.items()]
    print(f"Parsed {len(store_rows):,} stores from {sum(len(rows) for rows in grouped.values()):,} product rows; skipped {skipped:,} rows without name/address.")

    print("Deleting previous encom stores and products...")
    curl_request(supabase_url, service_role_key, "DELETE", "stores", query={"source": "eq.encom"}, expected={200, 204})

    print("Importing grouped stores...")
    for index, batch in enumerate(chunked(store_rows, BATCH_SIZE), start=1):
        upsert_batch(supabase_url, service_role_key, "stores", batch, "external_id")
        imported = min(index * BATCH_SIZE, len(store_rows))
        print(f"Imported stores {imported:,}/{len(store_rows):,}")

    store_ids = fetch_store_ids(supabase_url, service_role_key)
    if len(store_ids) != len(store_rows):
        raise RuntimeError(f"Expected {len(store_rows):,} Supabase store ids, got {len(store_ids):,}")

    product_rows = []
    for group_key, rows in grouped.items():
        store_external_id = stable_id("encom-store", *group_key)
        store_id = store_ids[store_external_id]
        for sort_order, row in enumerate(representative_rows(rows), start=1):
            product_rows.append(store_product_row(row, store_external_id, store_id, sort_order))

    print("Importing store products...")
    for index, batch in enumerate(chunked(product_rows, BATCH_SIZE), start=1):
        upsert_batch(supabase_url, service_role_key, "store_products", batch, "external_id")
        imported = min(index * BATCH_SIZE, len(product_rows))
        print(f"Imported products {imported:,}/{len(product_rows):,}")

    print(f"Done. Imported {len(store_rows):,} stores and {len(product_rows):,} product rows into Supabase.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
