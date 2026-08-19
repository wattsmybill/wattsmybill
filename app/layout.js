import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AD_CLIENT, adsEnabled } from "./lib/ads";
import "./globals.css";
import { THEME_BOOTSTRAP_SCRIPT } from "./lib/theme";
import { LAUNCH_SCREEN_SCRIPT } from "./lib/launchScreen";
import BottomTabs from "./components/BottomTabs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://www.wattsmybill.app";
const siteName = "Watts My Bill?";
const appName = "Watts My Bill";
const siteDescription =
  "Estimate and understand your electricity bill using appliance usage, your local rate, fixed charges, and practical worldwide electricity guides.";

const ogImage = `${siteUrl}/og-image-final.jpg`;
const logoUrl = `${siteUrl}/icon-512-v2.png`;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f1" },
    { media: "(prefers-color-scheme: dark)", color: "#06142b" },
  ],
};

export const metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: appName,
  manifest: "/site.webmanifest",
  category: "Utility",

  title: {
    default: "Watts My Bill? | Estimate & Understand Your Electricity Bill",
    template: `%s | ${siteName}`,
  },

  description: siteDescription,

  keywords: [
    "Watts My Bill",
    "electricity bill estimator",
    "electricity bill calculator",
    "electricity usage calculator",
    "appliance wattage calculator",
    "appliance energy cost calculator",
    "kWh calculator",
    "energy usage calculator",
    "power consumption calculator",
    "electricity cost calculator",
    "energy bill calculator",
    "home energy audit",
    "home energy audit report",
    "household electricity estimator",
    "monthly electric bill estimate",
    "watts calculator",
    "how to calculate electricity bill",
    "how much does it cost to run appliances",
    "why is my electricity bill high",
    "how to save energy",
    "understand electricity bill",
    "aircon wattage",
    "gaming pc wattage",
  ],

  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,

  alternates: {
    canonical: siteUrl,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    title: "Watts My Bill? | Estimate & Understand Your Electricity Bill",
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Watts My Bill? app shown on laptop and phone with the message Understand. Estimate. Save.",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Watts My Bill? | Estimate & Understand Your Electricity Bill",
    description: siteDescription,
    images: [ogImage],
  },

  // Icon filenames carry a version suffix deliberately. Vercel serves files from
  // public/ with max-age=14400, so replacing the bytes at a stable URL left
  // browsers showing the previous artwork for hours — and an installed PWA kept
  // whatever it had at install time indefinitely. Changing the URL is the only
  // thing a cache cannot ignore. Bump the suffix whenever the artwork changes.
  icons: {
    icon: [
      {
        url: "/favicon-v2.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        url: "/favicon-32x32-v2.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16-v2.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/icon-192-v2.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512-v2.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: "/favicon-v2.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon-v2.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteName,
    alternateName: [appName, "WattsMyBill"],
    url: siteUrl,
    inLanguage: "en",
    publisher: { "@id": `${siteUrl}/#organization` },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${siteUrl}/#webapp`,
    name: siteName,
    url: siteUrl,
    image: ogImage,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    inLanguage: "en",
    isAccessibleForFree: true,
    description:
      "A free electricity bill estimator and learning hub that helps users understand appliance energy costs, local electricity rates, fixed charges, and household usage.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    isPartOf: { "@id": `${siteUrl}/#website` },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 512,
      height: 512,
    },
  },
];

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The bootstrap script below sets data-wmb-theme and color-scheme on this
      // element before React hydrates, which is the whole point of it. React
      // must be told those attributes are expected to differ from the server
      // render rather than treating them as a mismatch.
      suppressHydrationWarning
    >
      <head>
        {/* Resolves the theme before first paint. Must stay ahead of the React
            bundle: restoring it after hydration is what made every Learning Hub
            navigation flash white for dark-mode readers. */}
        <script
          id="watts-my-bill-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <script
          id="watts-my-bill-launch-screen"
          dangerouslySetInnerHTML={{ __html: LAUNCH_SCREEN_SCRIPT }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Watts My Bill" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#06142b" />
        <script
          id="watts-my-bill-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      <body className="min-h-full flex flex-col">
        {/* Launch screen for the installed app. Plain markup rather than a
            component so it is in the very first HTML the device paints — a
            React-rendered version could only appear after hydration, which is
            exactly the gap it exists to cover. Styles and dismissal live in
            globals.css; see the launch-screen block there. */}
        <div id="wmb-splash" aria-hidden="true">
          {/* The mark is drawn rather than shown as an image, so its own lines
              can animate: the white hook draws first, the bolt follows out of
              where the hook ends, and the dot lands last. Geometry was traced
              from the app icon artwork, so this is the real logo and not
              an approximation of it — see the launch-screen notes in
              globals.css before editing any coordinate here.

              A dim copy of the finished mark sits underneath. The system splash
              has just shown the complete logo, and starting from an empty frame
              would read as the app resetting; drawing bright lines over a ghost
              reads as the logo coming up to power instead. */}
          {/* The tile is here to match the system splash, which always shows the
              tiled icon: Chrome draws that splash from the *maskable* icon and
              ignores any "any" icon offered alongside it, so the handoff can
              only be smoothed from this side. It starts identical to what the
              splash just showed, then dissolves away while the mark draws,
              finishing on the untiled logo. */}
          <svg className="wmb-splash-mark" viewBox="0 0 512 512" role="presentation">
            <defs>
              {/* Must stay identical to the ground in the app icon, since the
                  system splash draws that icon immediately before this. */}
              <linearGradient id="wmbSplashTile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0d7d76" />
                <stop offset="60%" stopColor="#0a3347" />
                <stop offset="100%" stopColor="#06142b" />
              </linearGradient>
            </defs>

            <rect
              className="wmb-mark-tile"
              width="512"
              height="512"
              rx="115"
              fill="url(#wmbSplashTile)"
            />

            <g className="wmb-mark-ghost">
              <path d="M212 360 C214 324 196 292 179.4 272.8 A107.5 107.5 0 1 1 356 190.5" />
              <path className="wmb-mark-bolt-shape" d="M356 197 L300 270 L362 283 L288 370" />
              <circle cx="251.5" cy="432" r="24" />
            </g>

            <path
              className="wmb-mark-arc"
              pathLength="100"
              d="M212 360 C214 324 196 292 179.4 272.8 A107.5 107.5 0 1 1 356 190.5"
            />
            <path
              className="wmb-mark-bolt"
              pathLength="100"
              d="M356 197 L300 270 L362 283 L288 370"
            />
            <circle className="wmb-mark-dot" cx="251.5" cy="432" r="24" />
          </svg>
        </div>

        {adsEnabled && (
          <Script
            id="adsbygoogle"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BVVJPKW2ZT"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BVVJPKW2ZT');
          `}
        </Script>

        {children}

        <BottomTabs />
      </body>
    </html>
  );
}
