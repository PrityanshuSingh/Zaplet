import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Assuming App is in the same directory as index.tsxy
import "./index.css";

// Move TourProvider inside Router
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
