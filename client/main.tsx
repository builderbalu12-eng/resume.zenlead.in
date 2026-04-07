import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { initGA } from "./lib/analytics";

initGA();

// Store the backend API URL in localStorage so the browser extension's
// content script can read it and relay it to chrome.storage.sync.
if (import.meta.env.VITE_API_URL) {
  localStorage.setItem('resumematch_api_url', import.meta.env.VITE_API_URL);
}

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  );
}
