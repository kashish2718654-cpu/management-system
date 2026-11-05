
from rest_framework import serializers
from .models import StaffAttendance


class StaffAttendanceSerializer(serializers.ModelSerializer):

    staff_name = serializers.CharField(
        source="staff.name",
        read_only=True
    )

    employee_id = serializers.CharField(
        source="staff.employee_id",
        read_only=True
    )

    class Meta:
        model = StaffAttendance
        fields = [
            "id",
            "staff",
            "staff_name",
            "employee_id",
            "date",
            "status",
            "check_in_time",
            "check_out_time",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
