import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price with currency symbol */
export function formatPrice(amount: number | string, currency = "EUR"): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

/** Format a date to a human-readable string */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Returns true if the expiry date is within 90 days from now */
export function isExpiringSoon(expiryDate: Date | string): boolean {
  const ms = new Date(expiryDate).getTime() - Date.now();
  const days = ms / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 90;
}

/** Returns true if the expiry date has passed */
export function isExpired(expiryDate: Date | string): boolean {
  return new Date(expiryDate).getTime() < Date.now();
}

/**
 * Haversine distance between two lat/lng points, in kilometres.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Capitalise the first letter of a string */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
