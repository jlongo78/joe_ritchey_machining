"""
Email-related Celery tasks.
"""

from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email_task(self, to_email: str, subject: str, body: str, html_body: str = None):
    """Send an email asynchronously."""
    try:
        # TODO: Implement actual email sending
        print(f"Sending email to {to_email}: {subject}")
        return {"status": "sent", "to": to_email}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_welcome_email_task(self, user_id: int, email: str, name: str):
    """Send welcome email to new user."""
    try:
        print(f"Sending welcome email to {email}")
        return {"status": "sent", "user_id": user_id}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_password_reset_email_task(self, email: str, reset_token: str):
    """Send password reset email."""
    try:
        print(f"Sending password reset email to {email}")
        return {"status": "sent", "email": email}
    except Exception as exc:
        self.retry(exc=exc, countdown=60)
