// Main app script for the home page.
// This file is small because most logic lives in the student, driver, and admin pages.

document.addEventListener("DOMContentLoaded", function () {
  const currentYear = new Date().getFullYear();

  // Optional: add dynamic year if a footer is added later.
  // This keeps the home page simple and beginner-friendly.
  console.log("CampusBus app loaded successfully.", currentYear);
});
