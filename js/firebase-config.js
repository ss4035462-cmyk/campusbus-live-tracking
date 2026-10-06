// This file holds the Firebase configuration required by the app.
// Replace these values with the credentials from your own Firebase project.
// This project intentionally keeps placeholders so no private keys are committed.

window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Allowed account emails for admin and driver access.
// These are easy to update if you want to restrict login to your university emails.
window.appSettings = {
  allowedAdminEmails: ["admin@campusbus.com"],
  allowedDriverEmails: ["driver@campusbus.com"]
};

// Check that Firebase config was filled in by the developer.
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

// Helper for safer access to the Firebase database.
window.getFirebaseDatabase = function () {
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    throw new Error("Firebase config is missing. Add your project credentials first.");
  }

  if (!firebase || !firebase.database) {
    throw new Error("Firebase database SDK is not available.");
  }

  return firebase.database();
};
