import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Check that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env.',
  )
}

/**
 * Shared Supabase client for the whole app — Auth, Profiles, Orders,
 * Offers, and Storage all go through this single instance.
 *
 * Uses the publishable (anon) key only. Never import the service_role
 * key into client-side code.
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
