import asyncio
from app.db.database import async_session_factory, init_db
from app.services.user_service import UserService

async def check_and_reset():
    await init_db()
    async with async_session_factory() as db:
        service = UserService(db)
        user = await service.get_by_email('admin@joeritchey.com')
        if user:
            print(f'User found: {user.email}, id={user.id}')
            await service.update_password(user.id, 'Admin123!')
            print('Password reset to: Admin123!')
        else:
            print('User not found')

asyncio.run(check_and_reset())
