from django.contrib import admin
from .models import SearchHistory, Favorite, UserPreference, UserProfile

@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ('location', 'category', 'radius', 'timestamp')
    list_filter = ('category', 'timestamp')
    search_fields = ('location',)
    ordering = ('-timestamp',)

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'category', 'rating', 'timestamp')
    list_filter = ('category', 'timestamp')
    search_fields = ('name', 'address')
    ordering = ('-timestamp',)

@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('preference_type', 'preference_value', 'timestamp')
    list_filter = ('preference_type',)
    ordering = ('-timestamp',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'date_joined')
    search_fields = ('name', 'location')
    ordering = ('-date_joined',)
