from django.db import models
from django.contrib.auth.models import User
from sorl.thumbnail import ImageField


class MyUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="myuser")
    bio = models.CharField(max_length=200, blank=True, null=True)
    profile_picture = ImageField(upload_to="profile_pictures/", blank=True, null=True)
    link = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self):
        return self.user.username
