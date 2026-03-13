import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { initGA } from "./lib/analytics";

initGA();

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
