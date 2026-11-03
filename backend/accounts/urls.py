
from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf_token, name="csrf_token"),
    path("login/", views.admin_login, name="admin_login"),
    path("logout/", views.admin_logout, name="admin_logout"),
    path("check/", views.auth_check, name="auth_check"),
    path("profile/", views.admin_profile, name="admin_profile"),
    path("register/", views.admin_register, name="admin_register"),
    path("approve/<int:request_id>/", views.approve_registration, name="approve_registration",),
    path("pending-registrations/", views.pending_registrations, name="pending_registrations",),
    path("reject/<int:request_id>/", views.reject_registration, name="reject_registration",),
    path("admins/", views.admin_list, name="admin_list"),
    path( "admins/<int:user_id>/status/", views.update_admin_status, name="update_admin_status",),
    path( "admin-activity/", views.admin_activity_logs, name="admin_activity_logs",),
]

