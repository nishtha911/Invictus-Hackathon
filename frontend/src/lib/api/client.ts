/**
 * Centralized API Client with Mock/FastAPI Switch
 */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function isMockMode(): boolean {
  return USE_MOCK;
}

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
    // If backend is unreachable and a fallback mock is provided, seamlessly fallback with warning
    if (mockFallback) {
      console.warn(`[DhanSetu API] Backend unavailable at ${url}, using mock response.`, error);
      return mockFallback();
    }
    throw error;
  }
}
