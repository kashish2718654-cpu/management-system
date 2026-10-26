
from django.db import models


class FacultyStaff(models.Model):
    ROLE_CHOICES = [
        ("Faculty", "Faculty"),
        ("Admin Staff", "Admin Staff"),
        ("Accountant", "Accountant"),
        ("Receptionist", "Receptionist"),
        ("Other", "Other"),
    ]

    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default="Faculty",
    )
    department = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=150, blank=True)
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.employee_id} - {self.name}"
