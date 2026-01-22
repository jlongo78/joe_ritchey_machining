"""
Bank Account Models for Accounting
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class BankAccount(Base, TimestampMixin):
    """Bank account model for financial tracking."""

    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False)  # checking, savings, credit_card, cash
    bank_name = Column(String(100), nullable=True)
    account_number_last4 = Column(String(4), nullable=True)
    routing_number = Column(String(9), nullable=True)
    current_balance = Column(Numeric(12, 2), default=0, nullable=False)
    available_balance = Column(Numeric(12, 2), default=0, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_reconciled_date = Column(Date, nullable=True)
    last_reconciled_balance = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    transactions = relationship("BankTransaction", back_populates="account", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="bank_account")

    def __repr__(self):
        return f"<BankAccount(id={self.id}, name={self.account_name}, type={self.account_type})>"


class BankTransaction(Base):
    """Bank transaction model for financial records."""

    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    post_date = Column(Date, nullable=True)

    transaction_type = Column(String(50), nullable=False)
    # deposit, withdrawal, transfer, payment, refund, fee, interest, adjustment

    description = Column(String(500), nullable=False)
    reference_number = Column(String(100), nullable=True)
    check_number = Column(String(20), nullable=True)

    # Amounts
    amount = Column(Numeric(12, 2), nullable=False)  # Positive for deposits, negative for withdrawals
    running_balance = Column(Numeric(12, 2), nullable=True)

    # Categorization
    category = Column(String(100), nullable=True)
    payee_payer = Column(String(200), nullable=True)

    # Reconciliation
    is_reconciled = Column(Boolean, default=False, nullable=False)
    reconciled_at = Column(DateTime, nullable=True)
    reconciled_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Links
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    account = relationship("BankAccount", back_populates="transactions")
    reconciler = relationship("User", foreign_keys=[reconciled_by])
    payment = relationship("Payment")
    expense = relationship("Expense")
    invoice = relationship("Invoice")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<BankTransaction(id={self.id}, amount={self.amount}, date={self.transaction_date})>"
