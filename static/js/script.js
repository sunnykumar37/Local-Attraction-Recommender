// Global variables
let map;
let service;
let infowindow;
let markers = [];
let currentPosition = null;
let selectedPlace = null;
let mapStyle = 'roadmap';
let showTraffic = false;
let trafficLayer = null;
let currentResults = [];
let listView = false;

// Initialize the map
function initMap() {
    // Default location (New York City)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    // Create a map centered at the default location
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 13,
        mapTypeId: mapStyle,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
    });

    // Create an InfoWindow to display place details
    infowindow = new google.maps.InfoWindow();
    
    // Create PlacesService
    service = new google.maps.places.PlacesService(map);
    
    // Add event listeners
    document.getElementById("search-btn").addEventListener("click", searchAttractions);
    document.getElementById("use-current-location").addEventListener("click", useCurrentLocation);
    document.getElementById("location-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            searchAttractions();
        }
    });
    
    // Map control event listeners
    document.getElementById("toggle-satellite").addEventListener("click", toggleMapType);
    document.getElementById("toggle-traffic").addEventListener("click", toggleTraffic);
    document.getElementById("center-map").addEventListener("click", centerMap);
    
    // Results action event listeners
    document.getElementById("sort-rating").addEventListener("click", sortByRating);
    document.getElementById("toggle-view").addEventListener("click", toggleListView);
    
    // Click event for recent search items
    document.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', function() {
            const location = this.getAttribute('data-location');
            const category = this.getAttribute('data-category');
            const radius = this.getAttribute('data-radius');
            
            document.getElementById('location-input').value = location;
            document.getElementById('category-select').value = category;
            document.getElementById('radius-select').value = radius;
            
            searchAttractions();
        });
    });
    
    // Click event for favorite items
    document.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('click', function() {
            const lat = parseFloat(this.getAttribute('data-lat'));
            const lng = parseFloat(this.getAttribute('data-lng'));
            
            // Center map on this location
            map.setCenter({ lat, lng });
            map.setZoom(16);
        });
    });
    
    // Delete favorite buttons
    document.querySelectorAll('.delete-favorite').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent triggering parent click event
            const id = this.getAttribute('data-id');
            deleteFavorite(id);
        });
    });
    
    // Initialize traffic layer
    trafficLayer = new google.maps.TrafficLayer();
}

// Use current location
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user's location
                map.setCenter(currentPosition);
                
                // Add a marker for the user's location
                new google.maps.Marker({
                    position: currentPosition,
                    map: map,
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                        scaledSize: new google.maps.Size(32, 32)
                    },
                    title: "Your Location"
                });
                
                // Clear the location input
                document.getElementById("location-input").value = "Current Location";
                
                // Search for attractions at the current location
                searchAttractions();
            },
            (error) => {
                console.error("Error getting user location:", error);
                showNotification("Unable to get your location. Please enable location services or enter a location manually.", true);
            }
        );
    } else {
        showNotification("Geolocation is not supported by your browser.", true);
    }
}

