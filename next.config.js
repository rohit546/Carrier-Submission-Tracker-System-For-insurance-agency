/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Dockerfile standalone deployment
  // Railway will auto-detect Next.js and handle deployment
  // Environment variables are automatically available via process.env
  // Exclude old directories from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  webpack: (config, { isServer }) => {
    // Exclude old directories from webpack compilation
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/Prefill-insurance-Forms-automated-data-prefill-system-master*/**',
        '**/frame/**',
      ],
    }
    return config
  },
}

export default nextConfig
