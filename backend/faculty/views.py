
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import FacultyStaff
from .serializers import FacultyStaffSerializer


class FacultyStaffViewSet(viewsets.ModelViewSet):
    queryset = FacultyStaff.objects.all()
    serializer_class = FacultyStaffSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = FacultyStaff.objects.all()

        role = self.request.query_params.get("role")
        department = self.request.query_params.get("department")
        search = self.request.query_params.get("search")

        if role:
            queryset = queryset.filter(role=role)

        if department:
            queryset = queryset.filter(
                department__icontains=department
            )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            ) | queryset.filter(
                employee_id__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )

        return queryset.distinct()
