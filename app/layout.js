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
    "Watts My Bill? is an electricity usage calculator that helps you estimate monthly energy costs, understand appliance consumption, and make smarter electricity decisions.",

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
  ],

  authors: [{ name: "Watts My Bill?" }],
  creator: "Watts My Bill?",
  publisher: "Watts My Bill?",

  openGraph: {
    title: "Watts My Bill? | Electricity Usage Calculator",
    description:
      "Estimate monthly energy costs, understand appliance consumption, and make smarter electricity decisions.",
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
      "Estimate monthly energy costs, understand appliance consumption, and make smarter electricity decisions.",
    images: ["/og-image-2.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
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