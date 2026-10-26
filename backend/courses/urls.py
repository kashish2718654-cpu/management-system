
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, BatchViewSet

router = DefaultRouter()
router.register("list", CourseViewSet, basename="course")
router.register("batches", BatchViewSet, basename="batch")

urlpatterns = router.urls
