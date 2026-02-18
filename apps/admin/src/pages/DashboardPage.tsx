import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { DailyAnalytics, Order, Product } from "@palmtree/shared";
import { formatCurrency } from "@palmtree/shared";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString().split("T")[0];

      const [analyticsSnap, ordersSnap, productsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "analytics"),
            where("date", ">=", startDateStr),
            orderBy("date", "asc")
          )
        ),
        getDocs(
          query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10))
        ),
        getDocs(query(collection(db, "products"), where("active", "==", true))),
      ]);

      setAnalytics(
        analyticsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as DailyAnalytics)
      );
      setRecentOrders(
        ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
      );

      // Find low stock products
      const products = productsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Product
      );
      setLowStockProducts(
        products.filter((p) => p.sizes?.some((s) => s.stock <= 5))
      );
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Compute summary stats
  const totalRevenue = analytics.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = analytics.reduce((sum, d) => sum + d.orderCount, 0);
  const totalNewCustomers = analytics.reduce((sum, d) => sum + d.newCustomers, 0);
  const avgOrderValue =
    totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statsCards = [
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Orders",
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "New Customers",
      value: totalNewCustomers.toString(),
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Avg. Order Value",
      value: formatCurrency(avgOrderValue),
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-100 text-blue-700",
    preparing: "bg-yellow-100 text-yellow-700",
    in_transit: "bg-green-100 text-green-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-palm-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#388E3C"
                  fill="#E8F5E9"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Orders</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [value, "Orders"]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Bar dataKey="orderCount" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
            <a href="/orders" className="text-xs text-palm-600 hover:underline">
              View all
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">{order.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.currentStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.currentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock / Top Products */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-orange-200">
              <div className="px-4 py-3 border-b border-orange-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-orange-700">
                  Low Stock Alerts ({lowStockProducts.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {lowStockProducts.slice(0, 5).map((product) => {
                  const lowSizes = product.sizes.filter((s) => s.stock <= 5);
                  return (
                    <div key={product.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <div className="flex gap-2 mt-1">
                        {lowSizes.map((s) => (
                          <span
                            key={s.id}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              s.stock === 0
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {s.label}: {s.stock} left
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Products */}
          {analytics.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Package className="h-4 w-4 text-palm-600" />
                <h2 className="text-sm font-semibold text-gray-700">Top Products</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {(() => {
                  // Aggregate top products across the date range
                  const productMap = new Map<string, { name: string; qty: number }>();
                  analytics.forEach((day) => {
                    day.topProducts?.forEach((p) => {
                      const existing = productMap.get(p.productId);
                      if (existing) {
                        existing.qty += p.quantity;
                      } else {
                        productMap.set(p.productId, { name: p.productName, qty: p.quantity });
                      }
                    });
                  });
                  return Array.from(productMap.entries())
                    .sort((a, b) => b[1].qty - a[1].qty)
                    .slice(0, 5)
                    .map(([id, data], index) => (
                      <div key={id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-5">
                            {index + 1}
                          </span>
                          <p className="text-sm font-medium text-gray-900">{data.name}</p>
                        </div>
                        <span className="text-sm text-gray-600">{data.qty} sold</span>
                      </div>
                    ));
                })()}
                {analytics.every((d) => !d.topProducts?.length) && (
                  <div className="py-6 text-center text-gray-400 text-sm">
                    No product data yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
