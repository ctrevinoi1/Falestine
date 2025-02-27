// js/map.js

var map = L.map('map').setView([31.55, 34.45], 8);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

fetch('data/ps.json')
  .then(response => response.json())
  .then(geojsonData => {
    L.geoJSON(geojsonData, {
      style: function(feature) {
        return feature.properties.name === "Gaza Strip"
          ? { color: "#ff0000", weight: 2, fillOpacity: 0.2 }
          : { color: "#0000ff", weight: 2, fillOpacity: 0.2 };
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup("<b>" + feature.properties.name + "</b>");
      }
    }).addTo(map);
  })
  .catch(error => console.error("Error loading geojson:", error));

var markers = L.markerClusterGroup();

Papa.parse("data/acled_data.csv", {
  header: true,
  download: true,
  complete: function(results) {
    results.data.forEach(function(event) {
      var lat = parseFloat(event.latitude);
      var lon = parseFloat(event.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        var markerIcon = L.AwesomeMarkers.icon({
          icon: 'exclamation-triangle',
          prefix: 'fa',
          markerColor: 'red', // Changed marker color to red for emphasis
          iconColor: 'white'
        });
        var marker = L.marker([lat, lon], { icon: markerIcon });
        var popupContent = "<div class='event-popup'>" +
                           "<h3>Event Details</h3>" +
                           "<p><strong>Event ID:</strong> " + event.event_id_cnty + "</p>" +
                           "<p><strong>Date:</strong> " + event.event_date + "</p>" +
                           "<p><strong>Type:</strong> " + event.event_type + " - " + event.sub_event_type + "</p>" +
                           "<p><strong>Notes:</strong> " + event.notes + "</p>" +
                           "<p><strong>Fatalities:</strong> " + event.fatalities + "</p>" +
                           "</div>";
        marker.bindPopup(popupContent);
        markers.addLayer(marker);
      }
    });
    map.addLayer(markers);
  },
  error: function(err) {
    console.error("Error parsing CSV:", err);
  }
});