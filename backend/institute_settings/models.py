
from django.db import models


class InstituteSetting(models.Model):

    # Institute Information
    institute_name = models.CharField(
        max_length=200,
        default="EduManage Institute"
    )
    email = models.EmailField(
        default="admin@edumanage.com"
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default=""
    )
    address = models.TextField(
        default="Dharamshala, Himachal Pradesh"
    )
    website = models.URLField(blank=True, default="")
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )

    # Admin Profile
    admin_name = models.CharField(
        max_length=100,
        default="Admin"
    )
    admin_username = models.CharField(
        max_length=100,
        blank=True,
        default=""
    )
    admin_email = models.EmailField(blank=True, default="")
    admin_phone = models.CharField(
        max_length=20,
        blank=True,
        default=""
    )

    # Notification Preferences
    notifications = models.BooleanField(default=True)
    student_notifications = models.BooleanField(default=True)
    fee_notifications = models.BooleanField(default=True)
    attendance_notifications = models.BooleanField(default=True)
    examination_notifications = models.BooleanField(default=True)
    result_notifications = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.institute_name
