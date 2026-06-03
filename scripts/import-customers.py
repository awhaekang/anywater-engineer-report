from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from zipfile import ZipFile
from xml.etree.ElementTree import iterparse

SOURCE = Path(
    "/Users/haekang/Library/CloudStorage/OneDrive-개인/업무 자동화/애니워터 CS/엔콤 전체 고객데이터.xlsx"
)
OUTPUT = Path("data/customers.local.json")
SUMMARY = Path("data/import-summary.json")

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
COL_RE = re.compile(r"([A-Z]+)")


def col_to_idx(col: str) -> int:
    value = 0
    for char in col:
        value = value * 26 + ord(char) - 64
    return value - 1


def rows_from_xlsx(path: Path):
    with ZipFile(path) as archive, archive.open("xl/worksheets/sheet1.xml") as sheet:
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
                value = ""
                value_node = cell.find(f"{NS}v")
                inline_node = cell.find(f"{NS}is")
                if value_node is not None and value_node.text:
                    value = value_node.text.strip()
                elif inline_node is not None:
                    value = "".join(text.text or "" for text in inline_node.iter(f"{NS}t")).strip()
                raw_row[col_idx] = value

            if raw_row:
                if headers is None:
                    headers = [raw_row.get(i, "") for i in range(max(raw_row) + 1)]
                else:
                    yield {header: raw_row.get(i, "") for i, header in enumerate(headers) if header}
            elem.clear()


def classify_customer(row: dict[str, str]) -> str:
    if row.get("삭제일"):
        return "terminated"
    if row.get("계약해지일"):
        return "terminated"
    if row.get("제품상태") == "계약해지":
        return "terminated"
    if row.get("제품회수일") and row.get("관리여부") == "관리안함":
        return "terminated"
    if row.get("관리여부") == "관리함" and row.get("제품상태") == "설치완료":
        return "active"
    if row.get("CMS상태") == "해지완료" or row.get("해지일"):
        return "caution"
    return "caution"


def infer_customer_type(name: str) -> str:
    cafe_words = ["카페", "커피", "cafe", "coffee", "바나타이거", "메가커피", "컴포즈"]
    factory_words = ["공장", "팩토리", "제조", "물류", "센터"]
    if any(word.lower() in name.lower() for word in cafe_words):
        return "카페"
    if any(word in name for word in factory_words):
        return "공장"
    return "음식점"


def filter_list(row: dict[str, str]) -> list[str]:
    items = []
    for idx in range(1, 8):
        name = row.get(f"필터 {idx}", "")
        cycle = row.get(f"주기 {idx}", "")
        previous = row.get(f"최근교환일 {idx}", "")
        upcoming = row.get(f"교환예정일 {idx}", "")
        remaining = row.get(f"잔여일 {idx}", "")
        if any([name, cycle, previous, upcoming, remaining]):
            items.append(
                " / ".join(
                    part
                    for part in [
                        name or f"필터 {idx}",
                        f"주기 {cycle}" if cycle else "",
                        f"최근 {previous}" if previous else "",
                        f"예정 {upcoming}" if upcoming else "",
                        f"잔여 {remaining}" if remaining else "",
                    ]
                    if part
                )
            )
    return items


