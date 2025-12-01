/* Lightweight ApiClient for frontend integration with slice-api
 * - Reads base URL from import.meta.env.Discover job opportunities that match your skillsSLICE_API_URL
 * - Attaches Authorization: Bearer <JWT> if available
 * - Exposes helpers: createTask, getUser, createApplication
 * Note: prefer httpOnly cookie for token storage. This client will
 * check cookie first then localStorage as fallback (dev only).
 */

type Json = Record<string, any>
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { SLICE_API_URL } from "@slice/data/constants";

class ApiError extends Error {
  status: number
  body?: any
  constructor(status: number, message: string, body?: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

function getTokenFromCookie(name = 'token') {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}

function getTokenFromLocalStorage(key = 'token') {
  if (typeof window === 'undefined' || !window.localStorage) return null
  return window.localStorage.getItem(key)
}

export default class ApiClient {
  baseUrl: string

  constructor(baseUrl?: string) {
    // In dev prefer a local proxy to avoid CORS preflight; fallback to SLICE_API_URL in prod
    if (import.meta.env?.DEV) {
      this.baseUrl = baseUrl || SLICE_API_URL || 'http://localhost:3000'
    } else {
      this.baseUrl = baseUrl || SLICE_API_URL
    }
    if (!this.baseUrl) console.warn('[ApiClient] SLICE_API_URL not set')
  }
  
  setBaseUrl(url: string) {
    this.baseUrl = url
  }
  
  private getToken(): string | null {
    // First try persisted auth store (preferred)
    try {
      const tokens = hydrateAuthTokens();
      if (tokens?.accessToken) return tokens.accessToken;
    } catch {
      // ignore
    }
    // Prefer cookie (httpOnly cookie can't be read by JS; this is best-effort for dev)
    return getTokenFromCookie('token') || getTokenFromLocalStorage('token')
  }

  private async request(path: string, opts: RequestInit = {}) {
    const url = path.startsWith('http') ? path : `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    const headers: Record<string, string> = { ...(opts.headers as Record<string,string> || {}) }
    const method = (opts.method || 'GET').toUpperCase()
    if (opts.body != null && method !== 'GET' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    const token = this.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    // Send credentials only when using cookie-based auth.
    // If using Authorization Bearer token we omit credentials to avoid requiring
    // Access-Control-Allow-Credentials on the server (simpler CORS).
    const credentials: RequestCredentials = token ? 'omit' : 'include'
    const fetchOpts: RequestInit = { ...opts, headers, credentials, mode: 'cors' }
    // Dev-time debug:
    if (import.meta.env?.DEV) {
      try {
        console.debug('[ApiClient] fetch', { url, method: opts.method || 'GET', headers, body: opts.body, credentials })
      } catch (e) {}
    }
    let res: Response
    try {
      res = await fetch(url, fetchOpts)
    } catch (err: any) {
      console.error('[ApiClient] Network error when fetching', { url, err })
      throw new ApiError(0, err?.message || 'Network request failed', { url, opts })
    }
    // Debug CORS-related info (will only be visible if browser allows inspecting)
    try {
      if (import.meta.env?.DEV) {
        const hdrs: Record<string,string> = {}
        res.headers.forEach((v,k) => hdrs[k] = v)
        console.debug('[ApiClient] response headers', { status: res.status, headers: hdrs })
      }
    } catch {}
    const text = await res.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (!res.ok) throw new ApiError(res.status, body?.message || res.statusText, body)
    return body
  }

  // ==================== TASKS ====================
  
  async createTask(payload: {
    title: string
    objective: string
    deliverables: string
    acceptanceCriteria: string
    rewardPoints: number
    deadline?: string
    checklist?: Array<{ itemText: string; orderIndex?: number }>
  }) {  
    try { 
      return await this.request('/tasks', { method: 'POST', body: JSON.stringify(payload) })
    } catch (err) { 
      console.error('[ApiClient] Error creating task:', err)
      throw err
    }
  }

  /**
   * List tasks (backward compatible)
   * Returns only the data array for compatibility with existing code
   * @param options - Query parameters for filtering and pagination
   * @returns Promise<any[]> - Array of tasks
   */
  async listTasks(options?: { page?: number; limit?: number; status?: string }): Promise<any[]> {
    const params = new URLSearchParams()
    if (options?.page !== undefined) params.append('page', String(options.page))
    if (options?.limit !== undefined) params.append('limit', String(options.limit))
    if (options?.status) params.append('status', options.status)
    
    const path = params.toString() ? `/tasks?${params.toString()}` : '/tasks'
    const response = await this.request(path, { method: 'GET' })
    
    // Handle new format with pagination wrapper
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data
    }
    
    // Fallback for old format (direct array)
    return Array.isArray(response) ? response : []
  }

  /**
   * List tasks with full pagination metadata (recommended for new code)
   * @param options - Query parameters for filtering and pagination
   * @returns Promise with data array and pagination metadata
   */
  async listTasksWithPagination(options?: { 
    page?: number
    limit?: number
    status?: string
  }): Promise<{ 
    data: any[]
    pagination: { 
      page: number
      limit: number
      total: number
      totalPages: number
    } 
  }> {
    const params = new URLSearchParams()
    if (options?.page !== undefined) params.append('page', String(options.page))
    if (options?.limit !== undefined) params.append('limit', String(options.limit))
    if (options?.status) params.append('status', options.status)
    
    const path = params.toString() ? `/tasks?${params.toString()}` : '/tasks'
    const response = await this.request(path, { method: 'GET' })
    
    // Ensure response has expected structure
    if (response && typeof response === 'object' && 'data' in response) {
      return {
        data: Array.isArray(response.data) ? response.data : [],
        pagination: response.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    }
    
    // Fallback for old format
    return {
      data: Array.isArray(response) ? response : [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }
  }

  async getTask(taskId: string) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`)
  }

  async updateTask(taskId: string, payload: Json) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH' })
  }

