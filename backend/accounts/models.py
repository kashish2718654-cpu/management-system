
from django.conf import settings
from django.db import models


class AdminProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"
