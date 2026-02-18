import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { UserProfile } from "@palmtree/shared";
import { Search, Users, Mail, Phone, MapPin, Shield, ShieldOff, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "admin">("all");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.get<UserProfile[]>("/users");
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (customer: UserProfile) => {
    const newRole = customer.role === "admin" ? "customer" : "admin";
    if (!confirm(`Change ${customer.displayName || customer.email} to ${newRole}?`)) return;
    try {
      await api.put(`/users/${customer.id}/role`, { role: newRole });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, role: newRole } : c))
      );
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This cannot be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchesRole = roleFilter === "all" || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} total customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20 focus:border-palm-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-palm-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p>No customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  expanded={expandedId === customer.id}
                  onToggle={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                  onToggleRole={() => toggleRole(customer)}
                  onDelete={() => deleteCustomer(customer.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CustomerRow({
  customer,
  expanded,
  onToggle,
  onToggleRole,
  onDelete,
}: {
  customer: UserProfile;
  expanded: boolean;
  onToggle: () => void;
  onToggleRole: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-palm-100 flex items-center justify-center text-palm-700 font-bold text-sm">
              {(customer.displayName || customer.email)?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{customer.displayName || "No Name"}</p>
              <p className="text-xs text-gray-500">{customer.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {customer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {customer.phone}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              customer.role === "admin"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {customer.role === "admin" ? <Shield className="h-3 w-3" /> : null}
            {customer.role}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onToggleRole}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-purple-600"
              title={customer.role === "admin" ? "Remove admin" : "Make admin"}
            >
              {customer.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600"
              title="Delete customer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Addresses */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Addresses
                </h4>
                {customer.addresses?.length > 0 ? (
                  <div className="space-y-2">
                    {customer.addresses.map((addr) => (
                      <div key={addr.id} className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                        <p className="font-medium">{addr.label} {addr.isDefault && <span className="text-xs text-palm-600">(Default)</span>}</p>
                        <p>{addr.street}{addr.unit ? `, ${addr.unit}` : ""}</p>
                        <p>{addr.city}, {addr.state} {addr.zip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No addresses saved</p>
                )}
              </div>
              {/* Notification Preferences */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notification Preferences</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Order Updates: {customer.notificationPreferences?.orderUpdates ? "On" : "Off"}</p>
                  <p>Promotions: {customer.notificationPreferences?.promotions ? "On" : "Off"}</p>
                  <p>Quote Responses: {customer.notificationPreferences?.quoteResponses ? "On" : "Off"}</p>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">Account Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Push Tokens: {customer.pushTokens?.length || 0}</p>
                  <p>Stripe ID: {customer.stripeCustomerId || "None"}</p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
