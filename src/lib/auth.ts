/**
 * Client authentication and session management helpers.
 * Interacts with /api/v1/auth/* Go Backend & Supabase Database.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const AUTH_TOKEN_KEY = "aic_auth_token";
const AUTH_USER_KEY = "aic_auth_user";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company_name: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Failed to save auth session:", err);
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.error("Failed to clear auth session:", err);
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Email atau password salah.");
  }

  const data: AuthResponse = await res.json();
  saveAuthSession(data.token, data.user);
  return data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  name: string;
  company_name?: string;
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal melakukan registrasi.");
  }

  const data: AuthResponse = await res.json();
  saveAuthSession(data.token, data.user);
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const token = getStoredToken();
  if (!token) throw new Error("No token stored");

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    clearAuthSession();
    throw new Error("Sesi telah berakhir. Silakan login kembali.");
  }

  const user: UserProfile = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  return user;
}
