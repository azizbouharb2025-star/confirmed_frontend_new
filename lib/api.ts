const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const parsed = JSON.parse(authData)
      return parsed.state?.token
    }
  }
  return null
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 1000
): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)
    
    if (response.status === 429 && attempt < retries) {
      const retryAfter = response.headers.get('Retry-After')
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt)
      await sleep(delay)
      continue
    }
    
    return response
  }
  throw new Error('Max retries exceeded')
}

const api = {
  get: async (url: string) => {
    const token = getAuthToken()
    const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return { data: await response.json() }
  },
  
  post: async <T = unknown>(url: string, data: T) => {
    const token = getAuthToken()
    const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return { data: await response.json() }
  },
  
  patch: async <T = unknown>(url: string, data: T) => {
    const token = getAuthToken()
    const response = await fetchWithRetry(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return { data: await response.json() }
  },
  
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      if (!response.ok) {
        const text = await response.text()
        try {
          return JSON.parse(text)
        } catch {
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`)
        }
      }
      return response.json()
    },
    
    register: async (userData: { name: string; email: string; password: string; role?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      if (!response.ok) {
        const text = await response.text()
        try {
          return JSON.parse(text)
        } catch {
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`)
        }
      }
      return response.json()
    },
    
    me: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      if (!response.ok) {
        const text = await response.text()
        try {
          return JSON.parse(text)
        } catch {
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`)
        }
      }
      return response.json()
    }
  }
}

export default api
export { api }