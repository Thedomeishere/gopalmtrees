import React, { createContext, useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc, setDoc, Timestamp } from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { CartItem } from "@palmtree/shared";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, sizeId: string) => void;
  updateQuantity: (productId: string, sizeId: string, quantity: number) => void;
  clearCart: () => void;
  loading: boolean;
}

export const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  loading: false,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Load cart from Firestore
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const loadCart = async () => {
      try {
        const cartDoc = await getDoc(doc(db, "carts", user.uid));
        if (cartDoc.exists) {
          const data = cartDoc.data();
          setItems(data?.items || []);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [user]);

  // Debounced persist to Firestore
  const persistCart = useCallback(
    (newItems: CartItem[]) => {
      if (!user) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          await setDoc(doc(db, "carts", user.uid), {
            userId: user.uid,
            items: newItems,
            updatedAt: Timestamp.now(),
          });
        } catch (error) {
          console.error("Error persisting cart:", error);
        }
      }, 500);
    },
    [user]
  );

  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === item.productId && i.sizeId === item.sizeId
        );
        let newItems: CartItem[];
        if (existing) {
          newItems = prev.map((i) =>
            i.productId === item.productId && i.sizeId === item.sizeId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          newItems = [...prev, item];
        }
        persistCart(newItems);
        return newItems;
      });
    },
    [persistCart]
  );

  const removeItem = useCallback(
    (productId: string, sizeId: string) => {
      setItems((prev) => {
        const newItems = prev.filter(
          (i) => !(i.productId === productId && i.sizeId === sizeId)
        );
        persistCart(newItems);
        return newItems;
      });
    },
    [persistCart]
  );

  const updateQuantity = useCallback(
    (productId: string, sizeId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, sizeId);
        return;
      }
      setItems((prev) => {
        const newItems = prev.map((i) =>
          i.productId === productId && i.sizeId === sizeId
            ? { ...i, quantity }
            : i
        );
        persistCart(newItems);
        return newItems;
      });
    },
    [persistCart, removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    persistCart([]);
  }, [persistCart]);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, removeItem, updateQuantity, clearCart, loading }}
    >
      {children}
    </CartContext.Provider>
  );
}
