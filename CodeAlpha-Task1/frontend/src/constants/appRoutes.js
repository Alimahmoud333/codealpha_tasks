const APP_ROUTES = {
  HOME: "/",
  SHOP: "/shop",
  PRODUCT_DETAILS: "/shop/products/:id",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: "/orders/:id/confirmation",
  ORDERS: "/orders",
  ORDER_DETAILS: "/orders/:id",
  ACCOUNT: "/account",
  LOGIN: "/login",
  REGISTER: "/register",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_ORDERS: "/admin/orders",
};

/* Helpers that build real URLs from the patterns above. */
export const productPath = (id) => `/shop/products/${id}`;
export const orderPath = (id) => `/orders/${id}`;
export const orderConfirmationPath = (id) => `/orders/${id}/confirmation`;

export default APP_ROUTES;
