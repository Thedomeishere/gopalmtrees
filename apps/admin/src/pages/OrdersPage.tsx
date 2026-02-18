import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Order, OrderStatus, OrderItem } from "@palmtree/shared";
import { ORDER_STATUS_LABELS, formatCurrency } from "@palmtree/shared";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Package,
  MapPin,
  CreditCard,
  AlertTriangle,
  X,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────

const ALL_STATUSES: OrderStatus[] = [
  "confirmed",
  "preparing",
  "in_transit",
  "delivered",
  "cancelled",
  "refunded",
];

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  preparing: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  in_transit: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-600" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  refunded: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const ORDERS_PER_PAGE = 20;

// ─── Status Badge Component ─────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.confirmed;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${color.bg} ${color.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Confirmation Modal ─────────────────────────────────────────

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-palm-600 hover:bg-palm-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expanded Order Detail Row ──────────────────────────────────

function OrderDetails({ order }: { order: Order }) {
  const addr = order.shippingAddress;

  return (
    <tr>
      <td colSpan={8} className="bg-gray-50 px-6 py-5">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Items */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Package className="h-4 w-4 text-gray-500" />
              Items ({order.items.length})
            </h4>
            <ul className="space-y-2">
              {order.items.map((item: OrderItem, idx: number) => (
                <li
                  key={`${item.productId}-${item.sizeId}-${idx}`}
                  className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-10 w-10 rounded-md object-cover bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23e5e7eb' rx='4'/%3E%3C/svg%3E";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.sizeLabel} &middot; Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              Shipping Address
            </h4>
            <div className="rounded-lg bg-white p-4 shadow-sm text-sm text-gray-700 space-y-1">
              <p className="font-medium">{addr.label}</p>
              <p>{addr.street}</p>
              {addr.unit && <p>{addr.unit}</p>}
              <p>
                {addr.city}, {addr.state} {addr.zip}
              </p>
            </div>

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Status History
                </h4>
                <div className="space-y-1.5">
                  {order.statusHistory.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <StatusBadge status={entry.status} />
                      <span className="text-gray-400">
                        {entry.timestamp?.toDate
                          ? entry.timestamp.toDate().toLocaleString()
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <CreditCard className="h-4 w-4 text-gray-500" />
              Payment Info
            </h4>
            <div className="rounded-lg bg-white p-4 shadow-sm text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              {order.refundAmount != null && order.refundAmount > 0 && (
                <div className="flex justify-between text-red-600 font-medium border-t pt-2">
                  <span>Refunded</span>
                  <span>-{formatCurrency(order.refundAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-500">Stripe Payment Intent</p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {order.stripePaymentIntentId}
                </p>
              </div>
              {order.refundId && (
                <div>
                  <p className="text-xs text-gray-500">Refund ID</p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {order.refundId}
                  </p>
                </div>
              )}
              {order.notes && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page Component ────────────────────────────────────────

export default function OrdersPage() {
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/search state
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Expansion state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"" | OrderStatus>("");

  // Single status update state
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{
    orderId: string;
    newStatus: OrderStatus;
  } | null>(null);

  // Refund modal state
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  // Bulk confirm state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  // Busy state for mutations
  const [mutating, setMutating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Fetch Orders ───────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: Order[] = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Order
      );
      setOrders(fetched);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Filtered & Searched Orders ─────────────────────────────

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.currentStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // ─── Toggle Expansion ───────────────────────────────────────

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  // ─── Selection Helpers ──────────────────────────────────────

  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // ─── Single Status Update ──────────────────────────────────

  const confirmStatusUpdate = async () => {
    if (!statusUpdateTarget) return;
    setMutating(true);
    try {
      const { orderId, newStatus } = statusUpdateTarget;
      const orderRef = doc(db, "orders", orderId);
      const target = orders.find((o) => o.id === orderId);
      const newEntry = {
        status: newStatus,
        timestamp: Timestamp.now(),
        note: `Status changed to ${ORDER_STATUS_LABELS[newStatus]}`,
      };
      await updateDoc(orderRef, {
        currentStatus: newStatus,
        statusHistory: [...(target?.statusHistory ?? []), newEntry],
        updatedAt: Timestamp.now(),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                currentStatus: newStatus,
                statusHistory: [...o.statusHistory, newEntry],
                updatedAt: Timestamp.now(),
              }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update order status.");
    } finally {
      setMutating(false);
      setStatusUpdateTarget(null);
    }
  };

  // ─── Refund ─────────────────────────────────────────────────

  const confirmRefund = async () => {
    if (!refundTarget) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > refundTarget.total) {
      return;
    }
    setMutating(true);
    try {
      const orderRef = doc(db, "orders", refundTarget.id);
      const newEntry = {
        status: "refunded" as OrderStatus,
        timestamp: Timestamp.now(),
        note: `Refund of ${formatCurrency(amount)} issued`,
      };
      await updateDoc(orderRef, {
        currentStatus: "refunded",
        refundAmount: amount,
        statusHistory: [...refundTarget.statusHistory, newEntry],
        updatedAt: Timestamp.now(),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === refundTarget.id
            ? {
                ...o,
                currentStatus: "refunded" as OrderStatus,
                refundAmount: amount,
                statusHistory: [...o.statusHistory, newEntry],
                updatedAt: Timestamp.now(),
              }
            : o
        )
      );
    } catch (err) {
      console.error("Failed to process refund:", err);
      setError("Failed to process refund.");
    } finally {
      setMutating(false);
      setRefundTarget(null);
      setRefundAmount("");
    }
  };

  // ─── Bulk Status Update ─────────────────────────────────────

  const confirmBulkUpdate = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setMutating(true);
    try {
      const promises = Array.from(selectedIds).map(async (orderId) => {
        const target = orders.find((o) => o.id === orderId);
        const newEntry = {
          status: bulkAction,
          timestamp: Timestamp.now(),
          note: `Bulk status change to ${ORDER_STATUS_LABELS[bulkAction]}`,
        };
        const orderRef = doc(db, "orders", orderId);
        return updateDoc(orderRef, {
          currentStatus: bulkAction,
          statusHistory: [...(target?.statusHistory ?? []), newEntry],
          updatedAt: Timestamp.now(),
        });
      });
      await Promise.all(promises);
      setOrders((prev) =>
        prev.map((o) => {
          if (!selectedIds.has(o.id)) return o;
          const newEntry = {
            status: bulkAction,
            timestamp: Timestamp.now(),
            note: `Bulk status change to ${ORDER_STATUS_LABELS[bulkAction]}`,
          };
          return {
            ...o,
            currentStatus: bulkAction,
            statusHistory: [...o.statusHistory, newEntry],
            updatedAt: Timestamp.now(),
          };
        })
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed bulk update:", err);
      setError("Failed to update some orders. Please refresh and try again.");
    } finally {
      setMutating(false);
      setBulkConfirmOpen(false);
      setBulkAction("");
    }
  };

  // ─── Helpers ────────────────────────────────────────────────

  const shortId = (id: string) => id.slice(-6).toUpperCase();

  const formatDate = (ts: Timestamp | undefined) => {
    if (!ts || !ts.toDate) return "--";
    return ts.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const itemCount = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && ` (${ORDER_STATUS_LABELS[statusFilter]})`}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-palm-200 bg-palm-50 px-4 py-3">
          <span className="text-sm font-medium text-palm-800">
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as "" | OrderStatus)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
          >
            <option value="">Choose action...</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                Set to {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            disabled={!bulkAction}
            onClick={() => setBulkConfirmOpen(true)}
            className="rounded-lg bg-palm-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-palm-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-palm-600" />
          <span className="ml-3 text-gray-500">Loading orders...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Orders will appear here once customers start placing them."}
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && filteredOrders.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedOrders.length > 0 &&
                      paginatedOrders.every((o) => selectedIds.has(o.id))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-palm-600 focus:ring-palm-500"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Customer Email
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">
                  Items
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isExpanded={isExpanded}
                    isSelected={selectedIds.has(order.id)}
                    onToggleExpand={() => toggleExpand(order.id)}
                    onToggleSelect={() => toggleSelect(order.id)}
                    onStatusChange={(newStatus) =>
                      setStatusUpdateTarget({ orderId: order.id, newStatus })
                    }
                    onRefund={() => {
                      setRefundTarget(order);
                      setRefundAmount(order.total.toFixed(2));
                    }}
                    shortId={shortId}
                    formatDate={formatDate}
                    itemCount={itemCount}
                  />
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}

      {/* Single Status Update Confirmation */}
      <ConfirmModal
        open={statusUpdateTarget !== null}
        title="Update Order Status"
        message={
          statusUpdateTarget
            ? `Change order ...${shortId(statusUpdateTarget.orderId)} to "${ORDER_STATUS_LABELS[statusUpdateTarget.newStatus]}"?`
            : ""
        }
        confirmLabel="Update Status"
        onConfirm={confirmStatusUpdate}
        onCancel={() => setStatusUpdateTarget(null)}
      />

      {/* Refund Modal */}
      <ConfirmModal
        open={refundTarget !== null}
        title="Issue Refund"
        message={
          refundTarget
            ? `Issue a refund for order ...${shortId(refundTarget.id)}. The order total is ${formatCurrency(refundTarget.total)}.`
            : ""
        }
        confirmLabel={mutating ? "Processing..." : "Issue Refund"}
        danger
        onConfirm={confirmRefund}
        onCancel={() => {
          setRefundTarget(null);
          setRefundAmount("");
        }}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Refund Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={refundTarget?.total ?? 0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
            placeholder="0.00"
          />
          {refundAmount &&
            (parseFloat(refundAmount) <= 0 ||
              parseFloat(refundAmount) > (refundTarget?.total ?? 0)) && (
              <p className="mt-1 text-xs text-red-600">
                Amount must be between $0.01 and{" "}
                {formatCurrency(refundTarget?.total ?? 0)}
              </p>
            )}
        </div>
      </ConfirmModal>

      {/* Bulk Update Confirmation */}
      <ConfirmModal
        open={bulkConfirmOpen}
        title="Bulk Status Update"
        message={`Update ${selectedIds.size} order${selectedIds.size !== 1 ? "s" : ""} to "${bulkAction ? ORDER_STATUS_LABELS[bulkAction] : ""}"?`}
        confirmLabel={mutating ? "Updating..." : "Update All"}
        onConfirm={confirmBulkUpdate}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}

// ─── Order Row Component ──────────────────────────────────────

function OrderRow({
  order,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onStatusChange,
  onRefund,
  shortId,
  formatDate,
  itemCount,
}: {
  order: Order;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onRefund: () => void;
  shortId: (id: string) => string;
  formatDate: (ts: Timestamp | undefined) => string;
  itemCount: (order: Order) => number;
}) {
  return (
    <>
      <tr
        className={`hover:bg-gray-50 transition-colors ${
          isSelected ? "bg-palm-50/50" : ""
        }`}
      >
        {/* Checkbox */}
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-palm-600 focus:ring-palm-500"
          />
        </td>

        {/* Order ID */}
        <td className="px-4 py-3">
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1.5 font-mono text-sm font-medium text-palm-700 hover:text-palm-900"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            ...{shortId(order.id)}
          </button>
        </td>

        {/* Customer Email */}
        <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={order.userEmail}>
          {order.userEmail}
        </td>

        {/* Items Count */}
        <td className="px-4 py-3 text-center text-gray-700">{itemCount(order)}</td>

        {/* Total */}
        <td className="px-4 py-3 text-right font-medium text-gray-900">
          {formatCurrency(order.total)}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={order.currentStatus} />
        </td>

        {/* Date */}
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
          {formatDate(order.createdAt)}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {/* Status Dropdown */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onStatusChange(e.target.value as OrderStatus);
                }
              }}
              className="appearance-none rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
              title="Change status"
            >
              <option value="">Status...</option>
              {ALL_STATUSES.filter((s) => s !== order.currentStatus).map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            {/* Refund Button */}
            {order.currentStatus !== "refunded" && (
              <button
                onClick={onRefund}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                title="Issue refund"
              >
                <RotateCcw className="h-3 w-3" />
                Refund
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && <OrderDetails order={order} />}
    </>
  );
}
