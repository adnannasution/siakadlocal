import json, uuid, math
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"

def _path(table):
    return DATA_DIR / f"{table}.json"

def read_all(table):
    p = _path(table)
    if not p.exists():
        p.write_text("[]")
    return json.loads(p.read_text(encoding="utf-8"))

def write_all(table, data):
    _path(table).write_text(
        json.dumps(data, ensure_ascii=False, indent=2, default=str), encoding="utf-8"
    )

def find_one(table, **filters):
    for row in read_all(table):
        if all(row.get(k) == v for k, v in filters.items()):
            return row
    return None

def find_by_id(table, id):
    return find_one(table, id=id, deleted_at=None)

def insert(table, data):
    rows = read_all(table)
    data.setdefault("id", str(uuid.uuid4()))
    data.setdefault("created_at", datetime.now().isoformat())
    data.setdefault("updated_at", datetime.now().isoformat())
    data.setdefault("deleted_at", None)
    rows.append(data)
    write_all(table, rows)
    return data

def update(table, id, updates):
    rows = read_all(table)
    for i, row in enumerate(rows):
        if row.get("id") == id:
            rows[i] = {**row, **updates, "updated_at": datetime.now().isoformat()}
            write_all(table, rows)
            return rows[i]
    return None

def soft_delete(table, id):
    return update(table, id, {"deleted_at": datetime.now().isoformat()}) is not None

def search_rows(rows, fields, keyword):
    if not keyword:
        return rows
    kw = keyword.lower()
    return [r for r in rows if any(kw in str(r.get(f, "")).lower() for f in fields)]

def filter_rows(rows, **filters):
    for k, v in filters.items():
        if v:
            rows = [r for r in rows if str(r.get(k, "")) == str(v)]
    return rows

def paginate(rows, page=1, per_page=20):
    total = len(rows)
    total_pages = math.ceil(total / per_page) if total else 1
    items = rows[(page-1)*per_page : page*per_page]
    return items, {"page": page, "per_page": per_page, "total": total, "total_pages": total_pages}
