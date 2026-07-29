from fastapi import APIRouter, Query, HTTPException
from fastapi.params import Header
from pydantic import BaseModel
from typing import Optional
from app.utils.db import read_all, find_by_id, update, paginate, search_rows
from app.utils.security import hash_password
from app.utils.dev import get_user_from_request, check_role

router = APIRouter(prefix="/users", tags=["Users"])

ADMIN_ROLES = ["super_admin", "admin_akademik"]

def ok(data=None, message="Berhasil", meta=None):
    return {"success": True, "data": data, "message": message, "meta": meta}

def _safe(u):
    return {k: v for k, v in u.items() if k != "password_hash"}

# ── GET list ───────────────────────────────────────────────
@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=200),
    search: str = Query(""),
    role: str = Query(""),
    is_active: str = Query(""),
    authorization: str = Header(default="dev"),
):
    user = get_user_from_request(authorization)
    check_role(user, ADMIN_ROLES)
    rows = [r for r in read_all("users") if not r.get("deleted_at")]
    rows = search_rows(rows, ["nama", "email"], search)
    if role:
        rows = [r for r in rows if r.get("role") == role]
    if is_active in ("true", "false"):
        active = is_active == "true"
        rows = [r for r in rows if r.get("is_active") == active]
    rows.sort(key=lambda r: r.get("nama", "") or "")
    items, meta = paginate(rows, page, per_page)
    return ok([_safe(u) for u in items], meta=meta)

# ── GET detail ─────────────────────────────────────────────
@router.get("/{user_id}")
def get_user(user_id: str, authorization: str = Header(default="dev")):
    user = get_user_from_request(authorization)
    check_role(user, ADMIN_ROLES)
    u = find_by_id("users", user_id)
    if not u:
        raise HTTPException(404, "User tidak ditemukan")
    return ok(_safe(u))

# ── PUT update (role / is_active) ──────────────────────────
class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    nama: Optional[str] = None

VALID_ROLES = [
    "super_admin", "admin_akademik", "admin_keuangan", "admin_sdm",
    "admin_aset", "admin_perpustakaan", "admin_pmb", "lppm",
    "kaprodi", "dosen", "staf", "mahasiswa", "orang_tua", "alumni",
]

@router.put("/{user_id}")
def update_user(user_id: str, body: UserUpdate, authorization: str = Header(default="dev")):
    user = get_user_from_request(authorization)
    check_role(user, ADMIN_ROLES)
    u = find_by_id("users", user_id)
    if not u:
        raise HTTPException(404, "User tidak ditemukan")
    if body.role and body.role not in VALID_ROLES:
        raise HTTPException(400, f"Role tidak valid: {body.role}")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "Tidak ada perubahan yang dikirim")
    updated = update("users", user_id, updates)
    return ok(_safe(updated), "User berhasil diperbarui")

# ── POST reset password ────────────────────────────────────
class ResetPassword(BaseModel):
    new_password: str

@router.post("/{user_id}/reset-password")
def reset_password(user_id: str, body: ResetPassword, authorization: str = Header(default="dev")):
    user = get_user_from_request(authorization)
    check_role(user, ["super_admin"])
    u = find_by_id("users", user_id)
    if not u:
        raise HTTPException(404, "User tidak ditemukan")
    if len(body.new_password) < 6:
        raise HTTPException(400, "Password minimal 6 karakter")
    update("users", user_id, {"password_hash": hash_password(body.new_password)})
    return ok(message="Password berhasil direset")
