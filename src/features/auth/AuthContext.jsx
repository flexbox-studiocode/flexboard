import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext({ status: 'anonymous', profile: null, error: null, refresh: async () => null, logout: async () => {} })

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', profile: null, error: null })
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.status === 401) { setState({ status: 'anonymous', profile: null, error: null }); return null }
      if (!response.ok) throw new Error(`HTTP_${response.status}`)
      const body = await response.json()
      const profile = body?.data?.user
      if (!profile?.id || !profile.role) throw new Error('INVALID_SESSION')
      const session = { ...profile, capabilities: body.data.capabilities || {} }
      setState({ status: 'authenticated', profile: session, error: null })
      return session
    } catch (error) { setState({ status: 'unavailable', profile: null, error: error instanceof Error ? error.message : 'SESSION_ERROR' }); return null }
  }, [])
  useEffect(() => { const timer = setTimeout(refresh, 0); return () => clearTimeout(timer) }, [refresh])
  const logout = useCallback(async () => {
    const response = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
    if (!response.ok) throw new Error(`HTTP_${response.status}`)
    setState({ status: 'anonymous', profile: null, error: null })
  }, [])
  const value = useMemo(() => ({ ...state, refresh, logout }), [state, refresh, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
