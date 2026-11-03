import API from "../api/axios.js";

/* Every cart call returns the complete, server-calculated cart. */

const cartService = {
  async get() {
    const { data } = await API.get("/cart");
    return data.data;
  },

  async addItem(productId, quantity) {
    const { data } = await API.post("/cart/items", { productId, quantity });
    return data.data;
  },

  async updateItem(itemId, quantity) {
    const { data } = await API.patch(`/cart/items/${itemId}`, { quantity });
    return data.data;
  },

  async removeItem(itemId) {
    const { data } = await API.delete(`/cart/items/${itemId}`);
    return data.data;
  },
};

export default cartService;
