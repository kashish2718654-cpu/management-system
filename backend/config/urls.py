
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({
        "csrfToken": get_token(request)
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("students.urls")),
    path("api/fees/", include("fees.urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/staff-attendance/", include("staff_attendance.urls")),
    path("api/timetable/", include("timetable.urls")),
    path("api/examinations/", include("examinations.urls")),
    path("api/results/", include("results.urls")),
    path("api/faculty/", include("faculty.urls")),
    path("api/courses/", include("courses.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/settings/", include("institute_settings.urls")),
    path("api/csrf/", get_csrf_token, name="csrf-token"),
]
