
from rest_framework import serializers
from .models import FeeAccount, Payment


class FeeAccountSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.name",
        read_only=True
    )

    student_code = serializers.CharField(
        source="student.student_id",
        read_only=True
    )

    amount_paid = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    balance = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    status = serializers.CharField(read_only=True)

    class Meta:
        model = FeeAccount
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "total_fee",
            "amount_paid",
            "balance",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_total_fee(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Total fee must be greater than zero."
            )
        return value


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="fee_account.student.name",
        read_only=True
    )

    student_code = serializers.CharField(
        source="fee_account.student.student_id",
        read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "fee_account",
            "student_name",
            "student_code",
            "amount",
            "payment_date",
            "payment_method",
            "note",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Payment amount must be greater than zero."
            )

        fee_account_id = self.initial_data.get("fee_account")

        if fee_account_id:
            try:
                fee_account = FeeAccount.objects.get(
                    pk=fee_account_id
                )
            except FeeAccount.DoesNotExist:
                raise serializers.ValidationError(
                    "Fee account does not exist."
                )

            if value > fee_account.balance:
                raise serializers.ValidationError(
                    "Payment cannot be greater than the remaining balance."
                )

        return value
