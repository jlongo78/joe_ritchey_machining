import asyncio
from datetime import datetime
from sqlalchemy import text
from app.db.database import async_session_factory, init_db, engine
from app.core.security import get_password_hash

async def setup_admin():
    await init_db()

    password_hash = get_password_hash('Admin123!')
    now = datetime.utcnow().isoformat()

    async with engine.begin() as conn:
        # Check if user exists
        result = await conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": "admin@joeritchey.com"}
        )
        existing = result.fetchone()

        if existing:
            # Update password
            await conn.execute(
                text("UPDATE users SET password_hash = :pwd WHERE email = :email"),
                {"pwd": password_hash, "email": "admin@joeritchey.com"}
            )
            print("Password updated for admin@joeritchey.com")
        else:
            # Insert new user
            await conn.execute(
                text("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at)
                    VALUES (:email, :pwd, :first, :last, :role, 1, 1, :now, :now)
                """),
                {
                    "email": "admin@joeritchey.com",
                    "pwd": password_hash,
                    "first": "Admin",
                    "last": "User",
                    "role": "admin",
                    "now": now
                }
            )
            print("Created admin@joeritchey.com with password Admin123!")

asyncio.run(setup_admin())
