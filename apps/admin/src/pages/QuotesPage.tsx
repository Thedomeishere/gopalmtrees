import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type { Quote, QuoteStatus } from "@palmtree/shared";
import { SERVICE_TYPE_LABELS, formatCurrency } from "@palmtree/shared";
import {
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Image as ImageIcon,
  X,
  Phone,
  Mail,
  User,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

// ─── Status helpers ─────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  estimated: "Estimated",
  accepted: "Accepted",
  declined: "Declined",
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  reviewed: "bg-blue-100 text-blue-800 ring-blue-600/20",
  estimated: "bg-purple-100 text-purple-800 ring-purple-600/20",
  accepted: "bg-green-100 text-green-800 ring-green-600/20",
  declined: "bg-red-100 text-red-800 ring-red-600/20",
};

const STATUS_ICONS: Record<QuoteStatus, React.ElementType> = {
  pending: Clock,
  reviewed: Eye,
  estimated: DollarSign,
  accepted: CheckCircle,
  declined: XCircle,
};

const CONTACT_PREFERENCE_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  either: "Email or Phone",
};

const ALL_STATUSES: QuoteStatus[] = [
  "pending",
  "reviewed",
  "estimated",
  "accepted",
  "declined",
];

// ─── Component ──────────────────────────────────────────────────

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | QuoteStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Admin response form state per quote
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>(
    {}
  );
  const [estimatedPrices, setEstimatedPrices] = useState<
    Record<string, string>
  >({});
  const [updatingQuoteId, setUpdatingQuoteId] = useState<string | null>(null);

  // ─── Fetch quotes ───────────────────────────────────────────

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Quote[]>("/quotes");

      setQuotes(data);

      // Pre-populate response fields with existing admin responses
      const texts: Record<string, string> = {};
      const prices: Record<string, string> = {};
      data.forEach((quote) => {
        if (quote.adminResponse) texts[quote.id] = quote.adminResponse;
        if (quote.estimatedPrice !== undefined)
          prices[quote.id] = quote.estimatedPrice.toString();
      });
      setResponseTexts((prev) => ({ ...prev, ...texts }));
      setEstimatedPrices((prev) => ({ ...prev, ...prices }));
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError("Failed to load quotes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // ─── Status update ──────────────────────────────────────────

  const handleStatusUpdate = async (
    quoteId: string,
    newStatus: QuoteStatus,
    includeResponse = false
  ) => {
    setUpdatingQuoteId(quoteId);
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (includeResponse) {
        const responseText = responseTexts[quoteId]?.trim();
        const priceStr = estimatedPrices[quoteId]?.trim();

        if (responseText) {
          updateData.adminResponse = responseText;
        }
        if (priceStr) {
          const price = parseFloat(priceStr);
          if (!isNaN(price) && price >= 0) {
            updateData.estimatedPrice = price;
          }
        }
      }

      await api.put(`/quotes/${quoteId}`, updateData);

      // Update local state
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                ...updateData,
                updatedAt: new Date().toISOString(),
                status: newStatus,
                adminResponse:
                  (updateData.adminResponse as string) ?? q.adminResponse,
                estimatedPrice:
                  (updateData.estimatedPrice as number) ?? q.estimatedPrice,
              }
            : q
        )
      );
    } catch (err) {
      console.error("Error updating quote:", err);
      setError("Failed to update quote. Please try again.");
    } finally {
      setUpdatingQuoteId(null);
    }
  };

  // ─── Filtering ──────────────────────────────────────────────

  const filteredQuotes = quotes.filter((quote) => {
    const matchesStatus =
      filterStatus === "all" || quote.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      quote.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ─── Helpers ────────────────────────────────────────────────

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d, yyyy h:mm a");
    } catch {
      return "—";
    }
  };

  const shortId = (id: string) => id.slice(-6).toUpperCase();

  const toggleExpand = (quoteId: string) => {
    setExpandedQuoteId((prev) => (prev === quoteId ? null : quoteId));
  };

  // ─── Status count badges ────────────────────────────────────

  const statusCounts = quotes.reduce(
    (acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer service quote requests
          </p>
        </div>
        <button
          onClick={fetchQuotes}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-palm-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-palm-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
              {quotes.length}
            </span>
          </button>
          {ALL_STATUSES.map((status) => {
            const Icon = STATUS_ICONS[status];
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {STATUS_LABELS[status]}
                {(statusCounts[status] ?? 0) > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {statusCounts[status]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-palm-600" />
          <span className="ml-3 text-gray-500">Loading quotes...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredQuotes.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No quotes found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter."
              : "No quote requests have been submitted yet."}
          </p>
        </div>
      )}

      {/* Quotes table */}
      {!loading && filteredQuotes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Quote ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuotes.map((quote) => {
                const isExpanded = expandedQuoteId === quote.id;
                const isUpdating = updatingQuoteId === quote.id;

                return (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    isExpanded={isExpanded}
                    isUpdating={isUpdating}
                    responseText={responseTexts[quote.id] ?? ""}
                    estimatedPrice={estimatedPrices[quote.id] ?? ""}
                    onToggleExpand={() => toggleExpand(quote.id)}
                    onResponseTextChange={(val) =>
                      setResponseTexts((prev) => ({
                        ...prev,
                        [quote.id]: val,
                      }))
                    }
                    onEstimatedPriceChange={(val) =>
                      setEstimatedPrices((prev) => ({
                        ...prev,
                        [quote.id]: val,
                      }))
                    }
                    onStatusUpdate={(status, includeResponse) =>
                      handleStatusUpdate(quote.id, status, includeResponse)
                    }
                    onOpenLightbox={setLightboxUrl}
                    formatDate={formatDate}
                    shortId={shortId}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredQuotes.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          Showing {filteredQuotes.length} of {quotes.length} quote
          {quotes.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Photo lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Quote photo"
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── QuoteRow sub-component ───────────────────────────────────

interface QuoteRowProps {
  quote: Quote;
  isExpanded: boolean;
  isUpdating: boolean;
  responseText: string;
  estimatedPrice: string;
  onToggleExpand: () => void;
  onResponseTextChange: (val: string) => void;
  onEstimatedPriceChange: (val: string) => void;
  onStatusUpdate: (status: QuoteStatus, includeResponse?: boolean) => void;
  onOpenLightbox: (url: string) => void;
  formatDate: (t: string) => string;
  shortId: (id: string) => string;
}

function QuoteRow({
  quote,
  isExpanded,
  isUpdating,
  responseText,
  estimatedPrice,
  onToggleExpand,
  onResponseTextChange,
  onEstimatedPriceChange,
  onStatusUpdate,
  onOpenLightbox,
  formatDate,
  shortId,
}: QuoteRowProps) {
  const StatusIcon = STATUS_ICONS[quote.status];

  return (
    <>
      {/* Main row */}
      <tr
        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
          isExpanded ? "bg-gray-50" : ""
        }`}
        onClick={onToggleExpand}
      >
        <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-gray-900">
          #{shortId(quote.id)}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
          {quote.userName}
        </td>
        <td className="hidden md:table-cell whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {quote.userEmail}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
          {SERVICE_TYPE_LABELS[quote.serviceType] ?? quote.serviceType}
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[quote.status]}`}
          >
            <StatusIcon className="h-3 w-3" />
            {STATUS_LABELS[quote.status]}
          </span>
        </td>
        <td className="hidden lg:table-cell whitespace-nowrap px-6 py-4 text-sm text-gray-500">
          {formatDate(quote.createdAt)}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="inline-flex items-center gap-1 text-sm text-palm-600 hover:text-palm-800 font-medium"
          >
            {isExpanded ? (
              <>
                Collapse
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Details
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-gray-50/50 px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column: Quote details */}
              <div className="space-y-5">
                {/* Contact info */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{quote.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${quote.userEmail}`}
                        className="text-palm-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {quote.userEmail}
                      </a>
                    </div>
                    {quote.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a
                          href={`tel:${quote.phone}`}
                          className="text-palm-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {quote.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span>
                        Preferred contact:{" "}
                        {CONTACT_PREFERENCE_LABELS[quote.contactPreference] ??
                          quote.contactPreference}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Description
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {quote.description}
                  </p>
                </div>

                {/* Photos */}
                {quote.photos && quote.photos.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                      Photos ({quote.photos.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {quote.photos.map((photoUrl, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLightbox(photoUrl);
                          }}
                          className="group relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-all hover:ring-2 hover:ring-palm-500 hover:ring-offset-2"
                        >
                          <img
                            src={photoUrl}
                            alt={`Quote photo ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing admin response (read-only display if present) */}
                {quote.adminResponse && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">
                      Previous Admin Response
                    </h4>
                    <p className="text-sm text-green-800 whitespace-pre-wrap">
                      {quote.adminResponse}
                    </p>
                    {quote.estimatedPrice !== undefined && (
                      <p className="mt-2 text-sm font-medium text-green-900">
                        Estimated Price:{" "}
                        {formatCurrency(quote.estimatedPrice)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right column: Admin response form */}
              <div className="space-y-5">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    Admin Response
                  </h4>

                  {/* Response textarea */}
                  <div className="mb-4">
                    <label
                      htmlFor={`response-${quote.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Response Message
                    </label>
                    <textarea
                      id={`response-${quote.id}`}
                      value={responseText}
                      onChange={(e) => onResponseTextChange(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={5}
                      placeholder="Write your response to the customer..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500 resize-y"
                    />
                  </div>

                  {/* Estimated price */}
                  <div className="mb-5">
                    <label
                      htmlFor={`price-${quote.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Estimated Price ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id={`price-${quote.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={estimatedPrice}
                        onChange={(e) =>
                          onEstimatedPriceChange(e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-palm-500 focus:outline-none focus:ring-1 focus:ring-palm-500"
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Update Status
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {quote.status === "pending" && (
                        <ActionButton
                          label="Mark as Reviewed"
                          icon={Eye}
                          variant="blue"
                          loading={isUpdating}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate("reviewed", true);
                          }}
                        />
                      )}

                      {(quote.status === "pending" ||
                        quote.status === "reviewed") && (
                        <ActionButton
                          label="Send Estimate"
                          icon={Send}
                          variant="purple"
                          loading={isUpdating}
                          disabled={
                            !estimatedPrice || parseFloat(estimatedPrice) <= 0
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusUpdate("estimated", true);
                          }}
                        />
                      )}

                      {quote.status !== "accepted" &&
                        quote.status !== "declined" && (
                          <ActionButton
                            label="Mark Accepted"
                            icon={CheckCircle}
                            variant="green"
                            loading={isUpdating}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate("accepted", true);
                            }}
                          />
                        )}

                      {quote.status !== "declined" &&
                        quote.status !== "accepted" && (
                          <ActionButton
                            label="Decline"
                            icon={XCircle}
                            variant="red"
                            loading={isUpdating}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusUpdate("declined", true);
                            }}
                          />
                        )}
                    </div>

                    {/* Hint for Send Estimate when disabled */}
                    {(quote.status === "pending" ||
                      quote.status === "reviewed") &&
                      (!estimatedPrice ||
                        parseFloat(estimatedPrice) <= 0) && (
                        <p className="text-xs text-gray-400">
                          Enter an estimated price above to enable &quot;Send
                          Estimate&quot;.
                        </p>
                      )}
                  </div>
                </div>

                {/* Quote metadata */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Quote Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Quote ID</dt>
                      <dd className="font-mono text-gray-900">{quote.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Service Type</dt>
                      <dd className="text-gray-900">
                        {SERVICE_TYPE_LABELS[quote.serviceType] ??
                          quote.serviceType}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Submitted</dt>
                      <dd className="text-gray-900">
                        {formatDate(quote.createdAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="text-gray-900">
                        {formatDate(quote.updatedAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">User ID</dt>
                      <dd className="font-mono text-gray-900 text-xs">
                        {quote.userId}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── ActionButton sub-component ────────────────────────────────

interface ActionButtonProps {
  label: string;
  icon: React.ElementType;
  variant: "blue" | "purple" | "green" | "red";
  loading?: boolean;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const VARIANT_STYLES: Record<string, string> = {
  blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
  purple:
    "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white",
  green: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
  red: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
};

function ActionButton({
  label,
  icon: Icon,
  variant,
  loading = false,
  disabled = false,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
