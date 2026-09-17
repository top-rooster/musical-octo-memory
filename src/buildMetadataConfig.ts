export interface BuildMetadataEnvironment {
  mode: string;
  githubActions?: string;
  githubRunNumber?: string;
  buildTimestamp?: string;
  now?: Date;
}

export interface ResolvedBuildMetadata {
  number: string;
  timestamp: string;
}

function normalizedTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Safe Room build timestamp: ${value}`);
  }
  return date.toISOString();
}

export function resolveBuildMetadata({
  mode,
  githubActions,
  githubRunNumber,
  buildTimestamp,
  now = new Date(),
}: BuildMetadataEnvironment): ResolvedBuildMetadata {
  const number = githubRunNumber?.trim();
  const timestamp = buildTimestamp?.trim();
  const isGitHubProductionBuild = mode === "production" && githubActions === "true";

  if (isGitHubProductionBuild && (!number || number === "dev")) {
    throw new Error("GitHub Pages production build is missing GITHUB_RUN_NUMBER");
  }
  if (isGitHubProductionBuild && !timestamp) {
    throw new Error("GitHub Pages production build is missing SAFE_ROOM_BUILD_TIMESTAMP");
  }

  return {
    number: number || "dev",
    timestamp: normalizedTimestamp(timestamp || now.toISOString()),
  };
}
