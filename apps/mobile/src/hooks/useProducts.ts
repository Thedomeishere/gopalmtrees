import { useEffect, useState } from "react";
import { api } from "@/services/api";
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
      const params = categoryId ? `?categoryId=${categoryId}` : "";
      const data = await api.get<Product[]>(`/products${params}`);
      setProducts(data.filter((p) => p.active));
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
      const data = await api.get<Product[]>("/products?featured=true");
      setProducts(data.filter((p) => p.active));
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
      const data = await api.get<Category[]>("/categories");
      setCategories(data.filter((c) => c.active));
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading };
}
