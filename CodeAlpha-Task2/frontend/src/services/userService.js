import API from "../api/axios.js";

const userService = {
  async search(params) {
    const { data } = await API.get("/users", { params });
    return { items: data.data, meta: data.meta };
  },

  async get(id) {
    const { data } = await API.get(`/users/${id}`);
    return data.data;
  },

  async followers(id, params) {
    const { data } = await API.get(`/users/${id}/followers`, { params });
    return { items: data.data, meta: data.meta };
  },

  async following(id, params) {
    const { data } = await API.get(`/users/${id}/following`, { params });
    return { items: data.data, meta: data.meta };
  },

  async follow(id) {
    const { data } = await API.post(`/users/${id}/follow`);
    return data.data; // { following, followerCount }
  },

  async unfollow(id) {
    const { data } = await API.delete(`/users/${id}/follow`);
    return data.data;
  },

  /* Edit my own profile. `formData` may include an avatar file. Returns the updated user. */
  async updateMe(formData) {
    const { data } = await API.put("/users/me", formData);
    return data.data.user;
  },
};

export default userService;
