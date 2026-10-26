
from rest_framework import serializers
from .models import Timetable


class TimetableSerializer(serializers.ModelSerializer):
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
        model = Timetable
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "course",
            "subject",
            "day",
            "start_time",
            "end_time",
            "teacher",
            "room",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        start_time = data.get(
            "start_time",
            getattr(self.instance, "start_time", None)
        )

        end_time = data.get(
            "end_time",
            getattr(self.instance, "end_time", None)
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "End time must be later than start time."
            })

        return data
