
from rest_framework import serializers
from .models import Course, Batch


class CourseSerializer(serializers.ModelSerializer):
    batch_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "duration",
            "fee",
            "description",
            "status",
            "batch_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "batch_count", "created_at", "updated_at"]

    def get_batch_count(self, obj):
        return obj.batches.count()


class BatchSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
    )
    faculty_name = serializers.CharField(
        source="faculty.name",
        read_only=True,
        allow_null=True,
    )
    student_count = serializers.SerializerMethodField()
    student_details = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = [
            "id",
            "course",
            "course_name",
            "name",
            "faculty",
            "faculty_name",
            "shift",
            "start_time",
            "end_time",
            "start_date",
            "end_date",
            "status",
            "students",
            "student_count",
            "student_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "course_name",
            "faculty_name",
            "student_count",
            "student_details",
            "created_at",
            "updated_at",
        ]

    def get_student_count(self, obj):
        return obj.students.count()

    def get_student_details(self, obj):
        return [
            {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
            }
            for student in obj.students.all()
        ]

    def validate(self, attrs):
        start_time = attrs.get(
            "start_time",
            getattr(self.instance, "start_time", None),
        )
        end_time = attrs.get(
            "end_time",
            getattr(self.instance, "end_time", None),
        )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "End time must be later than start time."
            })

        start_date = attrs.get(
            "start_date",
            getattr(self.instance, "start_date", None),
        )
        end_date = attrs.get(
            "end_date",
            getattr(self.instance, "end_date", None),
        )

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                "end_date": "End date cannot be before start date."
            })

        return attrs
