const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  sw: 'sw-v2.js',
  disable: false,
  register: false,
  skipWaiting: true,
  cacheOnFrontEndNav: false,
  cacheStartUrl: true,
  fallbacks: {
    document: '/offline.html',
  },
  workboxOptions: {
    disableDevLogs: true,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    navigateFallback: null,
    navigateFallbackDenylist: [/\/_next\//i, /\/api\//i],
    exclude: [
      /\.map$/,
      /^manifest.*\.js$/,
      /\/_next\/static\/.*(?<!\.p)\.woff2/,
      ({ asset }) => {
        const name = asset?.name || ''
        return (
          name.startsWith('static/') ||
          name.startsWith('server/') ||
          name.includes('_buildManifest') ||
          name.includes('_ssgManifest') ||
          /^((app-|^)build-manifest\.json|react-loadable-manifest\.json)$/.test(name)
        )
      },
    ],
    manifestTransforms: [
      async (manifestEntries) => ({
        manifest: manifestEntries.filter(
          (entry) =>
            !entry.url.includes('/_next/') &&
            !entry.url.includes('_buildManifest') &&
            !entry.url.includes('_ssgManifest'),
        ),
        warnings: [],
      }),
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
        source: '/:path((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js|sw-v2.js|workbox-).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/sw-v2.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
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
