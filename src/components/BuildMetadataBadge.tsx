import {
  CURRENT_BUILD_METADATA,
  formatBuildMetadata,
  type BuildMetadata,
} from "../buildMetadata";

export function BuildMetadataBadge({
  metadata = CURRENT_BUILD_METADATA,
}: {
  metadata?: BuildMetadata;
}) {
  return (
    <output
      className="build-metadata"
      aria-label="Build information"
      data-build-number={metadata.number}
      data-build-timestamp={metadata.timestamp}
    >
      {formatBuildMetadata(metadata)}
    </output>
  );
}
