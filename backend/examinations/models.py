
from django.db import models


class Examination(models.Model):
    name = models.CharField(max_length=150)
    subject = models.CharField(max_length=100)
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_marks = models.PositiveIntegerField(default=100)
    passing_marks = models.PositiveIntegerField(default=40)
    room = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["exam_date", "start_time"]

    def __str__(self):
        return f"{self.name} - {self.subject}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.end_time <= self.start_time:
            raise ValidationError(
                {"end_time": "End time must be later than start time."}
            )

        if self.passing_marks > self.total_marks:
            raise ValidationError(
                {"passing_marks": "Passing marks cannot exceed total marks."}
            )
