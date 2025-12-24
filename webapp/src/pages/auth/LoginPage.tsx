import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { login, clearError } from '@/store/slices/authSlice';
import { Button, Input, Card, CardBody } from '@/components/common';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-background] py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-[--color-primary-main] tracking-tight">
            Cooperative Manager
          </h1>
          <p className="text-[--color-text-secondary] text-base">
            Sign in to your account
          </p>
        </div>

        <Card className="p-0 shadow-lg border border-[--color-border-light]">
          <CardBody className="space-y-7 p-8">
            {error && (
              <div className="p-3 rounded-lg bg-[--color-error-light] text-[--color-error-main] text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  icon={<Lock className="w-5 h-5" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-[--color-text-secondary] hover:text-[--color-text-primary]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[--color-border-main] text-[--color-primary-main] focus:ring-[--color-primary-main]"
                  />
                  <span className="ml-2 text-sm text-[--color-text-secondary]">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-[--color-primary-main] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[--color-border-light]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[--color-surface] text-[--color-text-secondary]">
                  New to Cooperative Manager?
                </span>
              </div>
            </div>

            <Link to="/signup">
              <Button variant="outline" className="w-full">
                Create an Account
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
