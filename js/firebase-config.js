// This file is intentionally a placeholder configuration file.
// Add your Firebase credentials here before using the website.
// You can copy the values from your Firebase project settings.

window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

window.appSettings = {
  allowedAdminEmails: ["admin@campusbus.com"],
  allowedDriverEmails: ["driver@campusbus.com"]
};

// Helper: make sure the config is valid before trying to connect to Firebase.
window.isFirebaseConfigured = function () {
  const config = window.firebaseConfig || {};

  return (
    typeof config.apiKey === "string" &&
    config.apiKey.length > 10 &&
    !config.apiKey.includes("YOUR_") &&
    typeof config.projectId === "string" &&
    !config.projectId.includes("YOUR_")
  );
};
