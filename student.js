// Student dashboard logic.
// This page listens to Firebase Realtime Database and updates the map automatically.

const busSelect = document.getElementById("busSelect");
const studentError = document.getElementById("studentError");
const busNumberValue = document.getElementById("busNumberValue");
const routeNameValue = document.getElementById("routeNameValue");
const statusValue = document.getElementById("statusValue");
const startValue = document.getElementById("startValue");
const destinationValue = document.getElementById("destinationValue");
const lastUpdatedValue = document.getElementById("lastUpdatedValue");
const arrivalValue = document.getElementById("arrivalValue");
const routeStopsList = document.getElementById("routeStopsList");
const selectedRouteBadge = document.getElementById("selectedRouteBadge");

let studentMap;
let busMarker;
let routePolyline;
let routeMarkers = [];
let currentBus = null;

// Create the Leaflet map for students.
function initStudentMap() {
  studentMap = L.map("studentMap", {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([12.9716, 77.5947], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(studentMap);
}

// Show user-friendly error messages.
function showStudentMessage(message) {
  if (!studentError) return;
  studentError.textContent = message;
  studentError.classList.remove("hidden");
}

function clearStudentMessage() {
  if (!studentError) return;
  studentError.textContent = "";
  studentError.classList.add("hidden");
}

// Remove old route lines and stop markers before drawing the next route.
function clearRouteDisplay() {
  if (routePolyline && studentMap.hasLayer(routePolyline)) {
    studentMap.removeLayer(routePolyline);
  }

  routeMarkers.forEach((marker) => {
    if (studentMap.hasLayer(marker)) {
      studentMap.removeLayer(marker);
    }
  });

  routeMarkers = [];
}

// Draw the route line and important stops on the map.
function renderRoute(routeData, stops) {
  clearRouteDisplay();

  if (!Array.isArray(routeData) || routeData.length === 0) {
    return;
  }

  routePolyline = L.polyline(routeData, {
    color: "#2654a2",
    weight: 5,
    opacity: 0.9
  }).addTo(studentMap);

  // Fit the map to the route so the full trip is visible.
  studentMap.fitBounds(routePolyline.getBounds(), {
    padding: [24, 24]
  });

  // Add stop markers.
  if (Array.isArray(stops)) {
    stops.forEach((stop) => {
      if (!stop || !stop.lat || !stop.lng) return;

      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: 7,
        color: "#f6b826",
        fillColor: "#f6b826",
        fillOpacity: 1
      }).addTo(studentMap);

      marker.bindPopup(stop.name || "Bus stop");
      routeMarkers.push(marker);
    });
  }
}

// Create or move the bus marker on the map.
function renderBusMarker(location) {
  if (!location || !studentMap) return;

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  // Remove the old marker before placing the new one.
  if (busMarker && studentMap.hasLayer(busMarker)) {
    studentMap.removeLayer(busMarker);
  }

  busMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "custom-bus-marker",
      html: "🚌",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }).addTo(studentMap);

  busMarker.bindPopup(currentBus ? `${currentBus.busNumber || "Bus"} is here` : "Bus location");
}

// Format the last updated time in a readable way.
function formatLastUpdated(timestamp) {
  if (!timestamp) {
    return "Waiting for data";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Waiting for data";
  }

  return date.toLocaleString();
}

// Update the UI card to show the current bus details.
function renderBusDetails(bus) {
  if (!bus) {
    return;
  }

  currentBus = bus;

  busNumberValue.textContent = bus.busNumber || "--";
  routeNameValue.textContent = bus.routeName || "--";
  startValue.textContent = bus.startingPoint || "--";
  destinationValue.textContent = bus.destination || "--";
  lastUpdatedValue.textContent = formatLastUpdated(bus.lastUpdated);
  arrivalValue.textContent = bus.estimatedArrival || "Not available";
  selectedRouteBadge.textContent = bus.routeName || "No route selected";

  const status = bus.status || "Offline";
  statusValue.textContent = status;
  statusValue.classList.remove("online", "moving", "stopped", "offline");

  if (status === "Moving") {
    statusValue.classList.add("moving");
  } else if (status === "Stopped") {
    statusValue.classList.add("stopped");
  } else if (status === "Online") {
    statusValue.classList.add("online");
  } else {
    statusValue.classList.add("offline");
  }

  // Route information and stops list.
  const routeData = Array.isArray(bus.route) ? bus.route : [];
  const stops = Array.isArray(bus.stops) ? bus.stops : [];

  renderRoute(routeData, stops);

  if (stops.length) {
    routeStopsList.innerHTML = "";
    stops.forEach((stop) => {
      const listItem = document.createElement("li");
      listItem.textContent = stop.name || "Stop";
      routeStopsList.appendChild(listItem);
    });
  } else {
    routeStopsList.innerHTML = "<li>No stop information available yet.</li>";
  }

  if (bus.location && bus.location.lat && bus.location.lng) {
    renderBusMarker(bus.location);
  }
}

// Attach change event so the student can switch between buses.
function bindBusSelection() {
  busSelect.addEventListener("change", function () {
    const selectedId = this.value;

    if (!selectedId) {
      return;
    }

    const selectedBus = getSelectedBus(selectedId);
    renderBusDetails(selectedBus);
  });
}

// Find the selected bus object from Firebase results.
function getSelectedBus(busId) {
  const buses = window.campusBusCache || [];
  return buses.find((bus) => String(bus.busId) === String(busId)) || null;
}

// Populate the bus dropdown with data from Firebase.
function populateBusList(buses) {
  if (!busSelect) return;

  busSelect.innerHTML = '<option value="">Select a bus</option>';

  if (!Array.isArray(buses) || buses.length === 0) {
    busSelect.innerHTML = '<option value="">No buses available</option>';
    showStudentMessage("No buses are currently being tracked. Please check again soon.");
    return;
  }

  buses.forEach((bus) => {
    const option = document.createElement("option");
    option.value = bus.busId;
    option.textContent = `${bus.busNumber || bus.busId} - ${bus.routeName || "Route"}`;
    busSelect.appendChild(option);
  });

  const firstBus = buses[0];
  busSelect.value = firstBus.busId;
  renderBusDetails(firstBus);
  clearStudentMessage();
}

// Connect to the Firebase database to read bus data in real time.
function watchBuses() {
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    showStudentMessage("Firebase is not configured yet. Add your project credentials in js/firebase-config.js to enable live tracking.");
    return;
  }

  if (!firebase || !firebase.database) {
    showStudentMessage("Firebase database is not available. Check your browser connection and Firebase configuration.");
    return;
  }

  const database = firebase.database();
  const busesRef = database.ref("buses");

  busesRef.on("value", (snapshot) => {
    const busesData = snapshot.val();
    const buses = Object.values(busesData || {});

    window.campusBusCache = buses;
    populateBusList(buses);

    if (!buses.length) {
      showStudentMessage("No buses are active right now.");
    }
  }, () => {
    showStudentMessage("Unable to connect to Firebase Realtime Database. Please verify your network and database permissions.");
  });
}

// Initialize page after the DOM is ready.
function initializeStudentPage() {
  initStudentMap();
  bindBusSelection();
  watchBuses();
}

document.addEventListener("DOMContentLoaded", initializeStudentPage);
