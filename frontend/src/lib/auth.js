const AUTH_KEY = "taskman_auth";
const REFRESH_KEY = "taskman_refresh";
const USER_KEY = "taskman_user";

export const login = async (email, password) => {
  const { apiLogin } = await import("./api");
  const res = await apiLogin(email, password);
  const user = { email, name: email.split("@")[0] };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return !!res?.access;
};

export const register = async (email, password, name) => {
  const { apiRegister, apiLogin } = await import("./api");
  await apiRegister(email, password, name);
  await apiLogin(email, password);
  const user = { email, name: name || email.split("@")[0] };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return true;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_KEY);
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};
