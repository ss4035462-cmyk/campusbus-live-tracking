// Driver page logic.
// Drivers log in using Firebase Authentication and then share GPS coordinates.

const loginSection = document.getElementById("loginSection");
const driverDashboard = document.getElementById("driverDashboard");
const driverLoginForm = document.getElementById("driverLoginForm");
const driverBusSelect = document.getElementById("driverBusSelect");
const toggleSharingBtn = document.getElementById("toggleSharingBtn");
const driverStatusBadge = document.getElementById("driverStatusBadge");
const driverLocationStatus = document.getElementById("driverLocationStatus");
const driverLatValue = document.getElementById("driverLatValue");
const driverLngValue = document.getElementById("driverLngValue");
const driverBusIdValue = document.getElementById("driverBusIdValue");
const driverOnlineValue = document.getElementById("driverOnlineValue");
const driverAuthMessage = document.getElementById("driverAuthMessage");

let driverMap;
let driverMarker;
let isSharingLocation = false;
let watchId = null;
let selectedDriverBusId = "";

// Check whether the browser supports geolocation.
function supportsGeolocation() {
  return "geolocation" in navigator;
}

// Map setup for the driver dashboard.
function initDriverMap() {
  driverMap = L.map("driverMap").setView([12.9716, 77.5947], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(driverMap);
}

// Set message for login or status.
function showDriverMessage(message, type = "info") {
  if (!driverAuthMessage) return;
  driverAuthMessage.textContent = message;
  driverAuthMessage.className = `message ${type}`;
}

// Show or hide the panels depending on login state.
function toggleDriverPanels(isLoggedIn) {
  if (loginSection) {
    loginSection.classList.toggle("hidden", isLoggedIn);
  }

  if (driverDashboard) {
    driverDashboard.classList.toggle("hidden", !isLoggedIn);
  }
}

// Save the current driver location to Firebase.
function sendDriverLocationToFirebase(lat, lng) {
  if (!selectedDriverBusId) {
    showDriverMessage("Please select a bus before sharing your location.", "error");
    return;
  }

  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    showDriverMessage("Firebase is not configured yet. Add your credentials in js/firebase-config.js.", "error");
    return;
  }

  const database = firebase.database();
  const busRef = database.ref(`buses/${selectedDriverBusId}`);

  busRef.update({
    busId: selectedDriverBusId,
    driverId: firebase.auth().currentUser?.uid || "unknown-driver",
    status: "Moving",
    isOnline: true,
    lastUpdated: Date.now(),
    location: {
      lat,
      lng
    },
    estimatedArrival: "Calculating..."
  }).then(() => {
    driverLatValue.textContent = lat.toFixed(6);
    driverLngValue.textContent = lng.toFixed(6);
    driverBusIdValue.textContent = selectedDriverBusId;
    driverOnlineValue.textContent = "Online";
    driverStatusBadge.textContent = "Moving";
    driverStatusBadge.className = "status-pill moving";
    driverLocationStatus.textContent = "Location shared successfully";
  }).catch((error) => {
    console.error("Error updating bus position:", error);
    showDriverMessage("Unable to send the location to Firebase. Check your database rules and network connection.", "error");
  });
}

// Show the driver's current location on the map.
function updateDriverMarker(lat, lng) {
  if (!driverMap) return;

  if (driverMarker && driverMap.hasLayer(driverMarker)) {
    driverMap.removeLayer(driverMarker);
  }

  driverMarker = L.marker([lat, lng]).addTo(driverMap);
  driverMap.setView([lat, lng], 15);
}

