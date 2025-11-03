// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No unsupported experimental flags. LAN access still works today.
  // When Next enforces allowedDevOrigins in a future major,
  // we’ll add it back in the correct place.
};

export default nextConfig;
