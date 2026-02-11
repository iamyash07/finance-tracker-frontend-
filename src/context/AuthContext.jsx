import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, userAPI } from "../utils/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }
      // Fetch full user data including avatar
      const res = await userAPI.getMe();
      const userData = res.data.user || res.data;
      console.log("LOADED USER:", userData);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const register = async (username, email, password) => {
    const res = await authAPI.register({ username, email, password });
    if (res.data.success) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      // Fetch full user data (includes avatar, createdAt, etc.)
      const userRes = await userAPI.getMe();
      const fullUser = userRes.data.user || userRes.data;
      setUser(fullUser);

      return res.data;
    } else {
      throw new Error(res.data.message || "Registration failed");
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      // Fetch full user data (includes avatar, createdAt, etc.)
      const userRes = await userAPI.getMe();
      const fullUser = userRes.data.user || userRes.data;
      setUser(fullUser);

      return res.data;
    } else {
      throw new Error(res.data.message || "Login failed");
    }
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    darkMode,
    login,
    register,
    logout,
    updateUser,
    toggleDarkMode,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;