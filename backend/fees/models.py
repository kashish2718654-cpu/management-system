from django.db import models
from students.models import Student


class FeeAccount(models.Model):
    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name="fee_account"
    )

    total_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def amount_paid(self):
        return self.payments.aggregate(
            total=models.Sum("amount")
        )["total"] or 0

    @property
    def balance(self):
        return self.total_fee - self.amount_paid

    @property
    def status(self):
        if self.amount_paid == 0:
            return "Pending"
        elif self.balance <= 0:
            return "Paid"
        return "Partial"

    def __str__(self):
        return f"{self.student.name} - Fee Account"


class Payment(models.Model):
    PAYMENT_METHODS = [
        ("Cash", "Cash"),
        ("UPI", "UPI"),
        ("Bank Transfer", "Bank Transfer"),
        ("Card", "Card"),
    ]

    fee_account = models.ForeignKey(
        FeeAccount,
        on_delete=models.CASCADE,
        related_name="payments"
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default="Cash"
    )
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.fee_account.student.name} - {self.amount}"