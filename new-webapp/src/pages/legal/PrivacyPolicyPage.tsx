import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 4, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to CoopManager ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our cooperative management platform, including both our web application and mobile application.
            </p>
            <p className="text-gray-700 mb-4">
              By using CoopManager, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">We collect personal information that you voluntarily provide to us when you:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Register for an account (name, email address, phone number)</li>
              <li>Create or join a cooperative</li>
              <li>Make contributions or payments</li>
              <li>Apply for loans</li>
              <li>Participate in group buys</li>
              <li>Contact our support team</li>
              <li>Update your profile information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Financial Information</h3>
            <p className="text-gray-700 mb-4">
              We collect financial information necessary to process transactions, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Payment verification details</li>
              <li>Transaction records</li>
              <li>Contribution history</li>
              <li>Loan applications and repayment records</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Technical Information</h3>
            <p className="text-gray-700 mb-4">
              We automatically collect certain information when you use our services:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Device information (type, operating system, unique device identifiers)</li>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Log data and crash reports</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Cookies and Similar Technologies</h3>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. See our Cookie Policy for more details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use the collected information for various purposes:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To process your transactions and manage your contributions</li>
              <li>To verify your identity and prevent fraud</li>
              <li>To communicate with you about your account and transactions</li>
              <li>To send you important updates, security alerts, and support messages</li>
              <li>To provide customer support and respond to your inquiries</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To comply with legal obligations and enforce our terms</li>
              <li>To detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">We may share your information in the following situations:</p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Within Your Cooperative</h3>
            <p className="text-gray-700 mb-4">
              Your information may be visible to other members of your cooperative based on the cooperative's privacy settings and your role. Administrators may have access to member financial information for cooperative management purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We may share your information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Payment processors</li>
              <li>Cloud hosting providers</li>
              <li>Analytics services</li>
              <li>Customer support tools</li>
              <li>Email and communication services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, subpoenas, or legal processes).
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-700 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
            <p className="text-gray-700 mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. Financial records may be retained for up to 7 years for tax and regulatory compliance purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To exercise these rights, please contact us using the information provided at the end of this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and maintained on servers located outside of your country where data protection laws may differ. By using our services, you consent to the transfer of your information to these locations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We will also notify you via email or through a prominent notice in our application for significant changes.
            </p>
            <p className="text-gray-700 mb-4">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@coopmanager.com</p>
              <p className="text-gray-700"><strong>Address:</strong> CoopManager Privacy Team</p>
              <p className="text-gray-700 ml-16">123 Cooperative Street</p>
              <p className="text-gray-700 ml-16">Lagos, Nigeria</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
