import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
  "Estimate your monthly electricity bill by adding appliances, usage hours, and electricity rates. Watts My Bill helps you understand your energy cost.";

const ogImage = `${siteUrl}/og-image-final.jpg`;
const logoUrl = `${siteUrl}/android-chrome-512x512.png`;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/apple-touch-icon.png",
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
      "A free electricity bill estimator that helps users estimate appliance energy costs using wattage, hours, quantity, electricity rates, and household presets.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
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
    >
      <head>
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
      </body>
    </html>
  );
}