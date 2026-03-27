/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Dette gør at den ignorerer TypeScript fejl når vi bygger
    ignoreBuildErrors: true,
  },
  eslint: {
    // Dette gør at den ignorerer linting fejl (formatering)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;