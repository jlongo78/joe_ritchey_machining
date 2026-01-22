import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Card } from '@/components/common';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/account';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      success('Welcome Back!', 'You have been logged in successfully.');
      navigate(redirectUrl);
    } catch (err) {
      error('Login Failed', 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">PE</span>
              </div>
              <div className="text-left">
                <span className="block text-xl font-bold text-secondary-900">Precision Engine</span>
                <span className="block text-sm text-secondary-500">& Dyno, LLC</span>
              </div>
            </div>
          </Link>
        </div>

        <Card>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">Welcome Back</h1>
            <p className="text-secondary-500 mt-1">Sign in to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              placeholder="your@email.com"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                leftIcon={<Lock className="h-5 w-5" />}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-secondary-400 hover:text-secondary-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-secondary-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<LogIn className="h-5 w-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Don&apos;t have an account?{' '}
              <Link
                to={`/register${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Create Account
              </Link>
            </p>
          </div>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials</p>
          <p className="text-sm text-blue-700">
            Email: <span className="font-mono">demo@example.com</span>
          </p>
          <p className="text-sm text-blue-700">
            Password: <span className="font-mono">demo123</span>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-secondary-500 hover:text-secondary-700">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
