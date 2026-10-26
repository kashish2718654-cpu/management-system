
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Course, Batch
from .serializers import CourseSerializer, BatchSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["get"])
    def batches(self, request, pk=None):
        course = self.get_object()
        batches = course.batches.all()
        serializer = BatchSerializer(
            batches,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related(
        "course",
        "faculty",
    ).prefetch_related("students").all()

    serializer_class = BatchSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()

        course_id = self.request.query_params.get("course")
        status = self.request.query_params.get("status")

        if course_id:
            queryset = queryset.filter(course_id=course_id)

        if status:
            queryset = queryset.filter(status=status)

        return queryset
