
from rest_framework import serializers
from .models import InstituteSetting


class InstituteSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = InstituteSetting

        fields = [
            "id",

            # Institute Information
            "institute_name",
            "email",
            "phone",
            "address",
            "website",
            "registration_number",

            # Admin Profile
            "admin_name",
            "admin_username",
            "admin_email",
            "admin_phone",

            # Notifications
            "notifications",
            "student_notifications",
            "fee_notifications",
            "attendance_notifications",
            "examination_notifications",
            "result_notifications",

            "updated_at",
        ]

        read_only_fields = ["id", "updated_at"]
