import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * 🚨 IMPORTANT
 * Explicitly UNREGISTER any existing service workers.
 * This prevents Replit PWA / sw.js from hijacking API requests
 * in Vercel / Render deployments.
 */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
