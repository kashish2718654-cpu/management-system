
from rest_framework.routers import DefaultRouter
from .views import FacultyStaffViewSet

router = DefaultRouter()
router.register(r"", FacultyStaffViewSet, basename="faculty-staff")

urlpatterns = router.urls
