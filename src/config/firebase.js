import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQPOvbb2HYzZ9Y0ENILI7tlCMBmk1Vm1c",
  authDomain: "madburning-72643.firebaseapp.com",
  projectId: "madburning-72643",
  storageBucket: "madburning-72643.firebasestorage.app",
  messagingSenderId: "657172231081",
  appId: "1:657172231081:web:300cf2600fbccf9b4acab8",
  measurementId: "G-FF482JHK3D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
