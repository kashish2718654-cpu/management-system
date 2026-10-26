
from rest_framework import serializers
from .models import StudentResult


class StudentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.name",
        read_only=True,
    )

    student_code = serializers.CharField(
        source="student.student_id",
        read_only=True,
    )

    examination_name = serializers.CharField(
        source="examination.name",
        read_only=True,
    )

    subject = serializers.CharField(
        source="examination.subject",
        read_only=True,
    )

    total_marks = serializers.IntegerField(
        source="examination.total_marks",
        read_only=True,
    )

    passing_marks = serializers.IntegerField(
        source="examination.passing_marks",
        read_only=True,
    )

    percentage = serializers.ReadOnlyField()
    status = serializers.ReadOnlyField()

    class Meta:
        model = StudentResult
        fields = [
            "id",
            "student",
            "student_name",
            "student_code",
            "examination",
            "examination_name",
            "subject",
            "marks_obtained",
            "total_marks",
            "passing_marks",
            "percentage",
            "status",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, data):
        student = data.get(
            "student",
            getattr(self.instance, "student", None),
        )

        examination = data.get(
            "examination",
            getattr(self.instance, "examination", None),
        )

        marks = data.get(
            "marks_obtained",
            getattr(self.instance, "marks_obtained", None),
        )

        if marks is not None and marks < 0:
            raise serializers.ValidationError({
                "marks_obtained": "Marks cannot be negative."
            })

        if (
            marks is not None
            and examination is not None
            and marks > examination.total_marks
        ):
            raise serializers.ValidationError({
                "marks_obtained": (
                    f"Marks cannot exceed {examination.total_marks}."
                )
            })

        if student is None:
            raise serializers.ValidationError({
                "student": "Please select a student."
            })

        if examination is None:
            raise serializers.ValidationError({
                "examination": "Please select an examination."
            })

        duplicate = StudentResult.objects.filter(
            student=student,
            examination=examination,
        )

        if self.instance:
            duplicate = duplicate.exclude(pk=self.instance.pk)

        if duplicate.exists():
            raise serializers.ValidationError(
                "This student already has a result for this examination."
            )

        return data
