/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
    ],
  },
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_NAME: 'ContextFlow',
  },
}

module.exports = nextConfig
