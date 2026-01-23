import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, Card } from '@/components/common';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth();
  const { success, error } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/account';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      success('Account Created!', 'Welcome to Precision Engine & Dyno!');
      navigate(redirectUrl);
    } catch (err) {
      error('Registration Failed', 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">PE</span>
              </div>
              <div className="text-left">
                <span className="block text-xl font-bold text-chrome-100">Precision Engine</span>
                <span className="block text-sm text-chrome-400">& Dyno, LLC</span>
              </div>
            </div>
          </Link>
        </div>

        <Card>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-chrome-100">Create Account</h1>
            <p className="text-chrome-400 mt-1">Join us for the best in performance parts & services</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register('firstName')}
                error={errors.firstName?.message}
                leftIcon={<User className="h-5 w-5" />}
                placeholder="John"
              />
              <Input
                label="Last Name"
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="Doe"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              placeholder="your@email.com"
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              leftIcon={<Phone className="h-5 w-5" />}
              placeholder="(555) 123-4567"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                leftIcon={<Lock className="h-5 w-5" />}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-chrome-400 hover:text-chrome-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock className="h-5 w-5" />}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-chrome-400 hover:text-chrome-200"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-1 h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm text-chrome-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="h-5 w-5" />}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-chrome-300">
              Already have an account?{' '}
              <Link
                to={`/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </Card>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-chrome-900 rounded-lg border border-chrome-700 text-center">
            <p className="text-sm font-medium text-chrome-100">Track Orders</p>
            <p className="text-xs text-chrome-400 mt-1">Monitor your parts orders in real-time</p>
          </div>
          <div className="p-4 bg-chrome-900 rounded-lg border border-chrome-700 text-center">
            <p className="text-sm font-medium text-chrome-100">Job Status</p>
            <p className="text-xs text-chrome-400 mt-1">View progress on machining jobs</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-chrome-400 hover:text-chrome-200">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
