import type { ReactNode } from 'react'
import { usePullToRefresh } from '../../../hooks/usePullToRefresh'
import './Admin.css'

/** Yellow box shown instead of crashing when the admin SQL isn't installed. */
export function SqlWarning({ children }: { children: ReactNode }) {
  return (
    <div className="admin-warning" role="alert">
      <strong>SQL fehlt.</strong> {children} Bitte die Datei
      <code> 20261029120000_admin_hub.sql </code> im Supabase SQL Editor ausführen.
    </div>
  )
}

interface AdminPageProps {
  title: string
  onRefresh: () => void
  /** The last refresh failed — shows the offline banner. */
  failed?: boolean
  children: ReactNode
}

/** Title row with "Aktualisieren", offline banner and pull-to-refresh. */
export function AdminPage({ title, onRefresh, failed = false, children }: AdminPageProps) {
  usePullToRefresh(onRefresh)

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{title}</h1>
        <button type="button" className="admin-page__refresh" onClick={onRefresh}>
          Aktualisieren
        </button>
      </div>

      {failed && (
        <div className="admin-offline" role="status">
          Keine Verbindung – es wird weiter versucht.
        </div>
      )}

      {children}
    </div>
  )
}

export interface ChipOption<K extends string> {
  key: K
  label: string
  count?: number
  /** Highlight (e.g. new orders). */
  alert?: boolean
}

interface ChipsProps<K extends string> {
  options: ChipOption<K>[]
  value: K
  onChange: (key: K) => void
}

export function Chips<K extends string>({ options, value, onChange }: ChipsProps<K>) {
  return (
    <div className="admin-chips" role="tablist">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          className={`admin-chip${value === option.key ? ' admin-chip--active' : ''}${option.alert && option.count ? ' admin-chip--alert' : ''}`}
          onClick={() => onChange(option.key)}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="admin-chip__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
