import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCui9r_OKAVlhlr5SHJ3rf4OH9v_ydRgn0",
  authDomain: "thevibecodecity-73598.firebaseapp.com",
  projectId: "thevibecodecity-73598",
  storageBucket: "thevibecodecity-73598.firebasestorage.app",
  messagingSenderId: "45516430880",
  appId: "1:45516430880:web:ddebd1cf1953ddfd89e645",
  measurementId: "G-TH39CH3ZST",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function initAnalytics() {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(app);
  }
  return null;
}
