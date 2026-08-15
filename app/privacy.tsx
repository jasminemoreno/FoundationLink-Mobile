import LegalDocPage from "../components/LegalDocPage";

const sections = [
  {
    heading: "1. Information We Collect",
    body: "When you register or use FoundationLink, we collect information you provide directly, such as your name, email, phone number, address, gender, and birthdate (for donors), or your foundation's name, description, address, and verification documents (for foundation admins). We also record donation details you submit, such as amount, item descriptions, and delivery preferences.",
  },
  {
    heading: "2. How We Use Your Information",
    body: "Your information is used to operate your account, process and display donations, verify foundation legitimacy, send relevant notifications (such as campaign updates from foundations you follow), and improve the platform.",
  },
  {
    heading: "3. Sharing of Information",
    body: "Donor information relevant to a specific donation (such as name and contact details) is shared with the foundation receiving that donation, so they can confirm receipt and arrange delivery or payment. We do not sell personal information to third parties.",
  },
  {
    heading: "4. Foundation Verification Documents",
    body: "Identity and legitimacy documents submitted during foundation verification are used solely for review by our administrators and are not made public or shared outside the verification process.",
  },
  {
    heading: "5. Data Storage and Security",
    body: "We take reasonable measures to protect your information from unauthorized access. Passwords are stored securely and are never visible to administrators or other users.",
  },
  {
    heading: "6. Your Choices",
    body: "You can update most of your personal information from your Profile page. Email addresses cannot be changed once registered, as they serve as your account identifier.",
  },
  {
    heading: "7. Changes to This Policy",
    body: "This policy may be updated from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised policy.",
  },
  {
    heading: "8. Contact",
    body: "Questions about this Privacy Policy can be sent to",
    link: {
      text: "support@foundationlink.com",
      href: "mailto:support@foundationlink.com",
    },
  },
];

export default function PrivacyScreen() {
  return <LegalDocPage title="Privacy Policy" sections={sections} />;
}
