"""
Notification Service - Email and SMS notifications
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
from enum import Enum

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationSubscription
from app.models.communication import Communication, CommunicationTemplate, CommunicationAttachment
from app.models.user import User
from app.models.customer import Customer
from app.core.config import settings
from app.core.exceptions import NotFoundError, BusinessLogicError


class NotificationType(str, Enum):
    """Notification types."""
    ORDER_CONFIRMATION = "order_confirmation"
    ORDER_SHIPPED = "order_shipped"
    ORDER_DELIVERED = "order_delivered"
    QUOTE_SENT = "quote_sent"
    QUOTE_APPROVED = "quote_approved"
    QUOTE_EXPIRING = "quote_expiring"
    JOB_STARTED = "job_started"
    JOB_COMPLETED = "job_completed"
    JOB_STATUS_UPDATE = "job_status_update"
    INVOICE_SENT = "invoice_sent"
    INVOICE_REMINDER = "invoice_reminder"
    INVOICE_OVERDUE = "invoice_overdue"
    PAYMENT_RECEIVED = "payment_received"
    APPOINTMENT_REMINDER = "appointment_reminder"
    LOW_STOCK_ALERT = "low_stock_alert"
    PRICE_CHANGE_ALERT = "price_change_alert"
    WELCOME = "welcome"
    PASSWORD_RESET = "password_reset"


class NotificationService:
    """Service class for sending notifications."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._email_client = None
        self._sms_client = None

    # Email Client Setup (SendGrid)

    def _get_email_client(self):
        """Get or create SendGrid email client."""
        if self._email_client is None and settings.SENDGRID_API_KEY:
            try:
                from sendgrid import SendGridAPIClient
                self._email_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
            except ImportError:
                pass
        return self._email_client

    # SMS Client Setup (Twilio)

    def _get_sms_client(self):
        """Get or create Twilio SMS client."""
        if self._sms_client is None and settings.TWILIO_ACCOUNT_SID:
            try:
                from twilio.rest import Client
                self._sms_client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            except ImportError:
                pass
        return self._sms_client

    # Template Management

    async def get_template(
        self,
        template_type: str,
        channel: str = "email"
    ) -> Optional[CommunicationTemplate]:
        """Get a communication template."""
        result = await self.db.execute(
            select(CommunicationTemplate)
            .where(
                CommunicationTemplate.template_type == template_type,
                CommunicationTemplate.channel == channel,
                CommunicationTemplate.is_active == True
            )
        )
        return result.scalar_one_or_none()

    async def create_template(
        self,
        template_type: str,
        channel: str,
        name: str,
        subject: Optional[str],
        body: str,
        variables: Optional[List[str]] = None
    ) -> CommunicationTemplate:
        """Create a communication template."""
        template = CommunicationTemplate(
            template_type=template_type,
            channel=channel,
            name=name,
            subject=subject,
            body=body,
            variables=variables or [],
            is_active=True
        )
        self.db.add(template)
        await self.db.flush()
        await self.db.refresh(template)
        return template

    def _render_template(
        self,
        template: str,
        variables: Dict[str, Any]
    ) -> str:
        """Render a template with variables."""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    # Email Sending

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
        user_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Send an email notification."""
        email_client = self._get_email_client()

        # Record communication
        communication = Communication(
            channel="email",
            direction="outbound",
            status="pending",
            recipient=to_email,
            subject=subject,
            body=body,
            user_id=user_id,
            customer_id=customer_id,
            reference_type=reference_type,
            reference_id=reference_id
        )
        self.db.add(communication)
        await self.db.flush()

        if email_client:
            try:
                from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType

                message = Mail(
                    from_email=from_email or settings.EMAIL_FROM,
                    to_emails=to_email,
                    subject=subject,
                    plain_text_content=body,
                    html_content=html_body
                )

                if reply_to:
                    message.reply_to = reply_to

                # Add attachments
                if attachments:
                    for att in attachments:
                        attachment = Attachment(
                            FileContent(att["content"]),
                            FileName(att["filename"]),
                            FileType(att.get("type", "application/octet-stream"))
                        )
                        message.attachment = attachment

                response = email_client.send(message)

                communication.status = "sent"
                communication.sent_at = datetime.utcnow()
                communication.external_id = response.headers.get("X-Message-Id")

                await self.db.flush()

                return {
                    "success": True,
                    "communication_id": communication.id,
                    "message_id": communication.external_id
                }

            except Exception as e:
                communication.status = "failed"
                communication.error_message = str(e)
                await self.db.flush()

                return {
                    "success": False,
                    "communication_id": communication.id,
                    "error": str(e)
                }
        else:
            # No email client configured - log for development
            communication.status = "skipped"
            communication.notes = "Email client not configured"
            await self.db.flush()

            return {
                "success": True,
                "communication_id": communication.id,
                "message": "Email client not configured - logged for development"
            }

    # SMS Sending

    async def send_sms(
        self,
        to_phone: str,
        message: str,
        user_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Send an SMS notification."""
        sms_client = self._get_sms_client()

        # Record communication
        communication = Communication(
            channel="sms",
            direction="outbound",
            status="pending",
            recipient=to_phone,
            body=message,
            user_id=user_id,
            customer_id=customer_id,
            reference_type=reference_type,
            reference_id=reference_id
        )
        self.db.add(communication)
        await self.db.flush()

        if sms_client:
            try:
                sms_message = sms_client.messages.create(
                    body=message,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=to_phone
                )

                communication.status = "sent"
                communication.sent_at = datetime.utcnow()
                communication.external_id = sms_message.sid

                await self.db.flush()

                return {
                    "success": True,
                    "communication_id": communication.id,
                    "message_sid": sms_message.sid
                }

            except Exception as e:
                communication.status = "failed"
                communication.error_message = str(e)
                await self.db.flush()

                return {
                    "success": False,
                    "communication_id": communication.id,
                    "error": str(e)
                }
        else:
            # No SMS client configured
            communication.status = "skipped"
            communication.notes = "SMS client not configured"
            await self.db.flush()

            return {
                "success": True,
                "communication_id": communication.id,
                "message": "SMS client not configured - logged for development"
            }

    # High-Level Notification Methods

    async def send_order_confirmation(
        self,
        order_id: int,
        email: str,
        order_number: str,
        total: float,
        items: List[Dict]
    ) -> Dict[str, Any]:
        """Send order confirmation email."""
        template = await self.get_template(NotificationType.ORDER_CONFIRMATION)

        if template:
            subject = self._render_template(template.subject, {"order_number": order_number})
            body = self._render_template(template.body, {
                "order_number": order_number,
                "total": f"${total:.2f}",
                "items_count": len(items)
            })
        else:
            subject = f"Order Confirmation - {order_number}"
            body = f"""
Thank you for your order!

Order Number: {order_number}
Total: ${total:.2f}
Items: {len(items)}

We'll notify you when your order ships.

Thank you for choosing Precision Engine and Dyno!
"""

        return await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="order",
            reference_id=order_id
        )

    async def send_quote_notification(
        self,
        quote_id: int,
        email: str,
        quote_number: str,
        customer_name: str,
        total: float,
        valid_until: str,
        quote_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send quote notification to customer."""
        template = await self.get_template(NotificationType.QUOTE_SENT)

        if template:
            subject = self._render_template(template.subject, {"quote_number": quote_number})
            body = self._render_template(template.body, {
                "customer_name": customer_name,
                "quote_number": quote_number,
                "total": f"${total:.2f}",
                "valid_until": valid_until,
                "quote_url": quote_url or ""
            })
        else:
            subject = f"Your Quote from Precision Engine and Dyno - {quote_number}"
            body = f"""
Dear {customer_name},

Thank you for your inquiry. Please find your quote details below:

Quote Number: {quote_number}
Total: ${total:.2f}
Valid Until: {valid_until}

{f'View your quote online: {quote_url}' if quote_url else ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
Precision Engine and Dyno
"""

        return await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="quote",
            reference_id=quote_id
        )

    async def send_job_update(
        self,
        job_id: int,
        email: str,
        phone: Optional[str],
        job_number: str,
        customer_name: str,
        status: str,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send job status update notification."""
        subject = f"Job Update - {job_number}"

        status_messages = {
            "scheduled": "Your job has been scheduled.",
            "in_progress": "Work has begun on your vehicle.",
            "on_hold": "Your job has been put on hold. We'll contact you with more details.",
            "quality_check": "Your vehicle is undergoing final quality inspection.",
            "completed": "Great news! Your job is complete and ready for pickup."
        }

        status_text = status_messages.get(status, f"Status updated to: {status}")

        body = f"""
Dear {customer_name},

{status_text}

Job Number: {job_number}
{f'Additional Notes: {message}' if message else ''}

If you have any questions, please contact us.

Best regards,
Precision Engine and Dyno
"""

        results = {"email": None, "sms": None}

        # Send email
        results["email"] = await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="job",
            reference_id=job_id
        )

        # Send SMS if phone provided and status warrants it
        if phone and status in ["completed", "in_progress"]:
            sms_body = f"Precision Engine: Your job {job_number} - {status_text}"
            results["sms"] = await self.send_sms(
                to_phone=phone,
                message=sms_body,
                reference_type="job",
                reference_id=job_id
            )

        return results

    async def send_invoice_notification(
        self,
        invoice_id: int,
        email: str,
        invoice_number: str,
        customer_name: str,
        total: float,
        due_date: str,
        invoice_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send invoice notification."""
        subject = f"Invoice {invoice_number} from Precision Engine and Dyno"

        body = f"""
Dear {customer_name},

Please find your invoice details below:

Invoice Number: {invoice_number}
Amount Due: ${total:.2f}
Due Date: {due_date}

{f'View and pay online: {invoice_url}' if invoice_url else ''}

Payment Methods:
- Cash or check at our location
- Credit/debit card online or in person
- Bank transfer (contact us for details)

Thank you for your business!

Best regards,
Precision Engine and Dyno
"""

        return await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="invoice",
            reference_id=invoice_id
        )

    async def send_invoice_reminder(
        self,
        invoice_id: int,
        email: str,
        invoice_number: str,
        customer_name: str,
        total: float,
        due_date: str,
        days_overdue: int = 0
    ) -> Dict[str, Any]:
        """Send invoice payment reminder."""
        if days_overdue > 0:
            subject = f"Payment Overdue - Invoice {invoice_number}"
            urgency = f"This invoice is {days_overdue} days past due."
        else:
            subject = f"Payment Reminder - Invoice {invoice_number}"
            urgency = f"This invoice is due on {due_date}."

        body = f"""
Dear {customer_name},

This is a friendly reminder regarding your outstanding invoice.

Invoice Number: {invoice_number}
Amount Due: ${total:.2f}
{urgency}

Please arrange payment at your earliest convenience.

If you have already made payment, please disregard this notice.

Best regards,
Precision Engine and Dyno
"""

        return await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="invoice",
            reference_id=invoice_id
        )

    async def send_appointment_reminder(
        self,
        customer_id: int,
        email: str,
        phone: Optional[str],
        customer_name: str,
        appointment_date: str,
        appointment_time: str,
        service_description: str
    ) -> Dict[str, Any]:
        """Send appointment reminder."""
        subject = "Appointment Reminder - Precision Engine and Dyno"

        body = f"""
Dear {customer_name},

This is a reminder of your upcoming appointment:

Date: {appointment_date}
Time: {appointment_time}
Service: {service_description}

Location:
Precision Engine and Dyno
[Address Here]

If you need to reschedule, please contact us as soon as possible.

We look forward to seeing you!

Best regards,
Precision Engine and Dyno
"""

        results = {"email": None, "sms": None}

        results["email"] = await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            customer_id=customer_id,
            reference_type="appointment"
        )

        if phone:
            sms_body = f"Reminder: Appointment at Precision Engine on {appointment_date} at {appointment_time} for {service_description}"
            results["sms"] = await self.send_sms(
                to_phone=phone,
                message=sms_body,
                customer_id=customer_id,
                reference_type="appointment"
            )

        return results

    async def send_low_stock_alert(
        self,
        admin_email: str,
        product_name: str,
        sku: str,
        current_quantity: int,
        reorder_point: int
    ) -> Dict[str, Any]:
        """Send low stock alert to admin."""
        subject = f"Low Stock Alert: {sku}"

        body = f"""
Low Stock Alert

Product: {product_name}
SKU: {sku}
Current Quantity: {current_quantity}
Reorder Point: {reorder_point}

Please reorder this item soon to avoid stockouts.
"""

        return await self.send_email(
            to_email=admin_email,
            subject=subject,
            body=body,
            reference_type="inventory"
        )

    async def send_password_reset(
        self,
        email: str,
        reset_token: str,
        reset_url: str
    ) -> Dict[str, Any]:
        """Send password reset email."""
        subject = "Password Reset Request - Precision Engine and Dyno"

        body = f"""
A password reset was requested for your account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you did not request this reset, please ignore this email.

Best regards,
Precision Engine and Dyno
"""

        return await self.send_email(
            to_email=email,
            subject=subject,
            body=body,
            reference_type="password_reset"
        )

    # Subscription Management

    async def subscribe(
        self,
        user_id: Optional[int],
        customer_id: Optional[int],
        email: Optional[str],
        phone: Optional[str],
        notification_types: List[str],
        channels: List[str]
    ) -> NotificationSubscription:
        """Create or update notification subscription."""
        # Check for existing subscription
        query = select(NotificationSubscription)
        if user_id:
            query = query.where(NotificationSubscription.user_id == user_id)
        elif customer_id:
            query = query.where(NotificationSubscription.customer_id == customer_id)
        elif email:
            query = query.where(NotificationSubscription.email == email)

        result = await self.db.execute(query)
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.notification_types = notification_types
            subscription.channels = channels
            subscription.email = email
            subscription.phone = phone
            subscription.is_active = True
        else:
            subscription = NotificationSubscription(
                user_id=user_id,
                customer_id=customer_id,
                email=email,
                phone=phone,
                notification_types=notification_types,
                channels=channels,
                is_active=True
            )
            self.db.add(subscription)

        await self.db.flush()
        await self.db.refresh(subscription)
        return subscription

    async def unsubscribe(
        self,
        user_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        email: Optional[str] = None
    ) -> bool:
        """Unsubscribe from notifications."""
        query = select(NotificationSubscription)
        if user_id:
            query = query.where(NotificationSubscription.user_id == user_id)
        elif customer_id:
            query = query.where(NotificationSubscription.customer_id == customer_id)
        elif email:
            query = query.where(NotificationSubscription.email == email)

        result = await self.db.execute(query)
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.is_active = False
            await self.db.flush()
            return True
        return False
