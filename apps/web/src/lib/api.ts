const API_URL = "http://localhost:4000"; // Hoặc có thể lấy từ biến môi trường

/**
 * A simple fetcher function that appends the API URL.
 * @param endpoint The endpoint to fetch from.
 * @param options The fetch options.
 * @returns The fetch response.
 */
export const fetcher = (endpoint: string, options?: RequestInit) => {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
};
