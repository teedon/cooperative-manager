import React from 'react';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 4, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit our website. They are widely used to make websites work more efficiently and provide information to website owners.
            </p>
            <p className="text-gray-700 mb-4">
              CoopManager uses cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Strictly Necessary Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are essential for the website to function properly. They enable core functionality such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>User authentication and account management</li>
              <li>Session management</li>
              <li>Security features</li>
              <li>Load balancing</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>These cookies cannot be disabled</strong> as they are necessary for the service to function.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Performance and Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies collect information about how visitors use our website, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Pages visited and time spent on each page</li>
              <li>Links clicked and features used</li>
              <li>Error messages encountered</li>
              <li>Device and browser information</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Examples:</strong> Google Analytics, Mixpanel
            </p>
            <p className="text-gray-700 mb-4">
              These cookies help us improve the website's performance and user experience. The information collected is aggregated and anonymous.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Functionality Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies enable the website to remember choices you make and provide enhanced features:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Your preferred language and region</li>
              <li>Display preferences (theme, layout)</li>
              <li>Previously entered form data</li>
              <li>Cooperative dashboard customizations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Targeting and Advertising Cookies</h3>
            <p className="text-gray-700 mb-4">
              Currently, we do not use advertising cookies. If this changes in the future, we will update this policy and seek your consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cookie Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">auth_token</td>
                    <td className="px-6 py-4 text-sm text-gray-700">User authentication</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Necessary</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">session_id</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Session management</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Necessary</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Session</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">cookie_consent</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Remember cookie preferences</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Necessary</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">_ga</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Google Analytics - distinguish users</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Analytics</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">_gid</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Google Analytics - distinguish users</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Analytics</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">24 hours</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">user_preferences</td>
                    <td className="px-6 py-4 text-sm text-gray-700">Store user preferences and settings</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Functionality</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">6 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use certain third-party services that may set their own cookies. These services include:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Google Analytics</h3>
            <p className="text-gray-700 mb-4">
              We use Google Analytics to analyze website usage and improve our services. Google Analytics uses cookies to collect information about how visitors use our site. This information is used to compile reports and help us improve the site.
            </p>
            <p className="text-gray-700 mb-4">
              <a href="https://policies.google.com/privacy" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                Google Privacy Policy
              </a>
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Firebase</h3>
            <p className="text-gray-700 mb-4">
              Our mobile app uses Firebase for push notifications and crash reporting. Firebase may use cookies and similar technologies.
            </p>
            <p className="text-gray-700 mb-4">
              <a href="https://firebase.google.com/support/privacy" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                Firebase Privacy Policy
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Local Storage and Similar Technologies</h2>
            <p className="text-gray-700 mb-4">
              In addition to cookies, we use browser local storage and session storage to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Store authentication tokens securely</li>
              <li>Cache frequently accessed data for better performance</li>
              <li>Save draft forms and user inputs</li>
              <li>Maintain application state</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Local storage data remains on your device until you clear your browser data or until the app removes it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Managing Your Cookie Preferences</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Cookie Consent Banner</h3>
            <p className="text-gray-700 mb-4">
              When you first visit our website, you'll see a cookie consent banner. You can choose to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Accept All:</strong> Allow all cookies</li>
              <li><strong>Reject Non-Essential:</strong> Only allow necessary cookies</li>
              <li><strong>Customize:</strong> Choose which categories of cookies to accept</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Block all cookies</li>
              <li>Delete existing cookies</li>
              <li>Allow cookies from specific sites only</li>
              <li>Enable "Do Not Track" settings</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Note:</strong> Blocking or deleting cookies may affect your ability to use certain features of the website.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Browser-Specific Instructions:</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Opt-Out of Google Analytics</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of Google Analytics by installing the{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Mobile App</h2>
            <p className="text-gray-700 mb-4">
              Our mobile application uses similar technologies to cookies, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Device identifiers</li>
              <li>Local data storage</li>
              <li>Push notification tokens</li>
              <li>Analytics SDKs</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You can manage these preferences in your device settings under the app permissions section.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Updates to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of significant changes by posting a notice on our website or through the app.
            </p>
            <p className="text-gray-700 mb-4">
              The "Last updated" date at the top of this policy indicates when it was last revised.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
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

export default CookiePolicyPage;
