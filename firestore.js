// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBG2CbkXtAO2LJ7AVayUrAjFw9xl19-Gu0",
  authDomain: "miguro-142aa.firebaseapp.com",
  projectId: "miguro-142aa",
  storageBucket: "miguro-142aa.firebasestorage.app",
  messagingSenderId: "138339121027",
  appId: "1:138339121027:web:a345b5a42957fc92d768b6",
  measurementId: "G-XSW77T6S3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);