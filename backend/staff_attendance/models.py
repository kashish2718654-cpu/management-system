
from django.db import models
from faculty.models import FacultyStaff


class StaffAttendance(models.Model):

    STATUS_CHOICES = [
        ("Present", "Present"),
        ("Absent", "Absent"),
        ("Late", "Late"),
        ("Half Day", "Half Day"),
        ("Leave", "Leave"),
    ]

    staff = models.ForeignKey(
        FacultyStaff,
        on_delete=models.PROTECT,
        related_name="staff_attendance_records"
    )

    date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="Present"
    )

    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)

    remarks = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "staff__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["staff", "date"],
                name="unique_staff_attendance_per_day"
            )
        ]

    def __str__(self):
        return f"{self.staff.name} - {self.date} - {self.status}"
