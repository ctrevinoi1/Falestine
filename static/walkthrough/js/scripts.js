// Global variable to track the current module index (replacing 'currentSlide')
let currentModule = 0;
const totalModules = 8; // same as the number of modules
let map;

const geojsonDataURLs = [
  'static/walkthrough/data/module_1.geojson',
  'static/walkthrough/data/module_2.geojson',
  'static/walkthrough/data/module_3.geojson',
  'static/walkthrough/data/module_4.geojson',
  'static/walkthrough/data/module_5.geojson',
  'static/walkthrough/data/module_6.geojson',
  'static/walkthrough/data/module_7.geojson',
  'static/walkthrough/data/module_8.geojson',
];

// On page load, fade out overlay then reveal the first module
window.addEventListener("load", function() {
  console.log("Page loaded, starting overlay fade out.");
  
  // NEW: Adjust map-container styling:
  const mapContainer = document.getElementById("map-container");
  mapContainer.style.width = "50%";
  mapContainer.style.margin = "0 auto";
  mapContainer.style.height = "450px";

  gsap.to("#overlay", {
    delay: 4,
    duration: 5,
    opacity: 0,
    onComplete: function() {
      document.getElementById("overlay").style.display = "none";
      gsap.to("#narrative", { duration: 1, opacity: 1 });

      console.log("Initializing Leaflet map.");
      map = L.map('map').setView([31.5, 35], 7); // Palestine-centered view

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      showModule(0);
    }
  });
});

/**
 * Show the module at the given index (0-based).
 * Hides all modules first, then displays only the chosen one.
 */
function showModule(index) {
  console.log(`Showing module at index: ${index}`);
  // Hide and reset opacity for every module
  document.querySelectorAll(".module").forEach((mod) => {
    mod.style.display = "none";
    gsap.set(mod, { opacity: 0 });
  });

  // Show the selected module
  const targetModule = document.getElementById(`module-${index + 1}`);
  if (targetModule) {
    console.log(`Module ${index + 1} found, displaying it.`);
    targetModule.style.display = "block"; // first make it visible
    gsap.to(targetModule, { duration: 1, opacity: 1 }); // fade in over 1 second
  } else {
    console.warn(`Module ${index + 1} not found.`);
  }
  currentModule = index;
  loadGeoJSON(index);
}

/**
 * Called from each "Next" button (which passes in a 1-based module number).
 * We subtract 1 to sync with our 0-based index in showModule().
 */
function showNextModule(moduleNumber) {
  console.log(`Next button clicked, moving to module number: ${moduleNumber}`);
  showModule(moduleNumber - 1);
}

/**
 * Show the end message and hide any visible module.
 */
function showEndMessage() {
  console.log("Showing end message.");
  // Hide all modules
  document.querySelectorAll(".module").forEach((mod) => {
    mod.style.display = "none";
  });
  // Show the end message
  document.getElementById("end-message").style.display = "block";
  document.getElementById("end-message").scrollIntoView({ behavior: "smooth" });
} 
function animateModule3Markers(map) {
  console.log("Starting marker animation for Module 3.");

    const revoltLocations = [
        { lat: 31.7683, lng: 35.2137, description: "Jerusalem: A pivotal city in the struggle for Palestinian self-determination, where the leadership of the Arab Higher Committee, led by Haj Amin al-Husseini, advocated for justice and human rights." },
        { lat: 32.2215, lng: 35.2544, description: "Nablus: A bastion of Palestinian resilience and a key site of the Arab Revolt, marked by numerous acts of civil resistance and demands for justice against colonial forces." },
        { lat: 31.5322, lng: 35.0989, description: "Hebron: A city with a legacy of resistance, where the fight for Palestinian rights and justice was met with severe challenges." },
        { lat: 32.0853, lng: 34.7818, description: "Jaffa: A significant port city and the starting point of the 1936 general strike, symbolizing the collective Palestinian demand for freedom and justice." },
        { lat: 32.7940, lng: 34.9896, description: "Haifa: A city of diverse communities, where the struggle for Palestinian rights and justice was a focal point during the revolt." },
        { lat: 32.3120, lng: 35.0275, description: "Tulkarm: A center of Palestinian resistance, where the landscape was used strategically in the fight for justice and self-determination." },
        { lat: 32.4646, lng: 35.2944, description: "Jenin: A northern city that played a crucial role in the resistance against colonial oppression, advocating for Palestinian rights and justice." },
        { lat: 32.9232, lng: 35.0751, description: "Acre (Akka): A coastal city with a strong Arab presence, integral to the routes of resistance and the pursuit of justice." }
    ];

    let markerIndex = 0;
    let markers = []; // Store the marker objects

    // Create markers and store them
    revoltLocations.forEach(location => {
        const marker = L.marker([location.lat, location.lng]);
        
        // 1) Here we specify a class for custom styling:
        marker.bindPopup(location.description, {
            className: 'palestinian-popup'
        });
        
        markers.push(marker);
    });

    function animateToNextMarker() {
        if (markerIndex < markers.length) {
            const currentMarker = markers[markerIndex];
            currentMarker.addTo(map);

            map.flyTo(currentMarker.getLatLng(), 13, {
                duration: 2, 
                animate: true
            });

            function openPopup() {
                currentMarker.openPopup();
                map.off('moveend', openPopup);
            }
            map.on('moveend', openPopup);

            setTimeout(() => {
                currentMarker.closePopup();
                markerIndex++;
                animateToNextMarker();
            }, 6000); // Stay on each marker for 6 seconds

        } else {
            map.flyTo([31.5, 35], 7, { duration: 2 });
            markers.forEach(marker => map.removeLayer(marker));
        }
    }
    animateToNextMarker();
}


