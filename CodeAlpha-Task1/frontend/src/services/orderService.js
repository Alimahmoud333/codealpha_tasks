import API from "../api/axios.js";

const orderService = {
  async create(shipping) {
    const { data } = await API.post("/orders", shipping);
    return data.data;
  },

  async list(params) {
    const { data } = await API.get("/orders", { params });
    return { items: data.data, meta: data.meta };
  },

  async get(id) {
    const { data } = await API.get(`/orders/${id}`);
    return data.data;
  },

  /* Admin */
  async adminList(params) {
    const { data } = await API.get("/admin/orders", { params });
    return { items: data.data, meta: data.meta };
  },

  async adminUpdateStatus(id, status) {
    const { data } = await API.patch(`/admin/orders/${id}/status`, { status });
    return data.data;
  },
};

export default orderService;
