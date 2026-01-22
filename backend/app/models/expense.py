"""
Expense Models for Accounting
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class ExpenseCategory(Base):
    """Expense category for classification."""

    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    parent = relationship("ExpenseCategory", remote_side=[id], backref="subcategories")
    expenses = relationship("Expense", back_populates="category")

    def __repr__(self):
        return f"<ExpenseCategory(id={self.id}, name={self.name})>"


class Expense(Base, TimestampMixin):
    """Expense record for business expense tracking."""

    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    vendor = Column(String(200), nullable=True)
    description = Column(String(500), nullable=False)
    expense_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)

    # Payment Details
    payment_method = Column(String(50), nullable=True)  # cash, check, credit_card, debit, ach
    reference_number = Column(String(100), nullable=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)

    # Receipt
    receipt_path = Column(String(500), nullable=True)
    has_receipt = Column(Boolean, default=False, nullable=False)

    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected, paid
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Reimbursement
    is_reimbursable = Column(Boolean, default=False, nullable=False)
    reimbursed = Column(Boolean, default=False, nullable=False)
    reimbursed_to = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reimbursed_at = Column(DateTime, nullable=True)

    # Job Association
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    is_billable = Column(Boolean, default=False, nullable=False)

    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    category = relationship("ExpenseCategory", back_populates="expenses")
    bank_account = relationship("BankAccount", back_populates="expenses")
    approver = relationship("User", foreign_keys=[approved_by])
    reimbursed_employee = relationship("Employee", foreign_keys=[reimbursed_to])
    job = relationship("Job")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<Expense(id={self.id}, amount={self.total_amount}, date={self.expense_date})>"
