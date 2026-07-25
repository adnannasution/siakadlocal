from fastapi import APIRouter, Query, Header
from app.utils.db import read_all, search_rows, paginate
from app.utils.dev import get_user_from_request

router = APIRouter(prefix="/keuangan", tags=["Keuangan"])

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

@router.get("/tagihan")
def list_tagihan(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    semester_akademik: str = Query(""),
    jenis: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [t for t in read_all("tagihan") if not t.get("deleted_at")]
    rows = search_rows(rows, ["mahasiswa_nama", "mahasiswa_nim", "jenis", "semester_akademik"], search)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    if semester_akademik:
        rows = [r for r in rows if r.get("semester_akademik") == semester_akademik]
    if jenis:
        rows = [r for r in rows if r.get("jenis") == jenis]
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    items, meta = paginate(rows, page, per_page)
    return ok(items, meta=meta)

@router.get("/tagihan/semesters")
def list_semesters(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    rows = [t for t in read_all("tagihan") if not t.get("deleted_at")]
    semesters = sorted(set(r.get("semester_akademik", "") for r in rows if r.get("semester_akademik")), reverse=True)
    return ok(semesters)

@router.get("/pembayaran")
def list_pembayaran(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    authorization: str = Header(default="dev"),
):
    get_user_from_request(authorization)
    rows = [p for p in read_all("pembayaran") if not p.get("deleted_at")]
    rows = search_rows(rows, ["kode_transaksi", "metode"], search)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    rows.sort(key=lambda r: r.get("tgl_bayar", ""), reverse=True)
    items, meta = paginate(rows, page, per_page)
    return ok(items, meta=meta)

@router.get("/ringkasan")
def ringkasan(authorization: str = Header(default="dev")):
    get_user_from_request(authorization)
    tagihan = [t for t in read_all("tagihan") if not t.get("deleted_at")]
    pembayaran = [p for p in read_all("pembayaran") if not p.get("deleted_at")]

    total_tagihan = sum(t.get("jumlah", 0) for t in tagihan)
    total_lunas = sum(t.get("jumlah", 0) for t in tagihan if t.get("status") == "lunas")
    total_belum = sum(t.get("jumlah", 0) for t in tagihan if t.get("status") in ("belum_lunas", "cicilan"))

    return ok({
        "total_tagihan": len(tagihan),
        "tagihan_lunas": sum(1 for t in tagihan if t.get("status") == "lunas"),
        "tagihan_belum_lunas": sum(1 for t in tagihan if t.get("status") == "belum_lunas"),
        "tagihan_cicilan": sum(1 for t in tagihan if t.get("status") == "cicilan"),
        "nominal_total": total_tagihan,
        "nominal_lunas": total_lunas,
        "nominal_belum": total_belum,
        "total_pembayaran": len(pembayaran),
    })
