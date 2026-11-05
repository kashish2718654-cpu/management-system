
from django.contrib import admin
from .models import StaffAttendance


@admin.register(StaffAttendance)
class StaffAttendanceAdmin(admin.ModelAdmin):
    list_display = (
        "staff",
        "date",
        "status",
        "check_in_time",
        "check_out_time",
    )

    list_filter = ("status", "date")
    search_fields = ("staff__name", "staff__employee_id")
    ordering = ("-date",)
