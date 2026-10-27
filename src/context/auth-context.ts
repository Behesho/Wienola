import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type UserRole = 'customer' | 'dienstleister'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  is_admin: boolean
  /** New drivers wait for the admin; absent until the admin SQL ran. */
  is_approved?: boolean
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
