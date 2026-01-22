import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Tag, Truck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/formatters';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input, QuantitySelector, EmptyState, Card } from '@/components/common';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isLoading, updateItemQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    try {
      await updateItemQuantity(itemId, quantity);
    } catch (err) {
      error('Error', 'Failed to update quantity.');
    }
  };

  const handleRemoveItem = async (itemId: number, productName: string) => {
    try {
      await removeItem(itemId);
      success('Removed', `${productName} removed from cart.`);
    } catch (err) {
      error('Error', 'Failed to remove item.');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponCode.trim());
      success('Coupon Applied', 'Your discount has been applied.');
      setCouponCode('');
    } catch (err) {
      error('Invalid Coupon', 'The coupon code is invalid or expired.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      success('Coupon Removed', 'The coupon has been removed.');
    } catch (err) {
      error('Error', 'Failed to remove coupon.');
    }
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=/checkout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container mx-auto px-4 py-16">
          <EmptyState
            icon={<ShoppingCart className="h-16 w-16" />}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet. Start shopping to find great performance parts!"
            action={{
              label: 'Browse Parts',
              onClick: () => navigate('/shop'),
            }}
          />
        </div>
      </div>
    );
  }

  const freeShippingThreshold = 99;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-secondary-500">
            <Link to="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-secondary-900">Shopping Cart</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Free Shipping Progress */}
            {remainingForFreeShipping > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Add {formatPrice(remainingForFreeShipping)} more for FREE shipping!
                  </span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cart.subtotal / freeShippingThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <Card padding="none">
              <div className="divide-y divide-secondary-200">
                {cart.items.map((item) => {
                  const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
                  return (
                    <div key={item.id} className="p-4 sm:p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/shop/products/${item.product.slug}`}
                          className="flex-shrink-0 w-24 h-24 bg-secondary-100 rounded-lg overflow-hidden"
                        >
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
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/shop/products/${item.product.slug}`}
                            className="font-medium text-secondary-900 hover:text-primary-600 line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.product.brand && (
                            <p className="text-sm text-secondary-500 mt-1">
                              {item.product.brand.name}
                            </p>
                          )}
                          <p className="text-sm text-secondary-400 mt-1">
                            SKU: {item.product.sku}
                          </p>

                          {/* Mobile Price */}
                          <div className="sm:hidden mt-2">
                            <span className="font-semibold text-primary-600">
                              {formatPrice(item.unitPrice)}
                            </span>
                          </div>

                          {/* Quantity & Remove (Mobile) */}
                          <div className="flex items-center justify-between mt-4 sm:hidden">
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(qty) => handleQuantityChange(item.id, qty)}
                              size="sm"
                            />
                            <button
                              onClick={() => handleRemoveItem(item.id, item.product.name)}
                              className="p-2 text-secondary-400 hover:text-red-600"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Desktop: Price, Quantity, Total */}
                        <div className="hidden sm:flex items-start gap-8">
                          {/* Unit Price */}
                          <div className="text-right">
                            <p className="text-sm text-secondary-500">Price</p>
                            <p className="font-medium text-secondary-900">
                              {formatPrice(item.unitPrice)}
                            </p>
                          </div>

                          {/* Quantity */}
                          <div>
                            <p className="text-sm text-secondary-500 mb-2">Qty</p>
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(qty) => handleQuantityChange(item.id, qty)}
                              size="sm"
                            />
                          </div>

                          {/* Total */}
                          <div className="text-right w-24">
                            <p className="text-sm text-secondary-500">Total</p>
                            <p className="font-semibold text-primary-600">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveItem(item.id, item.product.name)}
                            className="p-2 text-secondary-400 hover:text-red-600"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                to="/shop"
                className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                Order Summary
              </h2>

              {/* Coupon Code */}
              <div className="mb-6">
                {cart.couponCode ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">{cart.couponCode}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      isLoading={isApplyingCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              {/* Summary Lines */}
              <div className="space-y-3 text-secondary-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-secondary-900">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>
                {cart.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(cart.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium text-secondary-900">
                    {cart.subtotal >= freeShippingThreshold ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="text-secondary-900">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <hr className="my-4 border-secondary-200" />

              {/* Estimated Total */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Estimated Total</span>
                <span className="text-primary-600">{formatPrice(cart.total)}</span>
              </div>

              {/* Checkout Button */}
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleCheckout}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-secondary-200">
                <div className="flex items-center justify-center gap-4 text-secondary-400">
                  <div className="text-center">
                    <Truck className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Free Shipping</span>
                  </div>
                  <div className="text-center">
                    <Tag className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Best Prices</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
