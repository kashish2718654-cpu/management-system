
from rest_framework import viewsets
from .models import Examination
from .serializers import ExaminationSerializer


class ExaminationViewSet(viewsets.ModelViewSet):
    queryset = Examination.objects.all()
    serializer_class = ExaminationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        subject = self.request.query_params.get("subject")
        exam_date = self.request.query_params.get("exam_date")

        if subject:
            queryset = queryset.filter(subject__icontains=subject)

        if exam_date:
            queryset = queryset.filter(exam_date=exam_date)

        return queryset
