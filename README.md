# Local Attractions Recommender

A web application that helps users discover interesting places to visit based on their location or a specified location. The app uses Google Maps and Places API to provide recommendations for tourist attractions, restaurants, museums, parks, and shopping areas.

## Features

- Search for attractions by location (address, city, etc.)
- Use current location for finding nearby attractions
- Filter attractions by category (tourist attractions, restaurants, museums, parks, shopping)
- Adjust search radius to find places within a specific distance
- View attractions on an interactive map
- See detailed information about each place (name, address, rating, opening hours)
- Click on attraction cards to highlight them on the map

## Technologies Used

- HTML5
- CSS3
- JavaScript (vanilla)
- Google Maps JavaScript API
- Google Places API

## Setup Instructions

1. Clone or download this repository to your local machine.
2. Get a Google Maps API key:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Library"
   - Enable "Maps JavaScript API" and "Places API"
   - Create an API key in "APIs & Services" > "Credentials"
3. Replace `YOUR_API_KEY` in the index.html file with your actual Google Maps API key.
4. Open the index.html file in your web browser or host it on a web server.

## Usage

1. Enter a location in the search box or click "Use my current location"
2. Select a category of places you're interested in
3. Choose a search radius
4. Click "Find Attractions" to see results
5. Browse through the attraction cards and click on them to see their location on the map
6. Click on map markers to see more information about each place

## Customization

You can customize the application by:

- Modifying the CSS in styles.css to change the appearance
- Adding more categories in the HTML select element
- Adjusting the map styles in the initMap function in script.js
- Changing the number of results displayed by modifying the limit in the displayResults function

## Notes

- The application requires an internet connection to work properly
- Location services must be enabled in your browser to use the "Use my current location" feature
- The Google Maps API has usage limits and may require billing information for extensive use

## License

This project is open source and available under the MIT License. 