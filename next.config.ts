import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.236"],
  headers: async () => [{ source: "/(.*)", headers: securityHeaders }],
};

export default nextConfig;
