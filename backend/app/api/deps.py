"""
API Dependencies - Dependency injection for FastAPI endpoints
"""

from typing import Optional, AsyncGenerator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError

from app.db.database import async_session_factory as async_session_maker
from app.core.security import decode_token
from app.core.permissions import Permission, ROLE_PERMISSIONS, UserRole
from app.models.user import User
from app.services.user_service import UserService


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user from token."""
    if not token:
        return None

    try:
        payload = decode_token(token)
        if payload is None:
            return None

        user_id = payload.get("sub")
        token_type = payload.get("type")

        if user_id is None or token_type != "access":
            return None

        user_service = UserService(db)
        user = await user_service.get_by_id(int(user_id))

        if user is None or not user.is_active:
            return None

        return user

    except JWTError:
        return None


async def get_current_user_required(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require authenticated user."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def get_current_active_user(
    current_user: User = Depends(get_current_user_required)
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current verified user."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


def require_permission(permission: Permission):
    """Dependency factory for permission checking."""
    async def permission_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        user_role = UserRole(current_user.role)
        user_permissions = ROLE_PERMISSIONS.get(user_role, set())

        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {permission.value}"
            )
        return current_user

    return permission_checker


def require_roles(*roles: UserRole):
    """Dependency factory for role checking."""
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        user_role = UserRole(current_user.role)
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}"
            )
        return current_user

    return role_checker


async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current admin user."""
    if current_user.role not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_staff_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current staff or admin user."""
    if current_user.role not in ["admin", "owner", "manager", "technician", "sales"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )
    return current_user


def get_client_ip(request: Request) -> str:
    """Get client IP address."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Get user agent string."""
    return request.headers.get("User-Agent", "unknown")


# Session ID for guest carts
def get_session_id(request: Request) -> Optional[str]:
    """Get session ID from cookie or header."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = request.headers.get("X-Session-ID")
    return session_id


# Pagination parameters
class PaginationParams:
    """Common pagination parameters."""

    def __init__(
        self,
        skip: int = 0,
        limit: int = 20
    ):
        if skip < 0:
            skip = 0
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100

        self.skip = skip
        self.limit = limit


def get_pagination(
    skip: int = 0,
    limit: int = 20
) -> PaginationParams:
    """Get pagination parameters."""
    return PaginationParams(skip=skip, limit=limit)
