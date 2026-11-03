import API from "../api/axios.js";

const productService = {
  async list(params) {
    const { data } = await API.get("/products", { params });
    return { items: data.data, meta: data.meta };
  },

  async get(id) {
    const { data } = await API.get(`/products/${id}`);
    return data.data;
  },

  async categories() {
    const { data } = await API.get("/categories");
    return data.data;
  },

  /* Admin. `formData` is a FormData object so an image file can be sent with the text fields. */
  async create(formData) {
    const { data } = await API.post("/products", formData);
    return data.data;
  },

  async update(id, formData) {
    const { data } = await API.put(`/products/${id}`, formData);
    return data.data;
  },

  async remove(id) {
    await API.delete(`/products/${id}`);
  },
};

export default productService;
