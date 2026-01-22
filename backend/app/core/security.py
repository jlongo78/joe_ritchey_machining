"""
Security utilities for authentication, password hashing, and JWT token management.
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.core.config import settings


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    sub: str
    exp: datetime
    type: str  # "access" or "refresh"
    role: Optional[str] = None


class TokenData(BaseModel):
    """Token data extracted from JWT."""
    user_id: int
    email: str
    role: str
    token_type: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, int],
    role: str = "customer",
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject (typically user ID or email)
        role: User role for authorization
        expires_delta: Custom expiration time

    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "access",
        "role": role,
        "iat": datetime.utcnow()
    }

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.

    Args:
        subject: The subject (typically user ID or email)
        expires_delta: Custom expiration time

    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow()
    }

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token to decode

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[TokenPayload]:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token to verify
        token_type: Expected token type ("access" or "refresh")

    Returns:
        TokenPayload if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None

    # Check token type
    if payload.get("type") != token_type:
        return None

    # Check expiration
    exp = payload.get("exp")
    if exp is None or datetime.fromtimestamp(exp) < datetime.utcnow():
        return None

    return TokenPayload(
        sub=payload.get("sub"),
        exp=datetime.fromtimestamp(exp),
        type=payload.get("type"),
        role=payload.get("role")
    )


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.

    Args:
        email: User email address

    Returns:
        Password reset token
    """
    delta = timedelta(hours=24)
    now = datetime.utcnow()
    expire = now + delta

    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "password_reset",
        "iat": now
    }

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token.

    Args:
        token: The password reset token

    Returns:
        Email address if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None

    if payload.get("type") != "password_reset":
        return None

    exp = payload.get("exp")
    if exp is None or datetime.fromtimestamp(exp) < datetime.utcnow():
        return None

    return payload.get("sub")


def generate_email_verification_token(email: str) -> str:
    """
    Generate an email verification token.

    Args:
        email: User email address

    Returns:
        Email verification token
    """
    delta = timedelta(days=7)
    now = datetime.utcnow()
    expire = now + delta

    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "email_verification",
        "iat": now
    }

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )


def verify_email_verification_token(token: str) -> Optional[str]:
    """
    Verify an email verification token.

    Args:
        token: The email verification token

    Returns:
        Email address if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None

    if payload.get("type") != "email_verification":
        return None

    exp = payload.get("exp")
    if exp is None or datetime.fromtimestamp(exp) < datetime.utcnow():
        return None

    return payload.get("sub")
