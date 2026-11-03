export const USER_ROLES = { CUSTOMER: "customer", ADMIN: "admin" };

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

/* Which status an order may move to from its current status. */
export const ORDER_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