function animateModule4Nakba(map, israelGeoJSON, palestineGeoJSON) {
  console.log("Starting Nakba animation for Module 4.");

  const nakbaLocations = [ // Example locations - refine as needed, perhaps use more or load from data
      { lat: 32.5, lng: 34.9 },  // Coastal Palestine (Jaffa area)
      { lat: 31.7, lng: 35.2 },  // Jerusalem
      { lat: 32.7, lng: 35.3 },  // Galilee region
      { lat: 31.3, lng: 34.4 }   // Southern Palestine (Negev)
  ];

  let displacementMarkers = [];

  // 1. Create initial markers representing Palestinian population across historical Palestine
  palestineGeoJSON.eachLayer(layer => { // Iterate over Palestine area (WB & Gaza) to distribute markers roughly
      const bounds = layer.getBounds();
      const center = bounds.getCenter(); // Or use random points within bounds for more dispersed look

      for (let i = 0; i < 50; i++) { // Create a denser set of markers - adjust count as needed
          const marker = L.marker(center, {
              icon: L.icon({
                  iconUrl: 'static/walkthrough/img/watermelon-marker.png', // Replace with your watermelon or person icon path
                  iconSize: [15, 15], // Adjust size as needed
                  iconAnchor: [7.5, 7.5],
                  popupAnchor: [0, -5]
              }),
              opacity: 1 // Start fully opaque
          });
          displacementMarkers.push(marker);
      }
  });

  // Add initial markers to the map (initially visible across all Palestine)
  displacementMarkers.forEach(marker => marker.addTo(map));


  // 2. Animation Sequence
  let markerIndex = 0;
  function animateDisplacement() {
      if (markerIndex < displacementMarkers.length) {
          const marker = displacementMarkers[markerIndex];
          const markerLatLng = marker.getLatLng();

          // Check if marker is within Israel boundaries (module_4.geojson)
          let isInsideIsrael = false;
          israelGeoJSON.eachLayer(layer => {
              if (layer.getBounds().contains(markerLatLng)) {
                  isInsideIsrael = true;
              }
          });

          if (isInsideIsrael) {
              // Animate marker fading out and moving slightly (symbolizing displacement)
              gsap.to(marker, {
                  duration: 1.5,
                  opacity: 0,
                  // Slightly offset position to visually suggest movement
                  lat: markerLatLng.lat + 0.02,
                  lng: markerLatLng.lng + 0.02,
                  onComplete: () => {
                      map.removeLayer(marker); // Remove marker after fade out
                      markerIndex++;
                      animateDisplacement(); // Continue to next marker
                  }
              });

              // Optional: Add a quick, subtle 'flicker' or color change just before fade out for emphasis
              gsap.to(marker._icon, { // Access the marker's icon directly for visual effects
                  duration: 0.3,
                  opacity: 0.5, // Flicker effect
                  yoyo: true,
                  repeat: 1,
                  onComplete: () => {
                       gsap.set(marker._icon, {opacity: 1}); // Reset opacity after flicker
                  }
              });


          } else {
              // Marker is outside Israel (in WB/Gaza), just move to the next one without animation
              markerIndex++;
              animateDisplacement(); // Continue to next marker
          }


      } else {
          // Animation Complete:
          console.log("Nakba displacement animation finished.");
           // Optionally zoom out or trigger next stage of narrative
           map.flyTo([31.5, 35], 7, { duration: 2 });

      }
  }

  animateDisplacement(); // Start the displacement animation sequence
}

