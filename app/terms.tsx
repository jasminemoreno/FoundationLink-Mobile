import LegalDocPage from "../components/LegalDocPage";

const sections = [
  {
    heading: "1. Acceptance of Terms",
    body: "By creating an account or using FoundationLink, you agree to these Terms of Service. If you do not agree, please do not use the platform.",
  },
  {
    heading: "2. What FoundationLink Does",
    body: "FoundationLink is a platform that connects donors with verified foundations and their campaigns. We facilitate the recording and tracking of monetary and item donations. FoundationLink does not directly process or hold donated funds — payment arrangements for monetary donations are made directly between donors and foundations through the payment details each foundation provides.",
  },
  {
    heading: "3. Account Responsibilities",
    body: "You are responsible for keeping your account credentials secure and for the accuracy of the information you provide. Donors must be truthful about donation details; foundation admins must be truthful about their organization's identity and the campaigns they create.",
  },
  {
    heading: "4. Foundation Verification",
    body: "Foundations undergo a verification process before they can create campaigns or receive donations. Verification confirms the information and documents submitted were reviewed by our administrators, but FoundationLink cannot guarantee the ongoing conduct of any foundation after verification.",
  },
  {
    heading: "5. Donations",
    body: "All donations made through the platform are voluntary and, once submitted, are generally non-refundable. Cancellation or refund of a donation is at the discretion of the receiving foundation. FoundationLink is not responsible for how a foundation ultimately uses donated funds or items beyond what is disclosed on the campaign.",
  },
  {
    heading: "6. Prohibited Conduct",
    body: "Users may not use FoundationLink for fraudulent campaigns, misrepresentation of organizational identity, harassment, or any activity that violates applicable laws. FoundationLink reserves the right to suspend or terminate accounts that violate these terms.",
  },
  {
    heading: "7. Changes to These Terms",
    body: "These terms may be updated from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    heading: "8. Contact",
    body: "Questions about these Terms can be sent to",
    link: {
      text: "support@foundationlink.com",
      href: "mailto:support@foundationlink.com",
    },
  },
];

export default function TermsScreen() {
  return <LegalDocPage title="Terms of Service" sections={sections} />;
}
