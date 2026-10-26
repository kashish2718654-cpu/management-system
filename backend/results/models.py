
from django.db import models
from students.models import Student
from examinations.models import Examination


class StudentResult(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="exam_results",
    )

    examination = models.ForeignKey(
        Examination,
        on_delete=models.CASCADE,
        related_name="student_results",
    )

    marks_obtained = models.DecimalField(
        max_digits=7,
        decimal_places=2,
    )

    remarks = models.CharField(
        max_length=200,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["examination__exam_date", "student__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "examination"],
                name="unique_student_result_per_exam",
            )
        ]

    @property
    def percentage(self):
        total = self.examination.total_marks

        if total <= 0:
            return 0

        return round(
            float(self.marks_obtained) / total * 100,
            2,
        )

    @property
    def status(self):
        if self.marks_obtained >= self.examination.passing_marks:
            return "Pass"

        return "Fail"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.marks_obtained < 0:
            raise ValidationError({
                "marks_obtained": "Marks cannot be negative."
            })

        if self.marks_obtained > self.examination.total_marks:
            raise ValidationError({
                "marks_obtained": (
                    "Marks cannot exceed the examination's total marks."
                )
            })

    def __str__(self):
        return (
            f"{self.student.name} - "
            f"{self.examination.name} - "
            f"{self.marks_obtained}"
        )
