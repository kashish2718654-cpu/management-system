
from rest_framework import viewsets
from .models import Timetable
from .serializers import TimetableSerializer


class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSerializer

    queryset = Timetable.objects.select_related(
        "student"
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()

        day = self.request.query_params.get("day")
        student_id = self.request.query_params.get("student")
        course = self.request.query_params.get("course")

        if day:
            queryset = queryset.filter(day=day)

        if student_id:
            queryset = queryset.filter(student_id=student_id)

        if course:
            queryset = queryset.filter(student__course=course)

        return queryset
