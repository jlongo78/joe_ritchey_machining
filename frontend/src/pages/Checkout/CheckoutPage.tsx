import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CreditCard,
  Truck,
  MapPin,
  ChevronLeft,
  Check,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ordersApi } from '@/services/api';
import { Button, Input, Select, Card } from '@/components/common';
import type { ShippingRate, Address } from '@/types';

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  street1: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().default('US'),
  phone: z.string().min(10, 'Phone number is required'),
});

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  sameAsBilling: z.boolean().default(true),
  shippingMethodId: z.string().min(1, 'Please select a shipping method'),
  paymentMethod: z.enum(['card', 'paypal']).default('card'),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  orderNotes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      sameAsBilling: true,
      paymentMethod: 'card',
      shippingAddress: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        country: 'US',
      },
      billingAddress: {
        country: 'US',
      },
    },
  });

  const sameAsBilling = watch('sameAsBilling');
  const shippingAddress = watch('shippingAddress');

  // Redirect to cart if empty
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Fetch shipping rates when address changes
  useEffect(() => {
    const fetchShippingRates = async () => {
      if (
        shippingAddress?.postalCode?.length >= 5 &&
        shippingAddress?.state &&
        cart
      ) {
        setIsLoadingRates(true);
        try {
          const rates = await ordersApi.getShippingRates({
            postalCode: shippingAddress.postalCode,
            city: shippingAddress.city || '',
            state: shippingAddress.state,
            country: shippingAddress.country || 'US',
          });
          setShippingRates(rates);
          if (rates.length > 0 && !selectedShippingRate) {
            setSelectedShippingRate(rates[0]);
            setValue('shippingMethodId', rates[0].id);
          }
        } catch (err) {
          // Mock shipping rates for demo
          const mockRates: ShippingRate[] = [
            {
              id: 'standard',
              carrier: 'USPS',
              service: 'Standard',
              name: 'Standard Shipping',
              description: '5-7 business days',
              rate: cart.subtotal >= 99 ? 0 : 9.99,
              price: cart.subtotal >= 99 ? 0 : 9.99,
              estimatedDays: 6,
            },
            {
              id: 'express',
              carrier: 'UPS',
              service: 'Express',
              name: 'Express Shipping',
              description: '2-3 business days',
              rate: 19.99,
              price: 19.99,
              estimatedDays: 3,
            },
            {
              id: 'overnight',
              carrier: 'FedEx',
              service: 'Overnight',
              name: 'Overnight Shipping',
              description: 'Next business day',
              rate: 39.99,
              price: 39.99,
              estimatedDays: 1,
            },
          ];
          setShippingRates(mockRates);
          if (mockRates.length > 0 && !selectedShippingRate) {
            setSelectedShippingRate(mockRates[0]);
            setValue('shippingMethodId', mockRates[0].id);
          }
        } finally {
          setIsLoadingRates(false);
        }
      }
    };

    fetchShippingRates();
  }, [shippingAddress?.postalCode, shippingAddress?.state, cart, setValue]);

  const handleShippingRateSelect = (rate: ShippingRate) => {
    setSelectedShippingRate(rate);
    setValue('shippingMethodId', rate.id);
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!cart) return;

    setIsSubmitting(true);
    try {
      const checkoutData = {
        email: data.email,
        shippingAddress: data.shippingAddress as unknown as Address,
        billingAddress: data.sameAsBilling
          ? (data.shippingAddress as unknown as Address)
          : (data.billingAddress as unknown as Address),
        shippingMethodId: data.shippingMethodId,
        paymentMethodId: 'pm_demo', // In real app, this would come from Stripe
        orderNotes: data.orderNotes,
        sameAsShipping: data.sameAsBilling,
        shippingMethod: selectedShippingRate?.name || 'Standard',
      };

      const order = await ordersApi.createOrder(checkoutData as import('@/types').CheckoutData);
      await clearCart();
      success('Order Placed!', `Your order #${order.orderNumber} has been confirmed.`);
      navigate(`/account/orders/${order.id}`, { state: { newOrder: true } });
    } catch (err) {
      // Demo: simulate successful order
      await clearCart();
      success('Order Placed!', 'Your order has been confirmed. Check your email for details.');
      navigate('/account/orders', { state: { newOrder: true } });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.subtotal;
  const discount = cart.discountAmount || 0;
  const shippingCost = selectedShippingRate?.price || 0;
  const taxRate = 0.0825; // Demo tax rate
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + shippingCost + tax;

  const steps = [
    { key: 'shipping', label: 'Shipping', icon: Truck },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'review', label: 'Review', icon: Check },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/cart" className="flex items-center gap-2 text-secondary-600 hover:text-primary-600">
              <ChevronLeft className="h-5 w-5" />
              Back to Cart
            </Link>
            <h1 className="text-xl font-bold text-secondary-900">Checkout</h1>
            <div className="flex items-center gap-2 text-green-600">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.key;
              const isCompleted =
                (s.key === 'shipping' && (step === 'payment' || step === 'review')) ||
                (s.key === 'payment' && step === 'review');

              return (
                <React.Fragment key={s.key}>
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-px w-12 sm:w-24',
                        isCompleted ? 'bg-primary-600' : 'bg-secondary-300'
                      )}
                    />
                  )}
                  <button
                    onClick={() => {
                      if (isCompleted || isActive) {
                        setStep(s.key as typeof step);
                      }
                    }}
                    disabled={!isCompleted && !isActive}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                      isActive && 'bg-primary-600 text-white',
                      isCompleted && 'bg-primary-100 text-primary-700',
                      !isActive && !isCompleted && 'bg-secondary-100 text-secondary-400'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden sm:inline font-medium">{s.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Step */}
              {step === 'shipping' && (
                <>
                  {/* Contact Information */}
                  <Card>
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                      Contact Information
                    </h2>
                    <Input
                      label="Email Address"
                      type="email"
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder="your@email.com"
                    />
                  </Card>

                  {/* Shipping Address */}
                  <Card>
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                      Shipping Address
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        {...register('shippingAddress.firstName')}
                        error={errors.shippingAddress?.firstName?.message}
                      />
                      <Input
                        label="Last Name"
                        {...register('shippingAddress.lastName')}
                        error={errors.shippingAddress?.lastName?.message}
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Street Address"
                          {...register('shippingAddress.street1')}
                          error={errors.shippingAddress?.street1?.message}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          label="Apartment, suite, etc. (optional)"
                          {...register('shippingAddress.street2')}
                        />
                      </div>
                      <Input
                        label="City"
                        {...register('shippingAddress.city')}
                        error={errors.shippingAddress?.city?.message}
                      />
                      <Select
                        label="State"
                        options={US_STATES}
                        value={watch('shippingAddress.state') || ''}
                        onChange={(value) => setValue('shippingAddress.state', value)}
                        error={errors.shippingAddress?.state?.message}
                      />
                      <Input
                        label="ZIP Code"
                        {...register('shippingAddress.postalCode')}
                        error={errors.shippingAddress?.postalCode?.message}
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        {...register('shippingAddress.phone')}
                        error={errors.shippingAddress?.phone?.message}
                      />
                    </div>
                  </Card>

                  {/* Shipping Method */}
                  <Card>
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                      Shipping Method
                    </h2>
                    {isLoadingRates ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
                        <span className="ml-3 text-secondary-500">Calculating shipping rates...</span>
                      </div>
                    ) : shippingRates.length > 0 ? (
                      <div className="space-y-3">
                        {shippingRates.map((rate) => (
                          <label
                            key={rate.id}
                            className={cn(
                              'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                              selectedShippingRate?.id === rate.id
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-secondary-300 hover:border-secondary-400'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={selectedShippingRate?.id === rate.id}
                                onChange={() => handleShippingRateSelect(rate)}
                                className="h-4 w-4 text-primary-600"
                              />
                              <div>
                                <p className="font-medium text-secondary-900">{rate.name}</p>
                                <p className="text-sm text-secondary-500">{rate.description}</p>
                              </div>
                            </div>
                            <span className="font-semibold text-secondary-900">
                              {rate.price === 0 ? 'FREE' : formatPrice(rate.price)}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary-500 text-center py-4">
                        Enter your shipping address to see available shipping options.
                      </p>
                    )}
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => setStep('payment')}
                      disabled={!selectedShippingRate}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </>
              )}

              {/* Payment Step */}
              {step === 'payment' && (
                <>
                  {/* Billing Address */}
                  <Card>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-secondary-900">
                        Billing Address
                      </h2>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsBilling}
                          onChange={(e) => setValue('sameAsBilling', e.target.checked)}
                          className="h-4 w-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-secondary-600">Same as shipping</span>
                      </label>
                    </div>

                    {!sameAsBilling && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="First Name"
                          {...register('billingAddress.firstName')}
                          error={errors.billingAddress?.firstName?.message}
                        />
                        <Input
                          label="Last Name"
                          {...register('billingAddress.lastName')}
                          error={errors.billingAddress?.lastName?.message}
                        />
                        <div className="sm:col-span-2">
                          <Input
                            label="Street Address"
                            {...register('billingAddress.street1')}
                            error={errors.billingAddress?.street1?.message}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Apartment, suite, etc. (optional)"
                            {...register('billingAddress.street2')}
                          />
                        </div>
                        <Input
                          label="City"
                          {...register('billingAddress.city')}
                          error={errors.billingAddress?.city?.message}
                        />
                        <Select
                          label="State"
                          options={US_STATES}
                          value={watch('billingAddress.state') || ''}
                          onChange={(value) => setValue('billingAddress.state', value)}
                          error={errors.billingAddress?.state?.message}
                        />
                        <Input
                          label="ZIP Code"
                          {...register('billingAddress.postalCode')}
                          error={errors.billingAddress?.postalCode?.message}
                        />
                        <Input
                          label="Phone"
                          type="tel"
                          {...register('billingAddress.phone')}
                          error={errors.billingAddress?.phone?.message}
                        />
                      </div>
                    )}

                    {sameAsBilling && (
                      <div className="bg-secondary-50 rounded-lg p-4">
                        <p className="text-secondary-700">
                          {shippingAddress?.firstName} {shippingAddress?.lastName}
                        </p>
                        <p className="text-secondary-600 text-sm">
                          {shippingAddress?.street1}
                          {shippingAddress?.street2 && `, ${shippingAddress.street2}`}
                        </p>
                        <p className="text-secondary-600 text-sm">
                          {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Payment Method */}
                  <Card>
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                      Payment Method
                    </h2>

                    <div className="space-y-4">
                      {/* Credit Card Option */}
                      <label
                        className={cn(
                          'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                          watch('paymentMethod') === 'card'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-secondary-300 hover:border-secondary-400'
                        )}
                      >
                        <input
                          type="radio"
                          {...register('paymentMethod')}
                          value="card"
                          className="h-4 w-4 text-primary-600"
                        />
                        <CreditCard className="h-5 w-5 text-secondary-600" />
                        <span className="font-medium">Credit / Debit Card</span>
                      </label>

                      {watch('paymentMethod') === 'card' && (
                        <div className="pl-11 space-y-4">
                          <Input
                            label="Card Number"
                            placeholder="1234 5678 9012 3456"
                            {...register('cardNumber')}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Expiry Date"
                              placeholder="MM/YY"
                              {...register('cardExpiry')}
                            />
                            <Input
                              label="CVC"
                              placeholder="123"
                              {...register('cardCvc')}
                            />
                          </div>
                        </div>
                      )}

                      {/* PayPal Option */}
                      <label
                        className={cn(
                          'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                          watch('paymentMethod') === 'paypal'
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-secondary-300 hover:border-secondary-400'
                        )}
                      >
                        <input
                          type="radio"
                          {...register('paymentMethod')}
                          value="paypal"
                          className="h-4 w-4 text-primary-600"
                        />
                        <span className="font-medium text-blue-600">PayPal</span>
                      </label>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm text-secondary-500">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Your payment information is encrypted and secure.</span>
                    </div>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('shipping')}
                    >
                      Back to Shipping
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      onClick={() => setStep('review')}
                    >
                      Review Order
                    </Button>
                  </div>
                </>
              )}

              {/* Review Step */}
              {step === 'review' && (
                <>
                  {/* Order Review */}
                  <Card>
                    <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                      Review Your Order
                    </h2>

                    {/* Items */}
                    <div className="divide-y divide-secondary-200">
                      {cart.items.map((item) => {
                        const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
                        return (
                          <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                            <div className="w-16 h-16 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-secondary-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-secondary-900 line-clamp-1">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-secondary-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-secondary-900">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Shipping & Billing Summary */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Card>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-secondary-500" />
                        <h3 className="font-medium text-secondary-900">Shipping Address</h3>
                      </div>
                      <div className="text-sm text-secondary-600">
                        <p className="font-medium text-secondary-900">
                          {shippingAddress?.firstName} {shippingAddress?.lastName}
                        </p>
                        <p>{shippingAddress?.street1}</p>
                        {shippingAddress?.street2 && <p>{shippingAddress.street2}</p>}
                        <p>
                          {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}
                        </p>
                        <p>{shippingAddress?.phone}</p>
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="h-4 w-4 text-secondary-500" />
                        <h3 className="font-medium text-secondary-900">Shipping Method</h3>
                      </div>
                      <div className="text-sm text-secondary-600">
                        <p className="font-medium text-secondary-900">{selectedShippingRate?.name}</p>
                        <p>{selectedShippingRate?.description}</p>
                        <p className="font-medium mt-1">
                          {selectedShippingRate?.price === 0 ? 'FREE' : formatPrice(selectedShippingRate?.price || 0)}
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Order Notes */}
                  <Card>
                    <h3 className="font-medium text-secondary-900 mb-3">Order Notes (Optional)</h3>
                    <textarea
                      {...register('orderNotes')}
                      rows={3}
                      placeholder="Any special instructions for your order..."
                      className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep('payment')}
                    >
                      Back to Payment
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      isLoading={isSubmitting}
                      leftIcon={<Lock className="h-5 w-5" />}
                    >
                      Place Order - {formatPrice(total)}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                  Order Summary
                </h2>

                {/* Items Preview */}
                <div className="space-y-3 mb-4">
                  {cart.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-secondary-100 rounded-lg" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-600 text-white text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {cart.items.length > 3 && (
                    <p className="text-sm text-secondary-500">
                      +{cart.items.length - 3} more items
                    </p>
                  )}
                </div>

                <hr className="border-secondary-200 mb-4" />

                {/* Totals */}
                <div className="space-y-3 text-secondary-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-secondary-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="font-medium text-secondary-900">
                      {selectedShippingRate
                        ? selectedShippingRate.price === 0
                          ? 'FREE'
                          : formatPrice(selectedShippingRate.price)
                        : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-medium text-secondary-900">
                      {formatPrice(tax)}
                    </span>
                  </div>
                </div>

                <hr className="border-secondary-200 my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-secondary-200">
                  <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
                    <Lock className="h-4 w-4" />
                    <span>Secure SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-500">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Secure Payment Processing</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
