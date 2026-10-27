import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { installAudioUnlock, startRepeating, stopRepeating } from '../../lib/notificationSound'
import { BellIcon } from '../icons/NavIcons'
import './NudgeAlert.css'

const SEEN_KEY = 'lasten-wien-last-nudge'

interface Nudge {
  id: string
  message: string
  created_at: string
}

function readSeen(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? new Date().toISOString()
  } catch {
    return new Date().toISOString()
  }
}

function writeSeen(value: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, value)
  } catch {
    // storage unavailable — worst case the message shows again next time
  }
}

/**
 * Full-screen alarm for a message ("Erinnerung") the admin sent to drivers.
 * Rings until the driver taps "Verstanden".
 */
function NudgeAlert() {
  const { role } = useAuth()
  const [nudge, setNudge] = useState<Nudge | null>(null)

  useEffect(() => {
    if (role !== 'dienstleister') return
    let active = true
    const removeUnlock = installAudioUnlock()

    function show(next: Nudge) {
      if (!active) return
      writeSeen(next.created_at)
      setNudge(next)
      startRepeating(3500)
      try {
        navigator.vibrate?.([300, 150, 300])
      } catch {
        // vibration unsupported
      }
    }

    async function check() {
      const { data } = await supabase
        .from('driver_nudges')
        .select('id, message, created_at')
        .gt('created_at', readSeen())
        .order('created_at', { ascending: false })
        .limit(1)
        .returns<Nudge[]>()
      if (data && data.length > 0) show(data[0])
    }

    // The first time on this device only remember "now", so old messages
    // don't ring.
    writeSeen(readSeen())
    void check()

    const channel = supabase
      .channel('driver-nudges')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_nudges' },
        (payload) => show(payload.new as Nudge),
      )
      .subscribe()

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void check()
    }, 20000)

    return () => {
      active = false
      stopRepeating()
      removeUnlock()
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [role])

  if (!nudge) return null

  function dismiss() {
    stopRepeating()
    setNudge(null)
  }

  return (
    <div className="nudge-alert" role="alertdialog" aria-modal="true">
      <div className="nudge-alert__card">
        <BellIcon className="nudge-alert__icon" />
        <h2 className="nudge-alert__title">Erinnerung</h2>
        <p className="nudge-alert__message">{nudge.message}</p>
        <button type="button" className="nudge-alert__ok" onClick={dismiss}>
          Verstanden
        </button>
      </div>
    </div>
  )
}

export default NudgeAlert
