import { useCallback, useEffect, useRef, useState } from 'react'

export interface PollState<T> {
  data: T | null
  loading: boolean
  /** The last refresh failed (offline?) — old data stays on screen. */
  failed: boolean
  refresh: () => Promise<void>
}

/**
 * Loads data now and then every `intervalMs` while the page is visible. Old
 * data is kept while refreshing, so lists never flash empty and anything the
 * user is typing or has open is left alone.
 */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs = 10000): PollState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      if (!mounted.current) return
      setData(result)
      setFailed(false)
    } catch (error) {
      console.error('Refresh failed:', error)
      if (mounted.current) setFailed(true)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void refresh()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
    function onVisible() {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted.current = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, intervalMs])

  return { data, loading, failed, refresh }
}
