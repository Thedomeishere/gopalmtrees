import { Platform } from "react-native";
import Constants from "expo-constants";

const TOKEN_KEY = "auth_token";

// On web, use relative path (served by same Express server)
// On native, use configured URL or localhost
const API_BASE_URL =
  Platform.OS === "web"
    ? "/api"
    : Constants.expoConfig?.extra?.apiUrl || "http://localhost:3001/api";

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    const SecureStore = await import("expo-secure-store");
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

class ApiClient {
  private async getHeaders(isFormData = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    isFormData = false
  ): Promise<T> {
    const headers = await this.getHeaders(isFormData);
    const url = `${API_BASE_URL}${path}`;

    const config: RequestInit = {
      method,
      headers,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Request failed: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>("POST", path, formData, true);
  }
}

export const api = new ApiClient();
