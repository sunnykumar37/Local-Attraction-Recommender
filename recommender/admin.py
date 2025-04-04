from django.contrib import admin
from .models import SearchHistory, Favorite, UserPreference

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