// Search for attractions
function searchAttractions() {
    // Clear existing markers
    clearMarkers();
    
    // Get user inputs
    const locationInput = document.getElementById("location-input").value;
    const category = document.getElementById("category-select").value;
    const radius = parseInt(document.getElementById("radius-select").value);
    
    // If location input is empty
    if (locationInput.trim() === "") {
        showNotification("Please enter a location or use your current location.", true);
        return;
    }
    
    // Show loading state
    document.getElementById("attractions-list").innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching for attractions...</p>
        </div>
    `;
    
    // If using current location
    if (currentPosition && locationInput === "Current Location") {
        performNearbySearch(currentPosition, category, radius);
        
        // Save search to history
        saveSearchHistory({
            location: "Current Location",
            category: category,
            radius: radius
        });
        
        return;
    }
    
    // Use Geocoding to convert address to coordinates
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: locationInput }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            const location = results[0].geometry.location;
            
            // Center map on the location
            map.setCenter(location);
            
            // Perform nearby search
            performNearbySearch(location, category, radius);
            
            // Save search to history
            saveSearchHistory({
                location: locationInput,
                category: category,
                radius: radius
            });
        } else {
            document.getElementById("attractions-list").innerHTML = "";
            showNotification("Could not find location: " + status, true);
        }
    });
}

// Save search to history
function saveSearchHistory(searchData) {
    fetch('/search_history/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData)
    })
    .catch(error => {
        console.error('Error saving search history:', error);
    });
}

// Perform nearby search using Places API
function performNearbySearch(location, type, radius) {
    const request = {
        location: location,
        radius: radius,
        type: type
    };
    
    service.nearbySearch(request, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            currentResults = results;
            displayResults(results);
        } else {
            document.getElementById("attractions-list").innerHTML = 
                "<p class='no-results'>No attractions found. Try a different location or category.</p>";
        }
    });
}

// Display results on the map and in the list
function displayResults(places) {
    // Clear the attractions list
    const attractionsList = document.getElementById("attractions-list");
    attractionsList.innerHTML = "";
    
    // Check if no results
    if (places.length === 0) {
        attractionsList.innerHTML = 
            "<p class='no-results'>No attractions found. Try a different location or category.</p>";
        return;
    }
    
    // Apply list view class if needed
    if (listView) {
        attractionsList.classList.add('list-view');
    } else {
        attractionsList.classList.remove('list-view');
    }
    
    // Loop through each place and create markers and list items
    places.forEach((place, i) => {
        if (i < 20) { // Limit to 20 results for performance
            // Create a marker for the place
            createMarker(place);
            
            // Create a card for the place
            createAttractionCard(place, attractionsList);
        }
    });
    
    // Adjust map to show all markers
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => bounds.extend(marker.getPosition()));
    map.fitBounds(bounds);
}

// Create a marker for a place
function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        animation: google.maps.Animation.DROP,
        title: place.name
    });
    
    // Add click event to show info window
    marker.addListener("click", function() {
        let content = `
            <div class="info-window">
                <h3>${place.name}</h3>
                <p>${place.vicinity}</p>
        `;
        
        if (place.rating) {
            content += `<p>Rating: ${place.rating} ⭐ (${place.user_ratings_total || 0} reviews)</p>`;
        }
        
        if (place.opening_hours) {
            if (place.opening_hours.open_now) {
                content += `<p class="open">Open Now</p>`;
            } else {
                content += `<p class="closed">Closed Now</p>`;
            }
        }
        
        content += `</div>`;
        
        infowindow.setContent(content);
        infowindow.open(map, marker);
        
        // Store selected place
        selectedPlace = place;
    });
    
    markers.push(marker);
    return marker;
}

// Create an attraction card
function createAttractionCard(place, container) {
    // Get the card template
    const template = document.getElementById('attraction-card-template');
    const card = document.importNode(template.content, true).querySelector('.attraction-card');
    
    // Get elements
    const image = card.querySelector('.attraction-image');
    const name = card.querySelector('.attraction-name');
    const address = card.querySelector('.attraction-address');
    const rating = card.querySelector('.attraction-rating');
    const openStatus = card.querySelector('.attraction-open');
    const favoriteBtn = card.querySelector('.favorite-btn');
    const directionsBtn = card.querySelector('.directions-btn');
    
    // Set content
    let photoUrl = "https://via.placeholder.com/300x180?text=No+Image+Available";
    let photoReference = null;
    
    if (place.photos && place.photos.length > 0) {
        photoUrl = place.photos[0].getUrl();
        photoReference = place.photos[0].photo_reference || '';
    }
    
    image.src = photoUrl;
    image.alt = place.name;
    name.textContent = place.name;
    address.textContent = place.vicinity;
    
    if (place.rating) {
        rating.textContent = `Rating: ${place.rating} ⭐ (${place.user_ratings_total || 0} reviews)`;
    } else {
        rating.style.display = 'none';
    }
    
    if (place.opening_hours) {
        if (place.opening_hours.open_now) {
            openStatus.textContent = "Open Now";
            openStatus.classList.add('attraction-open');
        } else {
            openStatus.textContent = "Closed Now";
            openStatus.classList.add('attraction-closed');
        }
    } else {
        openStatus.style.display = 'none';
    }
    
    // Add event listeners
    card.addEventListener('click', function() {
        // Find the marker for this place
        const marker = markers.find(m => m.getTitle() === place.name);
        
        if (marker) {
            // Center map on this place
            map.setCenter(marker.getPosition());
            map.setZoom(16);
            
            // Open the info window
            google.maps.event.trigger(marker, 'click');
            
            // Scroll to map
            document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Favorite button
    favoriteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click event
        
        const favoriteData = {
            place_id: place.place_id,
            name: place.name,
            address: place.vicinity,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            category: document.getElementById('category-select').value,
            rating: place.rating || null,
            photo_reference: photoReference
        };
        
        saveFavorite(favoriteData, this);
    });
    
    // Directions button
    directionsBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click event
        
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`;
        window.open(url, '_blank');
    });
    
    container.appendChild(card);
}

