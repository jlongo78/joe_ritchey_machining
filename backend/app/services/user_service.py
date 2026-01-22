"""
User Service - Business logic for user management
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserAddress, PasswordResetToken
from app.schemas.user import UserCreate, UserUpdate, AddressCreate
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token,
    generate_password_reset_token, verify_password_reset_token
)
from app.core.exceptions import (
    NotFoundError, DuplicateEntryError, InvalidCredentialsError,
    InvalidTokenError, ValidationError
)


class UserService:
    """Service class for user operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        role: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[User], int]:
        """Get all users with pagination and filters."""
        query = select(User)

        if role:
            query = query.where(User.role == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
        result = await self.db.execute(query)
        users = result.scalars().all()

        return list(users), total_count

    async def create(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check for duplicate email
        existing = await self.get_by_email(user_data.email)
        if existing:
            raise DuplicateEntryError("email", user_data.email)

        # Create user
        user = User(
            email=user_data.email.lower(),
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=user_data.role,
        )

        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user_id: int, user_data: UserUpdate) -> User:
        """Update a user."""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")

        # Check for duplicate email if changing
        if user_data.email and user_data.email.lower() != user.email:
            existing = await self.get_by_email(user_data.email)
            if existing:
                raise DuplicateEntryError("email", user_data.email)

        # Update fields
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                value = value.lower()
            setattr(user, field, value)

        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        """Delete a user (soft delete by deactivating)."""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")

        user.is_active = False
        await self.db.flush()
        return True

    async def authenticate(self, email: str, password: str) -> User:
        """Authenticate a user."""
        user = await self.get_by_email(email)
        if not user:
            raise InvalidCredentialsError()

        if not user.is_active:
            raise InvalidCredentialsError("Account is deactivated")

        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.flush()

        return user

    async def create_tokens(self, user: User) -> dict:
        """Create access and refresh tokens for a user."""
        access_token = create_access_token(subject=user.id, role=user.role)
        refresh_token = create_refresh_token(subject=user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes
        }

    async def change_password(
        self,
        user_id: int,
        current_password: str,
        new_password: str
    ) -> bool:
        """Change user password."""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")

        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError("Current password is incorrect")

        user.password_hash = get_password_hash(new_password)
        await self.db.flush()
        return True

    async def request_password_reset(self, email: str) -> str:
        """Request a password reset token."""
        user = await self.get_by_email(email)
        if not user:
            # Don't reveal if user exists
            return ""

        token = generate_password_reset_token(email)
        return token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using token."""
        email = verify_password_reset_token(token)
        if not email:
            raise InvalidTokenError("Invalid or expired reset token")

        user = await self.get_by_email(email)
        if not user:
            raise NotFoundError("User")

        user.password_hash = get_password_hash(new_password)
        await self.db.flush()
        return True

    async def verify_email(self, user_id: int) -> bool:
        """Mark user's email as verified."""
        user = await self.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")

        user.email_verified = True
        await self.db.flush()
        return True

    # Address management

    async def get_addresses(self, user_id: int) -> List[UserAddress]:
        """Get all addresses for a user."""
        result = await self.db.execute(
            select(UserAddress)
            .where(UserAddress.user_id == user_id)
            .order_by(UserAddress.is_default.desc())
        )
        return list(result.scalars().all())

    async def add_address(self, user_id: int, address_data: AddressCreate) -> UserAddress:
        """Add an address for a user."""
        # If setting as default, unset other defaults
        if address_data.is_default:
            await self.db.execute(
                select(UserAddress)
                .where(
                    UserAddress.user_id == user_id,
                    UserAddress.address_type == address_data.address_type
                )
            )
            # Manually update defaults
            existing = await self.db.execute(
                select(UserAddress)
                .where(
                    UserAddress.user_id == user_id,
                    UserAddress.address_type == address_data.address_type,
                    UserAddress.is_default == True
                )
            )
            for addr in existing.scalars().all():
                addr.is_default = False

        address = UserAddress(
            user_id=user_id,
            **address_data.model_dump()
        )
        self.db.add(address)
        await self.db.flush()
        await self.db.refresh(address)
        return address

    async def update_address(
        self,
        user_id: int,
        address_id: int,
        address_data: AddressCreate
    ) -> UserAddress:
        """Update a user address."""
        result = await self.db.execute(
            select(UserAddress)
            .where(UserAddress.id == address_id, UserAddress.user_id == user_id)
        )
        address = result.scalar_one_or_none()
        if not address:
            raise NotFoundError("Address")

        # Update fields
        for field, value in address_data.model_dump().items():
            setattr(address, field, value)

        await self.db.flush()
        await self.db.refresh(address)
        return address

    async def delete_address(self, user_id: int, address_id: int) -> bool:
        """Delete a user address."""
        result = await self.db.execute(
            select(UserAddress)
            .where(UserAddress.id == address_id, UserAddress.user_id == user_id)
        )
        address = result.scalar_one_or_none()
        if not address:
            raise NotFoundError("Address")

        await self.db.delete(address)
        await self.db.flush()
        return True
