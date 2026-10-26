
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ExaminationViewSet


router = DefaultRouter()
router.register("", ExaminationViewSet, basename="examination")

urlpatterns = [
    path("", include(router.urls)),
]
