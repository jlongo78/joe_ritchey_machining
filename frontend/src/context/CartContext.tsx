import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, Product } from '@/types';
import { cartApi } from '@/services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Local storage key for guest cart
const GUEST_CART_KEY = 'guestCart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Load cart on mount and when auth changes
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Fetch cart from API for authenticated users
        const serverCart = await cartApi.getCart();
        setCart(serverCart);

        // Merge guest cart if exists
        const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
        if (guestCartJson) {
          await cartApi.mergeCart();
          localStorage.removeItem(GUEST_CART_KEY);
          const mergedCart = await cartApi.getCart();
          setCart(mergedCart);
        }
      } else {
        // Use local storage for guest users
        const guestCartJson = localStorage.getItem(GUEST_CART_KEY);
        if (guestCartJson) {
          setCart(JSON.parse(guestCartJson));
        } else {
          setCart({
            id: 0,
            status: 'active',
            items: [],
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            total: 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart({
        id: 0,
        status: 'active',
        items: [],
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Save guest cart to local storage
  const saveGuestCart = useCallback((updatedCart: Cart) => {
    if (!isAuthenticated) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
    }
  }, [isAuthenticated]);

  // Calculate cart totals
  const calculateTotals = useCallback((items: CartItem[]): Partial<Cart> => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return {
      subtotal,
      total: subtotal, // Tax and discount would be calculated server-side in real app
    };
  }, []);

  const addItem = useCallback(async (product: Product, quantity: number = 1) => {
    if (isAuthenticated) {
      const updatedCart = await cartApi.addItem(product.id, quantity);
      setCart(updatedCart);
    } else {
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const existingItem = prevCart.items.find((item) => item.productId === product.id);
        let newItems: CartItem[];

        if (existingItem) {
          newItems = prevCart.items.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  totalPrice: (item.quantity + quantity) * item.unitPrice,
                }
              : item
          );
        } else {
          const price = product.salePrice || product.retailPrice;
          const newItem: CartItem = {
            id: Date.now(), // Temporary ID for guest cart
            productId: product.id,
            product,
            quantity,
            unitPrice: price,
            totalPrice: price * quantity,
          };
          newItems = [...prevCart.items, newItem];
        }

        const updatedCart: Cart = {
          ...prevCart,
          items: newItems,
          ...calculateTotals(newItems),
        };
        saveGuestCart(updatedCart);
        return updatedCart;
      });
    }
  }, [isAuthenticated, calculateTotals, saveGuestCart]);

  const updateItemQuantity = useCallback(async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    if (isAuthenticated) {
      const updatedCart = await cartApi.updateItem(itemId, quantity);
      setCart(updatedCart);
    } else {
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const newItems = prevCart.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: quantity * item.unitPrice,
              }
            : item
        );

        const updatedCart: Cart = {
          ...prevCart,
          items: newItems,
          ...calculateTotals(newItems),
        };
        saveGuestCart(updatedCart);
        return updatedCart;
      });
    }
  }, [isAuthenticated, calculateTotals, saveGuestCart]);

  const removeItem = useCallback(async (itemId: number) => {
    if (isAuthenticated) {
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
    } else {
      setCart((prevCart) => {
        if (!prevCart) return prevCart;

        const newItems = prevCart.items.filter((item) => item.id !== itemId);
        const updatedCart: Cart = {
          ...prevCart,
          items: newItems,
          ...calculateTotals(newItems),
        };
        saveGuestCart(updatedCart);
        return updatedCart;
      });
    }
  }, [isAuthenticated, calculateTotals, saveGuestCart]);

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      await cartApi.clearCart();
    }
    const emptyCart: Cart = {
      id: 0,
      status: 'active',
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
    };
    setCart(emptyCart);
    if (!isAuthenticated) {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, [isAuthenticated]);

  const applyCoupon = useCallback(async (code: string) => {
    if (isAuthenticated) {
      const updatedCart = await cartApi.applyCoupon(code);
      setCart(updatedCart);
    } else {
      throw new Error('Please log in to apply coupon codes');
    }
  }, [isAuthenticated]);

  const removeCoupon = useCallback(async () => {
    if (isAuthenticated && cart?.couponCode) {
      const updatedCart = await cartApi.removeCoupon();
      setCart(updatedCart);
    }
  }, [isAuthenticated, cart?.couponCode]);

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const value: CartContextType = {
    cart,
    isLoading,
    itemCount,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
