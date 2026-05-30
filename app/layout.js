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
const ogImage = `${siteUrl}/og-image-4.jpg`;

export const metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: siteName,
  category: "Utility",

  title: {
    default: "Watts My Bill? | Understand Your Electricity Bill",
    template: `%s | ${siteName}`,
  },

  description:
    "Understand your electricity bill with a free appliance wattage calculator. Estimate monthly costs, compare usage, try household presets, and generate a simple energy audit report.",

  keywords: [
    "Watts My Bill",
    "electricity bill estimator",
    "electricity usage calculator",
    "electricity bill calculator",
    "appliance wattage calculator",
    "kWh calculator",
    "energy usage calculator",
    "power consumption calculator",
    "home energy audit report",
    "household electricity estimator",
    "monthly electric bill estimate",
    "appliance energy cost calculator",
    "watts calculator",
    "electricity cost calculator",
    "energy bill calculator",
    "how to calculate electricity bill",
    "how to save energy",
    "Why is my electricity bill high?",
    "understand electricity",
    "aircon wattage",
    "gaming pc wattage",
    "electricity",
    "wattage:",
    "how much does it cost to run appliances",
    "appliance wattage calculator"
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
    title: "Watts My Bill? | Understand Your Electricity Bill",
    description:
      "Estimate appliance energy costs, compare usage, try household presets, and generate a simple energy audit report.",
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Watts My Bill? Understand Your Electricity Bill",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Watts My Bill? | Understand Your Electricity Bill",
    description:
      "Understand your electricity bill with a free appliance wattage calculator, household presets, and an energy usage report.",
    images: [ogImage],
  },

  icons: {
    icon: [
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
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
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
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
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