import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAuth'
import { signupUser, clearError } from '../../store/authSlice'
import { Button, Input, Card, useToast } from '../../components/ui'

export const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const toast = useToast()
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      toast.success(`Welcome to CoopManager, ${user?.firstName || 'User'}!`)
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate, toast, user])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error, toast])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (!agreedToTerms) errors.terms = 'You must agree to the terms and conditions'

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Show first validation error as toast
      const firstError = Object.values(errors)[0]
      toast.error(firstError)
      return
    }

    const { firstName, lastName, email, password } = formData
    dispatch(signupUser({ firstName, lastName, email, password }))
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-2xl animate-fade-in">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-2xl animate-bounce-soft">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2 text-shadow">
            Join CoopManager
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Start your cooperative management journey today
          </p>
        </div>

        {/* Signup Form */}
        <Card className="glass-effect">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                type="text"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                error={validationErrors.firstName}
                icon={<User className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Last Name"
                type="text"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                error={validationErrors.lastName}
                icon={<User className="w-5 h-5" />}
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={validationErrors.email}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              icon={<Phone className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={validationErrors.password}
                hint="Must be at least 8 characters"
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
              />
              
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={validationErrors.confirmPassword}
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
                required
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 mt-1">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked)
                      if (validationErrors.terms) {
                        setValidationErrors(prev => ({ ...prev, terms: '' }))
                      }
                    }}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center
                    ${agreedToTerms 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300 group-hover:border-blue-400'
                    }
                  `}>
                    {agreedToTerms && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div className="ml-3">
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Privacy Policy
                    </Link>
                  </span>
                </div>
              </label>
              
              {validationErrors.terms && (
                <p className="text-sm text-red-600 ml-8">{validationErrors.terms}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 CoopManager. Empowering cooperative communities.
          </p>
        </div>
      </div>
    </div>
  )
}