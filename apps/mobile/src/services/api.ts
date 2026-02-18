import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const TOKEN_KEY = "auth_token";

// In development, point to your machine's local IP
// For production, this would be your API server URL
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:3001/api";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
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
