import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie_consent', 'all');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  const handleRejectNonEssential = () => {
    localStorage.setItem('cookie_consent', 'essential');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    if (onReject) onReject();
  };

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pb-2 sm:pb-5">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="p-4 rounded-lg bg-white shadow-2xl border-2 border-gray-200">
          <div className="flex flex-col space-y-4">
            {/* Main message */}
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  We value your privacy
                </h3>
                <div className="mt-2 text-sm text-gray-700">
                  <p>
                    We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. 
                    By clicking "Accept All", you consent to our use of cookies.
                  </p>
                  {showDetails && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="essential"
                          checked
                          disabled
                          className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="essential" className="ml-2">
                          <span className="font-medium text-gray-900">Strictly Necessary Cookies</span>
                          <p className="text-xs text-gray-600">Required for the website to function. Cannot be disabled.</p>
                        </label>
                      </div>
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="analytics"
                          defaultChecked
                          className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="analytics" className="ml-2">
                          <span className="font-medium text-gray-900">Performance & Analytics</span>
                          <p className="text-xs text-gray-600">Help us understand how visitors use our website.</p>
                        </label>
                      </div>
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="functionality"
                          defaultChecked
                          className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="functionality" className="ml-2">
                          <span className="font-medium text-gray-900">Functionality Cookies</span>
                          <p className="text-xs text-gray-600">Remember your preferences and settings.</p>
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Link to="/privacy-policy" className="text-indigo-600 hover:text-indigo-800 underline">
                      Privacy Policy
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link to="/cookie-policy" className="text-indigo-600 hover:text-indigo-800 underline">
                      Cookie Policy
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link to="/terms-of-service" className="text-indigo-600 hover:text-indigo-800 underline">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleAcceptAll}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Accept All
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleCustomize}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showDetails ? 'Hide' : 'Customize'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
