
from rest_framework import viewsets
from .models import StudentResult
from .serializers import StudentResultSerializer


class StudentResultViewSet(viewsets.ModelViewSet):
    serializer_class = StudentResultSerializer

    queryset = StudentResult.objects.select_related(
        "student",
        "examination",
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()

        student_id = self.request.query_params.get("student")
        examination_id = self.request.query_params.get("examination")
        status = self.request.query_params.get("status")

        if student_id:
            queryset = queryset.filter(student_id=student_id)

        if examination_id:
            queryset = queryset.filter(
                examination_id=examination_id
            )

        if status == "Pass":
            queryset = queryset.filter(
                marks_obtained__gte=__import__(
                    "django.db.models",
                    fromlist=["F"],
                ).F("examination__passing_marks")
            )
        elif status == "Fail":
            queryset = queryset.filter(
                marks_obtained__lt=__import__(
                    "django.db.models",
                    fromlist=["F"],
                ).F("examination__passing_marks")
            )

        return queryset
