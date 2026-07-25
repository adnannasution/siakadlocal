from fastapi import APIRouter, Query, Header
from app.utils.db import read_all, find_by_id, search_rows, filter_rows, paginate
from app.utils.dev import get_user_from_request

router = APIRouter(prefix="/krs", tags=["KRS"])

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

@router.get("")
def list_krs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    semester_akademik: str = Query(""),
    mahasiswa_id: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [k for k in read_all("krs") if not k.get("deleted_at")]
    rows = search_rows(rows, ["mahasiswa_nama", "mahasiswa_nim", "mata_kuliah_nama", "mata_kuliah_kode"], search)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    if semester_akademik:
        rows = [r for r in rows if r.get("semester_akademik") == semester_akademik]
    if mahasiswa_id:
        rows = [r for r in rows if r.get("mahasiswa_id") == mahasiswa_id]
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    items, meta = paginate(rows, page, per_page)
    return ok(items, meta=meta)

@router.get("/semesters")
def list_semesters(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    rows = [k for k in read_all("krs") if not k.get("deleted_at")]
    semesters = sorted(set(r.get("semester_akademik", "") for r in rows if r.get("semester_akademik")), reverse=True)
    return ok(semesters)
