import type { NextConfig } from 'next';

/**
 * Next.js 14 configuration for NexArena.
 *
 * Security headers are applied to all routes.
 * CSP is intentionally open for development — tighten in production
 * by replacing 'unsafe-inline' / 'unsafe-eval' with nonces.
 */
const nextConfig: NextConfig = {
  /* ── Performance ─────────────────────────── */
  reactStrictMode: true,

  /* ── Security Headers ─────────────────────── */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Allows Google Maps, Firebase, Gemini endpoints.
            // Tighten 'unsafe-inline' with nonces in production.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firestore.googleapis.com wss://*.firebaseio.com",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
      /* ── Admin route: extra noindex header ── */
      {
        source: '/admin(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },

  /* ── Experimental ─────────────────────────── */
  experimental: {
    // Enables server component optimisations
    optimizePackageImports: ['firebase', '@google/generative-ai'],
  },
};

export default nextConfig;
