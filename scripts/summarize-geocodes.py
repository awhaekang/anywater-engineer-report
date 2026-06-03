from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

CUSTOMERS = Path("data/customers.local.json")
RESULTS = Path("data/geocode-results.local.json")
REVIEW_CSV = Path("data/geocode-review.local.csv")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    stores = load_json(CUSTOMERS).get("stores", [])
    results_payload = load_json(RESULTS) if RESULTS.exists() else {"results": []}
    results = {item["id"]: item for item in results_payload.get("results", [])}
    active_stores = [store for store in stores if store.get("customerStatus") == "active"]
    status_counts = Counter()
    review_rows = []

    for store in active_stores:
        result = results.get(store["id"])
        status = result.get("status") if result else "not_run"
        status_counts[status] += 1
        if status != "ok":
            review_rows.append(
                {
                    "managementNo": store.get("managementNo", ""),
                    "name": store.get("name", ""),
                    "address": store.get("address", ""),
                    "status": status,
                    "query": result.get("query", "") if result else "",
                    "error": result.get("error", "") if result else "",
                    "attempts": " | ".join(attempt.get("query", "") for attempt in result.get("attempts", [])) if result else "",
                }
            )

    REVIEW_CSV.parent.mkdir(parents=True, exist_ok=True)
    with REVIEW_CSV.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["managementNo", "name", "address", "status", "query", "error", "attempts"],
        )
        writer.writeheader()
        writer.writerows(review_rows)

    print(f"active stores: {len(active_stores)}")
    for status, count in sorted(status_counts.items()):
        print(f"{status}: {count}")
    print(f"review rows: {len(review_rows)}")
    print(f"review csv: {REVIEW_CSV}")


if __name__ == "__main__":
    main()
