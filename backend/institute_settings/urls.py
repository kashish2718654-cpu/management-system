
from django.urls import path
from .views import InstituteSettingView

urlpatterns = [
    path("", InstituteSettingView.as_view(), name="institute-settings"),
]
