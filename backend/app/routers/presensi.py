from fastapi import APIRouter, Query, Header
from app.utils.db import read_all, search_rows, paginate
from app.utils.dev import get_user_from_request

router = APIRouter(prefix="/presensi", tags=["Presensi"])

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

@router.get("")
def list_presensi(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    kelas_id: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [p for p in read_all("presensi") if not p.get("deleted_at")]
    rows = search_rows(rows, ["mahasiswa_nama", "mahasiswa_nim"], search)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    if kelas_id:
        rows = [r for r in rows if r.get("kelas_id") == kelas_id]
    rows.sort(key=lambda r: r.get("waktu_scan") or "", reverse=True)
    items, meta = paginate(rows, page, per_page)
    return ok(items, meta=meta)

@router.get("/rekap")
def rekap_presensi(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    rows = [p for p in read_all("presensi") if not p.get("deleted_at")]
    distribusi = {}
    for p in rows:
        s = p.get("status", "?")
        distribusi[s] = distribusi.get(s, 0) + 1

    kelas_all = [k for k in read_all("kelas") if not k.get("deleted_at")]
    return ok({
        "total": len(rows),
        "distribusi_status": distribusi,
        "total_kelas": len(kelas_all),
        "persen_hadir": round(distribusi.get("hadir", 0) / len(rows) * 100, 1) if rows else 0,
    })

@router.get("/kelas")
def list_kelas(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    rows = [k for k in read_all("kelas") if not k.get("deleted_at")]
    rows.sort(key=lambda r: r.get("mata_kuliah_nama", ""))
    return ok(rows)
