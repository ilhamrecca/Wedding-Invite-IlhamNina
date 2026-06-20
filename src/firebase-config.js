/**
 * Firebase Configuration
 * ---------------------------------------------------------------------------
 * Steps to get your config:
 *   1. Go to https://console.firebase.google.com/
 *   2. Click "Add project" and follow the wizard (it's free, use the Spark plan)
 *   3. Once inside your project, click the web icon </> to register a Web App
 *   4. Copy the firebaseConfig object shown and paste the values below
 *   5. Go to Build → Firestore Database → Create database (start in production mode)
 *   6. In Firestore Rules, paste:
 *
 *        rules_version = '2';
 *        service cloud.firestore {
 *          match /databases/{database}/documents {
 *            match /wishes/{docId} {
 *              allow read: if true;
 *              allow create: if request.resource.data.name is string
 *                           && request.resource.data.name.size() <= 48
 *                           && request.resource.data.message is string
 *                           && request.resource.data.message.size() <= 220;
 *            }
 *          }
 *        }
 *
 * ---------------------------------------------------------------------------
 * NOTE: It is safe to expose this config in client-side code.
 * The Firestore security rules above protect your data.
 * ---------------------------------------------------------------------------
 */
export const firebaseConfig = {
  apiKey:            "AIzaSyALrvQhRV8NJeLV5Gr8clDfZiDjwWEXlkw",
  authDomain:        "ilhamninaa.firebaseapp.com",
  projectId:         "ilhamninaa",
  storageBucket:     "ilhamninaa.firebasestorage.app",
  messagingSenderId: "486612097408",
  appId:             "1:486612097408:web:67c0c1634d61c1b43c4965",
  measurementId:     "G-N4HSJNCDH1",
};
