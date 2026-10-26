
from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf_token, name="csrf_token"),
    path("login/", views.admin_login, name="admin_login"),
    path("logout/", views.admin_logout, name="admin_logout"),
    path("check/", views.auth_check, name="auth_check"),
    path("profile/", views.admin_profile, name="admin_profile"),
]

