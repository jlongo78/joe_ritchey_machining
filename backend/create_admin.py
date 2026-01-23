import asyncio
from app.db.database import async_session_factory, init_db
from app.services.user_service import UserService
from app.schemas.user import UserCreate

async def create_admin():
    await init_db()
    async with async_session_factory() as db:
        service = UserService(db)
        user = await service.create(UserCreate(
            email='admin@joeritchey.com',
            password='changeme123',
            first_name='Admin',
            last_name='User',
            role='admin'
        ))
        print(f'Created admin user: {user.email}')

asyncio.run(create_admin())
