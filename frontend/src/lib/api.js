import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskman_auth");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

async function refreshToken() {
  const refresh = localStorage.getItem("taskman_refresh");
  if (!refresh) throw new Error("No refresh token");
  const res = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh });
  const newAccess = res.data.access;
  localStorage.setItem("taskman_auth", newAccess);
  return newAccess;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        await new Promise((resolve) => refreshQueue.push(resolve));
        original.headers.Authorization = `Bearer ${localStorage.getItem(
          "taskman_auth"
        )}`;
        original._retry = true;
        return api(original);
      }

      try {
        isRefreshing = true;
        const newAccess = await refreshToken();
        refreshQueue.forEach((fn) => fn());
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newAccess}`;
        original._retry = true;
        return api(original);
      } catch (e) {
        localStorage.removeItem("taskman_auth");
        localStorage.removeItem("taskman_refresh");
        localStorage.removeItem("taskman_user");
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export async function apiLogin(email, password) {
  const res = await axios.post(`${BASE_URL}/api/auth/login/`, {
    username: email,
    password,
  });
  const { access, refresh } = res.data;
  localStorage.setItem("taskman_auth", access);
  localStorage.setItem("taskman_refresh", refresh);
  return { access, refresh };
}

export async function apiRegister(email, password, name) {
  await axios.post(`${BASE_URL}/api/auth/register/`, {
    username: email,
    email,
    password,
  });
}

export const tasksApi = {
  list: async () => {
    const res = await api.get("/api/tasks/");
    return res.data;
  },
  create: async (data) => {
    const res = await api.post("/api/tasks/", data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.patch(`/api/tasks/${id}/`, data);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/api/tasks/${id}/`);
  },
};
