# CampusBus – Live Bus Tracking System

CampusBus is a responsive university bus tracking web app that helps students view the current location of campus buses in real time. It includes a student dashboard, driver login, and admin dashboard. Drivers can share their live GPS location through the browser Geolocation API, and the location is saved to Firebase Realtime Database. Students can then track buses without refreshing the page.

## Project Features

- Student dashboard with live map, route selection, bus status, route details, and last updated information
- Driver login and live GPS tracking with browser geolocation
- Admin panel for adding buses, routes, and stops
- Firebase Realtime Database integration
- Firebase Authentication with admin and driver login flow
- Responsive design for mobile, tablet, and desktop
- Offline and error handling states
- Clean, beginner-friendly structure and comments in the JavaScript files

## How to Install / Run

1. Download or clone the project to your local computer.
2. Make sure you have a modern browser such as Chrome or Edge.
3. Open the project folder in a code editor like VS Code.
4. Start a local web server.

For example, in the project folder run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## How to Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project".
3. Name your project, for example: "campusbus-tracking".
4. Continue through the setup steps.
5. When the project is created, open the project dashboard.

## How to Configure Firebase

After creating the project:

1. Click the web icon (`</>`) to add a web app.
2. Register the app.
3. Copy the Firebase configuration object shown in the console.
4. Open the file:

```text
js/firebase-config.js
```

5. Replace the placeholder values with your real Firebase values.

Example:

```javascript
window.firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234"
};
```

## How to Enable Realtime Database

1. In Firebase Console, open "Realtime Database".
2. Click "Create Database".
3. Choose the region nearest to your users.
4. Start in test mode for development.
5. Save the configuration.

Important: For production, update Firebase Database Rules to secure your data.

## How to Enable Authentication

1. Go to the Firebase Console.
2. Open "Authentication".
3. Click "Get started".
4. Select the "Email/Password" sign-in method.
5. Enable it.

Then create at least one admin or driver account in the Authentication panel or through your app.

## Firebase Data Structure Recommended

This app expects bus data in a structure like:

```json
{
  "buses": {
    "BUS-101": {
      "busId": "BUS-101",
      "busNumber": "101",
      "routeName": "North Loop",
      "startingPoint": "Main Gate",
      "destination": "Science Block",
      "status": "Moving",
      "isOnline": true,
      "lastUpdated": 1712345678901,
      "location": {
        "lat": 12.9716,
        "lng": 77.5947
      },
      "route": [
        { "lat": 12.9716, "lng": 77.5947 },
        { "lat": 12.9800, "lng": 77.6000 }
      ],
      "stops": [
        { "name": "Main Gate", "lat": 12.9716, "lng": 77.5947 }
      ]
    }
  }
}
```

## How to Run the Website Locally

1. Configure Firebase credentials inside `js/firebase-config.js`.
2. Start a local server:

```bash
python -m http.server 8000
```

3. Open in the browser:

```text
http://localhost:8000/
```

4. Use the pages:
   - `index.html` for the public home page
   - `student.html` for the student tracking dashboard
   - `driver.html` for driver login and live GPS sharing
   - `admin.html` for the admin dashboard

## Deployment Using GitHub Pages or Another Host

### GitHub Pages

1. Push the project to a GitHub repository.
2. Open the repository settings.
3. Go to "Pages".
4. Set the source to the main branch and root folder.
5. Save the settings.
6. GitHub will provide a published URL.

### Alternative Hosting

You can also deploy to:

- Netlify
- Vercel
- Firebase Hosting
- Any static website host

## Security Notes

- Do not expose personal driver data.
- Do not store sensitive private information in public files.
- Use Firebase Database Rules to restrict editing to authenticated users.
- Keep private keys out of source control.

## Project Structure

```text
/campusbus
├── index.html
├── student.html
├── driver.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── student.js
│   ├── driver.js
│   ├── admin.js
│   └── firebase-config.js
├── assets/
│   └── logo.svg
├── README.md
└── .gitignore
```

## Troubleshooting

- If the map does not appear, check that Leaflet CSS and JS are loading correctly.
- If Firebase initialization fails, ensure your config values are correct.
- If GPS does not work, allow browser location access.
- If the database is empty, create a bus in the admin panel or add data manually.

## Summary

CampusBus is a beginner-friendly full-stack-style front-end project that demonstrates real-time location tracking with Firebase and Leaflet. It is easy to understand, easy to customize, and can be expanded with additional bus logic, map layers, or advanced admin features later.