def normalize(row: dict[str, str]) -> dict:
    management_no = row.get("관리번호", "")
    name = row.get("상호", "") or row.get("회사명", "") or row.get("성명", "")
    model = row.get("모델명", "")
    product_name = row.get("제품명", "")
    filters = filter_list(row)
    equipment = [item for item in [product_name, model, *filters] if item]
    if not equipment:
        equipment = ["제품/필터 확인 필요"]

    customer_type = infer_customer_type(name)
    replacement_cycle = "12"
    inspection_cycle = "6"
    cafe_policy = ""
    if customer_type == "카페":
        cafe_policy = "new-12m"
        inspection_cycle = "0"
        replacement_cycle = "12"

    return {
        "id": f"encom-{management_no}-{abs(hash((name, row.get('주소1', '')))) % 1000000}",
        "managementNo": management_no,
        "name": name,
        "ownerName": row.get("성명", ""),
        "address": row.get("주소1", ""),
        "addressMemo": row.get("주소메모", ""),
        "manager": row.get("담당자(지역)", ""),
        "phone": row.get("연락처1", "") or row.get("연락처2", ""),
        "mobile": row.get("휴대폰1", "") or row.get("휴대폰2", ""),
        "openTime": row.get("오픈시간", ""),
        "contact": {
            "phone1": row.get("연락처1", ""),
            "phone1Memo": row.get("연락처1 메모", ""),
            "phone2": row.get("연락처2", ""),
            "phone2Memo": row.get("연락처2 메모", ""),
            "mobile1": row.get("휴대폰1", ""),
            "mobile1Memo": row.get("휴대폰1 메모", ""),
            "mobile2": row.get("휴대폰2", ""),
            "mobile2Memo": row.get("휴대폰2 메모", ""),
        },
        "customerType": customer_type,
        "lat": None,
        "lng": None,
        "equipment": equipment,
        "products": filters or equipment,
        "customerStatus": classify_customer(row),
        "source": "encom",
        "route": {
            "serviceRegion": row.get("담당자(지역)", ""),
            "routeMonth": "",
        },
        "contract": {
            "contractDate": row.get("계약일자", ""),
            "cmsStatus": row.get("CMS상태", ""),
            "endedAt": row.get("해지일", ""),
            "contractEndedAt": row.get("계약해지일", ""),
            "recoveredAt": row.get("제품회수일", ""),
            "expiresAt": row.get("계약만료일", ""),
        },
        "product": {
            "productName": product_name,
            "modelName": model,
            "installPlace": row.get("설치장소", ""),
            "productStatus": row.get("제품상태", ""),
            "managementStatus": row.get("관리여부", ""),
            "installedAt": row.get("설치완료일", ""),
        },
        "filterSchedule": {
            "lastFilterDate": row.get("최근교환일 1", ""),
            "nextInspectionDate": "",
            "nextReplacementDate": row.get("교환예정일 1", ""),
            "remainingDays": row.get("잔여일 1", ""),
            "inspectionCycleMonths": inspection_cycle,
            "replacementCycleMonths": replacement_cycle,
            "cafePolicy": cafe_policy,
        },
        "serviceOrder": {
            "visitScheduledAt": row.get("방문예정일", ""),
            "asReceivedAt": row.get("A/S 접수일", ""),
            "progressStatus": row.get("진행상태", ""),
            "requestType": row.get("접수구분", ""),
        },
        "serviceMemo": " / ".join(
            part
            for part in [
                row.get("메모장", ""),
                row.get("제품메모장", ""),
                row.get("접수내용", ""),
                row.get("처리내용", ""),
            ]
            if part
        ),
        "needsGeocode": True,
    }


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    stores = []
    seen = set()
    status_counts = Counter()
    type_counts = Counter()

    for row in rows_from_xlsx(SOURCE):
        if not row.get("상호") and not row.get("주소1"):
            continue
        store = normalize(row)
        key = (store["managementNo"], store["name"], store["address"])
        if key in seen:
            continue
        seen.add(key)
        stores.append(store)
        status_counts[store["customerStatus"]] += 1
        type_counts[store["customerType"]] += 1

    payload = {
        "source": str(SOURCE),
        "generatedAt": "2026-05-21",
        "stores": stores,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    SUMMARY.write_text(
        json.dumps(
            {
                "total": len(stores),
                "statusCounts": status_counts,
                "typeCounts": type_counts,
                "withoutCoordinates": len(stores),
                "output": str(OUTPUT),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"wrote {len(stores)} stores to {OUTPUT}")
    print(dict(status_counts))
    print(dict(type_counts))


if __name__ == "__main__":
    main()
