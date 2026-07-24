import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PolicyApp from "./PolicyApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PolicyApp />
  </StrictMode>,
);
