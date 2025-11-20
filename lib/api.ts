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

const api = {
  get: async (url: string) => {
    const token = getAuthToken()
    const response = await fetch(`http://localhost:3000${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    return { data: await response.json() }
  },
  
  post: async (url: string, data: any) => {
    const token = getAuthToken()
    const response = await fetch(`http://localhost:3000${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    return { data: await response.json() }
  },
  
  patch: async (url: string, data: any) => {
    const token = getAuthToken()
    const response = await fetch(`http://localhost:3000${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    })
    return { data: await response.json() }
  },
  
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`http://localhost:3000/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      return response.json()
    },
    
    register: async (userData: any) => {
      const response = await fetch(`http://localhost:3000/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      return response.json()
    },
    
    me: async (token: string) => {
      const response = await fetch(`http://localhost:3000/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      return response.json()
    }
  }
}

export default api
export { api }