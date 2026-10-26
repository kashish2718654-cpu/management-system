
from rest_framework import viewsets
from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    queryset = Attendance.objects.select_related(
        "student"
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()

        attendance_date = self.request.query_params.get("date")
        student_id = self.request.query_params.get("student")
        status = self.request.query_params.get("status")

        if attendance_date:
            queryset = queryset.filter(date=attendance_date)

        if student_id:
            queryset = queryset.filter(student_id=student_id)

        if status:
            queryset = queryset.filter(status=status)

        return queryset
