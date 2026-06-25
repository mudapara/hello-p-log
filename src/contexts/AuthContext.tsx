import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient, isAuthAvailable } from '../lib/supabase'
import { getAuthRedirectUrl } from '../lib/constants'
import { recordDailyLogin, mergeLocalProfileIntoAuthUser } from '../lib/profileStore'

interface AuthContextValue {
  user: User | null
  loading: boolean
  authAvailable: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const authAvailable = isAuthAvailable()

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
      if (data.session?.user) {
        void mergeLocalProfileIntoAuthUser(data.session.user.id).catch(() => undefined)
        void recordDailyLogin(data.session.user.id).catch(() => undefined)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        void mergeLocalProfileIntoAuthUser(session.user.id).catch(() => undefined)
        void recordDailyLogin(session.user.id).catch(() => undefined)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('ログイン機能が利用できません')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getAuthRedirectUrl() },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      authAvailable,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, authAvailable, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
