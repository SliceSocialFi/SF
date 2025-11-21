// const API_URL = (typeof import.meta !== 'undefined' && (import.meta.env?.SLICE_API_URL as string)) || "http://localhost:4000"; // Hoặc có thể lấy từ biến môi trường

// /**
//  * A simple fetcher function that appends the API URL.
//  * @param endpoint The endpoint to fetch from.
//  * @param options The fetch options.
//  * @returns The fetch response.
//  */
// export const fetcher = (endpoint: string, options?: RequestInit) => {
//   const base = API_URL.replace(/\/$/, '');
//   const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
//   const url = `${base}${path}`;
//   return fetch(url, options);
// };
