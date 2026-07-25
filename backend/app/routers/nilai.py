from fastapi import APIRouter, Query, Header
from app.utils.db import read_all, search_rows, paginate
from app.utils.dev import get_user_from_request

router = APIRouter(prefix="/nilai", tags=["Nilai"])

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

@router.get("")
def list_nilai(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    semester_akademik: str = Query(""),
    nilai_huruf: str = Query(""),
    mahasiswa_id: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [n for n in read_all("nilai") if not n.get("deleted_at")]
    rows = search_rows(rows, ["mata_kuliah_nama", "semester_akademik", "input_oleh_nama"], search)
    if semester_akademik:
        rows = [r for r in rows if r.get("semester_akademik") == semester_akademik]
    if nilai_huruf:
        rows = [r for r in rows if r.get("nilai_huruf") == nilai_huruf]
    if mahasiswa_id:
        rows = [r for r in rows if r.get("mahasiswa_id") == mahasiswa_id]
    rows.sort(key=lambda r: r.get("updated_at", ""), reverse=True)
    items, meta = paginate(rows, page, per_page)
    return ok(items, meta=meta)

@router.get("/semesters")
def list_semesters(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    rows = [n for n in read_all("nilai") if not n.get("deleted_at")]
    semesters = sorted(set(r.get("semester_akademik", "") for r in rows if r.get("semester_akademik")), reverse=True)
    return ok(semesters)

@router.get("/rekap")
def rekap_nilai(
    semester_akademik: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [n for n in read_all("nilai") if not n.get("deleted_at")]
    if semester_akademik:
        rows = [r for r in rows if r.get("semester_akademik") == semester_akademik]

    distribusi = {}
    for n in rows:
        huruf = n.get("nilai_huruf", "?")
        distribusi[huruf] = distribusi.get(huruf, 0) + 1

    return ok({
        "total": len(rows),
        "terkunci": sum(1 for n in rows if n.get("locked")),
        "distribusi_huruf": distribusi,
        "rata_rata": round(sum(n.get("nilai_akhir", 0) for n in rows) / len(rows), 2) if rows else 0,
    })
