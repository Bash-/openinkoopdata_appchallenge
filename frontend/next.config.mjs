import { paraglide } from '@inlang/paraglide-next/plugin'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/storage'],
  },
}

export default paraglide({
  paraglide: {
    project: './project.inlang',
    outdir: './paraglide'
  },
  ...nextConfig
})
