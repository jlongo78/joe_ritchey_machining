"""
Notification-related Celery tasks.
"""

from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_notification_task(self, user_id: int, title: str, message: str, notification_type: str = "info"):
    """Send a notification to a user."""
    try:
        print(f"Sending notification to user {user_id}: {title}")
        return {"status": "sent", "user_id": user_id}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_order_notification_task(self, order_id: int, user_id: int, status: str):
    """Send order status notification."""
    try:
        print(f"Sending order notification for order {order_id}")
        return {"status": "sent", "order_id": order_id}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_job_update_notification_task(self, job_id: int, customer_id: int, status: str):
    """Send job status update notification."""
    try:
        print(f"Sending job update notification for job {job_id}")
        return {"status": "sent", "job_id": job_id}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)
