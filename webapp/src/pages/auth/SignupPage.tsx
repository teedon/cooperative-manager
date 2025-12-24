import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { signup, clearError } from '@/store/slices/authSlice';
import { Button, Input, Card, CardBody } from '@/components/common';

const SignupPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state: any) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    dispatch(signup({ firstName, lastName, email, password }));
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background] py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-[--color-primary-main] tracking-tight">
            Cooperative Manager
          </h1>
          <p className="text-[--color-text-secondary] text-base">
            Create your account
          </p>
        </div>

        <Card className="p-0 shadow-lg border border-[--color-border-light]">
          <CardBody className="space-y-7 p-8">
            {displayError && (
              <div className="p-3 rounded-lg bg-[--color-error-light] text-[--color-error-main] text-sm">
                {displayError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-2">
                <Input
                  label="First Name"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  icon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Last Name"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                icon={<Phone className="w-5 h-5" />}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                  hint="Must be at least 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-[--color-text-secondary] hover:text-[--color-primary-main]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
              />

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-[--color-border-main] text-[--color-primary-main] focus:ring-[--color-primary-main]"
                  required
                />
                <label
                  htmlFor="terms"
                  className="ml-2 text-sm text-[--color-text-secondary]"
                >
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="text-[--color-primary-main] hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="text-[--color-primary-main] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[--color-border-light]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[--color-surface] text-[--color-text-secondary]">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link to="/login">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
