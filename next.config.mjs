/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev HMR when using Network URL (e.g. phone/other device on LAN)
  allowedDevOrigins: ['192.168.1.43'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
