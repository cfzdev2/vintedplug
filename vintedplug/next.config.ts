import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vinext checks multipart bodies before dispatching upload routes.
  // The upload handler still enforces an 8 MB file limit.
  experimental: {serverActions: {bodySizeLimit: "9mb"}},
};

export default nextConfig;
