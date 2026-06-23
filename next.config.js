const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: true,
  register: false,
  skipWaiting: true,
  fallbacks: {
    document: '/offline.html',
  },
  cacheOnFrontEndNav: false,
  buildExcludes: [
    /\/_next\/static\/.*/i,
    /\/_next\/data\/.*/i,
  ],
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    navigateFallback: null,
    navigateFallbackDenylist: [
      /\/_next\/static\/.*/i,
      /\/_next\/data\/.*/i,
      /\/_next\/.*\.js$/i,
      /\/_next\/.*\.css$/i,
    ],
    runtimeCaching: [
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\/_next\/data\/.*/i,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /^https:\/\/cdn\.modrinth\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'modrinth-cdn',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
    ],
  },
})

const nextConfig = {
  basePath: '',
  async rewrites() {
    return [
      { source: '/app', destination: '/launcher' },
      { source: '/app/', destination: '/launcher' },
    ]
  },
  images: {
    domains: ['cdn.modrinth.com'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  staticPageGenerationTimeout: 300,
  trailingSlash: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js|workbox-).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = withPWA(nextConfig)
