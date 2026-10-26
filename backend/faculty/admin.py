
from django.contrib import admin
from .models import FacultyStaff


@admin.register(FacultyStaff)
class FacultyStaffAdmin(admin.ModelAdmin):
    list_display = (
        "employee_id",
        "name",
        "role",
        "department",
        "phone",
        "email",
        "joining_date",
        "salary",
        "is_active",
    )

    search_fields = (
        "employee_id",
        "name",
        "email",
        "phone",
        "department",
    )

    list_filter = ("role", "department", "is_active")
    ordering = ("name",)
