
from django.db import models
from students.models import Student


class Timetable(models.Model):

    DAYS_OF_WEEK = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="timetable_entries",
    )

    subject = models.CharField(max_length=100)

    day = models.CharField(
        max_length=10,
        choices=DAYS_OF_WEEK,
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    teacher = models.CharField(max_length=100, blank=True)

    room = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["day", "start_time"]

    def __str__(self):
        return f"{self.student.name} - {self.subject} - {self.day}"
