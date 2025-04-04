// Global variables
let map;
let service;
let infowindow;
let markers = [];
let currentPosition = null;

// Initialize the map
function initMap() {
    // Default location (New York City)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    // Create a map centered at the default location
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 13,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
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
                alert("Unable to get your location. Please enable location services or enter a location manually.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
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
    
    // If using current location
    if (currentPosition && locationInput === "Current Location") {
        performNearbySearch(currentPosition, category, radius);
        return;
    }
    
    // If location input is empty
    if (locationInput.trim() === "") {
        alert("Please enter a location or use your current location.");
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
        } else {
            alert("Could not find location: " + status);
        }
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
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayResults(results);
        } else {
            alert("No results found for your search criteria.");
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
            content += `<p>Rating: ${place.rating} ⭐ (${place.user_ratings_total} reviews)</p>`;
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
    });
    
    markers.push(marker);
}

// Create an attraction card
function createAttractionCard(place, container) {
    const card = document.createElement("div");
    card.className = "attraction-card";
    
    let photoUrl = "https://via.placeholder.com/300x180?text=No+Image+Available";
    
    if (place.photos && place.photos.length > 0) {
        photoUrl = place.photos[0].getUrl();
    }
    
    card.innerHTML = `
        <img src="${photoUrl}" alt="${place.name}" class="attraction-image">
        <div class="attraction-details">
            <h3 class="attraction-name">${place.name}</h3>
            <p class="attraction-address">${place.vicinity}</p>
            ${place.rating ? 
                `<p class="attraction-rating">Rating: ${place.rating} ⭐ (${place.user_ratings_total} reviews)</p>` : 
                ''}
            ${place.opening_hours ? 
                (place.opening_hours.open_now ? 
                    `<p class="attraction-open">Open Now</p>` : 
                    `<p class="attraction-closed">Closed Now</p>`) : 
                ''}
        </div>
    `;
    
    // Add click event to highlight on map
    card.addEventListener("click", function() {
        // Find the corresponding marker
        const marker = markers.find(m => m.getTitle() === place.name);
        
        if (marker) {
            // Center map on this marker
            map.setCenter(marker.getPosition());
            map.setZoom(16);
            
            // Open info window
            google.maps.event.trigger(marker, "click");
            
            // Scroll to map
            document.getElementById("map").scrollIntoView({ behavior: "smooth" });
        }
    });
    
    container.appendChild(card);
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
} 