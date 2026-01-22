"""
Custom exception classes for the application.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""

    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An unexpected error occurred",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


# Authentication Exceptions
class AuthenticationError(AppException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class InvalidCredentialsError(AuthenticationError):
    """Raised when credentials are invalid."""

    def __init__(self, detail: str = "Invalid email or password"):
        super().__init__(detail=detail)


class TokenExpiredError(AuthenticationError):
    """Raised when a token has expired."""

    def __init__(self, detail: str = "Token has expired"):
        super().__init__(detail=detail)


class InvalidTokenError(AuthenticationError):
    """Raised when a token is invalid."""

    def __init__(self, detail: str = "Invalid token"):
        super().__init__(detail=detail)


# Authorization Exceptions
class PermissionDeniedError(AppException):
    """Raised when user lacks permission."""

    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class InsufficientRoleError(PermissionDeniedError):
    """Raised when user's role is insufficient."""

    def __init__(self, required_role: str):
        super().__init__(
            detail=f"This action requires {required_role} role or higher"
        )


# Resource Exceptions
class NotFoundError(AppException):
    """Raised when a resource is not found."""

    def __init__(self, resource: str = "Resource", detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail or f"{resource} not found"
        )


class AlreadyExistsError(AppException):
    """Raised when a resource already exists."""

    def __init__(self, resource: str = "Resource", detail: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail or f"{resource} already exists"
        )


class DuplicateEntryError(AlreadyExistsError):
    """Raised when there's a duplicate entry."""

    def __init__(self, field: str, value: str):
        super().__init__(
            detail=f"A record with {field} '{value}' already exists"
        )


# Validation Exceptions
class ValidationError(AppException):
    """Raised when validation fails."""

    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class InvalidInputError(ValidationError):
    """Raised when input is invalid."""

    def __init__(self, field: str, detail: str):
        super().__init__(detail=f"Invalid {field}: {detail}")


# Business Logic Exceptions
class BusinessLogicError(AppException):
    """Raised when a business rule is violated."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class InsufficientStockError(BusinessLogicError):
    """Raised when there's insufficient stock."""

    def __init__(self, product_name: str, available: int, requested: int):
        super().__init__(
            detail=f"Insufficient stock for '{product_name}': {available} available, {requested} requested"
        )


class InvalidStatusTransitionError(BusinessLogicError):
    """Raised when a status transition is invalid."""

    def __init__(self, current_status: str, new_status: str, entity: str = "record"):
        super().__init__(
            detail=f"Cannot transition {entity} from '{current_status}' to '{new_status}'"
        )


class PaymentError(BusinessLogicError):
    """Raised when a payment operation fails."""

    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(detail=detail)


class QuoteExpiredError(BusinessLogicError):
    """Raised when a quote has expired."""

    def __init__(self, quote_number: str):
        super().__init__(detail=f"Quote {quote_number} has expired")


class JobNotApprovedError(BusinessLogicError):
    """Raised when a job has not been approved."""

    def __init__(self, job_number: str):
        super().__init__(detail=f"Job {job_number} requires customer approval before proceeding")


# External Service Exceptions
class ExternalServiceError(AppException):
    """Raised when an external service fails."""

    def __init__(self, service: str, detail: str = "Service unavailable"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{service}: {detail}"
        )


class EmailServiceError(ExternalServiceError):
    """Raised when email service fails."""

    def __init__(self, detail: str = "Failed to send email"):
        super().__init__(service="Email Service", detail=detail)


class SMSServiceError(ExternalServiceError):
    """Raised when SMS service fails."""

    def __init__(self, detail: str = "Failed to send SMS"):
        super().__init__(service="SMS Service", detail=detail)


class PaymentGatewayError(ExternalServiceError):
    """Raised when payment gateway fails."""

    def __init__(self, detail: str = "Payment gateway error"):
        super().__init__(service="Payment Gateway", detail=detail)


class SupplierAPIError(ExternalServiceError):
    """Raised when supplier API fails."""

    def __init__(self, supplier: str, detail: str = "Supplier API error"):
        super().__init__(service=f"Supplier API ({supplier})", detail=detail)


# Rate Limiting
class RateLimitExceededError(AppException):
    """Raised when rate limit is exceeded."""

    def __init__(self, detail: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail
        )
