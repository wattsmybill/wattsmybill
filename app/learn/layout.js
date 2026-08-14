const siteUrl = "https://www.wattsmybill.app";

export const metadata = {
  title: "Electricity Learning Hub",
  description:
    "Clear worldwide guides for understanding electricity bills, rates, appliance running costs, high usage, time-of-use tariffs, saving energy, and solar billing.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Electricity Learning Hub | Watts My Bill?",
    description:
      "Practical, source-linked answers to everyday electricity questions, written for a worldwide audience.",
    url: `${siteUrl}/learn`,
    type: "website",
    images: [{ url: `${siteUrl}/og-image-final.jpg`, width: 1200, height: 630, alt: "Watts My Bill? electricity calculator and learning hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Electricity Learning Hub | Watts My Bill?",
    description: "Practical, source-linked answers to everyday electricity questions, written for a worldwide audience.",
    images: [`${siteUrl}/og-image-final.jpg`],
  },
};

export default function LearnLayout({ children }) {
  return children;
}
