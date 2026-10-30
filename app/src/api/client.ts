import { API_BASE_URL } from "./config";
import { ApiErrorResponse } from "../types";

let currentUserId = 1;
const listeners = new Set<(id: number) => void>();

export function getSelectedUserId(): number {
  return currentUserId;
}

export function setSelectedUserId(id: number) {
  currentUserId = id;
  listeners.forEach((listener) => listener(id));
}

export function subscribeSelectedUser(listener: (id: number) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public checkedInAt?: string;

  constructor(statusCode: number, code: string, message: string, checkedInAt?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.checkedInAt = checkedInAt;
  }
}

const REQUEST_TIMEOUT_MS = 10000;

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-User-Id": String(currentUserId),
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // B04: AbortController prevents dead connections from hanging indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const message = isTimeout
      ? "Request timed out after 10s. Verify connection."
      : "Network connection failed. Verify API server is running and ADB reverse is active.";
    throw new ApiError(0, "NETWORK_ERROR", message);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }

    const code = errorData?.error?.code || `HTTP_${response.status}`;
    const message = errorData?.error?.message || `Request failed with status ${response.status}`;
    const checkedInAt = errorData?.error?.checkedInAt;

    throw new ApiError(response.status, code, message, checkedInAt);
  }

  return response.json() as Promise<T>;
}
