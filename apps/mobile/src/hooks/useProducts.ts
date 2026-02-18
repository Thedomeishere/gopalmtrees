import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "@react-native-firebase/firestore";
import { db } from "@/services/firebase";
import type { Product, Category } from "@palmtree/shared";

export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [categoryId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let q;
      if (categoryId) {
        q = query(
          collection(db, "products"),
          where("active", "==", true),
          where("categoryId", "==", categoryId),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(
          collection(db, "products"),
          where("active", "==", true),
          orderBy("createdAt", "desc")
        );
      }
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, refresh: loadProducts };
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    try {
      const q = query(
        collection(db, "products"),
        where("active", "==", true),
        where("featured", "==", true)
      );
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
    } catch (error) {
      console.error("Error loading featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const q = query(
        collection(db, "categories"),
        where("active", "==", true),
        orderBy("sortOrder", "asc")
      );
      const snap = await getDocs(q);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category));
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading };
}
