import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexArena — AI-Powered Smart Venue Assistant',
  description:
    'NexArena is your intelligent stadium companion. Get real-time navigation, crowd density updates, food & facility info powered by Gemini AI.',
  keywords: ['stadium assistant', 'venue navigation', 'AI chatbot', 'crowd management', 'smart venue', 'event guide'],
  authors: [{ name: 'NexArena Team', url: 'https://nexarena.app' }],
  robots: 'index, follow',
  openGraph: {
    title: 'NexArena — AI-Powered Smart Venue Assistant',
    description: 'Navigate large-scale sporting venues intelligently with NexArena.',
    type: 'website',
    url: 'https://nexarena-965928495929.asia-south1.run.app/',
    siteName: 'NexArena',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NexArena Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexArena — AI-Powered Smart Venue Assistant',
    description: 'Navigate large-scale sporting venues intelligently with NexArena.',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1629',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect for Firebase services */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        {/* DNS-prefetch hints for third-party domains */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://generativelanguage.googleapis.com" />
      </head>
      <body suppressHydrationWarning={true}>
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="skip-to-main"
        >
          Skip to main content
        </a>
        {/* Animated grid background */}
        <div className="arena-bg" aria-hidden="true" />
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
