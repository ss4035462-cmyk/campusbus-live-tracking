// Admin page logic.
// This page allows an authorized admin to create buses and save routes/stops.

const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginSection = document.getElementById("adminLoginSection");
const adminDashboard = document.getElementById("adminDashboard");
const adminAuthMessage = document.getElementById("adminAuthMessage");
const busForm = document.getElementById("busForm");
const routeForm = document.getElementById("routeForm");
const adminBusList = document.getElementById("adminBusList");

// Toggle login and dashboard sections.
function toggleAdminPanels(isLoggedIn) {
  adminLoginSection.classList.toggle("hidden", isLoggedIn);
  adminDashboard.classList.toggle("hidden", !isLoggedIn);
}

function showAdminMessage(message, type = "info") {
  adminAuthMessage.textContent = message;
  adminAuthMessage.className = `message ${type}`;
}

// Validate config before using Firebase.
function ensureFirebaseReady() {
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    showAdminMessage("Firebase is not configured yet. Add your credentials in js/firebase-config.js.", "error");
    return false;
  }

  if (!firebase || !firebase.database || !firebase.auth) {
    showAdminMessage("Firebase scripts did not load correctly. Ensure the Firebase SDK is connected.", "error");
    return false;
  }

  return true;
}

// Save a new bus to the Realtime Database.
function saveBus(event) {
  event.preventDefault();

  if (!ensureFirebaseReady()) {
    return;
  }

  const busId = document.getElementById("busIdInput").value.trim();
  const busNumber = document.getElementById("busNumberInput").value.trim();
  const routeName = document.getElementById("routeNameInput").value.trim();
  const startingPoint = document.getElementById("startPointInput").value.trim();
  const destination = document.getElementById("destinationInput").value.trim();

  if (!busId || !busNumber || !routeName || !startingPoint || !destination) {
    showAdminMessage("Please fill in all required bus details.", "error");
    return;
  }

  const busData = {
    busId,
    busNumber,
    routeName,
    startingPoint,
    destination,
    status: "Offline",
    isOnline: false,
    lastUpdated: Date.now(),
    location: {
      lat: 0,
      lng: 0
    },
    route: [],
    stops: []
  };

  firebase.database().ref(`buses/${busId}`).set(busData)
    .then(() => {
      showAdminMessage(`Bus ${busNumber} was saved successfully.`, "info");
      busForm.reset();
    })
    .catch((error) => {
      console.error("Save bus failed:", error);
      showAdminMessage("Failed to save the bus. Check your Firebase rules and database connection.", "error");
    });
}

// Save route points and stops for a selected bus.
function saveRoute(event) {
  event.preventDefault();

  if (!ensureFirebaseReady()) {
    return;
  }

  const busId = document.getElementById("routeBusIdInput").value.trim();
  const routeText = document.getElementById("routePointsInput").value.trim();
  const stopsText = document.getElementById("stopsInput").value.trim();

  if (!busId) {
    showAdminMessage("Please enter a bus ID to update its route.", "error");
    return;
  }

  let routePoints = [];
  let stops = [];

  try {
    routePoints = routeText ? JSON.parse(routeText) : [];
    stops = stopsText ? JSON.parse(stopsText) : [];
  } catch (error) {
    showAdminMessage("Route and stops must be valid JSON. Example: [{\"lat\": 12.97, \"lng\": 77.59}]", "error");
    return;
  }

  firebase.database().ref(`buses/${busId}`).update({
    route: routePoints,
    stops: stops
  }).then(() => {
    showAdminMessage(`Route and stops were updated for bus ${busId}.`, "info");
    routeForm.reset();
  }).catch((error) => {
    console.error("Route update failed:", error);
    showAdminMessage("Could not update the route. Check your Firebase connection and permissions.", "error");
  });
}

// Render a table of buses for the admin dashboard.
function renderAdminBusTable(buses) {
  if (!adminBusList) return;

  if (!Array.isArray(buses) || buses.length === 0) {
    adminBusList.innerHTML = "<p>No buses have been added yet.</p>";
    return;
  }

  const header = document.createElement("div");
  header.className = "bus-row bus-row-header";
  header.innerHTML = `
    <strong>Bus</strong>
    <strong>Route</strong>
    <strong>Start</strong>
    <strong>Destination</strong>
    <strong>Status</strong>
  `;
  adminBusList.innerHTML = "";
  adminBusList.appendChild(header);

  buses.forEach((bus) => {
    const row = document.createElement("div");
    row.className = "bus-row";

    const status = bus.status || "Offline";
    const statusClass = status === "Moving" ? "moving" : status === "Stopped" ? "stopped" : status === "Online" ? "online" : "offline";

    row.innerHTML = `
      <strong>${bus.busNumber || bus.busId || "Bus"}</strong>
      <span>${bus.routeName || "--"}</span>
      <span>${bus.startingPoint || "--"}</span>
      <span>${bus.destination || "--"}</span>
      <span class="status-pill ${statusClass}">${status}</span>
    `;

    adminBusList.appendChild(row);
  });
}

// Watch the buses collection in real time.
function watchAdminBuses() {
  if (!ensureFirebaseReady()) {
    return;
  }

  firebase.database().ref("buses").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    const buses = Object.values(data);
    renderAdminBusTable(buses);
  }, (error) => {
    console.error("Unable to watch buses:", error);
    showAdminMessage("Failed to load active buses from the database.", "error");
  });
}

// Authorized admin login for email/password accounts.
async function loginAdmin(event) {
  event.preventDefault();

  if (!ensureFirebaseReady()) {
    return;
  }

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const allowedEmails = (window.appSettings && window.appSettings.allowedAdminEmails) || [];

    const isAllowed = allowedEmails.some((allowedEmail) => allowedEmail.toLowerCase() === email.toLowerCase());

    if (!isAllowed) {
      await firebase.auth().signOut();
      showAdminMessage("This account is not authorized to access the admin panel.", "error");
      return;
    }

    showAdminMessage("Admin login successful.", "info");
    toggleAdminPanels(true);
  } catch (error) {
    console.error("Admin login failed:", error);
    showAdminMessage(`Login failed: ${error.message}`, "error");
  }
}

// Initialize auth state.
function initializeAdminAuth() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      toggleAdminPanels(true);
      watchAdminBuses();
    } else {
      toggleAdminPanels(false);
      showAdminMessage("Login with an authorized admin account to manage buses.", "info");
    }
  });
}

adminLoginForm.addEventListener("submit", loginAdmin);
busForm.addEventListener("submit", saveBus);
routeForm.addEventListener("submit", saveRoute);

document.addEventListener("DOMContentLoaded", function () {
  if (window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    initializeAdminAuth();
  } else {
    showAdminMessage("Add Firebase credentials to js/firebase-config.js before using the admin dashboard.", "info");
  }
});
