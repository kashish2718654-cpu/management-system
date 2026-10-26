
from django.db import models
from faculty.models import FacultyStaff


class Course(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    ]

    name = models.CharField(max_length=150, unique=True)
    duration = models.CharField(max_length=50)
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="Active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Batch(models.Model):
    STATUS_CHOICES = [
        ("Upcoming", "Upcoming"),
        ("Active", "Active"),
        ("Completed", "Completed"),
        ("Cancelled", "Cancelled"),
    ]

    SHIFT_CHOICES = [
        ("Morning", "Morning"),
        ("Afternoon", "Afternoon"),
        ("Evening", "Evening"),
    ]

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="batches",
    )
    name = models.CharField(max_length=100)
    faculty = models.ForeignKey(
        FacultyStaff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teaching_batches",
        limit_choices_to={"role": "Faculty", "is_active": True},
    )
    shift = models.CharField(
        max_length=15,
        choices=SHIFT_CHOICES,
        default="Morning",
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="Upcoming",
    )
    students = models.ManyToManyField(
        "students.Student",
        blank=True,
        related_name="enrolled_batches",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["course", "name"],
                name="unique_batch_name_per_course",
            )
        ]

    def __str__(self):
        return f"{self.course.name} - {self.name}"
