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

export const metadata = {
  metadataBase: new URL("https://wattsmybill.app"),

  title: {
    default: "Watts My Bill? | Electricity Usage Calculator",
    template: "%s | Watts My Bill?",
  },

  description:
    "Your friendly tool for understanding electricity bills. Estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity provider rates.",

  keywords: [
    "Watts My Bill",
    "electricity usage calculator",
    "electricity bill calculator",
    "electricity bill usage calculator",
    "electric bill estimator",
    "appliance wattage calculator",
    "kWh calculator",
    "energy usage calculator",
    "power consumption calculator",
    "monthly electric bill estimate",
    "whats my bill",
    "electrical wattage",
    "electrical consumption",
    "how to know wattage consumption",
    "energy bill",
    "how to save energy",
    "energy",
    "watts",
    "power",
  ],

  authors: [{ name: "Watts My Bill?" }],
  creator: "Watts My Bill?",
  publisher: "Watts My Bill?",

  alternates: {
    canonical: "https://wattsmybill.app",
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
    title: "Watts My Bill? | Electricity Usage Calculator",
    description:
      "Your friendly tool for understanding electricity bills. Estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity provider rates.",
    url: "https://wattsmybill.app",
    siteName: "Watts My Bill?",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image-2.jpg",
        width: 1200,
        height: 630,
        alt: "Watts My Bill? electricity usage calculator",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Watts My Bill? | Electricity Usage Calculator",
    description:
      "Your friendly tool for understanding electricity bills. Estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity provider rates.",
    images: ["/og-image-2.jpg"],
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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