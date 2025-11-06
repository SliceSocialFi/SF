/* Lightweight ApiClient for frontend integration with slice-api
 * - Reads base URL from import.meta.env.Discover job opportunities that match your skillsSLICE_API_URL
 * - Attaches Authorization: Bearer <JWT> if available
 * - Exposes helpers: createTask, getUser, createApplication
 * Note: prefer httpOnly cookie for token storage. This client will
 * check cookie first then localStorage as fallback (dev only).
 */

type Json = Record<string, any>
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
import { ca, tr } from "zod/v4/locales";

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
    // Use Vite-exposed env var for client builds, fallback to SLICE_API_URL
    this.baseUrl = baseUrl || (import.meta.env?.VITE_SLICE_API_URL as string) || (import.meta.env?.SLICE_API_URL as string) || ''
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as Record<string,string> || {}) }
    const token = this.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
    // Dev-time debug: print final URL and headers so CORS/misconfig issues are easier to spot in browser console
    if (import.meta.env?.DEV) {
      try {
        console.debug('[ApiClient] fetch', { url, method: opts.method || 'GET', headers, body: opts.body })
      } catch (e) {
        // ignore
      }
    }

    let res: Response
    try {
      res = await fetch(url, { ...opts, headers })
    } catch (err: any) {
      console.error('[ApiClient] Network error when fetching', { url, err })
      // Normalize network errors to an ApiError with status 0 so callers can distinguish
      throw new ApiError(0, err?.message || 'Network request failed', { url, opts })
    }
    const text = await res.text()
    let body: any = null
    try { body = text ? JSON.parse(text) : null } catch { body = text }
    if (!res.ok) throw new ApiError(res.status, body?.message || res.statusText, body)
    return body
  }

  // Tasks
  async createTask(payload: {
    title: string
    objective: string
    deliverables: string
    acceptanceCriteria: string
    rewardPoints: number
    deadline: Date
  }) {  
    try { 
      return await this.request('/tasks', { method: 'POST', body: JSON.stringify(payload) })
    } catch (err) { 
      console.error('[ApiClient] Error creating task:', err)
      throw err
    }
  }

  async listTasks(): Promise<any[]> {
    return this.request('/tasks', { method: 'GET' })
  }

  async getTask(taskId: string) {
    return this.request(`/tasks/${encodeURIComponent(taskId)}`)
  }

  // Users
  async getUser(profileId: string) {
    return this.request(`/users/${encodeURIComponent(profileId)}`)
  }

  async createUser(payload: Json) {
    return this.request(`/users`, { method: 'POST', body: JSON.stringify(payload) })
  }

  // Applications
  async createApplication(payload: { taskId: string, coverLetter?: string }) {
    return this.request(`/applications`, { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateApplication(applicationId: string, payload: Json) {
    return this.request(`/applications/${encodeURIComponent(applicationId)}`, { method: 'PATCH', body: JSON.stringify(payload) })
  }
  
  // Convenience: apply for a task (creates application)
  // Updated to accept applicantProfileId so payload matches backend application shape:
  // { taskId, applicantProfileId, coverLetter }
  async applyForTask(taskId: string, coverLetter?: string, applicantProfileId?: string) {
    // include applicantProfileId if provided
    const payload: any = { taskId }
    if (typeof applicantProfileId !== 'undefined') payload.applicantProfileId = applicantProfileId
    if (typeof coverLetter !== 'undefined') payload.coverLetter = coverLetter
    return this.createApplication(payload)
  }

  // Convenience: accept an application by id
  async acceptApplication(applicationId: string) {
    return this.updateApplication(applicationId, { status: 'accepted' })
  }
}

// default instance for app usage
export const apiClient = new ApiClient()
