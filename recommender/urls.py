from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('profile/', views.profile, name='profile'),
    path('save_favorite/', views.save_favorite, name='save_favorite'),
    path('get_favorites/', views.get_favorites, name='get_favorites'),
    path('search_history/', views.search_history, name='search_history'),
    path('delete_favorite/<int:favorite_id>/', views.delete_favorite, name='delete_favorite'),
] 