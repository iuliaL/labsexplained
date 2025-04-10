import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.config import SECRET_KEY, ALGORITHM

def create_access_token(data: dict, expires_delta: Optional[timedelta] = timedelta(hours=1)):
    """Generate JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    """Verify the JWT token and extract the data."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError:
        raise Exception("Invalid token")
