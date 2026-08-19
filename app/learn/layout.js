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
  },
  twitter: {
    card: "summary_large_image",
    title: "Electricity Learning Hub | Watts My Bill?",
    description: "Practical, source-linked answers to everyday electricity questions, written for a worldwide audience.",
  },
};

export default function LearnLayout({ children }) {
  return children;
}
