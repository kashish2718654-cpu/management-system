
from rest_framework import serializers
from .models import Examination


class ExaminationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examination
        fields = [
            "id",
            "name",
            "subject",
            "exam_date",
            "start_time",
            "end_time",
            "total_marks",
            "passing_marks",
            "room",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        start_time = data.get(
            "start_time",
            getattr(self.instance, "start_time", None)
        )
        end_time = data.get(
            "end_time",
            getattr(self.instance, "end_time", None)
        )
        total_marks = data.get(
            "total_marks",
            getattr(self.instance, "total_marks", 100)
        )
        passing_marks = data.get(
            "passing_marks",
            getattr(self.instance, "passing_marks", 40)
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                "end_time": "End time must be later than start time."
            })

        if passing_marks > total_marks:
            raise serializers.ValidationError({
                "passing_marks": "Passing marks cannot exceed total marks."
            })

        return data
