/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib'],
  },

  // If you need to specify external packages for server components, add here:
  // serverExternalPackages: [],

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    domains: [
      'placehold.co',
      'firebasestorage.googleapis.com',
      'certusimages.appspot.com',
      'autopublisher-crm.s3.eu-north-1.amazonaws.com'
    ],
    unoptimized: true // For static export if needed
  },
  env: {
    CUSTOM_KEY: 'my-value',
    NEXT_PUBLIC_API_BASE_URL: 'https://be.handicap-internatioanl.fr/api',
  },

  // Add headers for caching optimization
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }

    // Production caching headers
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=60',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)\\.(png|jpg|jpeg|gif|svg|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },

  // Enable static export if needed for deployment
  // output: 'export',
  // trailingSlash: true,

  // Webpack configuration for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Remove custom usedExports/sideEffects, let Next.js handle optimization
    // CSS optimization for styles chunk splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          styles: {
            name: 'styles',
            test: /\.(css|scss|sass)$/,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Rewrite backend URLs to appear as frontend URLs
  async rewrites() {
    // Only apply rewrites in production, not during build
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    
    const backendBaseUrl = 'https://be.handicap-internatioanl.fr';

    return [
      // Posts Sitemap rewrite - all posts with images
      {
        source: '/post-sitemap.xml',
        destination: `${backendBaseUrl}/post-sitemap.xml`,
      },
      // Categories Sitemap rewrite - categories and subcategories
      {
        source: '/categories-sitemap.xml',
        destination: `${backendBaseUrl}/categories-sitemap.xml`,
      },
      // Legacy Sitemap rewrite - redirects to sitemap index
      {
        source: '/sitemap.xml',
        destination: `${backendBaseUrl}/sitemap.xml`,
      },
      // Robots.txt rewrite - masks backend robots.txt as frontend robots.txt
      {
        source: '/robots.txt',
        destination: `${backendBaseUrl}/robots.txt`,
      },
    ];
  },

  publicRuntimeConfig: {
    WEBHOOK_SECRET: "Qw7!pZ2#rT9$kLm8@vX4^sB1&nH6*eJ3",
    DOMAIN: 'https://handicap-internatioanl.fr',
  },
}

module.exports = nextConfig; 