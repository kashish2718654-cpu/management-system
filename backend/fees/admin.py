
from django.contrib import admin
from .models import FeeAccount, Payment


@admin.register(FeeAccount)
class FeeAccountAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "total_fee",
        "created_at",
    )
    search_fields = (
        "student__name",
        "student__student_id",
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "fee_account",
        "amount",
        "payment_date",
        "payment_method",
    )
    list_filter = ("payment_method", "payment_date")
    search_fields = (
        "fee_account__student__name",
        "fee_account__student__student_id",
    )
