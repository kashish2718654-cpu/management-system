
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, import_students_excel

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")

urlpatterns = [
    path("import-excel/", import_students_excel, name="import-students-excel"),
    path("", include(router.urls)),
]
