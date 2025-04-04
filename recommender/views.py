from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import SearchHistory, Favorite, UserPreference, UserProfile
from .forms import UserProfileForm

def home(request):
    # Get recent searches for the sidebar
    recent_searches = SearchHistory.objects.order_by('-timestamp')[:5]
    
    # Get favorite places
    favorites = Favorite.objects.order_by('-timestamp')
    
    # Get user preferences
    category_prefs = UserPreference.objects.filter(preference_type='category').order_by('-timestamp').first()
    radius_prefs = UserPreference.objects.filter(preference_type='radius').order_by('-timestamp').first()
    
    default_category = category_prefs.preference_value if category_prefs else 'tourist_attraction'
    default_radius = radius_prefs.preference_value if radius_prefs else '5000'
    
    # Get user profile or create default
    profile, created = UserProfile.objects.get_or_create(id=1, defaults={'name': 'Guest User'})
    
    context = {
        'recent_searches': recent_searches,
        'favorites': favorites,
        'default_category': default_category,
        'default_radius': default_radius,
        'google_maps_api_key': 'AIzaSyB_BPBLZ8cITzHU2USSyOy1pVewNyv5DEc',
        'profile': profile
    }
    
    return render(request, 'recommender/home.html', context)

def profile(request):
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(id=1, defaults={'name': 'Guest User'})
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('profile')
    else:
        form = UserProfileForm(instance=profile)
    
    context = {
        'form': form,
        'profile': profile
    }
    
    return render(request, 'recommender/profile.html', context)

@csrf_exempt
def save_favorite(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Check if this place is already a favorite
            existing_favorite = Favorite.objects.filter(place_id=data['place_id']).first()
            
            if existing_favorite:
                return JsonResponse({'status': 'already_exists', 'message': 'This place is already in your favorites'})
            
            # Create new favorite
            favorite = Favorite(
                place_id=data['place_id'],
                name=data['name'],
                address=data['address'],
                latitude=data['latitude'],
                longitude=data['longitude'],
                category=data['category'],
                rating=data.get('rating'),
                photo_reference=data.get('photo_reference')
            )
            favorite.save()
            
            return JsonResponse({'status': 'success', 'favorite_id': favorite.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def get_favorites(request):
    favorites = Favorite.objects.order_by('-timestamp')
    favorites_list = []
    
    for fav in favorites:
        favorites_list.append({
            'id': fav.id,
            'place_id': fav.place_id,
            'name': fav.name,
            'address': fav.address,
            'latitude': fav.latitude,
            'longitude': fav.longitude,
            'category': fav.category,
            'rating': fav.rating,
            'photo_reference': fav.photo_reference,
            'timestamp': fav.timestamp.strftime('%Y-%m-%d %H:%M')
        })
    
    return JsonResponse({'favorites': favorites_list})

@csrf_exempt
def search_history(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Save search to history
            search = SearchHistory(
                location=data['location'],
                category=data['category'],
                radius=data['radius']
            )
            search.save()
            
            # Update user preferences
            UserPreference.objects.create(
                preference_type='category',
                preference_value=data['category']
            )
            
            UserPreference.objects.create(
                preference_type='radius',
                preference_value=data['radius']
            )
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    # GET request - return search history
    searches = SearchHistory.objects.order_by('-timestamp')[:10]
    searches_list = []
    
    for search in searches:
        searches_list.append({
            'id': search.id,
            'location': search.location,
            'category': search.category,
            'radius': search.radius,
            'timestamp': search.timestamp.strftime('%Y-%m-%d %H:%M')
        })
    
    return JsonResponse({'searches': searches_list})

@csrf_exempt
def delete_favorite(request, favorite_id):
    try:
        favorite = get_object_or_404(Favorite, id=favorite_id)
        favorite.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
