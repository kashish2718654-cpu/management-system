
from rest_framework import serializers
from .models import InstituteSetting


class InstituteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstituteSetting
        fields = [
            "id",
            "institute_name",
            "email",
            "phone",
            "address",
            "admin_name",
            "notifications",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]
