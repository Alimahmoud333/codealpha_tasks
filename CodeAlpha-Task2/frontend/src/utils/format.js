import { CURRENCY } from "../constants/appConfig.js";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);
export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : "");
export const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : "");

export const pluralize = (count, singular, plural = `${singular}s`) => (count === 1 ? singular : plural);

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/* "5 minutes ago", "yesterday"; older than a week falls back to a plain date. */
export function formatRelativeTime(value) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 45) return "just now";
  if (abs < 3600) return relativeFormatter.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relativeFormatter.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return relativeFormatter.format(Math.round(seconds / 86400), "day");
  return formatDate(value);
}
