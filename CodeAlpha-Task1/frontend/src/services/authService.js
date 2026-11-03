import API from "../api/axios.js";

/* Each service function returns the useful part of the response (the `data` envelope). */

const authService = {
  async register(payload) {
    const { data } = await API.post("/auth/register", payload);
    return data.data; // { user, token }
  },

  async login(payload) {
    const { data } = await API.post("/auth/login", payload);
    return data.data; // { user, token }
  },

  async me() {
    const { data } = await API.get("/auth/me");
    return data.data.user;
  },
};

export default authService;
