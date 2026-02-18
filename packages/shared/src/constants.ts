// ─── Business Constants ──────────────────────────────────────
export const BUSINESS_NAME = "Go Palm Trees";
export const BUSINESS_PHONE = "(516) 555-PALM";
export const BUSINESS_EMAIL = "info@gopalmtrees.com";
export const BUSINESS_WEBSITE = "https://gopalmtrees.com";

// ─── Delivery ────────────────────────────────────────────────
export const DELIVERY_FEE = 0; // Free delivery for now
export const MIN_ORDER_AMOUNT = 50;
export const DELIVERY_DAYS = ["Tuesday", "Wednesday", "Thursday"] as const;

// ─── Tax Rates by State ──────────────────────────────────────
export const TAX_RATES: Record<string, number> = {
  NY: 0.08,
  NJ: 0.06625,
  FL: 0.07,
  CT: 0.0635,
  PA: 0.06,
  DEFAULT: 0.08,
};

// ─── Seasonal Config ─────────────────────────────────────────
export const SEASONAL_CONFIG = {
  offSeasonMonths: [12, 1, 2] as number[],
  offSeasonMessage:
    "We're currently in our off-season. Some items may have limited availability. Orders placed now will ship when the season resumes in March.",
};

// ─── Product Categories ──────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  "Palm Trees",
  "Tropical Plants",
  "Fruit Trees",
  "Exotic Plants",
  "Succulents",
  "Garden Supplies",
] as const;

// ─── Order Statuses ──────────────────────────────────────────
export const ORDER_STATUS_LABELS: Record<string, string> = {
  confirmed: "Order Confirmed",
  preparing: "Preparing Your Order",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// ─── Store Locations Seed Data ───────────────────────────────
export const STORE_LOCATIONS = [
  {
    name: "Go Palm Trees - Hicksville",
    address: "388 S Broadway",
    city: "Hicksville",
    state: "NY",
    zip: "11801",
    phone: "(516) 822-7256",
    latitude: 40.7632,
    longitude: -73.525,
  },
  {
    name: "Go Palm Trees - Island Park",
    address: "4177 Austin Blvd",
    city: "Island Park",
    state: "NY",
    zip: "11558",
    phone: "(516) 889-3961",
    latitude: 40.6043,
    longitude: -73.6554,
  },
  {
    name: "Go Palm Trees - Dix Hills",
    address: "547 E Deer Park Rd",
    city: "Dix Hills",
    state: "NY",
    zip: "11746",
    phone: "(631) 242-7256",
    latitude: 40.8051,
    longitude: -73.3243,
  },
  {
    name: "Go Palm Trees - Manahawkin",
    address: "657 E Bay Ave",
    city: "Manahawkin",
    state: "NJ",
    zip: "08050",
    phone: "(609) 597-7256",
    latitude: 39.6932,
    longitude: -74.2585,
  },
] as const;

// ─── Quote Service Types ─────────────────────────────────────
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  landscape_design: "Landscape Design",
  installation: "Installation",
  maintenance: "Maintenance",
  consultation: "Consultation",
  bulk_order: "Bulk Order",
};
