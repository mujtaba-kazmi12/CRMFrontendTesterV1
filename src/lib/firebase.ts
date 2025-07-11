// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1IcTG7cskVhx_-M5ATY6G2dcaIkpBAtA",
  authDomain: "certusimages.firebaseapp.com",
  projectId: "certusimages",
  storageBucket: "certusimages.appspot.com",
  messagingSenderId: "954928629563",
  appId: "1:954928629563:web:3ac73da09c7f9970f7191e",
  measurementId: "G-SML9W6B8FW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Only initialize analytics if in the browser
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    getAnalytics(app); // Just initialize, don't assign to analytics
  }).catch((err) => {
    console.log('Analytics initialization failed:', err);
  });
}

export async function uploadImageToFirebase(file: File): Promise<string> {
  const storage = getStorage(app);
  const storageRef = ref(storage, `post-images/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export { app }; // Export the initialized app