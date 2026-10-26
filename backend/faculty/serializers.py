
from rest_framework import serializers
from .models import FacultyStaff


class FacultyStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyStaff
        fields = "__all__"

    def validate_salary(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Salary cannot be negative."
            )
        return value
