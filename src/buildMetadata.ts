export interface BuildMetadata {
  number: string;
  timestamp: string;
}

export const CURRENT_BUILD_METADATA: BuildMetadata = {
  number: __SAFE_ROOM_BUILD_NUMBER__,
  timestamp: __SAFE_ROOM_BUILD_TIMESTAMP__,
};

export function formatBuildTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid Safe Room build timestamp: ${timestamp}`);
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

export function formatBuildMetadata(metadata: BuildMetadata): string {
  return `Build ${metadata.number} · ${formatBuildTimestamp(metadata.timestamp)}`;
}
