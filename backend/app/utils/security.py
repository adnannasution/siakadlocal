from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt

SECRET_KEY = "siakad-local-dev-secret-key-ganti-di-production"
ALGORITHM = "HS256"
ACCESS_EXPIRE_MINUTES = 480
REFRESH_EXPIRE_DAYS = 30

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "type": "access", "exp": exp}, SECRET_KEY, ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=REFRESH_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "type": "refresh", "exp": exp}, SECRET_KEY, ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
