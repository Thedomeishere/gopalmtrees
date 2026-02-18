import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/services/firebase";
import type { PushNotification, UserProfile } from "@palmtree/shared";
import { Bell, Send, Users, User, Radio, Clock, CheckCircle, AlertCircle } from "lucide-react";

type TargetMode = "broadcast" | "segment" | "individual";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [success, setSuccess] = useState("");

  // Composer state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("general");
  const [targetMode, setTargetMode] = useState<TargetMode>("broadcast");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, "notifications"), orderBy("sentAt", "desc"))),
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"))),
      ]);
      setNotifications(notifSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PushNotification));
      setCustomers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !body) return;
    setSending(true);
    setSuccess("");
    try {
      const functions = getFunctions();
      const sendNotification = httpsCallable(functions, "sendPushNotification");
      const result = await sendNotification({
        title,
        body,
        type,
        broadcast: targetMode === "broadcast",
        targetUserIds: targetMode === "individual" ? selectedUsers : undefined,
      });
      const data = result.data as { sent: number; failed: number };
      setSuccess(`Sent to ${data.sent} devices${data.failed ? `, ${data.failed} failed` : ""}`);
      setTitle("");
      setBody("");
      setSelectedUsers([]);
      loadData();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      setSuccess(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (uid: string) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Send push notifications to customers</p>
        </div>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-2 px-4 py-2 bg-palm-700 text-white rounded-lg text-sm font-semibold hover:bg-palm-800"
        >
          <Send className="h-4 w-4" />
          New Notification
        </button>
      </div>

      {/* Composer */}
      {showComposer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Compose Notification</h2>

          {success && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${success.startsWith("Error") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {success.startsWith("Error") ? <AlertCircle className="inline h-4 w-4 mr-1" /> : <CheckCircle className="inline h-4 w-4 mr-1" />}
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20 focus:border-palm-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20 focus:border-palm-500 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-palm-500/20"
                >
                  <option value="general">General</option>
                  <option value="promotion">Promotion</option>
                  <option value="order_update">Order Update</option>
                  <option value="quote_response">Quote Response</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <div className="flex gap-2">
                  {[
                    { value: "broadcast" as const, label: "All Users", icon: Radio },
                    { value: "individual" as const, label: "Select Users", icon: User },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTargetMode(value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${
                        targetMode === value
                          ? "border-palm-600 bg-palm-50 text-palm-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Selection */}
            {targetMode === "individual" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Recipients ({selectedUsers.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                  {customers.filter((c) => c.role === "customer").map((customer) => (
                    <label
                      key={customer.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(customer.id)}
                        onChange={() => toggleUser(customer.id)}
                        className="rounded border-gray-300 text-palm-600 focus:ring-palm-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {customer.displayName || "No Name"}
                        </p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="flex items-center gap-2 px-6 py-2.5 bg-palm-700 text-white rounded-lg text-sm font-semibold hover:bg-palm-800 disabled:opacity-50"
            >
              {sending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Notification History</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-palm-600 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          notif.broadcast
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {notif.broadcast ? "Broadcast" : `${notif.targetUserIds?.length || 0} users`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {notif.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap ml-4">
                    <Clock className="h-3 w-3" />
                    {notif.sentAt?.toDate?.()?.toLocaleString() || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
