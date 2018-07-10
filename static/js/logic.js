//Google Autocomplete address

var input = document.querySelector('#address');
var options = {
  bounds: geolocate(),
  type: ['address']
}

var geocoder;
var map;

autocomplete = new google.maps.places.Autocomplete(input, options);

geocoder = new google.maps.Geocoder();

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

//variable "address" created and stored based on user autocomplete input
function searchAddress() {

  var address = document.querySelector('#address').value;
  console.log(address);

  yourRoof(address);

  //var solarHero = document.querySelector('#solarHeroSection');
    //change the background to the map
    //solarHero.innerHTML = "<div><p>here is the new div element where the map will go<p></div>";
  var features = document.querySelector('#map-id');
    features.style.display = 'block';

  }

//helper function to verify correct roof image
function yourRoof (myAddress) {
  //call the map api with address to verify if its the correct rooftop, use a modal to display
  //capture image data (machine learning) to detect ridge, rake, valley, hips, eave

  // Get the modal
  var roofModal = document.querySelector('#roofModal');

  roofModal.style.display = "block";

  //get the lat and lng values from address input using Google Geocode API
  geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': myAddress}, function(results, status) {
      if (status == 'OK') {
        var lat = results[0].geometry.location.lat()
        var lng = results[0].geometry.location.lng()

        //bring up the image of the rooftop
        var latlng = new google.maps.LatLng(lat, lng);
        var mapOptions = {
          zoom: 20,
          center: latlng,
          mapTypeId: 'satellite'
        }
        map = new google.maps.Map(document.querySelector('#map-id'), mapOptions)
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    })

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
      roofModal.style.display = "none";
    }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
      if (event.target == roofModal) {
          roofModal.style.display = "none";
        }
      }
}

function saveImage() {

}

//************************************
//Google close up satelite map image of rooftop
//************************************


/*gKey = "AIzaSyAE2STz1AK1g6tePw4fUL7bAbZLJI9KvC8"
//use Google Geocode to get the lat and lng of address variable
function getLatLng(myAddress) {
  var mapUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + myAddress.split(' ').join('+') + "&key=" + gKey

  var lat = mapUrl.results
  console.log(lat)
};*/






//*****************
//this visualization is for the company side, depicts the greatest areas of opportunity for solar roof installations
//based on qualified roofs to exisiting installations
//*****************

//d3.json("data/zip_data.json", createMarkers);

/*var theMap = L.map('map-id').setView([29.7030, -98.1245], 11);

//need to hide
accessToken = 'pk.eyJ1IjoiYW5zZWxtMCIsImEiOiJjamgzamMzNXIwMzduMnhvM21nOHFnb2tkIn0.m5hJpyBF7EriYe1m2gYv7w'

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: accessToken
}).addTo(theMap);

function createMarkers(response) {
  console.log(response);

  //add the markers
  for (i = 0; i < 11; i++) {
    var marker = L.marker([response[i].lat_avg, response[i].lng_avg]).addTo(theMap).bindPopup("<h3>Existing Installs: " + response[i].existing_installs_count + "</h3><h3>Qualified: " + response[i].count_qualified + "</h3>");

  };

};

var zipStyle = {
  color: "white",
  fillColor: "yellow",
  fillOpacity: 0.5,
  weight: 1.5
};

// add the zip code boundaries layer
d3.json("data/tx_texas_zip_codes_geo.min.json", function(data) {

  //console.log(data);
  L.geoJson(data, {
    style: zipStyle
  }).addTo(theMap);

});

d3.json("data/tx_counties.geojson", function(county_data) {

  //console.log(county_data);
  L.geoJson(county_data).addTo(theMap);

}); */
