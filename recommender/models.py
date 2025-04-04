from django.db import models
from django.utils import timezone

# Create your models here.

class SearchHistory(models.Model):
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    radius = models.IntegerField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.location} - {self.category} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

class Favorite(models.Model):
    place_id = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    latitude = models.FloatField()
    longitude = models.FloatField()
    category = models.CharField(max_length=100)
    rating = models.FloatField(null=True, blank=True)
    photo_reference = models.CharField(max_length=500, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class UserPreference(models.Model):
    preference_type = models.CharField(max_length=100)  # 'category', 'radius', etc.
    preference_value = models.CharField(max_length=255)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.preference_type}: {self.preference_value}"