// Save a place to favorites
function saveFavorite(placeData, button) {
    fetch('/save_favorite/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update button appearance
            const icon = button.querySelector('i');
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.style.backgroundColor = '#e74c3c';
            button.style.color = 'white';
            
            showNotification("Added to favorites!");
            
            // Refresh the page to update favorites list
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else if (data.status === 'already_exists') {
            showNotification("This place is already in your favorites");
        } else {
            showNotification("Error saving to favorites", true);
        }
    })
    .catch(error => {
        console.error('Error saving favorite:', error);
        showNotification("Error saving to favorites", true);
    });
}

// Delete a favorite
function deleteFavorite(favoriteId) {
    fetch(`/delete_favorite/${favoriteId}/`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification("Removed from favorites");
            
            // Remove the item from the DOM
            const item = document.querySelector(`.favorite-item[data-id="${favoriteId}"]`);
            if (item) {
                item.remove();
                
                // Check if there are no more favorites
                const favoritesList = document.querySelector('.favorites-list');
                if (favoritesList.children.length === 0) {
                    favoritesList.innerHTML = '<li class="empty-item">No favorites saved</li>';
                }
            }
        } else {
            showNotification("Error removing favorite", true);
        }
    })
    .catch(error => {
        console.error('Error deleting favorite:', error);
        showNotification("Error removing favorite", true);
    });
}

// Toggle map type (roadmap/satellite)
function toggleMapType() {
    if (mapStyle === 'roadmap') {
        mapStyle = 'satellite';
        document.getElementById('toggle-satellite').innerHTML = '<i class="fas fa-map"></i> Map';
    } else {
        mapStyle = 'roadmap';
        document.getElementById('toggle-satellite').innerHTML = '<i class="fas fa-globe"></i> Satellite';
    }
    
    map.setMapTypeId(mapStyle);
}

// Toggle traffic layer
function toggleTraffic() {
    showTraffic = !showTraffic;
    
    if (showTraffic) {
        trafficLayer.setMap(map);
        document.getElementById('toggle-traffic').style.backgroundColor = '#e74c3c';
        document.getElementById('toggle-traffic').style.color = 'white';
    } else {
        trafficLayer.setMap(null);
        document.getElementById('toggle-traffic').style.backgroundColor = 'white';
        document.getElementById('toggle-traffic').style.color = 'black';
    }
}

// Center map on current search area
function centerMap() {
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
    } else if (currentPosition) {
        map.setCenter(currentPosition);
        map.setZoom(13);
    }
}

// Sort results by rating
function sortByRating() {
    if (currentResults.length === 0) return;
    
    currentResults.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
    });
    
    // Re-display sorted results
    clearMarkers();
    displayResults(currentResults);
    
    showNotification("Results sorted by rating");
}

// Toggle between grid and list view
function toggleListView() {
    listView = !listView;
    
    const button = document.getElementById('toggle-view');
    const attractionsList = document.getElementById('attractions-list');
    
    if (listView) {
        attractionsList.classList.add('list-view');
        button.innerHTML = '<i class="fas fa-th"></i> Grid View';
    } else {
        attractionsList.classList.remove('list-view');
        button.innerHTML = '<i class="fas fa-th-list"></i> List View';
    }
    
    // Re-display results to apply the view change
    if (currentResults.length > 0) {
        clearMarkers();
        displayResults(currentResults);
    }
}

// Show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    
    if (isError) {
        notification.classList.add('error');
    }
    
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
} 