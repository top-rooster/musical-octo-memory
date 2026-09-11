import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/musical-octo-memory/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
}));
