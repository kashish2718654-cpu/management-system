
from django.db import models


class InstituteSetting(models.Model):
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
    admin_name = models.CharField(
        max_length=100,
        default="Admin"
    )
    notifications = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.institute_name
