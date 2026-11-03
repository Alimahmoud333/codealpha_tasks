import API from "../api/axios.js";

const postService = {
  /* Cursor pagination: pass the previous response's meta.nextCursor to get older posts. */
  async list(params) {
    const { data } = await API.get("/posts", { params });
    return { items: data.data, meta: data.meta };
  },

  async get(id) {
    const { data } = await API.get(`/posts/${id}`);
    return data.data;
  },

  /* `formData` carries the text and an optional image file. */
  async create(formData) {
    const { data } = await API.post("/posts", formData);
    return data.data;
  },

  async update(id, body) {
    const { data } = await API.put(`/posts/${id}`, body);
    return data.data;
  },

  async remove(id) {
    await API.delete(`/posts/${id}`);
  },

  async like(id) {
    const { data } = await API.post(`/posts/${id}/like`);
    return data.data; // { likeCount, likedByMe }
  },

  async unlike(id) {
    const { data } = await API.delete(`/posts/${id}/like`);
    return data.data;
  },

  async listComments(postId, params) {
    const { data } = await API.get(`/posts/${postId}/comments`, { params });
    return { items: data.data, meta: data.meta };
  },

  async createComment(postId, content) {
    const { data } = await API.post(`/posts/${postId}/comments`, { content });
    return data.data; // { comment, commentCount }
  },

  async updateComment(id, content) {
    const { data } = await API.put(`/comments/${id}`, { content });
    return data.data;
  },

  async removeComment(id) {
    const { data } = await API.delete(`/comments/${id}`);
    return data.data; // { commentCount }
  },
};

export default postService;
