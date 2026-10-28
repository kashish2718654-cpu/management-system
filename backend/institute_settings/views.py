
from rest_framework import generics
from rest_framework.permissions import IsAdminUser

from .models import InstituteSetting
from .serializers import InstituteSettingSerializer


class InstituteSettingView(generics.RetrieveUpdateAPIView):
    serializer_class = InstituteSettingSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_object(self):
        setting, created = InstituteSetting.objects.get_or_create(
            pk=1
        )
        return setting
