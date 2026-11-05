
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import StaffAttendance
from .serializers import StaffAttendanceSerializer


class StaffAttendanceViewSet(viewsets.ModelViewSet):
    queryset = StaffAttendance.objects.select_related("staff").all()
    serializer_class = StaffAttendanceSerializer
    permission_classes = [IsAuthenticated]
