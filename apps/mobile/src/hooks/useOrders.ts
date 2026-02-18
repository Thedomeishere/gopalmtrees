import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "./useAuth";
import type { Order } from "@palmtree/shared";

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadOrders();
    else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get<Order[]>("/orders");
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, refresh: loadOrders };
}
