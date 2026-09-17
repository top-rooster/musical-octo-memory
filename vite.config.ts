import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolveBuildMetadata } from "./src/buildMetadataConfig.ts";

export default defineConfig(({ mode }) => {
  const buildMetadata = resolveBuildMetadata({
    mode,
    githubActions: process.env.GITHUB_ACTIONS,
    githubRunNumber: process.env.GITHUB_RUN_NUMBER,
    buildTimestamp: process.env.SAFE_ROOM_BUILD_TIMESTAMP,
  });

  return {
    base: mode === "production" ? "/musical-octo-memory/" : "/",
    define: {
      __SAFE_ROOM_BUILD_NUMBER__: JSON.stringify(buildMetadata.number),
      __SAFE_ROOM_BUILD_TIMESTAMP__: JSON.stringify(buildMetadata.timestamp),
    },
    plugins: [react()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
    },
  };
});
