from fastapi import APIRouter, Query, Header
from app.utils.db import read_all, find_by_id, search_rows, paginate
from app.utils.dev import get_user_from_request

router = APIRouter(prefix="/dosen", tags=["Dosen"])

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

def enrich(d):
    prodi = find_by_id("program_studi", d.get("prodi_id", ""))
    kelas_list = [k for k in read_all("kelas") if k.get("dosen_id") == d["id"] and not k.get("deleted_at")]
    return {
        **d,
        "program_studi": prodi,
        "jumlah_kelas": len(kelas_list),
        "bidang_keahlian": d.get("bidang_keahlian") if isinstance(d.get("bidang_keahlian"), list) else [],
    }

@router.get("")
def list_dosen(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    prodi_id: str = Query(""),
    jabatan: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [d for d in read_all("dosen") if not d.get("deleted_at")]
    rows = search_rows(rows, ["nama_lengkap", "nidn", "email", "bidang_keahlian"], search)
    if prodi_id:
        rows = [r for r in rows if r.get("prodi_id") == prodi_id]
    if jabatan:
        rows = [r for r in rows if r.get("jabatan_fungsional") == jabatan]
    rows.sort(key=lambda r: r.get("nama_lengkap", ""))
    items, meta = paginate(rows, page, per_page)
    return ok([enrich(d) for d in items], meta=meta)

@router.get("/{dosen_id}")
def get_dosen(dosen_id: str, authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    d = find_by_id("dosen", dosen_id)
    if not d:
        from fastapi import HTTPException
        raise HTTPException(404, "Dosen tidak ditemukan")
    return ok(enrich(d))