function loadGeoJSON(index) {
    if (map) {
        console.log(`Loading GeoJSON for module index: ${index}`);
  
        // Modified condition to preserve layers for both stage 4 and 5
        if (index !== 3 && index !== 4) { // Changed from index !== 3
            console.log("Checking for existing GeoJSON or Marker layers to remove.");
            map.eachLayer(layer => {
                if (layer instanceof L.GeoJSON || layer instanceof L.Marker) {
                    console.log("Removing existing GeoJSON or Marker layer from map.");
                    map.removeLayer(layer);
                }
            });
        }
  
        // Stage 4 transition (index 3)
        if (index === 3) {
            console.log("Stage 4 detected, initiating special transition with arrow animations.");
            Promise.all([
                fetch(geojsonDataURLs[index]).then(response => response.json()), 
                fetch('static/walkthrough/data/gazaandwestbank.json').then(response => response.json())
            ]).then(([israelData, palestineData]) => {
                console.log("GeoJSON data for Israel and Palestine successfully fetched.");
                console.log("Israel Data:", israelData);
                console.log("Palestine Data:", palestineData);
                
                // Create the new Israel layer with a white/translucent style, starting invisible
                const israelLayer = L.geoJSON(israelData, {
                    style: {
                        fillColor: '#ffffff', // white fill for Israel
                        color: '#ffffff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0 // start at 0 opacity
                    }
                }).addTo(map);
                console.log("Israel layer added to map with initial invisible style.");
  
                // Create the Palestine layer from the Gaza/West Bank data with the original green style
                const palestineLayer = L.geoJSON(palestineData, {
                    style: {
                        fillColor: '#006400', // original green
                        color: '#006400',
                        weight: 0,
                        opacity: 0,
                        fillOpacity: 0.5
                    }
                }).addTo(map);
                console.log("Palestine layer added to map with green style.");
  
                map.fitBounds(israelLayer.getBounds());
                console.log("Map bounds adjusted to fit Israel layer.");
  
                // Create a GSAP timeline that includes both the bleeding transition and the arrow animation
                const timeline = gsap.timeline();

                // --- Bleeding (transition) animation ---
                timeline.to({ progress: 0 }, {
                    progress: 1,
                    duration: 5, // slow transition
                    onUpdate: function() {
                        const p = this.targets()[0].progress;
                        palestineLayer.eachLayer(layer => {
                            layer.setStyle({ fillOpacity: 0.5 * (1 - p) });
                        });
                        israelLayer.eachLayer(layer => {
                            layer.setStyle({ fillOpacity: 0.7 * p });
                        });
                    },
                    onComplete: function() {
                        console.log("Transition animation complete. Removing Palestine layer.");
                        map.removeLayer(palestineLayer);
                        window.currentGeoJSONLayer = israelLayer;
                    }
                }, 0); // start both animations at time 0

                // --- Arrow Animation for Displacement (Redeveloped) ---
                console.log("Starting arrow animation for displacement.");
                const israelCenter = israelLayer.getBounds().getCenter();
                const westBankDest = L.latLng(31.95, 35.3);
                const gazaDest = L.latLng(31.5, 34.47);

                // Use a relative path for the arrow images
                const arrowIconWestBank = L.icon({
                    iconUrl: 'static/walkthrough/img/arrow.png',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15] // anchor in the center for proper rotation
                });

                const arrowIconGaza = L.icon({
                    iconUrl: 'static/walkthrough/img/arrowleft.png',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15] // anchor in the center for proper rotation
                });

                const arrowWestBank = L.marker(israelCenter, { icon: arrowIconWestBank, zIndexOffset: 1000 }).addTo(map);
                const arrowGaza = L.marker(israelCenter, { icon: arrowIconGaza, zIndexOffset: 1000 }).addTo(map);

                // Arrow animation (runs concurrently on the same timeline)
                timeline.to({ progress: 0 }, {
                    progress: 1,
                    duration: 5,
                    onUpdate: function() {
                        const progress = this.targets()[0].progress;
                        // Calculate intermediate positions using our custom interpolate method
                        const newLatLngWest = israelCenter.interpolate(westBankDest, progress);
                        const newLatLngGaza = israelCenter.interpolate(gazaDest, progress);
                        arrowWestBank.setLatLng(newLatLngWest);
                        arrowGaza.setLatLng(newLatLngGaza);

                        // Compute constant bearings from the center to the destinations
                        const bearingWest = L.GeometryUtil.bearing(israelCenter, westBankDest);
                        const bearingGaza = L.GeometryUtil.bearing(israelCenter, gazaDest);

                        arrowWestBank._icon.style.transform = `rotate(${bearingWest}deg)`;
                        arrowGaza._icon.style.transform = `rotate(${bearingGaza}deg)`;
                    },
                    onComplete: function() {
                        console.log("Arrow animation complete. Removing arrow markers.");
                        map.removeLayer(arrowWestBank);
                        map.removeLayer(arrowGaza);
                    }
                }, 0); // start at time 0

            }).catch(error => console.error("Error loading GeoJSON data for Module 4:", error));

        }
        // NEW: Handle stage 5 (index 4)
        else if (index === 4) {
            // Remove any remaining arrow markers from stage 4
            map.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    // Check if it's an arrow marker by icon URL
                    const iconUrl = layer.options.icon?.options.iconUrl;
                    if (iconUrl && (iconUrl.includes('arrow.png') || iconUrl.includes('arrowleft.png'))) {
                        map.removeLayer(layer);
                    }
                }
            });
            
            // Keep existing layers and fit bounds
            if (window.currentGeoJSONLayer) {
                map.fitBounds(window.currentGeoJSONLayer.getBounds());
            }
        }
        else {
            // Existing code for other modules remains unchanged
            console.log("Loading GeoJSON for modules other than stage 4.");
            fetch(geojsonDataURLs[index])
                .then(response => response.json())
                .then(data => {
                    console.log("GeoJSON data successfully fetched.");
                    console.log("GeoJSON Data:", data);
                    const geojsonLayer = L.geoJSON(data, {
                        style: { fillColor: '#006400', color: '#e60026', weight: 2, opacity: 1, fillOpacity: 0.5 }
                    }).addTo(map);
                    console.log("GeoJSON layer added to map.");

                    map.fitBounds(geojsonLayer.getBounds());
                    console.log("Map bounds adjusted to fit GeoJSON layer.");
  
                    if (data.features && data.features.length > 0 && data.features[0].properties.name) {
                        geojsonLayer.eachLayer(layer => {
                            console.log(`Binding popup to layer with name: ${layer.feature.properties.name}`);
                            layer.bindPopup(layer.feature.properties.name);
                        });
                        console.log("Popups bound to GeoJSON layer features.");
                    }
  
                    // Commented out to prevent automatic flyover animation
                    // if (index === 2) {
                    //     animateModule3Markers(map);
                    // }
  
                    // Save a reference to the current layer in case it's needed for a later transition
                    window.currentGeoJSONLayer = geojsonLayer;
                    console.log("Current GeoJSON layer set to new layer.");
                })
                .catch(error => console.error("Error loading GeoJSON:", error));
        }
    } else {
        console.error("Map is not initialized, cannot load GeoJSON.");
    }
}

// New function to start the flyover animation
function playFlyoverAnimation() {
    console.log("Starting flyover animation for module 3 markers.");
    animateModule3Markers(map);
}

// Custom interpolation function for LatLng
L.LatLng.prototype.interpolate = function(dest, progress) {
    const lat = this.lat + (dest.lat - this.lat) * progress;
    const lng = this.lng + (dest.lng - this.lng) * progress;
    console.log(`Interpolating LatLng: start (${this.lat}, ${this.lng}), dest (${dest.lat}, ${dest.lng}), progress ${progress}`);
    return L.latLng(lat, lng);
};

function toggleSources(button) {
    const dropdown = button.nextElementSibling;
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }

  