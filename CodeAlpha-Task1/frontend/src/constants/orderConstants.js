export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/* Same rules as the backend; the server remains the authority. */
export const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/* Steps shown in the progress tracker (cancelled orders show a notice instead). */
export const ORDER_PROGRESS = ["pending", "processing", "shipped", "delivered"];
