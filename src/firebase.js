import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // I-paste mo dito yung nakuha mong config mula sa Firebase Console
  apiKey: "AIzaSyDmuWunIsPV3zDcUkLoJOGRJuBRxajbdY8",
  authDomain: "utang-tracker-f5199.firebaseapp.com",
  projectId: "utang-tracker-f5199",
  storageBucket: "utang-tracker-f5199.firebasestorage.app",
  messagingSenderId: "414872317402",
  appId: "1:414872317402:web:423682dac26150bd7464e3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Ito ang database mo