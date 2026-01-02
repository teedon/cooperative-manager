import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, TrendingUp, Shield, Smartphone, Download, 
  CheckCircle, ArrowRight, DollarSign, BarChart3,
  Clock, Lock, Globe, Zap, Heart, Award, Menu, X
} from 'lucide-react'
import { downloadsApi } from '../api/downloadsApi'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleDownload = (platform: 'android' | 'ios' | 'web') => {
    // Get the download URL and trigger download
    const downloadUrl = downloadsApi.downloadApp(platform)
    window.location.href = downloadUrl
  }

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Member Management',
      description: 'Easily manage cooperative members, roles, and permissions in one central platform.'
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Contribution Tracking',
      description: 'Track member contributions with flexible payment plans and automated schedules.'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Loan Management',
      description: 'Process loan requests, approvals, and repayments with complete transparency.'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Financial Reports',
      description: 'Generate comprehensive reports and export data in multiple formats.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Bank-level security with data encryption and regular backups.'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Mobile & Web Access',
      description: 'Access your cooperative from anywhere with our mobile and web apps.'
    }
  ]

  const benefits = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Save Time',
      description: 'Automate routine tasks and focus on growing your cooperative.'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Stay Organized',
      description: 'Keep all records, transactions, and documents in one place.'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Real-time Updates',
      description: 'Members get instant notifications for all activities.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Easy to Use',
      description: 'Intuitive interface designed for all levels of tech expertise.'
    }
  ]

  const testimonials = [
    {
      name: 'Adebayo Okonkwo',
      role: 'President, Unity Cooperative Society',
      content: 'This platform has transformed how we manage our cooperative. Everything is transparent and members can track their contributions in real-time.',
      avatar: '👨🏿‍💼'
    },
    {
      name: 'Chioma Nwosu',
      role: 'Financial Secretary, Progress Cooperative',
      content: 'The loan management feature is incredible. What used to take weeks now takes just a few clicks. Highly recommended!',
      avatar: '👩🏿‍💼'
    },
    {
      name: 'Ibrahim Musa',
      role: 'Member, Growth Cooperative',
      content: 'I love how I can check my balance, make contributions, and request loans from my phone. Very convenient!',
      avatar: '👨🏿'
    }
  ]

  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'Download the app, create an account, and either create a new cooperative or join an existing one using an invite code.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use bank-level encryption to protect your data. All transactions are secure and your information is backed up regularly.'
    },
    {
      question: 'Can I use this on mobile and web?',
      answer: 'Absolutely! Our platform works seamlessly on both mobile devices (Android/iOS) and web browsers.'
    },
    {
      question: 'How much does it cost?',
      answer: 'We offer flexible pricing plans based on your cooperative size. Contact us for a custom quote tailored to your needs.'
    },
    {
      question: 'Can I try before I buy?',
      answer: 'Yes! We offer a free trial period so you can explore all features before making a commitment.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CoopManager</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3">
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#benefits" 
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Benefits
                </a>
                <a 
                  href="#testimonials" 
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Testimonials
                </a>
                <a 
                  href="#faq" 
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </a>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/login')
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors font-medium text-left"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/signup')
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Trusted by 500+ Cooperatives
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Manage Your Cooperative With
                <span className="text-blue-600"> Confidence</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The all-in-one platform for cooperative management. Track contributions, process loans, 
                manage members, and generate reports - all from one powerful dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const element = document.getElementById('download')
                    element?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all flex items-center justify-center gap-2 text-lg font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Download App
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  14-day free trial
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Unity Cooperative</h3>
                        <p className="text-sm text-gray-500">142 members</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Total Contributions</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">₦12,450,000</p>
                      <p className="text-xs text-green-600 mt-1">+15% this month</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs text-blue-600 mb-1">Active Loans</p>
                        <p className="text-xl font-bold text-blue-900">23</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-xs text-purple-600 mb-1">Pending Requests</p>
                        <p className="text-xl font-bold text-purple-900">7</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full opacity-50 blur-2xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to simplify cooperative management and empower your members.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Cooperatives Choose CoopManager
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join hundreds of cooperatives that have transformed their operations with our platform.
              </p>
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="Team collaboration"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">4.9/5</p>
                    <p className="text-sm text-gray-600">User Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Cooperative Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users have to say about their experience.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Download className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Download CoopManager Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get started in minutes. Available for web, iOS, and Android.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button 
              onClick={() => handleDownload('android')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <Smartphone className="w-5 h-5" />
              Download for Android
            </button>
            <button 
              onClick={() => handleDownload('ios')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <Smartphone className="w-5 h-5" />
              Download for iOS
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-lg font-semibold"
            >
              Use Web Version
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Free 14-day trial • No credit card required
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about CoopManager.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow group"
              >
                <summary className="font-semibold text-gray-900 cursor-pointer flex justify-between items-center">
                  {faq.question}
                  <ArrowRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-gray-600 mt-4 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Cooperative?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of cooperatives already using CoopManager to streamline their operations.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-xl flex items-center justify-center gap-2 text-lg font-semibold mx-auto"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">CoopManager</span>
              </div>
              <p className="text-sm">
                The modern way to manage your cooperative society.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">Download</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 CoopManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