// Start the GPS watch using the browser Geolocation API.
function startSharingLocation() {
  if (!supportsGeolocation()) {
    showDriverMessage("This browser does not support GPS. Use a modern browser with geolocation enabled.", "error");
    return;
  }

  if (!selectedDriverBusId) {
    showDriverMessage("Select your assigned bus before starting location sharing.", "error");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      updateDriverMarker(lat, lng);
      sendDriverLocationToFirebase(lat, lng);
    },
    (error) => {
      console.error("GPS error:", error);
      showDriverMessage("GPS permission was denied or the location could not be determined. Please allow location access and try again.", "error");
      stopSharingLocation();
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000
    }
  );

  isSharingLocation = true;
  toggleSharingBtn.textContent = "Stop Sharing";
  driverLocationStatus.textContent = "Sharing live location";
}

// Stop sharing the GPS location.
function stopSharingLocation() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  isSharingLocation = false;
  toggleSharingBtn.textContent = "Start Sharing";
  driverLocationStatus.textContent = "Location sharing stopped";

  if (selectedDriverBusId && window.isFirebaseConfigured && window.isFirebaseConfigured() && firebase) {
    firebase.database().ref(`buses/${selectedDriverBusId}`).update({
      status: "Stopped",
      isOnline: false,
      lastUpdated: Date.now()
    }).catch((error) => console.error("Could not update offline status:", error));
  }

  driverStatusBadge.textContent = "Offline";
  driverStatusBadge.className = "status-pill offline";
  driverOnlineValue.textContent = "Offline";
}

// Populate the dropdown with all buses from Firebase.
function populateDriverBusOptions(buses) {
  driverBusSelect.innerHTML = '<option value="">Select your bus</option>';

  if (!Array.isArray(buses) || buses.length === 0) {
    driverBusSelect.innerHTML = '<option value="">No buses available</option>';
    return;
  }

  buses.forEach((bus) => {
    const option = document.createElement("option");
    option.value = bus.busId;
    option.textContent = `${bus.busNumber || bus.busId} - ${bus.routeName || "Route"}`;
    driverBusSelect.appendChild(option);
  });
}

// Listen for bus updates so the driver can choose assigned route.
function listenForDriverBuses() {
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    showDriverMessage("Add your Firebase project configuration in js/firebase-config.js to enable real-time bus tracking.", "info");
    return;
  }

  const database = firebase.database();

  database.ref("buses").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    const buses = Object.values(data);
    populateDriverBusOptions(buses);
  }, () => {
    showDriverMessage("Could not load buses from Firebase. Check your database configuration.", "error");
  });
}

// Firebase login using email and password.
async function loginDriver(event) {
  event.preventDefault();

  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    showDriverMessage("Firebase configuration is missing. Please update js/firebase-config.js first.", "error");
    return;
  }

  const email = document.getElementById("driverEmail").value.trim();
  const password = document.getElementById("driverPassword").value;

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    showDriverMessage("Login successful. You can now share your bus location.", "info");
  } catch (error) {
    console.error("Driver login failed:", error);
    showDriverMessage(`Login failed: ${error.message}`, "error");
  }
}

// Create auth observer so the dashboard is shown after login.
function initializeDriverAuth() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      toggleDriverPanels(true);
      listenForDriverBuses();
      showDriverMessage("Driver session active.", "info");
    } else {
      toggleDriverPanels(false);
      showDriverMessage("Login with your driver account to begin sharing your live location.", "info");
    }
  });
}

// Handle bus selection for the driver.
driverBusSelect.addEventListener("change", function () {
  selectedDriverBusId = this.value;
  driverBusIdValue.textContent = selectedDriverBusId || "--";

  if (!selectedDriverBusId) {
    driverLocationStatus.textContent = "Please select a bus";
  }
});

toggleSharingBtn.addEventListener("click", function () {
  if (!selectedDriverBusId) {
    showDriverMessage("Select a bus first.", "error");
    return;
  }

  if (isSharingLocation) {
    stopSharingLocation();
    return;
  }

  startSharingLocation();
});

driverLoginForm.addEventListener("submit", loginDriver);

document.addEventListener("DOMContentLoaded", function () {
  initDriverMap();

  if (window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    initializeDriverAuth();
  } else {
    showDriverMessage("Add your Firebase credentials in js/firebase-config.js before using driver login.", "info");
  }
});
