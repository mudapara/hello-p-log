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
import { getErrorMessage } from '../lib/errors'
import { recordDailyLogin } from '../lib/profileStore'

function formatEmailAuthError(error: unknown): string {
  const message = getErrorMessage(error, 'メールの送信に失敗しました')
  const lower = message.toLowerCase()
  if (lower.includes('rate limit') || message.includes('レート')) {
    return '送信回数の上限に達しました。しばらく待ってからもう一度お試しください。'
  }
  if (lower.includes('smtp') || lower.includes('mail') || lower.includes('send')) {
    return `メールの送信に失敗しました: ${message}`
  }
  return message
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  authAvailable: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
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
        void recordDailyLogin(data.session.user.id).catch(() => {
          // プロフィール未設定時もログイン自体は続行
        })
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        void recordDailyLogin(session.user.id).catch(() => {
          // プロフィール未設定時もログイン自体は続行
        })
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

  const signInWithEmail = useCallback(async (email: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return { error: 'ログイン機能が利用できません' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    })
    if (error) {
      console.warn('signInWithOtp failed:', error)
      return { error: formatEmailAuthError(error) }
    }
    return { error: null }
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
      signInWithEmail,
      signOut,
    }),
    [user, loading, authAvailable, signInWithGoogle, signInWithEmail, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
