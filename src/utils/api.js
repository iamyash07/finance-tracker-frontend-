import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// List of auth routes that should NOT trigger token refresh
const authRoutes = ["/auth/login", "/auth/register", "/auth/refresh"];

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 & token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth routes (login, register, refresh)
    const isAuthRoute = authRoutes.some((route) =>
      originalRequest.url.includes(route)
    );

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // Only try refresh for protected routes
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem("accessToken", accessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
};

// ==================== USER API ====================
export const userAPI = {
  getMe: () => api.get("/users/me"),
  updateProfile: (formData) =>
    api.patch("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProfileJSON: (data) => api.patch("/users/me", data),
};

// ==================== GROUPS API ====================
export const groupAPI = {
  create: (data) => api.post("/groups", data),
  getMyGroups: () => api.get("/groups/my-groups"),
  getById: (id) => api.get(`/groups/${id}`),
  addMember: (groupId, userId) =>
    api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  leave: (groupId) => api.post(`/groups/${groupId}/leave`),
  delete: (groupId) => api.delete(`/groups/${groupId}`),
};

// ==================== EXPENSES API ====================
export const expenseAPI = {
  create: (data) => api.post("/expenses", data),
  getByGroup: (groupId, params = {}) =>
    api.get(`/expenses/group/${groupId}`, { params }),
  update: (expenseId, data) => api.patch(`/expenses/${expenseId}`, data),
  delete: (expenseId) => api.delete(`/expenses/${expenseId}`),
  getBalances: (groupId) => api.get(`/expenses/balances/${groupId}`),
  getDashboard: () => api.get("/expenses/dashboard"),
};

// ==================== SETTLEMENTS API ====================
export const settlementAPI = {
  create: (data) => api.post("/settlements", data),
  getByGroup: (groupId) => api.get(`/settlements/group/${groupId}`),
};


export default api;