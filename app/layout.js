import { Geist, Geist_Mono } from "next/font/google";
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
    "Watts My Bill? is an electricity usage calculator that helps estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity rates.",

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
      "Estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity rates.",
    url: "https://wattsmybill.app",
    siteName: "Watts My Bill?",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
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
      "Estimate monthly electricity costs based on appliance wattage, usage hours, quantity, and electricity rates.",
    images: ["/og-image.jpg"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
