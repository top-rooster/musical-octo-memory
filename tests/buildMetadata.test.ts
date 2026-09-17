import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { formatBuildMetadata, formatBuildTimestamp } from "../src/buildMetadata";
import { resolveBuildMetadata } from "../src/buildMetadataConfig";
import { BuildMetadataBadge } from "../src/components/BuildMetadataBadge";

describe("build metadata", () => {
  const metadata = {
    number: "42",
    timestamp: "2026-09-17T06:23:45.000Z",
  };

  it("formats build metadata in unambiguous UTC", () => {
    expect(formatBuildTimestamp(metadata.timestamp)).toBe("2026-09-17 06:23 UTC");
    expect(formatBuildMetadata(metadata)).toBe("Build 42 · 2026-09-17 06:23 UTC");
  });

  it("renders supplied metadata and exposes the injected raw values", () => {
    const html = renderToStaticMarkup(createElement(BuildMetadataBadge, { metadata }));

    expect(html).toContain("Build 42 · 2026-09-17 06:23 UTC");
    expect(html).toContain('data-build-number="42"');
    expect(html).toContain('data-build-timestamp="2026-09-17T06:23:45.000Z"');
  });

  it("uses a local dev fallback with the local build/start time", () => {
    expect(resolveBuildMetadata({
      mode: "development",
      now: new Date("2026-09-17T07:10:00.000Z"),
    })).toEqual({
      number: "dev",
      timestamp: "2026-09-17T07:10:00.000Z",
    });
  });

  it("rejects missing metadata in a GitHub Pages production build", () => {
    expect(() => resolveBuildMetadata({
      mode: "production",
      githubActions: "true",
      buildTimestamp: metadata.timestamp,
    })).toThrow(/GITHUB_RUN_NUMBER/);

    expect(() => resolveBuildMetadata({
      mode: "production",
      githubActions: "true",
      githubRunNumber: metadata.number,
    })).toThrow(/SAFE_ROOM_BUILD_TIMESTAMP/);
  });
});
