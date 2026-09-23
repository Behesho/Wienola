import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext, type Profile } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!activeRef.current) return
      if (error) {
        console.error('Failed to load profile:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!activeRef.current) return
      setSession(data.session)
      if (data.session?.user) {
        loadProfile(data.session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!activeRef.current) return
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      activeRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        role: profile?.role ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
