import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export", // Enables static export (next export)
    trailingSlash: true, // Ensures URLs like /dashboard export to /dashboard/index.html
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