  async confirmDeposit(taskId: string, payload: { onChainTaskId: string; depositedTxHash: string }) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/confirm-deposit`, { method: 'PATCH', body: JSON.stringify(payload) })
  }

  // ==================== APPLICATIONS ====================
  
  async listApplications(): Promise<any[]> {
    return this.request('/applications', { method: 'GET' })
  }

  async getApplicationsByTask(taskId: string): Promise<any[]> {
    return this.request(`/applications/task/${encodeURIComponent(taskId)}`, { method: 'GET' })
  }

  async createApplication(payload: { taskId: string, coverLetter?: string }) {
    return this.request('/applications', { method: 'POST', body: JSON.stringify(payload) })
  }

  async submitOutcome(applicationId: string, payload: { outcome: string; outcomeType: 'text' | 'file' }) {
    return this.request(`/applications/${encodeURIComponent(applicationId)}/submit`, { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateApplication(applicationId: string, payload: { status: string; feedback?: string; rating?: number; comment?: string }) {
    return this.request(`/applications/${encodeURIComponent(applicationId)}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  async rateApplication(applicationId: string, payload: { rating: number; comment?: string }) {
    return this.request(`/applications/${encodeURIComponent(applicationId)}/rate`, { method: 'POST', body: JSON.stringify(payload) })
  }

  async deleteApplication(applicationId: string) {
    return this.request(`/applications/${encodeURIComponent(applicationId)}`, { method: 'DELETE' })
  }

  // ==================== USERS ====================
  
  async listUsers(): Promise<any[]> {
    return this.request('/users', { method: 'GET' })
  }

  async getUser(profileId: string) {
    return this.request(`/users/${encodeURIComponent(profileId).toLowerCase()}`)
  }

  async createUser(payload: { profileId: string; username?: string; professionalRoles?: string[] }) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateUser(profileId: string, payload: Json) {
    return this.request(`/users/${encodeURIComponent(profileId).toLowerCase()}`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  async deleteUser(profileId: string) {
    return this.request(`/users/${encodeURIComponent(profileId).toLowerCase()}`, { method: 'DELETE' })
  }

  async adjustUserPoints(profileId: string, payload: { rewardPoints?: number; reputationScore?: number }) {
    return this.request(`/users/${encodeURIComponent(profileId).toLowerCase()}/adjust-points`, { method: 'POST', body: JSON.stringify(payload) })
  }

  // ==================== NOTIFICATIONS ====================
  
  /**
   * Get unread notification count
   * @returns Promise<{ count: number }>
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count', { method: 'GET' })
  }

  /**
   * Get notifications with pagination
   * @param params - { limit?: number, offset?: number }
   * @returns Promise<any[]>
   */
  async getNotifications(params?: { limit?: number; offset?: number }): Promise<any[]> {
    const queryParams = new URLSearchParams()
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit))
    if (params?.offset !== undefined) queryParams.append('offset', String(params.offset))
    
    const path = queryParams.toString() ? `/notifications?${queryParams.toString()}` : '/notifications'
    const notifications = await this.request(path, { method: 'GET' })
    
    // Map to include metadata for navigation
    return Array.isArray(notifications) ? notifications.map((n: any) => ({
      ...n,
      metadata: {
        taskId: n.relatedTaskId,
        applicationId: n.relatedApplicationId
      }
    })) : []
  }

  /**
   * Mark a notification as read
   * @param id - Notification ID
   */
  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', { method: 'PATCH' })
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${encodeURIComponent(notificationId)}`, { method: 'DELETE' })
  }

  async unreadCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count', { method: 'GET' })
  }

  // ==================== ESCROW ====================
  
  async getEscrowTask(taskId: string): Promise<any> {
    return this.request(`/escrow/task/${encodeURIComponent(taskId)}`, { method: 'GET' })
  }

  async getEscrowByExternalId(externalTaskId: string): Promise<any> {
    return this.request(`/escrow/external/${encodeURIComponent(externalTaskId)}`, { method: 'GET' })
  }

  async syncEscrowEvents(): Promise<any> {
    return this.request('/escrow/sync', { method: 'POST' })
  }

  /**
   * Release payment after deadline (API v4.0 - Auto Logic)
   * Backend automatically decides recipient based on work submission:
   * - If freelancer submitted work (in_review/completed) → Release to freelancer
   * - If freelancer NOT submitted or no freelancer → Refund to employer
   * 
   * @param taskId - Task ID
   * @param reason - Optional reason for release
   */
  async releaseAfterDeadline(
    taskId: string,
    reason?: string
  ): Promise<any> {
    return this.request(`/tasks/${encodeURIComponent(taskId)}/release-after-deadline`, {
      method: 'POST',
      body: JSON.stringify({
        reason // Optional - backend auto-generates if empty
      })
    })
  }

  // ==================== CONVENIENCE METHODS ====================
  
  async applyForTask(taskId: string, coverLetter?: string) {
    return this.createApplication({ taskId, coverLetter })
  }

  async acceptApplication(applicationId: string) {
    return this.updateApplication(applicationId, { status: 'accepted' })
  }

  async rejectApplication(applicationId: string) {
    return this.updateApplication(applicationId, { status: 'rejected' })
  }
}

// default instance for app usage
export const apiClient = new ApiClient()
