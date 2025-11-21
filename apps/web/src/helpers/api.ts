// src/utils/api.ts

/**
 * Lấy URL API chuẩn dựa trên biến môi trường
 */
// export const getApiUrl = (path: string) => {
//   const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
//   // Xử lý trường hợp user lỡ thêm dấu / ở cuối env
//   const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
//   // Xử lý trường hợp path không có dấu / ở đầu
//   const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
//   return `${cleanBaseUrl}${cleanPath}`;
// };

/**
 * Lấy Access Token từ LocalStorage (hỗ trợ nested JSON của Zustand/Redux)
 */
export const getToken = (): string | null => {
  try {
    // 1. Ưu tiên lấy từ auth.store (Zustand persist)
    const rawData = localStorage.getItem("auth.store");
    
    if (rawData) {
      const parsed = JSON.parse(rawData);
      const token = parsed?.state?.accessToken;
      if (token) return token;
    }

    // 2. Fallback: Tìm các key đơn giản khác (nếu sau này đổi thư viện)
    return localStorage.getItem("accessToken") || 
           localStorage.getItem("token");

  } catch (error) {
    console.error("❌ Error parsing auth token:", error);
    return null;
  }
};