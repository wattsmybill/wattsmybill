/**
 * The About, Privacy, Terms, Disclaimer and Contact copy.
 *
 * Extracted from the calculator so the in-app panel and the standalone /privacy
 * page cannot drift apart. A policy that says two different things in two
 * places is worse than one that lives in a single awkward spot.
 */
export const INFO_SECTIONS = [
  {
    id: "about",
    title: "About Watts My Bill?",
    description:
      "Watts My Bill? is a free electricity calculator that helps users estimate monthly electricity costs based on appliance wattage, quantity, usage hours, days per month, and electricity rate. It is built to help everyday users understand how appliances may affect their bill."
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description:
      "Watts My Bill? stores your calculator inputs locally in your browser using localStorage so your session can be restored when you revisit the page. Calculator inputs stay on your device and are not sent to our server by the calculator. We use Google Analytics to understand general site traffic and usage. Google Analytics may use cookies or similar technologies and process information such as device, browser, and interaction data. This site may also show advertising supplied by Google. Third-party vendors including Google use cookies to serve ads based on your prior visits to this or other websites, and Google's use of advertising cookies enables it and its partners to serve ads based on your visits here. You can opt out of personalised advertising through Google Ads Settings at https://adssettings.google.com. Do not enter sensitive personal or billing information into the calculator or report fields."
  },
  {
    id: "terms",
    title: "Terms of Use",
    description:
      "By using Watts My Bill?, you understand that the tool provides estimates for learning and personal budgeting only. Please still check your actual utility bill, electricity rate, and appliance label before making financial or household decisions."
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    description:
      "Watts My Bill? is not an electricity provider and is not connected to any utility company. Results are estimates only. Actual electric bills may include electricity supply charges, delivery charges, service fees, VAT/taxes, fuel adjustments, and other provider charges. Watts My Bill? is an electricity bill usage calculator that helps estimate monthly electricity costs based on appliance wattage, quantity, usage hours, days per month, and electricity provider rates."
  },
  {
    id: "contact",
    title: "Contact",
    description:
      "For questions, feedback, corrections, or suggestions, you can contact Watts My Bill? at hello@wattsmybill.app. Please avoid sending account numbers, billing references, exact addresses, or other sensitive personal billing information."
  }
];
