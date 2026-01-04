import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 4, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using CoopManager ("Service," "Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p className="text-gray-700 mb-4">
              These Terms apply to all visitors, users, and others who access or use the Service, including both the web application and mobile application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              CoopManager is a comprehensive cooperative management platform that enables users to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Create and manage cooperative societies</li>
              <li>Track member contributions and savings</li>
              <li>Manage loans and repayments</li>
              <li>Organize group buying opportunities</li>
              <li>Monitor financial transactions and ledgers</li>
              <li>Generate reports and analytics</li>
              <li>Communicate with cooperative members</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Registration</h3>
            <p className="text-gray-700 mb-4">
              To use certain features of the Service, you must register for an account. When you register, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password</li>
              <li>Accept all risks of unauthorized access to your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Responsibilities</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for all activities that occur under your account. You must not:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Share your account credentials with others</li>
              <li>Use another person's account without permission</li>
              <li>Create multiple accounts for fraudulent purposes</li>
              <li>Impersonate another person or entity</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, illegal, or harmful activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cooperative Management</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Creating Cooperatives</h3>
            <p className="text-gray-700 mb-4">
              Users can create and manage cooperative societies on the Platform. As a cooperative administrator, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Comply with all applicable laws and regulations</li>
              <li>Maintain accurate financial records</li>
              <li>Respect member rights and privacy</li>
              <li>Use the Platform ethically and responsibly</li>
              <li>Ensure proper authorization for financial transactions</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Member Responsibilities</h3>
            <p className="text-gray-700 mb-4">
              As a cooperative member, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Make timely contributions as agreed</li>
              <li>Provide accurate financial information</li>
              <li>Respect other members and cooperative rules</li>
              <li>Report suspicious or fraudulent activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Financial Transactions</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Payment Processing</h3>
            <p className="text-gray-700 mb-4">
              The Platform facilitates tracking and verification of financial transactions. However:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>We do not directly process payments or hold funds</li>
              <li>Cooperatives are responsible for their own banking arrangements</li>
              <li>Members should verify payment details before making contributions</li>
              <li>All financial transactions are subject to cooperative approval</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Transaction Disputes</h3>
            <p className="text-gray-700 mb-4">
              Disputes regarding contributions, loans, or other financial matters should be resolved within the cooperative. We provide tools for record-keeping but are not responsible for mediating financial disputes.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Loans</h3>
            <p className="text-gray-700 mb-4">
              Loan terms and conditions are set by individual cooperatives. We do not guarantee loan approval or repayment. Members must comply with loan agreements made within their cooperative.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Use the Service for any illegal purpose or to violate any laws</li>
              <li>Engage in fraudulent activities or money laundering</li>
              <li>Upload viruses, malware, or malicious code</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service's functionality</li>
              <li>Harvest or collect user information without consent</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Misrepresent your affiliation with any person or entity</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Our Property</h3>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by CoopManager and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you create on the Platform. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content as necessary to provide the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Trademarks</h3>
            <p className="text-gray-700 mb-4">
              CoopManager and related logos are trademarks of our company. You may not use these trademarks without our prior written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitation of Liability</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.1 Service "As Is"</h3>
            <p className="text-gray-700 mb-4">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Accuracy or reliability of information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.2 Financial Disclaimer</h3>
            <p className="text-gray-700 mb-4">
              We are not a financial institution and do not provide financial advice. The Platform is a tool for cooperative management only. Users should:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Conduct their own due diligence before making financial decisions</li>
              <li>Consult with qualified financial advisors as needed</li>
              <li>Verify all financial information independently</li>
              <li>Understand the risks associated with cooperative membership</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">8.3 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, CoopManager and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Your use or inability to use the Service</li>
              <li>Unauthorized access to your account or data</li>
              <li>Financial losses incurred through cooperative activities</li>
              <li>Errors or omissions in the Service</li>
              <li>Actions of third parties or other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless CoopManager and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your cooperative management activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications to Service</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through a prominent notice on the Platform. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions. Any disputes arising from these Terms or use of the Service shall be subject to the exclusive jurisdiction of the courts of Lagos, Nigeria.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Severability</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> legal@coopmanager.com</p>
              <p className="text-gray-700"><strong>Address:</strong> CoopManager Legal Department</p>
              <p className="text-gray-700 ml-16">123 Cooperative Street</p>
              <p className="text-gray-700 ml-16">Lagos, Nigeria</p>
            </div>
          </section>

          <section className="mb-8">
            <p className="text-gray-700 italic">
              By using CoopManager, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
