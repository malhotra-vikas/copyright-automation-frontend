// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

let firebaseApp: any;
let auth: any;

const loadFirebaseConfig = async () => {
  //import.meta.env.VITE_REACT_APP_SERVER_URL;


  try {
    // ✅ Hardcoded Firebase Config (Replace with your actual credentials)
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    console.log("✅ Firebase Initialized from JSON!");
  } catch (error) {
    console.error("❌ Failed to load Firebase config:", error);
  }
};

loadFirebaseConfig();

export { firebaseApp, auth };
