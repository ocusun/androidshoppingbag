import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/androidshoppingbag/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: ["index.html", "terms.html", "privacy.html"],
    },
  },
});
