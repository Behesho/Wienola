import { supabase } from './supabase'

export interface AppNotification {
  id: string
  user_id: string
  order_id: string | null
  type: string
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

export async function fetchNotifications() {
  return supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<AppNotification[]>()
}

export async function markAllNotificationsRead(userId: string) {
  return supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
}
