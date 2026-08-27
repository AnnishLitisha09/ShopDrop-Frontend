import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('sd_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('sd_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    const vId = product.vendorId || product.Vendor?.id || 'general_vendor';
    const vName = product.Vendor?.shopName || product.Vendor?.name || product.vendorName || 'Campus Shop';

    const normalizedItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      isAvailable: product.isAvailable !== false,
      institutionId: product.institutionId,
      vendorId: vId,
      vendorName: vName,
      quantity,
    };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        toast.success(`Updated quantity for ${product.name}`, { id: `cart-${product.id}` });
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`Added ${product.name} to cart!`, { id: `cart-${product.id}` });
      return [...prev, normalizedItem];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Group cart items by vendor
  const groupedCart = cartItems.reduce((acc, item) => {
    const vId = item.vendorId || 'general';
    const vName = item.vendorName || 'Campus Shop';
    if (!acc[vId]) {
      acc[vId] = {
        vendorId: vId,
        vendorName: vName,
        items: [],
        subtotal: 0,
      };
    }
    acc[vId].items.push(item);
    acc[vId].subtotal += item.price * item.quantity;
    return acc;
  }, {});

  const groupedCartList = Object.values(groupedCart);

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const serviceFee = cartItems.length > 0 ? 15.0 : 0;
  const cartTotalPrice = cartSubtotal + serviceFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        groupedCartList,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotalCount,
        cartSubtotal,
        serviceFee,
        cartTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
