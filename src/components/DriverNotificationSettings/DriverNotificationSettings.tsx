import { useState } from 'react'
import {
  getNotificationsEnabled,
  getSoundEnabled,
  setNotificationsEnabled,
  setSoundEnabled,
} from '../../lib/driverPreferences'
import './DriverNotificationSettings.css'

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="driver-notification-settings__row">
      <span className="driver-notification-settings__label">{label}</span>
      <div className="driver-notification-settings__toggle" role="group" aria-label={label}>
        <button
          type="button"
          className={`driver-notification-settings__option${value ? ' driver-notification-settings__option--active' : ''}`}
          aria-pressed={value}
          onClick={() => onChange(true)}
        >
          An
        </button>
        <button
          type="button"
          className={`driver-notification-settings__option${!value ? ' driver-notification-settings__option--active' : ''}`}
          aria-pressed={!value}
          onClick={() => onChange(false)}
        >
          Aus
        </button>
      </div>
    </div>
  )
}

function DriverNotificationSettings() {
  const [notifications, setNotifications] = useState(getNotificationsEnabled)
  const [sound, setSound] = useState(getSoundEnabled)

  function handleNotificationsChange(value: boolean) {
    setNotifications(value)
    setNotificationsEnabled(value)
  }

  function handleSoundChange(value: boolean) {
    setSound(value)
    setSoundEnabled(value)
  }

  return (
    <div className="driver-notification-settings">
      <ToggleRow
        label="Auftragsbenachrichtigungen"
        value={notifications}
        onChange={handleNotificationsChange}
      />
      <ToggleRow label="Ton" value={sound} onChange={handleSoundChange} />
    </div>
  )
}

export default DriverNotificationSettings
