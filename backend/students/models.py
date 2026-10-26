
import re
from django.db import models


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    course = models.CharField(max_length=100)
    batch = models.CharField(max_length=50, default="Morning")
    joining_date = models.DateField()

    FEE_STATUS_CHOICES = [
        ("Paid", "Paid"),
        ("Pending", "Pending"),
        ("Partial", "Partial"),
    ]

    fee_status = models.CharField(
        max_length=10,
        choices=FEE_STATUS_CHOICES,
        default="Pending"
    )

    def __str__(self):
        return f"{self.student_id} - {self.name}"

    def save(self, *args, **kwargs):
        if not self.pk:
            existing_ids = Student.objects.values_list(
                "student_id", flat=True
            )

            highest_number = 0

            for student_id in existing_ids:
                match = re.fullmatch(r"STU(\d+)", student_id)

                if match:
                    highest_number = max(
                        highest_number,
                        int(match.group(1))
                    )

            self.student_id = f"STU{highest_number + 1:03d}"

        super().save(*args, **kwargs)
