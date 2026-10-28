
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("students.urls")),
    path("api/fees/", include("fees.urls")),
    path("api/attendance/",include("attendance.urls")),
    path("api/timetable/", include("timetable.urls")),
    path("api/examinations/", include("examinations.urls")),
    path("api/results/", include("results.urls")),
    path("api/faculty/", include("faculty.urls")),
     path("api/courses/", include("courses.urls")),
     path("api/auth/", include("accounts.urls")),
     path("api/settings/", include("institute_settings.urls")),
]
