/**
 * Centralized API Client with Mock/FastAPI Switch
 */

import { toast } from "sonner";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function isMockMode(): boolean {
  return USE_MOCK;
}

// Warn / toast only once per endpoint per session so a down backend during
// local dev (or hot-reloads) doesn't spam the console.
const _warnedEndpoints = new Set<string>();

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
  mockFallback?: () => T | Promise<T>
): Promise<T> {
  if (USE_MOCK && mockFallback) {
    // Simulate brief network latency (300-450ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 350));
    return mockFallback();
  }

  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    // If backend is unreachable and a fallback mock is provided, seamlessly fall back.
    if (mockFallback) {
      if (!_warnedEndpoints.has(endpoint)) {
        _warnedEndpoints.add(endpoint);
        console.warn(`[Cognis Bank API] ${endpoint} unavailable — showing sample data. Start the backend (python run.py) for live data.`);
        try {
          toast.warning("Live service unavailable — showing sample data.", { id: `mock-${endpoint}` });
        } catch {
          /* non-browser context */
        }
      }
      return mockFallback();
    }
    throw error;
  }
}
