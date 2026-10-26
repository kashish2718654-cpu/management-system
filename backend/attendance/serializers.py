
from django.utils import timezone
from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.name",
        read_only=True
    )

    student_code = serializers.CharField(
        source="student.student_id",
        read_only=True
    )

    course = serializers.CharField(
        source="student.course",
        read_only=True
    )

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "course",
            "date",
            "status",
            "check_in_time",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "check_in_time",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        if validated_data.get("status") == "Present":
            validated_data["check_in_time"] = timezone.localtime().time().replace(microsecond=0)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_status = validated_data.get("status", instance.status)

        if new_status == "Present" and instance.status != "Present":
            validated_data["check_in_time"] = timezone.localtime().time()

        elif new_status == "Absent":
            validated_data["check_in_time"] = None

        return super().update(instance, validated_data)
