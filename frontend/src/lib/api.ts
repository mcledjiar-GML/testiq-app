import axios from "axios";

export const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

console.log("[TestIQ] API_BASE =", API_BASE);