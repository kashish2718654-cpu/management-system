
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import StudentResultViewSet


router = DefaultRouter()
router.register("", StudentResultViewSet, basename="student-result")

urlpatterns = [
    path("", include(router.urls)),
]
