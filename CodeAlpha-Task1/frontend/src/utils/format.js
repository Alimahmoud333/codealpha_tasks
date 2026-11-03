import { CURRENCY } from "../constants/appConfig.js";

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });
const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);
export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : "");
export const formatDateTime = (value) => (value ? dateTimeFormatter.format(new Date(value)) : "");

export const pluralize = (count, singular, plural = `${singular}s`) => (count === 1 ? singular : plural);
