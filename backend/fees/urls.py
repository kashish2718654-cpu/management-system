
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FeeAccountViewSet,
    PaymentViewSet,
    pending_fee_report,
)

router = DefaultRouter()

router.register(
    "accounts",
    FeeAccountViewSet,
    basename="fee-account"
)

router.register(
    "payments",
    PaymentViewSet,
    basename="payment"
)

urlpatterns = [
    path("pending-report/", pending_fee_report, name="pending-fee-report"),
    path("", include(router.urls)),
]
