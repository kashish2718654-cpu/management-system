
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import FeeAccount, Payment
from .serializers import (
    FeeAccountSerializer,
    PaymentSerializer,
)


class FeeAccountViewSet(viewsets.ModelViewSet):
    queryset = FeeAccount.objects.select_related("student").all()
    serializer_class = FeeAccountSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "fee_account",
        "fee_account__student",
    ).all()
    serializer_class = PaymentSerializer


@api_view(["GET"])
def pending_fee_report(request):
    accounts = (
        FeeAccount.objects
        .select_related("student")
        .prefetch_related("payments")
        .order_by("student__name")
    )

    report = []

    for account in accounts:
        amount_paid = account.amount_paid
        balance = account.balance

        if balance > 0:
            report.append({
                "account_id": account.id,
                "student_code": account.student.student_id,
                "student_name": account.student.name,
                "course": account.student.course,
                "total_fee": str(account.total_fee),
                "amount_paid": str(amount_paid),
                "balance": str(balance),
                "status": account.status,
            })

    return Response(report)
